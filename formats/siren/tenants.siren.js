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
      rel: ['item'],
      properties: {
        tenantId: item.tenantId
      },
      links: [
        { rel: ['self'], href: env.helpers.url.join(item.tenantId) }
      ]
    };

    return tenant;
  });

  return entity;
};
