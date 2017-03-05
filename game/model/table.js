let {mongoose} = require('../../database/mongoose');
var shortid = require('shortid');
const {PlayerSchema} = require('./player');
const {ChairSchema} = require('./chair');


let TableSchema = new mongoose.Schema({
  name: {
    type: String
  },
  numberOfPlayers: {
    type: Number
  },
  players: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'player'
  },
  chairs: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'chair'
  }
});

let Table = mongoose.model('table', TableSchema);


module.exports = {
  Table
}
