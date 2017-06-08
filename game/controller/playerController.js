const {Player} = require('../model/player');
const {BalanceMove} = require('../model/balanceMove');

Login = (name, password, socketId) => {
  return new Promise((resolve, reject) => {
      Player.findOne({
        name: name,
        password: password
      }).then((player) => {
        if(player) {
          player.socketId = socketId;
          player.save().then((player) => {
            resolve(player);
          });
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
        let bonus = new BalanceMove({value: 1000, type: 'bonus', player: null, holdem: null});
        let player = new Player({name: name, password: password, avatar: avatar, table: null, chair: null, balance: null});
        bonus.explanation = `${player.name} isimli kullanıcıya deneme amaçlı ${bonus.value} kadar bonus yüklenmiştir`;
        bonus.player = player;
        player.balance = bonus.value;
        player.save().then((player) => {
          bonus.save().then((bonus) => {
            resolve(player);
          });
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
