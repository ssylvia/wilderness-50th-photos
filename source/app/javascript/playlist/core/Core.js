define(["storymaps/utils/Helper",
	"storymaps/playlist/ui/Map",
	"storymaps/playlist/ui/List",
	"lib/jquery/jquery-1.10.2.min"],
	function(Helper,
	Map,
	List){

		/**
		* Core
		* @class Core
		*
		* Main class for story map application
		*
		* Dependencies: Jquery 1.10.2
		*/

		var _embed = (top != self) ? true : false,
		_readyState = {
			map: false,
			list: false
		},
		_layersReady = 0,
		_map = new Map(configOptions.geometryServiceUrl,configOptions.bingMapsKey,configOptions.webmap,"map","#side-pane",onMapLoad,onLayersUpdate,onMarkerOver,onMarkerOut,onMarkerSelect,onMarkerRemoveSelection),
		_list = new List("#playlist",onListLoad,onListGetTitleAttr,onListSelect,onListHighlight,onListRemoveHighlight);

		function init ()
		{
			if (_embed){
				$("#banner").hide();
			}

			Helper.enableRegionLayout();

			if (configOptions.sharingUrl && location.protocol === "https:"){
				configOptions.sharingUrl = configOptions.sharingUrl.replace('http:', 'https:');
			}

			if (configOptions.geometryServiceUrl && location.protocol === "https:"){
				configOptions.geometryServiceUrl = configOptions.geometryServiceUrl.replace('http:', 'https:');
			}

			loadMap();
		}


		// MAP FUNCTIONS
		
		function loadMap()
		{
			Helper.updateLoadingMessage("Accessing Maps");
			_map.init();
		}

		function onMapLoad(item)
		{
			updateText(item.title,item.snippet,item.description);
			_readyState.map = true;
			checkReadyState();
		}

		function onLayersUpdate(graphics)
		{
			if (_list){
				updatePlaylist(graphics);
			}
		}

		function onMarkerOver(item)
		{
			if(_list){
				_list.highlight(item);
			}
		}

		function onMarkerOut(item)
		{
			if(_list){
				_list.removeHighlight(item);
			}
		}

		function onMarkerSelect(item)
		{
			if(_list){
				_list.select(item);
			}
		}

		function onMarkerRemoveSelection()
		{
			if(_list){
				_list.removeSelection();
			}
		}


		// LIST FUNCTIONS

		function onListLoad()
		{
			_layersReady++;
			if (_layersReady === _map.getLayerCount()){
				_readyState.list = true;
				checkReadyState();
			}
		}

		function onListGetTitleAttr(titleObj)
		{
			if(_map){
				_map.setTitleAttr(titleObj);
			}
		}

		function onListSelect(item)
		{
			if(_map){
				_map.select(item);
			}
		}

		function onListHighlight(item)
		{
			if(_map){
				_map.highlight(item);
			}
		}

		function onListRemoveHighlight()
		{
			if(_map){
				_map.removeHighlight();
			}
		}

		function updatePlaylist(graphics)
		{
			Helper.updateLoadingMessage("Updating Playlist");
			_list.update(graphics);
		}

		function updateText(title,subtitle,description)
		{
			$("#title").html(configOptions.title || title || "");
			$("#subtitle").html(configOptions.subtitle || subtitle || "");
			$("#description").html(configOptions.description || description || "");
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