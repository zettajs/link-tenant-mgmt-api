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
    .monitor('peers')
    .type('tenant');
  
  this.id = this.tenantId;
}

Tenant.prototype.updateRouter = function(results) {
  var update = results.map(function(peer) {
    delete peer.url;
    return peer;
  });

  if (JSON.stringify(update) === JSON.stringify(this.peers)) {
    return;
  }

  this.peers = update;

  this.totalPeers = this.peers.length;
};



