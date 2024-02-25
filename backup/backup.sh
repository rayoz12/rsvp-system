#!/bin/bash

if [ -z ${keyID+x} ]; then echo "keyID is unset" && exit -1; fi
if [ -z ${applicationKey+x} ]; then echo "applicationKey is unset" && exit -1; fi

xz -fkve9 /home/ryan/docker/data/dev/rsvp-system/rsvp.sqlite.db
FILE_TO_UPLOAD="/home/ryan/docker/data/dev/rsvp-system/rsvp.sqlite.db.xz"

response=$(curl -u $keyID:$applicationKey https://api.backblazeb2.com/b2api/v3/b2_authorize_account)
echo $response

ACCOUNT_AUTH_TOKEN=$(echo $response | jq -r '.authorizationToken') # Comes from the b2_authorize_account call
# BUCKET_ID=rsvp-backup # ID for the bucket to upload to
API_URL=$(echo $response | jq -r '.apiInfo.storageApi.apiUrl') # Comes from the b2_authorize_account call

# Save to date var
printf -v date '%(%Y-%m-%d-%s)T' -1

echo $API_URL

response=$(curl -H "Authorization: $ACCOUNT_AUTH_TOKEN" -d "{\"bucketId\": \"$BUCKET_ID\"}" "$API_URL/b2api/v3/b2_get_upload_url")

echo $response

MIME_TYPE=application/octet-stream # Mime type of the file. X-auto can also be leveraged.
# MIME_TYPE=application/vnd.sqlite3 # Mime type of the file. X-auto can also be leveraged.
SHA1_OF_FILE=$(openssl dgst -sha1 $FILE_TO_UPLOAD | awk '{print $2;}') # SHA1 of the file
UPLOAD_URL=$(echo $response | jq -r '.uploadUrl') # From the b2_get_upload_url call
UPLOAD_AUTHORIZATION_TOKEN=$(echo $response | jq -r '.authorizationToken') # From the b2_get_upload_url call

base=$(basename $FILE_TO_UPLOAD)
name="$base-$date"

echo $UPLOAD_URL
echo $MIME_TYPE
echo $SHA1_OF_FILE
echo $UPLOAD_URL

curl \
    -H "Authorization: $UPLOAD_AUTHORIZATION_TOKEN" \
    -H "X-Bz-File-Name: $name" \
    -H "Content-Type: $MIME_TYPE" \
    -H "X-Bz-Content-Sha1: $SHA1_OF_FILE" \
    -H "X-Bz-Info-Author: unknown" \
    --data-binary "@$FILE_TO_UPLOAD" \
    $UPLOAD_URL

