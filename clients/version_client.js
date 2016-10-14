var Etcd = require('node-etcd');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var VersionClient = module.exports = function(options) {
  EventEmitter.call(this);
  var self = this;
  this._etcdDirectory = '/zetta/version';
  
  if(!options.client) {
    this._client = new Etcd(options.host);
  } else {
    this._client = options.client;
  }
}
util.inherits(VersionClient, EventEmitter);

VersionClient.prototype.get = function(cb) {
  this._client.get(this._etcdDirectory, { consistent: true }, function(err, results) {
    if(err) {
      cb(err);
      return;
    }
    
    var versionObject = null;
    try {
      versionObject = JSON.parse(results.node.value);
    } catch(err) {
      return cb(err);
    }
    cb(null, versionObject); 
  }); 
};


