(function() {

  var Model = Meteor.Model = function(attrs) {
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
        if (id) self[self.idAttribute] = id;
        callback.call(this, error, id);
      });
    }
  };

  Model.prototype.set = function(attr, value) {
    this[attr] = value;
    return this;
  };

  Model.prototype.get = function(attr) {
    var ret;
    if (this.relations && this.relations[attr] &&
        this.relations[attr].type == "belongsTo"
    ) {
      var model = this.relations[attr].model;
      ret = model.findOne(this[attr + "_id"]);
    } else {
      ret = this[attr];
    }
    return ret;
  };

  Model.prototype.getId = function() {
    return this.get(this.idAttribute);
  };
  
  Model.extend = function(protoProps) {
    if (protoProps && protoProps.remote) {
      protoProps = initializeRemotes(protoProps, protoProps.remote);
    }
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
    _.extend(object, defaults);
  };

  function applyModelAttrs(object, attrs) {
    _.extend(object, attrs);
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
      if (doc.toJSON && !doc.clone) {
        doc.clone = function() {
          var object = doc.toJSON.call(this);
          if (!object._id) object._id = this.getId();
          return object;
        };
      }
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
    tempModel.prototype = new tempConstructor();

    if (protoProps) _.extend(tempModel.prototype, protoProps);

    return tempModel;
  };

})();
