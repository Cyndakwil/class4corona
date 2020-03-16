var express = require('express');
var SocketIO = require("socket.io")
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var path = require('path');
var cors = require('cors');
var io = SocketIO(server)


var users = {};
var name = '';

app.use(cors());
app.use(express.urlencoded( {extended: true} ))
// Use correct file directory

app.use(express.static(__dirname + '/public')).listen(3000, function() {
	console.log(`Listening`);
});

app.get('/video', function(req, res) {
	const path = 'assets/sample.mp4'
	const stat = fs.statSync(path)
	const fileSize = stat.size
	const range = req.headers.range
	if (range) {
	  const parts = range.replace(/bytes=/, "").split("-")
	  const start = parseInt(parts[0], 10)
	  const end = parts[1] 
		? parseInt(parts[1], 10)
		: fileSize-1
	  const chunksize = (end-start)+1
	  const file = fs.createReadStream(path, {start, end})
	  const head = {
		'Content-Range': `bytes ${start}-${end}/${fileSize}`,
		'Accept-Ranges': 'bytes',
		'Content-Length': chunksize,
		'Content-Type': 'video/mp4',
	  }
	  res.writeHead(206, head);
	  file.pipe(res);
	} else {
	  const head = {
		'Content-Length': fileSize,
		'Content-Type': 'video/mp4',
	  }
	  res.writeHead(200, head)
	  fs.createReadStream(path).pipe(res)
	}
  });

  app.get('/host', function(req, res) {
	  res.sendFile(__dirname + '/public/hosting.html');
  });

  app.get('/createclass', function(req, res) {
	res.sendFile(__dirname + '/public/createClass.html');
});

app.post('/createclass',function(req,res){
	var user_name=req.body.name;
	var school=req.body.school;
	var s_class = req.body.s_clas;
	var description = req.body.desc;
	var reqcode = req.body.reqcode

	console.log("User name = "+user_name+", school is "+school);
	res.end("yes");
  });

app.get('/joinclass', function(req, res) {
	res.sendFile(__dirname + '/public/joinClass.html');
});

var rooms = [];

  //Socket.io handlers
  io.on('connection', function(socket){
  	console.log('A user connected');
	socket.on("disconnect", function() {
		console.log("A user disconnected")
	});

	socket.on("packet", function(packet) {
		//send packet to users in room
	});
  });