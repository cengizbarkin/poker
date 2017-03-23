const {Saloon} = require('../model/saloon');

CreateSaloon = (name) => {
  return new Promise((resolve, reject) => {
    let saloon = new Saloon({name: name});
    saloon.save().then((saloon) => {
      resolve(saloon);
    }, (err) => {
      reject('Database Error')
    });
  });
}

AddTableToSaloon = (tableId, saloonName) => {
  return new Promise((resolve, reject) => {
    Saloon.findOne({name: saloonName}).then((saloon) => {
      saloon.tables.push(tableId);
      saloon.save().then((saloon) => {
        resolve(saloon);
      });
    }, (err) => {
      reject('Database Error');
    });
  });
}



DataToSendLobby = () => {
  return new Promise((resolve, reject) => {
    Saloon.find({}).then((saloons) => {
      if(saloons) {
        resolve(saloons);
      } else {
        reject('Database error');
      }
    });
  });
}


module.exports = {
  CreateSaloon,
  AddTableToSaloon,
  DataToSendLobby
}
