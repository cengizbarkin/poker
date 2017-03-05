let {mongoose} = require('../../database/mongoose');

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

let Device = mongoose.model('device', DeviceSchema);

module.exports = {
  Device
}
