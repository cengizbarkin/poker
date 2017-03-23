const {Table} = require('../model/table');
const {Chair} = require('../model/chair');
const {Player} = require('../model/player');
const {Saloon} = require('../model/saloon');

const ChairController = require('../controller/chairController');
var shortid = require('shortid');
var tables = [];

CreateTable = (name, numberOfPlayers, saloonName, minStake, minBuyin) => {
  return new Promise((resolve, reject) => {
    Saloon.findOne({name: saloonName}).then((saloon) => {
      let table = new Table({'name': name, 'saloon': saloon._id, 'numberOfPlayers': numberOfPlayers, 'minStake': minStake, 'maxStake': minStake * 2, 'minBuyin': minBuyin, 'maxBuyin': minBuyin * 20});
      ChairController.CreateChair(table).then((chairs) => {
        table.chairs.push.apply(table.chairs, chairs);
        table.save().then((table) => {
          resolve(table);
        });
      });
    });
  });
}

GetAllTables = () => {
  return new Promise((resolve, reject) => {
    Table.find({}).then((data) => {
      if(data) {
        resolve(data);
      } else {
        reject('Database Error!');
      }
    });
  });
}


AddPlayerToTable = (player, tableId) => {
 return new Promise((resolve, reject) => {
   Table.findById(tableId).then((table) => {
     table.players.push(player);
     player.table = table._id;
     player.saloon = table.saloon;
     table.save().then((table) => {
       player.save().then((player) => {
         resolve(table);
       }, (err) => {
         reject('Database Error!');
       });
     });
   });
 });
}

RemovePlayerFromTable = (player) => {
  return new Promise((resolve, reject) => {
    if(player.table != null) {
      Table.findOne({_id: player.table}).then((table) => {
        table.players.splice(player, 1);
        player.table = null;
        player.saloon = null;
        table.save().then((table) => {
          player.save().then((player) => {
            resolve(table);
          });
        });
      });
    } else {
      reject('Player does not have a table');
    }
  });
}

GetTableDetails = (tableId) => {
  return new Promise((resolve, reject) => {
    Table.findById(tableId).then((table) => {
      resolve(table);
    }, (err) => {
      reject('Database Error!');
    });
  });
}

DataToSendLobby = () => {
  return new Promise((resolve, reject) => {
    Table.find({}, '-players -chairs').then((tables) => {
      if(tables) {
        resolve(tables);
      } else {
        reject('Database error');
      }
    });
  });
}


module.exports = {
  CreateTable,
  GetAllTables,
  AddPlayerToTable,
  RemovePlayerFromTable,
  GetTableDetails,
  DataToSendLobby
}
