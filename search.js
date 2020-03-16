const express = require("express");
var https = require("https");
var fs = require("fs");
var elasticsearch = require("elasticsearch");
var config = require("./config.json");

/** Elasticsearch Client */
var client = new elasticsearch.Client({
  hosts: [`${config.elasticHost}`]
});
var wordSpacing = config.wordSpacing;
const app = express();
client.cat
  .indices({ v: true })
  .then(console.log)
  .catch(err => console.error(`Error connecting to the es client: ${err}`));

// Search Endpoint.
app.get(`${config.searchEndPoint}`, (req, res) => {
  // calback API
  let searchBody = {
    size: parseInt(req.query.limit) || config.basicLimit,
    from: parseInt(req.query.offset) || config.basicOffset,
    query: {}
  };
  if (req.query.words && req.query.words.length) {
    searchBody.query = {
      ...searchBody.query,
      bool: {
        must: [
          {
            multi_match: {
              query: req.query.words,
              fields: ["fileName^2", "filePath", "fileContent^5"]
            }
          },
          {
            multi_match: {
              query: false,
              fields: ["expired"]
            }
          }
        ]
      }
    };
    searchBody = {
      ...searchBody,
      sort: [
        {
          _score: "desc"
        }
      ]
    };
  } else {
    searchBody.query = {
      ...searchBody.query,
      bool: {
        should: [
          {
            multi_match: {
              query: false,
              fields: ["expired"]
            }
          }
        ]
      }
    };
  }

  client.search(
    {
      index: "store",
      body: searchBody
    },
    (err, result) => {
      if (err) console.log(err);
      if (result) {
        res.send({
          count: result.hits.total.value,
          contents: result.hits.hits.map(elm => ({
            ...elm._source,
            id: elm._id,
            fileContent: req.query.words
              ? elm._source.fileContent.slice(
                  elm._source.fileContent
                    .toUpperCase()
                    .indexOf(req.query.words.toUpperCase()) -
                    wordSpacing <
                    0
                    ? 0
                    : elm._source.fileContent
                        .toUpperCase()
                        .indexOf(req.query.words.toUpperCase()) - wordSpacing,
                  elm._source.fileContent
                    .toUpperCase()
                    .indexOf(req.query.words.toUpperCase()) + wordSpacing
                )
              : ""
          }))
        });
      }
    }
  );
});

// Expiration Endpoint.
app.put(`${config.experationEndPoint}`, (req, res) => {
  client
    .update({
      index: "store",
      id: req.query.id,
      body: {
        doc: {
          expired: req.query.expired === "1"
        }
      }
    })
    .then(
      function(resp) {
        res.send({
          id: req.query.id,
          expired: req.query.expired === "1"
        });
      },
      function(err) {
        console.trace(err.message);
      }
    );
});

if (config.ssl) {
  // Run on https
  https
    .createServer(
      {
        key: fs.readFileSync(`${config.sslPath}key.pem`),
        cert: fs.readFileSync(`${config.sslPath}cert.pem`)
      },
      app
    )
    .listen(443);
} else {
  // Run on http
  app.listen(config.httpPort, function() {
    console.log(`Server is running on port ${config.httpPort}`);
  });
}
