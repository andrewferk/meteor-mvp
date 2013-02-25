# meteor-mvp #
meteor-mvp allows for a more encapsulated, behavior and domain driven approach to using the [Meteor](http://meteor.com/) platform by utilizing the [MVP pattern](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter). This package is still in its infancy, with many features one may expect.

## Meteor.Model ##
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

### extend ###

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

## Meteor.Presenter ##
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

## Meteor.View ##
Currently, there is no encapsulation for views. Views are the *.html files in your application.

