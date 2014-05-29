define(["dojo/_base/array",
	"storymaps/playlist/core/Data",
	"storymaps/playlist/ui/ModalGallery",
	'lib/unslider.js'], 
	function(array,
		Data,
		ModalGallery){

	return function PopupGallery(map,onSelect,onRemoveSelection)
	{
		var _popup = map.infoWindow,
			_currentGraphic,
			_photoSelection,
			_slider,
			_modalGallery = new ModalGallery();

		$('.esriPopup .contentPane, #modal-background, #gallery-close').click(function(){
			$('body').toggleClass('modal-gallery');
		});
		
		this.setContent = function(photoSelection){

			var graphic = _popup.getSelectedFeature();
			var features = [];
			_currentGraphic = graphic;

			var sliderContent = "";
			var photoId = photoSelection;

			array.forEach(Data.photos,function(photo){
				if (photo.wilderness === graphic.attributes.wilderness){
					if (photoId === undefined){
						photoId = photo.id;
					}
					features.push(photo);
					sliderContent = sliderContent + '<li><img src="resources/images/contest-photos/' + photo.photo + '" alt="" /></li>';
				}
			});

			_photoSelection = photoId;

			var sliderStr = '\
			<div class="expand-button"><p>MORE</p></div>\
			<h1>' + graphic.attributes.wildernessFull + ', ' + graphic.attributes.wildernessLocation + '</h1>\
			<div class="slider">\
				<ul>\
					' + sliderContent + '\
				</ul>\
			</div>';

			selectPhoto();
			_modalGallery.setFeatures(features);
			
			return sliderStr;

		};

		this.initGallery = function(){
			if ($('.esriPopup .slider li').length > 1){
				_slider = $('.esriPopup .slider').unslider({
					delay: false,
					complete: function(){
					}
				});
			}
			else{
				_slider = undefined;
			}
		};

		this.getPhotoSelection = function(){
			return _photoSelection;
		}

		function selectPhoto(){
			if (_currentGraphic){						
				onRemoveSelection();
				var item = {
					layerId: (_currentGraphic.getLayer() ? _currentGraphic.getLayer().id : _tempLayerId),
					objectId: (_currentGraphic.getLayer() ? _currentGraphic.attributes[_currentGraphic.getLayer().objectIdField] : _tempObjectId),
					photoId: _photoSelection
				};

				onSelect(item);
			}
		}
	};

});