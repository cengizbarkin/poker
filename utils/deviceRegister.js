const {Player} = require('../game/player');

let deviceRegister = (player, deviceId, deviceName, deviceModel) => {
  return new Promise ((resolve, reject) => {
    if(player.device.length >= player.maxNumberOfDevices) {
      reject('You have reached your maximum amount of synchronised device number');
    }
    Player.findOne({'device.id': deviceId}).then((data)=> {
      if(data) {
        reject('This device was synced with another user account');
      } else {
        if(player.device.length < player.maxNumberOfDevices) {
          player.device.push({name: deviceName, id: deviceId, model: deviceModel});
          player.save((err, player) => {
            if(err) {
              reject('Database Error');
            } else {
              resolve(player);
              console.log('Kayıt başarılı');
            }
          });
        }
      }
    });
  });
}

module.exports = deviceRegister;
