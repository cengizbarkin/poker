let {mongoose} = require('../../database/mongoose');

let HoldemSchema = new mongoose.Schema({
  holdemNumber: {
    type: Number
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
  }]
});

let Holdem = mongoose.model('holdem', HoldemSchema);

module.exports = {
  Holdem
}
