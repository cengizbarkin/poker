const {Player} = require('./player');
let deviceController = require('./deviceController');

var shortid = require('shortid');

Login = (name, password, deviceId, deviceName, deviceModel, socket) => {
  return new Promise((resolve, reject) => {
      Player.findOne({
        name: name,
        password: password
      }).then((player) => {
        if(player) {
          deviceController.CheckDevice(player, deviceId)
          //deviceChecker(player, deviceId)
          .then((device) => {
            console.log('Device bulundu');
            //Player'ı değişken içine atıp arrayin içine atıyouz
            thisPlayer = player;
            resolve(player);
            socket.emit('loginSuccess', 'Congratulations you have successfully loggedin.', device.name);
          }, (err) => {
            console.log(err);
            if(player.device.length >= player.maxNumberOfDevices){
              socket.emit('defaultError', `You have reached your maximum amount of synchronised device number: ${player.device.length}`);
            } else {
              socket.emit('info', `This device is not synchronized with your account. Do you want to sync? Remaining device number: ${player.maxNumberOfDevices - player.device.length}`);
              socket.on('registerResult', (result) => {
                if(result) {
                  deviceController.RegisterDevice(player, deviceId, deviceName, deviceModel)
                  //deviceRegister(player, deviceId, deviceName, deviceModel)
                  .then((player) => {
                    //console.log('Yeni cihaz kaydedildi');
                    resolve(player);
                    }, (error) => {
                      socket.emit('defaultError', error);
                    });
                  } else {
                    console.log('Kullanıcı cihazı kaydetmek istemedi');
                  }
                });
              }
            });
        } else {
            socket.emit('loginError', `invalid username or password`);
            thisPlayer = null;
        }
      }, (err) => {
        socket.emit('defaultError', JSON.stringify(err));
      });
  });

}
Signup = (name, password, deviceId, deviceName, deviceModel, socket) => {
  return new Promise ((resolve, reject) => {
    Player.findOne({'name': name}, (err, user) => {
      if(user) {
        socket.emit('signupError', 'This Username is taken. Please try another!');
      } else {
        Player.findOne({'device.id': deviceId}).then((data) => {
          if(data) {
            socket.emit('signupError', `This device was synced with another user account`);
          } else {
            let player = new Player({name, password});
            player.save().then((player) => {
              resolve(player);
              socket.emit('signupSuccess', `Congratulations you have successfully registered. Remaining device number: ${player.maxNumberOfDevices - player.device.length}`);
            });
          }
        });
      }
    });
  });
}

module.exports = {
  Login,
  Signup
}
