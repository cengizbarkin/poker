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
const {Table} = require('./game/table');
const publicPath = path.join(__dirname, './public');
let {mongoose} = require('./database/mongoose.js');

let app = express();
let server = http.createServer(app);
let io = socketIO(server);

app.use(express.static(publicPath));
app.use(bodyParser.json());

var players = [];
var tables = [];

io.on('connection', (socket) => {
  console.log('Client Connected');

  var thisPlayer;

  socket.on('login', (name, password, deviceId, deviceName, deviceModel)=> {
    Player.findOne({
      name: name,
      password: password
    }).then((player) => {
      if(player) {
        deviceChecker(player, deviceId)
        .then((device) => {
          console.log('Device bulundu');
          //Player'ı değişken içine atıp arrayin içine atıyouz
          thisPlayer = player;
          players[thisPlayer.playerId] = thisPlayer;
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
                  thisPlayer = player;
                  players[thisPlayer.playerId] = player;
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
              thisPlayer = player;
              players[thisPlayer.playerId] = thisPlayer;
              socket.emit('signupSuccess', `Congratulations you have successfully registered. Remaining device number: ${player.maxNumberOfDevices - player.device.length}`);
            });
          }
        });
      }
    });
  });

  socket.on('lobbyScene', () => {
    //Tüm player ve masa bilgilerini Array olarak kullanıcıya gönder
    Table.find({}).then((data) => {
      tables = data;
      socket.broadcast.emit('lobbyDetails', JSON.stringify(tables));
      socket.emit('lobbyDetails', JSON.stringify(tables));
    });
    console.log('Player comes in to the lobby');
  });

  socket.on('createTable', (tableProps) => {
    let table = new Table({'name': tableProps.tableName, 'playerNumber': tableProps.playerNumber, 'tableId': shortid.generate()});
    table.save().then((table) => {
      console.log('Masa oluşturuldu');
      console.log(table);
      io.sockets.emit('createTable', JSON.stringify(tables));
    });


  });

  socket.on('disconnect', () => {
    console.log('Player disconnected');
    if(thisPlayer != null) {
      console.log('Disconnected player name: ' + thisPlayer.name);
      delete players[thisPlayer.playerId];
    }
    console.log('All players' + players.length);
  });

});


// app.get('/first', (req, res)=> {
//   res.send('Welcome');
// });


server.listen(port, () => {
  console.log(`server is up on ${port}`);
});
