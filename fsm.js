module.exports = function (transitions, actions, state) { 
	function loop() {
		for (possibleNewState in transitions[state]) {
			if (transitions[state][possibleNewState]()) {
				   // Changing state
				   console.log("Changed state from " + state + " to " + possibleNewState); 
				   state = possibleNewState;
				   // If any actions are defined on the new state
				   // activate the action
				   if (actions[state]) actions[state]();
				   break;
			}
		}
		setImmediate(loop); 
	   }
	   loop(); 
}
