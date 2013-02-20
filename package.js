Package.describe({
  summary: "An MVC-like wrapper and extension for Meteor"
});

Package.on_use(function (api, where) {
  where = where || ['client', 'server'];
  api.use('underscore', where);
  api.add_files('mvc.js', where);
});
