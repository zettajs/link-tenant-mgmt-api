var path = require('path');

var Tenants = module.exports = function(tenantsClient) {
  this._tenants = tenantsClient;

  this.tenants = [ { name: 'default', peers: [] } ];
};

Tenants.prototype.init = function(config) {
  config
    .path('/tenants')
    .produces('application/json')
    .produces('application/vnd.siren+json')
    .consumes('application/json')
    .get('/', this.list)
    .get('/{id}', this.show)
};

Tenants.prototype.list = function(env, next) {
  this._tenants.findAll(function(err, tenants) {
    if (err) {
      env.response.statusCode = 500;
      return next(env);
    }
    
    env.format.render('tenants', { env: env, tenants: tenants });
    next(env);
  });
};

Tenants.prototype.show = function(env, next) {
  this._tenants.getTenant(env.route.params.id, function(err, tenant) {
    if (err) {
      env.response.statusCode = 500;
      return next(env);
    }

    if (!tenant) {
      env.response.statusCode = 404;
      return next(env);
    }

    env.format.render('tenant', { env: env, tenant: tenant });
    next(env);
  });
};

