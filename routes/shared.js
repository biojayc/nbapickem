var Controller = require('../model/controller').Controller,
    cache = require('../cache'),
    data = require('../model/data'),
    log = require('../log');

var cache = new cache.CacheManager();

// TODO: rework to not block.  Probably can't use cachemanager here.
var controller = function() {
  return cache.get('controller', function() {
    log.info("Reloading controller into cache.");
    var c = new Controller();
    data.injectData(c);
    return c;
  }, 3600);
}

exports.controller = controller;

var formatWinningPercent = function(pct) {
  var winningPercent = Math.round(pct * 1000);
  if (winningPercent == 0) {
    winningPercent = "000";
  } else if (winningPercent < 100) {
    winningPercent = "0" + winningPercent;
  }
  return "." + winningPercent;
}
exports.formatWinningPercent = formatWinningPercent;

exports.createScores = function(controller) {
  var scores = [];
  var owners = controller.owners.slice();
  owners.sort(function(a, b){return b.pct-a.pct});
  for (var i = 0; i < owners.length; i++) {
    var owner = owners[i];
    scores.push({ name: owner.name, wins: owner.wins, pct: formatWinningPercent(owner.pct), 
                id: owner.id, color: owner.color });
  }
  return scores;
}

exports.getWinningImage = function(controller) {
  var owners = controller.owners.slice();
  owners.sort(function(a, b){return b.pct-a.pct});
  return owners[0].image;
}

exports.createVsTop = function(controller) {
  var container = [];
  for (var i = 0; i < controller.owners.length; i++) {
    container.push({ initial: controller.owners[i].initial });
  }
  return container;
}

exports.createVsRows = function(controller) {
  var container = [];
  var owners = controller.owners;
  for (var i = 0; i < owners.length; i++) {
    var owner1 = owners[i];
    
    var cols = [];
    for (var j = 0; j < owners.length; j++) {
      var owner2 = owners[j];
      var wins;
      // This if is needed to prevent an owner with no teams from causing issues.
      if (owner1.otherOwnersDataHash[owner2.id]) {
        wins = owner1.otherOwnersDataHash[owner2.id].wins;
      } else {
        wins = 0;
      }
      cols.push({ wins: wins });
    }
    container.push({ first: owner1.first, vsrow: cols });
  }
  return container;
}

exports.createGames = function(games) {
  var container = [];
  for (var i = 0; i < games.length; i++) {
    var game = games[i];
    var time = game.time.replace(" ET", "");
    var awayTeamName = (game.awayScore ? '(' + game.awayScore + ') ' : '') + game.awayTeam.name;
    var homeTeamName = game.homeTeam.name + (game.homeScore ? ' (' + game.homeScore + ')' : '');
    var awayOwner = game.awayTeam.owner;
    var homeOwner = game.homeTeam.owner;
    var awayOwnerId = "";
    var homeOwnerId = "";
    var awayOwnerName = "";
    var homeOwnerName = "";
    var awayOwnerColor = "";
    var homeOwnerColor = "";
    var awayClass = "";
    var homeClass = "";
    if (awayOwner) {
      awayOwnerName = awayOwner.name;
      awayOwnerColor = awayOwner.color;
      awayOwnerId = awayOwner.id;
    }
    if (homeOwner) {
      homeOwnerName = homeOwner.name;
      homeOwnerColor = homeOwner.color;
      homeOwnerId = homeOwner.id;
    }
    if (game.winningTeam) {
      if (game.winningTeam.id === game.awayTeam.id) {
        awayClass = 'bold';
      } else {
        homeClass = 'bold';
      }
    }
    container.push({
      date: game.date,
      time: time,
      awayTeam: awayTeamName,
      awayOwner: awayOwnerName,
      awayOwnerColor: awayOwnerColor,
      awayOwnerId: awayOwnerId,
      awayClass: awayClass,
      homeTeam: homeTeamName,
      homeOwner: homeOwnerName,
      homeOwnerColor: homeOwnerColor,
      homeOwnerId: homeOwnerId,
      homeClass: homeClass,
    });
  }
  return container;
}

exports.getDateByOffset = function(startDate, offset) {
  var newDate = startDate;
  newDate.setDate(newDate.getDate() + offset);
  var dd = newDate.getDate();
  var mm = newDate.getMonth()+1; //January is 0!
  var yyyy = newDate.getFullYear();

  if(dd<10) {
    dd='0'+dd
  }

  if(mm<10) {
    mm='0'+mm
  }

  return yyyy + '' + mm + '' + dd;
}