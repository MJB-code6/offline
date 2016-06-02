<<<<<<< HEAD
=======
console.log('start of app.js')
<<<<<<< HEAD
>>>>>>> 825d68fd7db363816d6ae1040ea823de5c8bc085
skyport.cache([
=======

skyport.static(3, [
>>>>>>> bb6980d5cd032526ded1c1b78a42dd7d7eef5da3
  "/",
  "/index.html",
  "/feature.html",
  // "/app.js",
  "/msgApp.js",
  "/style.css",
  "/assets/birdy1.jpg",
  "/assets/birdy2.gif",
  "/assets/birdy3.gif",
<<<<<<< HEAD
  // "https://code.jquery.com/ui/1.11.4/jquery-ui.min.js",
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js"
]);

// skyport.fallback("/messages");
setTimeout(function() {
	skyport.dynamic([
		"./messages",
		"/assets/vid3.mp4",
		"/assets/vid1.mp4"							
	]);
}, 1000);
=======
  "https://ajax.googleapis.com/ajax/libs/jquery/2.2.3/jquery.min.js",
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
  "/sw-one.js",
  "/assets/vid1.mp4",
  "/assets/vid3.mp4",
  // "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js"
]);

<<<<<<< HEAD
setTimeout(function(){skyport.dynamic(["/messages"])}, 1000);
>>>>>>> 825d68fd7db363816d6ae1040ea823de5c8bc085
=======
skyport.dynamic(["/messages"]);
>>>>>>> bb6980d5cd032526ded1c1b78a42dd7d7eef5da3
