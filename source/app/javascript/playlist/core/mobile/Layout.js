define(["lib/snap.min.js","lib/jquery/jquery-1.10.2.min"], 
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
		var _snapper;

		$("body").addClass("touch");
		$("#map").attr("data-snap-ignore","true");

		if ($("body").width() <= 768){
			$("#info-pane").removeClass("region-top");
			$("#map-pane").append($("#info-pane"));
		}

		enableSwipeList();
		enableMobileEvents();

		this.hideList = function()
		{
			_snapper.close('left');
		};

		function enableSwipeList()
		{
			_snapper = new Snap({
				element: document.getElementById('content'),
				disable: 'right',
				dragger: document.getElementById('mobile-swipe-toggle'),
				maxPosition: 300,
				minPosition: 0
			});

			$("#mobile-swipe-toggle").click(function(){
				_snapper.open('left');
			});
		}

		function enableMobileEvents()
		{
			$(".back-button").click(function(){
				$("body").removeClass("show-description").removeClass("show-legend");
			});

			$("#mobile-controls .icon-share").click(function(){
				$("#mobile-share").toggle();
			});
		}
	};

});