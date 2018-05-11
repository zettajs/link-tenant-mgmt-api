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
var siren = require('argo-formatter-siren');
var RootResource = require('./resources/root');
var TenantsResource = require('./resources/tenants');
var TenantsClient = require('./clients/tenants_client');

var opts = {
  host: process.env.COREOS_PRIVATE_IPV4
};

// allow a list of peers to be passed, overides COREOS_PRIVATE_IPV4
if (process.env.ETCD_PEER_HOSTS) {
  opts.host = process.env.ETCD_PEER_HOSTS.split(',');
}

var tenantClient = new TenantsClient(opts);
var PORT = process.env.PORT || 2000;

titan()
  .allow('*')
  .compress()
  .logger()
  .format({ engines: [siren], override: { 'application/json': siren } })
  .add(RootResource, tenantClient)
  .add(TenantsResource, tenantClient)
  .listen(PORT);
