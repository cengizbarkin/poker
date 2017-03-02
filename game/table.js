const mongoose = require('mongoose');
const {PlayerSchema} = require('./player');

let TableSchema = new mongoose.Schema({
  name: {
    type: String
  },
  playerNumber: {
    type: Number
  },
  tableId: {
    type: String
  },
  players: {
     type: [PlayerSchema]
  }
});


//Masanın adı ve masadaki oyuncu sayısını gönderen fonksiyon yazılacak

// Player'ı masaya ekleme
/*
let AddPlayerToTable = (player, socket, io) => {
  //console.log(`${player} masaya eklendi`);
  socket.emit("welcomeTable", "Masaya hoş geldin");
  socket.join(player.tableId);
  //socket.broadcast.to(tableId).emit('newMessage');
  //let table = new Table({'name': tableProps.tableName, 'playerNumber': tableProps.playerNumber, 'tableId': shortid.generate()});
  //io.to(player.tableId).emit('newMessage', "Masaya birisi geldi");
}
*/


let Table = mongoose.model('table', TableSchema);


module.exports = {
  Table
}
