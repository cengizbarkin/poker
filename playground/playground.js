require('../config/config');
let {mongoose} = require('../database/mongoose');
const {Table} = require('../game/model/table');
const {Chair} = require('../game/model/chair');
const {Player} = require('../game/model/player');




Player.find({}).then((players) => {
  console.log(players.findOne(pl => pl.name == 'Asd')._id);
})
