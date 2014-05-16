define(["storymaps/playlist/config/MapConfig",
	"storymaps/playlist/core/Data",
	"esri/layers/CSVLayer",
	"esri/map",
	"esri/arcgis/utils",
	"esri/dijit/Legend",
	"esri/dijit/Popup",
	"esri/dijit/PopupMobile",
	"dojo/dom",
	"dojo/dom-class",
	"dojo/dom-style",
	"dojo/query",
	"dojo/dom-geometry",
	"esri/geometry/ScreenPoint",
	"dojo/on",
	"dojo/has",
	"dojo/_base/array",
	"dojo/dom-construct",
	"esri/symbols/PictureMarkerSymbol",
	"esri/renderers/UniqueValueRenderer",
	"esri/tasks/query",
	"esri/dijit/HistogramTimeSlider",
	"dojo/_base/sniff"], 
	function(MapConfig,
		Data,
		CSVLayer,
		Map,
		arcgisUtils,
		Legend,
		Popup,
		PopupMobile,
		dom,
		domClass,
		domStyle,
		query,
		domGeom,
		ScreenPoint,
		on,
		has,
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

	return function PlaylistMap(isMobile,geometryServiceURL,bingMapsKey,webmapId,excludedLayers,dataFields,displayLegend,playlistLegendConfig,mapSelector,playlistLegendSelector,legendSelector,sidePaneSelector,onLoad,onHideLegend,onListItemRefresh,onHighlight,onRemoveHighlight,onSelect,onRemoveSelection)
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

			var popup;

			if (has("touch") && domGeom.position(query("body")[0]).w < 768){
				popup = new PopupMobile(null,domConstruct.create("div"));
			}
			else{
				popup = new Popup(null,domConstruct.create("div"));
			}

			_mapTip = domConstruct.place('<div class="map-tip"></div>',dom.byId(mapSelector),"first");

			_map = new Map(mapSelector,{
				basemap: 'national-geographic',
				sliderPosition: "top-right",
				infoWindow: popup,
				center: [-95, 39],
				zoom: 5
			});

			on.once(_map,"load",function(){
				_map.centerAt(getOffsetCenter(_map.extent.getCenter()));

				on.once(_map,"extent-change",function(){
					// ADD HOME BUTTON TO ZOOM SLIDER
					var homeExtent = _map.extent;
					array.forEach(query(".esriSimpleSliderIncrementButton"),function(node){
						var homeButton = domConstruct.place('<div class="esriSimpleSliderIncrementButton homeExtentButton icon-home"></div>', node ,"after");
						on(homeButton,"click",function(){
							_map.setExtent(homeExtent);
						});
					});
				});
			});

			var wildernesses = new CSVLayer('resources/data/wildernesses.csv');
			_map.addLayer(wildernesses);

			on.once(_map,'layer-add',function(){
				getPointLayers(wildernesses);
			});

			on.once(_map,"update-end",function(){
				if(onLoad && !_mapReady){
					_mapReady = true;
					onLoad();
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

			on(popup,"selection-change",function(){
				var graphic = popup.getSelectedFeature();

				if (graphic){						
					onRemoveSelection();
					var item = {
						layerId: (graphic.getLayer() ? graphic.getLayer().id : _tempLayerId),
						objectId: (graphic.getLayer() ? graphic.attributes[graphic.getLayer().objectIdField] : _tempObjectId)
					};

					onSelect(item);
				}
			});
		};

		this.resizeMap = function()
		{
			_map.resize();
			_map.reposition();
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
					var mapPos = domGeom.position(dom.byId(mapSelector));
					var point = new ScreenPoint(domGeom.position(graphic.getNode()).x - mapPos.x, domGeom.position(graphic.getNode()).y - mapPos.y + _mapConfig.getMarkerPosition().height);
					openPopup(graphic,_map.toMap(point));
				}
				else{
					on.once(_map,"extent-change",function(){
						_map.infoWindow.hide();
						openPopup(graphic);
					});
					panMapToGraphic(graphic.geometry);
				}

				if (!has("ie")){
					graphic.getDojoShape().moveToFront();
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
						if (!has("ie")){
							graphic.getDojoShape().moveToFront();
						}

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

		function mapLoadEvent()
		{
			var homeExtent = _map.extent;
			array.forEach(query(".esriSimpleSliderIncrementButton"),function(node){
				var homeButton = domConstruct.place('<div class="esriSimpleSliderIncrementButton homeExtentButton icon-home"></div>', node ,"after");
				on(homeButton,"click",function(){
					_map.setExtent(homeExtent);
				});
			});
		}

		function getSidePanelWidth()
		{
			return domGeom.position(query(sidePaneSelector)[0]).w;
		}

		function getOffsetCenter(center)
		{
			if (!isMobile){
				var offsetX = getSidePanelWidth()/2 * _map.getResolution();
				center.x = center.x - offsetX;
			}

			return center;
		}

		function getPointLayers(layer)
		{
			var layerIds = [];
			var playlistLayers = [];

			playlistLayers.push(layer);
			layerIds.push(layer.id);
			var lyrProp = {
				layerId: layer.id,
				objectIdField: layer.objectIdField,
				supportsDefinitionExpression: false,
				defaultExpression: false
			};
			_playlistLayers.push(lyrProp);
			setRenderer(layer);
			addLayerEvents(layer);

			buildLegend(layerIds);
		}

		function checkExcluded(name)
		{
			var excluded = false;

			array.forEach(excludedLayers,function(lyr){
				if (name.toLowerCase().search(lyr.toLowerCase()) >= 0){
					excluded = true;
				}
			});

			if (excluded){
				return false;
			}
			else{
				return true;
			}
		}

		function setRenderer(lyr)
		{
			var layerObj = lyr;

			if(!lyr.setRenderer){
				layerObj = lyr.layerObject;
			}

			// Get Color Attribute
			var colorAttr;
			if (dataFields.colorField){
				colorAttr = dataFields.colorField;
			}
			else if (lyr.graphics[0] && lyr.graphics[0].attributes.Color){
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
			if (dataFields.orderField){
				orderAttr = dataFields.orderField;
			}
			else if (lyr.graphics[0] && lyr.graphics[0].attributes.Order){
				orderAttr = "Order";
			}
			else if (lyr.graphics[0] && lyr.graphics[0].attributes.order){
				orderAttr = "order";
			}
			else if (lyr.graphics[0] && lyr.graphics[0].attributes.ORDER){
				orderAttr = "ORDER";
			}
			if (lyr.graphics.length > 1 && orderAttr){
				lyr.graphics.sort(function(a,b){
					if (a.attributes[orderAttr] < b.attributes[orderAttr]){
						return -1;
					}
					if (a.attributes[orderAttr] > b.attributes[orderAttr]){
						return 1;
					}
					return 0;
				});
			}
			var renderer = _mapConfig.getRenderer(layerObj,lyr.graphics,colorAttr,orderAttr);
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
						filter: grp.attributes[dataFields.filterField]
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

			if (displayLegend){
				var playlistStr = '<p class="esriLegendServiceLabel">' + playlistLegendConfig.layerTitle + '</p><table class="esriLayerLegend"><tbody>';

				for (var obj in playlistLegendConfig.items){
					if (playlistLegendConfig.items[obj].visible){
						playlistStr = playlistStr + '<tr><td class="marker-cell"><img class="marker" src="' + playlistLegendConfig.items[obj].iconURL + '" alt="" /></td><td class="label-cell">' + playlistLegendConfig.items[obj].name + '</td></tr>';
					}
				}

				playlistStr = playlistStr + '</tbody></table>';

				domConstruct.place(playlistStr,dom.byId(playlistLegendSelector),"first");
			}
			else{
				domStyle.set(dom.byId(playlistLegendSelector),{
					display: "none"
				});
				if (legendLyrs < 1){
					onHideLegend();
				}
			}
		}

		function addLayerEvents(layer)
		{
			if(!has("touch")){
				
				on(layer,"mouse-over",function(event){
					var newSym = layer.renderer.getSymbol(event.graphic).setWidth(_mapConfig.getMarkerPositionHighlight().width).setHeight(_mapConfig.getMarkerPositionHighlight().height).setOffset(_mapConfig.getMarkerPositionHighlight().xOffset,_mapConfig.getMarkerPositionHighlight().yOffset);
					var item = {
						layerId: event.graphic.getLayer().id,
						objectId: event.graphic.attributes[event.graphic.getLayer().objectIdField]
					};
					var titleAttr = _titleFields[event.graphic.getLayer().id];
					_lastHightlighedGraphic = event.graphic;
					event.graphic.setSymbol(newSym);
					if (!has("ie")){
						event.graphic.getDojoShape().moveToFront();
					}
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

				if (isMobile){
					sidePaneWidth = 0;
				}

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

		function openPopup(graphic,newLocation)
		{
			var location = graphic.geometry;

			if (newLocation){
				location = newLocation;
			}

			_map.infoWindow.setFeatures([graphic]);
			_map.infoWindow.show(location);
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