# Build
FROM node:14.17.0-alpine3.13 AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build:prod

# Run
FROM nginx:1.21.0
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

# Copie du build dans /usr/share/nginx/html.
COPY --from=builder /app/dist/test-offix-datastore .
# Copie de la configuration nginx.
COPY ./distribution/. /

# Sélectionne la configuration en fonction de la variable d'environnement "ENVIRONNEMENT" (valeurs: staging, integration ou production).
# Un lien symbolique est créé pour faire pointer la configuration vers celle correspondant à l'environnement.
# Puis lance nginx en mode daemon.
CMD \
  if [ ! -z "${ENVIRONNEMENT}" ]; then \
    ln -nfs /usr/share/nginx/html/assets/configurations/config.${ENVIRONNEMENT}.json /usr/share/nginx/html/assets/configurations/config.json ; \
  fi \
  && nginx -g "daemon off;"
