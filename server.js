var serialport = require("serialport"),
    http = require("http");

var sp = new serialport.SerialPort("/dev/ttyAMA0", {
        baudrate: 300 
});
sp.isOpen = false;

// Takes input in forms of three-char strings of ints
// "000" to "255"
function color(r,g,b) {
  if (r.length != 3 || g.length != 3 || b.length != 3) throw "Input 0 as 000 etc" 
  if (parseInt(r)<0 && parseInt(r)>255 && parseInt(g)<0 && parseInt(g)>255 && parseInt(b)<0 && parseInt(b) > 255) throw "Values out of range";
  return "#PR"+r+"G"+g+"B"+b+"T001";
}

function send(msg) {
   if (sp.sending) throw "Can not send in sending state";
   sp.sending = true;
   sp.write(msg, function(err, results) {
	   if (err) {
	       console.log('err ' + err);
	   } else {
		console.log("Sending");
		sp.drain( function () { sp.sending = false;});
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
   transitions[INIT][READY_TO_PROCESS_MSG] = function () { return sp.isOpen && !sp.sending;};
   transitions[PROCESSING_MSG] = {};
   transitions[PROCESSING_MSG][READY_TO_PROCESS_MSG] = function () {return !sp.sending;};
   transitions[READY_TO_PROCESS_MSG] = {};
   transitions[READY_TO_PROCESS_MSG][PROCESSING_MSG] = function () {return messages.length > 0; };	
   actions[PROCESSING_MSG] = function () {
		     console.log("Processing " + messages);
		     var msg = messages.pop(); 
		     if (msg == 'red') send(color("255","000","000")); 
		     if (msg == 'green') send(color("000","255","000")); 
		     if (msg == 'blue') send(color("000","000","255")); 
   		} 
   function loop() {
        for (possibleNewState in transitions[state]) {
		if (transitions[state][possibleNewState]()) {
			   state = possibleNewState;
			   // If any actions are defined on the new state
                           // activate the action
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
console.log("Listening");


sp.on("open", function () {
   sp.isOpen = true; 
   console.log("opened serial port");
}); 

var queue = fsm();
//repl.start({
//  prompt: "node via stdin> ",
//  input: process.stdin,
//  output: process.stdout
//}).context.sp = sp;
