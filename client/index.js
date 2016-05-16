(function() {
  console.log('start of index.js, this is', this);
  if (!navigator.serviceWorker) return;

  var db;
  var serviceWorker = navigator.serviceWorker.controller;
  console.log("nscontroller", navigator.serviceWorker.controller);
  if (!serviceWorker) {
    navigator.serviceWorker.register('/sw.js', {
      scope: '.'
    }).then(function(registration) {
      console.log('The service worker has been registered ', registration);
      serviceWorker = registration.active || registration.waiting || registration.installing;
      serviceWorker.onmessage = function(event) {
        console.log("I got a message from the sw:", event.data);
      }
      mjb.cache(['/index.js']);
      sendToSW({command: 'createDB', info: window.location.origin});
    });
  }

  window.mjb =  window.mjb || {

    cache: function(assetArray, fallback) {
      if (fallback) assetArray.push(fallback);
      sendToSW({
        command: 'cache',
        info: assetArray
      });
    },

    fallback: function(fallbackPage) {
    	sendToSW({
        command: 'fallback',
        info: fallbackPage
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
      // var objectStore = db.transaction(["deferredRequests"], "readwrite").objectStore("deferredRequests");
      // var request = objectStore.get(window.location.origin);
      // request.onerror = function(event) {
      //   console.log("error:", event);
      // };
      // request.onsuccess = function(event) {
      //   // Get the old value that we want to update
      //   var deferredQueue = request.result["requests"];
      //
      //   // update the value(s) in the object that you want to change
      //   deferredQueue.push({data: dataObj, callback: '(' + deferredFunc.toString() + ')'});
      //
      //   // Put this updated object back into the database.
      //   var requestUpdate = objectStore.put({domain: window.location.origin, requests: deferredQueue});
      //    requestUpdate.onerror = function(event) {
      //      console.log("error:", event);
      //    };
      //    requestUpdate.onsuccess = function(event) {
      //      console.log("successfully updated", event);
      //    };
      // };
    }
  };

  window.addEventListener('online', function(event) {
    console.log("heard 'online'");
    sendToSW({command: "online", info: true});
    emptyQueue();
    // sendToSW({command: "empty", info: window.location.origin});
  });

  window.addEventListener('offline', function(event) {
    console.log("heard 'offline'");
    sendToSW({command: "online", info: false});
  });

  window.addEventListener('load', function(event) {
    console.log("heard 'load'");
  });

<<<<<<< HEAD
  // MASHA'S CODE
	
  // BRANDON'S CODE
  const dbName = "MJB_DEFERRED";
=======
  // mjb.cache = function(assetArray, fallback) {
  //   if (fallback) assetArray.push(fallback);
  //   sendToSW({command: 'cache', info: assetArray});
  // }
  //
  // mjb.fallback = function(fallbackPage) {
  // 	sendToSW({command: 'fallback', info: fallbackPage});
  // }
  //
  // mjb.sendOrQueue = function(dataObj, deferredFunc) {
  //   if (navigator.onLine) return deferredFunc(dataObj);
  //
  //   if (typeof(deferredFunc) !== "function") return;
  //
  //
  //   // var objectStore = db.transaction(["deferredRequests"], "readwrite").objectStore("deferredRequests");
  //   // var request = objectStore.get(window.location.origin);
  //   // request.onerror = function(event) {
  //   //   console.log("error:", event);
  //   // };
  //   // request.onsuccess = function(event) {
  //   //   // Get the old value that we want to update
  //   //   var deferredQueue = request.result["requests"];
  //   //
  //   //   // update the value(s) in the object that you want to change
  //   //   deferredQueue.push({data: dataObj, callback: '(' + deferredFunc.toString() + ')'});
  //   //
  //   //   // Put this updated object back into the database.
  //   //   var requestUpdate = objectStore.put({domain: window.location.origin, requests: deferredQueue});
  //   //    requestUpdate.onerror = function(event) {
  //   //      console.log("error:", event);
  //   //    };
  //   //    requestUpdate.onsuccess = function(event) {
  //   //      console.log("successfully updated", event);
  //   //    };
  //   // };
  // }

  function emptyQueue() {
    var openRequest = indexedDB.open('DEFERRED', 1);

    openRequest.onsuccess = function(e) {
      var db = e.target.result;
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
          if (typeof(deferredFunc) === "function") deferredFunc(JSON.parse(nextRequest.data));
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

    };
>>>>>>> 9f3f2ea5b3135e220790b90ca14044a4f91c9a97


  }

  // function createDB() {
    // console.log('in createDB');
    // var request = indexedDB.open('DEFERRED', 1);
    //
    // request.onerror = function(event) {
    //   console.error("Error:", event);
    // };
    //
    // request.onupgradeneeded = function(event) {
    //   console.log('in onupgradeneeded');
    //   db = event.target.result;
    //   console.log("db is", db);
    //   var objectStore = db.createObjectStore("deferredRequests", { keyPath: "domain" });
    // };
    //
    // request.onsuccess = function(event) {
    //   console.log('in onsuccess');
    //   db = event.target.result;
    //     console.log("db is", db);
    //   var dRObjectStore = db.transaction("deferredRequests", "readwrite").objectStore("deferredRequests");
    //   dRObjectStore.add({domain: window.location.origin, requests: []});
    // };
  // }

  function sendToSW(messageObj) {
    console.log("in sendToSW, serviceWorker is", serviceWorker);
    if (!serviceWorker) {
      console.log("no serviceWorker found,");
      navigator.serviceWorker.oncontrollerchange = function() {
        console.log("controller change", navigator.serviceWorker);
        serviceWorker = navigator.serviceWorker.controller;
        serviceWorker.postMessage(messageObj);
        // serviceWorker.removeEventListener('oncontrollerchange', listener);
      }
    } else {
      serviceWorker.postMessage(messageObj);
    }
  }

})();
