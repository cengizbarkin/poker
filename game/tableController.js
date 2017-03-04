const {Table} = require('./table');
const {Chair} = require('./chair');
const ChairController = require('./chairController');
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
    player.tableId = table._id;
    table.save();
    player.save();
    socket.join(table._id, () => {

      socket.broadcast.to(table._id).emit('table', `Masaya birisi geldi: ${table.name}`);
      io.to(socket.id).emit('table', 'Hoş geldin');
      //Sadece bu masadakileri dinleyip oturmak istedikleri Chair'i eğer müsaitse seçtir.
      socket.on('chooseChair', (chairId) => {
        ChairController.AddPlayerToChair(player, table, chairId, socket, io);
      });
    });
  });
}

RemovePlayerFromTable = (player, socket, io) => {
  Table.findOne({_id: player.tableId}).then((table) => {
    table.players.splice(player, 1);
    player.tableId = null;
    socket.leave(table._id);
    table.save();
    player.save();
  });
}

module.exports = {
  CreateTable,
  GetAllTables,
  AddPlayerToTable,
  RemovePlayerFromTable
}
