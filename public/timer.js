
function Timer(frameFn, msec) {
	this._initialDuration = msec;
	this._frameFn = frameFn;
	this._start = this.reset();
}

Timer.prototype.start = function() {
	var frameFn = this._frameFn,
		start = this._start;
	return new Promise(function(resolve, reject) {
		var prevNow = start,
			_frameFn = function(now) {
				var elapsed = now - start,
					total = this._stop - start,
					timeStep = now - prevNow;
			
				if (now < this._stop) {
					frameFn.call(this, now, elapsed, total, timeStep);
					prevNow = now;
					window.requestAnimationFrame(_frameFn);
				} else {
					resolve.call(this, now, elapsed, total);
				}
			}.bind(this);
		window.requestAnimationFrame(_frameFn);
	}.bind(this));
}

Timer.prototype.reset = function() {
	this._start = window.performance.now();
	this._stop = this._start + this._initialDuration;
	return this._start;
}

Timer.prototype.changeDuration = function(msec) {
	var newStop = (this._stop + msec > window.performance.now()) ? this._stop + msec : this._stop;
	console.log('Changing stop time', this._stop, newStop);
	this._stop = newStop;
}

/*
var previousValue = 0,
	progressBar = document.getElementById('progress-bar');
TIMER = new Timer(function(now, elapsed, total, timeStep) {
		var nextValue = previousValue + timeStep / total;
		progressBar.style.width = 100 * nextValue + "%";
		previousValue = nextValue;
	}, 30000);
	
	TIMER.start().then(function() {
		console.log('Timer ended!');
	});
*/