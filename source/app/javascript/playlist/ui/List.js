define(["dojo/_base/array",
	"lib/jquery/jquery-1.10.2.min",
	"lib/jquery.autoellipsis-1.0.10.min",
	"lib/jquery-ui-1.10.3.custom.min"], 
	function(array){
	/**
	* Playlist List
	* @class Playlist List
	* 
	* Class to define a new item list in the playlist app
	*
	* Dependencies: Jquery 1.10.2
	*/

	return function List(selector,searchSelector,onLoad,onGetTitleField,onSelect,onHighlight,onRemoveHightlight)
	{
		var _listEl = $(selector);

		addSearchEvents();

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

		this.removeHighlight = function()
		{
			$(".playlist-item").removeClass("highlight");
		};

		this.select = function(item)
		{
			var element = $(".playlist-item[layer-id=" + item.layerId + "][object-id=" + item.objectId + "]");
			if (element.length > 0){
				var itemTop = element.position().top;
				$(".playlist-element").removeClass("selected");
				element.addClass("selected");

				if (itemTop < 0){
					$(selector).scrollTop($(selector).scrollTop() + itemTop);
				}
				else if (itemTop + element.height() > $(selector).height()){
					$(selector).scrollTop($(selector).scrollTop() + itemTop - $(selector).height() + element.height());
				}
			}
		};

		this.removeSelection = function()
		{
			$(".playlist-item").removeClass("selected");
		};

		function addSearchEvents()
		{
			if (searchSelector){

				$(searchSelector).autocomplete({
					source: function(request,response){
						var regex = new RegExp($.ui.autocomplete.escapeRegex(request.term),"i");

						response($.grep($(".playlist-item"),function(el){
							return ($(el).find(".item-title div").html().match(regex));
						}));
					},
					response: function(event,ui){
						$(".playlist-item").hide();
						$.each(ui.content,function(i,el){
							$(el).show();
						});
					},
					close: function(){
						if ($(searchSelector).val() === ""){
							$(".playlist-item").show();
						}
					},
					change: function(){
						if ($(searchSelector).val() === ""){
							$(".playlist-item").show();
						}
					}
				});
			}
		}

		function buildList(lyrItems)
		{
			for (var layerId in lyrItems){
				var items = lyrItems[layerId];
				var attr = getAttributeNames(items[0].graphic.attributes);
				var titleAttr = {
					layerId: layerId,
					fieldName: attr.title
				};
				onGetTitleField(titleAttr);
				array.forEach(items,function(item){
					var objId = item.graphic.attributes[item.objectIdField];
					var itemStr = "";
					if (attr.thumbnail){
						itemStr = '\
							<div class="playlist-item" layer-id="' + layerId + '" object-id="' + objId + '">\
								<img src=' + item.iconURL + ' alt="" class="marker" />\
								<div class="thumbnail-container" style="background-image: url(' + item.graphic.attributes[attr.thumbnail] + '); filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="' + item.graphic.attributes[attr.thumbnail] + '", sizingMethod="scale");"></div>\
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

			addEvents();
		}

		function addEvents()
		{
			$(".playlist-item").click(function(){
				$(".playlist-item").removeClass("selected");
				$(this).addClass("selected");
				var item = {
					layerId: $(this).attr("layer-id"),
					objectId: $(this).attr("object-id")
				};
				onSelect(item);
			});

			$(".playlist-item").mouseover(function(){
				$(".playlist-item").removeClass("highlight");
				$(this).addClass("highlight");
				var item = {
					layerId: $(this).attr("layer-id"),
					objectId: $(this).attr("object-id")
				};
				
				onHighlight(item);
			});

			$(selector).mouseout(function(){
				$(".playlist-item").removeClass("highlight");
				onRemoveHightlight();
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