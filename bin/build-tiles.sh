#! /usr/bin/env bash

set -e

LAND_FILE=data/ne_10m_land.zip
RIVER_FILE=data/ne_10m_rivers_lake_centerlines.zip

if [ -f "$LAND_FILE" ]; then
    echo "$LAND_FILE exists."
else
  curl -sL https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_land.zip > $LAND_FILE
  unzip $LAND_FILE -d data
fi

if [ -f "$RIVER_FILE" ]; then
    echo "$RIVER_FILE exists."
else
  curl -sL https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_rivers_lake_centerlines.zip > $RIVER_FILE
  unzip $RIVER_FILE -d data
fi

ogr2ogr -f GeoJSON data/ne_10m_land.geojson data/ne_10m_land.shp
ogr2ogr -f GeoJSON data/ne_10m_rivers_lake_centerlines.geojson data/ne_10m_rivers_lake_centerlines.shp

node bin/project.js data/ne_10m_land.geojson > data/ne_land.geojson
node bin/project.js data/ne_10m_rivers_lake_centerlines.geojson > data/ne_river.geojson

rm -rf public/tiles
rm -rf dist/tiles
tippecanoe --output-to-directory ./public/tiles -f -zg --drop-densest-as-needed --no-tile-compression data/ne_land.geojson data/ne_river.geojson
