const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

var htmlFile;

fs.readFile(path.join(__dirname, '../client/index.html'), function(err, data) {
  if (err) throw err;
  htmlFile = data;
  // var stringFile = htmlFile.toString();
  // var hrefs = stringFile.match(/<[^>]+href=('.+')/g);
  // hrefs.forEach(function(href) {
  //   console.log(href.split('href=')[1]);
  // });
  // var srcs = stringFile.match(/<[^>]+src=('.+')/g);
  // srcs.forEach(function(src) {
  //   console.log(src.split('src=')[1]);
  // });
});

app.get('/', function(req, res) {
  console.log('index');
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(htmlFile);
});

app.get('*.js', function(req, res) {
  console.log("in server (js)", req.url);
  res.writeHead(200, {'Content-Type': 'text/javascript'});
  res.end(fs.readFileSync(path.join(__dirname, '../client', req.url)));
});

app.get('*.html|*.png|*.css', function(req, res) {
  console.log("in server (other)", req.url);
  res.statusCode = 200;
  res.end(fs.readFileSync(path.join(__dirname, '../client', req.url)));
});

app.get('*.ico', function(req, res) {
  console.log("ico", req.url);
  res.statusCode = 200;
  res.end(fs.readFileSync(path.join(__dirname, '../client/assets', req.url)));
});

app.post('/button', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end("hello");
});

app.get('*', function(req, res) {
  console.log('caught:', req.url);
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.end();
});

app.listen(3000);
