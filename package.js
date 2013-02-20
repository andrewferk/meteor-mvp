Package.describe({
  summary: "An MVP wrapper and extension for Meteor"
});

Package.on_use(function (api, where) {
  where = where || ['client', 'server'];
  api.use('underscore', where);
  api.add_files('mvp.js', where);
});

Package.on_test(function (api) {
  api.use('tinytest', ['client', 'server']);
  api.add_files('mvp_tests.js', ['client', 'server']);
});
