FROM node as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json tsconfig.json src ./

RUN npm install

RUN npm run build

FROM node:slim

ENV NODE_ENV production
USER node

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install --omit=dev

COPY . .
COPY --from=builder /usr/src/app/build .


EXPOSE 3000
ENTRYPOINT [ "node", "index.js" ]
