var elasticsearch = require("elasticsearch");
const chokidar = require("chokidar");
var textract = require("textract");
var config = require("./config.json");
var fs = require("fs");

/** Elasticsearch Client */
var client = new elasticsearch.Client({
  hosts: [`${config.elasticHost}`]
});

/** Test Elasticsearch Client connection */
client.ping(
  {
    requestTimeout: 30000
  },
  function(error) {
    if (error) {
      console.error("Cannot connect to Elasticsearch.");
    } else {
      console.log("Connected to Elasticsearch was successful!");
      /** Create Elasticsearch index */
      client.indices.exists({ index: "store" }, (err, res, status) => {
        if (res) {
          console.log("index files already exists");
          createMapping();
        } else {
          client.indices.create({ index: "store" }, (err, res, status) => {
            console.log(err, res, status);
            createMapping();
          });
        }
      });
    }
  }
);

function createMapping() {
  /** Files watcher */
  chokidar
    .watch([`${config.filesPath}`])
    .on("add", async filepath => {
      let data = {
        fileName: filepath.split("\\")[filepath.split("\\").length - 1],
        filePath: filepath.replace(/\\/g, "/"),
        fileContent: ""
      };
      fs.stat(data.filePath, function(err, stats) {
        data.created_on = stats.ctime || new Date();
        textract.fromFileWithPath(data.filePath, async (error, text) => {
          let insertion = await insertDoc("store", data.filePath, "files", {
            ...data,
            expired: false,
            fileContent: error == null ? text : ""
          });
          console.log(insertion);
          console.log(
            `[${new Date().toLocaleString()}] ${filepath} has been added.`
          );
        });
      });
    })
    .on("unlink", filepath => {
      console.log(`${filepath} has been removed.`);
      client.delete(
        {
          index: "store",
          id: filepath.replace(/\\/g, "/")
        },
        (err, result) => {
          if (err) console.log(err);
          if (result) {
            console.log(result);
          }
        }
      );
    });
}
const insertDoc = async function(indexName, _id, mappingType, data) {
  return await client.index({
    index: indexName,
    type: mappingType,
    id: _id,
    body: data
  });
};
