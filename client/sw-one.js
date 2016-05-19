var window;
console.log('at the start of sw-one file, window is', window);
/*
  The code below runs in the service worker global scope
*/
if (!window) {
  var db;
  var online = true;
  var precache, postcache;

  caches.open('precache').then(function(cache) {
    precache = cache;
  });

  caches.open('postcache').then(function(cache) {
    postcache = cache;
  });

  self.addEventListener('install', function(event) {
    console.log('sw installing');
    return self.skipWaiting();
  });

  self.addEventListener('activate', function(event) {
    console.log('sw activating');
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener('fetch', function(event) {
    if (event.request.method === 'POST' || event.request.url !== 'http://localhost:3000/messages') {
      console.log('about to fetch:', event.request.url);
    }
    event.respondWith(
      precache.match(event.request.clone())
        .then(function(response) {
          if(response) return response;
          return fetch(event.request.clone())
            .then(function(netRes) {
              postcache.put(event.request, netRes.clone());
              return netRes;
            })
            .catch(function() {
              return postcache.match(event.request)
              .then(function(response) {
                return response;
              })
            })
        })
    )
  });

  self.addEventListener('message', function(event) {
    console.log('heard a message');
    var command = event.data.command;
  	if (command === "cache" && online) {
      console.log('heard a message to precache', event.data.info)
      caches.open('precache')
        .then(function(cache) {
          return cache.addAll(event.data.info);
        })
        .catch(function() {
        });
    }

  	if(command === "fallback" && online) {
  		caches.open('fallback')
  	 		.then(function(cache) {
  		 		return cache.add(event.data.info);
  	 		})
  	}

    if (command === "dynamic" && online) {
      console.log('heard a message to postcache', event.data.info)
      caches.open('postcache')
        .then(function(cache) {
          return cache.addAll(event.data.info);
        })
        .catch(function() {
        });
    }

    if (command === "online") {
      online = event.data.info;
    }

    if (command === 'createDB' || command === 'queue' || command === 'dequeue') {
      getIDB(event.data);
    }

  });

  function getIDB(data) {
    var request = indexedDB.open('DEFERRED', 1);

    request.onupgradeneeded = function(e) {
      db = e.target.result;
      var objectStore = db.createObjectStore("deferredRequests", { keyPath: "domain" });
      console.log('in upgradeneeded, db is', db);
    };

    request.onsuccess = function(e) {
      db = e.target.result;
      var objectStore = db.transaction("deferredRequests", "readwrite").objectStore("deferredRequests");
      console.log('in onsuccess, db is', db);

      if (data.command === 'createDB') {
        console.log('in createDB');
        objectStore.add({domain: data.info.domain, requests: []});
      }
      else if (data.command === 'queue') {
        console.log('in queue');
        var retrieveRequest = objectStore.get(data.info.domain);

        retrieveRequest.onsuccess = function(e) {
          // Get the old value that we want to update
          var deferredQueue = retrieveRequest.result["requests"];

          // update the value(s) in the object that you want to change
          deferredQueue.push({
            data: data.info.dataObj,
            callback: data.info.deferredFunc
          });

          // Put this updated object back into the database.
          var requestUpdate = objectStore.put({domain: data.info.domain, requests: deferredQueue});
        };
      }
      else if (data.command === 'dequeue') {
        var request = objectStore.get(data.info.domain);

        request.onsuccess = function(event) {
          var deferredQueue = request.result["requests"];

          while(navigator.onLine && deferredQueue.length) {
            var nextRequest = deferredQueue.shift();
            var deferredFunc = eval(nextRequest.callback);
            if (typeof(deferredFunc) === "function") deferredFunc(JSON.parse(nextRequest.data));
            var requestUpdate = objectStore.put({domain: data.info.domain, requests: deferredQueue});
          }
        }
      }
    };
  }
}


/*
  The code below runs in the window scope
*/
if (window) {
  console.log('index code is running', navigator.serviceWorker.controller);
  (function() {
    console.log('iife is running');
    //  Service Workers are not (yet) supported by all browsers
    if (!navigator.serviceWorker) return;
    //  A reference to our database in indexedDB
    var db;

    var serviceWorker = navigator.serviceWorker.controller;
    console.log('here i am in index scope', window.location.origin, serviceWorker);
    //  Register the service worker once on load
    if (!serviceWorker) {
      console.log('about to register a service worker');
      navigator.serviceWorker.register('/sw-one.js', {
        scope: '.'
      }).then(function(registration) {
        serviceWorker = registration.active || registration.waiting || registration.installing;
        console.log('i just registered a service worker :-P');
        //  This file should be included in the cache for offline use
        skyport.cache(['/sw-one.js']);

        //  Tell the service worker to create storage in indexedDB
        sendToSW({command: 'createDB', info: {domain: window.location.origin}});
      });
    }

    //  Make useful functions available on the window object
    console.log('im just above skyport declaration');
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

      dynamic: function(assetsArray) {
        // var assetsObject = {};
        // for(var i = 0; i < assetsArray.length; i++) {
        //   assetsArray[i] = window.location.origin + assetsArray[i];
        //   assetsObject[assetsArray[i]] = 0;
        // }
        sendToSW({
          command: 'dynamic',
          info: assetsArray//assetsObject
        });
      },

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

    window.addEventListener('online', function(event) {
      sendToSW({command: "online", info: true});
      sendToSW({
        command: 'dequeue',
        info: {
          domain: window.location.origin
        }
      });
    });

    window.addEventListener('offline', function(event) {
      sendToSW({command: "online", info: false});
    });

    window.addEventListener('load', function(event) {
    });

    function sendToSW(messageObj) {
      if (!serviceWorker) {
        navigator.serviceWorker.oncontrollerchange = function() {
          serviceWorker = navigator.serviceWorker.controller;
          serviceWorker.postMessage(messageObj);
        }
      } else {
        serviceWorker.postMessage(messageObj);
      }
    }
  })();;
}
