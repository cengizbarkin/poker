let {mongoose} = require('../../database/mongoose');

let holdemPotAmountSchema = new mongoose.Schema({
  potNumber: {
    type: Number,
    default: 0
  },
  value: {
    type: Number,
    default: = 0
  },
  playersInThePot: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'player'
    },
    amount: {
      type: Number,
      default: 0
    }
  }]
});


let HoldemPotAmount = mongoose.model('holdemPotAmount', holdemPotAmountSchema);

module.exports = {
  HoldemPotAmount
}
