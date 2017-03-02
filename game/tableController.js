// Create Table
// Add Players to given table
// Control everything about a table
const {Table} = require('./table');
var shortid = require('shortid');
var tables = [];

CreateTable = (name, playerNumber) => {
  return new Promise((resolve, reject) => {
    let table = new Table({'name': name, 'playerNumber': playerNumber, 'tableId': shortid.generate()});
    table.save().then((table) => {
      tables[table.tableId] = table;
      resolve(table);
    }, (err) => {
      reject('Error while Creating Table');
    });
  });
}

GetAllTables = () => {
  return new Promise((resolve, reject) => {
    Table.find({}).then((data) => {
      tables = data;
      if(data) {
        resolve(data);
      } else {
        reject('Database Error!');
      }
    });
  });
}

AddPlayerToTable = (player, tableId, socket, io) => {
  Table.findOne({tableId: tableId}).then((table) => {
    table.players.push({name: player.name, playerId: player.playerId});
    table.save();
    socket.join(table.tableId, () => {
      //io.to(table.tableId).emit('table', `Masaya birisi geldi: ${table.name}`);
      socket.broadcast.to(table.tableId).emit('table', `Masaya birisi geldi: ${table.name}`);
      //io.sockets.socket(socket.id).emit('table');
      io.to(socket.id).emit('table', 'Hoş geldin');
    });

  });
}

module.exports = {
  CreateTable,
  GetAllTables,
  AddPlayerToTable
}
