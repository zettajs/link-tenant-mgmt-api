module.exports = function(model) {
  var env = model.env;
  var entity = {
    class: ['target'],
    properties: {
      serverUrl: model.serverUrl,
      tenantId: model.tenantId
    },
    links: [
      { rel: ['self'], href: env.helpers.url.current() },
      { rel: ['http://rels.zettajs.io/tenants'], href: env.helpers.url.path('/tenants/' + model.tenantId) }
    ]
  };

  return entity;
};
