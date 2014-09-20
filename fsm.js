var graphviz = require('graphviz');

var _transitions,
    _actions,
    _state,
    _states;

exports.machine = function (transitions, actions, state, states) { 
  console.log("Booting FSM");
  _transitions = transitions;
  _actions = actions;
  _state = state;
  _states = states;
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
        // draw(); 
        break; // Only go to one state
      }
    }
    setImmediate(loop); 
  }
  loop(); 
}

// Takes a http response stream and writes 
// a png of current state machine to it
exports.draw = function (res) {
  var g = graphviz.digraph("G");
  for (state in _states) {
    var stateNode = g.addNode(_states[state], {"color" : "blue" });
    if (_states[state] === _state) {
      stateNode.set("style", "filled");
    }
    for (toState in _states) {
      if (_transitions[_states[state]][_states[toState]]) {
        g.addEdge(_states[state],_states[toState]);
      }
    }
  }
  g.render("png", function(render) {
      res.end(render);
  });
}