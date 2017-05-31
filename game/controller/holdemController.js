const {Table} = require('../model/table');
const {Chair} = require('../model/chair');
const {Holdem} = require('../model/holdem');
const {HoldemMove} = require('../model/holdemMove');
const {HoldemPot} = require('../model/holdemPot');
const {BalanceMove} = require('../model/balanceMove');
const {Player} = require('../model/player');
const {Terminal} = require('../model/terminal');
const {Shuffle} = require('../utils/shuffle');

var holdems = [];
var starters = [];
var responds = [];
var terminal;

function InitialiseSystem () {
  Terminal.findOne({}).then((terminalDB) => {
    if(terminalDB) {
      terminal = terminalDB;
    } else {
      newTerminal = new Terminal();
      newTerminal.save();
    }
  });
}

function CreateHoldem (bigBlindAmount, smallBlindAmount, table) {
  return new Promise((resolve, reject) => {
    var newHoldem = new Holdem({holdemNumber: terminal.holdemNumber, table: table, bigBlindAmount: bigBlindAmount, smallBlindAmount: smallBlindAmount, minBetAmount: bigBlindAmount * 2, currentBetAmount: bigBlindAmount, turnCountdown: 1600});
    var newHoldemPot = new HoldemPot({potNumber: 1, holdem: newHoldem, value: 0, potLimit: bigBlindAmount});
    newHoldem.holdemPots.push(newHoldemPot);
    newHoldem.save().then((holdem) => {
      newHoldemPot.save().then((newPot) => {
        holdems[table._id] = newHoldem;
        console.log('burada oyun yoktu oluşturuldu: ');
        terminal.holdemNumber++;
        terminal.save();
        resolve(holdem);
      });
    });
  });
}

function AddPlayerToHoldem (player, holdemNsp, socket) {
  Table.findById(player.table).then((table) => {
    Chair.find({table: table, isTaken: true}).sort({number: 1}).then((chairs) => {
      if(holdems[player.table] == null) {
        CreateHoldem(table.maxStake, table.minStake, table).then((holdem) => {
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

function AddPlayerToNotStartedGame (table, chairs, player, holdemNsp, socket) {
  if(table.chairs.length == 2) {
    console.log('Bu iki kişilik oyun zaman sayacı olmayacak');
    if(chairs.length == 2 ) {
      StartHoldem(table, holdemNsp, socket);
    } else {
      holdemNsp.to(table._id).emit('forTable', `Diğer oyuncular bekleniyor`);
    }
  } else {
    //2 kişilik olmayan masalarda masa dolunca geri sayım olmaması lazım
    if(table.chairs.length == chairs.length) {
      StartHoldem(table, holdemNsp, socket);
      starters[table._id].stop();
      delete starters[table._id];
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

}

function StartHoldem (table, holdemNsp, socket) {
  Player.find({table: table, chair: { $ne: null }}).sort({number: 1}).then((players) => {
    players.forEach((pl) => {
      pl.holdem = holdems[table._id];
      pl.isInGame = true;
      pl.save();
    });
    holdemNsp.to(table._id).emit('forTable', `Oyun Başladı:`);
      AssignChairRoles(table, holdemNsp).then((chairs) => {
        var ChairsToSend = [{}];
        chairs.forEach((chToSend, idx, chairs) => {
          ChairsToSend[idx] = {_id: chToSend._id, role: chToSend.role}
        });
        var whoseTurnChair = chairs.find(ch => ch.isMyTurn == true);
        var whoseTurnPlayer = players.find(pl => pl.chair.toString() == whoseTurnChair._id.toString());
        holdems[table._id].whoseTurnChair = whoseTurnChair;
        holdems[table._id].whoseTurnPlayer = whoseTurnPlayer;
        table.isGamePlaying = true;
        table.turnType = 'preFlop';
          table.save().then((table) => {
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
            MaxBetAmountsForPlayers(table._id).then((holdemFromFunc) =>{
              holdems[table._id].save().then((holdem) => {
                players.forEach((pl) => {
                  var playerInHoldem = holdems[table._id].players.find(plHoldem => plHoldem._id.toString() == pl._id.toString());
                  var playerInDB = players.find(plDB => plDB._id.toString() == playerInHoldem._id.toString());
                  holdemNsp.to("/holdem#" + pl.socketId).emit('gameStarted', playerInHoldem.card1, playerInHoldem.card2, playerInDB.chair, JSON.stringify(ChairsToSend));
                });

                TakeBigBlindAndSmallBlind(holdem._id).then((holdemFromBB) => {
                  var myGetRespondFromPlayer = new GetRespondFromPlayer(holdemNsp, holdem._id, table);
                  responds[table._id] = myGetRespondFromPlayer;
                });
              });
            });
          });
        });
      });
}

function GetRespondFromPlayer(holdemNsp, holdemId, table) {
  AllTurnInfo(holdemNsp, holdemId).then((holdem) => {
    var t = holdem.turnCountdown;
    console.log("timer: " + t);
    var timerObj = setInterval(() => {
        t--;
        holdemNsp.to(table._id).emit('timer', t);
        if(t == 0) {
          this.stop();
          if(responds[table._id] != null) {
            delete responds[table._id];
          }
          //Burada Auto respond diye bir fonksiyon çağırılması lazım
          ChangeTurn(holdemNsp, holdemId);
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

function ChangeTurn(holdemNsp, holdemId) {
  return new Promise((resolve, reject) => {
    Holdem.findById(holdemId).then((holdem) => {
      Table.findOne(holdem.table).then((table) => {
        Chair.find({table: table, isTaken: true, canPlay: true}).sort({number: 1}).then((chairs) => {
        Player.find({table: table, isInGame: true, chair: { $ne: null }, isAllIn: false, isFold: false}).then((players) => {

            var turn = chairs.find(ch => ch.isMyTurn == true);
            var nextTurn;
            var index = 0;
            var dummyLength = chairs.length;
            var dummyChairsArray = [];
            dummyChairsArray.push(turn);
            var isCountinue = false;

            for (var i = 0; i < dummyLength; i++) {
              if(chairs[i] != null) {
                if (chairs[i].number == turn.number) {
                  index = i;
                  isCountinue = true;
                } else if (isCountinue) {
                  dummyChairsArray.push(chairs[i]);
                }
              }
            }

            for (var i = 0; i < index; i++) {
              if(chairs[i] != null) {
                if (chairs[i].number != turn.number) {
                  dummyChairsArray.push(chairs[i]);
                }
              }
            }

            for (var i = 0; i < dummyChairsArray.length; i++) {
              if(i == 0) {
                dummyChairsArray[i].isMyTurn = false;
              } else if(i == 1) {
                dummyChairsArray[i].isMyTurn = true;
                holdem.whoseTurnChair = dummyChairsArray[i];
                holdem.whoseTurnPlayer = players.find(pl => pl.chairNumber == dummyChairsArray[i].number);
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
            holdem.save().then((holdem) => {
              var myGetRespondFromPlayer = new GetRespondFromPlayer( holdemNsp, holdemId, table);
              responds[table._id] = myGetRespondFromPlayer;
              resolve(holdem);
            });

          });
        });
      });
    });
  });
}

function AllTurnInfo(holdemNsp, holdemId) {
  return new Promise((resolve, reject) => {
    Holdem.findById(holdemId, '-shuffleCards -players').then((holdem) => {
      Table.findById(holdem.table).then((table) => {
        Player.find({holdem: holdem, isInGame: true}, '-password -role -socketId').then((players) => {
          Chair.find({table: table}).then((chairs) => {
            let whoseTurnChair = chairs.find(ch => ch._id.toString() == holdem.whoseTurnChair.toString());
            let whoseTurnPlayer = players.find(pl => pl._id.toString() == holdem.whoseTurnPlayer.toString());
            let respondedChair = null;
            let respondedPlayer = null;
            if(holdem.isFirstMoveMaked == true) {
              respondedChair = chairs.find(ch => ch._id.toString() == holdem.respondedChair.toString());
              respondedPlayer = players.find(pl => pl.chair.toString() == holdem.respondedChair.toString());
            }
            holdemNsp.to(table._id).emit('allTurnInfo', JSON.stringify(holdem), JSON.stringify(players), JSON.stringify(whoseTurnPlayer), JSON.stringify(whoseTurnChair), JSON.stringify(respondedPlayer), JSON.stringify(respondedChair));
            resolve(holdem);
          });
        });
      });
    });
  });
}

function MaxBetAmountsForPlayers(tableId) {
  return new Promise((resolve, reject) => {
    playersInGamaBalanceArray = [];
    playersInGamaBalanceArrayNoDuplicate = [];
    var maxInGameBalance;
    var minInGameBalance;
    Player.find({table: tableId, isInGame: true, isAllIn: false, isFold: false}).then((players) => {
      players.forEach((pl) => {
        playersInGamaBalanceArray.push(pl.inGameBalance);
      });

      let uniq = a => [...new Set(a)];
      playersInGamaBalanceArrayNoDuplicate = uniq(playersInGamaBalanceArray);
      maxInGameBalance = Math.max.apply(null, playersInGamaBalanceArray);
      minInGameBalance = Math.min.apply(null, playersInGamaBalanceArray);
      playersInGamaBalanceArray.sort(function(a,b){return a - b});

      holdems[tableId].maxAmounInTheGame = maxInGameBalance;
      holdems[tableId].minAmountInTheGame = minInGameBalance;

      holdems[tableId].save().then((holdem) => {
        resolve(holdem);
      });
    });
  });
}

function AssignChairRoles (table, holdemNsp) {
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
          player.holdem = holdems[table._id];
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
          player.holdem = holdems[table._id];
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
              player.holdem = holdems[table._id];
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
              player.holdem = holdems[table._id];
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
              player.holdem = holdems[table._id];
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
              player.holdem = holdems[table._id];
              player.save();
            });

            holdems[table._id].players.push(ch.player);
          } else {
            ch.role = null;
            ch.subRole = null;
            ch.isMyTurn = false;
            Player.findOne({chair: ch}).then((player) => {
              player.isMyTurn = ch.isMyTurn;
              player.holdem = holdems[table._id];
              player.save();
            });

            holdems[table._id].players.push(ch.player);
          }
          ch.save().then((newChair) => {
            if(idx == chairs.length - 1) {
              holdems[table._id].save().then((holdem) => {
                resolve(chairs);
              });
            }
          });
        });
      }

      });
  });
}

function PlayerResponded(moveType, value, tableId, playerId, holdemNsp, holdemId) {
  console.log('respond type: '  + moveType);
  Holdem.findById(holdemId).then((holdem) => {
    Table.findById(tableId).then((table) => {
      Chair.find({table: table, isTaken: true}).then((chairs) => {
        Player.find({holdem: holdem, isInGame: true, isFold: false, isAllIn: false}).then((players) => {
          if(table.isGamePlaying == true) {
            var respondedPlayer = players.find(pl => pl._id.toString() == playerId);
              if(respondedPlayer._id.toString() == playerId) {
                if(responds[tableId] != null) {
                  CreateHoldemMove(moveType, value, tableId, playerId, holdemNsp, holdem._id).then((player) => {
                    responds[tableId].stop();
                    delete responds[tableId];
                    ChangeTurn(holdemNsp, holdemId).then((holdem) => {
                      MaxBetAmountsForPlayers(table._id).then((holdem) => {
                        //

                      });
                    });
                  });
                } else {
                  console.log('No respond counter was found');
                }
              } else {
                console.log('Its not your turn');
              }
            } else {
            console.log('Game is not started yet');
          }

        });
      });
    });
  });
}

function CreateHoldemMove(moveType, value, tableId, playerId, holdemNsp, holdemId) {
  return new Promise((resolve, reject) => {
    Holdem.findById(holdemId).then((holdem) => {
      HoldemPot.findOne({holdem: holdem, potIsClosed: false}).then((holdemPot) => {
        Player.find({holdem: holdemId, isInGame: true, isAllIn: false, isFold: false}).then((players) => {
          var respondedPlayer = players.find(pl => pl._id.toString() == playerId);
          respondedPlayer.lastMoveType = moveType;
          var moveNumber = 0;
          var moveCount = 1;
          if(holdem.holdemMove.length > 0) {
            moveNumber = holdem.holdemMove.length + 1;
            moveCount = holdem.holdemMove.length + 1;
          }
          var holdemMove = new HoldemMove({moveNumber: moveNumber, moveType: moveType, value: value, player: respondedPlayer, explanation: `${respondedPlayer.name} isimli oyuncu ${holdem.holdemNumber} numaralı oyunda ${moveType} diyerek bakiyesini ${value} birim değiştirdi`});

          if(value != 0) {
            var balanceMove = new BalanceMove({value: -value, type: 'holdemMove', moveType: moveType, holdemMove: holdemMove, player: respondedPlayer, holdem: holdem, explanation: `${respondedPlayer.name} isimli oyuncu ${holdem.holdemNumber} numaralı oyunda ${moveType} diyerek bakiyesini ${value} birim değiştirdi`});
            balanceMove.save();
            if(moveType == 'allIn') {
              console.log('All-in dedi');
            } else {
              ChangePlayerBalanceAndHoldemAmount(respondedPlayer, balanceMove, holdem).then((holdemFromFunc) => {
                //
              });
            }

          } else {
            //Bet'ten gelen Value 0 ise
            if(moveType == 'fold') {
              console.log('Fold dedi');
            } else {
              //
            }
          }
          holdem.holdemMove.push(holdemMove);
          if(holdem.isFirstMoveMaked == false) {
            holdem.isFirstMoveMaked = true;
          }
          holdem.respondedPlayer = respondedPlayer;
          holdem.respondedChair = respondedPlayer.chair

          holdem.save().then((holdem) => {
            holdemPot.save().then((holdemPot) => {
              holdemMove.save().then((holdemMove) => {
                respondedPlayer.save().then((player) => {
                  resolve(respondedPlayer);
                });
              });
            });
          });
        });
      });
    });
  });
}

function ChangePlayerBalanceAndHoldemAmount(player, balanceMove, holdem) {
  return new Promise((resolve, reject) => {
    var value = (-1 * balanceMove.value);
    player.inGameBalance += balanceMove.value;
    player.totalBetAmount += value;
    player.lastBetAmount = value;
    player.lastMoveType = balanceMove.moveType;
    holdem.totalBetAmount += value;
    if(holdem.currentBetAmount < value) {
      holdem.currentBetAmount = value;
      holdem.minBetAmount = value * 2;
    }
    player.save().then((player) => {
      holdem.save().then((holdem) => {
        resolve(holdem);
      });
    });
  });
}

function Fold() {}

function Allin () {
  var dummyPotAmount = 0;
  var dummyNewPotAmount = 0;

            //Eğer oyuncu Allin çektiyse ve koyduğu miktar Potun limitinden az ise, Bu kullanıcının lastBetAmount'unu al, masadaki DİĞER all in çekmeyen kullanıcıların sayısı ile çarp onlar bu POTta kalsın, yeni bir POT oluştur
            if(moveType == 'allIn' || moveType == 'SBandAllin' || moveType == 'BBandAllin') {

            }

  //Eğer Player Allin çekti ise bu fonksiyonu kullan
  if(value < holdem.currentPotLimit) {
    var newHoldemPot = new HoldemPot();
    players.forEach((pl) => {
      if(pl._id.toString() == player._id.toString()) {
        dummyPotAmount += value;
      } else {
        if(pl.lastBetAmount <= value) {
          dummyPotAmount += pl.lastBetAmount;
        } else {
          dummyPotAmount += value;
          dummyNewPotAmount += (pl.lastBetAmount - value);
          //Yeni oluşturulan Pot'a playerları Yeni Pot'a kalan miktarları ile beraber import et

          var playerToPush = {
            player: pl,
            amount: dummyNewPotAmount
          };
          newHoldemPot.playersInThePot.push(playerToPush);
        }
      }
    });
    newHoldemPot.save();
  } else if(value == holdem.currentPotLimit) {

  } else {
    //Oyuncunun ortaya Allin çekerek koyduğu para pot limitinin üstünde ise Pot limitini artırıp devam et
  }
}

function LogHoldems () {
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

function TakeBigBlindAndSmallBlind(holdemId) {
  return new Promise((resolve, reject) => {
    var BBPlayer;
    var SBPlayer;
    Holdem.findById(holdemId).then((holdem) => {
      Player.find({holdem: holdem}).then((players) => {
        BBPlayer = players.find(pl => pl.chair.toString() == holdem.bigBlind.toString());
        SBPlayer = players.find(pl => pl.chair.toString() == holdem.smallBlind.toString());
        BBPlayer.inGameBalance -= holdem.bigBlindAmount;
        BBPlayer.totalBetAmount += holdem.bigBlindAmount;
        BBPlayer.lastBetAmount = holdem.bigBlindAmount;
        BBPlayer.lastMoveType = 'Big Blind';
        SBPlayer.inGameBalance -= holdem.smallBlindAmount;
        SBPlayer.totalBetAmount += holdem.smallBlindAmount;
        SBPlayer.lastBetAmount = holdem.smallBlindAmount;
        SBPlayer.lastMoveType = 'Small Blind';

        BBPlayer.save().then((bbplayer) => {
          SBPlayer.save().then((sbplayer) => {
            resolve(holdem);
          });
        });
      });
    });
  });
}


//AddPlayerToStartedGame = () => {}
InitialiseSystem();

module.exports = {
  AddPlayerToHoldem,
  StartHoldem,
  LogHoldems,
  PlayerResponded
}
