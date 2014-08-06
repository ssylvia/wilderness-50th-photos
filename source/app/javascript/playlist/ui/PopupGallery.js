define(["dojo/_base/array",
	"storymaps/playlist/core/Data",
	"storymaps/playlist/ui/ModalGallery",
	'lib/unslider.js'], 
	function(array,
		Data,
		ModalGallery){

	return function PopupGallery(map,locations,onSelect,onRemoveSelection)
	{
		var _popup = map.infoWindow,
			_currentGraphic,
			_features,
			_photoSelection,
			_slider,
			_modalGallery = new ModalGallery(map,locations,slideToPhoto);

		$('.esriPopup .contentPane').click(function(){
			$('body').toggleClass('modal-gallery');
		});
		
		this.setContent = function(photoSelection){

			var graphic = _popup.getSelectedFeature();
			var features = [];
			_currentGraphic = graphic;

			var sliderContent = "";
			var photoId = photoSelection;

			array.forEach(Data.photos,function(photo){
				if (photo.wilderness === graphic.attributes.wilderness && !$(".filterRow[data-filter='" + photo.photoCategory + "']").hasClass('items-off')){
					if (photoId === undefined){
						photoId = photo.id;
					}
					features.push(photo);
					sliderContent = sliderContent + '<li><img src="resources/images/contest-photos/small/' + photo.photo + '" alt="" /></li>';
				}
			});

			_photoSelection = parseInt(photoId,10);
			_features = features;
			_modalGallery.setFeatures(features,_photoSelection);

			var sliderStr = '\
			<div class="expand-button"><p>MORE</p></div>\
			<h1>' + graphic.attributes.wildernessFull + ', ' + graphic.attributes.wildernessLocation + '</h1>\
			<div class="slider">\
				' + (_features.length > 1 ? '<div class="popup-prev-wrapper popup-nav-wrapper"><i class="icon-left-arrow popup-nav"></i></div><div class="popup-next-wrapper popup-nav-wrapper"><i class="icon-right-arrow popup-nav"></i></div>' : '') + '\
				<ul>\
					' + sliderContent + '\
				</ul>\
			</div>';

			selectPhoto();
			
			return sliderStr;

		};

		this.initGallery = function(photoId){		
			_slider = $('.esriPopup .slider').unslider({
				delay: false,
				speed: 0,
				complete: function(){
					var index = _slider.data('unslider').current;
					_photoSelection = parseInt(_features[index].id,10);
					map.infoWindow.reposition();
					selectPhoto();
				}
			});
			if (photoId){
				_photoSelection = parseInt(photoId,10);
				slideToPhoto();
			}
			if (_features.length > 0){
				$('.popup-next-wrapper').click(function(event){
					event.stopPropagation();
					_slider.data('unslider').next();
				});
				$('.popup-prev-wrapper').click(function(event){
					event.stopPropagation();
					_slider.data('unslider').prev();
				});
			}
		};

		this.getPhotoSelection = function(){
			return _photoSelection;
		};

		function selectPhoto(){
			if (_currentGraphic){						
				onRemoveSelection();
				var item = {
					layerId: (_currentGraphic.getLayer().id),
					objectId: (_currentGraphic.attributes[_currentGraphic.getLayer().objectIdField]),
					photoId: _photoSelection
				};

				_modalGallery.setPhoto(_photoSelection);
				onSelect(item);
			}
		}

		function slideToPhoto(photoId){
			var index;
			if (photoId && photoId != _photoSelection){
				_photoSelection = photoId;
			}
			array.forEach(_features,function(ftr,i){
				if(ftr.id === _photoSelection){
					index = i;
				}
			});
			if (_slider && $('.esriPopup .slider li').length > 1){
				_slider.data('unslider').move(index);
			}
		}
	};

});