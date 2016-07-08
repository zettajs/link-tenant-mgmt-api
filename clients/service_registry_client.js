var Etcd = require('node-etcd');
var url = require('url');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var http = require('http');
var jwt = require('jsonwebtoken');

var ServiceRegistry = module.exports = function(options) {
  EventEmitter.call(this);
  var self = this;
  this._etcDirectory = '/services/zetta';

  this.jwtPlaintextKeys = options.jwtPlaintextKeys;
  
  if(!options.client) {
    this._client = new Etcd(options.host);
  } else {
    this._client = options.client;
  }

  this._watcher = this._client.watcher(this._etcDirectory, null, { recursive: true, consistent: true });
  this._watcher.on('change', function() {
    self.findAll(function(err, results) {
      if(err) {
        console.log(err);
        return;
      }
      
      self.emit('change', results);  
    });
  });
};
util.inherits(ServiceRegistry, EventEmitter);

ServiceRegistry.prototype.findAll = function(cb) {
  var query = 'select type, url, created from servers';

  var self = this;
  this._client.get(this._etcDirectory, { consistent: true }, function(err, results) {
    if (err) {
      cb(err);
      return;
    }

    if(results.node.nodes) { 
      cb(null, results.node.nodes.map(self._buildServer));
    } else {
      cb(null, []);
    }
  });
};

ServiceRegistry.prototype.find = function(type, cb) {

  var self = this;
  this._client.get(this._etcDirectory, { consistent: true }, function(err, results) {
    if (err) {
      cb(err);
      return;
    }

    if(results.node.nodes) {
      var item = results.node.nodes.filter(function(item) {
        item = JSON.parse(item.value);
        return item.type === type;  
      });

      cb(null, item.map(self._buildServer));
    } else {
      cb(null, []);
    }
  });
};

ServiceRegistry.prototype.add = function(type, serverUrl, version, cb) {
  var data = { type: type, url: serverUrl, created: new Date(), version: version };

  var key = url.parse(serverUrl);
  this._client.set(this._etcDirectory + '/' + key.host, JSON.stringify(data), function(err, results) {
    if (err) {
      if (cb) {
        cb(err);
      }
      return;
    }

    if (cb) {
      cb();
    }
  });
};

ServiceRegistry.prototype.allocate = function(type, oldRecord, newRecord, cb) {
  var oldRecord = {
    type: type,
    tenantId: oldRecord.tenantId,
    url: oldRecord.url,
    publicUrl: oldRecord.publicUrl,
    created: oldRecord.created,
    version: oldRecord.version
  };

  var newRecord = {
    type: type,
    tenantId: newRecord.tenantId,
    url: newRecord.url,
    publicUrl: newRecord.publicUrl,
    created: newRecord.created,
    version: newRecord.version
  };

  var key = url.parse(oldRecord.url);
  this._client.compareAndSwap(this._etcDirectory + '/' + key.host, JSON.stringify(newRecord),
        JSON.stringify(oldRecord), function(err, results) {
          if (err) {
            if (cb) {
              cb(err);
            }
            return;
          }

          if (cb) {
            cb();
          }
        });

};

ServiceRegistry.prototype.remove = function(type, serverUrl, cb) {

  var key = url.parse(serverUrl);
  this._client.del(this._etcDirectory + '/' + key.host, function(err, results) {
    if (err) {
      if (cb) {
        cb(err);
      }
      return;
    }

    if (cb) {
      cb();
    }
  });
};

ServiceRegistry.prototype.restart = function(serverUrl, cb) {
  var parsedServerUrl = url.parse(serverUrl);

  var opts = {
    hostname: parsedServerUrl.hostname,
    port: parsedServerUrl.port,
    path: '/restart',
    method: 'DELETE'
  };

  if (this.jwtPlaintextKeys) {
    var token = { location: serverUrl }; // location needs to be publicUrl
    var cipher = jwt.sign(token, this.jwtPlaintextKeys.internal, { expiresIn: 60 });

    if (!opts.headers) {
      opts.headers = {};
    }
    
    opts.headers['x-apigee-iot-jwt'] = cipher;
  }

  var req = http.request(opts, function(response) {
    if(response.statusCode !== 204) {
      return cb(new Error('Non sucessful status code: ' + response.statusCode));
    }

    return cb();
  });

  req.on('error', function(err) {
    cb(err);
  });

  req.end();
}

ServiceRegistry.prototype._buildServer = function(data) {
  data = JSON.parse(data.value);
  return data;
};
