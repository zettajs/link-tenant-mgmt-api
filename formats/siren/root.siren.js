var path = require('path');

module.exports = function(model) {
  var env = model.env;
  var entity = {
    class: ['root'],
    links: [
      { rel: ['self'], href: env.helpers.url.current() },
      { rel: ['http://rels.zettajs.io/tenants'], href: env.helpers.url.join('/tenants') }
    ]
  };

  return entity;
};
