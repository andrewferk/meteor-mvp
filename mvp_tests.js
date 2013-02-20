var Person = Meteor.Model.extend({
  collection: null
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
