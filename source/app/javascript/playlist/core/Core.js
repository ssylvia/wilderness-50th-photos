define(["storymaps/utils/Helper","storymaps/playlist/ui/Map","storymaps/playlist/ui/List","lib/jquery/jquery-1.10.2.min"],
	function(Helper, Map, List){

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
		},
		_map,
		_list;

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
			_map = new Map(configOptions.geometryServiceUrl,configOptions.bingMapsKey,configOptions.webmap,"map",function(item){
				// LOAD EVENT
				updateText(item.title,item.snippet);
				_readyState.map = true;
				checkReadyState();
			},function(graphics){
				// LAYERS UPDATE EVENT
				if (_list){
					updatePlaylist(graphics);
				}
				else {
					loadPlaylist(graphics);
				}
			}).init();
		}

		function loadPlaylist(graphics)
		{
			_list = new List("#side-pane").init(graphics);
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