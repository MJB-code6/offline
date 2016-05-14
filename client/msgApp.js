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
  mjb.sendOrQueue(function(){
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

// var messageQueue = [];
//
// function queueMessage() {
//   console.log('in queueMessage');
//   var obj = prepareMessage();
//   messageQueue.push(obj);
// }

// function sendQueue() {
//   console.log('in sendQueue');
//   while (messageQueue.length) {
//     $.ajax({
//       type: 'POST',
//       data: JSON.stringify(messageQueue.shift()),
//       contentType: 'application/json; charset=UTF-8',
//       url: './messages',
//     }).then(function(data) {
//       getMessage();
//     });
//   }
// }

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
