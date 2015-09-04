var http = require('http');
var fs = require('fs');
var Promise = require('es6-promise').Promise;

function download(url, dest) {
    return new Promise(function(resolve, reject) {
        var file = fs.createWriteStream(dest);
        console.log('Requesting %s...', url);
        var request = http.get(url, function(response) {
          response.pipe(file);
          console.log('Saved %s in %s', url, dest);
          resolve()
        });
    });
}

var photo_paths = [];
for (var i=0,j=10; i<j; i++) {
    photo_paths.push("public/photos/00" + i + ".jpg");
}

photo_paths.reduce(function(cur, next) {
    return cur.then(function() {
        return download("http://loremflickr.com/800/600", next);
    });
}, Promise.resolve());
