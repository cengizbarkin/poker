let {mongoose} = require('../../database/mongoose');

let balanceMoveSchema = new mongoose.Schema({
  value:{
    type: Number
  },
  type: {
    type: String,
    enum: ['holdemMove', 'win', 'deposit', 'withdraw', 'bonus']
  },
  holdemMove: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'holdemMove'
  },
  moveType: {
    type: String,
    enum: ['check', 'call', 'raise', 'fold', 'allIn', 'AutoCheck', 'AutoFold', null],
    default: null
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'player'
  },
  holdem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'holdem'
  },
  explanation: {
    type: String,
    default: null
  }
});



let BalanceMove = mongoose.model('balanceMove', balanceMoveSchema);

module.exports = {
  BalanceMove
}
