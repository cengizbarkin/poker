let {mongoose} = require('../../database/mongoose');

let HoldemSchema = new mongoose.Schema({
  holdemNumber: {
    type: Number
  },
  shuffleCards: {
    type: [String]
  }
});

let Holdem = mongoose.model('holdem', HoldemSchema);

module.exports = {
  Holdem
}
