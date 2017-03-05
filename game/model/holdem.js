let {mongoose} = require('../../database/mongoose');

let HoldemSchema = new mongoose.Schema({
  holdemNumber: {
    type: Number
  }
});

let Holdem = mongoose.model('holdem', DeviceSchema);

module.exports = {
  holdem
}
