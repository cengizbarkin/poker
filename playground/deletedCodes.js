function CreateHoldemMove(moveType, value, tableId, playerId, holdemNsp, holdem, respondedPlayer) {
  return new Promise((resolve, reject) => {
    HoldemPot.findOne({holdem: holdem, potIsClosed: false}).then((holdemPot) => {
      Player.find({holdem: holdem, isInGame: true, isAllIn: false, isFold: false}).then((players) => {
        var MovedPlayer = players.find(pl => pl._id.toString() == respondedPlayer._id.toString());
        MovedPlayer.lastMoveType = moveType;
        var moveNumber = 0;
        if(holdem.holdemMove.length) {
          moveNumber = holdem.holdemMove.length + 1;
        }
        var holdemMove = new HoldemMove({moveType: moveType, value: value, player: MovedPlayer, explanation: `${MovedPlayer.name} isimli oyuncu ${holdem.holdemNumber} numaralı oyunda ${moveType} diyerek bakiyesini ${value} birim değiştirdi`});
        if(value != 0) {
          var balanceMove = new Balance({value: -value, type: 'holdemMove', holdemMove: holdemMove, player: MovedPlayer, holdem: holdem, explanation: `${MovedPlayer.name} isimli oyuncu ${holdem.holdemNumber} numaralı oyunda ${moveType} diyerek bakiyesini ${value} birim değiştirdi`});
          MovedPlayer.inGameBalance -= value;
          MovedPlayer.totalBetAmount += value;
          holdemPot.value += value;

          if(holdem.currentBetAMount < value) {
            holdem.currentBetAMount = value;
          }

          if(holdem.minBetAmount < value * 2) {
            holdem.minBetAmount = value * 2;
          }

          balanceMove.save();

          if(moveType == 'call') {
            //
          } else if(moveType == 'raise') {
            //
          } else if(moveType == 'allIn') {
            //
          } else {
            console.log('Something wrong with MoveType and Value');
          }

        } else {
          //Bet'ten gelen Value 0 ise
          if(moveType == 'check') {
            //
          } else if (moveType == 'fold') {
            //
          } else {
            console.log('Something wrong with MoveType and Value');
          }

        }

        //Oyuncunun Pot'a koyduğu para miktarına bağlı olarak Holdem'in minumum Bet miktarını değiştir.
        holdem.holdemMove.push(holdemMove);
        if(holdem.isFirstMoveMaked == false) {
          holdem.isFirstMoveMaked = true;
        }
        holdem.save().then((holdem) => {
          holdemPot.save().then((holdemPot) => {
            holdemMove.save().then((holdemMove) => {
              MovedPlayer.save().then((player) => {
                resolve(MovedPlayer);
              });
            });
          });
        });
      });
    });
  });
}
