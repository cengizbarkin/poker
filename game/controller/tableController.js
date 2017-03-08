const {Table} = require('../model/table');
const {Chair} = require('../model/chair');
const {Player} = require('../model/player');

const ChairController = require('../controller/chairController');
var shortid = require('shortid');
var tables = [];

CreateTable = (name, numberOfPlayers) => {
  return new Promise((resolve, reject) => {
    let table = new Table({'name': name, 'numberOfPlayers': numberOfPlayers});
    ChairController.CreateChair(table).then((chairs) => {
      table.chairs.push.apply(table.chairs, chairs);
      table.save();
    });
  });
}

GetAllTables = () => {
  return new Promise((resolve, reject) => {
    Table.find({}).then((data) => {
      if(data) {
        resolve(data);
      } else {
        reject('Database Error!');
      }
    });
  });
}

AddPlayerToTable = (player, _id, socket, io) => {
  Table.findById(_id).then((table) => {
    table.players.push(player);
    player.table = table._id;
    table.save().then((table) => {
      player.save().then((player) => {
        socket.join(table._id, () => {
          socket.broadcast.to(table._id).emit('forTable', `Masaya birisi geldi: ${player.name}`);
          io.to(socket.id).emit('forPlayer', `Hoş geldin ${player.name}`);
          //Sadece bu masadakileri dinleyip oturmak istedikleri Chair'i eğer müsaitse seçtir.
          
        });
      });
    });
  });
}


RemovePlayerFromTable = (player, socket, io) => {
  if(player.table != null){
  console.log('RemoveTable çağırıldı');
  socket.broadcast.to(player.table).emit('forTable', `Birisi ayrıldı: ${player.name}`);
  Table.findOne({_id: player.table}).then((table) => {
    table.players.splice(player, 1);
    player.table = null;
    socket.leave(table._id);
    table.save().then((table) => {
      player.save().then((player) => {
      io.to(socket.id).emit('returnLobbyCalled');
      });
    });
  });
}}


DataToSendLobby = () => {
  return new Promise((resolve, reject) => {
    Table.find({}, '-players -chairs').then((tables) => {
      if(tables) {
        resolve(tables);
      } else {
        reject('Database error');
      }
    });
  });
}


module.exports = {
  CreateTable,
  GetAllTables,
  AddPlayerToTable,
  RemovePlayerFromTable,
  DataToSendLobby
}
