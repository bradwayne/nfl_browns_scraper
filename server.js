var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 2000;

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/clevelandBrownsDB";

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
  extended: true
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB

// mongoose.Promise = Promise;
// mongoose.connect(MONGODB_URI, {
//   useMongoClient: true
// });

mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/clevelandBrownsDB", {
  useMongoClient: true
});

// Routes

// A GET route for scraping the echojs website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.espn.com/nfl/team/_/name/cle/cleveland-browns").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("a.realStory").each(function (i, element) {
      // Save an empty result object
      let result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).text();
      result.subtitle = $(this).parent().parent().find("p");
      result.link = $(this).attr("href");
      result.createdAt = Date.now()

      db.Article.find({
        title : result.title
      }).exec(function(err,docs) {
        if(docs.length){
          console.log("do nothing")
        }else{
          db.Article.create(result, function(err, data){
            if(err){
              console.log(err);
            }else{
              console.log("article inserted")
              console.log(data);
            }
          })
        }
      })
      
    });

    setTimeout(() => {
      res.redirect("/");
    }, 1000);
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({}).sort({createdAt : -1})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({
      _id: req.params.id
    })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      console.log("note saved");
      db.Article.findOneAndUpdate({
          _id: req.params.id
        }, {
          $push: {
            note: dbNote._id
          }
        }, {
          new: true,
          upsert: true
        })
        .populate('note')
        .exec(function (err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log(data);
            res.json(data);
          };
        })
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});