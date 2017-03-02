var deviceChecker = function(player, deviceId) {

  return new Promise((resolve, reject) => {
    var device = player.device.find(item => item.id === deviceId);
    if(device) {
      resolve(device);
    } else {
      reject('No Registered Device Found');
    }
    device = null;
  });
}

module.exports = deviceChecker;
