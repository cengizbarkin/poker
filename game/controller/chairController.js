const {Chair} = require('../model/chair');
const {Player} = require('../model/player');
const {HoldemMove} = require('../model/holdemMove');


var shortid = require('shortid');


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
              chair.player = player._id;
              chair.isTaken = true;
              player.chair = chair._id;
              var newHoldemMove = new HoldemMove({moveType: 'inGameBalance', value: inGameBalance, player: playerId, explanation: `ID'si ${playerId} olan kullanıcı chair'e ${inGameBalance} miktar bakiye ile oturdu`});
              newHoldemMove.save().then((holdemMove) => {
                  player.balance -= holdemMove.value;
                  player.inGameBalance = holdemMove.value;
                  player.save().then((player) => {
                    chair.save().then((chair) => {
                      AssignChairRoles(chair).then((chairs) => {
                        resolve(player);
                      });

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
  console.log('Çağırıldı mı?');
  return new Promise ((resolve, reject) => {
    if(player.chair != null) {
      Chair.findById(player.chair).then((chair) => {
        chair.role = 'none';
        chair.subRole = 'none';
        chair.isTaken = false;
        chair.player = null;
        chair.save().then((chair) => {
          AssignChairRolesWhenLeave(chair).then((chairs)=> {
            player.chair = null;
            player.balance += player.inGameBalance;
            player.inGameBalance = 0;
            player.save().then((player) => {
              resolve(player);
            });
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
    Chair.find({table: chair.table}).sort({number: 1}).then((chairs) => {
      var dealer = chairs.filter(ch => ch.role == 'dealer');

      


      var subSmallBlind = chairs.filter(ch => ch.subRole == 'smallBlind');
      var smallBlind = chairs.filter(ch => ch.role == 'smallBlind');
      var bigBlind = chairs.filter(ch => ch.role == 'bigBlind');

      if(dealer[0] == undefined) {
        chair.role = 'dealer';
        chair.subRole = 'smallBlind';
          chair.save().then((chair) => {
            resolve(chairs);
          });
      } else if (dealer[0] != undefined && dealer[0].subRole == 'smallBlind' && bigBlind[0] == undefined) {
        chair.role = 'bigBlind';
        console.log('Dealer var ve subrole var');
        chair.save().then((chair) => {
          resolve(chairs);
        });
      } else if(dealer[0] != undefined && dealer[0].subRole == 'smallBlind' && bigBlind[0] != undefined) {
        var whoIsNext1 = 0;
        var whoIsNext2 = 0;

          if((chair.number - dealer[0].number) < 0) {
            whoIsNext1 = (chair.number + chairs.length) - dealer[0].number;
          } else {
            whoIsNext1 = dealer[0].number - chair.number;
          }

          if((bigBlind[0].number - dealer[0].number) < 0) {
            whoIsNext2 = (bigBlind[0].number + chairs.length) - dealer[0].number;
          } else {
            whoIsNext2 = dealer[0].number - bigBlind[0].number;
          }

          if(whoIsNext1 > whoIsNext2) {
            bigBlind[0].role = 'smallBlind';
            chair.role = 'bigBlind';
            bigBlind[0].save().then((changedChair) => {
              chair.save().then((chair) => {
                dealer[0].subRole = 'none';
                dealer[0].save().then((oldDealerChair) => {
                  resolve(chairs);
                });
              });
            });

          } else {
            chair.role = 'smallBlind';
            chair.save().then((changedChair) => {
              dealer[0].subRole = 'none';
              dealer[0].save().then((oldDealerChair) => {
                resolve(chairs);
              });
            });
          }
      } else if(dealer[0] != undefined && dealer[0].subRole == 'none' && smallBlind[0] != undefined && bigBlind[0] != undefined) {

        var dummyChairsArray = [];
        var index = dealer[0].number;
        var dummyLength = chairs.length;

        for (var i = index; i < dummyLength; i++) {
          console.log('Bütün değerleri geziyor mu: ' + i);
          if(chairs[i].isTaken) {
            dummyChairsArray.push(chairs[i]);
          }
        }

        for (var i = 0; i < index; i++) {
          if(chairs[i].isTaken) {
            dummyChairsArray.push(chairs[i]);
          }
        }

        for (var i = 0; i < dummyChairsArray.length; i++) {
          if(i == 0) {
            dummyChairsArray[i].role = 'dealer';
            dummyChairsArray[i].subRole = 'none';
          }
          if(i == 1) {
            dummyChairsArray[i].role = 'smallBlind';
            dummyChairsArray[i].subRole = 'none';
          }
          if(i == 2) {
            dummyChairsArray[i].role = 'bigBlind';
            dummyChairsArray[i].subRole = 'none';
          }
          if(i > 2) {
            dummyChairsArray[i].role = 'none';
            dummyChairsArray[i].subRole = 'none';
          }
          dummyChairsArray[i].save();
        }

        resolve(chairs);
      }
    });
  });
}

//Burayı kullanıcı ayrıldıktan ve değişiklikler veritabanına kaydedildikten sonra çağır


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
      chairs[0].save.then((chairs) => {
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
