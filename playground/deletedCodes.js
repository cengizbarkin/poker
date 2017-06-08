
function CreateHoldemMove(moveType, value, tableId, playerId, holdemNsp, holdemId) {
  return new Promise((resolve, reject) => {
    Holdem.findById(holdemId).then((holdem) => {
      HoldemPot.findOne({holdem: holdem, potIsClosed: false}).then((holdemPot) => {
        Player.find({holdem: holdemId, isInGame: true, isAllIn: false, isFold: false}).then((players) => {
          var respondedPlayer = players.find(pl => pl._id.toString() == playerId);
          respondedPlayer.lastMoveType = moveType;
          var moveNumber = 0;
          var moveCount = 1;
          if(holdem.holdemMove.length > 0) {
            moveNumber = holdem.holdemMove.length + 1;
            moveCount = holdem.holdemMove.length + 1;
          }
          var holdemMove = new HoldemMove({moveNumber: moveNumber, moveType: moveType, value: value, player: respondedPlayer, explanation: `${respondedPlayer.name} isimli oyuncu ${holdem.holdemNumber} numaralı oyunda ${moveType} diyerek bakiyesini ${value} birim değiştirdi`});

          if(value != 0) {
            var balanceMove = new BalanceMove({value: -value, type: 'holdemMove', moveType: moveType, holdemMove: holdemMove, player: respondedPlayer, holdem: holdem, explanation: `${respondedPlayer.name} isimli oyuncu ${holdem.holdemNumber} numaralı oyunda ${moveType} diyerek bakiyesini ${value} birim değiştirdi`});
            balanceMove.save();
            if(moveType == 'allIn') {
              console.log('All-in dedi');
            } else {
              ChangePlayerBalanceAndHoldemAmount(respondedPlayer, balanceMove, holdem).then((holdemFromFunc) => {
                //
              });
            }

          } else {
            //Bet'ten gelen Value 0 ise
            if(moveType == 'fold') {
              console.log('Fold dedi');
            } else {
              //
            }
          }
          holdem.holdemMove.push(holdemMove);
          if(holdem.isFirstMoveMaked == false) {
            holdem.isFirstMoveMaked = true;
          }
          holdem.respondedPlayer = respondedPlayer;
          holdem.respondedChair = respondedPlayer.chair

          holdem.save().then((holdem) => {
            holdemPot.save().then((holdemPot) => {
              holdemMove.save().then((holdemMove) => {
                respondedPlayer.save().then((player) => {
                  resolve(respondedPlayer);
                });
              });
            });
          });
        });
      });
    });
  });
}
