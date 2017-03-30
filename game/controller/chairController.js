const {Chair} = require('../model/chair');
const {Player} = require('../model/player');
const {HoldemMove} = require('../model/holdemMove');

CreateChair = (table) => {
  return new Promise((resolve, reject) => {
    let chairs = [];
    for (var chairOrder = 0; chairOrder < table.numberOfPlayers; chairOrder++) {
      let chair = new Chair({number: chairOrder, table: table});
      chairs.push(chair);
      chair.save().then((chair) => {
        if(chairs.length == table.numberOfPlayers) {
          resolve(chairs);
        }
      });
    }
  });
}

AddPlayerToChair = (playerId, chairId, inGameBalance) => {
  return new Promise((resolve, reject) => {
    Player.findById(playerId).then((player) => {
      Chair.find({table: player.table}).sort({number: 1}).then((chairs) => {
        Chair.findById(chairId).then((chair) => {
          if(player.balance < inGameBalance) {
            reject('Not enough cash');
          } else {
            if(player.chair == null && chair.isTaken == false) {
              chair.role = 'none';
              chair.subRole = 'none';
              chair.player = player._id;
              chair.socketId = player.socketId;
              chair.isTaken = true;
              player.chair = chair._id;
              var newHoldemMove = new HoldemMove({moveType: 'inGameBalance', value: inGameBalance, player: playerId, explanation: `ID'si ${playerId} olan kullanıcı chair'e ${inGameBalance} miktar bakiye ile oturdu`});
              newHoldemMove.save().then((holdemMove) => {
                  player.balance -= holdemMove.value;
                  player.inGameBalance = holdemMove.value;
                  player.isInGame = true;
                  player.chairNumber = chair.number;
                  player.save().then((player) => {
                    chair.save().then((chair) => {
                      resolve(player);
                    });
                  });
              });
            } else {
                  reject('Player can not choose chair');
                }
            }
          });
      });
    });
  });
}

RemovePlayerFromChair = (player) => {
  return new Promise ((resolve, reject) => {
    if(player.chair != null) {
      Chair.findById(player.chair).then((chair) => {
        chair.role = 'none';
        chair.subRole = 'none';
        chair.isTaken = false;
        chair.player = null;
        chair.socketId = null;
        chair.save().then((chair) => {
          player.chair = null;
          player.chairNumber = null;
          player.isInGame = false;
          player.balance += player.inGameBalance;
          player.inGameBalance = 0;
          player.save().then((player) => {
            resolve(player);
          });
        });
      });
    } else {
      reject('Player does not have a chair');
    }
  });
}

DataToSendLobby = () => {
  return new Promise((resolve, reject) => {
    Chair.find({}).then((chairs) => {
      if(chairs) {
        resolve(chairs);
      } else {
        reject('Database error');
      }
    });
  });
}

GetChairsInTable = (tableId) => {
  return new Promise((resolve, reject) => {
    Chair.find({table: tableId}).then((chairs) => {
      if(chairs) {
        resolve(chairs);
      } else {
        reject('Database Error');
      }
    });
  });
}


AssignChairRoles = (chair) => {
  return new Promise((resolve, reject) => {
    Chair.find({table: chair.table, isTaken: true}).sort({number: 1}).then((chairs) => {
      if(chairs.length == 1) {
        chairs[0].role = 'dealer';
        chairs[0].subRole = 'smallBlind';
        chairs[0].save().then((chairs) => {
        resolve(chairs);
        });
      }
      if(chairs.length == 2) {
        var other = chairs.filter(ch => ch.role != 'dealer');
        other[0].role = 'bigBlind';
        other[0].save().then((chair) => {
          resolve(chairs);
        });
      }
      if(chairs.length == 3) {
        var dealer = chairs.filter(ch => ch.role == 'dealer');
        var dummyChairsArray = [];
        var index = dealer[0].number;
        var dummyLength = chairs.length;

        Player.findOne({chair: dealer[0]._id}).then((player) => {
        console.log('Şuan dealer olan: ' + player.name);
        });


        for (var i = index; i < dummyLength; i++) {
            dummyChairsArray.push(chairs[i]);
        }
        for (var i = 0; i < index; i++) {
          dummyChairsArray.push(chairs[i]);
        }

        dummyChairsArray[0].role = 'dealer';
        dummyChairsArray[0].subRolerole = 'none';
        dummyChairsArray[1].role = 'smallBlind';
        dummyChairsArray[1].subRolerole = 'none';
        dummyChairsArray[2].role = 'bigBlind';
        dummyChairsArray[2].subRolerole = 'none';

        dummyChairsArray[0].save().then((chair) => {
          dummyChairsArray[1].save().then((chair) => {
            dummyChairsArray[2].save().then((chair) => {
              resolve(chairs);
            });
          });
        });
      }
      if(chairs.length > 3) {
        var dealer = chairs.filter(ch => ch.role == 'dealer');
        var dummyChairsArray = [];
        var index = dealer[0].number;
        var dummyLength = chairs.length;
        for (var i = index; i < dummyLength; i++) {
            dummyChairsArray.push(chairs[i]);
        }
        for (var i = 0; i < index; i++) {
          dummyChairsArray.push(chairs[i]);
        }
        for (var i = 3; i < dummyChairsArray.length; i++) {
          dummyChairsArray[i].role = 'none';
          dummyChairsArray[i].subRole = 'none';
          dummyChairsArray[i].save((chair) => {
            if(i == dummyChairsArray - 1) {
              resolve(chairs);
            }
          });
        }
      }
    });
  });
}



AssignChairRolesWhenLeave = (chair) => {
  return new Promise((resolve, reject) => {
    Chair.find({table: chair.table}).sort({number: 1}).then((chairs) => {
      var dealer = chairs.filter(ch => ch.role == 'dealer');
      if(dealer[0] != undefined) {
        var dummyChairsArray = [];
        var index = dealer[0].number;
        var dummyLength = chairs.length;
        for (var i = index; i < dummyLength; i++) {
          if(chairs[i].isTaken) {
            dummyChairsArray.push(chairs[i]);
          }
        }
        for (var i = 0; i < index; i++) {
          if(chairs[i].isTaken) {
            dummyChairsArray.push(chairs[i]);
          }
        }
        OrderChairRolers(dummyChairsArray).then((chairs) => {
          resolve(chairs);
        });
      } else {
        OrderChairRolers(chairs).then((newChairs) => {
          resolve(newChairs);
        });
      }
    });
  });
}


OrderChairRolers = (chairs) => {
  console.log('Bu çağırıldı' + chairs.length);
  return new Promise((resolve, reject) => {
    if(chairs.length == 1) {
      chairs[0].role = 'dealer';
      chairs[0].subRole = 'smallBlind';
      chairs[0].save().then((chairs) => {
      resolve(chairs);
      });
    } else if(chairs.length == 2) {
      chairs[0].role = 'dealer';
      chairs[0].subRole = 'smallBlind';
      chairs[1].role = 'bigBlind';
      chairs[0].save().then((chair) => {
        chairs[1].save().then((chair) => {
        resolve(chairs);
        });
      });
    } else if(chairs.length == 3) {
      chairs[0].role = 'dealer';
      chairs[0].subRole = 'none';
      chairs[1].role = 'smallBlind';
      chairs[1].subRole = 'none';
      chairs[2].role = 'bigBlind';
      chairs[2].subRole = 'none';
      chairs[0].save().then((chair) => {
        chairs[1].save().then((chair) => {
          chairs[2].save().then((chair) => {
            resolve(chairs);
          });
        });
      });
    } else if(chairs.length > 3) {
      chairs[0].role = 'dealer';
      chairs[0].subRole = 'none';
      chairs[1].role = 'smallBlind';
      chairs[1].subRole = 'none';
      chairs[2].role = 'bigBlind';
      chairs[2].subRole = 'none';
      for (var i = 3; i < chairs.length; i++) {
        chairs[i].role = 'none';
        chairs[i].subRole = 'none';
      }
      chairs.forEach((ch, idx, chairs) => {
        ch.save().then((newChair) => {
          if(idx == chairs.length - 1) {
            resolve(chairs);
          }
        });
      });
    }
  });
}

module.exports = {
  CreateChair,
  AddPlayerToChair,
  RemovePlayerFromChair,
  DataToSendLobby,
  GetChairsInTable
}
