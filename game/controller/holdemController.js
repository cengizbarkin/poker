const {Table} = require('../model/table');
const {Holdem} = require('../model/holdem');
const {Player} = require('../model/player');


StartHoldem = (table, chairs, socket) => {
  socket.broadcast.to(table._id).emit('forTable', `Oyun Başladı:`);
  Player.find({table: table._id}).then((players) => {
    console.log('Hepiniçe bol janş');
  });
}

module.exports = {
  StartHoldem
}
