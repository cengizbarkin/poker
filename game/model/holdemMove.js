let {mongoose} = require('../../database/mongoose');

let holdemMoveSchema = new mongoose.Schema({
  moveType: {
    type: String,
    enum: ['check', 'raise', 'fold', 'allIn', 'inGameBalance']
  },
  value: {
    type: Number,
    default: 0
  },
  isSmallBlind: {
    type: Boolean,
    default: null
  },
  isBigBlind: {
    type: Boolean,
    default: null
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
