define(["dojo/dom",
	"dojo/dnd/move"], 
	function(dom,
		Move){
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
		var _swipePane = $("#side-pane"),
		_swipeToggle = $("#mobile-slide-toggle");

		var _swipePaneExpanded = false;

		$("#side-pane-controls").hide();
		$("#info-pane").hide();
		if ($("body").width() <= 450){
			_swipePane.css({
				width: "100%",
				left: "-100%"
			});
		}
		else{
			_swipePane.css({
				left: "-300px"
			});
		}

		enableSwipePane();

		function enableSwipePane()
		{
			var width = $("body").width() < 450 ? $("body").width() : 300;

			var swipeToggle = new Move.constrainedMoveable(dom.byId("mobile-slide-toggle"),{
				constraints: function(){
					var bb = {
						t: $("body").height() - _swipeToggle.outerHeight(),
						l: 0,
						h: 0,
						w: width
					}
					return bb;
				}
			});

			swipeToggle.onMoved = function(e,topLeft)
			{
				_swipePane.css({
					left: topLeft.l - _swipePane.width()
				});
			}

			swipeToggle.onMoveStop = function()
			{
				lockSwipePane();
			}

			var swipeToggle = new Move.constrainedMoveable(dom.byId("side-pane"),{
				constraints: function(){
					var bb = {
						t: 0,
						l: -width,
						h: 0,
						w: width
					}
					return bb;
				}
			});

			swipeToggle.onMoved = function(e,topLeft)
			{
				_swipeToggle.css({
					left: topLeft.l + _swipePane.width()
				});
			}

			swipeToggle.onMoveStop = function()
			{
				lockSwipePane();
			}

			// $("#playlist").click(function(){
			// 	lockSwipePane(true);
			// });

			$("#mobile-slide-toggle").click(function(){
				lockSwipePane(true);
			});

		}

		function lockSwipePane(fromClick)
		{
			var paneWidth = _swipePane.width(),
			togglePos = _swipeToggle.position().left;
			speed = 100;

			if (fromClick){
				if (_swipePaneExpanded){
					_swipeToggle.animate({
						"left": 0
					},speed);
					_swipePane.animate({
						"left": -paneWidth
					},{
						duration: speed,
						complete: function(){
							_swipePaneExpanded = false;
						}
					});
				}
				else{
					_swipeToggle.animate({
						"left": paneWidth
					},speed);
					_swipePane.animate({
						"left": 0
					},{
						duration: speed,
						complete: function(){
							_swipePaneExpanded = true;
						}
					});
				}
			}
			else{
				if (_swipePaneExpanded && togglePos < (paneWidth/4)*3){
					_swipeToggle.animate({
						"left": 0
					},speed);
					_swipePane.animate({
						"left": -paneWidth
					},{
						duration: speed,
						complete: function(){
							_swipePaneExpanded = false;
						}
					});
				}
				else if (!_swipePaneExpanded && togglePos < (paneWidth/4)){
					_swipeToggle.animate({
						"left": 0
					},speed);
					_swipePane.animate({
						"left": -paneWidth
					},{
						duration: speed,
						complete: function(){
							_swipePaneExpanded = false;
						}
					});
				}
				else{
					_swipeToggle.animate({
						"left": paneWidth
					},speed);
					_swipePane.animate({
						"left": 0
					},{
						duration: speed,
						complete: function(){
							_swipePaneExpanded = true;
						}
					});
				}
			}
		}
	};

});