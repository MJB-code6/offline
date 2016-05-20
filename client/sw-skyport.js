'use strict';
/*function to reset indexDB, cache, and SW
make it so if there are no arguments then it automatically clears all
otherwise they provide an argument it will only clear whatevr argument they provide.

1. clear cache
2. clear index DB
3. register new SW?
4. clear all 3 if no arguments
5. clear only item that is in arguments*/

const CACHE_FIRST = 'precache';
const FALLBACK_CACHE = 'fallback';
var online = true;
var db;
var precacheAssets = precacheAssets || [];
var registration;

self.addEventListener('install', function(event) {
  return self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
       caches.match(event.request)
         .then(function(response) {
           return online ? fetch(event.request) : response;
         }).catch(function(event){
           return;
         })
    )
  });

self.addEventListener('message', function(event) {
	if (event.data.command === "cache") {
    precacheAssets = precacheAssets.concat(event.data.info);
    caches.open('precache')
      .then(function(cache) {
        return cache.addAll(precacheAssets);
      })
      .catch(function() {
      });
  }

	if(event.data.command === "fallback") {
		caches.open('fallback')
	 		.then(function(cache) {
		 		return cache.add(event.data.info);
	 		})
	}

  if (event.data.command === "online") {
    online = event.data.info;
  }

  if (event.data.command === "createDB") {
    var request = indexedDB.open('DEFERRED', 1);

    request.onupgradeneeded = function(e) {
      db = e.target.result;
      var objectStore = db.createObjectStore("deferredRequests", { keyPath: "domain" });
    };

    request.onsuccess = function(e) {
      db = e.target.result;
      var dRObjectStore = db.transaction("deferredRequests", "readwrite").objectStore("deferredRequests");
      dRObjectStore.add({domain: event.data.info, requests: []});
    };
  }

  if (event.data.command === "queue") {
    var openRequest = indexedDB.open('DEFERRED', 1);

    openRequest.onsuccess = function(e) {
      var db = e.target.result;
      var objectStore = db.transaction(["deferredRequests"], "readwrite").objectStore("deferredRequests");
      var request = objectStore.get(event.data.info.domain);

      request.onsuccess = function(e) {
        // Get the old value that we want to update
        var deferredQueue = request.result["requests"];

        // update the value(s) in the object that you want to change
        deferredQueue.push({
          data: event.data.info.dataObj,
          callback: event.data.info.deferredFunc
        });

        // Put this updated object back into the database.
        var requestUpdate = objectStore.put({domain: event.data.info.domain, requests: deferredQueue});
        requestUpdate.onerror = function(e) {
        };

        requestUpdate.onsuccess = function(e) {
        };
      };
    }
  }
	
	if(event.data.command === "registration") {
		registration = event.data.info;
		console.log("registration", registration);
	}
	
	// it's logging twice
	for(var i=0; i<event.data.length; i++) {
		if(event.data[i].command === "reset-cache") {
			console.log("in reset-cache!");
			caches.keys().then(function(cacheNames) {
				return Promise.all(
					cacheNames.filter(function(cacheName) {
						return caches.delete(cacheName)
					})
				);
			});
		}

		// deletes indexDB but requires page refresh to see
		if(event.data[i].command === "reset-indexedb") {
			console.log("in reset-indexedb!");
			db.close();
			var deleteReq = indexedDB.deleteDatabase(event.data[i].info);
			
			deleteReq.onerror = function() {
				console.log("Error deleting database.");
			};
			
			deleteReq.onsuccess= function(event) { 
				console.log("Successfully deleted database!");
				setTimeout(function() {
					// setting false so it reloads from cache
					// true from server
					// this is not working, bug in chrome.
        	window.location.reload(false);
			 	}, 1000);
			};
			
			deleteReq.onblocked = function () {
				console.log("Couldn't delete database, operation blocked.");
			};
		}

		// postMessage seems to be sending, but the console logs inside are not rendering and the sw is giving me weird errors from long ago.
		if(event.data[i].command === "reset-sw") {
			console.log("in reset-sw!");
			// I sent postmessage from when SW register in skyport.js so it would be the same as saying 
			// navigator.serviceWorker in the other file. It works in the skyport file (nav.SW) but as registration in here it doesn't run. 
			// Also the 'message' listener is not receiving the console.log's from postMessage, yet it seems as if it's actually running the code inside. What...?
			registration.getRegistrations().then(function(registrations) {
				console.log(registrations);
				console.log("yeah1");
				for(var registration in registrations) {
					console.log("yeah2");
					var sw = registrations[registration];
					// console.log(registrations[registration]);
					sw.unregister().then(function(boolean) {
						console.log("worked!");
					});
				}
			});
		}
	}

});