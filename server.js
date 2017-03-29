require('./config/config');
const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const port = process.env.PORT;
const publicPath = path.join(__dirname, './public');
let {mongoose} = require('./database/mongoose');

//Bu bölüm Loglamalar için var silinebilir
const {Chair} = require('./game/model/chair');
const {Player} = require('./game/model/player');
const {HoldemMove} = require('./game/model/holdemMove');
/////////////////////////////////////////////////////

const TableController = require('./game/controller/tableController');
const PlayerController = require('./game/controller/playerController');
const ChairController = require('./game/controller/chairController');
const SaloonController = require('./game/controller/saloonController');
const HoldemController = require('./game/controller/holdemController');

let app = express();
let server = http.createServer(app);
let io = socketIO(server);

const loginNsp = io.of('/login');
const lobbyNsp = io.of('/lobby');
const holdemNsp = io.of('/holdem');

app.use(express.static(publicPath));
app.use(bodyParser.json());

var players = [];

io.on('connection', (socket) => {

  players[socket.id] = null;

  socket.on('createTable', (tableProps) => {
    TableController.CreateTable(tableProps.tableName, tableProps.numberOfPlayers, tableProps.saloonName, tableProps.minStake).then((table) => {
      SaloonController.AddTableToSaloon(table._id, tableProps.saloonName);
    });
  });
  socket.on('createSaloon', (saloonName) => {
    SaloonController.CreateSaloon(saloonName);
  });
  socket.on('createDummyData', () => {
    for (var i = 0; i < 5; i++) {
      SaloonController.CreateSaloon(`Salon ${i + 1}`).then((saloon) => {
        for (var j = 0; j < 5; j++) {
          var seats = Math.floor(Math.random() * 3) + 1;
          if(seats == 1) {
            TableController.CreateTable(`Table ${j + 1}`, 2, saloon.name, j*2, j*2*20);
          }
          if(seats == 2) {
            TableController.CreateTable(`Table ${j + 1}`, 6, saloon.name, j*2, j*2*20);
          }
          if(seats == 3) {
            TableController.CreateTable(`Table ${j + 1}`, 9, saloon.name, j*2, j*2*20);
          }
        }
      });
    }
  });
  socket.on('logPlayers', () => {
    console.log(players);
  });

  socket.on('logChairsAndRoles', () => {
    Chair.find({isTaken: true}).then((chairs) => {

      chairs.forEach((ch) => {
        Player.findById(ch.player).then((player) => {
          console.log(`Player name: ${player.name}..... chairId: ${ch._id}....... role: ${ch.role}....... subRole: ${ch.subRole}`);
        });
      });

    });
  });

  socket.on('disconnect', () => {
    if(players[socket.id] != null) {
      if(players[socket.id].chair != null && players[socket.id].table != null) {
           TableController.RemovePlayerFromTable(players[socket.id]).then((table) => {
             ChairController.RemovePlayerFromChair(players[socket.id]).then((player) => {
               socket.leave(table._id, () => {
                 console.log('Player socket den ayrıldı');
                 delete players[socket.id];
               });
             }, (err) => {
               console.log(err);
             });
           }, (err) => {
             console.log(err);
           });
        } else if(players[socket.id].chair != null && players[socket.id].table == null) {
          ChairController.RemovePlayerFromChair(players[socket.id]).then((chair) => {
            delete players[socket.id];
          }, (err) => {
            console.log(err);
          });
        } else if(players[socket.id].chair == null && players[socket.id].table != null) {
          TableController.RemovePlayerFromTable(players[socket.id]).then((table) => {
            delete players[socket.id];
          }, (err) => {
            console.log(err);
          });
        } else {
          delete players[socket.id];
        }
      }
  });

});
loginNsp.on('connection', (socket) => {
  console.log('Player is in Login Page');
  socket.on('login', (name, password, callback) => {
    PlayerController.Login(name, password, (socket.id).substring(7)).then((player)=>{
      console.log('Player loggedin successfully: ' + player.name);
      players[(socket.id).substring(7)] = player;
      callback(JSON.stringify(player));
    }).catch((err) => {
      socket.emit('defaultError', JSON.stringify(err));
      console.log(err);
    });
  });

  socket.on('signup', (name, password, avatar, callback) => {
    PlayerController.Signup(name, password, avatar).then((player) => {
      callback(JSON.stringify(player));
    }).catch((err) => {
      socket.emit('defaultError', JSON.stringify(err));
      console.log(err);
    });
  });

  socket.on('disconnect', () => {
    if(players[(socket.id).substring(7)] != null) {
      console.log('Player disconnect from Login');
    }

  });


});
lobbyNsp.on('connection', (socket) => {
  console.log('Player is on Lobby');

  TableController.DataToSendLobby().then((tables) => {
    ChairController.DataToSendLobby().then((chairs) => {
      PlayerController.DataToSendLobby().then((players) => {
        SaloonController.DataToSendLobby().then((saloons) => {
          socket.emit('lobbyDetails', JSON.stringify(tables), JSON.stringify(chairs), JSON.stringify(players), JSON.stringify(saloons));
        }).catch((err) => {
          socket.emit('defaultError', JSON.stringify(err));
          console.log(err);
        });
      }).catch((err) => {
        socket.emit('defaultError', JSON.stringify(err));
        console.log(err);
      });
    }).catch((err) => {
      socket.emit('defaultError', JSON.stringify(err));
      console.log(err);
    });
  }).catch((err) => {
    socket.emit('defaultError', JSON.stringify(err));
    console.log(err);
  });

  socket.on('joinTable', (playerId, tableId, callback) => {
    TableController.AddPlayerToTable(players[(socket.id).substring(7)], tableId).then((table) => {
      callback(table._id);
    });
    //Burada gelen Player'ı array den bulup gerekli işlemleri yap
  });


});

holdemNsp.on('connection', (socket) => {
  console.log('Player is on Game Screen');

  socket.on('askForHoldemDetails', (tableId, callback) => {
    TableController.GetTableDetails(tableId).then((table) => {
      ChairController.GetChairsInTable(tableId).then((chairs) => {
        PlayerController.GetPlayersInTable(tableId).then((players) => {
          socket.join(tableId, () => {
            callback(JSON.stringify(chairs), JSON.stringify(players), JSON.stringify(table));
          });
        });
      });
    });
  });

  socket.on('chooseChair', (playerId, chairId, inGameBalance, callback) => {
    ChairController.AddPlayerToChair(playerId, chairId, inGameBalance).then((player) => {
      players[(socket.id).substring(8)] = player;
      lobbyNsp.emit("addPlayerToChair", player._id, player.chair, player.saloon, player.table);
      holdemNsp.to(player.table).emit("addPlayerToChair", player._id, player.name, player.inGameBalance, player.chair, player.avatar);
      callback(player.chair);
    }, (err) => {
      console.log(err);
    });
  });

  socket.on('chairChoosed', (chairId) => {
    HoldemController.AddPlayerToHoldem(players[(socket.id).substring(8)], holdemNsp);
  });

  socket.on('removeChair', (playerId, chairId, callback) => {
    if(players[(socket.id).substring(8)] != null) {
      ChairController.RemovePlayerFromChair(players[(socket.id).substring(8)]).then((player) => {
        players[(socket.id).substring(8)] = player;
        lobbyNsp.emit("removePlayerFromChair", playerId, chairId, player.saloon, players[(socket.id).substring(8)].table);
        holdemNsp.to(players[(socket.id).substring(8)].table).emit("removePlayerFromChair", player._id, chairId);
        callback(player.chair);
      }, (err) => {
        console.log(err);
      });
    }
  });

  socket.on('returnLobby', (playerId, callback) => {
    if(players[(socket.id).substring(8)] != null) {
      if(players[(socket.id).substring(8)].chair != null && players[(socket.id).substring(8)].table != null) {
        let dummyChair = players[(socket.id).substring(8)].chair;
        let dummyTable = players[(socket.id).substring(8)].table;
        let dummySaloon = players[(socket.id).substring(8)].saloon;
        TableController.RemovePlayerFromTable(players[(socket.id).substring(8)]).then((table) => {
          ChairController.RemovePlayerFromChair(players[(socket.id).substring(8)]).then((player) => {
            socket.leave(table._id, () => {
              players[(socket.id).substring(8)] = player;
              lobbyNsp.emit("removePlayerFromChair", player._id, dummyChair, dummySaloon, dummyTable);
              holdemNsp.to(dummyTable).emit("removePlayerFromChair", player._id, dummyChair);
              callback(playerId);
            });
          }, (err) => {
            console.log(err);
          });
        }, (err) => {
          console.log(err);
        });
      } else if(players[(socket.id).substring(8)].table != null && players[(socket.id).substring(8)].chair == null) {
        TableController.RemovePlayerFromTable(players[(socket.id).substring(8)]).then((table) => {
          socket.leave(table._id, () => {
            callback(playerId);
            players[(socket.id).substring(8)].table = null;
          });
        });
      } else {
        callback(playerId);
      }
    }

  });



});




server.listen(port, () => {
  console.log(`server is up on ${port}`);
});
