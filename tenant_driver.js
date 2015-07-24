var util = require('util');
var Device = require('zetta').Device;

var Tenant = module.exports = function(tenantId) {
  this.tenantId = tenantId;
  this.peers = [];
  this.totalPeers = 0;

  Device.call(this);
};
util.inherits(Tenant, Device);

Tenant.prototype.init = function(config) {
  config
    .name(this.tenantId)
    .monitor('peers')
    .type('tenant');
}

Tenant.prototype.updateRouter = function(results) {
  this.peers = results.map(function(peer) {
    delete peer.url;
    return peer;
  });

  this.totalPeers = this.peers.length;
};



