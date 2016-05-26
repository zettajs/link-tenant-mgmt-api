var path = require('path');
var titan = require('titan');
var siren = require('argo-formatter-siren');
var RootResource = require('./resources/root');
var TenantsResource = require('./resources/tenants');
var TenantsClient = require('./clients/tenants_client');
var ServiceRegistryClient = require('./clients/service_registry_client');
var VersionClient = require('./clients/version_client');
var RouterClient = require('./clients/router_client');
var MonitorService = require('./monitor/service');

var opts = {
  host: process.env.COREOS_PRIVATE_IPV4
};

// allow a list of peers to be passed, overides COREOS_PRIVATE_IPV4
if (process.env.ETCD_PEER_HOSTS) {
  opts.host = process.env.ETCD_PEER_HOSTS.split(',');
}

var serviceRegistryClient = new ServiceRegistryClient(opts);
var versionClient = new VersionClient(opts);
var routerClient = new RouterClient(opts);
var targetMonitor = new MonitorService(serviceRegistryClient, { 
  disabled: (process.env.DISABLE_TARGET_MONITOR) ? true : false
});
var tenantsClient = new TenantsClient(serviceRegistryClient, versionClient, routerClient);

var PORT = process.env.PORT || 2000;

titan()
  .allow('*')
  .compress()
  .logger()
  .format({ engines: [siren], override: { 'application/json': siren } })
  .add(RootResource, tenantsClient)
  .add(TenantsResource, tenantsClient, serviceRegistryClient, versionClient, targetMonitor)
  .listen(PORT);
