define(["dojo/_base/array",
	"lib/spin.min.js",
	"lib/jquery/jquery-1.10.2.min",
	"storymaps/utils/SocialSharing"], 
	function(array){
	/**
	* Helper
	* @class Helper
	* 
	* Collection of helper functions
	*
	* Dependencies: Jquery 1.10.2
	*/

	// Show ajax laoder on load
	var _appLoader = ajaxLoader('loader'),
	_loadingMessage = $("#loading-message"),
	_appLoadScreen = $("#app-load-screen");

	function ajaxLoader(elementId)
	{
		var options = {
			lines: 16, // The number of lines to draw
			length: 7, // The length of each line
			width: 7, // The line thickness
			radius: 30, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 0, // The rotation offset
			direction: 1, // 1: clockwise, -1: counterclockwise
			color: '#000', // #rgb or #rrggbb or array of colors
			speed: 1.1, // Rounds per second
			trail: 25, // Afterglow percentage
			shadow: true, // Whether to render a shadow
			hwaccel: true, // Whether to use hardware acceleration
			className: 'ajax-loader', // The CSS class to assign to the spinner
			zIndex: 2e9, // The z-index (defaults to 2000000000)
			top: 'auto', // Top position relative to parent in px
			left: 'auto' // Left position relative to parent in px
		};

		var target = document.getElementById(elementId);
		var loader = new Spinner(options).spin(target);

		return loader;
	}

	function regionLayout()
	{
		$(".region-center").each(function(){
			var l = $(this).siblings(".region-left:visible").outerWidth(),
				r = $(this).siblings(".region-right:visible").outerWidth(),
				t = $(this).siblings(".region-top:visible").outerHeight(),
				b = $(this).siblings(".region-bottom:visible").outerHeight(),
				x = l + r,
				y = t + b;
			$(this).css({
				"top": t || 0,
				"left": l || 0,
				"height" : $(this).parent().outerHeight() - y,
				"width" : $(this).parent().outerWidth() - x
			});
		});

		var bodyWidth = $('html,body').width();
		if (bodyWidth < 1050){
			$('body').addClass('no-secondary-header');
			$('body').removeClass('small-secondary-header');
		}
		else if (bodyWidth < 1200){
			$('body').addClass('small-secondary-header');
			$('body').removeClass('no-secondary-header');
		}
		else{
			$('body').removeClass('small-secondary-header');
			$('body').removeClass('no-secondary-header');
		}

		$("#filter-content").css("max-height", $("#playlist").height() - 50);

		$("#modal-gallery-pane").css({
			"height": $("#map").height() * 0.9,
			"top":  ($("#map").height() * 0.05) + ($('#banner').is(':visible') ? $("#banner").height() : 0)
		});
	}

	return {

		updateLoadingMessage: function(message)
		{
			_loadingMessage.html(message);
		},

		removeLoadScreen: function()
		{
			_appLoadScreen.fadeOut();
			_appLoader.stop();
		},

		enableRegionLayout: function()
		{
			regionLayout();
			$(window).resize(function(){
				regionLayout();
			});
		},

		resetRegionLayout: function()
		{
			regionLayout();
		},

		syncMaps: function(maps,currentMap,extent)
		{
			array.forEach(maps,function(map){
				if (map !== currentMap){
					map.setExtent(extent);
				}
			});
		},

		startUpIdleTimer: function()
		{
			var idleWait = 300000;
			var idleTimer = null;
			var idleState = false;
			
			$('*').bind('mousemove keydown scroll',function(){
				
				clearTimeout(idleTimer);
				idleState = false;

				idleTimer = setTimeout(function(){
					window.location = 'http://storymaps.esri.com/stories/2014/wilderness-start-page/';
					idleState = true;
				}, idleWait);

			});
			$("body").trigger("mousemove");
		}
	};
});