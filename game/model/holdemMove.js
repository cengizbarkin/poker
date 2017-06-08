let {mongoose} = require('../../database/mongoose');

let holdemMoveSchema = new mongoose.Schema({
  moveNumber: {
    type: Number
  },
  moveType: {
    type: String,
    enum: ['check', 'call', 'raise', 'fold', 'allIn', 'AutoCheck', 'AutoFold', 'inGameBalance', 'smallBlind', 'bigBlind']
  },
  value: {
    type: Number,
    default: 0
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'player'
  },
  explanation: {
    type: String,
    default: null
  }
});

let HoldemMove = mongoose.model('holdemMove', holdemMoveSchema);

module.exports = {
  HoldemMove
}
