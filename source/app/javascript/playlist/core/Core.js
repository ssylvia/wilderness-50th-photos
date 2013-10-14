define(["storymaps/utils/Helper","storymaps/playlist/ui/PlaylistMap","lib/jquery/jquery-1.10.2.min"],
	function(Helper, Map){

		/**
		* Core
		* @class Core
		*
		* Main class for story map application
		*
		* Dependencies: Jquery 1.10.2
		*/

		var _readyState = {
			map: false
		};

		function init ()
		{
			Helper.enableRegionLayout();

			if (configOptions.sharingUrl && location.protocol === "https:"){
				configOptions.sharingUrl = configOptions.sharingUrl.replace('http:', 'https:');
			}

			if (configOptions.geometryServiceUrl && location.protocol === "https:"){
				configOptions.geometryServiceUrl = configOptions.geometryServiceUrl.replace('http:', 'https:');
			}

			loadMap();

		}

		function loadMap()
		{
			Helper.updateLoadingMessage("Accessing Maps");
			var map = new Map(configOptions.geometryServiceUrl,configOptions.bingMapsKey,configOptions.webmap,"map",function(item){
				updateText(item.title,item.snippet);
				_readyState.map = true;
				checkReadyState();
			}).init();
			console.log(map);
		}

		function updateText(title,subtitle)
		{
			$("#title").html(configOptions.title || title || "");
			$("#subtitle").html(configOptions.subtitle || subtitle || "");
		}

		function checkReadyState()
		{
			var ready = true;

			for (var i in _readyState){
				if (!_readyState[i]){
					ready = false;
				}
			}
			appReady(ready);
		}

		function appReady(ready)
		{
			if (ready){
				Helper.removeLoadScreen();
			}
		}

		return {
			init: init
		};
});