## Launch dexie backend server with DB

docker-compose -f ./docker-compose-backend.yml build

docker-compose -f ./docker-compose-backend.yml up

## Launch PWA

Build application

`npm run build`

Serve it

`cd dist/dexie-sync-frontend && angular-http-server -p 8081`

Tunnel local ports

`lt --port 8081 --subdomain dexie`

`lt --port 8080 --subdomain dexieback`
