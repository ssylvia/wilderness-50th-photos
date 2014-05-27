define(["dojo/_base/array",
	'lib/unslider.js'], 
	function(array){

	return function ModalGallery()
	{
		var _features;
		
		this.setFeatures = function(features){
			_features = features
		};
	};

});