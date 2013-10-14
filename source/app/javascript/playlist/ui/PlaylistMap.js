define(["esri/map","esri/arcgis/utils","esri/dijit/Popup","dojo/on","dojo/dom-construct","esri/symbols/PictureMarkerSymbol","esri/renderers/UniqueValueRenderer"], 
	function(Map,arcgisUtils,Popup,On,domConstruct,PictureMarkerSymbol,UniqueValueRenderer){
	/**
	* Playlist Map
	* @class Playlist Map
	* 
	* Class to define a new map for the playlist template
	*/

	return function PlaylistMap(geometryServiceURL,bingMapsKey,webmapId,selector,onLoad)
	{

		var _map,
		_playlistLayers = [];

		this.init = function(){

			var popup = new Popup(null,domConstruct.create("div"));

			arcgisUtils.createMap(webmapId,selector,{
				mapOptions: {
					infoWindow: popup
				},
				geometryServiceURL: geometryServiceURL,
				bingMapsKey: bingMapsKey
			}).then(function(response){
				
				_map = response.map;

				getPointLayers(response.itemInfo.itemData.operationalLayers);

				On.once(_map,"update-end",function(){
					if(onLoad){
						onLoad(response.itemInfo.item);
					}
				});

			});
		}

		function getPointLayers(layers)
		{
			dojo.forEach(layers,function(layer){
				if (layer.featureCollection && layer.featureCollection.layers.length > 0){
					dojo.forEach(layer.featureCollection.layers,function(l){
						if (l.layerDefinition.geometryType === "esriGeometryPoint" && l.visibility){
							var playlistLyr = l.layerObject;
							_playlistLayers.push(playlistLyr);
							addLayerEvents(playlistLyr);
						}
					});
				}
			});

			setRenderers();
		}

		function setRenderers()
		{
			dojo.forEach(_playlistLayers,function(lyr,i){

				// Get Color Attribute
				var colorAttr;
				if (lyr.graphics[0] && lyr.graphics[0].attributes.Color){
					colorAttr = "Color";
				}
				else if (lyr.graphics[0] && lyr.graphics[0].attributes.color){
					colorAttr = "color";
				}
				else if (lyr.graphics[0] && lyr.graphics[0].attributes.COLOR){
					colorAttr = "COLOR";
				}

				// Get Order Attribute
				var orderAttr;
				if (lyr.graphics[0] && lyr.graphics[0].attributes.Order){
					colorAttr = "Order";
				}
				else if (lyr.graphics[0] && lyr.graphics[0].attributes.order){
					colorAttr = "order";
				}
				else if (lyr.graphics[0] && lyr.graphics[0].attributes.ORDER){
					colorAttr = "ORDER";
				}

				if (lyr.graphics.length > 1 && orderAttr){
					lyr.graphics.sort(function(a,b){
						return a[orderAttr] - b[orderAttr];
					});
				}

				var defaultSymbol = new PictureMarkerSymbol("resources/images/markers/red/NumberIcon1.png", 22, 28).setOffset(3,8);
				var renderer = new UniqueValueRenderer(defaultSymbol, lyr.objectIdField);
				dojo.forEach(lyr.graphics,function(grp,i){
					if (i < 99){
						if (grp.attributes[colorAttr] && grp.attributes[colorAttr].toLowerCase === "b" || grp.attributes[colorAttr].toLowerCase === "blue"){
							renderer.addValue(grp.attributes[lyr.objectIdField], new PictureMarkerSymbol("resources/images/markers/blue/NumberIconb" + (i + 1) + ".png", 22, 28).setOffset(3,8));
						}
						else if (grp.attributes[colorAttr] && grp.attributes[colorAttr].toLowerCase === "g" || grp.attributes[colorAttr].toLowerCase === "green"){
							renderer.addValue(grp.attributes[lyr.objectIdField], new PictureMarkerSymbol("resources/images/markers/green/NumberIcong" + (i + 1) + ".png", 22, 28).setOffset(3,8));
						}
						else if (grp.attributes[colorAttr] && grp.attributes[colorAttr].toLowerCase === "p" || grp.attributes[colorAttr].toLowerCase === "purple"){
							renderer.addValue(grp.attributes[lyr.objectIdField], new PictureMarkerSymbol("resources/images/markers/purple/IconPurple" + (i + 1) + ".png", 22, 28).setOffset(3,8));
						}
						else{
							renderer.addValue(grp.attributes[lyr.objectIdField], new PictureMarkerSymbol("resources/images/markers/red/NumberIcon" + (i + 1) + ".png", 22, 28).setOffset(3,8));
						}
					}
					else{
						lyr.graphics[i].hide();
					}
				});
				lyr.setRenderer(renderer);
			});
		}

		function addLayerEvents(layer)
		{
			On(layer,"mouse-over",function(event){
				var newSym = layer.renderer.getSymbol(event.graphic).setWidth(27).setHeight(34).setOffset(3,10);
				event.graphic.setSymbol(newSym);
				_map.setCursor("pointer");
			});

			On(layer,"mouse-out",function(event){
				var newSym = layer.renderer.getSymbol(event.graphic).setWidth(22).setHeight(28).setOffset(3,8);
				event.graphic.setSymbol(newSym);
				_map.setCursor("default");
			});
		}
	}

});