let {mongoose} = require('../../database/mongoose');

let PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: 3,
    sparse: true
  },
  password: {
    type: String
  },
  balance: {
    type: Number,
    default: 0
  },
  inGameBalance: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['system', 'admin', 'agent', 'partner', 'player'],
    default: 'player'
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'table'
  },
  chair: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chair'
  },
  holdem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'holdem'
  },
  chairNumber: {
    type: Number
  },
  avatar: {
    type: String
  },
  saloon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'saloon'
  },
  socketId: {
    type: String
  },
  isInGame: {
    type: Boolean,
    default: false
  },
  isMyTurn: {
    type: Boolean,
    default: false
  },
  isAllIn: {
    type: Boolean,
    default: false
  },
  isFold: {
    type: Boolean,
    default: false
  },
  //Player'ın value'da gönderdiği değerler toplamı
  totalBetAmount: {
    type: Number
  },
  //Player'ın Value'da gönderdiği son değer
  lastBetAmount: {
    type: Number
  },
  lastMoveType: {
    type:String
  }
});

let Player = mongoose.model('player', PlayerSchema);

module.exports = {
  Player,
  PlayerSchema
}
