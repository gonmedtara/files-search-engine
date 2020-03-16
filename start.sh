#!/bin/bash

cd /usr/src/files-search-engine
npm install

while ! curl http://elasticsearch:9200; do sleep 1; done;

npm run start