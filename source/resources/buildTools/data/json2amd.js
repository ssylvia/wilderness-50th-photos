var data = {
	'photos': require("./tempData/photos.json"),
	'wildernessDescriptions': require("./tempData/wildernessDescriptions.json")
}

for(var i = 0; i < data.photos.length; i++){
	data.photos[i].id = i;
}

var outputStr = "define([],\
	function(){\
		var appData = " + JSON.stringify(data) + ";\
		return appData;\
	});"

var fs = require('fs');
fs.writeFile("source/app/javascript/playlist/core/Data.js", outputStr, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
}); 