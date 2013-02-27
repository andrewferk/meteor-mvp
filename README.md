# meteor-mvp
meteor-mvp allows for a more encapsulated, behavior and domain driven approach to using the [Meteor](http://meteor.com/) platform by utilizing the [MVP pattern](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter). This package is still in its infancy, with many features one may expect. The initial concept of the model has a lot of similarities with [Backbone.Model](http://backbonejs.org/#Model).

## Warning
Currently, I'm available to answer questions, fix bugs, or dicscuss the future of this package. I'm still learning Meteor and all of its features, so don't expect this to be a complete abstraction of Meteor.

This package is in its infancy, and many features are still being documented and developed. You may notice certain API features marked as **In-Progress** or **Future**. In-progress API features may mean it's partially implemented, untested, or has a known issue. Future API features means it is expected to be part of the package, but currently is unavaible.

Also, there has been many discussions about Models, Views, MV* frameworks, etc. in the Meteor community. Both Meteor and these topics and implementations are under rapid development, so expect things to change. It is quite possible this package would become obsolete with a Meteor update or the concepts could prove to be unfruitful.

## Meteor.Model
The Model is an interface for data that wraps and extends the Meteor.Collection and Meteor.methods functionality. In addition, it provides a means to encapsulate data and behavior and ensures the data and behavior is available both on client and server when expected.

Below is what you can expect from a Model.

	// A Word taken from Meteor's wordplay example
    var Word = Meteor.Model.extend({
    
      // required to create a Meteor.Collection
      collection: "words",
      
      // ensure the score is calculated on the server so people can't cheat.
      // this causes the calculateScore method to use Meteor.method while
      // gaining the scope of the model
      remote: ["calculateScore"],
      
      // default values of a new Word
      defaults: {
        word: "",
        state: null,
        score: 0
      },
      
      // assists in managing a Word's association with other models
      relations: {
        game: {
          type: "belongsTo",
          model: Game
        },
        player: {
          type: "belongsTo",
          model: Player
        }
      },
      
      setScore: function(score) {
        if (score === 0) {
          this.set({score: 0, state: "bad"});
        } else {
          this.set({score: score, state: "good"});
        }
        return this;
      },
      
      calculateScore: function() {
        var game = this.get("game");
        var word = this.get("word");
        
        // terminate early if the client can discover the word is invalid
        if (!game.isValidWordOnClient(word)) {
          this.setScore(0).save();
          return;
        }
        
        if (Meteor.isServer) {
          if (!game.isValidWordOnServer(word)) {
            this.setScore(0).save();
          } else {
            var score = game.calculateWordScore(word);
            this.setScore(score);
          }
        }
      }
      
    });
    
    myWord = new Word({
      word: "meteor",
      player_id: me.get("id"),
      game_id: myGame.get("id")
    });
    
    myWord.calculateScore();
    
    // cheat the game setting my own score for the word
    myWord.set("score", 999999);
    myWord.save(function(error, id) {
      // I really want to make sure my score was set
      if (Word.findOne(id).get("score") != 999999)
        alert("I failed at cheating");
    });

### extend

`Meteor.Model.extend([properties])`

Use extend to create your own Model. The optional properties object will be attached as the prototype for the the returned constructor. Subclasses of Model can be further extended.

    var Animal = Meteor.Model.extend({
      defaults: {
        sound: ""
      },
      
      makeSound: function() {
        return this.get("sound");
      }
    });
    
    var Dog = Animal.extend({
      defaults: {
        sound: "ruff"
      },
      
      bark: function() {
        return this.makeSound();
      }
    });

### constructor

`new Model([attributes])`

Creates an instantied instance of the model. Pass in a hash of initial values for an object's attributes when instatiating a model.

    new Dog({
      name: "Rover",
      sound: "arf"
    });

### get

`model.get(attribute)`

Get the value of a model's attribute.

    dog.get("name");

### set

`model.set(attributes)`

Set a hash of attributes on the model. An individual attribute can be set by passing in a key and value.

    dog.set({ name: "Beethoven", soud: "woof" }):
    
    assignment.set("grade", "A-");

### collection

** In-Progress ** `model.collection`

The name of the Meteor.Collection to use for storing instances of the model. A predefined Meteor.Collection may be set as the collection. 

    var Dog = Meteor.Model.extend({
      collection: "dogs"
    });
    
    var Assignment = Meteor.Model.extend({
      collection: new Meteor.Collection("assignments");
    });

### type

** Future ** `model.type`

The type of the model can be specified for defining a custom EJSON datatype. This is useful when defining the collection to a predefined Meteor.Collection or making a subtype of a model. *Without specifying a type, it assumed all documents in the collection match the class.*

    var Animal = Meteor.Model.extend({
      collection: "animals",
      type:       "animal"
    });
    
    var Dog = Animal.extend({ type: "dog" });
    var Cat = Animal.extend({ type: "cat" });

## Meteor.Presenter
The Presenter is a mediator between the Model and View that wraps and extends Meteor's Template functionality.

    var LeaderboardPresenter = Leaderboard.Presenter.auto({
      template: "leaderboard",
      
      data: {
        "players": function() {
          return Player.find();
        },
        "selected_name": function() {
          var player = Player.findOne(Session.get("selected_player"));
          return player && player.get("name");
        }
      },
      
      events: {
        "click input.inc": function() {
          Player.update(Session.get("selected_player"), {$inc: {score: 5}});
        }
      }
    });

## Meteor.View
Currently, there is no encapsulation for views. Views are the *.html files in your application.

