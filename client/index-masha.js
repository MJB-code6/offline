//// have the load, etc. listeners in this message. if online etc. use postmessage to send online/etc.
//// in sw-masha.js load the response with the 'message listener'
//// window.navigator.controller
//
//window.addEventListener('load', function(e) {
//	if (navigator.onLine) {
//		console.log('We\'re online!');
//		// send online
//		this.onmessage = function(event){
//  		clients.matchAll().then(function(clients){
//    		clients.postMesssage('MESSAGE TEST');
//  		});
//		}
//	} else {
//		console.log('We\'re offline...');
//		// send offline
//	}
//}, false);
//
//window.addEventListener('online', function(e) {
//	console.log('And we\'re back :).');
//	return response || fetch(event.request);
//}, false);
//
//window.addEventListener('offline', function(e) {
//console.log('Connection is down.');
//	caches.open(A_CACHE).then(function(cache) {
//	console.log('I am offline', cache.match('offline.html') );
//		return cache.match('offline.html').then(function(response) { 
//			return response.url;
//		});
//	})
//}, false);