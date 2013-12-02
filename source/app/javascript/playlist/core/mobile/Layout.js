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
		$("body").addClass("touch");

		enableSwipeList();

		function enableSwipeList()
		{
			var snapper = new Snap({
				element: document.getElementById('content'),
				disable: 'right',
				dragger: document.getElementById('mobile-swipe-toggle'),
				maxPosition: 300,
				minPosition: 0,
				touchToDrag: false
			});

			$("#mobile-swipe-toggle").click(function(){
				snapper.open('left');
			});
		}
	};

});