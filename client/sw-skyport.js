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
/*
	+ Find alternatives to eval() in the emptyQueue function that runs when the user is back online and needs to execute the function. 
	+ Right now function is stringified, this is all done on Client-side. So someone can hijack.
	+ There is a way to turn the function back into a function from a string onces its' sent over but the hijacking issue remains. 
	+ Also can't use authentication.
*/
	
});