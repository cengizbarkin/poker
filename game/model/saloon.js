let {mongoose} = require('../../database/mongoose');
const {TableSchema} = require('./table');


let SaloonSchema = new mongoose.Schema({
  name: {
    type: String
  },
  tables: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'table'
  }
});

let Saloon = mongoose.model('saloon', SaloonSchema);

module.exports = {
  Saloon
}
