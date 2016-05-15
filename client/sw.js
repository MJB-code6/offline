console.log('sw.js started');

const CACHE_FIRST = 'precache';
const FALLBACK_CACHE = 'fallback';

var online = true;

var cacheFirstAssets = [];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_FIRST)
      .then(function(cache) {
        console.log('[install] Adding to precache cache');
        return cache.addAll(cacheFirstAssets);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[activate]');
  console.log("idb", indexedDB.open);
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
 event.respondWith(
   caches.match(event.request)
   .then(function(response) {
     return response || fetch(event.request);
   }).catch(function(event){
     console.log(event);
    //  return caches.match(cacheFirstAssets[cacheFirstAssets.length - 1]);
   })
 )
});

self.addEventListener('message', function(event) {
  console.log('in message', event.data);

	if (event.data.command === "cache") {
    cacheFirstAssets = event.data.info;
    caches.open(CACHE_FIRST)
    .then(function(cache) {
      return cache.addAll(cacheFirstAssets);
    })
  }

	if(event.data.command === "fallback") {
		caches.open(FALLBACK_CACHE)
	 		.then(function(cache) {
		 		return cache.add(event.data.info);
	 		})
	}

  if (event.data.command === "online") {
    online = event.data.info;
    console.log("heard online message. online is now", online);
  }

  if (event.data.command === "db") {

  }

  if (event.data.command === "defer") {
    var objectStore = db.transaction(["deferredRequests"], "readwrite").objectStore("deferredRequests");
    var request = objectStore.get(window.location.origin);
    request.onerror = function(event) {
      console.log("error:", event);
    };
    request.onsuccess = function(event) {
      // Get the old value that we want to update
      var deferredQueue = request.result["requests"];

      // update the value(s) in the object that you want to change
      deferredQueue.push({data: dataObj, callback: '(' + deferredFunc.toString() + ')'});

      // Put this updated object back into the database.
      var requestUpdate = objectStore.put({domain: window.location.origin, requests: deferredQueue});
       requestUpdate.onerror = function(event) {
         console.log("error:", event);
       };
       requestUpdate.onsuccess = function(event) {
         console.log("successfully updated", event);
       };
    };
  }

  if (event.data.command === "empty") {
    var objectStore = db.transaction(["deferredRequests"], "readwrite").objectStore("deferredRequests");
    var request = objectStore.get(window.location.origin);

    request.onerror = function(event) {
      console.log("error:", event);
    };

    request.onsuccess = function(event) {
      var deferredQueue = request.result["requests"];
      while(navigator.onLine && deferredQueue.length) {
        var nextRequest = deferredQueue.shift();
        var deferredFunc = eval(nextRequest.callback);
        if (typeof(deferredFunc) === "function") deferredFunc(nextRequest.data);
        var requestUpdate = objectStore.put({domain: window.location.origin, requests: deferredQueue});
         requestUpdate.onerror = function(event) {
           console.log("error:", event);
         };
         requestUpdate.onsuccess = function(event) {
           console.log("successfully updated", event);
         };
      }
      console.log("finished processing queue");
    }

  }


});
