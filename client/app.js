skyport.cache([
  "/index.html",
  "/messages.html",
  "/app.js",
  "/msgApp.js",
  "/style.css",
  "/assets/vid1.mp4",
  "/assets/vid3.mp4",
  "/assets/birdy1.jpg",
  "/assets/birdy2.gif",
  "/assets/birdy3.gif",
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
