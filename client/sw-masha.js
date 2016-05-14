//console.log(this);
//var A_CACHE = 'a-cache';
//var filesToCache = [
//	'/',
//  '/index.html',
//  '/messages.html',
//	'/offline.html'
//];
//
//self.addEventListener('install', function(event) {
//	event.waitUntil(
//		caches.open(A_CACHE)
//			.then(function(cache) {
//				console.log('Opened Cache', cache);
//				return cache.addAll(filesToCache);
//			})	
////		fetch(offlineRequest).then(function(response) {
////			caches.open(OFFLINE_CACHE).then(function(cache) {
////				return cache.add(offlineRequest, response);
////			})
////		})
//		
//	);
//});
//
//self.addEventListener('fetch', function(event) {
////	function errorFunc(error) {
////		console.log("Failed, need to load offline page");
////		return caches.open(A_CACHE).then(function(cache) {
////			return cache.match('offline.html');
////		});
////	}
//	
//	if(event.request.method === 'GET') {
//		event.respondWith(
//			caches.match(event.request).then(function(response) {
//					// If files requested match the files available in the cache, respond with that, otherwise fetch the files from the server.
//					// Also if fetching from server, if suddenly go offline, get offline page.
//				
////					if(/*online*/) {
////						return response || fetch(event.request);
////					}else if(/*offline*/) {
////						caches.open(A_CACHE).then(function(cache) {
////						console.log('I am offline', cache.match('offline.html') );
////							return cache.match('offline.html').then(function(response) { 
////								return response.url;
////							});
////						});
////					}
//			}
//		));
//	}
//});
//
//self.addEventListener('activate', function(event) {
//  // Calling claim() to force a "controllerchange" event on navigator.serviceWorker
//  event.waitUntil(self.clients.claim());
//});