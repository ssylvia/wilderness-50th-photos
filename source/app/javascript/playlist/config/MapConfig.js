define([], 
	function(){
	/**
	* Playlist List
	* @class Playlist List
	* 
	* Class to define a new item list in the playlist app
	*/

	return function MapConfig()
	{
		var maxAllowablePoints = 99;

		var markerPostionDefault = {
			height: 28,
			width: 22,
			xOffset: 3,
			yOffset: 8
		}

		var markerPostionHighlight = {
			height: 34,
			width: 27,
			xOffset: 3,
			yOffset: 10
		}

		this.getMaxAllowablePoints = function(){
			return maxAllowablePoints;
		}

		this.getMarkerPosition = function()
		{
			return markerPostionDefault;
		}

		this.getMarkerPositionHighlight = function()
		{
			return markerPostionHighlight;
		}
	};

});