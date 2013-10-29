define(["storymaps/playlist/config/MapConfig","esri/map",
	"esri/arcgis/utils",
	"esri/dijit/Legend",
	"esri/dijit/Popup",
	"dojo/dom",
	"dojo/dom-class",
	"dojo/dom-style",
	"dojo/query",
	"dojo/dom-geometry",
	"dojo/on",
	"dojo/_base/array",
	"dojo/dom-construct",
	"esri/symbols/PictureMarkerSymbol",
	"esri/renderers/UniqueValueRenderer",
	"esri/tasks/query"], 
	function(MapConfig,
		Map,
		arcgisUtils,
		Legend,
		Popup,
		dom,
		domClass,
		domStyle,
		query,
		domGeom,
		on,
		array,
		domConstruct,
		PictureMarkerSymbol,
		UniqueValueRenderer,
		Query){
	/**
	* Playlist Map
	* @class Playlist Map
	* 
	* Class to define a new map for the playlist template
	*/

	return function PlaylistMap(geometryServiceURL,bingMapsKey,webmapId,mapSelector,legendSelector,sidePaneSelector,onLoad,onHideLegend,onListItemRefresh,onHighlight,onRemoveHighlight,onSelect,onRemoveSelection)
	{
		var mapConfig = new MapConfig(),
		_map,
		_mapResponse,
		_mapReady = false,
		_mapTip,
		_layerCount = 0,
		_playlistItems = {},
		_highlightEnabled = true,
		_titleFields = {},
		_lastHightlighedGraphic;

		console.log(mapConfig.getMarkerPositionHighlight().height);

		this.init = function(){

			var popup = new Popup(null,domConstruct.create("div"));

			_mapTip = domConstruct.place('<div class="map-tip"></div>',dom.byId(mapSelector),"first");

			arcgisUtils.createMap(webmapId,mapSelector,{
				mapOptions: {
					sliderPosition: "top-right",
					infoWindow: popup
				},
				geometryServiceURL: geometryServiceURL,
				bingMapsKey: bingMapsKey
			}).then(function(response){

				setTimeout(function(){
					if(onLoad && !_mapReady){
						_mapReady = true;
						console.log("Timeout error: map did not fully load");
						onLoad(response.itemInfo.item);
					}
				},10000);
				
				_mapResponse = response;
				_map = response.map;

				// ADD HOME BUTTON TO ZOOM SLIDER
				on.once(_map,"extent-change",function(){
					var homeExtent = _map.extent;
					array.forEach(query(".esriSimpleSliderIncrementButton"),function(node){
						var homeButton = domConstruct.place('<div class="esriSimpleSliderIncrementButton homeExtentButton icon-home"></div>', node ,"after");
						on(homeButton,"click",function(){
							_map.setExtent(homeExtent);
						});
					});
				});
				_map.centerAt(getOffsetCenter(_map.extent.getCenter()));

				if(_map.loaded){
					getPointLayers(response.itemInfo.itemData.operationalLayers);
				}
				else{
					on(_map,"loaded",function(){
						getPointLayers(response.itemInfo.itemData.operationalLayers);
					});
				}

				on.once(_map,"update-end",function(){
					if(onLoad && !_mapReady){
						_mapReady = true;
						onLoad(response.itemInfo.item);
					}
				});

				on(popup,"hide",function(){
					_highlightEnabled = true;
					onRemoveSelection();
				});

				on(popup,"show",function(){
					hideMapTip();
					_highlightEnabled = false;
				});

				on(popup,"set-features",function(){
					var graphic = popup.getSelectedFeature();
					var item = {
						layerId: graphic.getLayer().id,
						objectId: graphic.attributes[graphic.getLayer().objectIdField]
					};

					onSelect(item);
				});

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

		this.setTitleAttr = function(titleObj)
		{
			_titleFields[titleObj.layerId] = titleObj.fieldName;
		};

		this.select = function(item)
		{
			_map.infoWindow.hide();

			var layer = _map.getLayer(item.layerId);

			var query = new Query();
			query.objectIds = [item.objectId];
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

		this.highlight = function(item)
		{
			if (_highlightEnabled){
				var layer = _map.getLayer(item.layerId);
				var titleAttr = _titleFields[item.layerId];

				var query = new Query();
				query.objectIds = [item.objectId];
				query.outFields = ["*"];
				query.returnGeometry = true;

				layer.queryFeatures(query,function(result){
					var graphic = result.features[0];
					_lastHightlighedGraphic = graphic;

					if (graphic.getNode() && domGeom.position(graphic.getNode()).x > getSidePanelWidth()){
						
						var newSym = layer.renderer.getSymbol(graphic).setWidth(mapConfig.getMarkerPositionHighlight().width).setHeight(mapConfig.getMarkerPositionHighlight().height).setOffset(mapConfig.getMarkerPositionHighlight().xOffset,mapConfig.getMarkerPositionHighlight().yOffset);
						
						graphic.setSymbol(newSym);
						graphic.getDojoShape().moveToFront();

						showMapTip(graphic,titleAttr);
					}
					
				});
			}
		};

		this.removeHighlight = function()
		{
			var graphic = _lastHightlighedGraphic;
			var layer = graphic.getLayer();
			var newSym = layer.renderer.getSymbol(graphic).setWidth(mapConfig.getMarkerPosition().width).setHeight(mapConfig.getMarkerPosition().height).setOffset(mapConfig.getMarkerPosition().xOffset,mapConfig.getMarkerPosition().yOffset);
					
			graphic.setSymbol(newSym);
			graphic.getDojoShape().moveToFront();

			hideMapTip();
		};

		function getSidePanelWidth()
		{
			return domGeom.position(query(sidePaneSelector)[0]).w;
		}

		function getOffsetCenter(center)
		{
			var offsetX = getSidePanelWidth()/2 * _map.getResolution();
			center.x = center.x - offsetX;

			return center;
		}

		function getPointLayers(layers)
		{
			var layerIds = [];
			array.forEach(layers,function(layer){
				if (layer.featureCollection && layer.featureCollection.layers.length > 0){
					array.forEach(layer.featureCollection.layers,function(l){
						if (l.layerDefinition.geometryType === "esriGeometryPoint" && l.visibility){
							var playlistLyr = l.layerObject;
							setRenderer(playlistLyr);
							addLayerEvents(playlistLyr);
							layerIds.push(playlistLyr.id);
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
							var features = results.features.slice(0,(mapConfig.getMaxAllowablePoints() - 1));
							playlistLyr.setDefinitionExpression(results.objectIdFieldName + "<=" + (features[features.length - 1].attributes[results.objectIdFieldName]));

							// Create Temporary layer object to get first 99 features from a feature layer
							var layer = {
								type: "Feature Layer",
								graphics: features,
								layerObject: playlistLyr
							};
							setRenderer(layer);
						});

					});
					layerIds.push(playlistLyr.id);
				}
			});
			
			_layerCount = layerIds.length;
			buildLegend(layerIds);
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
			var defaultSymbol = new PictureMarkerSymbol("resources/images/markers/red/NumberIcon1.png", mapConfig.getMarkerPosition().width, mapConfig.getMarkerPosition().height).setOffset(mapConfig.getMarkerPosition().xOffset,mapConfig.getMarkerPosition().yOffset);
			var renderer = new UniqueValueRenderer(defaultSymbol, layerObj.objectIdField);
			var lyrItems = [];
			array.forEach(lyr.graphics,function(grp,i){
				if (i < mapConfig.getMaxAllowablePoints()){
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
					renderer.addValue(grp.attributes[layerObj.objectIdField], new PictureMarkerSymbol(iconURL, mapConfig.getMarkerPosition().width, mapConfig.getMarkerPosition().height).setOffset(mapConfig.getMarkerPosition().xOffset,mapConfig.getMarkerPosition().yOffset));
					
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
			layerObj.redraw();
			_playlistItems[layerObj.id] = lyrItems;
			listItemsRefresh();

		}

		function buildLegend(layerIds)
		{
			var layers = arcgisUtils.getLegendLayers(_mapResponse);
			var legendLyrs = [];

			array.forEach(layers,function(lyr){
				if (array.indexOf(layerIds,lyr.layer.id) < 0){
					legendLyrs.push(lyr);
				}
			});
			if (legendLyrs.length > 0){
				var legend = new Legend({
					map: _map,
					layerInfos: legendLyrs
				},"legend");
				legend.startup();
			}
			else{
				onHideLegend();
			}
		}

		function addLayerEvents(layer)
		{
			on(layer,"mouse-over",function(event){
				var newSym = layer.renderer.getSymbol(event.graphic).setWidth(mapConfig.getMarkerPositionHighlight().width).setHeight(mapConfig.getMarkerPositionHighlight().height).setOffset(mapConfig.getMarkerPositionHighlight().xOffset,mapConfig.getMarkerPositionHighlight().yOffset);
				var item = {
					layerId: event.graphic.getLayer().id,
					objectId: event.graphic.attributes[event.graphic.getLayer().objectIdField]
				};
				var titleAttr = _titleFields[event.graphic.getLayer().id];
				event.graphic.setSymbol(newSym);
				event.graphic.getDojoShape().moveToFront();
				_map.setCursor("pointer");

				showMapTip(event.graphic,titleAttr);

				onHighlight(item);
			});

			on(layer,"mouse-out",function(event){
				var newSym = layer.renderer.getSymbol(event.graphic).setWidth(mapConfig.getMarkerPosition().width).setHeight(mapConfig.getMarkerPosition().height).setOffset(mapConfig.getMarkerPosition().xOffset,mapConfig.getMarkerPosition().yOffset);
				var item = {
					layerId: event.graphic.getLayer().id,
					objectId: event.graphic.attributes[event.graphic.getLayer().objectIdField]
				};
				event.graphic.setSymbol(newSym);
				_map.setCursor("default");

				hideMapTip();

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

		function showMapTip(graphic,titleAttr)
		{
			if (_highlightEnabled){
				_mapTip.innerHTML = graphic.attributes[titleAttr];

				domStyle.set(_mapTip,{
					display: "block"
				});

				var pos = domGeom.position(graphic.getNode());
				var mapTipPos = domGeom.position(_mapTip);
				var mapPos = domGeom.position(dom.byId(mapSelector));

				var offsetY = -mapPos.y - mapTipPos.h - 1;
				var offsetX = -mapPos.x + pos.w + 1;

				if (pos.x > (mapPos.x + mapPos.w - mapTipPos.w - 50)){
					offsetX = -mapPos.x - mapTipPos.w - 1;
				}
				if (pos.y - pos.w - mapPos.y < mapTipPos.h + 50){
					offsetY = -mapPos.y + pos.h + 1;
				}

				var mapTipTop = (pos.y + offsetY) + "px";
				var mapTipLeft = (pos.x + offsetX) + "px";

				domStyle.set(_mapTip,{
					top: mapTipTop,
					left: mapTipLeft
				});
			}
		}

		function hideMapTip()
		{
			domStyle.set(_mapTip,{
				display: "none"
			});

		}
	};

});