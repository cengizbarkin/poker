const {Chair} = require('../model/chair');
var shortid = require('shortid');


CreateChair = (table) => {
  return new Promise((resolve, reject) => {
    let chairs = [];
    for (var chairOrder = 0; chairOrder < table.numberOfPlayers; chairOrder++) {
      let chair = new Chair({number: chairOrder});
      chairs.push(chair);
      chair.save().then((chair) => {
        if(chairs.length == table.numberOfPlayers) {
          resolve(chairs);
        }
      });
    }
  });
}

AddPlayerToChair = (player, table, chairId, socket, io) => {
  Chair.findById({_id: chairId}).then((chair) => {
    chair.player = player;
    console.log(chair);
    player.chair = chair._id;
    chair.isTaken = true;
    socket.broadcast.to(table._id).emit('forTable', `Sandalyenin biri alındı: ${player.chair}`);
    chair.save();
    player.save();
  });
}

RemovePlayerFromChair = (player, socket, io) => {
  if(player.chairId != null) {
    Chair.findById({_id: player.chairId}).then((chair)=>{
      console.log(chair);
      chair.player = null;
      chair.isTaken = false;
      player.chairId = null;
      chair.save();
      player.save();
    });
  }
}

module.exports = {
  CreateChair,
  AddPlayerToChair,
  RemovePlayerFromChair
}
