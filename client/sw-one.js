var window;
/*
  The code below runs in the service worker global scope
*/
if (!window) {
  console.log('registration scope',registration.scope);
  console.log('swgs', this);
  var precache, postcache;
  var precacheKeys = [];

  caches.open('precache').then(function(cache) {
    precache = cache;
  });

  caches.open('postcache').then(function(cache) {
    postcache = cache;
  });

  self.addEventListener('install', function(event) {
    console.log('sw installing');
    console.log(new Date(Date.now()));
    return self.skipWaiting();
  });

  self.addEventListener('activate', function(event) {
    console.log('sw activating');
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener('fetch', function(event) {
    event.respondWith(
      precache.match(event.request.clone()).then(function(response) {
          if(response) {
            console.log('precache fetch', event.request.url)
            return response.clone();
          } else if (navigator.onLine) {
            return fetch(event.request.clone()).then(function(netRes) {
                return caches.open('postcache').then(function(cache) {
                  return cache.match(event.request.clone()).then(function(response) {
                    if (response && event.request.method === 'GET') {
                      cache.put(event.request.clone(), netRes.clone());
                    }
                    return netRes;
                  })
                })
              })
              .catch(function() {
                return caches.open('postcache').then(function(cache) {
                  return cache.match(event.request.clone()).then(function(response) {
                    return response;
                  });
                });
              });
            } else {
              console.log('no response in precache to fetch');
              return caches.open('postcache').then(function(cache) {
                return cache.match(event.request.clone()).then(function(response) {
                  return response;
                });
              });
            }
        })
    )
  });

  self.addEventListener('message', function(event) {
    var command = event.data.command;

    if (command === "cacheJSON" && navigator.onLine) {
      var jsonFile = event.data.info;
      console.log('jsonFile', jsonFile);
      // fetch('https://ajax.googleapis.com/ajax/libs/jquery/2.2.3/jquery.min.js').then(function(response) {
      //   return response;
      // }).then(function(jQResponse) {
      //   caches.open('precache')
      //     .then(function(cache) {
      //       console.log('jQResponse', jQResponse);
      //       cache.put('https://ajax.googleapis.com/ajax/libs/jquery/2.2.3/jquery.min.js', jQResponse)
            return fetch(jsonFile).then(function(response) {
              return response.json()
            })
            .then(function(parsedFile) {
              // console.log('check for jquery!');
              addToCache(/*parsedFile.cache*/'precache', parsedFile.assets);
            })
        //   })
        // })
    }


    if (command === "cache" && navigator.onLine) {
      var items = event.data.info;
      addToCache('precache', items);
      // caches.open('precache')
      //   .then(function(cache) {
      //     items.forEach(function(item) {
      //       cache.match(item).then(function(res) {
      //         if (!res) cache.add(item);
      //       }).catch(function(err) {console.log('error:', err)})
      //     })
      //   })//.then(cleanCache(precache, items)) // This is currently replacing everything except last call to cache
      //   .catch(function(err) {
      //     console.log('error in precache', err);
      //   });
    }

  	if(command === "fallback") {
  		caches.open('fallback')
  	 		.then(function(cache) {
  		 		return cache.add(event.data.info);
  	 		})
  	}

    if(command === 'dynamic') {
  		caches.open('postcache')
  	 		.then(function(cache) {
  		 		return cache.add(event.data.info);
  	 		})
  	}

    if (command === "createDB" || command === "queue") {
      getIDB(event.data);
    }
  });

  function getIDB(data) {
    var openRequest = indexedDB.open('DEFERRED', 1);

    openRequest.onupgradeneeded = function(e) {
      db = e.target.result;
      var objectStore = db.createObjectStore("deferredRequests", { keyPath: "domain" });
    };

    openRequest.onsuccess = function(e) {
      db = e.target.result;
      var objectStore = db.transaction("deferredRequests", "readwrite").objectStore("deferredRequests");

      if (data.command === 'createDB') {
        objectStore.add({domain: data.info.domain, requests: []});
      }

      else if (data.command === 'queue') {
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
        var retrieveRequest = objectStore.get(data.info.domain);

        retrieveRequest.onsuccess = function(event) {
          var deferredQueue = retrieveRequest.result["requests"];

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

  function addToCache(cacheName, itemsToAdd) {
    caches.open(cacheName)
      .then(function(cache) {
        itemsToAdd.forEach(function(item) {
          cache.match(item).then(function(response) {
            if (!response) cache.add(item);
          }).catch(function(err) {console.log('error:', err)})
        })
      }).catch(function(err) {
        console.log('error in addToCache', err);
      });
  }

  function fetchFromCache(cacheName, request) {

  }

  function cleanCache(cache, newItems) {
    //  TODO: collect list of current keys in cache. check each key against
    //  new cache array and remove from cache if not found
    cache.keys().then(function(keylist) {
      console.log('newItems', newItems);
      keylist.forEach(function(key) {
        if (newItems.indexOf(key.url.replace(registration.scope, '')) < 0) {
          cache.delete(key);
          console.log('deleting from cache', key.url);
        }
      })
    }).then(function() {
      console.log('old cache items should have been deleted')
    }).catch(function(err) { console.log('there was an error in cleanCache', err)});
  }
}


/*
  The code below runs in the window scope
*/
if (window) {

  (function() {
    console.log('iife is running');
    //  Service Workers are not (yet) supported by all browsers
    if (!navigator.serviceWorker) return;

    var serviceWorker = navigator.serviceWorker.controller;

    //  Register the service worker once on load
    if (!serviceWorker) {

      navigator.serviceWorker.register('/sw-one.js', {
        scope: '.'
      }).then(function(registration) {
        serviceWorker = registration.active || registration.waiting || registration.installing;

        //  This file should be included in the cache for offline use
        skyport.cache(['/sw-one.js']);

        //  Tell the service worker to create storage in indexedDB
        sendToSW({command: 'createDB', info: {domain: window.location.origin}});
      });
    }

    //  Make useful functions available on the window object
    window.skyport =  window.skyport || {

      //  Use this function to add assets to cache for offline use
      cache: function(assets, fallback) {
        console.log('cache was given', typeof(assets), assets);
        if (typeof assets === 'string' && /\.json$/.test(assets)) {
          sendToSW({
            command: 'cacheJSON',
            info: assets
          })
          return;
        }

        if (!Array.isArray(assets)) assets = [assets];
        sendToSW({
          command: 'cache',
          info: assets
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

      dynamic: function(assets) {
      	sendToSW({
          command: 'dynamic',
          info: assets
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

    window.addEventListener('online', function(event) {
      dequeue();
    });

    window.addEventListener('offline', function(event) {
      //
    });

    window.addEventListener('load', function(event) {
    });

    function dequeue() {
      var openRequest = indexedDB.open('DEFERRED', 1);

      openRequest.onsuccess = function(e) {
        var db = e.target.result;
        var objectStore = db.transaction("deferredRequests", "readwrite").objectStore("deferredRequests");
        var retrieveRequest = objectStore.get(window.location.origin);

        retrieveRequest.onsuccess = function(event) {
          var deferredQueue = retrieveRequest.result["requests"];

          while(navigator.onLine && deferredQueue.length) {
            var nextRequest = deferredQueue.shift();
            var deferredFunc = eval(nextRequest.callback);
            if (typeof(deferredFunc) === "function") deferredFunc(JSON.parse(nextRequest.data));
            var requestUpdate = objectStore.put({domain: window.location.origin, requests: deferredQueue});
          }
        }
      }
    }

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
