define(["storymaps/playlist/config/MapConfig",
	"storymaps/playlist/core/Data",
	"storymaps/playlist/ui/PopupGallery",
	"esri/layers/CSVLayer",
	"esri/geometry/Extent",
	"esri/SpatialReference",
	"esri/map",
	"esri/arcgis/utils",
	"esri/dijit/Legend",
	"esri/dijit/Popup",
	"esri/dijit/PopupMobile",
	"esri/InfoTemplate",
	"esri/layers/ArcGISTiledMapServiceLayer",
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
	"dojo/_base/sniff"], 
	function(MapConfig,
		Data,
		PopupGallery,
		CSVLayer,
		Extent,
		SpatialReference,
		Map,
		arcgisUtils,
		Legend,
		Popup,
		PopupMobile,
		InfoTemplate,
		ArcGISTiledMapServiceLayer,
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
		Query){
	/**
	* Playlist Map
	* @class Playlist Map
	* 
	* Class to define a new map for the playlist template
	*/

	return function PlaylistMap(isMobile,geometryServiceURL,bingMapsKey,webmapId,excludedLayers,dataFields,displayLegend,playlistLegendConfig,mapSelector,playlistLegendSelector,legendSelector,sidePaneSelector,onLoad,onHideLegend,onListItemRefresh,onHighlight,onRemoveHighlight,onSelect,onRemoveSelection,onFilterTogglesReady)
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
		_clickedWilderness,
		_tempLayerId,
		_tempObjectId,
		_photoSelection,
		_popupGallery,
		_initExtent;

		this.init = function(){

			var popup;

			if (has("touch") && domGeom.position(query("body")[0]).w < 768){
				popup = new PopupMobile(null,domConstruct.create("div"));
			}
			else{
				popup = new Popup({
					highlight: false
				},domConstruct.create("div"));
			}

			_mapTip = domConstruct.place('<div class="map-tip"></div>',dom.byId(mapSelector),"first");

			_map = new Map(mapSelector,{
				basemap: 'topo',
				sliderPosition: "top-left",
				infoWindow: popup,
				extent: new Extent(-205,14,-37,71, new SpatialReference({ wkid:4326 })),
				maxZoom: 9,
				minZoom: 3,
				logo: false
			});

			on.once(_map,"load",function(){
				_map.centerAt(getOffsetCenter(_map.extent.getCenter()));
				_map.disableKeyboardNavigation();

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

			var wildernessesTiles = new ArcGISTiledMapServiceLayer('http://ec2-54-211-170-245.compute-1.amazonaws.com:6080/arcgis/rest/services/Wilderness/app_one_cache/MapServer');
			_map.addLayer(wildernessesTiles);

			on.once(wildernesses,'update-end',function(){
				getPointLayers(wildernesses);
				var infoTemplate = new InfoTemplate("",function(){
					return _popupGallery.setContent();
				});
				wildernesses.setInfoTemplate(infoTemplate);
				var locations = _map.getLayer(_playlistLayers[0].layerId).graphics;
				_popupGallery = new PopupGallery(_map,locations,onSelect,onRemoveSelection);
			});

			on(wildernesses,'click',function(event){
				_clickedWilderness = event.graphic.attributes.wilderness;
			});

			on.once(_map,"update-end",function(){
				_initExtent = _map.extent;
				if(onLoad && !_mapReady){
					_mapReady = true;
					onLoad();
				}
			});

			on(_map,"extent-change",function(){
				var center = _map.extent.getCenter();
				var reCenter;
				if (_initExtent && center.x < _initExtent.xmin){
					reCenter = true;
				}
				else if (_initExtent && center.x > _initExtent.xmax){
					reCenter = true;
				}
				else if (_initExtent && center.y > _initExtent.ymax){
					reCenter = true;
				}
				else if (_initExtent && center.y < _initExtent.ymin){
					reCenter = true;
				}
				else{
					reCenter = false;
				}
				if (reCenter){
					_map.setExtent(_initExtent);
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

			on(popup,'set-features',function(){
				if (popup.features.length > 1){
					array.forEach(popup.features,function(ftr){
						if (ftr.attributes.wilderness === _clickedWilderness){
							popup.setFeatures([ftr]);
						}
					});
				}
			});

			on(popup,"selection-change",function(){
				if (popup.getSelectedFeature() && popup.getSelectedFeature().visible){
					_popupGallery.initGallery(_photoSelection);
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
					openPopup(graphic,item.photoId,_map.toMap(point));
				}
				else{
					on.once(_map,"extent-change",function(){
						_map.infoWindow.hide();
						openPopup(graphic,item.photoId);
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
				var renderer = _mapConfig.getRenderer(layerObj,layerObj.graphics);
				layerObj.setRenderer(renderer);
				layerObj.redraw();
			});
		};

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
						playlistStr = playlistStr + '<tr class="filterRow" data-filter="' + playlistLegendConfig.items[obj].filter + '"><td class="marker-cell"><img class="marker" src="' + playlistLegendConfig.items[obj].iconURL + '" alt="" /></td><td class="checkboxes"><i class="icon-checked"></i><i class="icon-unchecked"></i></td><td class="label-cell">' + playlistLegendConfig.items[obj].name + '</td></tr>';
					}
				}

				playlistStr = playlistStr + '</tbody></table>';

				domConstruct.place(playlistStr,dom.byId(playlistLegendSelector),"first");

				onFilterTogglesReady();

				$('#filterAll, .filterRow').click(function(){
					_map.infoWindow.hide();
				});

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
				var offsetWidth = has('touch') ? 0 : ((_map.extent.getWidth()/5)*2);
				var offsetHeight = has('touch') ? 0 : ((_map.extent.getHeight()/5)*2);
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

		function openPopup(graphic,photoId,newLocation)
		{
			var location = graphic.geometry;

			if (newLocation){
				location = newLocation;
			}

			if (photoId){
				_photoSelection = photoId;
			}
			else{
				_photoSelection = null;
			}

			var scrPt = _map.toScreen(location);
			scrPt.x += 20;
			scrPt.y -= 15;

			_map.infoWindow.show(_map.toMap(scrPt));
			_map.infoWindow.setFeatures([graphic]);
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