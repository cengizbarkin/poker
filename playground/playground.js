require('../config/config');
let {mongoose} = require('../database/mongoose');
const {Table} = require('../game/table');
const {Chair} = require('../game/chair');


Table.findById({_id: "58ba8947a167f230c27a5469"}).then((table)=>{
  console.log(table);
});
