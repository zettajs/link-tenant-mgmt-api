module.exports = function(contex) {
  var env = contex.env;
  var tenant = contex.tenant;

  var entity = {
    class: ['tenant'],
    properties: {
      tenantId: tenant.tenantId,
      totalPeers: tenant.peers.length,
      totalDevices: tenant.devices.length
    },
    entities: [],
    links: [
      { rel: ['collection'], href: env.helpers.url.path('/tenants') },
      { rel: ['http://rels.zettajs.io/devices'], href: env.helpers.url.join('/devices') },
      { rel: ['self'], href: env.helpers.url.current() }
    ]
  };

  entity.entities = tenant.peers.map(function(item) {
    var peer = {
      class: ['peer'],
      properties: {
        name: item.name,
        tenantId: item.tenantId,
        created: item.created
      },
      rel: ['http://rels.zettajs.io/peer']
    };

    return peer;
  });

  return entity;
};
