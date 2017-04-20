const {Table} = require('../model/table');
const {Chair} = require('../model/chair');
const {Holdem} = require('../model/holdem');
const {Player} = require('../model/player');
const {Shuffle} = require('../utils/shuffle');


var holdems = [];
var starters = [];
var responds = [];
//Player ayrıldığı zaman bu array'i güncelle
var playersInTheGame = [[]];
//Chair boşaltıldığı zaman bu Array'i güncelle
var chairsInTheGame = [[]];
//Table'daki oyun bitince bu arrayi güncelle
var tablesInTheGame = [];

var holdemNumber = 0;


AddPlayerToHoldem = (player, holdemNsp, socket) => {
  Table.findById(player.table).then((table) => {
    tablesInTheGame[table._id] = table;
    Chair.find({table: table, isTaken: true}).sort({number: 1}).then((chairs) => {
      chairsInTheGame[table._id] = chairs;
      if(holdems[player.table] == null) {
        var newHoldem = new Holdem({holdemNumber: holdemNumber, bigBlindAmount: table.maxStake, smallBlindAmount: table.minStake});
          newHoldem.save().then((holdem) => {
            holdems[table._id] = newHoldem;
            console.log('burada oyun yoktu oluşturuldu: ');
            holdemNumber++;
            holdemNsp.to(table._id).emit('forTable', `Diğer oyuncular bekleniyor`);
          });
      } else {
        if(holdems[player.table].isStarted == false) {
          console.log('Oyuncunun girmek istediği oyun daha başlamamış');
          AddPlayerToNotStartedGame(table, chairs, player, holdemNsp, socket);

        } else {
          console.log('Oyuncunun girmek istediği oyun başlamış');
        }
      }
    });
  });
}


AddPlayerToNotStartedGame = (table, chairs, player, holdemNsp, socket) => {

  if(table.chairs.length == 2) {
    console.log('Bu iki kişilik oyun zaman sayacı olmayacak');
    if(chairs.length == 2 ) {
      StartHoldem(table, holdemNsp, socket);
    } else {
      holdemNsp.to(table._id).emit('forTable', `Diğer oyuncular bekleniyor`);
    }
  } else {
    console.log('Bu 2 den fazla kişilik oyun geri sayım Starter ının başlaması lazım');
    //Eğer masaya ait bir starter başlamamışsa
    if(starters[table._id] == null) {
      var myStarter = new Starter(10, table, holdemNsp, socket);
      starters[table._id] = myStarter;
    } else {
      starters[table._id].stop();
      delete starters[table._id];
      var myStarter = new Starter(10, table, holdemNsp, socket);
      starters[table._id] = myStarter;
    }
  }
}


function Starter(t, table, holdemNsp, socket) {
    var timerObj = setInterval(() => {
      t--;
      holdemNsp.to(table._id).emit('timer', t);
      if(t==0) {
          StartHoldem(table, holdemNsp, socket);
          this.stop();
          if(starters[table._id] != null) {
            delete starters[table._id];
          }
      }
    }, 1000);

    this.stop = function() {
        if (timerObj) {
            clearInterval(timerObj);
            timerObj = null;
        }
        return this;
    }
}

AddPlayerToStartedGame = () => {

}


StartHoldem = (table, holdemNsp, socket) => {
  Player.find({table: table, isInGame: true}).sort({number: 1}).then((players) => {
    playersInTheGame[table._id] = players;
    holdemNsp.to(table._id).emit('forTable', `Oyun Başladı:`);
      AssignChairRoles(table, holdemNsp).then((chairs) => {
        table.isGamePlaying = true;
        table.turnType = 'preFlop';
          table.save().then((table) => {
            tablesInTheGame[table._id] = table;
            holdems[table._id].isStarted = true;
            var suits = ['c', 'd', 'h', 's'];
            var ranks = [ '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A' ];
            var cards = [];

            for (var i = 0; i < suits.length; i++) {
              for (var j = 0; j < ranks.length; j++) {
                cards.push( ranks[j] + suits[i] );
              }
            }

            var newCards = Shuffle(cards);
            holdems[table._id].shuffleCards = newCards;

            for (var i = 0; i < players.length; i++) {
              var playerToGiveCard = holdems[table._id].players.find(pl => pl._id.toString() == players[i]._id.toString());
              playerToGiveCard.card1 = newCards[0];
              playerToGiveCard.card2 = newCards[1];
              newCards.splice(0, 2);
            }

            holdems[table._id].save().then((holdem) => {
              MaxAndMinInGameBalances(table._id).then((values) =>{
                players.forEach((pl) => {
                  var playerInHoldem = holdems[table._id].players.find(plHoldem => plHoldem._id.toString() == pl._id.toString());
                  var playerInDB = players.find(plDB => plDB._id.toString() == playerInHoldem._id.toString());
                  holdemNsp.to("/holdem#" + pl.socketId).emit('gameStarted', playerInHoldem.card1, playerInHoldem.card2, playerInDB.chair, values.max, values.min, holdem._id, holdem.smallBlindAmount, holdem.bigBlindAmount);
                });
                holdemNsp.to(table._id).emit('totalPlayers', players.length);
                var myGetRespondFromPlayer = new GetRespondFromPlayer(20, holdemNsp, table, players, chairs, holdem._id);
                responds[table._id] = myGetRespondFromPlayer;
              });
            });
          });

      });
  });
}

AssignChairRoles = (table, holdemNsp) => {
  return new Promise((resolve, reject) => {
    Chair.find({table: table, isTaken: true}).sort({number: 1}).then((chairs) => {
      if(chairs.length == 2) {
        chairs[0].role = 'dealer';
        chairs[0].subRole = 'smallBlind';
        chairs[1].role = 'bigBlind';
        chairs[1].subRole = null;
        chairs[0].isMyTurn = true;
        Player.findOne({chair: chairs[0]}).then((player) => {
          player.isMyTurn = chairs[0].isMyTurn;
          player.save();
        });
        holdems[table._id].dealer = chairs[0];
        holdems[table._id].smallBlind = chairs[0];
        holdems[table._id].bigBlind = chairs[1];
        holdems[table._id].players.push(chairs[0].player);
        holdems[table._id].players.push(chairs[1].player);
        holdems[table._id].save().then((holdem) => {
          chairs[0].save().then((chair) => {
            chairs[1].save().then((chair) => {
                chairsInTheGame[table._id] = chairs;
                resolve(chairs);
              });
          });
        })
      } else if(chairs.length == 3) {
        chairs[0].role = 'dealer';
        chairs[0].subRole = null;
        chairs[1].role = 'smallBlind';
        chairs[1].subRole = null;
        chairs[2].role = 'bigBlind';
        chairs[2].subRole = null;
        chairs[0].isMyTurn = true;
        Player.findOne({chair: chairs[0]}).then((player) => {
          player.isMyTurn = chairs[0].isMyTurn;
          player.save();
        });
        holdems[table._id].dealer = chairs[0];
        holdems[table._id].smallBlind = chairs[1];
        holdems[table._id].bigBlind = chairs[2];
        holdems[table._id].players.push(chairs[0].player);
        holdems[table._id].players.push(chairs[1].player);
        holdems[table._id].players.push(chairs[2].player);
        holdems[table._id].save().then((holdem) => {
          chairs[0].save().then((chair) => {
            chairs[1].save().then((chair) => {
              chairs[2].save().then((chair) => {
                chairsInTheGame[table._id] = chairs;
                resolve(chairs);
              });
            });
          });
        });
      } else {
          chairs.forEach((ch, idx, chairs) => {
          if(idx == 0) {
            ch.role = 'dealer';
            ch.subRole = null;
            ch.isMyTurn = false;

            Player.findOne({chair: ch}).then((player) => {
              player.isMyTurn = ch.isMyTurn;
              player.save();
            });

            holdems[table._id].dealer = ch;
            holdems[table._id].players.push(ch.player);
          } else if(idx == 1) {
            ch.role = 'smallBlind';
            ch.subRole = null;
            ch.isMyTurn = false;

            Player.findOne({chair: ch}).then((player) => {
              player.isMyTurn = ch.isMyTurn;
              player.save();
            });

            holdems[table._id].smallBlind = ch;
            holdems[table._id].players.push(ch.player);
          } else if(idx == 2) {
            ch.role = 'bigBlind';
            ch.subRole = null;
            ch.isMyTurn = false;

            Player.findOne({chair: ch}).then((player) => {
              player.isMyTurn = ch.isMyTurn;
              player.save();
            });

            holdems[table._id].bigBlind = ch;
            holdems[table._id].players.push(ch.player);
          } else if(idx == 3) {
            ch.role = null;
            ch.subRole = null;
            ch.isMyTurn = true;

            Player.findOne({chair: ch}).then((player) => {
              player.isMyTurn = ch.isMyTurn;
              player.save();
            });

            holdems[table._id].players.push(ch.player);
          } else {
            ch.role = null;
            ch.subRole = null;
            ch.isMyTurn = false;
            Player.findOne({chair: ch}).then((player) => {
              player.isMyTurn = ch.isMyTurn;
              player.save();
            });

            holdems[table._id].players.push(ch.player);
          }
          ch.save().then((newChair) => {
            if(idx == chairs.length - 1) {
              holdems[table._id].save().then((holdem) => {
                chairsInTheGame[table._id] = chairs;
                resolve(chairs);
              });
            }
          });
        });
      }
        //burada roller atandıktan sonra soket tetikle
        var ChairsToSend = [{}];

        chairs.forEach((chToSend, idx, chairs) => {
          ChairsToSend[idx] = {_id: chToSend._id, role: chToSend.role}
        });

        var firstTurn = chairs.find(ch => ch.isMyTurn == true);
        holdemNsp.to(table._id).emit('chairRoles', JSON.stringify(ChairsToSend), firstTurn._id);
      });
  });
}


function GetRespondFromPlayer(t, holdemNsp, table, players, chairs, holdemId) {

  Holdem.findById(holdemId).then((holdem) => {

      var turnType = holdem.turnType;
      var whoseTurnChair = chairs.find(ch => ch.isMyTurn == true);
      var whoseTurn = players.find(pl => pl.chair.toString() == whoseTurnChair._id.toString());

      console.log('Şuan sırası olan kişi: ' + whoseTurn.name);


      //Burada TurnType'a göre bir Switch Case statement olacak, ve kullanıcıya hangi hareketlerde bulunabileceğini söyleyecek
      switch(turnType) {
        case "preFlop":
          //Kullanıcı pre-flop'ta iken eğer BilBlind'ise Call diyebilir, fold diyebilir bahis artırabilir
          //Eğer smallBlind ise Call diyebilir Fold diyebilir bahis artırabilir
          //Eğer normal kullanıcı ise Call diyebilir, fold diyebilir bahis artırabilir
          //Her halükarda BB kadar para aktaracaklarından dolayı Call demek zorundalar.
          //En düşük bahis artırma miktarı BB nin 2 katı kadar
          //En yüksek bahis artırma miktarı Masadaki FOLD dememişler içerisindeki inGameBalance'ı en düşük olan kişi kadar.
          //Eğer herhangi birisi bahis artırma yaparsa bu değerler değişecektir
          //Turun bitmesi için İlk konuşan kişiye tekrar sıra gelmesi lazım
          //Eğer 1 kişi bahis artırma yaptıysa İlk konuşan kişinin yerine o geçer



          break;
        case "flop":
          //
          break;
        case "turn":
          //
          break;
        case "river":
          //
          break;
        default:
          //
      }


      var timerObj = setInterval(() => {
        t--;
        holdemNsp.to(table._id).emit('timer', t);
        if(t == 0) {
          this.stop();
          if(responds[table._id] != null) {
            delete responds[table._id];
          }
          ChangeTurn(players, holdemNsp, table, chairs, holdemId);
        }
      }, 1000);
      this.stop = function() {
          if (timerObj) {
              clearInterval(timerObj);
              timerObj = null;
          }
          return this;
      }

    });


}

function PlayerResponded(moveType, value, tableId, playerId, holdemNsp, holdemId) {
  if(tablesInTheGame[tableId].isGamePlaying == true) {
    var respondedTable = tablesInTheGame[tableId];
    var respondedChairs = chairsInTheGame[tableId];
    var playersInSameGame = playersInTheGame[tableId];
    var canITalkChair = respondedChairs.find(ch => ch.isMyTurn == true);
    var canITalkPlayer = playersInSameGame.find(pl => pl.chair.toString() == canITalkChair._id.toString());

    if(canITalkChair.player.toString() == playerId) {
      if(responds[tableId] != null) {
        responds[tableId].stop();
        delete responds[tableId];

        //Burası daha yazılmadı
        //holdemNsp.to(tableId).emit('playerResponded', JSON.stringify(ChairsToSend), firstTurn._id);

        ChangeTurn(playersInTheGame[tableId], holdemNsp, respondedTable, respondedChairs, holdemId);
      }
    } else {
      console.log('Its not your turn');
    }
  } else {
    console.log('Game is not started yet');
  }
}

function ChangeTurn(players, holdemNsp, table, chairs, holdemId) {
  var turn = chairs.find(ch => ch.isMyTurn == true);
  var nextTurn;
  var index = 0;
  var dummyLength = chairs.length;
  var dummyChairsArray = [];
  dummyChairsArray.push(turn);
  var isCountinue=false;
  for (var i = 0; i < dummyLength; i++) {
    if(chairs[i] != null) {
      if (chairs[i].number==turn.number) {
        index=i;
        isCountinue=true;
      }else if (isCountinue) {
        dummyChairsArray.push(chairs[i]);
      }
    }
  }
  for (var i = 0; i < index; i++) {
    if(chairs[i] != null) {
      if (chairs[i].number!=turn.number) {
        dummyChairsArray.push(chairs[i]);
      }
    }
  }
  for (var i = 0; i < dummyChairsArray.length; i++) {
    if(i == 0) {
      dummyChairsArray[i].isMyTurn = false;
    } else if(i == 1) {
      dummyChairsArray[i].isMyTurn = true;
      nextTurn = players.find(pl => pl.chairNumber == dummyChairsArray[i].number);
      holdemNsp.to(table._id).emit('whoseTurn', nextTurn.chair);
    } else {
      dummyChairsArray[i].isMyTurn = false;
    }

    dummyChairsArray[i].save().then((chair) => {
      Player.findOne({chair: chair}).then((player) => {
        player.isMyTurn = chair.isMyTurn;
        player.save();
        ////
      });

    });
  }

  var myGetRespondFromPlayer = new GetRespondFromPlayer(20, holdemNsp, table, players, dummyChairsArray, holdemId);
  responds[table._id] = myGetRespondFromPlayer;
}



function MaxAndMinInGameBalances(tableId) {
  var valuesArray = [];
  var values = {
    max: 0,
    min: 0
  };
  return new Promise((resolve, reject) => {
    Player.find({table: tableId, isInGame: true}).then((players) => {
      players.forEach((pl) => {
        valuesArray.push(pl.inGameBalance);
      });
      var maxAmounInTheGame = Math.max.apply(null, valuesArray);
      var minAmountInTheGame = Math.min.apply(null, valuesArray);
      values.max = maxAmounInTheGame;
      values.min = minAmountInTheGame;
      holdems[tableId].maxAmounInTheGame = maxAmounInTheGame;
      holdems[tableId].minAmountInTheGame = minAmountInTheGame;
      holdems[tableId].save().then((holdem) => {
          resolve(values);
      });

    });
  });
}


LogHoldems = () => {
  Table.find({isGamePlaying: true}).then((tables) => {
    for (var i = 0; i < tables.length; i++) {
      if(holdems[tables[i]._id] != null) {
        holdems[tables[i]._id].players.forEach((holdemPlayer) => {
          Player.findOne({_id: holdemPlayer._id}).then((player) => {
            Chair.find({table: player.table, isTaken: true}).then((chairs) => {
              var playerInTheGame = holdems[player.table].players.find(pl => pl._id.toString() == player._id.toString());
              var chairInDb = chairs.find(ch => ch.player.toString() == playerInTheGame._id.toString());
              console.log(`${holdems[player.table].holdemNumber} numaralı oyundaki ${holdemPlayer._id} IDli oyuncunun adı ${player.name}
                Oyunda kaydedilen PlayerIdsi ${playerInTheGame._id}
                Gerçekteki IDsi ${player._id}
                Player'da kayıtlı ChairIdsi ${player.chair}
                DB de kayıtlı ChairIdsi ${chairInDb._id}
                DB de kayıtlı Chair Rolü ${chairInDb.role}
                Benim sıram mı ${chairInDb.isMyTurn}
                kaydedilen Card1 ${playerInTheGame.card1}
                kaydedilen Card2 ${playerInTheGame.card2}`);
            });
          });
        });
      }
    }
  });
}


module.exports = {
  AddPlayerToHoldem,
  StartHoldem,
  LogHoldems,
  PlayerResponded
}
