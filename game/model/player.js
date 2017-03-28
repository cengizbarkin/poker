let {mongoose} = require('../../database/mongoose');

let PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: 3,
    sparse: true
  },
  password: {
    type: String
  },
  balance: {
    type: Number,
    default: 0
  },
  inGameBalance: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['system', 'admin', 'agent', 'partner', 'player'],
    default: 'player'
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'table'
  },
  chair: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chair'
  },
  avatar: {
    type: String
  },
  saloon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'saloon'
  }
});

let Player = mongoose.model('player', PlayerSchema);

module.exports = {
  Player,
  PlayerSchema
}
