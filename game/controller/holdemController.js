const {Table} = require('../model/table');
const {Chair} = require('../model/chair');
const {Holdem} = require('../model/holdem');
const {Player} = require('../model/player');



AddPlayerToHoldem = (player, holdemNsp) => {
  Table.findById(player.table).then((table) => {
    Chair.find({table: table, isTaken: true}).then((chairs) => {

      //Eğer Masa 2 kişilikse ve 1 kişi geldiyse 2. kişi için beklet. Eğer dolduysa oyunu başlat.
      if(table.chairs.length == 2) {
        if(chairs.length == 2 && table.isGamePlaying == false) {
          //Burada yeni gelen oyuncu ile beraber oyunu başlat
          StartHoldem(table, chairs, holdemNsp);
        } else {
          //Burada yeni diğer oyuncu için beklenmesi gerektiğini söyle
          holdemNsp.to(table._id).emit('forTable', `Diğer oyuncular bekleniyor`);
        }
      }




      if(chairs.length >= 2 && table.isGamePlaying == false) {
        var countdown = 1000;
        setInterval(function() {
          countdown--;
          holdemNsp.to(table._id).emit("timer", JSON.stringify(countdown));
        }, 1000);
        console.log("Game is started");
        table.isGamePlaying = true;
        table.save();
      } else  if(chairs.length >= 2 && table.isGamePlaying == true){
        console.log("Game is being played");
      } else {
        console.log("Waiting for other players");
      }





    });
  });
}



StartHoldem = (table, chairs, holdemNsp) => {
  holdemNsp.broadcast.to(table._id).emit('forTable', `Oyun Başladı:`);
  Player.find({table: table._id}).then((players) => {
    console.log('Hepiniçe bol janş');
  });
}


module.exports = {
  AddPlayerToHoldem,
  StartHoldem
}
