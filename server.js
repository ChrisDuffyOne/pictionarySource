var http = require('http');
var express = require('express');
var socket_io = require('socket.io');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

//------------------------//
//     GAMESTATE DATA     //
//------------------------//
var players = [];
var artwork = [];
var WORDS = [
    "word", "letter", "number", "person", "pen", "class", "people",
    "sound", "water", "side", "place", "man", "men", "woman", "women", "boy",
    "girl", "year", "day", "week", "month", "name", "sentence", "line", "air",
    "land", "home", "hand", "house", "picture", "animal", "mother", "father",
    "brother", "sister", "world", "head", "page", "country", "question",
    "answer", "school", "plant", "food", "sun", "state", "eye", "city", "tree",
    "farm", "story", "sea", "night", "day", "life", "north", "south", "east",
    "west", "child", "children", "example", "paper", "music", "river", "car",
    "foot", "feet", "book", "science", "room", "friend", "idea", "fish",
    "mountain", "horse", "watch", "color", "face", "wood", "list", "bird",
    "body", "dog", "family", "song", "door", "product", "wind", "ship", "area",
    "rock", "order", "fire", "problem", "piece", "top", "bottom", "king",
    "space"
];
var drawWord;

//------------------------//
//       SOCKET APP       //
//------------------------//
io.on('connection', function(socket){
	
	//------------------------//
	//   NEW USER CONNECT     //
	//------------------------//
	if(players.length === 0){
		var newPlayer = {id: socket.id, artist: true};
		players.push(newPlayer);	
		socket.emit('artistSelect', newPlayer.artist);
		
		//Select Word
		drawWord = WORDS[Math.floor(Math.random()*(WORDS.length-0+1)+0)];
		socket.emit('drawThis', drawWord);
	}else{
		var newPlayer = {id: socket.id, artist: false};
		players.push(newPlayer);
		socket.emit('artistSelect', newPlayer.artist);
	};

	//------------------------//
	//     DRAWING EVENTS     //
	//------------------------//
	//--Rebuild Drawing--//
	socket.emit('rebuildCanvas', artwork);

	//--Drawing--//
	socket.on('drawing', function(coordinates){
		socket.broadcast.emit('otherDrawing', coordinates);
		artwork.push(coordinates);
	});

	//--Clear Drawing--//
	socket.on('destoryDrawing', function(){
		socket.broadcast.emit('destoryDrawing');
		artwork = [];
	});

	//------------------------//
	//       USER GUESS       //
	//------------------------//
	socket.on('guessUser', function(guess){
		io.emit('guessOther', guess);
		var userGuess = guess.toLowerCase();
		if(userGuess === drawWord){

			//Reset Artist
			for(var i=0; i<players.length; i++){
				if(players[i].artist === true){
						console.log('Current artist index is:', i);
						players[i].artist = false;
				};
			};

			//Reasssign Winner
			for(var i=0; i<players.length; i++){
				if(players[i].id === socket.id){
						console.log('Winner index is:', i);
						players[i].artist = true;
				};
			};

			//Next Artist
			io.emit('nextArtist');
		};		
	});
	//--Assign next artist--//
	socket.on('nextArtistReassign', function(){
		for(var i=0; i<players.length; i++){
			if(players[i].id === socket.id){
				socket.emit('artistSelect', players[i].artist);
				if(players[i].artist === true){
					drawWord = WORDS[Math.floor(Math.random()*(WORDS.length-0+1)+0)];
					socket.emit('drawThis', drawWord);
				};
			};
		};
	});

	//------------------------//
	//       USER LEAVE       //
	//------------------------//
	socket.on('userLeave', function(message){
		console.log('Left User ID:',socket.id);
		for(var i=0; i<players.length; i++){
			
			if(players[i].id === socket.id){				
				var leftUser = players.splice(i,1);
				
				//If user was artist reassign//
				if(leftUser[0].artist === true){
					if(players.length > 0) players[0].artist = true;
					socket.broadcast.emit('artistReassign');
				};
			}
		};
	});
	//--Artist Reassignment--//
	socket.on('reassignmentRequest', function(){
		if(players[0].id === socket.id){
			console.log('Next artist is:', socket.id);
			socket.emit('artistSelect', players[0].artist);
			
			//Select Word
			drawWord = WORDS[Math.floor(Math.random()*(WORDS.length-0+1)+0)];
			socket.emit('drawThis', drawWord);
		};
	});
});

console.log('Pictionary Server is online');
server.listen(process.env.PORT || 8080);