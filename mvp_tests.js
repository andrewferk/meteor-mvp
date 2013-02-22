var Person = Meteor.Model.extend({
  mock: true
});

Tinytest.add("Model's prototype extends a Meteor.Collection object", function(test) {

  test.isNotNull(Person.find);
  test.isNotNull(Person.findOne);
  test.isNotNull(Person.insert);
  test.isNotNull(Person.update);
  test.isNotNull(Person.remove);
  test.isNotNull(Person.allow);
  test.isNotNull(Person.deny);

  var count = Person.find().count();

  Person.insert({"test": "test"}, function(error, id) {
    test.isNull(error);
    test.equal(Person.find().count(), count + 1);
    removePerson(id);
  });

  function removePerson(id) {
    Person.remove(id, function(error) {
      test.isNull(error);
      test.equal(Person.find().count(), count);
    });
  }
});

Tinytest.add("A new Model object saves to its collection", function(test) {
  var count = Person.find().count();
  var person = new Person();
  
  person.save(function(error, id) {
    test.isNull(error);
    test.equal(Person.find().count(), count + 1);
  });
});

Tinytest.add("A Model object's defaults are saved", function(test) {
  var person = new Person({
    first: "Foo",
    last:  "Bar"
  });

  person.save(function(error, id) {
    var saved = Person.findOne(id);
    test.equal(saved.first, person.get("first"));
    test.equal(saved.last, person.get("last"));
  });
});

Tinytest.add("A new Model object should have an id after save", function(test) {
  var person = new Person();
  test.isUndefined(person.getId());
  person.save(function(error, id) {
    test.equal(person.getId(), id);
  });
});

Tinytest.add("A Model without a collection will not create a Meteor.Collection", function(test) {
  var Anon = Meteor.Model.extend();
  test.isUndefined(Anon.prototype._collection);
});

Tinytest.add("Model objects execute the initialize method when instantiated", function(test) {
  var initialized = false;
  var Init = Meteor.Model.extend({
    initialize: function() {
      initialized = true;
    }
  });
  new Init();
  test.isTrue(initialized);
});

Tinytest.add("A Model object can set attributes using set(...)", function(test) {
  var person = new Person();
  person.set("name", "Andrew");
  test.equal(person.get("name"), "Andrew");
});

Tinytest.add("Remote Model methods are run using Meteor.methods", function(test) {
  var sync = false;
  var server = false;
  var simulation = false;
  var Remote = Meteor.Model.extend({
    mock: true,
    remote: ["testRemote"],
    defaults: {
      "foo": "bar"
    },
    testRemote: function(aString) {
      test.equal(aString, "test");
      test.equal(this.get("foo"), "bar");
      sync = true;
      if (this.isSimulation) {
        simulation = true;
      }
      if (Meteor.isServer) {
        server = true;
      }
    }
  });
  var remote = new Remote();
  remote.testRemote("test");
  if (Meteor.isClient) {
    test.isTrue(sync);
    test.isFalse(server);
    test.isTrue(simulation);
    test.isTrue(_.size(remote._remotes) > 0);
    for (var r in remote._remotes) {
      test.notEqual(typeof Meteor.default_connection._methodHandlers[r], "undefined");
    }
  }
  if (Meteor.isServer) {
    test.isTrue(sync);
    test.isTrue(sync);
    test.isFalse(simulation);
    test.isTrue(_.size(remote._remotes) > 0);
    for (var r in remote._remotes) {
      test.notEqual(typeof Meteor.default_server.method_handlers[r], "undefined");
    }
  }
});

Tinytest.add("Use remote Model methods with multiple instantiated Models", function(test) {
  var count = 0;
  var Remote = Meteor.Model.extend({
    mock: true,
    remote: ["multiTestRemote"],
    multiTestRemote: function() {
      count++;
    }
  });
  var remote1 = new Remote();
  var remote2 = new Remote();
  remote1.multiTestRemote();
  remote2.multiTestRemote();
  test.equal(count, 2);
});

Tinytest.add("Remote Model methods work utilize Class prototype", function(test) {
  var Remote = Meteor.Model.extend({
    mock: true,
    remote: ["protoTestRemote"],
    defaults: {
      foo: "bar"
    },
    protoTestRemote: function(aString) {
      test.equal(this.get("foo"), "bar");
      test.equal(aString, "test");
    }
  });
  var remote = new Remote();
  remote._remotes.protoTestRemote(JSON.parse(JSON.stringify(remote)), ["test"]);
});