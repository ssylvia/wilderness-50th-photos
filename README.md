Playlist
========

The playlist app is a storytelling template that organizes point data sets, usually from a CSV file embedded in a web map, into an organized interactive list. Your audience can explore the points from the map itself or they can click on a corresponding item in a list.

![App](https://raw.github.com/ssyliva/playlist/master/playlist-screenshot.png)

[View it live](http://ssylvia.github.io/playlist/deploy/) |
[User Download (source code not included)](https://github.com/Esri/map-tour-storytelling-template-js/raw/master/Storytelling-MapTour-2.1.1.zip) |
[Developer Download](https://github.com/Esri/map-tour-storytelling-template-js/archive/master.zip)

**Latest release is version 2.0**, if you want to be informed of new releases, we recommend you to watch this repository.

This help will guide you through the steps for publishing playlist apps like:
 * [Top 10 National Parks in New South Wales, Australia](http://downloads.esri.com/agol/pub/nsw10/index.html)
 * [World of Story Maps](http://storymaps.esri.com/stories/2013/storylocator/)

## Help Content
 * [How to deploy a playlist app](#How to deploy a playlist app)
 * [Data storage options](#data-storage-options)
 * [FAQ](#faq)
 * [Tips](#tips)
 * [What's new](#whats-new)
 * [Customize the look and feel](#customize-the-look-and-feel)
 * [Developer guide](#developer-guide)
 * [Feedback](#feedback)
 * [Issues](#issues)
 * [Contributing](#contributing)
 * [Licensing](#licensing)

## How to deploy a playlist app

To use the downloadable version, download the [User Download](https://github.com/Esri/map-tour-storytelling-template-js/raw/master/Storytelling-MapTour-2.1.1.zip); it contains the following files:

| File					| Contains												|
| --------------------- | ----------------------------------------------------- |
| app/					| Minified source code									|
| resources/			| Application resources (markers, icons, fonts)			|
| **samples/**			| Sample data to create your web map					|
| **index.html**		| Application html file (Contains app configuration)	|
| license.txt			| Application terms of use								|
| **Readme.pdf**		| Detailed intructions									|

The storytelling playlist app relies on a web map ID from [ArcGIS Online](http://www.arcgis.com/) to get the data.

### Set up Machine

1. Install Git, Ruby, Ruby Dev Kit, and Node


### Setup Project Folder

1. Open git shell/bash at project folder
2. Run `bundle install`
3. Run `npm install`


### Open Dev Server

1. Run `bundle exec middleman`
2. Open [http://localhost:4567/](http://localhost:4567/)


### Build Project

1. Run `bundle exec middleman build`