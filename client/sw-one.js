var window;
/*
  The code below runs in the service worker global scope
*/
if (!window) {
  var db;
  var online = true;
  var precache, postcache;
  console.log('swgs', this);

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
          if(response) {
            console.log('returning precache response');
            return response;
          } else if (online) {
            return fetch(event.request.clone())
              .then(function(netRes) {
                return caches.open('postcache').then(function(cache) {
                  return cache.match(event.request.clone()).then(function(response) {
                    if (response && event.request.method === 'GET') {
                      console.log('putting something into postcache');
                      cache.put(event.request.clone(), netRes.clone());
                    }
                    console.log('returning net response');
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
    console.log('heard a message', command);

    if (command === "cache" && online) {
      var items = event.data.info;
      console.log('heard a message to cache', event.data.info)
      caches.open('precache')
        .then(function(cache) {
          items.forEach(function(item) {
            cache.match(item).then(function(res) {
              if (!res) cache.add(item);
              else console.log('res header', res.headers)
            }).catch(function(err) {console.log('error:', err)});
          });
        }).then(function() {
					checkPrecache();
				})
        .catch(function(err) {
          console.log('error in precache', err);
        });
    }

		if(command === "fallback") {
  		caches.open('fallback')
  	 		.then(function(cache) {
  		 		return cache.add(event.data.info);
  	 		})
  	}

    if(command === 'dynamic') {
			var items = event.data.info;
  		caches.open('postcache')
      	.then(function(cache) {
          items.forEach(function(item) {
            cache.match(item).then(function(res) {
              if (!res) cache.add(item);
              else console.log('res header', res.headers)
            }).catch(function(err) {console.log('error:', err)});
          });
        }).then(function() {
					checkPostcache();
				}).catch(function(err) {
          console.log('error in postcache', err);
				})
  	}

		function checkPostcache() { 
			postcache.keys().then(function(cachedFiles) {
				caches.open('postcache').then(function(cache) {
					cachedFiles.forEach(function(file) {
						cache.match(file.url).then(function(res) {
							if(res.status === 200 && res.statusText === "OK"){
								console.log("GOOD POSTCACHE");
							}else {
								console.log("NOT SO GOOD POSTCACHE!", "resStatus: ", res, res.status, "resStatusText: ", res.statusText);
								
								var headers = new Headers();
								headers.set('Status-Code', 200);
								
								var request = new Request(file.url, {headers: headers});
								
								fetch(request).then(function(resp) {
									console.log(resp.headers);
									console.log("AFTER POST CACHE FETCH", resp)
									console.log(resp);
									return cache.put(file.url, resp)
								})
								
//								return cache.add(file.url);
							}
						}).catch(function(err) {console.log('error:', err)})
					})
				})
			});
		}
		
		function checkPrecache() { 
			precache.keys().then(function(cachedFiles) {
				caches.open('precache').then(function(cache) {
					cachedFiles.forEach(function(file) {
						cache.match(file.url).then(function(res) {
							if(res.status === 200 && res.statusText === "OK"){
								console.log("GOOD PRECACHE");
							}else if(res.status === 206 && res.statusText === "Partial Content") {
								console.log("PARTIAL CONTENT!", res.status, res.statusText);
								console.log(res);							
							var request = new Request(file.url);
								
								fetch(request).then(function(resp) {
									console.log("AFTER PRE CACHE FETCH", resp)
									console.log(resp);
									return cache.put(file.url, resp)
								})
								//return cache.add(file.url);
							}else {
								console.log("NOT SO GOOD PRECACHE!", "resStatus: ", res.status, "resStatusText: ", res.statusText);
								
								var request = new Request(file.url);
								
								fetch(request).then(function(resp) {
									console.log("AFTER PRE CACHE FETCH", resp)
									console.log(resp);
									return cache.put(file.url, resp)
								})
							}
						})
					})
				})
			});
		}

    if (command === "online") {
      if (event.data.info === false) {
        precache.keys().then(function(keylist) {
          keylist.forEach(function(req) {
            console.log('precache req headers', req.headers);
          });
        });
      }
      online = event.data.info;
    }

    if (command === "createDB" || command === "queue") {
      getIDB(event.data);
      // console.log('in createdb, getIDB returned', objectStore);
      // objectStore.add({domain: event.data.info, requests: []});
    }

    // if (command === 'dequeue') {
    //   getIDB(event.data);
    // }

  });

  function getIDB(data) {
    var openRequest = indexedDB.open('DEFERRED', 1);

    openRequest.onupgradeneeded = function(e) {
      db = e.target.result;
      var objectStore = db.createObjectStore("deferredRequests", { keyPath: "domain" });
      console.log('in upgradeneeded, db is', db);
    };

    openRequest.onsuccess = function(e) {
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
      cache: function(assets, fallback) {
        console.log('cache args',arguments.callee.caller);
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
      sendToSW({command: "online", info: true});
      dequeue();
      // sendToSW({
      //   command: 'dequeue',
      //   info: {
      //     domain: window.location.origin
      //   }
      // });
    });

    window.addEventListener('offline', function(event) {
      sendToSW({command: "online", info: false});
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
		
	// FUNCTION FOR CLEARING ALL ITEMS IN EACH CHOICE:
	// choose the data you want to reset out of 3: sw, cache, or indexdb.
	function reset() {
		// get all arguments entered into function
		var args = Array.prototype.slice.call(arguments);

		if(args.length === 0) { 
			resetCache();
			resetIndexedb();
			resetSW();
		}else if(args.length > 0) {
			// loop through function, if particular argument exists then send
			for(var i=0; i<args.length; i++) {
				if(args[i] === "cache") { 
					resetCache();
				}else if(args[i] === "indexedb") { 
					resetIndexedb();
				}else if(args[i] === "sw") { 
					resetSW();
				} 
			}
		}

		function resetCache() {
			console.log("in reset-cache!");
			caches.keys().then(function(cacheNames) {
				return Promise.all(
					cacheNames.filter(function(cacheName) {
						return caches.delete(cacheName)
					})
				);
			});
		}

		function resetIndexedb() {
			var deleteReq = indexedDB.deleteDatabase('DEFERRED');

			deleteReq.onsuccess= function(event) { 
				console.log("Successfully deleted database!");
				setTimeout(function() {
					// setting false so it reloads from cache
					// true from server
					// this is not working, bug in chrome.
					window.location.reload(false);
				}, 1000);
			};
		}


		function resetSW() {
			navigator.serviceWorker.getRegistrations().then(function(registrations) {
				console.log('IN SW!!!!')
				for(var registration in registrations) {
					var sw = registrations[registration];
					sw.unregister().then(function(boolean) {
						console.log("Deleted SW!");
					});
				}
			});
		}
}


//Examples:
//		reset('indexedb'); 
//		reset('cache');
//		reset('sw'); // not working well anymore
// reset('cache', 'indexedb');
// reset('sw', cache', 'indexedb'); // not working well
// reset()

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
