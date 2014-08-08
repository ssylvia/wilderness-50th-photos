define(["esri/map",
	"dojo/_base/array",
	"dojo/on",
	"storymaps/playlist/core/Data",
	"storymaps/utils/Helper",
	"esri/layers/ArcGISTiledMapServiceLayer",
	"esri/layers/FeatureLayer",
	"esri/tasks/query",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/SimpleLineSymbol",
	"esri/Color",
	"esri/renderers/SimpleRenderer",
	'lib/unslider.js'], 
	function(Map,
		array,
		on,
		Data,
		Helper,
		ArcGISTiledMapServiceLayer,
		FeatureLayer,
		Query,
		SimpleFillSymbol,
		SimpleLineSymbol,
		Color,
		SimpleRenderer){

	var _features = Data.photos,
		_map,
		_mainMap,
		_locations,
		_wildernessHighlight,
		_currentIndex = 0,
		_currentWID,
		_slideToPhoto;

		createMap();

	$("#gallery-right-buffer").click(function(){
		nextPhoto();
	});

	$("#gallery-left-buffer").click(function(){
		prevPhoto();
	});

	$("#modal-gallery-map, #modal-background, #gallery-close").click(function(){
		$('body').toggleClass('modal-gallery');
	});

	$("#left-details").scroll(function(){
		$("#scroll-indicator").css({
			"bottom": -$("#left-details").scrollTop()
		});
		if ($("#left-details").scrollTop() > 0){
			$("#scroll-indicator").fadeOut();
		}
	});

	return function ModalGallery(mainMap,locations,slideToPhoto)
	{
		_locations = locations;
		_mainMap = mainMap;
		_slideToPhoto = slideToPhoto;
		
		this.setFeatures = function(features){
			_features = features;
			highlightInMap(_features[0].wilderness);
			if (features.length > 1){
				$("#modal-gallery-pane").removeClass('single-photo');
			}
			else{
				$("#modal-gallery-pane").addClass('single-photo');
			}
			updateGallery(0);
		};

		this.setPhoto = function(photoId){
			if ((photoId || photoId === 0) && photoId != _features[_currentIndex].id){
				var index;
				array.forEach(_features,function(ftr,i){
					if (ftr.id === photoId){
						index = i;
					}
				});
				updateGallery(index);
			}
		};
	};

	function updateGallery(index){
		var photo = _features[index];
		_currentIndex = index;
		$("#winner-category").html(photo.winnerType + " in " + photo.photoCategory + ": " + photo.photographerCategory);
		$("#photo-title").html(photo.titleFull);
		$("#wilderness-name").html(photo.wildernessFull);
		$("#photographer-name").html("By " + photo.photographer + getAge(photo.age));
		$("#hometown").html(photo.photographerLocation);
		$("#photo-description").html(photo.text);
		$("#modal-image").css({
			'background-image': 'url(resources/images/contest-photos/' + photo.photo + ')'
		});
		$("#photo-settings").html(photo.photoInfo);
		$("#wilderness-info").html(getWildernessInfo(photo.wilderness));
		$("#left-details").scrollTop(0);
		if ($("#left-details").prop('scrollHeight') > $("#left-details").height()){
			$("#scroll-indicator").show();
		}
		_slideToPhoto(photo.id);
	}

	function createMap(){
		_map = new Map('modal-gallery-map',{
			basemap: 'topo',
			center: [-120, 52],
			zoom: 4,
			maxZoom: 11,
			logo: false,
			showAttribution: false,
			slider: false
		});

		var wildernessesTiles = new ArcGISTiledMapServiceLayer('http://wilderness.storymaps.esri.com/arcgis/rest/services/Wilderness/app_one_cache/MapServer');
		_map.addLayer(wildernessesTiles);

		_wildernessHighlight = new FeatureLayer("http://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/Wilderness1/FeatureServer/1",{
			mode: FeatureLayer.MODE_ONDEMAND
		});
		_map.addLayer(_wildernessHighlight);

		on.once(_map,'load',function(){
			Helper.resetRegionLayout();
			_map.disableMapNavigation();
			_map.resize();
			_map.reposition();

			var sym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
				new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
				new Color([255,0,0]), 2)
			);
			var renderer = new SimpleRenderer(sym);
			_wildernessHighlight.setRenderer(renderer);
		});

		on.once(_map,'update-end',function(){
			Helper.resetRegionLayout();
			_map.resize();
			_map.reposition();
		});

	}

	function getWildernessInfo(wilderness){
		var text;
		array.forEach(Data.wildernessDescriptions,function(area){
			if (area.wilderness === wilderness){
				text = area.description;
			}
		});
		return text;
	}

	function getAge(age){
		if (age !== 'null'){
			return ', ' + age;
		}
		else{
			return '';
		}
	}

	function highlightInMap(wilderness){
		var newWID = false;
		array.forEach(_locations,function(loc){
			if (loc.attributes.wilderness === wilderness && _currentIndex != loc.attributes.WID){
				_currentWID = loc.attributes.WID;
				newWID = true;
			}
		});

		if (newWID){
			var query = new Query();
			query.where = "WID = " + _currentWID;
			_wildernessHighlight.setDefinitionExpression("WID = " + _currentWID);
			if (_currentWID == 5){
				_map.centerAndZoom([-174.23,52.40],4);
			}
			else{
				_wildernessHighlight.queryExtent(query,function(result){
					_map.setExtent(result.extent,true);
				});
			}
		}
	}

	function nextPhoto(){
		if (_features.length > 1){
			if (_currentIndex === _features.length -1){
				updateGallery(0);
			}
			else{
				updateGallery(_currentIndex + 1);
			}
		}
	}

	function prevPhoto(){
		if (_features.length > 1){
			if (_currentIndex === 0){
				updateGallery(_features.length - 1);
			}
			else{
				updateGallery(_currentIndex - 1);
			}
		}
	}

});