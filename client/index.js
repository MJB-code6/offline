if (!navigator.serviceWorker.controller) {
  navigator.serviceWorker.register('sw.js', {
    scope: '.'
  }).then(function(registration) {
    console.log('The service worker has been registered ', registration);
  });
}

// BRANDON'S CODE
var db;

window.mjb = window.mjb || {};

window.addEventListener('online', function(event) {
  console.log('Heard "online"');

  // JOE'S CODE


  // MASHA'S CODE
	navigator.serviceWorker.controller.postMessage({command: "online", info: true});	
  // BRANDON'S CODE
  // caches.open('PENDING_REQUESTS')
  // .then(function(cache) {
  //   cache.addAll(['/assets/lion.png']);
  //   console.log('[install] Adding to pending requests cache');
  // });
  navigator.serviceWorker.controller.postMessage({command: "online", info: true});
  mjb.emptyQueue();

  // STANDARD CODE

});

window.addEventListener('offline', function(event) {
  console.log('Heard "offline"');

  // JOE'S CODE


  // MASHA'S CODE
	navigator.serviceWorker.controller.postMessage({command: "online", info: false});
  // BRANDON'S CODE
  navigator.serviceWorker.controller.postMessage({command: "online", info: false});

  // STANDARD CODE

});
window.addEventListener('load', function(event) {
  console.log('Heard "load"');

  // JOE'S CODE


  // MASHA'S CODE
//window.postMessage('test-message!!', '/');
  // BRANDON'S CODE
  const dbName = "MJB_DEFERRED";

  var request = indexedDB.open(dbName, 1);

  request.onerror = function(event) {
    console.error("Error:", event);
  };

  request.onupgradeneeded = function(event) {
    db = event.target.result;
console.log("in onupgradeneeded, db", db, event);
    var objectStore = db.createObjectStore("deferredRequests", { keyPath: "domain" });
    // // objectStore.createIndex("requests", "requests", { unique: false });
    // objectStore.transaction.oncomplete = function(event) {
    //   var dRObjectStore = db.transaction("deferredRequests", "readwrite").objectStore("deferredRequests");
    //   dRObjectStore.add({domain: window.location.origin, requests: []});
    // }
  };

  request.onsuccess = function(event) {
    console.log("Success opening dR db:", event);
    db = event.target.result;
console.log("in onsuccess, db", db, event);
      var dRObjectStore = db.transaction("deferredRequests", "readwrite").objectStore("deferredRequests");
      dRObjectStore.add({domain: window.location.origin, requests: []});
  };


  // STANDARD CODE

});


// JOE'S CODE
mjb.cache = function(fileArray, fallback) {
  if(fallback) fileArray.push(fallback);
  var file = {};
  file.command = "cache";
  file.info = fileArray;
  navigator.serviceWorker.controller.postMessage(file);
}

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
				serviceWorker = registration.installing || registration.waiting || registration.active
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
//  This ultimately needs to be moved to browser storage (indexedDB?)
// mjb.deferredRequests = mjb.deferredRequests || [];

mjb.sendOrQueue = function(deferredFunc) {
  if (navigator.onLine) return deferredFunc();
  var objectStore = db.transaction(["deferredRequests"], "readwrite").objectStore("deferredRequests");
  var request = objectStore.get(window.location.origin);
  request.onerror = function(event) {
    console.log("error:", event);
  };
  request.onsuccess = function(event) {
    // Get the old value that we want to update
    var deferredQueue = request.result["requests"];

    // update the value(s) in the object that you want to change
    deferredQueue.push(deferredFunc.toString());

    // Put this updated object back into the database.
    var requestUpdate = objectStore.put(deferredQueue);
     requestUpdate.onerror = function(event) {
       console.log("error:", event);
     };
     requestUpdate.onsuccess = function(event) {
       console.log("successfully updated");
     };
  };
}


mjb.emptyQueue = function() {
  while(navigator.onLine && mjb.deferredRequests.length) {
    (mjb.deferredRequests.shift())();
  }
}

// STANDARD CODE
