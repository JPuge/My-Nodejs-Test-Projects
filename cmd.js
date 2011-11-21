//Initial variables
var nextPrinted = false;
var listen      = false;
var operator    = "> ";
var helpMsg     = "help";
var commands    = [];

//Private function to pad spaces for pretty output
var padRight = function(msg, c, width) {
    while (msg.length < width) {
	msg += c;
    }

    return msg;
}

//Provide function to print to cmd
var log = function(msg) {
    if (nextPrinted) {
	process.stdout.write('\n');
	nextPrinted = false;
    }

    process.stdout.write(msg + '\n');
    
    if (listen) {
	printOperator();
    }
}

//Provide internal function to write to cmd (no new line)
var write = function(msg) {
    process.stdout.write(msg);
}

//Provide internal function to print the operator
var printOperator = function() {
    write(operator);
    nextPrinted = true;
}

//Provide function to start listen
var listening = function(bool) {
    listen = bool;

    if (listen) {
	process.stdin.resume();
	printOperator();
    } else {
	process.stdin.pause();
    }
}

//Provide function to add commands
var addCommand = function(name, callback, helpText) {
    if (name === helpMsg) {
	return false;
    }
    
    //Check if the name has been used already
    for (i in commands) {
	if (commands[i].id == name) {
	    return false;
	}
    }
    
    commands.push({
	id: name,
	callb: callback,
	help: helpText
    });
    
    return true;
}

//Private function to print all available commands plus help
var printHelp = function() {
    if (commands.length == 0) {
	log("There are no commands yet!");
	return false;
    }
    
    var helpStr = "";
    var started = false;
    for (i in commands) {
	if (started) {
	    helpStr += "\n";
	}
	helpStr += padRight(commands[i].id, " ", 15) + " - " + commands[i].help;
	started = true;
    }
    log(helpStr);

    return true;
}

//Set encoding
process.stdin.setEncoding('utf8');

//Fetch incomming messages
process.stdin.on('data', function (msg) {
    nextPrinted = false;
    
    //Remove the newline
    msg = msg.replace("\n", "");
    
    var arguments = msg.split(" ");
    if (arguments[0] == '') {
	printOperator();
	return false;
    }
    
    var id = arguments[0];
    arguments = arguments.slice(1);

    if (id == helpMsg) {
	printHelp();
	return true;
    }

    for (i in commands) {
	if (commands[i].id === id) {
	    commands[i].callb(arguments);
	    return true;
	}
    }

    //The command was not found
    log("The command does not exist... Type '" + helpMsg + "' to see all commands!");
    return false;
});

//Check if stdin is closed
process.stdin.on('end', function () {
    process.stdout.write('end');
});

//Export the public methods
exports.log = log;
exports.listening = listening;
exports.add = addCommand;