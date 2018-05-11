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

var Root = module.exports = function(tenantsClient) {
  this._tenants = tenantsClient;
};

Root.prototype.init = function(config) {
  this.defaultTargetsPerTenant = 2;
  config
    .path('/')
    .produces('application/json')
    .produces('application/vnd.siren+json')
    .consumes('application/json')
    .get('/', this.list)
};

Root.prototype.list = function(env, next) {
  var self = this;
  this._tenants._targets.findAll(function(err, results) {
    if(err) {
      env.response.statusCode = 500;
      return next(env);
    }
    
    env.tenants = {};
    var allocated = results.filter(function(item) { return item.tenantId;  });
    var tenantIds = [];
    allocated.forEach(function(tenant) {
      if(tenantIds.indexOf(tenant.tenantId) == -1) {
        tenantIds.push(tenant.tenantId);
      }
    });
    var unallocated = results.filter(function(item) { return !item.tenantId; });
    env.tenants.allocated = tenantIds.length;
    env.tenants.unallocated = Math.ceil(unallocated.length / self.defaultTargetsPerTenant);
    env.tenants.total = tenantIds.length + env.tenants.unallocated;


    env.targets = {};
    env.targets.total = results.length;
    env.targets.allocated = allocated.length;
    env.targets.unallocated = unallocated.length;
    env.format.render('root', { env: env });
    next(env);
  });
};

