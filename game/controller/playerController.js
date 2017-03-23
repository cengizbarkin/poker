const {Player} = require('../model/player');

Login = (name, password) => {
  return new Promise((resolve, reject) => {
      Player.findOne({
        name: name,
        password: password
      }).then((player) => {
        if(player) {
          resolve(player);
        } else {
          reject('error1');
        }
      });
  });
}

Signup = (name, password, avatar) => {
  return new Promise((resolve, reject) => {
    Player.findOne({
      name: name
    }).then((player) => {
      if(player) {
        reject('error2');
      } else {
        let player = new Player({name: name, password: password, avatar: avatar, table: null, chair: null});
        player.save().then((player) => {
          resolve(player);
        });
      }
    });
  });
}

GetPlayersInTable = (tableId) => {
  return new Promise((resolve, reject) => {
    Player.find({table: tableId}, '-password -role').then((players) => {
      if(players) {
        resolve(players);
      } else {
        reject('Database Error');
      }
    });
  });
}


DataToSendLobby = () => {
  return new Promise((resolve, reject) => {
    Player.find({table: {$ne: null}}, '-password -role').then((players) => {
      if(players) {
        resolve(players);
      } else {
        reject('Database error');
      }
    });
  });
}


module.exports = {
  Login,
  Signup,
  GetPlayersInTable,
  DataToSendLobby
}
