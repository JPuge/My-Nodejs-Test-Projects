console.log("Initializing...");

var cmd = require('./cmd.js');
cmd.log("Local IO engine is running!");

var mysql = require('mysql');
var DATABASE = "localDb";
var TABLE = "userLog";
var client = mysql.createClient({
    user: 'root',
    password: ''
});
cmd.log("MySql connection established!");

cmd.log("Choosing database...");
client.query('USE ' + DATABASE);
cmd.log("Database chosen!");

cmd.log("Setting up websocket...");
var WebSocketServer = require('websocket').server;
var http = require('http');
var users = [];
var userId = 0;

var server = http.createServer(function(request, response) {
    cmd.log((new Date()) + " Received request for " + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(1101, function() {
    cmd.log((new Date()) + " Server is listening on port 1101");
    cmd.log("Welcome, dotserver is running! :o)");
    cmd.listening(true);
});

var wsServer = new WebSocketServer({ httpServer: server,
				     autoAcceptConnections: false });

cmd.log("Adding commands...");
cmd.add("totalUserCount", function(args) {
    cmd.log("Connected users: " + users.length);
}, "Prints the total number of clients connected to the server");

cmd.add("muteMe", function(args) {
    cmd.listening(false);
}, "Disables command line input");

cmd.add("userCount", function(args) {
    var NOC = 0;
    for (i in users) {
	if (users[i].open()) {
	    NOC++;
	}
    }
    cmd.log("Currently connected users: " + NOC);
}, "Prints the number of clients currently connected to the server");

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    users.push(newUser(connection));
    
    connection.i = users.length - 1;
    
    cmd.log((new Date()) + " Connection accepted from " + connection.remoteAddress);
    
    connection.conStart = new Date();
    
    connection.on('message', function(message) {
	if (message.type === 'utf8') {
	    if (message.utf8Data === "whoami") {
		this.sendUTF("you:" + users[this.i].id);
		sendAllUsers(this);
	    } else {
		broadcast(users[this.i].id + ":coords:" + message.utf8Data);
		users[this.i].position = message.utf8Data;
	    }
	}
    });

    connection.on('close', function(reasonCode, description) {
	users[this.i].endConnection();
	broadcast(users[this.i].id + ":dead");
	
	cmd.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.\nDuration: " + users[this.i].duration() + " ms");
	
	logConnection(this.i);
    });
    
    
});

function sendAllUsers(conObj) {
    for (i in users) {
	if (users[i].open()) {
	    conObj.sendUTF(users[i].id + ":coords:" + users[i].position);
	}
    }
}

function broadcast(msg) {
    for (i in users) {
	if (users[i].open()) {
            users[i].conObj.sendUTF(msg);  
	}
    }
}

function logConnection(i) {
    client.query("INSERT INTO " + TABLE + " SET " +
		 "connected = ?, disconnectd = ?, ip = ?",
		 [dateToSql(users[i].getConStart()), dateToSql(users[i].getConEnd()), users[i].getIpInt()]);
}

function ipToInt(ip) {
    var parts = ip.split(".");
    var res = 0;
    
    res += parseInt(parts[0], 10) << 24;
    res += parseInt(parts[1], 10) << 16;
    res += parseInt(parts[2], 10) << 8;
    res += parseInt(parts[3], 10);
    
    return res;
}

function intToIP(int) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + "." + part3 + "." + part2 + "." + part1;
}

function dateToSql(dateObj) {
    var res = "";
    
    res += dateObj.getYear();
    res += "-";
    res += (dateObj.getMonth() + 1);
    res += "-";
    res += dateObj.getDate();
    res += " ";
    res += dateObj.getHours();
    res += ":";
    res += dateObj.getMinutes();
    res += ":";
    res += dateObj.getSeconds();

    return res;
}

function newUser(newConObj) {
    return (function(newConObj) {
	var that = {};
	var ip = newConObj.remoteAddress;
	var conStart = new Date();
	var conEnd;
	var open = true;
	
	that.position = "64;64";
	that.conObj = newConObj;
	that.id = userId;
	userId++;
	
	that.getIp = function() {
	    return ip;
	}
	
	that.getIpInt = function() {
	    var parts = ip.split(".");
	    var res = 0;
	    
	    res += parseInt(parts[0], 10) << 24;
	    res += parseInt(parts[1], 10) << 16;
	    res += parseInt(parts[2], 10) << 8;
	    res += parseInt(parts[3], 10);
	    
	    return res;
	}

	that.endConnection = function() {
	    open = false;
	    conEnd = new Date();
	}

	that.duration = function() {
	    var dur;
	    
	    if (open) {
		var now = new Date();
		dur = now - conStart;
	    } else {
		dur = conEnd - conStart;
	    }
	    
	    return dur;
	}
	
	that.getConStart = function() {
	    return conStart;
	}
	
	that.getConEnd = function() {
	    return conEnd;
	}
	
	that.open = function() {
	    return open;   
	}
	
	return that;
    }(newConObj));
}


