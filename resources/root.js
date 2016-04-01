var Root = module.exports = function(tenantsClient) {
  this._tenants = tenantsClient;
};

Root.prototype.init = function(config) {
  this.defaultTargetsPerTenant = 2;
  config
    .path('/')
    .produces('application/json')
    .produces('application/vnd.siren+json')
    .consumes('application/json')
    .get('/', this.list)
};

Root.prototype.list = function(env, next) {
  var self = this;
  this._tenants._targets.findAll(function(err, results) {
    if(err) {
      env.response.statusCode = 500;
      return next(env);
    }
    
    env.targets = {};
    env.targets.total = Math.floor(results.length / 2);
    var allocated = results.filter(function(item) { return item.tenantId;  });
    var unallocated = results.filter(function(item) { return !item.tenantId; });
    env.targets.allocated = Math.floor(allocated.length / self.defaultTargetsPerTenant);
    env.targets.unallocated = Math.floor(unallocated.length / self.defaultTargetsPerTenant);
    env.format.render('root', { env: env });
    next(env);
  });
};

