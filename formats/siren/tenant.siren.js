module.exports = function(contex) {
  var env = contex.env;
  var tenant = contex.tenant;

  var entity = {
    class: ['tenant'],
    properties: {
      tenantId: tenant.tenantId,
      totalPeers: tenant.peers.length,
      tenants: []
    },
    actions: [
      {
        name: 'evict-tenant',
        method: 'DELETE',
        href: env.helpers.url.current(),
        type: 'application/x-www-form-urlencoded'
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
