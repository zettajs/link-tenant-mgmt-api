var Root = module.exports = function(tenantsClient) {
  this._tenants = tenantsClient;
};

Root.prototype.init = function(config) {
  config
    .path('/')
    .produces('application/json')
    .produces('application/vnd.siren+json')
    .consumes('application/json')
    .get('/', this.list)
};

Root.prototype.list = function(env, next) {
  this._tenants._targets.findAll(function(err, results) {
    if(err) {
      env.response.statusCode = 500;
      return next(env);
    }
    
    env.targets = {};
    env.targets.total = results.length;
    env.targets.allocated = results.filter(function(item) { return item.tenantId;  }).length;
    env.targets.unallocated = results.filter(function(item) { return !item.tenantId; }).length;
    env.format.render('root', { env: env });
    next(env);
  });
};

