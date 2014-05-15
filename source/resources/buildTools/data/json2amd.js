var data = {
	'wildernesses': require("./tempData/wildernesses.json"),
	'photos': require("./tempData/photos.json")
}

var outputStr = "define([],\
	function(){\
		var appData = " + JSON.stringify(data) + ";\
		return {\
			data: appData\
		};\
	});"

var fs = require('fs');
fs.writeFile("source/app/javascript/playlist/core/Data.js", outputStr, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
}); 