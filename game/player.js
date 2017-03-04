let {mongoose} = require('../database/mongoose');

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
  maxNumberOfDevices: {
    type: Number,
    default: 5
  },
  device: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'device'
  },
  playerId: {
    type: String
  },
  tableId: {
    type: String
  },
  chairId: {
    type: String
  }
});

let Player = mongoose.model('player', PlayerSchema);

module.exports = {
  Player,
  PlayerSchema
}
