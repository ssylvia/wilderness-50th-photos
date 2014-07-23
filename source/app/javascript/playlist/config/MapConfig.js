define(["dojo/_base/array",
	"esri/symbols/PictureMarkerSymbol",
	"esri/renderers/UniqueValueRenderer",
	"storymaps/playlist/core/Data"], 
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

		this.getRenderer = function(layer,features)
		{
			if (useDefaultRenderer){

				_tempRendererField = layer.objectIdField;
				
				var defaultSymbol = new PictureMarkerSymbol("resources/images/markers/wilderness/IconPurple1.png", markerPostionDefault.width, markerPostionDefault.height).setOffset(markerPostionDefault.xOffset,markerPostionDefault.yOffset);
				var renderer = new UniqueValueRenderer(defaultSymbol, _tempRendererField);

				array.forEach(features,function(grp,i){
					if (i < maxAllowablePoints){

						var category;

						array.forEach(Data.photos,function(photo){
							if (!$(".filterRow[data-filter='" + photo.photoCategory + "']").hasClass('items-off')){
								if (grp.attributes.wilderness === photo.wilderness && photo.photoCategory === 'Grand Prize'){
									category = photo.photoCategory;
								}
								else if (!category && grp.attributes.wilderness === photo.wilderness){
									category = photo.photoCategory;
								}
							}
						});
						
						var symbol = getSymbol(category);
						if (category){
							renderer.addValue(grp.attributes[_tempRendererField], symbol);
						}
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
				if (category.toLowerCase() === 'grand prize' && !$(".filterRow[data-filter='Grand Prize']").hasClass('items-off')){
					iconURL = "resources/images/markers/wilderness/IconPurple1.png";
				}
				else if (category.toLowerCase() === 'most inspirational moment' && !$(".filterRow[data-filter='Most Inspirational Moment']").hasClass('items-off')){
					iconURL = "resources/images/markers/wilderness/IconRed1.png";
				}
				else if (category.toLowerCase() === 'people in wilderness' && !$(".filterRow[data-filter='People in Wilderness']").hasClass('items-off')){
					iconURL = "resources/images/markers/wilderness/IconBlue1.png";
				}
				else if (category.toLowerCase() === 'scenic landscape' && !$(".filterRow[data-filter='Scenic Landscape']").hasClass('items-off')){
					iconURL = "resources/images/markers/wilderness/IconOchre1.png";
				}
				else if (category.toLowerCase() === 'wildlife' && !$(".filterRow[data-filter='Wildlife']").hasClass('items-off')){
					iconURL = "resources/images/markers/wilderness/IconTerra1.png";
				}
			}

			var symbol = new PictureMarkerSymbol(iconURL, markerPostionDefault.width, markerPostionDefault.height).setOffset(markerPostionDefault.xOffset,markerPostionDefault.yOffset);

			return symbol;
		}
	};

});