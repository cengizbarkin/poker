require('./config/config');
const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
var shortid = require('shortid');
const port = process.env.PORT;
const {Player} = require('./game/player');
const {Table} = require('./game/table');
const publicPath = path.join(__dirname, './public');
let {mongoose} = require('./database/mongoose');

const TableController = require('./game/tableController');
const PlayerController = require('./game/playerController');
const ChairController = require('./game/chairController');

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
      players[player._id] = player;
      thisPlayer = player;
    });
  });

  socket.on('signup', (name, password, deviceId, deviceName, deviceModel) => {
    PlayerController.Signup(name, password, deviceId, deviceName, deviceModel, socket).then((player)=>{
      players[player._id] = player;
      thisPlayer = player;
    });
  });

  socket.on('lobbyScene', () => {
    //Tüm player ve masa bilgilerini Array olarak kullanıcıya gönder
    TableController.GetAllTables().then((tables) => {
      socket.emit('lobbyDetails', JSON.stringify(tables));
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
    thisPlayer.tableId = _id;
    TableController.AddPlayerToTable(thisPlayer, _id, socket, io);
  });

  socket.on('logPlayers', () => {
    console.log(players);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected');
    if(thisPlayer != null) {
      console.log('Disconnected player name: ' + thisPlayer.name);
      TableController.RemovePlayerFromTable(thisPlayer, socket, io);
      ChairController.RemovePlayerFromChair(thisPlayer, socket, io);
      delete players[thisPlayer._id];
    }
    console.log('All players' + players);
  });

});


// app.get('/first', (req, res)=> {
//   res.send('Welcome');
// });


server.listen(port, () => {
  console.log(`server is up on ${port}`);
});
