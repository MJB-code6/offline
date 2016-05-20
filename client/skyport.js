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
    navigator.serviceWorker.register('/sw-skyport.js', {
      scope: '.'
    }).then(function(registration) {
      serviceWorker = registration.active || registration.waiting || registration.installing;

      //  This file should be included in the cache for offline use
      skyport.cache(['/skyport.js']);

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
	
	// IDEA: FUNCTION FOR CLEARING ONLY SPECIFIC ITEMS IN EACH CHOICE? 
	// OR ADD MORE COMPLEXITY TO resetSaved()
	// if empty will reset everything in all 3 possibilities
	// or include what you want to reset resetSaved:
	// //(cache(required), itemInCacheToReset, indexdb(required), dbName(required), sw, whichSWToReset(if more than 1 running));
	//If they include one item with specifics, it will assume you want to clear the entire item. So 'cache' without 'itemInCacheToReset' will reset entire cache while indexdb will only reset the item in indexdb if included in parameters:(cache, indexdb, dbName, sw, whichSWToReset(if more than 1 running)); 
	// dbName
	
	// FUNCTION FOR CLEARING ALL ITEMS IN EACH CHOICE:
	// choose the data you want to reset out of 3: sw, cache, or indexdb.
	function resetSaved() {
  // get all arguments entered into function
  var args = Array.prototype.slice.call(arguments);
  var toReset = [];
  
	// if no parameters will assume you want to reset sw, cache, and indexdb.
  if(args.length === 0) { 
    toReset.push(
			{command: "reset-cache"},
			{command: "reset-indexdb"},
			{command: "reset-sw"}
		);
  }else if(args.length > 0) {
   	// loop through function, if particular argument exists then send
    for(var i=0; i<args.length; i++) {
      if(args[i] === "cache") { 
      	toReset.push({command: "reset-cache"});
      }else if(args[i] === "indexdb" && args[i] !== args[args.length-1] && args[i+1] !== "sw") { 
        toReset.push({command: "reset-indexdb", info: args[i+1]});
      }else if(args[i] === "sw") { 
        toReset.push({command: "reset-sw"});
//				navigator.serviceWorker.getRegistrations().then(function(registrations) {
//					console.log(registrations);
//					console.log("yeah1");
//					for(var registration in registrations) {
//						console.log("yeah2");
//						var sw = registrations[registration];
//						// console.log(registrations[registration]);
//						sw.unregister().then(function(boolean) {
//							console.log("worked!");
//    				});
//					}
//				});
      } 
    }
  }
		
  // if none of the items mentioned match any of the three possible items return
  if(toReset.length === 0) { return };
  
		console.log('toReset: ', toReset)
  // send array of object commands to be cleared to SW
  sendToSW(toReset);
}

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
	
	resetSaved('sw');  
})();