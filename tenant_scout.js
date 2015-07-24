var util = require('util');
var Scout = require('zetta').Scout;
var RouterClient = require('./clients/router_client');
var TargetClient = require('./clients/service_registry_client');
var TenantDriver = require('./tenant_driver');

var TargetScout = module.exports = function(options) {
  this._router = new RouterClient(options);
  this._targets = new TargetClient(options);

  Scout.call(this);
};
util.inherits(TargetScout, Scout);

TargetScout.prototype.init = function(next) {
  var self = this;

  this._targets.findAll(function(err, results) {
    if (!err) {
      self._processTargets(results);
    }
    self._targets.on('change', self._processTargets.bind(self));
  });

  next();
};

TargetScout.prototype._processTargets = function(targets) {
  var self = this;
  var tenants = {};
  var unallocated = [];
  targets.forEach(function(target) {
    if (target.tenantId) {
      if (!tenants[target.tenantId]) {
        tenants[target.tenantId] = [];
      }
      tenants[target.tenantId].push(target);
    } else {
      unallocated.push(target);
    }
  });


  Object.keys(tenants).forEach(function(tenantId) {
    var query = self.server.where({ type: 'tenant', tenantId: tenantId });
    self.server.find(query, function(err, results) {
      if (err) {
        console.error(err);
        return;
      }
      
      var tenant;
      if (results.length > 0) {
        tenant = self.provision(results[0], TenantDriver, tenantId);
      } else {
        tenant = self.discover(TenantDriver, tenantId);
      }
  
      if (tenant) {
        self._router.findAll(tenantId, function(err, results) {
          tenant.updateRouter(results);
          self._router.on('change', function(results) {
            tenant.updateRouter(results.filter(function(peer) { return peer.tenantId === tenantId}));
          });
        });
      }
    });
  });
};


