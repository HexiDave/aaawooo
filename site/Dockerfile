FROM node:12 AS builder

WORKDIR /common
COPY ./common .

WORKDIR /app
ARG WS_ADDRESS

ENV REACT_APP_WS_ADDRESS=${WS_ADDRESS}
ENV NODE_ENV=production
ENV PATH /app/node_modules/.bin:$PATH

COPY ./site/package.json ./site/tsconfig.json ./site/yarn.lock ./
RUN yarn install --production --pure-lockfile

COPY ./site/ ./
RUN yarn build

# production environment
FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
