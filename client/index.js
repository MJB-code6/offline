var registration;
if (!navigator.serviceWorker.controller) {
  navigator.serviceWorker.register('sw.js', {
    scope: '.'
  }).then(function(registration) {
    registration =  registration;
		console.log('The service worker has been registered ', registration);
  });
}
window.mjb = window.mjb || {};

window.addEventListener('online', function(event) {
  console.log('Heard "online"');

  // JOE'S CODE


  // MASHA'S CODE
	navigator.serviceWorker.controller.postMessage({command: "online", info: true});	
  // BRANDON'S CODE
  // mjb.emptyQueue();

//  }

  // STANDARD CODE

});

window.addEventListener('offline', function(event) {
  console.log('Heard "offline"');

  // JOE'S CODE


  // MASHA'S CODE
	navigator.serviceWorker.controller.postMessage({command: "online", info: false});
  // BRANDON'S CODE


  // STANDARD CODE

});
window.addEventListener('load', function(event) {
  console.log('Heard "load"');

  // JOE'S CODE


  // MASHA'S CODE
//window.postMessage('test-message!!', '/');
  // BRANDON'S CODE


  // STANDARD CODE

});


// JOE'S CODE


// MASHA'S CODE
// cache the fallback page first

mjb.fallback = function(fallbackPage) {	
	if (!navigator.serviceWorker.controller) {
		console.log("no sw");
		navigator.serviceWorker.register('sw.js', {
			scope: '.'
		}).then(function(registration) {
			var serviceWorker;
			if (registration.installing) {
				var serviceWorker = registration.installing || registration.waiting || registration.active
			}

			if (serviceWorker) {
				console.log(serviceWorker.state);
				serviceWorker.addEventListener('statechange', function(event) {
					console.log(event.target.state);
					if(this.state === 'activated') {
						console.log("ok sw");
						return navigator.serviceWorker.controller.postMessage({command: 'fallback', info: fallbackPage});
					}
				});
			}
		});
	}else {
		console.log("yes sw")
		return navigator.serviceWorker.controller.postMessage({command: 'fallback', info: fallbackPage});
	}
	
//	if(!navigator.serviceWorker.controller) {
//		console.log("no sw");
//		self.addEventListener('statechange', function() {
//			if(this.state === 'activated') {
//				console.log("ok sw");
//				return navigator.serviceWorker.controller.postMessage({command: 'fallback', info: fallbackPage});
//			}
//		});
//	}
}

mjb.fallback("/offline.html");

// BRANDON'S CODE

// mjb.emptyQueue = function() {

//}

// STANDARD CODE
