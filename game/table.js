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
     type: [PlayerSchema],
     default: null
  }
});


//Masanın adı ve masadaki oyuncu sayısını gönderen fonksiyon yazılacak


let Table = mongoose.model('table', TableSchema);


module.exports = {
  Table
}
