let {mongoose} = require('../../database/mongoose');

let HoldemSchema = new mongoose.Schema({
  holdemNumber: {
    type: Number
  },
  isStarted: {
    type: Boolean,
    default: false
  },
  shuffleCards: {
    type: [String]
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'table'
  },
  maxAmounInTheGame: {
    type: Number,
    default: 0
  },
  minAmountInTheGame: {
    type: Number,
    default: 0
  },
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chair'
  },
  smallBlind: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chair'
  },
  bigBlind: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chair'
  },
  holdemMove: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'holdemMove'
  }],
  players: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'player'
    },
    card1: {
      type: String
    },
    card2: {
      type: String
    }
  }],
  whoseTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chair'
  },
  turnIsOver: {
    type: Boolean,
    default: false
  },
  turnCountdown: {
    type: Number,
    default: 20
  },
  turnType: {
      type: String,
      enum: ['preFlop', 'flop', 'turn', 'river'],
      default: 'preFlop'
  },
  smallBlindAmount: {
    type: Number
  },
  bigBlindAmount: {
    type: Number
  }
});

let Holdem = mongoose.model('holdem', HoldemSchema);

module.exports = {
  Holdem
}
