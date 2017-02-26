var socket = io();

var tableButton = jQuery('#createTable');


tableButton.on('click', function () {
  var tableName = jQuery('#tableName').val();
  var playerNumber = jQuery('#playerNumber').val();

  tableButton.attr('disabled', 'disabled').text('Creating');
  socket.emit('createTable', {
    tableName: tableName,
    playerNumber: playerNumber
  });

});
