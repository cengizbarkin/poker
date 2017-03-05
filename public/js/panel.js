var socket = io();

var tableButton = jQuery('#createTable');
var logButton = jQuery('#logPlayers');

var createSistemUser = jQuery('#createUser');

tableButton.on('click', function () {
  var tableName = jQuery('#tableName').val();
  var numberOfPlayers = jQuery('#numberOfPlayers').val();

  tableButton.attr('disabled', 'disabled').text('Creating');
  socket.emit('createTable', {
    tableName: tableName,
    numberOfPlayers: numberOfPlayers
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



logButton.on('click', function () {
  socket.emit('logPlayers');
});
