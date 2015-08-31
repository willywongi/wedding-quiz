var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
// as soon as the connection to the server is opened, tell what's current game id.
ws.onopen = function() {
	ws.send(JSON.stringify(GAME_ID));
}
ws.onmessage = function(event) {
	// The server is telling me which question has been correctly answered.
	var data = JSON.parse(event.data);
	// let's flip the card.
	console.log(event.data);
	$('#card' + data).toggleClass('flipped');
};
$(function() {
	new QRCode(document.getElementById("player-qrcode"), window.location.protocol + "//" + window.location.host + "/" + GAME_ID + "/question");
})