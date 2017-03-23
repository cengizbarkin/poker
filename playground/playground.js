require('../config/config');
let {mongoose} = require('../database/mongoose');
const {Table} = require('../game/model/table');
const {Chair} = require('../game/model/chair');
const {Player} = require('../game/model/player');


var seats = Math.floor(Math.random() * 3) + 1;
console.log(seats);
