var Player = Meteor.Model.extend({
  collection: "players",

  defaults: {
    name:  "",
    score: 0
  }
});

if (Meteor.isClient) {

  var LeaderboardPresenter = Meteor.Presenter.auto({
    template: "leaderboard",
  
    data: {
      "players": function() {
        return Player.find({}, {sort: {score: -1, name: 1}});
      },
      "selected_name": function() {
        var player = Player.findOne(Session.get("selected_player"));
        return player && player.name;
      }
    },
  
    events: {
      "click input.inc": function() {
        Player.update(Session.get("selected_player"), {$inc: {score: 5}});
      }
    }
  });

  var PlayerPresenter = Meteor.Presenter.auto({
    template: "player",
  
    data: {
      "selected": function() {
        return Session.equals("selected_player", this._id) ? "selected" : '';
      }
    },
  
    events: {
      "click": function() {
        Session.set("selected_player", this._id);
      }
    }
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Player.find().count() === 0) {
      var names = ["Ada Lovelace",
                   "Grace Hopper",
                   "Marie Curie",
                   "Carl Friedrich Gauss",
                   "Nikola Tesla",
                   "Claude Shannon"];
      for (var i = 0; i < names.length; i++) {
        var player = new Player({
          name:  names[i],
          score: Math.floor(Math.random()*10)*5
        });
        player.save();
      }
    }
  });
}
