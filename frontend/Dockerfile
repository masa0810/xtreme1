# syntax=docker/dockerfile:1
FROM node:16 AS build
WORKDIR /build
COPY . .
ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_FACTOR=2 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=300000
RUN set -eux; \
    retry_npm_install() { \
      attempt=1; \
      while [ "$attempt" -le 5 ]; do \
        rm -rf node_modules; \
        npm cache clean --force; \
        if npm install --no-audit; then \
          return 0; \
        fi; \
        sleep "$((attempt * 5))"; \
        attempt="$((attempt + 1))"; \
      done; \
      return 1; \
    }; \
    for app in main image-tool pc-tool text-tool; do \
      cd "/build/${app}"; \
      retry_npm_install; \
      npm run build; \
    done

FROM nginx:1.22
COPY --from=build /build/dist /usr/share/nginx/html
