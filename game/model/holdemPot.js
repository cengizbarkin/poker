let {mongoose} = require('../../database/mongoose');

let holdemPotSchema = new mongoose.Schema({
  potNumber: {
    type: Number,
    default: 0
  },
  holdem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'holdem'
  },
  value: {
    type: Number,
    default: 0
  },
  //Her bir oyuncunun amount'u birbirlerine eşit olmak zorunda
  playersInThePot: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'player'
    },
    amount: {
      type: Number,
      default: 0
    }
  }],
  potLimit: {
    type: Number
  },
  potIsClosed: {
    type: Boolean,
    default: false
  }
});

let HoldemPot = mongoose.model('holdemPot', holdemPotSchema);

module.exports = {
  HoldemPot
}
