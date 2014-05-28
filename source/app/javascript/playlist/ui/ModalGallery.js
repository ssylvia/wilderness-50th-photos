define(["esri/map",
	"dojo/_base/array",
	'lib/unslider.js'], 
	function(Map,
		array){

	var _features,
		_map;

	return function ModalGallery()
	{

		createMap();
		
		this.setFeatures = function(features){
			_features = features;
			console.log(features);
			updateGallery(0);
		};
	};

	function updateGallery(index){
		$("#photo-description").html(_features[index].text);
	}

	function createMap(){
		_map = new Map('modal-gallery-map',{
			basemap: 'topo',
			center: [-120, 52],
			zoom: 4,
			logo: false,
			showAttribution: false,
			slider: false
		});

		_map.on('load',function(){
			_map.disableMapNavigation();
			_map.resize();
			_map.reposition();
		});

	}

});