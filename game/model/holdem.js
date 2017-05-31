let {mongoose} = require('../../database/mongoose');

let HoldemSchema = new mongoose.Schema({
  holdemNumber: {
    type: Number
  },
  isStarted: {
    type: Boolean,
    default: false
  },
  isFirstMoveMaked: {
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
  //Hangi Pot'ların bu oyuna ait olduğu
  holdemPots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'holdemPot'
  }],
  //Tüm oyunculardan All-in ya da Fold çekmemişlerden maxInGameBalance'ı
  maxAmounInTheGame: {
    type: Number,
    default: 0
  },
  //Tüm oyunculardan All-in Yada Fold çekmemişler içerisinde minInGameBalance'ı
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
  moveCount: {
    type: Number,
    default: 0
  },
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
  whoseTurnChair: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chair'
  },
  whoseTurnPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'player'
  },
  respondedChair: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chair'
  },
  respondedPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'player'
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
  },
  //Oyun başladığında BB ile aynı olan değer.
  currentBetAmount:{
    type: Number,
    default: 0
  },
  //Oyun türüne göre her oyuncunun koyması gereken Minimum Bet amount'u. (Bir önceki limitin 2 katı ya da BB kadar fazlası)
  minBetAmount: {
    type: Number,
    default: 0
  },
  totalBetAmount: {
    type: Number,
    default: 0
  }
});

let Holdem = mongoose.model('holdem', HoldemSchema);

module.exports = {
  Holdem
}
