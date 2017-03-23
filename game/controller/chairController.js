const {Chair} = require('../model/chair');
const {Player} = require('../model/player');

const HoldemController = require('../controller/holdemController');

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


AddPlayerToChair = (playerId, chairId) => {
  return new Promise((resolve, reject) => {
    Player.findById(playerId).then((player) => {
      Chair.findById(chairId).then((chair) => {
        if(player.chair == null && chair.isTaken == false) {
          player.chair = chair._id;
          player.save().then((player) => {
            chair.player = player._id;
            chair.isTaken = true;
            chair.save().then((chair) => {
              resolve(player);
            });
          });
        } else {
          reject('Player can not choose chair');
        }
      });
    });
  });
}


RemovePlayerFromChair = (player) => {
  return new Promise ((resolve, reject) => {
    if(player.chair != null) {
      Chair.findById(player.chair).then((chair) => {
        chair.isTaken = false;
        chair.player = null;
        chair.save().then((chair) => {
          player.chair = null;
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

module.exports = {
  CreateChair,
  AddPlayerToChair,
  RemovePlayerFromChair,
  DataToSendLobby,
  GetChairsInTable
}
