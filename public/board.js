var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
var TIMER,
	starting,
	STARTED = false;
// as soon as the connection to the server is opened, tell what's current game id.
ws.onopen = function() {
	ws.send(JSON.stringify(GAME_ID));
}
ws.addEventListener('message', function(event) {
	// The server is telling me which question has been correctly answered.
	var data = JSON.parse(event.data) /*,
		starting = new Promise(function(resolve, reject) {
			if (event.data.type == 'boardStart') {
				console.log('boardStart event')
				resolve();
			}
		})*/;
	if (data.type == 'correctAnswer') {
		console.log('Correct answer!');
		TIMER.changeDuration(-2000);
	}
});

starting = new Promise(function(res, rej) {
	ws.addEventListener('message', function(event) {
		var data = JSON.parse(event.data);

		if (data.type == 'boardStart') {
			console.log('boardStart event')
			res();
		}
	});
});

$(document).ready(function() {
	new QRCode(document.getElementById("player-qrcode"), window.location.protocol + "//" + window.location.host + "/" + GAME_ID + "/question");
	$('#slideshow').find('img').each(function(){
		console.log(this.src, this.width, this.height)
		var imgClass = (this.width/this.height > 1) ? 'wide' : 'tall';
	 	$(this).addClass(imgClass);
	});
	var progressBar = document.getElementById('progress-bar');
	TIMER = new Timer(function(now, elapsed, total, timeStep) {
			progressBar.style.width = (elapsed / total * 100) + "%";
		}, 10000);
	

	var slideshow = $('#slideshow > div').toArray().map(function(div) {
		return function() {
			console.log('Slideshowing')
			$('#slideshow > div:first')
							.fadeOut(1000)
							.remove();
			TIMER.reset();
			return TIMER.start();
		}
	});
	
	slideshow.reduce(function(cur, next) {
	    return cur.then(next);
	}, starting).then(function() {
	    //all executed
		console.log('all executed!');
	});
});
