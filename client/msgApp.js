$(document).ready(function(e) {
  getMessage();
  $('#message-button').on('click', function() {
    sendMessage();
  });
});

function getMessage() {
  $.ajax({
    type: 'GET',
    url: './messages',
  })
  .done(function(data) {
    $('#messageBoard').empty();
    renderMessages(data);
    setTimeout(getMessage, 2000);
  });
}

function renderMessages(messages) {
  var $messages = $('<ul></ul>');
  for (var i = 0; i < messages.length; i++) {
    $messages.append('<li><span class="author">' + messages[i].author + '</span> ' + messages[i].message +'</li>');
  }
  $('#messageBoard').append($messages);
}

function sendMessage(value) {
  console.log('in sendMessage');
  console.log('argument:', value);
  var obj = prepareMessage();
<<<<<<< HEAD
	// Doing steps necessary before so you know what to save into function
	// show differences between using with our function and without.
	// only difference is mj.sendOrQueue. Both ways they send they're request, but this function allows an additional option to queue the requests if somehow user goes offline and be able to process the request automatically when back online.
  mjb.sendOrQueue(function(){
=======
  mjb.sendOrQueue(obj, function(obj){
>>>>>>> 9f3f2ea5b3135e220790b90ca14044a4f91c9a97
    $.ajax({
      type: 'POST',
      data: JSON.stringify(obj),
      contentType: 'application/json; charset=UTF-8',
      url: './messages',
    }).then(function(data) {
      getMessage();
    });
  });
}

function prepareMessage() {
  var message = $('#newComment').val().trim();
  if (!message) return;
  var author = 'Brandon';
  var obj = {};
  if (message) {
    obj.message = message;
  }
  if (author) {
    obj.author = author;
  }
  return obj;
}
