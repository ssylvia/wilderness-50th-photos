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
			buildImageSlider(0)
			updateGallery(0);
		};
	};

	function buildImageSlider(index){
		var photo = _features[index];
		var photoUrl = 'resources/images/contest-photos/' + photo.photo;
		var htmlString = '<li style="background-image: url(' + photoUrl + ')"></li>'
		$("#modal-image-slider ul").html(htmlString);
	}

	function updateGallery(index){
		var photo = _features[index];
		$("#winner-category").html(photo.winnerType + " in " + photo.photoCategory + ": " + photo.photographerCategory);
		$("#wilderness-name").html(photo.wildernessFull);
		$("#photographer-name").html("By " + photo.photographer);
		$("#hometown").html(photo.photographerLocation);
		$("#photo-description").html(photo.text);
		$("#photo-settings").html(photo.photoInfo);
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