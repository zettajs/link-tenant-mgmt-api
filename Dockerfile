FROM node:0.12-slim

MAINTAINER Adam Magaluk <AMagaluk@apigee.com>

ADD     . /link-tenant-mgmt-api
WORKDIR /link-tenant-mgmt-api
RUN     npm install --production

ENV    PORT 2000
EXPOSE 2000

CMD        ["server.js"]
ENTRYPOINT ["node"]
