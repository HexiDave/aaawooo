FROM node:12 AS builder

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

COPY package.json tsconfig.json yarn.lock ./
RUN yarn install --production --pure-lockfile

COPY . ./
RUN yarn build

# production environment
FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
