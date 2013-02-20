(function() {

  var Model = Meteor.Model = function(attrs) {
    initializeModel(this, this.defaults);
    applyModelAttrs(this, attrs);
  };

  Model.prototype.idAttribute = "_id";

  Model.prototype.save = function() {
    var id = this.getId();
    if (typeof id === "undefined") {
      this._collection.insert(this.attributes);
    }
  };

  Model.prototype.get = function(attr) {
    return this.attributes[attr];
  };

  Model.prototype.getId = function() {
    return this.get(this.idAttribute);
  };
  
  Model.extend = function(protoProps) {
    var ext = _.bind(extend, this)(protoProps);
    var collection = new Meteor.Collection(protoProps.collection);
    ext.prototype._collection = collection;
    _.extend(ext, collection);
    return ext;
  };

  function initializeModel(model, defaults) {
    model.attributes = {};
    for (var attr in defaults) {
      model.attributes[attr] = defaults[attr];
    }
  };

  function applyModelAttrs(model, attrs) {
    for (var attr in attrs) {
      model.attributes[attr] = attrs[attr];
    }
  };

  var Controller = Meteor.Controller = function() {
    delegateData(this.template, this.data);
    delegateEvents(this.template, this.events);
  };

  Controller.extend = extend;
  Controller.auto = function(protoProps) {
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
