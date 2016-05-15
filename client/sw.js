console.log('sw.js started');

const CACHE_FIRST = 'precache';
const FALLBACK_CACHE = 'fallback';

var online = true;
var db;
var cacheFirstAssets = [];

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
         console.log(event);
         return;// caches.match(cacheFirstAssets[cacheFirstAssets.length - 1]);
       })
  )
});

self.addEventListener('message', function(event) {

	if (event.data.command === "cache") {
    cacheFirstAssets = cacheFirstAssets.concat(event.data.info);
    console.log("going to cache", cacheFirstAssets);
    caches.open(CACHE_FIRST)
      .then(function(cache) {
        return cache.addAll(cacheFirstAssets);
      })
      .catch(function() {
        console.log('cache of', cacheFirstAssets, 'failed');
      });
  }

	if(event.data.command === "fallback") {
		caches.open(FALLBACK_CACHE)
	 		.then(function(cache) {
		 		return cache.add(event.data.info);
	 		})
	}

  if (event.data.command === "online") {
    console.log('event', event);
    online = event.data.info;
    console.log("heard online message. online is now", online);
  }

  if (event.data.command === "createDB") {
console.log('in createDB');
    var request = indexedDB.open('DEFERRED', 1);

    request.onerror = function() {
      console.error("Error");
    };

    request.onupgradeneeded = function(e) {
      console.log('in onupgradeneeded');
      db = e.target.result;
console.log("db is", db);
      var objectStore = db.createObjectStore("deferredRequests", { keyPath: "domain" });
    };

    request.onsuccess = function(e) {
      console.log('in onsuccess');
      db = e.target.result;
console.log("db is", db);
      var dRObjectStore = db.transaction("deferredRequests", "readwrite").objectStore("deferredRequests");
      dRObjectStore.add({domain: event.data.info, requests: []});
    };
  }

  if (event.data.command === "queue") {
        console.log('event', event);
    var objectStore = db.transaction(["deferredRequests"], "readwrite").objectStore("deferredRequests");
    var request = objectStore.get(event.data.info.domain);
    request.onerror = function(e) {
      console.log("error:", e);
    };
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
         console.log("error:", e);
       };
       requestUpdate.onsuccess = function(e) {
         console.log("successfully updated", e);
       };
    };
  }

  // if (event.data.command === "empty") {
  //       console.log('event', event);
  //   var objectStore = db.transaction(["deferredRequests"], "readwrite").objectStore("deferredRequests");
  //   var request = objectStore.get(event.data.info);
  //
  //   request.onerror = function(e) {
  //     console.log("error:", e);
  //   };
  //
  //   request.onsuccess = function(e) {
  //     var deferredQueue = request.result["requests"];
  //
  //     while(navigator.onLine && deferredQueue.length) {
  //       var nextRequest = deferredQueue.shift();
  //       var deferredFunc = eval(nextRequest.callback);
  //       if (typeof(deferredFunc) === "function") deferredFunc(JSON.parse(nextRequest.data));
  //       var requestUpdate = objectStore.put({domain: event.data.info, requests: deferredQueue});
  //        requestUpdate.onerror = function(e) {
  //          console.log("error:", e);
  //        };
  //        requestUpdate.onsuccess = function(e) {
  //          console.log("successfully updated", e);
  //        };
  //     }
  //     console.log("finished processing queue");
  //   }
  // }

});
