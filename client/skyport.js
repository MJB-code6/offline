(function() {
/*function to reset indexDB, cache, and SW
make it so if there are no arguments then it automatically clears all
otherwise they provide an argument it will only clear whatevr argument they provide.

1. clear cache
2. clear index DB
3. register new SW?
4. clear all 3 if no arguments
5. clear only item that is in arguments*/
	
  //  Service Workers are not (yet) supported by all browsers
  if (!navigator.serviceWorker) return;

  //  A reference to our database in indexedDB
  var db;

  var serviceWorker = navigator.serviceWorker.controller;

  //  Register the service worker once on load
  if (!serviceWorker) {
    navigator.serviceWorker.register('./sw_skyport.js', {
      scope: '.'
    }).then(function(registration) {
      serviceWorker = registration.active || registration.waiting || registration.installing;
      console.log('i just registered a service worker :-P');
      //  This file should be included in the cache for offline use
      // skyport.cache(['/skyport.js']);

      //  Tell the service worker to create storage in indexedDB
      sendToSW({command: 'createDB', info: window.location.origin});
			
			sendToSW({command: 'registration', info: registration});
    });
  }

  //  Make useful functions available on the window object
  window.skyport =  window.skyport || {

    //  Use this function to add assets to cache for offline use
    cache: function(assetArray, fallback) {
      sendToSW({
        command: 'cache',
        info: assetArray
      });

      if (fallback) {
        sendToSW({
          command: 'fallback',
          info: fallback
        });
      }
    },

    //  Use this function to add a default page if a resource is not cached
    fallback: function(fallback) {
    	sendToSW({
        command: 'fallback',
        info: fallback
      });
    },

    //
    sendOrQueue: function(dataObj, deferredFunc) {
      if (navigator.onLine) return deferredFunc(dataObj);
      if (typeof(deferredFunc) !== "function") return;
      sendToSW({
        command: 'queue',
        info: {
          domain: window.location.origin,
          dataObj: JSON.stringify(dataObj),
          deferredFunc: '(' + deferredFunc.toString() + ')'
        }
      });
    }
  };

	
//	// FUNCTION FOR CLEARING ALL ITEMS IN EACH CHOICE:
//	// choose the data you want to reset out of 3: sw, cache, or indexdb + nameOfDB.
//	function reset() {
//  // get all arguments entered into function
//  var args = Array.prototype.slice.call(arguments);
//
//  if(args.length === 0) { 
//    return undefined;
//  }else if(args.length > 0) {
//   	// loop through function, if particular argument exists then send
//    for(var i=0; i<args.length; i++) {
//      if(args[i] === "cache") { 
//      	resetCache();
//      }else if(args[i] === "indexedb") { 
//        resetIndexedb();
//      }else if(args[i] === "sw") { 
//        resetSW();
//      } 
//    }
//  }
//		
//	function resetCache() {
//		console.log("in reset-cache!");
//		caches.keys().then(function(cacheNames) {
//			return Promise.all(
//				cacheNames.filter(function(cacheName) {
//					return caches.delete(cacheName)
//				})
//			);
//		});
//	}
//	
//	function resetIndexedb() {
//		var deleteReq = indexedDB.deleteDatabase('DEFERRED');
//
//		deleteReq.onsuccess= function(event) { 
//			console.log("Successfully deleted database!");
//			setTimeout(function() {
//				// setting false so it reloads from cache
//				// true from server
//				// this is not working, bug in chrome.
//				window.location.reload(false);
//			}, 1000);
//		};
//	}
//		
//		
//	function resetSW() {
//		navigator.serviceWorker.getRegistrations().then(function(registrations) {
//			for(var registration in registrations) {
//				var sw = registrations[registration];
//				sw.unregister().then(function(boolean) {
//					console.log("Deleted SW!");
//				});
//			}
//		});
//	}
//}
//

		Examples:
//		reset('indexedb'); 
//		reset('cache');
//		reset('sw')
	
  window.addEventListener('online', function(event) {
    sendToSW({command: "online", info: true});
    emptyQueue();
  });

  window.addEventListener('offline', function(event) {
    sendToSW({command: "online", info: false});
  });

  window.addEventListener('load', function(event) {
  });

  function emptyQueue() {
    var openRequest = indexedDB.open('DEFERRED', 1);

    openRequest.onsuccess = function(e) {
      var db = e.target.result;
      var objectStore = db.transaction(["deferredRequests"], "readwrite").objectStore("deferredRequests");
      var request = objectStore.get(window.location.origin);

      request.onerror = function(event) {
      };

      request.onsuccess = function(event) {
        var deferredQueue = request.result["requests"];

        while(navigator.onLine && deferredQueue.length) {
          var nextRequest = deferredQueue.shift();
          var deferredFunc = eval(nextRequest.callback);
          if (typeof(deferredFunc) === "function") deferredFunc(JSON.parse(nextRequest.data));
          var requestUpdate = objectStore.put({domain: window.location.origin, requests: deferredQueue});
           requestUpdate.onerror = function(event) {
           };
           requestUpdate.onsuccess = function(event) {
           };
        }
      }

    };
  }

  function sendToSW(messageObjOrArr) {
    if (!serviceWorker) {
      navigator.serviceWorker.oncontrollerchange = function() {
        serviceWorker = navigator.serviceWorker.controller;
        serviceWorker.postMessage(messageObjOrArr);
      }
    } else {
      serviceWorker.postMessage(messageObjOrArr);
    }
  }
	
})();