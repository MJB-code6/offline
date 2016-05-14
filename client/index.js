if (!navigator.serviceWorker.controller) {
  navigator.serviceWorker.register('sw.js', {
    scope: '.'
  }).then(function(registration) {
    console.log("navigator.serviceWorker", navigator.serviceWorker);
    console.log('The service worker has been registered ', registration);
  });
}

window.mjb = window.mjb || {};

window.addEventListener('online', function(event) {
  console.log('Heard "online"');

  // JOE'S CODE


  // MASHA'S CODE


  // BRANDON'S CODE
  mjb.emptyQueue();


  // STANDARD CODE

});

window.addEventListener('offline', function(event) {
  console.log('Heard "offline"');

  // JOE'S CODE


  // MASHA'S CODE


  // BRANDON'S CODE


  // STANDARD CODE

});

window.addEventListener('load', function(event) {
  console.log('Heard "load"');

  // JOE'S CODE


  // MASHA'S CODE


  // BRANDON'S CODE


  // STANDARD CODE

});


// JOE'S CODE


// MASHA'S CODE


// BRANDON'S CODE


mjb.emptyQueue = function() {

}

// STANDARD CODE
