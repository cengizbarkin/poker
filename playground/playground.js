require('../config/config');
let {mongoose} = require('../database/mongoose');
const {Table} = require('../game/model/table');
const {Chair} = require('../game/model/chair');
const {Player} = require('../game/model/player');
const {Terminal} = require('../game/model/terminal');
const {HoldemPot} = require('../game/model/holdemPot');





InitialiseSystem = () => {
  Terminal.findOne({}).then((terminal) => {
    if(terminal) {
      terminal.holdemNumber++;
      terminal.save();
    } else {
      console.log('There is no terminal');
      let terminal = new Terminal();
      terminal.save();
    }
  });
}

InitialiseSystem();
