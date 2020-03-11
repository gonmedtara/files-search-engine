# Files-search-engine

## Install :

- install docker & docker-compose.
- run `npm install` into files-search & files-search.
- run `docker-compose up --build --remove-orphans -d` in the root folder.
- run `npm run start` into files-search & files-search.

## Configuration file

{
"elasticHost": "http://localhost:9200/",
"searchEndPoint": "/a_search",
"experationEndPoint": "/expiration",
"basicLimit": 50,
"basicOffset": 0,
"filesPath": "./files/",
"sslPath": "../ssl/"
}
