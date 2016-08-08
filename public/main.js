var pictionary = function(){
	var socket = io();
	var canvas;
	var content;

	var draw = function(position){
		context.beginPath();
		context.arc(position.x, position.y, 
						6, 0, 2*Math.PI);
		context.fill();
	};

	canvas = $('canvas');
	context = canvas[0].getContext('2d');
	canvas[0].width = canvas[0].offsetWidth;
	canvas[0].height = canvas[0].offsetHeight;
	
	//----------------------------------//
	//		 INSTRUCTIONS CLEAR		    //
	//----------------------------------//
	//var clearCanvas = $('#clearCanvas');
	$('#okConfirm').on('click', function(){
		$('#instruct').css('display','none');
	});

	//----------------------------------//
	//		    ARTIST SELECT		    //
	//----------------------------------//
	var isArtist = false;
	socket.on('artistSelect', function(bool){
		if(bool === true){
			console.log('YOU ARTIST');
			isArtist = true;
			$('#draw').css('display','block');
			$('#guess').css('display','none');
			$('#clearCanvas').css('display','');
		}else{
			console.log('NOT ARTIST');
			isArtist = false;
			$('#draw').css('display','none');
			$('#guess').css('display','block');
			$('#clearCanvas').css('display','none');
		};
	});

	//----------------------------------//
	//		   WORD SELECT   	        //
	//----------------------------------//
	socket.on('drawThis', function(word){
			$('#drawWord').html(word);
	});

	//----------------------------------//
	//		   REBUILD ART      	    //
	//----------------------------------//
	socket.on('rebuildCanvas', function(artwork){
		console.log('Artwork has lines:', artwork.length);
		for(var i =0; i<artwork.length; i++){
			draw(artwork[i]);
		};
	});

	//----------------------------------//
	//		    CLEAR CANVAS            //
	//----------------------------------//
	var clearCanvas = $('#clearCanvas');
	var clearCanvasFunc = function(){
		console.log('ClEAR CANVAS CLICKED FUNCTION');
		canvas[0].width = canvas[0].width;
	};
	clearCanvas.on('click', function(){
		clearCanvasFunc();
		socket.emit('destoryDrawing');
	});
	socket.on('destoryDrawing', function(){
		clearCanvasFunc();
	});


	//----------------------------------//
	//			DRAWING SECTION			//
	//----------------------------------//
	//--Pencil Down--//
	var pencilDown = false;
	canvas.on('mousedown', function(){
		pencilDown = true;
	});
	canvas.on('mouseup', function(){
		pencilDown = false;
	});

	//--Draw Client--//
	canvas.on('mousemove', function(event){
		if(pencilDown && isArtist){
			var offset = canvas.offset();
			var position = {x: event.pageX - offset.left,
							y: event.pageY - offset.top};
			socket.emit('drawing', position);
			draw(position);
		};
	});
	//--Draw Server--//
	socket.on('otherDrawing', function(coordinates){
		draw(coordinates);
	});

	//----------------------------------//
	//			GUESS SECTION			//
	//----------------------------------//
	//--Guess Box--//
	var guessBox;
	var onKeyDown = function(event){
		if(event.keyCode != 13){
			return;
		}
		socket.emit('guessUser', guessBox.val());
		guessBox.val('');
	};

	guessBox = $('#guess input');
	guessBox.on('keydown', onKeyDown);

	//--User Guess--//
	socket.on('guessOther', function(guess){
		$('#userGuess').prepend('<div class="guessTry">'+guess+'?</div>');
	});

	//----------------------------------//
	//	   ARTIST REASSIGN WINNER 	    //
	//----------------------------------//
	socket.on('nextArtist', function(){
		socket.emit('nextArtistReassign');
	});

	//----------------------------------//
	//			  USER LEAVE		    //
	//----------------------------------//
	window.addEventListener("beforeunload", function () {
  		socket.emit('userLeave');
	});

	//----------------------------------//
	//	         ARTIST REASSIGN	    //
	//----------------------------------//
	socket.on('artistReassign', function(){
		socket.emit('reassignmentRequest');
	});
};

$(document).ready(function(){
	pictionary();
});