var dagreD3= require("dagre-d3");
var _transitions,
    _actions,
    _state,
    _states,
    _ws;

exports.machine = function (transitions, actions, state, states, wss) { 
  console.log("Booting FSM");
  _transitions = transitions;
  _actions = actions;
  _state = state;
  _states = states;
  _wss = wss;
  wss.on('connection', function(ws) {
     ws.send(getGraph());
  });

   function loop() {
    for (possibleNewState in _transitions[_state]) {
      if (_transitions[_state][possibleNewState]()) {
        // Changing state
        console.log("Changed state from " + _state + " to " + possibleNewState); 
        _state = possibleNewState;
        // If any actions are defined on the new state
        // activate the action
        if (_actions[_state]) _actions[_state]();
        // can draw here and send refresh signal to browser to get new image by websockets.
        for (var i in _wss.clients) {
          _wss.clients[i].send(getGraph());
        }
        break; // Only go to one state
      }
    }
    setImmediate(loop); 
  }
  loop(); 
}

function getGraph () {
  var g = new dagreD3.Digraph();
  for (state in _states) {
   var style = "";
   if (_states[state] === _state) {
         style = "fill: #f77"; 
   }
   var stateNode = g.addNode(_states[state], {label: _states[state], style:style});//,{"color" : "blue" });
  }
  for (state in _states) {
    for (toState in _states) {
      if (_transitions[_states[state]]) {
        if (_transitions[_states[state]][_states[toState]]) {
          var functionStr = _transitions[_states[state]][_states[toState]].toString();
          var re = /function\s+\(.*\)\s+\{\sreturn(.+)\(\);\}/; 
          m = re.exec(functionStr);
          if (m == null) m = ["", "."]; 
         g.addEdge(null, _states[state], _states[toState], {label: m[1]});
        }
      }
    }
  }
  var serializedGraph = dagreD3.json.encode(g);
  return JSON.stringify(serializedGraph);
}
