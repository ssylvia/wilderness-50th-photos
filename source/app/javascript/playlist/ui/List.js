define(["dojo/_base/array","lib/jquery/jquery-1.10.2.min","lib/jquery.autoellipsis-1.0.10.min"], 
	function(array){
	/**
	* Playlist List
	* @class Playlist List
	* 
	* Class to define a new item list in the playlist app
		*
		* Dependencies: Jquery 1.10.2
	*/

	return function List(selector,onLoad)
	{
		var _listEl = $(selector);

		this.update = function(lyrItems)
		{
			_listEl.empty();
			$(".playlist-item").unbind("click");
			buildList(lyrItems);

			onLoad();
		};

		this.highlight = function(item)
		{
			$(".playlist-item[layer-id=" + item.layerId + "][object-id=" + item.objectId + "]").addClass("highlight");
		};

		this.removeHighlight = function(item)
		{
			$(".playlist-item").removeClass("highlight");
		}

		function buildList(lyrItems)
		{
			for (layerId in lyrItems){
				var items = lyrItems[layerId];
				var attr = getAttributeNames(items[0].graphic.attributes);
				array.forEach(items,function(item){
					var objId = item.graphic.attributes[item.objectIdField];
					var itemStr = "";
					if (attr.thumbnail){
						itemStr = '\
							<div class="playlist-item" layer-id="' + layerId + '" object-id="' + objId + '">\
								<img src=' + item.iconURL + ' alt="" class="marker" />\
								<div class="thumbnail-container" style="background-image: url(' + item.graphic.attributes[attr.thumbnail] + ')"></div>\
								<h6 class="item-title">' + item.graphic.attributes[attr.title] + '</h6>\
							</div>\
						';
					}
					else{
						itemStr = '\
							<div class="playlist-item no-image" layer-id="' + layerId + '" object-id="' + objId + '">\
								<img src=' + item.iconURL + ' alt="" class="marker" />\
								<h6 class="item-title">' + item.graphic.attributes[attr.title] + '</h6>\
							</div>\
						';
					}
					_listEl.append(itemStr);
				});			
			}
			$(".item-title").ellipsis();

			addSelectEvent();
		}

		function addSelectEvent()
		{
			$(".playlist-item").click(function(){
				console.log($(this));
				console.log($(".playlist-item[layer-group=" + $(this).attr("layer-group") + "]"));
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
						attrNames.title = "title";
					}
					else if (prop === "Title"){
						attrNames.title = "Title";
					}
					else if (prop === "TITLE"){
						attrNames.title = "TITLE";
					}
					else if (prop === "name"){
						attrNames.title = "name";
					}
					else if (prop === "Name"){
						attrNames.title = "Name";
					}
					else if (prop === "NAME"){
						attrNames.title = "NAME";
					}
					else if (prop === "thumbnail"){
						attrNames.thumbnail = "thumbnail";
					}
					else if (prop === "Thumbnail"){
						attrNames.thumbnail = "Thumbnail";
					}
					else if (prop === "thumbnail"){
						attrNames.thumbnail = "THUMBNAIL";
					}
					else if (prop === "thumb_url"){
						attrNames.thumbnail = "thumb_url";
					}
					else if (prop === "Thumb_Url"){
						attrNames.thumbnail = "Thumb_Url";
					}
					else if (prop === "Thumb_URL"){
						attrNames.thumbnail = "Thumb_URL";
					}
					else if (prop === "THUMB_URL"){
						attrNames.thumbnail = "THUMB_URL";
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

	};

});