// Grab the articles as a json
$.getJSON("/articles", function (data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    let panel = $("<div class='panel panel-primary'>");
    let header = $("<div class='panel-heading'>");
    let body = $("<div class='panel-body'>");
    
    header.html(`<h3 data-id=${data[i]._id}><strong>${data[i].title}</strong><button class="btn btn-succes btn-notes"><strong>Article Notes</button></h3>`);

    body.html(`<h4> ${data[i].link}</h4>`);
    panel.append(header).append(body);

    $("#articles").append(panel);
  }
});

// Whenever someone clicks a p tag
$(document).on("click", "h3", function () {
  // Empty the notes from the note section
  $("#notes").empty();
  $("#saved_notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function (data) {
      console.log(data.note);
      console.log(data.note.length);


      // data.note.forEach(data.note.title);


      // The title of the article
      $("#notes").append("<h3 id='articletitle'><strong>" + data.title + "</strong></h3>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' placeholder='note title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body' placeholder=' note body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button class='btn btn-default' data-id='" + data._id + "' id='savenote'><strong>Save Note</strong></button> <br>");

      $("#saved_notes").append("<h3 id='savednotetitle'><strong>Your Saved Notes</strong></h3> <hr>");

      $("#saved_notes").append("<label id='titleinput' name='title'>" + data.note.title);
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function (data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
      $("#titleinput").html(data.note.title);
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});




// When user clicks the deleter button for a note
$(document).on("click", ".deleter", function () {
  // Save the p tag that encloses the button
  var selected = $(this).parent();
  // Make an AJAX GET request to delete the specific note
  // this uses the data-id of the p-tag, which is linked to the specific note
  $.ajax({
    type: "GET",
    url: "/delete/" + selected.attr("data-id"),

    // On successful call
    success: function (response) {
      // Remove the p-tag from the DOM
      selected.remove();
      // Clear the note and title inputs
      $("#titleinput").val("");
      $("#bodyinput").val("");
      // Make sure the #actionbutton is submit (in case it's update)
      $("#actionbutton").html("<button id='saved_notes'>Submit</button>");
    }
  });
});