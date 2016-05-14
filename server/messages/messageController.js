var messages = require('./messageDB');

module.exports = {
  getMessages: (req, res) => {
    res.writeHead(200, {'content-type':'json'});
    res.end(JSON.stringify(messages));
  },

  postMessage: (req, res) => {
    console.log('req.body',req.body);
    msgObj = {
      author: req.body.author,
      message: req.body.message
    };
    messages.push(msgObj);
    res.writeHead(200, {'content-type':'json'});
    res.end(JSON.stringify(messages));
  }
};
