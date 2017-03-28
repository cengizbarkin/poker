var socket = io();

var tableButton = jQuery('#createTable');
var logButton = jQuery('#logPlayers');

var saloonButton = jQuery('#createSaloon');
var createSistemUser = jQuery('#createUser');

var createDummyData = jQuery('#createDummyData');
var logChairsButton = jQuery('#logChairsAndRoles');

tableButton.on('click', function () {
  var tableName = jQuery('#tableName').val();
  var numberOfPlayers = jQuery('#numberOfPlayers').val();
  var minStake = jQuery('#minStake').val();
  var minBuyin = jQuery('#minBuyin').val();
  var saloonName = jQuery('#selectSaloon').val();

  tableButton.attr('disabled', 'disabled').text('Creating');
  socket.emit('createTable', {
    tableName: tableName,
    numberOfPlayers: numberOfPlayers,
    saloonName: saloonName,
    minStake: minStake,
    minBuyin: minBuyin
  });
});

createSistemUser.on('click', function () {
  var userName = jQuery('#userName').val();
  var password = jQuery('#password').val();
  var role = jQuery('#selectRole').val();

  tableButton.attr('disabled', 'disabled').text('Creating');
  socket.emit('createSystemUser', {
    name: userName,
    password: password,
    role: role
  });
});


saloonButton.on('click', function(){
  var saloonName = jQuery('#selectSaloon').val();
  socket.emit('createSaloon', saloonName);
});


createDummyData.on('click', function() {
  socket.emit('createDummyData');
});


logButton.on('click', function () {
  socket.emit('logPlayers');
});

logChairsButton.on('click', function () {
  console.log('tıklandı');
  socket.emit('logChairsAndRoles');
});
