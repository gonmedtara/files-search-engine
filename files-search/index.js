const express = require("express");
var https = require("https");
var fs = require("fs");
var elasticsearch = require("elasticsearch");

/** Elasticsearch Client */
var client = new elasticsearch.Client({
  hosts: ["http://localhost:9200"]
});

const app = express();
client.cat
  .indices({ v: true })
  .then(console.log)
  .catch(err => console.error(`Error connecting to the es client: ${err}`));

// Search Endpoint.
app.get("/a_search", (req, res) => {
  // calback API
  let searchBody = {
    size: parseInt(req.query.limit) || 50,
    from: parseInt(req.query.offset) || 0,
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
              fields: ["fileName", "filePath", "fileContent"]
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
      if (result)
        res.send({
          count: result.hits.total.value,
          contents: result.hits.hits.map(elm => ({
            ...elm._source,
            id: elm._id
          }))
        });
    }
  );
});

// Expiration Endpoint.
app.put("/expiration", (req, res) => {
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

// Run on http
/*app.listen(80, function() {
  console.log(`Server is running on port 3000`);
});*/

// Run on https
https
  .createServer(
    {
      key: fs.readFileSync("ssl/key.pem"),
      cert: fs.readFileSync("ssl/cert.pem")
    },
    app
  )
  .listen(443);
