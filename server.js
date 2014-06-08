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

function color(r,g,b) {
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
       state = INIT, 
       messages = [];
   function loop() {
       if (state == INIT) {
           if (serialOpen && !sending) {
              state = READY_TO_PROCESS_MSG; 
	   }
       } else if (state == PROCESSING_MSG) {
           if(!sending) {
              state = READY_TO_PROCESS_MSG; 
           }
       } else if (state == READY_TO_PROCESS_MSG) {
           if (messages.length > 0) {
             state = PROCESSING_MSG; 
	     console.log("Processing " + messages);
             var msg = messages.pop(); 
             if (msg == 'red' || msg == 'green' || msg == 'blue' ) {
               if (msg == 'red') send(color("255","000","000")); 
               if (msg == 'green') send(color("000","255","000")); 
               if (msg == 'blue') send(color("000","000","255")); 
              }
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
