var RouterClient = require('./router_client');
var TargetClient = require('./service_registry_client');

var Tenants = module.exports = function(opts) {
  this._router = new RouterClient(opts);
  this._targets = new TargetClient(opts);
  
  this._cacheTenants = null; // { <tenantId>: { peers: [] } }
  
  var self = this;
  function updateTenantCache(results) {
    self._processTenantsList(results, function(err, tenants) {
      if (err) {
        console.error(err);
        return;
      }

      // update cache
      self._cache = tenants;
    });
  };

  this._targets.on('change', function(results) {
    updateTenantCache(results);
  });
  this.findAll(function(err, results) {
    if (err) {
      return;
    }
    updateTenantCache(results);
  });
};

Tenants.prototype.findAll = function(skipCache, cb) {
  if (typeof skipCache === 'function') {
    cb = skipCache;
    skipCache = false;
  }

  console.log(this._cache)
  if (this._cacheTenants !== null) {
    console.log('using cache')
    setImmediate(function() {
      cb(null, this._cacheTenants);
    });
    return;
  }
  
  var self = this;
  this._targets.findAll(function(err, results) {
    if (err) {
      return cb(err);
    }

    self._processTenantsList(results, function(err, tenants) {
      if (err) {
        return cb(err);
      }
      
      var allTenants = [];
      Object.keys(tenants).forEach(function(tenantId) {
        allTenants.push(tenants[tenantId]);
      });

      return cb(null, allTenants);
    });
  });
};

Tenants.prototype._processTenantsList = function(results, cb) {
  var tenants = [];
  results.forEach(function(target) {
    if (target.tenantId) {
      if (!tenants[target.tenantId]) {
        tenants[target.tenantId] = { tenantId: target.tenantId, peers: [] };
      }
    }
  });
  
  return cb(null, tenants);
};

Tenants.prototype.getTenant = function(tenantId, cb) {
  this.findAll(function(err, tenants) {
    if (err) {
      return cb(err);
    }

    var found = tenants.some(function(tenant) {
      if (tenant.tenantId === tenantId) {
        
        cb(null, tenant);
        return true;
      }
    });

    return cb();
  });
};

Tenants.prototype.getTenantPeers = function(tenantId, cb) {
  
};
