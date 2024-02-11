FROM node as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json tsconfig.json src ./

RUN npm ci

RUN npm run build

## Second Stage
FROM node:slim

ENV NODE_ENV production

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm ci --omit=dev

# COPY db ./
# COPY drizzle ./
# COPY static ./
COPY . .
COPY --from=builder /usr/src/app/build .

USER node

EXPOSE 3000
ENTRYPOINT [ "node", "index.js" ]
