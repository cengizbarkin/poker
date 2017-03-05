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
  role: {
    type: String,
    enum: ['system', 'admin', 'agent', 'partner', 'player'],
    default: 'player'
  },
  maxNumberOfDevices: {
    type: Number,
    default: 5
  },
  device: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'device'
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'table'
  },
  chair: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chair'
  }
});

let Player = mongoose.model('player', PlayerSchema);

module.exports = {
  Player,
  PlayerSchema
}
