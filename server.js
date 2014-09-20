var http = require("http"),
    rapiro = require("./rapiro.js"),
    fs = require("fs"),
    WebSocket = require("ws"),
    Sound = require("simple-mplayer"),
    fsm = require('./fsm.js');

function process_messages_fsm(wss) {
   //var hatexml = "./hatexml.mp3"; 
   //var hatesound = new Sound(hatexml);
   var READY_TO_PROCESS_MSG = "ReadyToProcessMessage",
       INIT = "Init",
       PROCESSING_MSG = "ProcessingMessage",
       messages = [],
       states = [INIT, READY_TO_PROCESS_MSG, PROCESSING_MSG],
       state = INIT,
       transitions = {},
       actions = {};
   transitions[INIT] = {};
   transitions[INIT][READY_TO_PROCESS_MSG] = function () { return rapiro.state()=="READY_TO_RECIEVE";};
   transitions[PROCESSING_MSG] = {};
   transitions[PROCESSING_MSG][READY_TO_PROCESS_MSG] = function () {return rapiro.state()=="READY_TO_RECIEVE";};
   transitions[READY_TO_PROCESS_MSG] = {};
   transitions[READY_TO_PROCESS_MSG][PROCESSING_MSG] = function () {return messages.length > 0; };	
   actions[PROCESSING_MSG] = function () {
    //   hatesound.play();
		     rapiro.send(messages.pop());
   } 
   fsm.machine(transitions, actions, state, states, wss);
   return function(msg) {
      messages.unshift(msg);
   }
}


var ip = '10.0.0.5';
var wss = new WebSocket.Server({host: ip, port:8080});

//ws.on('message', function(message) {
//  ws.send(message);
//});

var queue = process_messages_fsm(wss);

http.createServer(function(req, res) {
  var cmd = req.url.substring(1); // remove slash
  if (cmd == 'red' || cmd == 'green' || cmd == 'blue') {
     console.log("Queued " + cmd);
     queue(cmd); 
     res.writeHead(200, {'Content-Type': 'text/plain'});
     res.end(cmd + ' queued');
 } else if (cmd == "html") {
    var index = fs.readFileSync("index.html");
     res.writeHead(200, {'Content-Type': 'text/html'});
     res.end(index);
 } else if (cmd.substr(0,3)  == "pic") {
     res.writeHead(200, {'Content-Type': 'image/png'});
     fsm.draw(res);
  } else if (cmd == "json") {
     res.writeHead(200, {'Content-Type': 'text/plain'});
     res.write("skriver...");
     req.pipe(process.stdout);
     res.end('piping done');
  } else {
     res.writeHead(404, {'Content-Type': 'text/plain'});
     res.end('not message here');
  }
}).listen(80, ip);
console.log("Listening");
