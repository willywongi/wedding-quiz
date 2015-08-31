var shuffle = require('shuffle-array');
var EventTarget = require('biee').EventTarget;
var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require('express');

// app specific info
var QUESTIONS = require('./questions').QUESTIONS;

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
	this.questions = [];
}

var Game = function() {
	this.id = new Date().getTime();
	this.score = Game.MAX_SCORE;
	this.players = {};
	// Let's prepare the quesitons for this game
	for (var questions = [], i = 0, x = QUESTIONS.length; i < this.score; i++) {
		var q = QUESTIONS[i % x];
		questions.push({
			q: q.q,
			o: q.o,
			a: q.a,
			id: i
		});
	}
	this.questions = questions;
	// events
	this.publish('response', {
		defaultFn: this._onResponse.bind(this)
	});
	// expose this instance to the global name (Game)
	Game.instances[this.id] = this;
	console.log('New game started with %s questions', this.score);
}
Game.MAX_SCORE = 16;
Game.instances = {};
Game.prototype = Object.create(EventTarget.prototype);
Game.prototype.getQuestion = function(index) {
	return this.questions[index];
}
Game.prototype.answer = function(questionIndex, answer, player) {
	/* If player answered correctly to the question, update the game score. 
	*/
	var question = this.getQuestion(questionIndex),
		result = (question.a === answer);
	console.log(JSON.stringify(question));
	this.fire('response', {
		question: question,
		playerAnswer: answer,
		player: player,
		result: result
	});
	return result;
}

Game.prototype._onResponse = function(e, context) {
	if (context.response) {
		this.score -= 1;
		context.question.answered = true;
		console.log('Question %s answered by player %s', context.question.id, context.player);
		if (context.player) {
			context.player.score += 1;
		}
	}
}
Game.prototype.addPlayer = function(playerId) {
	if (! this.players.hasOwnProperty(playerId)) {
		this.players[playerId] = new Player(playerId);
	}
	return this.players[playerId];
}
Game.prototype.getQuestionForPlayer = function(player) {
	if (! player.questions.length) {
		var questions = [];
		for (var i = 0; i < Game.MAX_SCORE; i++) {
			var q = this.getQuestion(i);
			if (! q.answered) {
				questions.push(i);
			}
		}
		player.questions = shuffle(questions);
		console.log('Generated question sequence for player %s: %s', player.id, player.questions);
	}
	return this.getQuestion(player.questions.pop());
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

app.get('/:game/question', function(req, res) {
	// a player asks for a question
	var quiz = Game.instances[req.params.game],
		player = quiz.addPlayer(req.ip),
		question = quiz.getQuestionForPlayer(player);
	console.log('Asked current question (%s)', question.q);
	res.render('question', {
		id: question.id,
		questionText: question.q,
		questionOptions: question.o,
		gameId: req.params.game
	});
});

app.get('/:game/respond/:question/:answer', function(req, res) {
	// a player answers a question. 
	var quiz = Game.instances[req.params.game],
		player = quiz.addPlayer(req.ip), 
		questionIndex = parseInt(req.params.question, 10),
		answer = parseInt(req.params.answer, 10),
		result;
	result = quiz.answer(questionIndex, answer, player);
	console.log("q: %s, a: %s. Result: %s", questionIndex, answer, result);
	res.send(JSON.stringify(result));
})

wss.on("connection", function(ws) {
	var gameId;
	console.log("New board incoming...");
	ws.on('message', function(gameId) {
		// Client sends in game-id
		console.log("Connected to board %s", gameId);
		var game = Game.instances[gameId]; 
		game.on('response', function(e, context) {
			if (context.result) {
				// a question has been correctly answered
				console.log('Answer responded correctly, uncovering tile %s', context.question.id);
				ws.send(JSON.stringify(context.question.id));
			}
		})
	})
	ws.on("close", function() {
		delete Game[gameId];
		console.log("Board connection close, removed game %s", gameId);
	})
})
