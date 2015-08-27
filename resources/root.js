var Root = module.exports = function(tenantsClient) {
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
  env.format.render('root', { env: env });
  next(env);
};

