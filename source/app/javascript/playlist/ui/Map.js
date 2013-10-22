define(["esri/map","esri/arcgis/utils","esri/dijit/Popup","dojo/query","dojo/dom-geometry","dojo/on","dojo/_base/array","dojo/dom-construct","esri/symbols/PictureMarkerSymbol","esri/renderers/UniqueValueRenderer","esri/tasks/query"], 
	function(Map,arcgisUtils,Popup,query,domGeom,on,array,domConstruct,PictureMarkerSymbol,UniqueValueRenderer,Query){
	/**
	* Playlist Map
	* @class Playlist Map
	* 
	* Class to define a new map for the playlist template
	*/

	return function PlaylistMap(geometryServiceURL,bingMapsKey,webmapId,MapSelector,sidePaneSelector,onLoad,onListItemRefresh,onHighlight,onRemoveHighlight,onSelect,onRemoveSelection)
	{

		var _map,
		_layerCount = 0,
		_playlistItems = {};

		this.init = function(){

			var popup = new Popup(null,domConstruct.create("div"));

			arcgisUtils.createMap(webmapId,MapSelector,{
				mapOptions: {
					sliderPosition: "top-right",
					infoWindow: popup
				},
				geometryServiceURL: geometryServiceURL,
				bingMapsKey: bingMapsKey
			}).then(function(response){
				
				_map = response.map;

				getPointLayers(response.itemInfo.itemData.operationalLayers);

				on.once(_map,"update-end",function(){
					_map.centerAt(getOffsetCenter(_map.extent.getCenter()));
					if(onLoad){
						onLoad(response.itemInfo.item);
					}
				});

				on(popup,"hide",function(){
					onRemoveSelection();
				});

				on(popup,"set-features",function(){
					var graphic = popup.getSelectedFeature();
					var item = {
						layerId: graphic.getLayer().id,
						objectId: graphic.attributes[graphic.getLayer().objectIdField]
					};

					onSelect(item);
				})

			});
		};

		this.getLayerCount = function()
		{
			return _layerCount;
		};

		this.getPlaylistItems = function()
		{
			return _playlistItems;
		};

		this.select = function(item)
		{
			_map.infoWindow.hide();

			var layer = _map.getLayer(item.layerId);

			var query = new Query();
			query.objectIds = [item.objectId];
			query.outFields = ["*"];
			query.returnGeometry = true;

			layer.queryFeatures(query,function(result){
				var graphic = result.features[0];

				if (!graphic.infoTemplate){
					graphic.infoTemplate = layer.infoTemplate;
				}

				if (graphic.getNode() && domGeom.position(graphic.getNode()).x > getSidePanelWidth()){
					openPopup(graphic);
				}
				else{
					on.once(_map,"extent-change",function(){
						openPopup(graphic);
					});
					panMapToGraphic(graphic.geometry);
				}
				
			});
		};


		function getSidePanelWidth()
		{
			return domGeom.position(query(sidePaneSelector)[0]).w;
		}

		function getOffsetCenter(center)
		{
			var offsetX = getSidePanelWidth() * _map.getResolution();
			center.x = center.x - offsetX;

			return center;
		}

		function getPointLayers(layers)
		{
			array.forEach(layers,function(layer){
				if (layer.featureCollection && layer.featureCollection.layers.length > 0){
					array.forEach(layer.featureCollection.layers,function(l){
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

			_layerCount++;

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
			array.forEach(lyr.graphics,function(grp,i){
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
						layerId: layerObj.id,
						objectIdField: layerObj.objectIdField,
						graphic: grp,
						iconURL: iconURL
					};
					lyrItems.push(item);
				}
				else{
					lyr.graphics[i].hide();
				}
			});

			layerObj.setRenderer(renderer);
			_playlistItems[layerObj.id] = lyrItems;
			listItemsRefresh();

		}

		function addLayerEvents(layer)
		{
			on(layer,"mouse-over",function(event){
				var newSym = layer.renderer.getSymbol(event.graphic).setWidth(27).setHeight(34).setOffset(3,10);
				var item = {
					layerId: event.graphic.getLayer().id,
					objectId: event.graphic.attributes[event.graphic.getLayer().objectIdField]
				};
				event.graphic.setSymbol(newSym);
				event.graphic.getDojoShape().moveToFront();
				_map.setCursor("pointer");

				onHighlight(item);
			});

			on(layer,"mouse-out",function(event){
				var newSym = layer.renderer.getSymbol(event.graphic).setWidth(22).setHeight(28).setOffset(3,8);
				var item = {
					layerId: event.graphic.getLayer().id,
					objectId: event.graphic.attributes[event.graphic.getLayer().objectIdField]
				};
				event.graphic.setSymbol(newSym);
				_map.setCursor("default");

				onRemoveHighlight(item);
			});
		}

		function listItemsRefresh()
		{
			onListItemRefresh(_playlistItems);
		}

		function panMapToGraphic(geo)
		{
			if (geo.type === "point"){
				var extent = _map.extent;
				var sidePaneWidth = getSidePanelWidth() * _map.getResolution();
				var offsetWidth = (_map.extent.getWidth()/5)*2;
				var offsetHeight = (_map.extent.getHeight()/5)*2;
				var offsetX = 0;
				var offsetY = 0;

				if (geo.x > extent.xmax){
					offsetX = -offsetWidth;
				}
				else if (geo.x < extent.xmin + sidePaneWidth){
					offsetX = offsetWidth - sidePaneWidth;
				}
				else{
					offsetX = extent.getCenter().x - geo.x;
				}

				if (geo.y > extent.ymax){
					offsetY = -offsetHeight;
				}
				else if (geo.y < extent.ymin){
					offsetY = offsetHeight;
				}
				else{
					offsetY = extent.getCenter().y - geo.y;
				}

				var newPt = geo.offset(offsetX,offsetY);

				_map.centerAt(newPt);
			}
		}

		function openPopup(graphic)
		{
			_map.infoWindow.setFeatures([graphic]);
			_map.infoWindow.show(graphic.geometry);
		}
	};

});