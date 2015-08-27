#!/bin/sh

docker rmi zetta/link-tenant-mgmt-api
docker build -t zetta/link-tenant-mgmt-api .

