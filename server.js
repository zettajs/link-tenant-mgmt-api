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

var path = require('path');
var titan = require('titan');
var AWS = require('aws-sdk');
var siren = require('argo-formatter-siren');
var RootResource = require('./resources/root');
var TenantsResource = require('./resources/tenants');
var TenantsClient = require('./clients/tenants_client');
var ServiceRegistryClient = require('./clients/service_registry_client');
var VersionClient = require('./clients/version_client');
var RouterClient = require('./clients/router_client');
var MonitorService = require('./monitor/service');

var opts = {
  host: process.env.COREOS_PRIVATE_IPV4
};

// allow a list of peers to be passed, overides COREOS_PRIVATE_IPV4
if (process.env.ETCD_PEER_HOSTS) {
  opts.host = process.env.ETCD_PEER_HOSTS.split(',');
}

var PORT = process.env.PORT || 2000;
var jwtPlaintextKeys = null;

if (!process.env.JWT_CIPHER_TEXT) {
  console.log('Starting without JWT')

  if (process.env.JWT_PLAIN_TEXT) {
    var keys = process.env.JWT_PLAIN_TEXT.split(',');
    if (keys.length !== 2) {
      throw new Error('Expecting two comma seperated keys');
    }
    jwtPlaintextKeys = { internal: keys[0], external: keys[1] };
  }
  
  startServer();
} else {
  console.log('Decrypting jwt key');

  AWS.config.update({ region: process.env.AWS_REGION });
  var kms = new AWS.KMS();
  kms.decrypt({
    CiphertextBlob: new Buffer(process.env.JWT_CIPHER_TEXT, 'hex'),
    EncryptionContext: {
      stackName: process.env.ZETTA_STACK
    }
  }, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
      return;
    }

    var keys = data.Plaintext.toString().split(',');
    if (keys.length !== 2) {
      throw new Error('Expecting two comma seperated keys.');
    }
    jwtPlaintextKeys = { internal: keys[0], external: keys[1] };
    startServer();
  });
}


function startServer() {

  // Add jwt keys to clients options
  opts.jwtPlaintextKeys = jwtPlaintextKeys;
  
  var serviceRegistryClient = new ServiceRegistryClient(opts);
  var versionClient = new VersionClient(opts);
  var routerClient = new RouterClient(opts);
  var targetMonitor = new MonitorService(serviceRegistryClient, {
    jwtPlaintextKeys: jwtPlaintextKeys,
    disabled: (process.env.DISABLE_TARGET_MONITOR) ? true : false
  });
  var tenantsClient = new TenantsClient(serviceRegistryClient, versionClient, routerClient);

  titan()
    .allow('*')
    .compress()
    .logger()
    .format({ engines: [siren], override: { 'application/json': siren } })
    .add(RootResource, tenantsClient)
    .add(TenantsResource, tenantsClient, serviceRegistryClient, versionClient, targetMonitor)
    .listen(PORT);
}
