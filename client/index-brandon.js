if (!navigator.serviceWorker.controller) {
  navigator.serviceWorker.register('sw-brandon.js', {
    scope: '.'
  }).then(function(registration) {
    console.log('The service worker has been registered ', registration);
  });
}
// var button = document.getElementById('btnComment');
// var msgQueue = [];

window.addEventListener('online', function() {
  // sendQueue();
  console.log('Heard "online"');
  mjb.emptyQueue();
  // button.setAttribute('onclick', 'sendMessage()');
});

window.addEventListener('offline', function() {
  console.log('Heard "offline"');
  // button.setAttribute('onclick', 'queueMessage()');
});

window.mjb = window.mjb || {

  deferredQueue: [],

  sendOrQueue: function(onlineFunc) {
    if (!navigator.onLine) {
      console.log('offline mode');
      this.deferredQueue.push(onlineFunc);
      // this.deferredQueue.push({
      //   data: data,
      //   callback: onlineFunc
      // });
      console.log('dQ', this.deferredQueue);
    } else {
      console.log('online mode')
      return onlineFunc();
    }
  },

  emptyQueue: function() {
    return this.deferredQueue.forEach(function(deferredFunc) {
      return deferredFunc();
    })
  }
};
