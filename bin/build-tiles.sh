#! /usr/sh

curl -sL https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_land.zip > data/ne_10m_land.zip
unzip data/ne_10m_land.zip -d data
ogr2ogr -f GeoJSON data/ne_10m_land.geojson data/ne_10m_land.shp
tippecanoe --output-to-directory ./public/tiles -f -zg --drop-densest-as-needed --no-tile-compression data/ne_10m_land.geojson
