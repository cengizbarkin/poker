require('../config/config');
let {mongoose} = require('../database/mongoose');
const {Table} = require('../game/model/table');
const {Chair} = require('../game/model/chair');


Table.findById({_id: "58ba8947a167f230c27a5469"}).then((table)=>{
  console.log(table);
});

console.log(Math.floor(Math.random() * (10 - 1 + 1)) + 1);
