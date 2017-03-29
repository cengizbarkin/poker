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
  playerHand0:  {
    type: [String]
  },
  playerHand1:  {
    type: [String]
  },
  playerHand2:  {
    type: [String]
  },
  playerHand3:  {
    type: [String]
  },
  playerHand4:  {
    type: [String]
  },
  playerHand5:  {
    type: [String]
  },
  playerHand6:  {
    type: [String]
  },
  playerHand7:  {
    type: [String]
  },
  playerHand8:  {
    type: [String]
  }
});

let Holdem = mongoose.model('holdem', HoldemSchema);

module.exports = {
  Holdem
}
