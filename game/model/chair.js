let {mongoose} = require('../../database/mongoose');

let ChairSchema = new mongoose.Schema({
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'table'
  },
  number: {
    type: Number
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'player'
  },
  isTaken: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['dealer', 'bigBlind', 'smallBlind', 'none'],
    default: 'none'
  },
  subRole: {
    type: String,
    enum: ['smallBlind', 'none'],
    default: 'none'
  },
  canPlay: {
    type: Boolean,
    default: true
  }
});

let Chair = mongoose.model('chair', ChairSchema);

module.exports = {
  Chair
}
