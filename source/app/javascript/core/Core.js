define(["storymaps/utils/Helper"],
	function(Helper){

		/**
		* Core
		* @class Core
		*
		* Main class for story map application
		*
		* Dependencies: Jquery 1.10.2
		*/

		function init ()
		{
			Helper.enableRegionLayout();
			setTimeout(function(){
				appReady();
			},2000);

		}

		function appReady()
		{
			Helper.removeLoadScreen();
		}

		return {
			init: init
		};
});