define(["lib/jquery/jquery-1.10.2.min"], 
	function(){
	/**
	* Playlist List
	* @class Playlist List
	* 
	* Class to define a new item list in the playlist app
		*
		* Dependencies: Jquery 1.10.2
	*/

	return function List(selector)
	{
		var _listEl = $(selector);

		this.init = function(lyrItems)
		{
			buildList(lyrItems);
		}

		function buildList(lyrItems)
		{
			dojo.forEach(lyrItems,function(items){
				var attr = getAttributeNames(items[0].graphic.attributes);
				dojo.forEach(items,function(item){
					var imgStr = "";
					if (attr.thumbnail){
						imgStr = '<img src=' + item.graphic.attributes[attr.thumbnail] + ' alt="" class="thumbnail" />'
					}
					_listEl.append('\
						<div class="playlist-item">\
							<img src=' + item.iconURL + ' alt="" class="marker" />\
							<h6 class="item-title">' + item.graphic.attributes[attr.title] + '</h6>\
							' + imgStr + '\
						</div>\
					');
				});
			});
		}

		function getAttributeNames(obj)
		{
			var attrNames = {},
			udrScr = new RegExp (/"_"/i),
			url = new RegExp (/http/i),
			img = new RegExp (/(?:.jpe?g|.gif|.png)/i);

			for (var prop in obj){
				if (typeof(obj[prop]) === 'string'){
					if (prop === "title"){
						attrNames.title = "title"
					}
					else if (prop === "Title"){
						attrNames.title = "Title"
					}
					else if (prop === "TITLE"){
						attrNames.title = "TITLE"
					}
					else if (prop === "name"){
						attrNames.title = "name"
					}
					else if (prop === "Name"){
						attrNames.title = "Name"
					}
					else if (prop === "NAME"){
						attrNames.title = "NAME"
					}
					else if (prop === "thumbnail"){
						attrNames.thumbnail = "thumbnail"
					}
					else if (prop === "Thumbnail"){
						attrNames.thumbnail = "Thumbnail"
					}
					else if (prop === "thumbnail"){
						attrNames.thumbnail = "THUMBNAIL"
					}
					else if (prop === "thumb_url"){
						attrNames.thumbnail = "thumb_url"
					}
					else if (prop === "Thumb_Url"){
						attrNames.thumbnail = "Thumb_Url"
					}
					else if (prop === "Thumb_URL"){
						attrNames.thumbnail = "Thumb_URL"
					}
					else if (prop === "THUMB_URL"){
						attrNames.thumbnail = "THUMB_URL"
					}
					else if (img.test(obj[prop]) && url.test(obj[prop])){
						if(!attrNames.thumbnail){
							attrNames.thumbnail = prop;
						}
					}
					else if (!udrScr.test(obj[prop]) && obj[prop].length > 1 && !url.test(obj[prop])){
						if(!attrNames.title){
							attrNames.title = prop;
						}
					}
				}
			}

			return attrNames;
		}

	}

});