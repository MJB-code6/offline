console.log('start of app.js')
skyport.static(3, [
  "/",
  "/index.html",
  "/feature.html",
  // "/app.js",
  "/msgApp.js",
  "/style.css",
  "/assets/vid1.mp4",
  "/assets/vid3.mp4",
  "/assets/birdy1.jpg",
  "/assets/birdy2.gif",
  "/assets/birdy3.gif",
  "https://ajax.googleapis.com/ajax/libs/jquery/2.2.3/jquery.min.js",
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
  // "/sw-one.js"
  // "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js"
]);

skyport.dynamic(["/messages"]);

// caches.keys().then(function(keylist) {
//   keylist.forEach(function(key) {
//     caches.open(key).then(function(cache) {
//       cache.match('/assets/birdy1.jpg').then(function(response) {
//         console.log('found', response);
//       }).catch(function(error) {
//         console.log('error', error);
//       })
//     })
//   })
// })
//
// caches.keys().then(function(keylist) {
//   keylist.filter(function(key) {
//     return /^sky-pre/.test(key)
//   }).forEach(function(key) {
//     caches.open(key).then(function(cache) {
//       cache.match('/assets/birdy1.jpg').then(function(response) {
//         console.log('found', response);
//       }).catch(function(error) {
//         console.log('error', error);
//       })
//     })
//   })
// })
