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
    .del('/{id}', this.del)
    .put('/{id}/scale-up', this.scaleUp)
    .put('/{id}/scale-down', this.scaleDown);
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
  this._tenants.remove(tenantId, function(err) {
    if(err) {
      return cb(err);
    }

    cb();
  });
};

Tenants.prototype.scaleUp = function(env, next) {
  var self = this;
  var tenantId = env.route.params.id;
  env.request.getBody(function(err, body) {
    var fields = JSON.parse(body.toString());
    var size = parseInt(fields.size);
    self._tenants._targets.findAll(function(err, results) {
      self._tenants._version.get(function(err, version) {
        if(err) {
          env.response.statusCode = 500;
          return next(env);
        } 
        var currentTargets = results.filter(function(item) { return item.version == version.version; });

        var unallocated = currentTargets.filter(function(item) { return !item.tenantId; });
        if(size > unallocated.length) {
          env.response.statusCode = 400;
          return next(env);
        }

        var records = [];
        for(var i = 0; i < size; i++) {
          var target = unallocated[i];
          var newTarget = {
            url: target.url,
            tenantId: tenantId,
            created: target.created,
            version: target.version      
          }

          records.push({ newRecord: newTarget, oldRecord: target}); 
        }

        async.each(records, function(record, cb) {
          self._tenants.allocate(record.oldRecord, record.newRecord, function(err) {
            if(err) {
              return cb(err);
            }

            return cb();
          });  
        }, function(err) {
          if(err) {
            env.response.statusCode = 500;
            return next(env);
          }

          env.response.statusCode = 204;
          return next(env);
        });

      }); 
           
    });
  });
};

Tenants.prototype.scaleDown = function(env, next) {
  var self = this;
  var tenantId = env.route.params.id;
  env.request.getBody(function(err, body) {
    var fields = JSON.parse(body.toString());
    var size = parseInt(fields.size);
    
    async.parallel({
      targetsWithPeers: function(callback) {
        var peersCount = {};
        self._tenants.peers(tenantId, function(err, peers) {
          if(err) {
            return callback(err);
          }
          
          peers.forEach(function(peer) {
            if(peersCount[peer.url]) {
              peersCount[peer.url]++;
            } else {
              peersCount[peer.url] = 1;
            }
          });
          

          return callback(null, peersCount);
        });                    
      },
      allTargetsAllocated: function(callback) {
        self._tenants._targets.findAll(function(err, results) {
          if(err) {
            return callback(err);
          }
          var targets = results.filter(function(item) { return item.tenantId && item.tenantId == tenantId; }); 
          var targetUrls = targets.map(function(item) { return item.url; });
          return callback(null, targetUrls);
        });                     
      }
    },
    function(err, results) {
      if(err) {
        env.response.statusCode = 500;
        return next(env); 
      } 

      //scaling down strategy. 
      //Sort by nodes by least amount of peers attached.
      //Decomission amount of nodes.
      var targetsWithPeers = Object.keys(results.targetsWithPeers);
      var allTargetsAllocated = results.allTargetsAllocated;
      var peerCounts = [];
      allTargetsAllocated.forEach(function(targetUrl) {
        if(targetsWithPeers.indexOf(targetUrl) == -1) {
          peerCounts.push({url: targetUrl, count: 0});
        }
      });

      targetsWithPeers.forEach(function(targetUrl) {
        peerCounts.push({url: targetUrl, count: results.targetsWithPeers[targetUrl]});
      });

      var scaleDownResult = peerCounts.length - size;

      if(scaleDownResult < 2) {
        env.response.statusCode = 400;
        return next(env);
      }
      var sortedCounts = peerCounts.sort(function(a, b) {
        if(a.count > b.count) {
          return 1;
        }

        if(a.count < b.count) {
          return -1;
        }

        return 0;
      });

      var targetsToRestart = sortedCounts.splice(0, size);
      self._tenants._freeTargetsInArray(targetsToRestart, function(err) {
        if(err) {
          env.response.statusCode = 500;
          return next(env);
        }

        env.response.statusCode = 204;
        return next(env);
      }); 
    });
    
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
