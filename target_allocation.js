// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var TargetAllocation = module.exports = function(serviceRegistryClient, versionClient, targetMonitor) {
  var self = this;
  
  this.maxTargets = Number(process.env.TARGETS_PER_TENANT) || 2; // max number of targets allocated per tenant
  this.serverIndexes = {};  // { <tenantId>: Int }
  this.pending = {}; // <tenantId> : [cb]

  this._versionClient = versionClient;
  this._serviceRegistryClient = serviceRegistryClient;
  this._targetMonitor = targetMonitor;
  

  this._currentVersion = null;
  this._servers = {}; // <tenantId>: [{ etcd server obj }]


  this._versionClient.on('change', function(versionObject) {
    self._currentVersion = versionObject.version;
  });

  this._versionClient.get(function(err, versionObject) {
    if(err) {
      return;
    }  

    self._currentVersion = versionObject.version;
  });


  this._serviceRegistryClient.on('change', function(results) {
    self._processServerList(results);
  });

  this._loadServers();
};

// lookup target for tenantid, try to allocate if none are available
TargetAllocation.prototype.lookup = function(tenantId, callback) {
  var self = this;
  // only allow 1 pending lookup/allocation req per tenantId
  if (!this.pending.hasOwnProperty(tenantId)) {
    this.pending[tenantId] = [callback];
    this._lookup(tenantId, this.maxTargets, function(err, target) {
      self.pending[tenantId].forEach(function(cb) {
        // make sure cb is called in the next event loop, so self.pending[tenantId] is removed
        setImmediate(function() {
          cb(err, target);;
        });
      });
      delete self.pending[tenantId];
    });
  } else {
    this.pending[tenantId].push(callback)
  }
};

TargetAllocation.prototype._lookup = function(tenantId, maxTargets, callback) {
  var self = this;
  var servers = self.targets(tenantId);
  
  if (!this.serverIndexes.hasOwnProperty(tenantId)) {
    this.serverIndexes[tenantId] = 0;
  }

  if (servers.length < maxTargets) {
    this.allocate(tenantId, function(err) {
      if (err) {
        // handle case where faild to allocate any more targets, but we have at least one allocated
        if (servers.length > 0) {
          return self._lookup(tenantId, servers.length, callback);
        } else {
          return callback(err);
        }
      }
      return self._lookup(tenantId, maxTargets, callback);
    });
    return;
  } else {
    var server = servers[this.serverIndexes[tenantId]++ % servers.length];
    return callback(null, server.publicUrl);
  }
};

TargetAllocation.prototype.allocate = function(tenantId, callback) {
  var self = this;
  // query service reg for all targets
  this._serviceRegistryClient.findAll(function(err, results) {
    if (err) {
      return callback(err);
    }

    if (!results) {
      return callback(new Error('No available target servers for tenant `' + tenantId + '`.'));
    }

    var allocated = results.filter(function(server) {
      if (server.tenantId === tenantId && server.version === self._currentVersion) {
        // filter by online targets
        return self._targetMonitor.status(server.url);
      }
    });
    
    if (allocated.length >= self.maxTargets) {
      // _severs isn't up to date, force update ._servers
      self._processServerList(results);
      return callback();
    }
    
    var unallocated = results.filter(function(server) {
      return !server.tenantId  && server.version === self._currentVersion
    });
    
    var target = unallocated.shift();
    if (!target) {
      return callback(new Error('No available target servers for tenant `' + tenantId + '`.'));
    }
    
    var newRecord = {
      url: target.url,
      publicUrl: target.publicUrl,
      tenantId: tenantId,
      created: target.created,
      version: target.version
    };
    
    self._serviceRegistryClient.allocate('cloud-target', target, newRecord, function(err) {
      if (err) {
        return callback(err);
      };

      if (!self._servers[tenantId]) {
        self._servers[tenantId] = [];
      }

      self._servers[tenantId].push(newRecord);
      return callback();
    });
  });
};


TargetAllocation.prototype._processServerList = function(servers) {
  var tempServers = {}; 
  servers.forEach(function(server) {
    if (!server.tenantId) {
      return;
    }

    if (!tempServers.hasOwnProperty(server.tenantId)) {
      tempServers[server.tenantId] = [];
    }
    tempServers[server.tenantId].push(server);
  });

  this._servers = tempServers;
};

TargetAllocation.prototype._loadServers = function(cb) {
  var self = this;
  this._serviceRegistryClient.find('cloud-target', function(err, results) {
    if (err) {
      if (cb) {
        cb(err);
      }
      return;
    }

    if (!results) {
      if (cb) {
        cb();
      }
      return;
    }

    self._processServerList(results);

    if (cb) {
      cb();
    }
  });
};

// Return all targets for a tenantId with the current version
TargetAllocation.prototype.targets = function(tenantId) {
  var self = this;

  if (!this._servers.hasOwnProperty(tenantId)) {
    return [];
  }

  return this._servers[tenantId].filter(function(server) {
    return server.version === self._currentVersion && self._targetMonitor.status(server.url);
  });
};

