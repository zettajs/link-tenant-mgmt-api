var path = require('path');
var titan = require('titan');
var siren = require('argo-formatter-siren');
var TenantsResource = require('./resources/tenants');
var TenantClient = require('./clients/tenants_client');

var opts = {
  host: process.env.COREOS_PRIVATE_IPV4
};

// allow a list of peers to be passed, overides COREOS_PRIVATE_IPV4
if (process.env.ETCD_PEER_HOSTS) {
  opts.host = process.env.ETCD_PEER_HOSTS.split(',');
}

var tenantClient = new TenantClient(opts);

titan()
  .allow('*')
  .compress()
  .logger()
  .format({ engines: [siren], override: { 'application/json': siren } })
  .add(TenantsResource, tenantClient)
  .listen(2000);
