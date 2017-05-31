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
  },
  saloon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'saloon'
  },
  isGamePlaying: {
    type: Boolean,
    default: false
  },
  //smallBlind ile aynı
  minStake: {
    type: Number
  },
  //BigBlind ile aynı
  maxStake: {
    type: Number
  },
  minBuyin: {
    type: Number
  },
  maxBuyin: {
    type: Number
  },
  turnCountdown: {
    type: Number,
    default: 20
  }
});

let Table = mongoose.model('table', TableSchema);

module.exports = {
  Table
}
