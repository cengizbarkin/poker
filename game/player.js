const mongoose = require('mongoose');

let DeviceSchema = new mongoose.Schema({
  name: {
    type: String
  },
  id: {
    type: String
  },
  model: {
    type: String
  }
});

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
    type: [DeviceSchema]
  },
  playerId: {
    type: String
  },
  tableId: {
    type: String
  }
});

let Player = mongoose.model('player', PlayerSchema);

module.exports = {
  Player,
  PlayerSchema
}
