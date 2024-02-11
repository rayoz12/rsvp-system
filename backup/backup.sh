#!/bin/bash

FILE_TO_UPLOAD="/home/ryan/docker/data/dev/rsvp-system/rsvp.sqlite.db"

response=$(curl -u $keyID:$applicationKey https://api.backblazeb2.com/b2api/v3/b2_authorize_account)

# {
#   "accountId": "1e9c00bc1a31",
#   "apiInfo": {
#     "storageApi": {
#       "absoluteMinimumPartSize": 5000000,
#       "apiUrl": "https://api004.backblazeb2.com",
#       "bucketId": "71deb9ec50e09b7c81da0311",
#       "bucketName": "rsvp-backup",
#       "capabilities": [
#         "deleteFiles",
#         "readBucketEncryption",
#         "readBucketReplications",
#         "writeBucketEncryption",
#         "writeBucketReplications",
#         "readBuckets",
#         "listBuckets",
#         "shareFiles",
#         "readFiles",
#         "listFiles",
#         "writeFiles"
#       ],
#       "downloadUrl": "https://f004.backblazeb2.com",
#       "infoType": "storageApi",
#       "namePrefix": null,
#       "recommendedPartSize": 100000000,
#       "s3ApiUrl": "https://s3.us-west-004.backblazeb2.com"
#     }
#   },
#   "applicationKeyExpirationTimestamp": null,
#   "authorizationToken": "..."
# }

ACCOUNT_AUTH_TOKEN=$(echo $response | jq -r '.authorizationToken') # Comes from the b2_authorize_account call
BUCKET_ID=rsvp-backup # ID for the bucket to upload to
API_URL=$(echo $response | jq -r '.apiInfo.apiUrl') # Comes from the b2_authorize_account call

# Save to date var
printf -v date '%(%Y-%m-%d-%s)T\n' -1

response=$(curl -H "Authorization: $ACCOUNT_AUTH_TOKEN" -d "{\"bucketId\": \"$BUCKET_ID\"}" "$API_URL/b2api/v3/b2_get_upload_url")

MIME_TYPE=b2/x-auto # Mime type of the file. X-auto can also be leveraged.
SHA1_OF_FILE=$(openssl dgst -sha1 $FILE_TO_UPLOAD | awk '{print $2;}') # SHA1 of the file
UPLOAD_URL=$(echo $response | jq -r '.uploadUrl') # From the b2_get_upload_url call
UPLOAD_AUTHORIZATION_TOKEN=$(echo $response | jq -r '.authorizationToken') # From the b2_get_upload_url call

base=$(basename $FILE_TO_UPLOAD)
name="$base-$date"

curl \
    -H "Authorization: $UPLOAD_AUTHORIZATION_TOKEN" \
    -H "X-Bz-File-Name: $name" \
    -H "Content-Type: $MIME_TYPE" \
    -H "X-Bz-Content-Sha1: $SHA1_OF_FILE" \
    -H "X-Bz-Info-Author: unknown" \
    --data-binary "@$FILE_TO_UPLOAD" \
    $UPLOAD_URL

