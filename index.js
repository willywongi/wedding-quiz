var shuffle = require('shuffle-array');
var EventEmitter = require('events').EventEmitter;
var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require('express');
var app = express();
var port = process.env.PORT || 5000
app.set('port', port);
app.set('views', __dirname + '/pages');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})

var Player = function(clientIp) {
	// a Player is id'ed by its IP address.
	this.id = clientIp;
	this.score = 0;
}

var Game = function() {
	this.id = new Date().getTime();
	this.score = Game.MAX_SCORE;
	this.ws = null;
	this.players = {};
	// Let's prepare the quesitons for this game
	for (var questions = [], i = 0; i < this.score; i++) {
		questions.push(i);
	}
	this.questions = shuffle(questions);
	// expose this instance to the global name (Game)
	Game.instances[this.id] = this;
	console.log('New game started with %s questions', this.score);
}
Game.MAX_SCORE = 16;
Game.instances = {};
Game.prototype = Object.create(EventEmitter.prototype);  // FIXME: event emitter
Game.prototype.answer = function(player) {
	/* One player answered correctly to a question, update the game score. 
	*/
	this.score -= 1;
	var card = this.questions[this.score];
	console.log('Question answered! Uncover card %s', card);
	if (player) {
		player.score += 1;
	}
	if (this.ws) {
		// Tells the board to update itself.
		// FIXME: event emitter
		this.ws.send(JSON.stringify(card), function(){});
	}
}
Game.prototype.addPlayer = function(player) {
	if (! this.players.hasOwnProperty(player.id)) {
		this.players[player.id] = player;
	}
}

app.get('/board', function(req, res) {
	// When someone connects to this url, there's a board. Give it a new game.
	var game = new Game();
	var blocks = [],
		image1 = {
			width: 460,
			height: 385
		},
		side = Math.sqrt(Game.MAX_SCORE),
		w = image1.width / side,
		h = image1.height / side;
	for (var i = 0, j = Math.pow(side, 2); i<j; i++) {
		var x = i % side,
			y = Math.floor(i / side);
		blocks.push({
			card: i,
			top: (h * y) + "px",
			left: (w * x) + "px",
			width: (w) + "px",
			height: (h) + "px",
			bgLeft: (w * x * -1) + "px",
			bgTop: (h * y * -1) + "px"
		})
	}

	res.render('board', {
		gameId: game.id,
		width: image1.width,
		height: image1.height,
		url: '/photos/1.jpg',
		blocks: blocks
	});	
})

app.get('/:game/answer', function(req, res) {
	// a player answers a question. Now we just assume she answers correctly every time
	var player = new Player(req.ip),
		quiz = Game.instances[req.params.game];
	quiz.addPlayer(player);
	quiz.answer(player);
	res.send(JSON.stringify(true));
})

wss.on("connection", function(ws) {
	var gameId;
	console.log("New board incoming...");
	ws.on('message', function(message) {
		gameId = message;
		// Client sends in game-id
		console.log("Connected to board %s", gameId);
		Game.instances[gameId].ws = ws;
	})
	ws.on("close", function() {
		delete Game[gameId];
		console.log("Board connection close, removed game %s", gameId);
	})
})
