define(["dojo/_base/array",
	"esri/symbols/PictureMarkerSymbol",
	"esri/renderers/UniqueValueRenderer"], 
	function(array,
		PictureMarkerSymbol,
		UniqueValueRenderer){
	/**
	* Playlist List
	* @class Playlist List
	* 
	* Class to define a new item list in the playlist app
	*/

	return function MapConfig()
	{

		var useDefaultRenderer = true;

		var maxAllowablePoints = 99;

		var markerPostionDefault = {
			height: 28,
			width: 22,
			xOffset: 3,
			yOffset: 8
		};

		var markerPostionHighlight = {
			height: 34,
			width: 27,
			xOffset: 3,
			yOffset: 10
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
				
				var defaultSymbol = new PictureMarkerSymbol("resources/images/markers/indexed/red/NumberIcon1.png", markerPostionDefault.width, markerPostionDefault.height).setOffset(markerPostionDefault.xOffset,markerPostionDefault.yOffset);
				var renderer = new UniqueValueRenderer(defaultSymbol, _tempRendererField);

				array.forEach(features,function(grp,i){
					if (i < maxAllowablePoints){

						if (!isNaN(grp.attributes[orderAttr]) && isFinite(grp.attributes[orderAttr]) && grp.attributes[orderAttr] % 1 === 0){
							i = grp.attributes[orderAttr] - 1;
						}
						
						var symbol = getSymbolForDefaultRenderer(grp,colorAttr,i);
						renderer.addValue(grp.attributes[_tempRendererField], symbol);
					}
				});

				return renderer;
			}
			else{
				// Add custom renderer
			}
		};

		function getSymbolForDefaultRenderer(graphic,colorAttr,index)
		{
			var iconURL;

			if(graphic.attributes[colorAttr]){
				if (graphic.attributes[colorAttr].toLowerCase === "b" || graphic.attributes[colorAttr].toLowerCase === "blue"){
					iconURL = "resources/images/markers/indexed/blue/NumberIconb" + (index + 1) + ".png";
				}
				else if (graphic.attributes[colorAttr].toLowerCase === "g" || graphic.attributes[colorAttr].toLowerCase === "green"){
					iconURL = "resources/images/markers/indexed/green/NumberIcong" + (index + 1) + ".png";
				}
				else if (graphic.attributes[colorAttr].toLowerCase === "p" || graphic.attributes[colorAttr].toLowerCase === "purple"){
					iconURL = "resources/images/markers/indexed/purple/IconPurple" + (index + 1) + ".png";
				}
				else{
					iconURL = "resources/images/markers/indexed/red/NumberIcon" + (index + 1) + ".png";
				}
			}
			else{
				iconURL = "resources/images/markers/indexed/red/NumberIcon" + (index + 1) + ".png";
			}

			var symbol = new PictureMarkerSymbol(iconURL, markerPostionDefault.width, markerPostionDefault.height).setOffset(markerPostionDefault.xOffset,markerPostionDefault.yOffset);

			return symbol;
		}
	};

});