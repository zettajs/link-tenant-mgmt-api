var http = require('http');
var async = require('async');

var Tenants = module.exports = function(serviceRegistryClient, versionClient, routerClient) {
  this._router = routerClient;
  this._targets = serviceRegistryClient;
  this._version = versionClient;

  this.parallelLimit = 10;
};

Tenants.prototype.findAll = function(cb) {
  var self = this;
  this._targets.findAll(function(err, results) {
    if (err) {
      return cb(err);
    }

    self._processTenantsList(results, function(err, tenants) {
      if (err) {
        return cb(err);
      }
      return cb(null, tenants);
    });
  });
};

Tenants.prototype.get = function(tenantId, cb) {
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

    // not found, return with tenant as undefined
    if (!found) {
      return cb();
    }
  });
};

Tenants.prototype.peers = function(tenantId, cb) {
  this._router.findAll(tenantId, cb);
};

Tenants.prototype.devices = function(tenantId, cb) {
  var self = this;
  /*
    [
    { id: 'uuid', peer: 'serverid', properties: {} },
    ...
    ]
   */
  
  this.peers(tenantId, function(err, peers) {
    if (err) {
      return cb(err);
    }

    var allDevices = [];
    async.eachLimit(peers, self.parallelLimit, function getDevices(peer, next) {
      self._getPeersDevices(peer, function(err, devices) {
        if (err) {
          return next(null);
        }
        allDevices = allDevices.concat(devices);
        next();
      });
    }, function(err) {
      if (err) {
        return cb(err);
      }
      return cb(null, allDevices);
    });
  });
};


Tenants.prototype._getPeersDevices = function(peer, cb) {
  var peerUrl = peer.url + '/servers/' + peer.name;
  var req = http.get(peerUrl, function(res) {
    if (res.statusCode !== 200) {
      return cb(new Error('Failed to get devices'));
    }
    var body = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function() {
      try {
        var json = JSON.parse(body);
      } catch(err) {
        return cb(err);
      }
      
      var devices = json.entities.filter(function(entry) {
        return entry.class.indexOf('device') >= 0;
      }).map(function(device) {
        return { peer: peer.name, id: device.properties.id, properties: device.properties };
      });
      
      return cb(null, devices);
    })
  });
  
  req.on('error', cb);
  req.setTimeout(10000, function() {
    req.abort();
  });
};

Tenants.prototype._processTenantsList = function(results, cb) {
  var tenants = [];
  results.forEach(function(target) {
    if (target.tenantId) {
      if (!tenants[target.tenantId]) {
        tenants[target.tenantId] = { tenantId: target.tenantId };
      }
    }
  });

  var allTenants = [];
  Object.keys(tenants).forEach(function(tenantId) {
    allTenants.push(tenants[tenantId]);
  });

  return cb(null, allTenants);
};

Tenants.prototype.remove = function(tenantId, cb) {
  var self = this;
  async.parallel({
    router: function(cb) {
      self._freeTenantDirectory(tenantId, function(err) {
        if(err) {
          return cb(err);
        }

        cb();
      })        
    },
    targets: function(cb) {
      self._freeTargets(tenantId, function(err) {
        if(err) {
          return cb(err);
        } 

        cb();
      });  
    }
  }, function(err, results) {
    if(err) {
      return cb(err);
    }  
  }); 
};

Tenants.prototype._freeTenantDirectory = function(tenantId, cb) {
  var self = this;

  self._router.removeTenantDirectory(tenantId, function(err) {
    if(err) {
      return cb(err);
    }
      
    cb();

  });
    
}

Tenants.prototype._freeTargets = function(tenantId, cb) {
  var self = this;
  self._targets.findAll(function(err, results) {
    if(err) {
      return cb(err);
    }

    var targets = results.filter(function(item) { return item.tenantId && item.tenantId == tenantId; });
    self._freeTargetsInArray(targets, function(err) {
      if(err) {
        return cb(err);
      }

      return cb();
    });
    
  });
};

Tenants.prototype._freeTargetsInArray = function(targets, cb) {
  var self = this;
  async.map(targets, function(target, cb) {

    self._targets.restart(target.url, function(err) {
      if(err) {
        return cb(err);
      }

      return cb();
    });
  }, function(err, results) {
    if(err) {
      return cb(err);
    }

    return cb();
  });
}

Tenants.prototype.allocate = function(oldRecord, newRecord, cb) {
  var self = this;
  self._targets.allocate('cloud-target', oldRecord, newRecord, function(err) {
    if(err) {
      return cb(err);
    }

    return cb();
  });
};
