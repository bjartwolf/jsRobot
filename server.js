var http = require("http"),
    rapiro = require("./rapiro.js");

// Creates the statemachine and returns a que you can add messages too by calling the 
// returned function 
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
    transitions[INIT][READY_TO_PROCESS_MSG] = function() {
        return rapiro.state() == "READY_TO_RECIEVE";
    };
    transitions[PROCESSING_MSG] = {};
    transitions[PROCESSING_MSG][READY_TO_PROCESS_MSG] = function() {
        return rapiro.state() == "READY_TO_RECIEVE";
    };
    transitions[READY_TO_PROCESS_MSG] = {};
    transitions[READY_TO_PROCESS_MSG][PROCESSING_MSG] = function() {
        return messages.length > 0;
    };
    actions[PROCESSING_MSG] = function() {
        rapiro.send(messages.pop());
    }
    require("./fsm.js")(transitions, actions, state);
    return function(msg) {
        messages.unshift(msg); // Like push, but to the other end
    }
}

var queue = fsm();

http.createServer(function(req, res) {
    var url = req.url.substring(1); // remove slash
    if (url == 'red' || url == 'green' || url == 'blue') {
        console.log("Queued " + url);
        queue(url);
        res.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        res.end(url + ' queued');
    } else {
        res.writeHead(404, {
            'Content-Type': 'text/plain'
        });
        res.end('not message here');
    }
//}).listen(80, '192.168.1.13');
}).listen(1337, '127.0.0.1');
console.log("Listening");
