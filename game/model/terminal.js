let {mongoose} = require('../../database/mongoose');

let TerminalSchema = new mongoose.Schema({
  holdemNumber: {
    type: Number,
    default: 0
  }
});

let Terminal = mongoose.model('terminal', TerminalSchema);

module.exports = {
  Terminal
}
