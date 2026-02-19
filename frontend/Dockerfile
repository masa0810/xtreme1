# syntax=docker/dockerfile:1
FROM node:16 as build
WORKDIR /build
COPY . .
ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_FACTOR=2 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=300000
RUN --mount=type=cache,target=main/node_modules \
    cd main && npm install && npm run build
RUN --mount=type=cache,target=image-tool/node_modules \
    cd image-tool && npm install && npm run build
RUN --mount=type=cache,target=pc-tool/node_modules \
    cd pc-tool && npm install && npm run build
RUN --mount=type=cache,target=text-tool/node_modules \
    cd text-tool && npm install && npm run build

FROM nginx:1.22
COPY --from=build /build/dist /usr/share/nginx/html
