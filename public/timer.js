
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

Timer.prototype.changeStop = function(newStop) {
	this._stop = newStop;
	console.log('Changing stop time', this._stop, newStop);
}

Timer.prototype.changeDuration = function(msec) {
	this.changeStop(this._stop + msec);
}

Timer.prototype.changeSpeed = function(ratio) {
	this.changeStop(this._stop / ratio);
}
