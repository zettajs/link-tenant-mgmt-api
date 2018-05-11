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

module.exports = function(model) {
  var env = model.env;
  var entity = {
    class: ['root'],
    properties: {
      minTargetsPerTenant: 2,
      tenants: {
        total: env.tenants.total,
        unallocated: env.tenants.unallocated,
        allocated: env.tenants.allocated        
      },
      targets: {
        total: env.targets.total,
        unallocated: env.targets.unallocated,
        allocated: env.targets.allocated        
      }
    },
    links: [
      { rel: ['self'], href: env.helpers.url.current() },
      { rel: ['http://rels.zettajs.io/tenants'], href: env.helpers.url.join('/tenants') }
    ]
  };

  return entity;
};
