require('./config/config');
const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
var shortid = require('shortid');
var deviceChecker = require('./utils/deviceChecker');
var deviceRegister = require('./utils/deviceRegister');
const port = process.env.PORT;
const {Player} = require('./game/player');
const publicPath = path.join(__dirname, './public');
let {mongoose} = require('./database/mongoose.js');

let app = express();
let server = http.createServer(app);
let io = socketIO(server);

app.use(express.static(publicPath));
app.use(bodyParser.json());

var players = [];

io.on('connection', (socket) => {
  console.log('Client Connected');

  socket.on('login', (name, password, deviceId, deviceName, deviceModel)=> {
    Player.findOne({
      name: name,
      password: password
    }).then((player) => {
      if(player) {
        deviceChecker(player, deviceId)
        .then((device) => {
          console.log('Device bulundu');
          socket.emit('loginSuccess', 'Congratulations you have successfully loggedin.', device.name);
        }, (err) => {
          console.log(err);
          if(player.device.length >= player.maxNumberOfDevices){
            socket.emit('defaultError', `You have reached your maximum amount of synchronised device number: ${player.device.length}`);
          } else {
            socket.emit('info', `This device is not synchronized with your account. Do you want to sync? Remaining device number: ${player.maxNumberOfDevices - player.device.length}`);
            socket.on('registerResult', (result) => {
              if(result) {
                deviceRegister(player, deviceId, deviceName, deviceModel)
                .then((player) => {
                  console.log('Yeni cihaz kaydedildi');
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
      }
    }, (err) => {
      socket.emit('defaultError', JSON.stringify(err));
    });
  });
  socket.on('signup', (name, password, deviceId, deviceName, deviceModel) => {
    Player.findOne({'name': name}, (err, user) => {
      if(user) {
        socket.emit('signupError', 'This Username is taken. Please try another!');
      } else {
        Player.findOne({'device.id': deviceId}).then((data) => {
          if(data) {
            socket.emit('signupError', `This device was synced with another user account`);
          } else {
            var playerId = shortid.generate();
            let player = new Player({name, password, device: [{id: deviceId, name: deviceName, model: deviceModel}], playerId});
            player.save().then( (player) => {
              socket.emit('signupSuccess', `Congratulations you have successfully registered. Remaining device number: ${player.maxNumberOfDevices - player.device.length}`);
            });
          }
        });
      }
    });
  });

});


app.get('/first', (req, res)=> {
  res.send('Welcome');
});


server.listen(port, () => {
  console.log(`server is up on ${port}`);
});
