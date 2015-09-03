var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
var TIMER;
// as soon as the connection to the server is opened, tell what's current game id.
ws.onopen = function() {
	ws.send(JSON.stringify(GAME_ID));
}
ws.onmessage = function(event) {
	// The server is telling me which question has been correctly answered.
	var data = JSON.parse(event.data);
	console.log('Correct answer!');
	$('.progress-bar:not(.okay)').first().addClass('okay');
};

$(function() {
	new QRCode(document.getElementById("player-qrcode"), window.location.protocol + "//" + window.location.host + "/" + GAME_ID + "/question");
	
});

