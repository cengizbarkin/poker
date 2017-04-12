let {mongoose} = require('../../database/mongoose');

let ChairSchema = new mongoose.Schema({
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'table'
  },
  number: {
    type: Number
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'player'
  },
  isTaken: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['dealer', 'bigBlind', 'smallBlind', null],
    default: null
  },
  subRole: {
    type: String,
    enum: ['smallBlind', null],
    default: null
  },
  canPlay: {
    type: Boolean,
    default: true
  },
  socketId: {
    type: String
  },
  isMyTurn: {
    type: Boolean,
    default: false
  }
});

let Chair = mongoose.model('chair', ChairSchema);

module.exports = {
  Chair
}
