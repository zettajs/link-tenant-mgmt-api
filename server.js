var zetta = require('zetta');
var TenantScout = require('./tenant_scout');

var PORT = process.env.PORT || 0;

var options = {
  host: process.env.COREOS_PRIVATE_IPV4
};

// allow a list of peers to be passed, overides COREOS_PRIVATE_IPV4
if (process.env.ETCD_PEER_HOSTS) {
  options.host = process.env.ETCD_PEER_HOSTS.split(',');
}

zetta()
  .name('tenant-management')
  .use(TenantScout, options)
  .listen(PORT);
