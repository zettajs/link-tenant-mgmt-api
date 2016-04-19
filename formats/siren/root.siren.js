var path = require('path');

module.exports = function(model) {
  var env = model.env;
  var entity = {
    class: ['root'],
    properties: {
      targetsPerTenant: 2,
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
