const {Table} = require('../model/table');
const {Chair} = require('../model/chair');
const {Holdem} = require('../model/holdem');
const {Player} = require('../model/player');
const {Shuffle} = require('../utils/shuffle');


var holdems = [];
var starters = [];
var holdemNumber = 0;


AddPlayerToHoldem = (player, holdemNsp) => {

  if(holdems[player.table] == null) {

    Table.findById(player.table).then((table) => {
      Chair.find({table: table, isTaken: true}).sort({number: 1}).then((chairs) => {
          var newHoldem = new Holdem({holdemNumber: holdemNumber});
          newHoldem.save().then((holdem) => {
            holdems[table._id] = newHoldem;
            console.log('burada oyun yoktu oluşturuldu: ' + holdems[table._id]);
            holdemNumber++;
            holdemNsp.to(table._id).emit('forTable', `Diğer oyuncular bekleniyor`);
          });
      });
    });

  } else {
    if(holdems[player.table].isStarted == false) {
      console.log('Oyuncunun girmek istediği oyun daha başlamamış');
      AddPlayerToNotStartedGame(player, holdemNsp);

    } else {
      console.log('Oyuncunun girmek istediği oyun başlamış');
    }
  }


}


AddPlayerToNotStartedGame = (player, holdemNsp) => {
  Table.findById(player.table).then((table) => {
    Chair.find({table: table, isTaken: true}).sort({number: 1}).then((chairs) => {
      if(table.chairs.length == 2) {
        console.log('Bu iki kişilik oyun zaman sayacı olmayacak');
        if(chairs.length == 2 ) {
          StartHoldem(table, chairs, holdemNsp);
        } else {
          holdemNsp.to(table._id).emit('forTable', `Diğer oyuncular bekleniyor`);
        }
      } else {
        console.log('Bu 2 den fazla kişilik oyun geri sayım Starter ının başlaması lazım');
        //Eğer masaya ait bir starter başlamamışsa
        if(starters[table._id] == null) {
          var myStarter = new Starter(20, table, chairs, holdemNsp);
          starters[table._id] = myStarter;
        } else {
          starters[table._id].stop();
          delete starters[table._id];
          var myStarter = new Starter(20, table, chairs, holdemNsp);
          starters[table._id] = myStarter;
        }
      }
    });
  });
}

AddPlayerToStartedGame = () => {

}


//Oyunu başlatmadan önce her ihtimale karşı veri tabanına bir daha sorgu çek. Çünkü o esnada birtanesi kalkmış olabilir
StartHoldem = (table, chairs, holdemNsp) => {
Player.find({table: table, isInGame: true}).then((players) => {
  holdemNsp.to(table._id).emit('forTable', `Oyun Başladı:`);
  Player.find({table: table._id}).then((players) => {
    AssignChairRoles(chairs).then((chairs) => {
      holdems[table._id].isStarted = true;

      if(chairs.length == 2) {
        holdems[table._id].dealer = chairs.find(ch => ch.role != 'dealer');
        holdems[table._id].smallBlind = chairs.find(ch => ch.subRole != 'smallBlind');
        holdems[table._id].bigBlind = chairs.find(ch => ch.role != 'bigBlind');
      } else {
        holdems[table._id].dealer = chairs.find(ch => ch.role != 'dealer');
        holdems[table._id].smallBlind = chairs.find(ch => ch.role != 'smallBlind');
        holdems[table._id].bigBlind = chairs.find(ch => ch.role != 'bigBlind');
      }

      holdems[table._id].save().then((holdem) => {

        var suits = ['clubs', 'diamonds', 'spades', 'hearts'];
        var ranks = [ '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A' ];
        var cards = [];

        for (var i = 0; i < suits.length; i++) {
          for (var j = 0; j < ranks.length; j++) {
            cards.push( ranks[j] + suits[i] );
          }
        }

        var newCards = Shuffle(cards);

        //Tüm oyuncuların kağıtlarını dağıt ve veri tabanına kaydet

        console.log(cards);
        holdemNsp.to(table._id).emit('forTable', `Roller atandı ve oyun başladı`);
        holdemNsp.to("/holdem#" + holdems[table._id].dealer.socketId).emit('forPlayer', `Buranın sadece sana gelmesi lazım`);



      });

    });
  });
})

}

AssignChairRoles = (chairs) => {
  return new Promise((resolve, reject) => {
    if(chairs.length == 2) {
      chairs[0].role = 'dealer';
      chairs[0].subRole = 'smallBlind';
      chairs[1].role = 'bigBlind';
      chairs[1].subRole = 'none';
      chairs[0].save().then((chair) => {
        chairs[1].save().then((chair) => {
          resolve(chairs);
        });
      });
    }
    else {
      chairs[0].role = 'dealer';
      chairs[0].subRole = 'none';
      chairs[1].role = 'smallBlind';
      chairs[1].subRole = 'none';
      chairs[2].role = 'bigBlind';
      chairs[2].subRole = 'none';
      chairs[0].save().then((chair) => {
        chairs[1].save().then((chair) => {
          chairs[2].save().then((chair) => {
            resolve(chairs);
          });
        });
      });
    }
  });
}

function Starter(t, table, chairs, holdemNsp) {
    var timerObj = setInterval(() => {
      t--;
      holdemNsp.to(table._id).emit('timer', t);
      if(t==0) {
          StartHoldem(table, chairs, holdemNsp);
          this.stop();
          if(starters[table._id] != null) {
            delete starters[table._id];
          }
      }
    }, 1000);

    this.stop = function() {
        if (timerObj) {
            clearInterval(timerObj);
            timerObj = null;
        }
        return this;
    }
}


module.exports = {
  AddPlayerToHoldem,
  StartHoldem
}
