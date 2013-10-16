define(["esri/map","esri/arcgis/utils","esri/dijit/Popup","dojo/on","dojo/Evented","dojo/dom-construct","esri/symbols/PictureMarkerSymbol","esri/renderers/UniqueValueRenderer","esri/tasks/query"], 
	function(Map,arcgisUtils,Popup,on,Evented,domConstruct,PictureMarkerSymbol,UniqueValueRenderer,Query){
	/**
	* Playlist Map
	* @class Playlist Map
	* 
	* Class to define a new map for the playlist template
	*/

	return function PlaylistMap(geometryServiceURL,bingMapsKey,webmapId,selector,onLoad,onListItemRefresh)
	{

		var _map,
		_playlistItems = [];

		this.init = function(){

			var popup = new Popup(null,domConstruct.create("div"));

			var extent = new esri.geometry.Extent({"xmin":-9904768.056986406,"ymin":2683528.169259358,"xmax":-8339337.7177064195,"ymax":3720625.76903235,"spatialReference":{"wkid":102100}});

			arcgisUtils.createMap(webmapId,selector,{
				mapOptions: {
					// extent: extent,
					sliderPosition: "top-right",
					infoWindow: popup
				},
				geometryServiceURL: geometryServiceURL,
				bingMapsKey: bingMapsKey
			}).then(function(response){
				
				_map = response.map;

				getPointLayers(response.itemInfo.itemData.operationalLayers);

				on.once(_map,"update-end",function(){
					// setRenderers();
					if(onLoad){
						onLoad(response.itemInfo.item);
					}
				});

			});
		};

		this.getPlaylistItems = function()
		{
			return _playlistItems;
		};

		function getPointLayers(layers)
		{
			dojo.forEach(layers,function(layer){
				if (layer.featureCollection && layer.featureCollection.layers.length > 0){
					dojo.forEach(layer.featureCollection.layers,function(l){
						if (l.layerDefinition.geometryType === "esriGeometryPoint" && l.visibility){
							var playlistLyr = l.layerObject;
							setRenderer(playlistLyr);
							addLayerEvents(playlistLyr);
						}
					});
				}
				else if(layer.url && layer.resourceInfo.type === "Feature Layer" && layer.resourceInfo.geometryType === "esriGeometryPoint" && layer.visibility){
					var playlistLyr = layer.layerObject;
					playlistLyr.mode = 0;
					addLayerEvents(playlistLyr);
					on.once(playlistLyr, "update-end", function(){
						var query = new Query();
						query.where = "1=1";
						query.outFields = ["*"];
						query.returnGeometry = true;
						playlistLyr.queryFeatures(query).then(function(results){
							var features = results.features.slice(0,98);
							playlistLyr.setDefinitionExpression(results.objectIdFieldName + "<=" + (features[features.length - 1].attributes[results.objectIdFieldName]));

							// Create Temporary layer object to get first 99 features from a feature layer
							var layer = {
								type: "Feature Layer",
								graphics: features,
								layerObject: playlistLyr
							}
							setRenderer(layer);
						});

					});
				}
			});
		}

		function setRenderer(lyr)
		{
			var layerObj = lyr;
			if(!lyr.setRenderer){
				layerObj = lyr.layerObject;
			}

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
			var renderer = new UniqueValueRenderer(defaultSymbol, layerObj.objectIdField);
			var lyrItems = [];
			dojo.forEach(lyr.graphics,function(grp,i){
				if (i < 99){
					var iconURL;
					if(grp.attributes[colorAttr]){
						if (grp.attributes[colorAttr].toLowerCase === "b" || grp.attributes[colorAttr].toLowerCase === "blue"){
							iconURL = "resources/images/markers/blue/NumberIconb" + (i + 1) + ".png";
						}
						else if (grp.attributes[colorAttr].toLowerCase === "g" || grp.attributes[colorAttr].toLowerCase === "green"){
							iconURL = "resources/images/markers/green/NumberIcong" + (i + 1) + ".png";
						}
						else if (grp.attributes[colorAttr].toLowerCase === "p" || grp.attributes[colorAttr].toLowerCase === "purple"){
							iconURL = "resources/images/markers/purple/IconPurple" + (i + 1) + ".png";
						}
						else{
							iconURL = "resources/images/markers/red/NumberIcon" + (i + 1) + ".png";
						}
					}
					else{
						iconURL = "resources/images/markers/red/NumberIcon" + (i + 1) + ".png";
					}
					renderer.addValue(grp.attributes[layerObj.objectIdField], new PictureMarkerSymbol(iconURL, 22, 28).setOffset(3,8));
					
					var item = {
						graphic: grp,
						iconURL: iconURL
					};
					lyrItems.push(item);
				}
				else{
					lyr.graphics[i].hide();
				}
			});
			
			console.log(renderer);
			layerObj.setRenderer(renderer);
			_playlistItems.push(lyrItems);
			listItemsRefresh();

		}

		function addLayerEvents(layer)
		{
			on(layer,"mouse-over",function(event){
				var newSym = layer.renderer.getSymbol(event.graphic).setWidth(27).setHeight(34).setOffset(3,10);
				event.graphic.setSymbol(newSym);
				event.graphic.getDojoShape().moveToFront();
				_map.setCursor("pointer");
			});

			on(layer,"mouse-out",function(event){
				var newSym = layer.renderer.getSymbol(event.graphic).setWidth(22).setHeight(28).setOffset(3,8);
				event.graphic.setSymbol(newSym);
				_map.setCursor("default");
			});
		}

		function listItemsRefresh()
		{
			onListItemRefresh(_playlistItems);
		}
	};

});