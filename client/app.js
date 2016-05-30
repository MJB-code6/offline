console.log('start of app.js')

skyport.static(3, [
  "/",
  "/index.html",
  "/feature.html",
  // "/app.js",
  "/msgApp.js",
  "/style.css",
  "/assets/birdy1.jpg",
  "/assets/birdy2.gif",
  "/assets/birdy3.gif",
  "https://ajax.googleapis.com/ajax/libs/jquery/2.2.3/jquery.min.js",
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
  "/sw-one.js",
  "/assets/vid1.mp4",
  "/assets/vid3.mp4",
  // "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js"
]);

skyport.dynamic(["/messages"]);
