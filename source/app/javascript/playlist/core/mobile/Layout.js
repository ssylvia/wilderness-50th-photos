define(["lib/snap.min.js"], 
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
		$("#app-content").addClass("touch");

		new Snap({
			element: document.getElementById('content'),
			disable: 'right',
			dragger: document.getElementById('mobile-swipe-toggle'),
			maxPosition: 300,
			minPosition: 0
		});
	};

});