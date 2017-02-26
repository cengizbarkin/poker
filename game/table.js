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

let Table = mongoose.model('table', TableSchema);

module.exports = {
  Table
}
