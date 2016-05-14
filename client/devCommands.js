/*
  First argument is the function that should be replaced when offline. The
  second argument is a function defining how the queue of deferred requests is
  built. The third (optional) argument is how the queue is processed when online.
  If no dequeuingFunction is provided, queue will be emptied by shifting
  (removing the first element) and passing each item into original hijackedFunction.
  Developers must be careful to write their hijackedFunction so as not to include
  enqueuing functionality.
*/

// offlineApp.defer(hijackedFunction, enqueuingFunction)
// offlineApp.defer(hijackedFunction, enqueuingFunction, dequeuingFunction)
//
// ex: offlineApp.defer(sendMessage, prepareMessage);
//
// ////////
//     function sendMessage() {
//
//       var obj = prepareMessage();
//       $.ajax({
//         type: 'POST',
//         data: JSON.stringify(obj + 'hi'),
//         contentType: 'application/json; charset=UTF-8',
//         url: './messages',
//       }).then(function(data) {
//         getMessage();
//       });
//     }
// ////////
//
// offlineApp = {
//   defer: function(hijackedFunction, enqueuingFunction, dequeuingFunction) {
//
//   }
// }
var mjb = {};

console.log('devCommands loaded');

function sendMessage(value) {
  console.log('in sendMessage');
  console.log('argument:', value);
  var obj = {
    message: "This is hard coded",
    author: "Brandon"
  };
  mjb.sendOrQueue(obj, function() {
    console.log("If closure is working, obj is:",obj);
    $.ajax({
      type: 'POST',
      data: JSON.stringify(obj),
      contentType: 'application/json; charset=UTF-8',
      url: './messages',
    }).then(function(data) {
      console.log("here's what i found on server", data);
      getMessage();
    });
  });
}

// offline.sub(offlineFunc, onlineFunc) {
//   if (offline.offline) {
//     return offlineFunc;
//   }
//   return onlineFunc;
// }

// offline.defer(offlineFunc, onlineFunc) {
//   if (offline.offline) {
//     return offlineFunc;
//   }
//   return onlineFunc;
// }
//
// offline.deferred = [function1, function2, ...];
//
// offline.on('onlineAgain') {
//   offline.deferred.forEach(function(deferredFunc) {
//     return deferredFunc();
//   });
// }
mjb.deferredQueue = [];

mjb.sendOrQueue = function(data, onlineFunc) {
  if (1 === 0) {
    console.log('offline mode (hard coded to run)');
    mjb.deferredQueue.push({
      data: data,
      callback: onlineFunc
    });
    console.log('dQ', mjb.deferredQueue);
  } else {
    console.log('online mode (hard coded to run)')
    return onlineFunc();
  }
}
