var socket;
var myId;
var mySprite;
var dots = [];
var params;

var DHTMLSprite = function(params) {
    var tmp = 3 + 2;
    var width = params.width,
    height = params.height,
    imagesWidth = params.imagesWidth,
    $element = params.$drawTarget.append('<div/>').find(':last'),
    elemStyle = $element[0].style,
    mathFloor = Math.floor;
    
    $element.css({
        position: 'absolute',
        width: width,
        height: height,
        backgroundImage: 'url(' + params.images + ')'
    });
    
    var that = {
        draw: function(x, y) {
            elemStyle.left = x + 'px';
            elemStyle.top = y + 'px';
        },
        changeImage: function(index) {
            index *= width;
            var vOffset = -mathFloor(index / imagesWidth) * height;
            var hOffset = -index % imagesWidth;
            elemStyle.backgroundPosition = hOffset + 'px ' + vOffset + 'px';
        },
        show: function() {
            elemStyle.display = 'block';
        },
        hide: function() {
            elemStyle.display = 'none';
        },
        destroy: function() {
            $element.remove();
        }
    };
    
    return that;
};

$(document).ready(function() {
    params = {
        images: 'sprites.png',
        imagesWidth: 64,
        width: 32,
        height: 32,
        $drawTarget: $('#draw-target')
    };
    
    socket = new WebSocket("ws://192.168.2.55:1101");
    
    socket.onopen = function() {
	console.log("Connection established");
        socket.send("whoami");
    }
    
    socket.onclose = function() {
        disableMovement();
	console.log("Connection has died!");
    }
    
    socket.onmessage = function(msg) {
        var args = msg.data.split(":");
        
        if (args[0] === "you") {
            console.log("My id is: " + args[1]);
            myId = parseInt(args[1], 10);
            enableMovement();
        } else {
            var uId = parseInt(args[0], 10);
            
	    if (args[1] === "coords") {
		if (uId !== myId) {
		    var found = false;
		    var coords = args[2].split(";");

		    for (i in dots) {
			if (dots[i].id === uId) {
			    dots[i].sprite.draw(parseInt(coords[0], 10), parseInt(coords[1], 10));
			    found = true;
			}
		    }
		    
		    if (!found) {
			dots.push(newDot(uId));
			dots[dots.length - 1].sprite.changeImage(1);
			dots[dots.length - 1].sprite.draw(parseInt(coords[0], 10), parseInt(coords[1], 10));
		    }
		}
	    } else if (args[1] === "dead") {
		var remove = -1;
		
		for (i in dots) {
		    if (dots[i].id === uId) {
			dots[i].sprite.hide();
			remove = i;
		    }
		}

		if (remove != -1) {
		    dots.splice(i, 1);
		}
	    }
        }
    } 
    
    mySprite = DHTMLSprite(params);
    
    mySprite.draw(64, 64);
});

function enableMovement() {
    $('#draw-target').click(function(args) {
        mySprite.draw(args.layerX - 16, args.layerY - 16);
        socket.send((args.layerX - 16) + ";" + (args.layerY - 16));
    });
}

function disableMovement() {
    $('#draw-target').unbind('click');
}

function newDot(newId) {
    return {
	id: newId,
	sprite: DHTMLSprite(params)
    }
}