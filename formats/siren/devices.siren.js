module.exports = function(contex) {
  var env = contex.env;
  var tenant = contex.tenant;

  var entity = {
    class: ['devices'],
    properties: {
      tenantId: tenant.tenantId,
      totalDevices: tenant.devices.length
    },
    entities: [],
    links: [
      { rel: ['up'], href: env.helpers.url.join('../') },
      { rel: ['self'], href: env.helpers.url.current() }
    ]
  };


  entity.entities = tenant.devices.map(function(item) {
    var device = {
      class: ['device'],
      properties: item.properties,
      rel: ['item', 'http://rels.zettajs.io/device']
    };
    device.properties.peer = item.peer;
    return device;
  });

  return entity;
};
