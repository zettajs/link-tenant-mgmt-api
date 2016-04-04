var path = require('path');
var cache = require('memory-cache');
var async = require('async');

var Tenants = module.exports = function(tenantsClient) {
  this._tenants = tenantsClient;
  this.peersCacheTimeout = 10000;
};

Tenants.prototype.init = function(config) {
  config
    .path('/tenants')
    .produces('application/json')
    .produces('application/vnd.siren+json')
    .consumes('application/json')
    .get('/', this.list)
    .get('/{id}', this.show)
    .del('/{id}', this.del);
};

Tenants.prototype.list = function(env, next) {
  this._tenants.findAll(function(err, tenants) {
    if (err) {
      env.response.statusCode = 500;
      return next(env);
    }
    
    env.format.render('tenants', { env: env, tenants: tenants });
    next(env);
  });
};

Tenants.prototype.show = function(env, next) {
  var self = this;
  var tenantId = env.route.params.id;
  this._tenants.get(tenantId, function(err, tenant) {
    if (err) {
      env.response.statusCode = 500;
      return next(env);
    }

    if (!tenant) {
      env.response.statusCode = 404;
      return next(env);
    }

    self._peersWithCache(tenantId, function(err, peers) {
      if (err) {
        env.response.statusCode = 501;
        return next(env);
      }
      
      tenant.peers = peers;
      env.format.render('tenant', { env: env, tenant: tenant });
      next(env);
    });
  });
};

Tenants.prototype._peersWithCache = function(tenantId, cb) {
  var self = this;
  var key = 'peers/' + tenantId;
  var peers = cache.get(key);
  if (peers === null) {
    this._tenants.peers(tenantId, function(err, peers) {
      if (err) {
        return cb(err);
      }
      cache.put(key, peers, self.peersCacheTimeout);
      cb(null, peers);
    });
  } else {
    setImmediate(function() {
      cb(null, peers);
    });
  }
};

Tenants.prototype._evictTenant = function(tenantId, cb) {
  var key = 'peers/' + tenantId;
  cache.del(key);
    
};

Tenants.prototype._evictTenant = function(tenantId, cb) {
  var key = 'peers/' + tenantId;
  cache.del(key);
  this._tenants.remove(tenantId, function(err) {
    if(err) {
      return cb(err);
    }

    cb();
  });
};

Tenants.prototype.del = function(env, next) {
  var self = this;
  var tenantId = env.route.params.id;
  this._tenants.get(tenantId, function(err, tenant) {
    if (err) {
      env.response.statusCode = 500;
      return next(env);
    }

    if (!tenant) {
      env.response.statusCode = 404;
      return next(env);
    }

    self._peersWithCache(tenantId, function(err, peers) {
      if(err) {
        env.response.statusCode = 500;
        return next(env);
      }      
      
      if(peers.length > 0) {
        env.response.statusCode = 500;
        return next(env);
      } else {
        self._evictTenant(tenantId, function(err) {
          if(err) {
            env.response.statusCode = 500;
            return next(env);
          } else {
            env.response.statusCode = 204;
            return next(env); 
          }
        });
      }
      next(env);
    });
  });

}
