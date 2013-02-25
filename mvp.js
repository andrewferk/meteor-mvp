(function() {

  var Model = Meteor.Model = function(attrs) {
    this.attributes = {};
    initializeDefaults(this, this.defaults);
    applyModelAttrs(this, attrs);
    extendRemotes(this, this.remote);
    if (this.initialize) this.initialize();
  };

  Model.prototype.idAttribute = "_id";

  Model.prototype.save = function(callback) {
    var self = this;
    var id = this.getId();
    if (typeof id === "undefined") {
      this._collection.insert(this, function(error, id) {
        if (id) self.attributes[self.idAttribute] = id;
        callback.call(this, error, id);
      });
    }
  };

  Model.prototype.set = function(attr, value) {
    this.attributes[attr] = value;
    return this;
  };

  Model.prototype.get = function(attr) {
    var ret;
    if (this.relations && this.relations[attr] &&
        this.relations[attr].type == "belongsTo"
    ) {
      var model = this.relations[attr].model;
      ret = model.findOne(this.attributes[attr + "_id"]);
    } else {
      ret = this.attributes[attr];
    }
    return ret;
  };

  Model.prototype.getId = function() {
    return this.get(this.idAttribute);
  };
  
  Model.extend = function(protoProps) {
    protoProps = protoProps || {};
    if (protoProps.remote)
      protoProps = initializeRemotes(protoProps, protoProps.remote);
    initializeToJSON(protoProps);
    var ext = extend.call(this, protoProps);
    if (protoProps && (protoProps.collection || protoProps.mock)) {
      var collection = new Meteor.Collection(protoProps.collection);
      ext.prototype._collection = collection;
      _.extend(ext, _.omit(collection, ['findOne']));
    }
    _.extend(ext, CollectionWrapper);
    return ext;
  };

  function initializeDefaults(object, defaults) {
    if (defaults) _.extend(object.attributes, defaults);
  };

  function applyModelAttrs(object, attrs) {
    if (attrs) _.extend(object.attributes, attrs);
  };

  function initializeToJSON(object) {
    if (!object.toJSON) {
      object.toJSON = function() {
        return this.attributes;
      };
    }
    if (object.toJSON && !object.clone) {
      object.clone = function() {
        var json = object.toJSON.call(this);
        if (!json._id) json._id = this._id;
        return json;
      };
    }
  };

  function initializeRemotes(object, remotes) {
    var proto = object;
    var meteorMethods = {};
    for (var i in remotes) {
      var remote = remotes[i];
      var saltedRemote = remote;
      var temp = object[remote];
      if (this.collection) {
        saltedRemote = this.collection + "_" + saltedRemote;
      }
      meteorMethods[saltedRemote] = function(object, args) {
        if (!object.attributes) object = { attributes: object };
        var o = {};
        _.extend(o, Model.prototype, proto, object, this);
        return temp.apply(o, args);
      };
      object[remote] = function(object, args) {
        var args = Array.prototype.slice.call(args);
        return Meteor.call(saltedRemote, object, args);
      };
    }
    Meteor.methods(meteorMethods);
    object._remotes = meteorMethods;
    return object;
  };

  function extendRemotes(object, remotes) {
    for (var i in remotes) {
      var remote = remotes[i];
      var temp = object[remote];
      object[remote] = function() {
        temp(object, arguments);
      };
    }
  };

  var CollectionWrapper = {
    findOne: function() {
      var object = this.prototype._collection.findOne.apply(this, arguments);
      var instance = new this(object);
      return instance;
    },
    insert: function(doc, callback) {
      var insert = this.prototype._collection.insert;
      return insert.call(this, doc, callback);
    }
  };

  var Presenter = Meteor.Presenter = function() {
    delegateData(this.template, this.data);
    delegateEvents(this.template, this.events);
  };

  Presenter.extend = extend;
  Presenter.auto = function(protoProps) {
    var ext = this.extend(protoProps);
    new ext();
    return ext;
  };

  function delegateData(template, data) {
    for (var key in data) {
      Template[template][key] = data[key];
    }
  };

  function delegateEvents(template, events) {
    Template[template].events(events);
  }
  
  function extend(protoProps) {
    var parent = this;

    function tempConstructor(){};
    tempConstructor.prototype = parent.prototype;

    function tempModel() { return parent.apply(this, arguments); };
    _.extend(tempModel, parent);
    tempModel.prototype = new tempConstructor();

    if (protoProps) _.extend(tempModel.prototype, protoProps);

    return tempModel;
  };

})();
