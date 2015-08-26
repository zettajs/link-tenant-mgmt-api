var path = require('path');

module.exports = function(model) {
  var env = model.env;
  var entity = {
    class: ['tenants'],
    entities: [],
    links: [
      { rel: ['self'], href: env.helpers.url.current() }
    ]
  };

  entity.entities = model.tenants.map(function(item) {
    var tenant = {
      class: ['tenant'],
      properties: {
        tenantId: item.tenantId,
        totalPeers: 0
      },
      links: [
        { rel: ['self'], href: env.helpers.url.join(item.tenantId) }
      ]
    };

    return tenant;
  });

  return entity;
};
