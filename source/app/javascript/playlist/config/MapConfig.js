define(["dojo/_base/array",
	"esri/symbols/PictureMarkerSymbol",
	"esri/renderers/UniqueValueRenderer",
	"storymaps/playlist/core/Data",], 
	function(array,
		PictureMarkerSymbol,
		UniqueValueRenderer,
		Data){
	/**
	* Playlist List
	* @class Playlist List
	* 
	* Class to define a new item list in the playlist app
	*/

	return function MapConfig()
	{

		var useDefaultRenderer = true;

		var maxAllowablePoints = 1000;

		var markerPostionDefault = {
			height: 32,
			width: 30,
			xOffset: -15,
			yOffset: 16
		};

		var markerPostionHighlight = {
			height: 38,
			width: 35,
			xOffset: -17,
			yOffset: 19
		};

		var _tempRendererField;

		this.getMaxAllowablePoints = function(){
			return maxAllowablePoints;
		};

		this.getMarkerPosition = function()
		{
			return markerPostionDefault;
		};

		this.getMarkerPositionHighlight = function()
		{
			return markerPostionHighlight;
		};

		this.getRenderer = function(layer,features,colorAttr,orderAttr)
		{
			if (useDefaultRenderer){

				_tempRendererField = layer.objectIdField;
				
				var defaultSymbol = new PictureMarkerSymbol("resources/images/markers/wilderness/IconPurple1.png", markerPostionDefault.width, markerPostionDefault.height).setOffset(markerPostionDefault.xOffset,markerPostionDefault.yOffset);
				var renderer = new UniqueValueRenderer(defaultSymbol, _tempRendererField);

				array.forEach(features,function(grp,i){
					if (i < maxAllowablePoints){

						var category;

						array.forEach(Data.photos,function(photo){
							if (grp.attributes.wilderness == photo.wilderness){
								category = photo.photoCategory;
							}
						});
						
						var symbol = getSymbol(category);
						renderer.addValue(grp.attributes[_tempRendererField], symbol);
					}
				});

				return renderer;
			}
			else{
				// Add custom renderer
			}
		};

		function getSymbol(category)
		{
			var iconURL;

			if(category){
				if (category.toLowerCase() === 'wildlife'){
					iconURL = "resources/images/markers/wilderness/IconOrange1.png";
				}
				// else if (graphic.attributes[colorAttr].toLowerCase() === "g" || graphic.attributes[colorAttr].toLowerCase() === "green"){
				// 	iconURL = "resources/images/markers/indexed/green/NumberIcong" + (index + 1) + ".png";
				// }
				// else if (graphic.attributes[colorAttr].toLowerCase() === "p" || graphic.attributes[colorAttr].toLowerCase() === "purple"){
				// 	iconURL = "resources/images/markers/indexed/purple/IconPurple" + (index + 1) + ".png";
				// }
				// else{
				// 	iconURL = "resources/images/markers/indexed/red/NumberIcon" + (index + 1) + ".png";
				// }
			}

			var symbol = new PictureMarkerSymbol(iconURL, markerPostionDefault.width, markerPostionDefault.height).setOffset(markerPostionDefault.xOffset,markerPostionDefault.yOffset);

			return symbol;
		}
	};

});