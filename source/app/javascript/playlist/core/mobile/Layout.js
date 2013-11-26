define([], 
	function(){
	/**
	* Playlist Mobile Layout
	* @class Layout
	* 
	* Class to change display for mobile layout
	*
	* Dependencies: Jquery 1.10.2
	*/

	return function Layout()
	{
		$("#side-pane-controls").hide();
		$("#info-pane").hide();
		if ($("body").width() <= 450){
			$("#side-pane").css({
				width: "100%"
			});
		}
	};

});