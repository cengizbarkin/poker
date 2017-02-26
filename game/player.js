const mongoose = require('mongoose');

let DeviceSchema = new mongoose.Schema({
  name: {
    type: String
  },
  id: {
    type: String,
    required: true
  },
  model: {
    type: String
  }
});

let PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  maxNumberOfDevices: {
    type: Number,
    default: 5
  },
  device: {
    type: [DeviceSchema]
  },
  playerId: {
    type: String
  }
});

let Player = mongoose.model('player', PlayerSchema);

module.exports = {
  Player,
  PlayerSchema
}
