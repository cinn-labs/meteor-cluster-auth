Package.describe({
  name: 'cinn:cluster-auth',
  version: '0.0.1',
  summary: 'Authentication helper for cluster pacakge',
  git: 'https://github.com/cinn-labs/meteor-cluster-auth',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  const both = ['client', 'server'];
  api.versionsFrom('1.3.2.4');
  api.export('ClusterAuth');

  api.use('ecmascript');
  api.use('meteor-base');
  api.use('mongo');
  api.use('random');
  api.use('accounts-base');
  api.use('accounts-password');

  api.addFiles('cluster-auth.common.js', both);
  api.addFiles('cluster-auth.server.js', 'server');
});
