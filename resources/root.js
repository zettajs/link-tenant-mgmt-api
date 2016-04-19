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
    
    env.tenants = {};
    env.tenants.total = Math.floor(results.length / 2);
    var allocated = results.filter(function(item) { return item.tenantId;  });
    var tenantIds = [];
    allocated.forEach(function(tenant) {
      if(tenantIds.indexOf(tenant.tenantId) == -1) {
        tenantIds.push(tenant.tenantId);
      }
    });
    var unallocated = results.filter(function(item) { return !item.tenantId; });
    env.tenants.allocated = tenantIds.length;
    env.tenants.unallocated = Math.floor(unallocated.length / self.defaultTargetsPerTenant);

    env.targets = {};
    env.targets.total = results.length;
    env.targets.allocated = allocated.length;
    env.targets.unallocated = unallocated.length;
    env.format.render('root', { env: env });
    next(env);
  });
};

