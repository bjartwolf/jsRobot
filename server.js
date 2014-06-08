var serialport = require("serialport"),
    http = require("http");
var sp = new serialport.SerialPort("/dev/ttyAMA0", {
        baudrate: 300 
});

var sending = false;
var serialOpen = false;

sp.on("open", function () {
   serialOpen = true; 
   console.log("opened serial port");
}); 

// Takes input in forms of three-char strings of ints
// "000" to "255"
function color(r,g,b) {
  if (r.length != 3 || g.length != 3 || b.length != 3) throw "Error in input" 
  return "#PR"+r+"G"+g+"B"+b+"T001";
}

function send(msg) {
   if (sending) throw "Can not send in sending state";
   sending = true;
   sp.write(msg, function(err, results) {
	   if (err) {
	       console.log('err ' + err);
	   } else {
		sp.drain( function () { sending = false;});
	   }
   });
}

function fsm() {
   var READY_TO_PROCESS_MSG = "ReadyToProcessMessage",
       INIT = "Init",
       PROCESSING_MSG = "ProcessingMessage",
       messages = [],
       states = [INIT, READY_TO_PROCESS_MSG, PROCESSING_MSG],
       state = INIT,
       transitions = {},
       actions = {};
   transitions[INIT] = {};
   transitions[INIT][READY_TO_PROCESS_MSG] = function () { return serialOpen && !sending;};
   transitions[PROCESSING_MSG] = {};
   transitions[PROCESSING_MSG][READY_TO_PROCESS_MSG] = function () {return !sending;};
   transitions[READY_TO_PROCESS_MSG] = {};
   transitions[READY_TO_PROCESS_MSG][PROCESSING_MSG] = function () {return messages.length > 0; };	
   actions[PROCESSING_MSG] = function () {
	     console.log("Processing " + messages);
             var msg = messages.pop(); 
             if (msg == 'red' || msg == 'green' || msg == 'blue' ) {
               if (msg == 'red') send(color("255","000","000")); 
               if (msg == 'green') send(color("000","255","000")); 
               if (msg == 'blue') send(color("000","000","255")); 
              }
   	     } 
   function loop() {
        for (possibleNewState in transitions[state]) {
		if (transitions[state][possibleNewState]()) {
			   state = possibleNewState;
			   if (actions[state]) actions[state]();
			   break;
		}
	}
        setImmediate(loop); 
   }
   setImmediate(loop); 
   return function(msg) {
      messages.unshift(msg);
   }
}

http.createServer(function(req, res) {
  var url = req.url.substring(1); // remove slash
  if (url == 'red' || url == 'green' || url == 'blue') {
     queue(url); 
     res.writeHead(200, {'Content-Type': 'text/plain'});
     res.end(url + ' queued');
  } else {
     res.writeHead(404, {'Content-Type': 'text/plain'});
     res.end('not message here');
  }
}).listen(80,'192.168.1.13');

var queue = fsm();
