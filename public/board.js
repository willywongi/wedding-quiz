var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
// as soon as the connection to the server is opened, tell what's current game id.
ws.onopen = function() {
	ws.send(JSON.stringify(GAME_ID));
}
ws.onmessage = function(event) {
	// The server is telling me which question has been correctly answered.
	var questions = parseInt(event.data, 10);
	// let's flip the card.
	$('#card' + questions).toggleClass('flipped');
};
