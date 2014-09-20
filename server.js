var http = require("http"),
    rapiro = require("./rapiro.js"),
    fs = require("fs"),
    WebSocket = require("ws"),
    Sound = require("simple-mplayer"),
    fsm = require('./fsm.js');

function process_messages_fsm(wss) {
   var hatexml = "./hatexml.mp3"; 
   var hatesound = new Sound(hatexml);
   var NEUTRAL = "Neutral",
       INIT = "Init",
       RESTFUL = "RESTful",
       ENTERPRISY = "Enterprisey",
       DEADINSIDE = "Dead inside",
       RESTAFARI = "Restafarian",
       PROCESSING_XML_RESTFUL= "Processing XML while RESTful",
       PROCESSING_XML_ENTERPRISY = "Processing XML while Enterprisey",
       PROCESSING_JSON_RESTFUL = "Processing JSON while RESTful", 
       PROCESSING_JSON_ENTERPRISY = "Processing JSON while Enterprisey",
       messages = [],
       states = [INIT,NEUTRAL, RESTFUL, ENTERPRISY, DEADINSIDE, RESTAFARI, PROCESSING_JSON_ENTERPRISY, PROCESSING_JSON_RESTFUL, PROCESSING_XML_ENTERPRISY, PROCESSING_XML_RESTFUL], 
       state = INIT,
       transitions = {},
       actions = {};
       function messagesIsEmpty() { return messages.length  == "0"; };	
       function nextMessageXML () { return messages[0] == "json"; };	
       function nextMessageJSON () { return messages[0] == "xml"; };	
       function rapiroIsReady() { return rapiro.state()=="READY_TO_RECIEVE";}; 
       transitions[INIT] = {};
       transitions[INIT][NEUTRAL] = function () { return rapiroIsReady();} 
//       transitions[PROCESSING_MSG] = {};
 //      transitions[PROCESSING_MSG][NEUTRAL] = function () {return rapiro.state()=="READY_TO_RECIEVE";};
       transitions[NEUTRAL] = {};
       transitions[NEUTRAL][RESTFUL] = function () { return nextMessageJSON();} 
       transitions[NEUTRAL][ENTERPRISY] = function () { return nextMessageXML();} 
       transitions[ENTERPRISY] = {};
       transitions[ENTERPRISY][NEUTRAL] = function () { return messagesIsEmpty();};
       transitions[ENTERPRISY][PROCESSING_XML_ENTERPRISY] = function () { return nextMessageXML(); } 
       transitions[ENTERPRISY][PROCESSING_JSON_ENTERPRISY] = function () { return nextMessageJSON(); } 
       transitions[RESTFUL] = {};
       transitions[RESTFUL][PROCESSING_XML_RESTFUL] = function () { return nextMessageXML() ;} 
       transitions[RESTFUL][PROCESSING_JSON_RESTFUL] = function () { return nextMessageJSON();} 
       transitions[RESTFUL][NEUTRAL] = function () { return messagesIsEmpty(); }; 
       transitions[PROCESSING_JSON_RESTFUL] = {};
       transitions[PROCESSING_XML_RESTFUL] = {};
       transitions[PROCESSING_JSON_ENTERPRISY] = {};
       transitions[PROCESSING_XML_ENTERPRISY] = {};
       transitions[PROCESSING_JSON_RESTFUL][RESTAFARI] = function () { return nextMessageJSON();}; 
       transitions[PROCESSING_XML_ENTERPRISY][DEADINSIDE] = function () { return nextMessageXML();}; 

       transitions[PROCESSING_XML_ENTERPRISY][ENTERPRISY] = function () { return rapiroIsReady();}; 
       transitions[PROCESSING_XML_RESTFUL][RESTFUL] = function () { return rapiroIsReady();}; 

       transitions[PROCESSING_JSON_ENTERPRISY][ENTERPRISY] = function () { return rapiroIsReady();}; 
       transitions[PROCESSING_JSON_RESTFUL][RESTFUL] = function () { return rapiroIsReady();}; 
       
       actions[RESTFUL] = function () {
    //   hatesound.play();
         var msg = messages.shift();
//         if (msg == "json") return; 
		     rapiro.send("green");
       } 
   fsm.machine(transitions, actions, state, states, wss);
   return function(msg, requestBody) { 
      messages.push(msg);
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
 } else if (cmd == "fsm") {
    var index = fs.readFileSync("index.html");
     res.writeHead(200, {'Content-Type': 'text/html'});
     res.end(index);
 } else if (cmd.substr(0,3)  == "pic") {
     res.writeHead(200, {'Content-Type': 'image/png'});
     fsm.draw(res);
  } else if (cmd == "data") {
     res.writeHead(200, {'Content-Type': 'text/plain'});
     if (req.headers['content-type'] == 'application/json') { queue("json", req.body);};
     if (req.headers['content-type'] == 'application/xml') { queue("xml", req.body);};
     res.end('Data recieved');
  } else {
     res.writeHead(404, {'Content-Type': 'text/plain'});
     res.end('not message here');
  }
}).listen(80, ip);
console.log("Listening");
