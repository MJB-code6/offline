var window;
/*
  The code below runs in the service worker global scope
*/
if (!window) {
  console.log('registration scope',registration.scope);
  console.log('swgs', this);
  var precache, postcache, fallback;
  var fallbackURL = registration.scope;

  self.addEventListener('install', function(event) {
    console.log('sw installing');
    console.log(new Date(Date.now()));
    return self.skipWaiting();
  });

  self.addEventListener('activate', function(event) {
    runIDB();
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener('fetch', function(event) {
    event.respondWith(
      precache.match(event.request).then(function(response) {
        if(response) {
          return response;
        } else if (navigator.onLine) {
          return fetch(event.request/*.clone()*/).then(function(netRes) {
              return postcache.match(event.request).then(function(response) {
                if (response && event.request.method === 'GET') {
                  postcache.put(event.request, netRes)
                }
                return netRes;
              }).catch(function(err) {console.log('postcache match error', err)})
          }).catch(function(err) {console.log('server match error', err)})
        } else {
            return postcache.match(event.request).then(function(response) {
              if (response) return response;
              else if (/\.html$/.test(event.request.url)) {
                console.log('fburl', fallbackURL);
                return fallback.match(fallbackURL).then(function(response) {
                  return response;
                }).catch(function(err) {console.log('fallback match error', err)})
              }
              else {
                console.log('(SkyPort) Error: a resource ', event.request.url,
                  ' was not found in cache');
              }
            }).catch(function(err) { console.log('caught after postcache match', err)});
        }
      })
    )
  });

  self.addEventListener('message', function(event) {
    var command = event.data.command;
    var info = event.data.info;

    if (command === "cacheJSON" && navigator.onLine) {
      return fetch(info.fileRoute).then(function(response) {
        return response.json()
      })
      .then(function(parsedFile) {
        console.log('parsedFile', parsedFile);
        console.log('info', info);
        if (info.cacheType === 'cache') {

          if (!parsedFile.static && !parsedFile.dynamic && !parsedFile.fallback) {
            console.error('(SkyPort) Error: JSON file passed to \'cache\' ' +
              'function must have at least one of the following fields: ' +
              '\'static\', \'dynamic\', \'fallback\'');
            return;
          }

          if (parsedFile.static) {
            if (!Array.isArray(parsedFile.static)) {
              console.error('(SkyPort) Error: static assets must be an array');
              return;
            }
            if (!parsedFile.version) {
              console.error('(SkyPort) Error: JSON files with static assets ' +
                'must include a version field (number or string)');
              return;
            }
            addToCache('static', parsedFile.static, parsedFile.version);
          }

          if (parsedFile.dynamic) {
            if (!Array.isArray(parsedFile.dynamic)) {
              console.error('(SkyPort) Error: dynamic assets must be an array');
              return;
            }
            addToCache('dynamic', parsedFile.dynamic);
          }

          if (parsedFile.fallback) {
            fallbackURL += parsedFile.fallback.slice(parsedFile.fallback.indexOf(
              parsedFile.fallback.match(/\w/)));
            addToCache('fallback', [parsedFile.fallback]);
          }
        }

        else if (info.cacheType === 'static') {
          if (!parsedFile.static) {
            if (!parsedFile.assets) {
              console.error('(SkyPort) Error: JSON file passed to static ' +
                'function must have a \'static\' field');
              return;
            }
            parsedFile.static = parsedFile.assets;
          }

          if (!Array.isArray(parsedFile.static)) {
            console.error('(SkyPort) Error: static assets must be an array');
            return;
          }
          if (!parsedFile.version) {
            console.error('(SkyPort) Error: JSON files with static assets ' +
              'must include a version field (number or string)');
            return;
          }
          addToCache('static', parsedFile.static, parsedFile.version);
        }

        else if (info.cacheType === 'dynamic') {
          if (!parsedFile.dynamic) {
            if (!parsedFile.assets) {
              console.error('(SkyPort) Error: JSON file passed to dynamic ' +
                'function must have a \'dynamic\' field');
              return;
            }
            parsedFile.dynamic = parsedFile.assets;
          }

          if (!Array.isArray(parsedFile.dynamic)) {
            console.error('(SkyPort) Error: dynamic assets must be an array');
            return;
          }
          addToCache('dynamic', parsedFile.dynamic);
        }
        return;
      });
    }


    if (command === "cacheArray" && navigator.onLine) {
      addToCache(info.cacheType, info.assets, info.version || null);
    }

  	if(command === "fallback") {
      fallbackURL += info.fileRoute.slice(info.fileRoute.indexOf(
        info.fileRoute.match(/\w/)));
      addToCache('fallback', [info.fileRoute])
      // caches.open('sky-fallback').then(function(cache) {
      //   cache.add('info.fileRoute').then(function(response) {
      //     if (response) fallback = true;
      //     else fallback = false;
      //   })
      // })
  	}

    if (command === "queue") {
      runIDB(event.data);
    }
  });

  function runIDB(data) {
    var openRequest = indexedDB.open('skyport', 1);

    openRequest.onupgradeneeded = function(e) {
      db = e.target.result;
      var objectStore = db.createObjectStore("redirected", { keyPath: "domain" });
    };

    openRequest.onsuccess = function(e) {
      db = e.target.result;
      var objectStore = db.transaction("redirected", "readwrite").objectStore("redirected");

      if (!data) {
        objectStore.add({domain: registration.scope, requests: []});
      }

      else if (data.command === 'queue') {
        var retrieveRequest = objectStore.get(registration.scope);

        retrieveRequest.onsuccess = function(e) {
          // Get the old value that we want to update
          var deferredQueue = retrieveRequest.result["requests"];

          // update the value(s) in the object that you want to change
          deferredQueue.push({
            data: data.info.dataObj,
            callback: data.info.deferredFunc
          });

          // Put this updated object back into the database.
          var requestUpdate = objectStore.put({domain: registration.scope, requests: deferredQueue});
        };
      }

      else if (data.command === 'dequeue') {
        var retrieveRequest = objectStore.get(registration.scope);

        retrieveRequest.onsuccess = function(event) {
          var deferredQueue = retrieveRequest.result["requests"];

          while(navigator.onLine && deferredQueue.length) {
            var nextRequest = deferredQueue.shift();
            var deferredFunc = eval(nextRequest.callback);
            if (typeof(deferredFunc) === "function") deferredFunc(JSON.parse(nextRequest.data));
            var requestUpdate = objectStore.put({domain: registration.scope, requests: deferredQueue});
          }
        }
      }
    };
  }

  function addToCache(type, itemsToAdd, version) { //(cacheName, version, itemsToAdd) {
    var cacheName = 'sky-' + type;
    if (version) cacheName += '-v' + version;
    caches.open(cacheName).then(function(cache) {
      if (type === 'static') {
        precache = cache;
        itemsToAdd.forEach(function(item) {
          cache.match(item).then(function(response) {
            if (!response) cache.add(item);
          })
        })
      }
      else {
        if (type === 'dynamic') postcache = cache;
        if (type === 'fallback') fallback = cache;
        cache.addAll(itemsToAdd);
      }
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
      navigator.serviceWorker.register('/sw-one.js', {scope: '.'}).then(function(registration) {
        serviceWorker = registration.active || registration.waiting || registration.installing;

        //  This file should be included in the cache for offline use
        skyport.dynamic(['/sw-one.js']);
      });
    }

    //  Make useful functions available on the window object
    window.skyport =  window.skyport || {

      cache: function(jsonFile) {
        if (typeof jsonFile !== 'string' || !/\.json$/.test(jsonFile)) {
          console.error('(SkyPort) Error: skyport.cache function parameter ' +
            'must be a JSON file');
          return;
        }
        sendToSW({
          command: 'cacheJSON',
          info: {
            cacheType: 'cache',
            fileRoute: jsonFile,
          }
        });
        return;
      },

      static: function(version, assets) {
        console.log('cache was given', typeof(assets), assets);
        if (typeof version === 'string' && /\.json$/.test(version)) {
          sendToSW({
            command: 'cacheJSON',
            info: {
              cacheType: 'static',
              fileRoute: version,
            }
          });
          return;
        }

        if (typeof version !== 'number' && typeof version !== 'string') {
          console.error('(SkyPort) Error: skyport.static must receive a JSON ' +
            'file or a version (number or string) as it\'s first argument');
          return;
        }

        if (!Array.isArray(assets)) {
          console.log('(SkyPort) Error: assets passed to skyport.static must ' +
            'be either an array (after a version parameter) or a JSON file');
          return;
        }

        sendToSW({
          command: 'cacheArray',
          info: {
            cacheType: 'static',
            version: version,
            assets: assets,
          }
        });
      },

      dynamic: function(assets) {

        //  Function was passed a JSON file
        if (typeof assets === 'string' && /\.json$/.test(assets)) {
          sendToSW({
            command: 'cacheJSON',
            info: {
              cacheType: 'dynamic',
              fileRoute: assets,
            }
          });
          return;
        }

        //  Function should otherwise be passed an array
        if (!Array.isArray(assets)) {
          console.log('(SkyPort) Error: assets passed to skyport.dynamic must' +
            ' be either an array or a JSON file. HINT: skyport.dynamic does ' +
            'not take a version parameter');
          return;
        }

        sendToSW({
          command: 'cacheArray',
          info: {
            cacheType: 'dynamic',
            assets: assets,
          }
        });
      },

      //  Use this function to add a default page if a resource is not cached
      fallback: function(htmlFile) {
        if (!htmlFile || typeof htmlFile !== 'string' || !/\.html$/.test(htmlFile)) {
          console.log('(SkyPort) Error: parameter of fallback function must ' +
            'be an HTML file');
          return;
        }
      	sendToSW({
          command: 'fallback',
          info: { fileRoute: htmlFile }
        });
      },


      //
      direct: function(dataObj, deferredFunc) {
        if (navigator.onLine) return deferredFunc(dataObj);
        if (typeof(deferredFunc) !== "function") return;
        sendToSW({
          command: 'queue',
          info: {
            dataObj: JSON.stringify(dataObj),
            deferredFunc: '(' + deferredFunc.toString() + ')'
          }
        });
      },

      reset: function() 
    		var args = Array.prototype.slice.call(arguments);

    		if(args.length === 0) {
    			resetCache();
    			resetIndexedDB();
    			resetSW();
    		} else {
    			args.forEach(function(arg) {
    				if(arg.toLowerCase() === "cache") resetCache();
    				else if(arg.toLowerCase() === "indexeddb")	resetIndexedDB();
    				else if(arg.toLowerCase() === "sw") resetSW();
    			});
    		}

    		function resetCache() {
    			caches.keys().then(function(keylist) {
    				return Promise.all(
    					keylist.filter(function(cacheName) {
    						return caches.delete(cacheName)
    					})
    				);
    			}).then(function() {
            console.log('(SkyPort) Success: SkyPort caches deleted');
          });
    		}

    		function resetIndexedDB() {
          var openRequest = indexedDB.open('skyport', 1);
          openRequest.onsuccess = function(event) {
            console.log('event.target.result', event.target.result);
            var deleteReq = indexedDB.deleteDatabase(event.target.result);

            deleteReq.onsuccess= function(e) {
              console.log('(SkyPort) Success: SkyPort indexedDB deleted');
              console.log(event.target.result)
            };

            deleteReq.onerror= function(e) {
      				console.error();('(SkyPort) Error: SkyPort indexedDB not deleted');
      			};
          }
    		}

    		function resetSW() {
    			navigator.serviceWorker.getRegistrations().then(function(registrations) {
    				for (var registration in registrations) {
              registrations[registration].unregister().then(function() {
    						console.log('(SkyPort) Success: SkyPort service worker deleted');
    					});
    				}
    			});
    		}
      }
    };

    window.addEventListener('online', function(event) {
      dequeue();
    });

    window.addEventListener('offline', function(event) {
      //
    });

    window.addEventListener('load', function(event) {
      console.log('window loaded')
    });

    function dequeue() {
      var openRequest = indexedDB.open('skyport', 1);

      openRequest.onsuccess = function(e) {
        var db = e.target.result;
        var objectStore = db.transaction("redirected", "readwrite").objectStore("redirected");
        var retrieveRequest = objectStore.get(window.location.origin + '/');

        retrieveRequest.onsuccess = function(event) {
          console.log('retrieveRequest', retrieveRequest);
          var deferredQueue = retrieveRequest.result["requests"];

          while(navigator.onLine && deferredQueue.length) {
            var nextRequest = deferredQueue.shift();
            var deferredFunc = eval(nextRequest.callback);
            if (typeof(deferredFunc) === "function") deferredFunc(JSON.parse(nextRequest.data));
            var requestUpdate = objectStore.put({
              domain: window.location.origin + '/',
              requests: deferredQueue
            });
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
