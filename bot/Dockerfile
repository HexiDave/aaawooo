#
# Builder stage.
# This state compile our TypeScript to get the JavaScript code
#
FROM node:12 AS builder

WORKDIR /usr/src/common
COPY ./common .

WORKDIR /usr/src/app

COPY ./bot/package*.json ./bot/tsconfig*.json ./bot/yarn.lock ./
COPY ./bot/src ./src
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

COPY ./bot/package*.json ./bot/yarn.lock ./
RUN yarn install --production --pure-lockfile
RUN yarn global add pm2

## We just need the build to execute the command
COPY --from=builder /usr/src/app/build ./bot/build
COPY --from=builder /usr/src/common ./common
COPY ./bot/audio ./bot/audio

USER node

EXPOSE ${PORT}

CMD ["pm2-runtime", "./bot/build/boot.js"]
