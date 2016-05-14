console.log('sw.js started');

const CACHE_NAME = 'unicorn';

var REQUIRED_FILES = [];

var _INDEX = [
  './',
  './index.html',
  './style.css',
  './index-brandon.js',
  './msgApp.js',
  './assets/lion.png',
  './assets/giraffe.png',
  './messages.html',
  // './sw-brandon.js',
  './assets/vid1.mp4',
  './assets/vid2.mp4',
  './assets/vid3.mp4',
  './assets/vid4.mp4'
];

REQUIRED_FILES = REQUIRED_FILES.concat(_INDEX);

var _OTHER = [
  './assets/rabbit.png',
  './assets/eagle.png'
];

REQUIRED_FILES = REQUIRED_FILES.concat(_OTHER);

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[install] Adding to cache');
        return cache.addAll(REQUIRED_FILES);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          console.log(
            '[fetch] Returning from ServiceWorker cache: ',
            event.request.url
          );
          return response;
        }
        console.log('[fetch] Returning from server: ', event.request.url);
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  console.log('[activate]');
  event.waitUntil(self.clients.claim());
});
