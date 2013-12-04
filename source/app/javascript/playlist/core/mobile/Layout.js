define(["storymaps/utils/Helper",
	"lib/snap.min.js",
	"lib/jquery/jquery-1.10.2.min"], 
	function(Helper){
	/**
	* Playlist Mobile Layout
	* @class Layout
	* 
	* Class to change display for mobile layout
	*
	* Dependencies: Jquery 1.10.2
	*/

	return function Layout(onListOpen)
	{
		var _snapper;

		$("body").addClass("touch");
		$("#map").attr("data-snap-ignore","true");

		if ($("body").width() <= 768){
			$("#info-pane").removeClass("region-top");
			$("#side-pane-content").prepend($("#info-pane"));
		}

		moveInfo();
		enableSwipeList();
		enableMobileEvents();

		this.hideList = function()
		{
			_snapper.close('left');
		};

		function moveInfo()
		{
			if ($("body").width() <= 768){
				$("#info-pane").removeClass("region-top");
				$("#map-pane").append($("#info-pane"));
			}
			else{
				$("#info-pane").addClass("region-top");
				$("#side-pane-content").prepend($("#info-pane"));
			}
			Helper.resetRegionLayout();
		}

		function enableSwipeList()
		{
			_snapper = new Snap({
				element: document.getElementById('content'),
				disable: 'right',
				dragger: document.getElementById('mobile-swipe-toggle'),
				maxPosition: 300,
				minPosition: 0
			});

			_snapper.on('animated', function(){
				onListOpen();
			});

			$("#mobile-swipe-toggle").click(function(){
				_snapper.open('left');
			});
		}

		function enableMobileEvents()
		{
			$(window).resize(function(){
				moveInfo();
			});

			$(".back-button").click(function(){
				$("body").removeClass("show-description").removeClass("show-legend");
				Helper.resetRegionLayout();
			});

			$("#mobile-controls .icon-share").click(function(){
				$("#mobile-share").toggle({
					duration: 0,
					complete: function(){
						if ($("#mobile-share").is(":visible")){
							$(".esriSimpleSlider").hide();
						}
						else{
							$(".esriSimpleSlider").show();
						}
					}
				});
			});
		}
	};

});