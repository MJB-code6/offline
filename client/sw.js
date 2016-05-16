console.log('sw.js started');

const CACHE_JOE = 'joe';
const CACHE_MASHA = 'masha';
const CACHE_BRANDON = 'brandon';

var online = true; // Boolean

var JOE_FILES = [];

var MASHA_FILES = [];

var BRANDON_FILES = [];

self.addEventListener('install', function(event) {
//  event.waitUntil(
  // // JOE'S CODE
    caches.open(CACHE_JOE)
      .then(function(cache) {
        console.log('[install] Adding to joe cache');
        return cache.addAll(JOE_FILES);
      })
  // MASHA'S CODE
		
  // BRANDON'S CODE

  // STANDARD CODE
//    .then(function() {
//      console.log('going to skip waiting');
      return self.skipWaiting();
//    })
//  );
});

self.addEventListener('fetch', function(event) {
  // JOE'S CODE
//  event.respondWith(
//    caches.match(event.request)
//    .then(function(response) {
//      if (response) return response;
//      return fetch(event.request);
//    }).catch(function(){
//      return caches.match(JOE_FILES[JOE_FILES.length - 1]); //responde to no internet
//    })
//  )

  // MASHA'S CODE
	event.respondWith(
		caches.match(event.request).then(function(response) {
			if(online) {
				return response || fetch(event.request);
			}else if(!online) {
				return response || caches.open(CACHE_MASHA).then(function(cache) {
					console.log('I am offline') );
					return cache.match('offline.html');
				});
			}
		})
	);

  // BRANDON'S CODE


  // STANDARD CODE

//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           console.log(
//             '[fetch] Returning from ServiceWorker cache: ',
//             event.request.url
//           );
//           return response;
//         }
//         console.log('[fetch] Returning from server: ', event.request.url);
//         return fetch(event.request);
//       }
//     )
//   );
});

self.addEventListener('message', function(event) {
  // ONLINE OFFLINE MESSAGE


  // JOE'S CODE
	if (event.data.command === "cache") {
    JOE_FILES = event.data.info;
    caches.open(CACHE_JOE)
    .then(function(cache) {
      return cache.addAll(JOE_FILES);
    })
  }
	
  // MASHA'S CODE	
	// initially cache the fallback into the cache
	if(event.data.command === "fallback") {
		caches.open(CACHE_MASHA)
	 		.then(function(cache) {
		 		return cache.add(event.data.info);
	 		})
	}
	
	if (event.data.command === "offline") {
   online = event.data.info;
   console.log("heard offline message. online is now", online);
 	}

	if (event.data.command === "online") {
	 online = event.data.info;
	 console.log("heard online message. online is now", online);
	 console.log(caches);
	}
//	console.log(event.data.command, event.data.info);
//	console.log("the message event", event);

// first cache the fallback page, second listen for messages and if offline/online serve etc. for example if offline, check if asset they are asking is in cache first. if not, render offline page)
	// check if coming from the right page
	// if(event.data.command === "fallback") {
	 //open cache
	 // add(event.data.info) }


  // BRANDON'S CODE
  if (event.data.command === "offline") {
    online = event.data.info;
    console.log("heard offline message. online is now", online);
  }

  if (event.data.command === "online") {
    online = event.data.info;
    console.log("heard online message. online is now", online);
    console.log(caches);
  }

  // if (event.data.command === "defer") {
  //   event.waitUntil(
  //     caches.open(PENDING_REQUESTS)
  //     .then(function(cache) {
  //       console.log('[install] Adding to pending requests cache');
  //       return cache.addAll(event.data.info);
  //     })
  //   );
  // }

  // STANDARD CODE

});


self.addEventListener('activate', function(event) {

  // JOE'S CODE


  // MASHA'S CODE


  // BRANDON'S CODE


  // STANDARD CODE
  console.log('[activate]');
  event.waitUntil(self.clients.claim());
});
