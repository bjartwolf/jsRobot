var serialport = require("serialport"),
    sm = require('javascript-state-machine');

var sp; // Serialport as global variable to be reachable from all states

var fsm = sm.create({
    initial: 'INITIALIZING',
    events: [{
        name: 'open',
        from: 'INITIALIZING',
        to: 'READY_TO_RECIEVE'
    }, {
        name: 'send',
        from: 'READY_TO_RECIEVE',
        to: 'SENDING'
    }, {
        name: 'finishedSending',
        from: 'SENDING',
        to: 'READY_TO_RECIEVE'
    }],
    callbacks: {
        onINITIALIZING: function() {
//            sp = new serialport.SerialPort("/dev/pts/23", { baudrate: 300 });
            sp = new serialport.SerialPort("/dev/ttyAMA0", { baudrate: 300 });
            sp.on("open", function() { // Notify state machine that serialport is open
                fsm.open();
            });
        },
        onleaveINITIALIZING: function() { // triggering on open event
            console.log("Serialport open");
        },
        onSENDING: function(event, from, to, msg) {
            fsm.finishedSending(msg);
        }, // THis is weird... Must refactor async thingy 
        onleaveSENDING: function(_, _, _, msg) {
           var serialCmd = convertCmdToSerial(msg);
           sp.write(serialCmd, function(err, results) {
                if (err) {
                    throw err;
                } else {
                    sp.drain(function() {
                        console.log("Sent: " + serialCmd);
                        fsm.transition();
//                        setTimeout( function () {fsm.transition();}, 2000); // This allows for leaving state
                    });
                }
            });
            return sm.ASYNC;
        }
    }
});

function convertCmdToSerial(msg) {
    var serialCmd;
    if (msg == 'red') serialCmd = color("255", "000", "000");
    else if (msg == 'green') serialCmd = color("000", "255", "000");
    else if (msg == 'blue') serialCmd = color("000", "000", "255");
    else if (msg == 'stop') serialCmd = "#M0";
    else if (msg == 'forward') serialCmd = "#M1";
    else if (msg == 'backward') serialCmd = "#M2";
    else if (msg == 'waveandgreen') serialCmd = "#M5";
    else if (msg == 'raisehandsandblue') serialCmd = "#M7";
    else throw "No such command"
    return serialCmd;
} 

// Takes input in forms of three-char strings of ints such as "000", "255", "124"
// and returns a formatted string to send to Rapiro to change colors of eyes
function color(r,g,b) {
    if (r.length != 3 || g.length != 3 || b.length != 3) throw "Input 0 as 000 etc"
    if (parseInt(r) < 0 || parseInt(r) > 255 || parseInt(g) < 0 || parseInt(g) > 255 || parseInt(b) < 0 || parseInt(b) > 255) throw "Values out of range";
    return "#PR" + r + "G" + g + "B" + b + "T001";
}

exports.send = function(msg) {
    fsm.send(msg);
};
exports.state = function() {
    return fsm.current;
}
/*
var repl = require("repl");
repl.start({
  prompt: "node via stdin> ",
  input: process.stdin,
  output: process.stdout
}).context.fsm = fsm;
*/
