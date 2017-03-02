var socket = io();

var tableButton = jQuery('#createTable');
var logButton = jQuery('#logPlayers');


tableButton.on('click', function () {
  var tableName = jQuery('#tableName').val();
  var playerNumber = jQuery('#playerNumber').val();

  tableButton.attr('disabled', 'disabled').text('Creating');
  socket.emit('createTable', {
    tableName: tableName,
    playerNumber: playerNumber
  });
});


logButton.on('click', function () {
  socket.emit('logPlayers');
});
