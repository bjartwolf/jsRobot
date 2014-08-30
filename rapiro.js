var serialport = require("serialport");

// Should try to refactor to FSM but I can't think of 
// a good way without generators that don't work on RPi with SerialPort yet... 

// Takes input in forms of three-char strings of ints
// "000" to "255"
function color(r,g,b) {
  if (r.length != 3 || g.length != 3 || b.length != 3) throw "Input 0 as 000 etc" 
  if (parseInt(r)<0 && parseInt(r)>255 && parseInt(g)<0 && parseInt(g)>255 && parseInt(b)<0 && parseInt(b) > 255) throw "Values out of range";
  return "#PR"+r+"G"+g+"B"+b+"T001";
}

var sp = new serialport.SerialPort("/dev/ttyAMA0", {
        baudrate: 300 
});

// Should only have init, open, sending - NOT 4 states
var isOpen = false;
var sending = false;

function send(msg) {
   if (sending) throw "Can not send in sending state";
   sending = true;
   var serialCmd;
   if (msg == 'red') serialCmd = color("255","000","000"); 
   else if (msg == 'green') serialCmd = color("000","255","000"); 
   else if (msg == 'blue') serialCmd = color("000","000","255"); 
   else throw "No such command"
   sp.write(serialCmd, function(err, results) {
	   if (err) {
	       throw err; 
	   } else {
		sp.drain( function () { sending = false;});
	   }
   });
}

sp.on("open", function () {
   isOpen = true; 
}); 

exports.send = send;
exports.sending = function () { return sending; };
exports.initialized  = function () {return isOpen; };
