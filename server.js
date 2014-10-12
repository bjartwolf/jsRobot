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
       function msgEmptyAndRapiroReady() { return messages.length  == 0 && rapiroIsReady(); };	
       function nextMessageXML () { return messages[0] == "xml" && rapiroIsReady(); };	
       function nextMessageJSON () { return messages[0] == "json" && rapiroIsReady(); };	
       function rapiroIsReady() { return rapiro.state()=="READY_TO_RECIEVE";}; 
       transitions[INIT] = {};
       transitions[INIT][NEUTRAL] = function () { return rapiroIsReady();} 
       transitions[NEUTRAL] = {};
       transitions[NEUTRAL][RESTFUL] = function () { return nextMessageJSON();} 
       transitions[NEUTRAL][ENTERPRISY] = function () { return nextMessageXML();} 
       transitions[ENTERPRISY] = {};
       transitions[ENTERPRISY][NEUTRAL] = function () { return msgEmptyAndRapiroReady();};
       transitions[ENTERPRISY][PROCESSING_XML_ENTERPRISY] = function () { return nextMessageXML();} 
       transitions[ENTERPRISY][PROCESSING_JSON_ENTERPRISY] = function () { return nextMessageJSON();} 
       transitions[RESTFUL] = {};
       transitions[RESTFUL][PROCESSING_XML_RESTFUL] = function () { return nextMessageXML();} 
       transitions[RESTFUL][PROCESSING_JSON_RESTFUL] = function () { return nextMessageJSON();} 
       transitions[RESTFUL][NEUTRAL] = function () { return msgEmptyAndRapiroReady();}; 
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
       
       actions[PROCESSING_JSON_RESTFUL] = function () {
         rapiro.send("green");
         messages.shift();
       }
       actions[PROCESSING_JSON_ENTERPRISY] = function () {
         rapiro.send("green");
         messages.shift();
       }
       actions[PROCESSING_XML_RESTFUL] = function () {
         rapiro.send("yellow");
         messages.shift();
      }
       actions[PROCESSING_XML_ENTERPRISY] = function () {
         rapiro.send("yellow");
         var msg = messages.shift();
         console.log(msg.body);
       }
       actions[DEADINSIDE] = function () {
         hatesound.play();
		     rapiro.send("raisehandandblue");
       } 
       actions[RESTAFARI] = function () {
         var msg = messages.shift();
		     rapiro.send("waveandgreen");
       } 
       actions[RESTFUL] = function () {
          rapiro.send("green");
       } 
   fsm.machine(transitions, actions, state, states, wss);
   return function(msg) { 
      messages.push(msg);
   }
}


//var ip = '10.0.0.5';
var ip = 'localhost';
var wss = new WebSocket.Server({host: ip, port:8080});

var queue = process_messages_fsm(wss);

var server = http.createServer(function(req, res) {
  var cmd = req.url.substring(1); // remove slash
  if (cmd == "") {
    var index = fs.readFileSync("index.html");
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
  } else if (cmd.substr(0,3) == "lib") {
    var index = fs.readFileSync(cmd);
    res.writeHead(200, {'Content-Type': 'application/javascript'});
    res.end(index);
  } else if (cmd == "data") {
     res.writeHead(200, {'Content-Type': 'text/plain'});
     var msg = req.headers['content-type'];
     console.log(msg);
     if (msg === 'application/json') { queue("json");};
     if (msg === 'application/xml') { queue("xml");};
     res.end('Data recieved');
  } else {
     res.writeHead(404, {'Content-Type': 'text/plain'});
     res.end('Nothing here');
  }
}).listen(80, ip);
console.log("Listening");
