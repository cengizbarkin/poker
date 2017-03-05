
const {Player} = require('../model/player');
const {Device} = require('../model/device');

RegisterDevice = (player, deviceId, deviceName, deviceModel) => {
  return new Promise ((resolve, reject) => {
    if(player.device.length >= player.maxNumberOfDevices) {
      reject('You have reached your maximum amount of synchronised device number');
    }
    Device.findOne({id: deviceId}).then((data)=> {
      if(data) {
        reject('This device was synced with another user account');
      } else {
          device = new Device({name: deviceName, id: deviceId, model: deviceModel});
          device.save().then((device) => {
            player.device.push(device);
            player.save((err, player) => {
              if(err) {
                reject('Database Error');
              } else {
                resolve(player);
                console.log('Kayıt başarılı');
              }
            });
          });
        }
    });
  });
}

CheckDevice = (player, deviceId) => {
  return new Promise((resolve, reject) => {
    Device.findOne({id:deviceId}).then((device)=>{
      if(device != null) {
        resolve(device);
      } else {
        reject('No Registered Device Found');
      }
    }, (err) => {
      reject('Database error!');
    });
  });
}

module.exports = {
  RegisterDevice,
  CheckDevice
}
