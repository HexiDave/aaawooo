#
# Builder stage.
# This state compile our TypeScript to get the JavaScript code
#
FROM node:12 AS builder

WORKDIR /usr/src/app

COPY package*.json tsconfig*.json yarn.lock ./
COPY ./src ./src
RUN yarn install --production --pure-lockfile
RUN yarn build

#
# Production stage.
# This state compile get back the JavaScript code from builder stage
# It will also install the production package only
#
FROM node:12-alpine

ARG PORT

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json yarn.lock ./
RUN yarn install --production --pure-lockfile
RUN yarn global add pm2

## We just need the build to execute the command
COPY --from=builder /usr/src/app/build ./build
COPY ./audio ./audio

USER node

EXPOSE ${PORT}

CMD ["pm2-runtime", "./build/server.js"]
