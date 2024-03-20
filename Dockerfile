FROM alpine:3 as base

RUN apk add --no-cache ffmpeg bento4 nodejs npm

FROM base as build
WORKDIR /tmp/build

COPY ./tsconfig*.json ./
COPY ./package*.json ./
RUN npm ci

COPY ./src ./src
RUN npm run build

FROM base as app
WORKDIR /usr/app

COPY --from=build /tmp/build/package*.json ./
RUN npm ci && \
  npm prune --production

COPY --from=build /tmp/build/dist ./

EXPOSE 3000
CMD ["node", "main.js"]