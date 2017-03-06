require('./config/config');
const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
var shortid = require('shortid');
const port = process.env.PORT;
const {Player} = require('./game/model/player');
const {Table} = require('./game/model/table');
const publicPath = path.join(__dirname, './public');
let {mongoose} = require('./database/mongoose');

const TableController = require('./game/controller/tableController');
const PlayerController = require('./game/controller/playerController');
const ChairController = require('./game/controller/chairController');

let app = express();
let server = http.createServer(app);
let io = socketIO(server);

app.use(express.static(publicPath));
app.use(bodyParser.json());

var players = [];

io.on('connection', (socket) => {
  //console.log('Client Connected');

  var thisPlayer;

  socket.on('login', (name, password, deviceId, deviceName, deviceModel)=> {
    PlayerController.Login(name, password, deviceId, deviceName, deviceModel, socket).then((player)=>{
      thisPlayer = player;
      players[thisPlayer._id] = thisPlayer;
    });
  });

  socket.on('signup', (name, password, deviceId, deviceName, deviceModel) => {
    PlayerController.Signup(name, password, deviceId, deviceName, deviceModel, socket).then((player)=>{
      players[player._id] = player;
      thisPlayer = player;
    });
  });

  socket.on('createSystemUser', (data) =>{
    let player = new Player({'name': data.name, password: data.password, role: data.role, avatar: 1, table:null, chair:null});
    player.save().then((player)=>{
      console.log('Player oluşturuldu' + player);
    }, (err) => {
      console.log(err);
    });
  });

  socket.on('lobbyScene', () => {
    //Tüm player ve masa bilgilerini Array olarak kullanıcıya gönder
    TableController.DataToSendLobby().then((tables) => {
      ChairController.DataToSendLobby().then((chairs) => {
        PlayerController.DataToSendLobby().then((players) => {
          console.log(players);
          socket.emit('lobbyDetails', JSON.stringify(tables), JSON.stringify(chairs), JSON.stringify(players));
        });
      });
      //socket.broadcast.emit('lobbyDetails', JSON.stringify(tables));
    }, (error) => {
      socket.emit('defaultError', error);
    });
  });

  socket.on('createTable', (tableProps) => {
    TableController.CreateTable(tableProps.tableName, tableProps.numberOfPlayers).then((table) => {
      //console.log(`Masa oluştu ${table}`);
    });
      //io.sockets.emit('createTable', JSON.stringify(tables));
  });

  socket.on('joinTable', (_id) => {
    thisPlayer.table = _id;
    TableController.AddPlayerToTable(thisPlayer, _id, socket, io);
  });

  socket.on('logPlayers', () => {
    console.log(players);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected');
    if(thisPlayer != null) {
      delete players[thisPlayer._id];
      console.log('Disconnected player name: ' + thisPlayer.name);
      TableController.RemovePlayerFromTable(thisPlayer, socket, io);
      ChairController.RemovePlayerFromChair(thisPlayer, socket, io);
    }
  });

});


// app.get('/first', (req, res)=> {
//   res.send('Welcome');
// });


server.listen(port, () => {
  console.log(`server is up on ${port}`);
});
