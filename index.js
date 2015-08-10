var shuffle = require('shuffle-array');
//var EventEmitter = require('events').EventEmitter;
var EventTarget = require('biee').EventTarget;
var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require('express');
var QUESTIONS = require('./questions');
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
	this.questionSequence = Player.setupQuestions();
	Player.instances[this.id] = this;
}
Player.instances = {};
Player.get = function(id) {
	return Player.instances[id] || (new Player(id));
}
Player.setupQuestions = function() {
	return shuffle(Array.apply(null, {length: Game.MAX_SCORE}).map(Number.call, Number));
}
Player.prototype = Object.create(EventTarget.prototype);
Player.prototype.setScore = function(amount) {
	amount = amount || 1;
	this.score += amount;
}
Player.prototype.getNextQuestion = function() {
	return this.questionSequence.pop();
}

var Game = function() {
	this.id = new Date().getTime();
	this.score = Game.MAX_SCORE;
	this.publish('answer', {
		defaultFn: this._answer
	})
	this.players = {};
	// Let's prepare the quesitons for this game
	this.questions = shuffle(Game.getQuestions(this.id));
	// expose this instance to the global name (Game)
	Game.instances[this.id] = this;
	console.log('New game started with %s questions', this.score);
}
Game.MAX_SCORE = 16;
Game.instances = {};
Game.getQuestions = function(id) {
	for (var question, questions = [], i = 0; i < Game.MAX_SCORE; i++) {
		question = QUESTIONS[(id + i) % QUESTIONS.length];
		questions.push({
			card: i,
			q: question.q,
			o: [question.o1, question.o2, question.o3, question.o4],
			a: question.a
		});
	}
	return questions;
};

Game.prototype = Object.create(EventTarget.prototype);
Game.prototype._answer = function(e, opt) {
	if (opt.player) {
		opt.player.score += 1;
	}
	this.score -= 1;
};
Game.prototype.answer = function(player) {
	/* One player answered correctly to a question, update the game score.
	*/
	var question = this.questions[this.score - 1];
	this.fire('answer', {'question': question, 'player': player});
	console.log('Question %s answered!', question);
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

app.get('/:game', function(req, res) {
	var player = Player.get(req.ip),
		game = Game.instances[req.params.game],
		questionIndex = player.getNextQuestion();
	res.render('question', {
		x: questionIndex,
		question: game.questions[questionIndex]
	});
});

app.get('/:game/answer', function(req, res) {
	// a player answers a question. Now we just assume she answers correctly every time
	var player = Player.get(req.ip),
		game = Game.instances[req.params.game];
	game.addPlayer(player);
	game.answer(player);
	res.send(JSON.stringify(true));
})

wss.on("connection", function(ws) {
	var game;
	console.log("New board incoming...");
	ws.on('message', function(message) {
		var gameId = message;
		// Client sends in game-id
		console.log("Connected to board %s", gameId);
		game = Game.instances[gameId];
		game.on('answer', function(question) {
			ws.send(JSON.stringify(question), function(){});
		});
	})
	ws.on("close", function() {
		delete Game[game.id];
		console.log("Board connection close, removed game %s", game.id);
	})
})
