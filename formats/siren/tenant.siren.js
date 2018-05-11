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

module.exports = function(contex) {
  var env = contex.env;
  var tenant = contex.tenant;

  var entity = {
    class: ['tenant'],
    properties: {
      tenantId: tenant.tenantId,
      totalPeers: tenant.peers.length,
      targets: tenant.targets,
      tenants: []
    },
    actions: [
      {
        name: 'evict-tenant',
        method: 'DELETE',
        href: env.helpers.url.current()
      },
      {
        name: 'scale',
        method: 'PUT',
        href: env.helpers.url.join('scale'),
        type: 'application/x-www-form-urlencoded',
        fields: [ 
          {'name': 'size', 'type': 'number'}  
        ]
      },
      {
        name: 'target',
        method: 'POST',
        href: env.helpers.url.join('target')
      }
    ],
    links: [
      { rel: ['collection'], href: env.helpers.url.path('/tenants') },
      { rel: ['self'], href: env.helpers.url.current() }
    ]
  };

  entity.properties.peers = tenant.peers.map(function(item) {
    var peer = {
      name: item.name,
      tenantId: item.tenantId,
      created: item.created
    };

    return peer;
  });

  return entity;
};
