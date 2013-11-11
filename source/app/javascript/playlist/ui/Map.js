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
	"esri/tasks/query",
	"esri/dijit/HistogramTimeSlider"], 
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
		Query,
		HistogramTimeSlider){
	/**
	* Playlist Map
	* @class Playlist Map
	* 
	* Class to define a new map for the playlist template
	*/

	return function PlaylistMap(geometryServiceURL,bingMapsKey,webmapId,filterField,playlistLegendConfig,mapSelector,playlistLegendSelector,legendSelector,sidePaneSelector,onLoad,onHideLegend,onListItemRefresh,onHighlight,onRemoveHighlight,onSelect,onRemoveSelection)
	{
		var _mapConfig = new MapConfig(),
		_map,
		_mapResponse,
		_mapReady = false,
		_mapTip,
		_playlistLayers = [],
		_playlistItems = {},
		_highlightEnabled = true,
		_titleFields = {},
		_lastHightlighedGraphic,
		_tempLayerId,
		_tempObjectId;

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
						layerId: (graphic.getLayer() ? graphic.getLayer().id : _tempLayerId),
						objectId: (graphic.getLayer() ? graphic.attributes[graphic.getLayer().objectIdField] : _tempObjectId)
					};

					onSelect(item);
				});

			});
		};

		this.getLayerCount = function()
		{
			return _playlistLayers.length;
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
			_tempLayerId = item.layerId;
			_tempObjectId = item.objectId;

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
						_map.infoWindow.hide();
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
						
						var newSym = layer.renderer.getSymbol(graphic).setWidth(_mapConfig.getMarkerPositionHighlight().width).setHeight(_mapConfig.getMarkerPositionHighlight().height).setOffset(_mapConfig.getMarkerPositionHighlight().xOffset,_mapConfig.getMarkerPositionHighlight().yOffset);
						
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
			if (graphic){
				var layer = graphic.getLayer();
				if (layer){
					var newSym = layer.renderer.getSymbol(graphic).setWidth(_mapConfig.getMarkerPosition().width).setHeight(_mapConfig.getMarkerPosition().height).setOffset(_mapConfig.getMarkerPosition().xOffset,_mapConfig.getMarkerPosition().yOffset);
					graphic.setSymbol(newSym);
				}
			}
			hideMapTip();
		};

		this.filterGraphics = function(items)
		{
			array.forEach(_playlistLayers,function(lyr){
				var layerObj = _map.getLayer(lyr.layerId);
				if (!items){
					layerObj.hide();
				}
				else if (items.length === 0){
					if (lyr.supportsDefinitionExpression){
						layerObj.setDefinitionExpression(lyr.defaultExpression);
					}
					else{
						array.forEach(layerObj.graphics,function(g,i){
							if (i < _mapConfig.getMaxAllowablePoints()){
								g.show();
							}
						});
					}
					layerObj.show();
				}
				else{
					if (lyr.supportsDefinitionExpression){
						var objectIds = "";
						array.forEach(items,function(item){
							if (item.layerId === lyr.layerId){
								if (objectIds === ""){
									objectIds = objectIds + item.objectId;
								}
								else{
									objectIds = objectIds + "," + item.objectId;
								}
							}
						});
						var expression = lyr.objectIdField + " IN (" + objectIds + ")";
						layerObj.setDefinitionExpression(expression);
					}
					else{
						var ids = [];
						array.forEach(items,function(item){
							if (item.layerId === lyr.layerId){
								ids.push(item.objectId);
							}
						});

						array.forEach(layerObj.graphics,function(g){
							if (array.indexOf(ids, g.attributes[lyr.objectIdField]) >= 0){
								g.show();
							}
							else{
								g.hide();
							}
						});
					}
					layerObj.show();
				}
			});
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
			var playlistLayers = [];
			array.forEach(layers,function(layer){
				if (layer.featureCollection && layer.featureCollection.layers.length > 0){
					array.forEach(layer.featureCollection.layers,function(l){
						if (l.layerDefinition.geometryType === "esriGeometryPoint" && l.visibility){
							var playlistLyr = l.layerObject;
							playlistLayers.push(playlistLyr);
							var lyrProp = {
								layerId: playlistLyr.id,
								objectIdField: playlistLyr.objectIdField,
								supportsDefinitionExpression: false,
								defaultExpression: false
							};
							_playlistLayers.push(lyrProp);
							setRenderer(playlistLyr);
							addLayerEvents(playlistLyr);
							layerIds.push(playlistLyr.id);
						}
					});
				}
				else if(layer.url && layer.resourceInfo.type === "Feature Layer" && layer.resourceInfo.geometryType === "esriGeometryPoint" && layer.visibility){
					var playlistLyr = layer.layerObject;
					playlistLayers.push(playlistLyr);
					playlistLyr.mode = 0;
					addLayerEvents(playlistLyr);
					on.once(playlistLyr, "update-end", function(){
						var query = new Query();
						query.where = "1=1";
						query.outFields = ["*"];
						query.returnGeometry = true;
						playlistLyr.queryFeatures(query).then(function(results){
							var features = results.features.slice(0,_mapConfig.getMaxAllowablePoints());
							playlistLyr.setDefinitionExpression(results.objectIdFieldName + "<=" + (features[features.length - 1].attributes[results.objectIdFieldName]));
							var lyrProp = {
								layerId: playlistLyr.id,
								objectIdField: playlistLyr.objectIdField,
								supportsDefinitionExpression: true,
								defaultExpression: (results.objectIdFieldName + "<=" + (features[features.length - 1].attributes[results.objectIdFieldName]))
							};
							_playlistLayers.push(lyrProp);

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
			buildLegend(layerIds);			
			initTime(playlistLayers);
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
			var renderer = _mapConfig.getRenderer(layerObj,lyr.graphics,colorAttr);
			var lyrItems = [];
			var maxPoints = _mapConfig.getMaxAllowablePoints();
			array.forEach(lyr.graphics,function(grp,i){
				if (i < maxPoints){
					
					var symbol = renderer.getSymbol(grp);
					
					var item = {
						layerId: layerObj.id,
						objectIdField: layerObj.objectIdField,
						graphic: grp,
						iconURL: symbol.url,
						filter: grp.attributes[filterField]
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

			var playlistStr = '<p class="esriLegendServiceLabel">' + playlistLegendConfig.layerTitle + '</p><table class="esriLayerLegend"><tbody>';

			for (var obj in playlistLegendConfig.items){
				if (playlistLegendConfig.items[obj].visible){
					playlistStr = playlistStr + '<tr><td class="marker-cell"><img class="marker" src="' + playlistLegendConfig.items[obj].iconURL + '" alt="" /></td><td class="label-cell">' + playlistLegendConfig.items[obj].name + '</td></tr>';
				}
			}

			playlistStr = playlistStr + '</tbody></table>';

			domConstruct.place(playlistStr,dom.byId(playlistLegendSelector),"first");
		}

		function addLayerEvents(layer)
		{
			on(layer,"mouse-over",function(event){
				var newSym = layer.renderer.getSymbol(event.graphic).setWidth(_mapConfig.getMarkerPositionHighlight().width).setHeight(_mapConfig.getMarkerPositionHighlight().height).setOffset(_mapConfig.getMarkerPositionHighlight().xOffset,_mapConfig.getMarkerPositionHighlight().yOffset);
				var item = {
					layerId: event.graphic.getLayer().id,
					objectId: event.graphic.attributes[event.graphic.getLayer().objectIdField]
				};
				var titleAttr = _titleFields[event.graphic.getLayer().id];
				_lastHightlighedGraphic = event.graphic;
				event.graphic.setSymbol(newSym);
				event.graphic.getDojoShape().moveToFront();
				_map.setCursor("pointer");

				showMapTip(event.graphic,titleAttr);

				onHighlight(item);
			});

			on(layer,"mouse-out",function(event){
				var newSym = layer.renderer.getSymbol(event.graphic).setWidth(_mapConfig.getMarkerPosition().width).setHeight(_mapConfig.getMarkerPosition().height).setOffset(_mapConfig.getMarkerPosition().xOffset,_mapConfig.getMarkerPosition().yOffset);
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

		function initTime(layers)
		{
			if (_mapResponse.itemInfo.itemData.widgets && _mapResponse.itemInfo.itemData.widgets.timeSlider){
				console.log(_mapResponse.itemInfo.itemData.widgets.timeSlider);
				console.log(layers);
				console.log(HistogramTimeSlider);
			}
		}
	};

});