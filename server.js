var http = require("http"),
    rapiro = require("./rapiro.js"),
    Sound = require("simple-mplayer"),
    fsm = require('./fsm.js');

function process_messages_fsm() {
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
   fsm.machine(transitions, actions, state, states);
   return function(msg) {
      messages.unshift(msg);
   }
}

var queue = process_messages_fsm();
http.createServer(function(req, res) {
  var cmd = req.url.substring(1); // remove slash
  if (cmd == 'red' || cmd == 'green' || cmd == 'blue') {
     console.log("Queued " + cmd);
     queue(cmd); 
     res.writeHead(200, {'Content-Type': 'text/plain'});
     res.end(cmd + ' queued');
 } else if (cmd == "pic") {
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
}).listen(80,'10.0.0.5');
console.log("Listening");

