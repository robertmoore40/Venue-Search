// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyAqD-8vPER6P5gBzBGYaO6FKoOCyvcdq3E",
  authDomain: "bootcamp-project-1-d0094.firebaseapp.com",
  databaseURL: "https://bootcamp-project-1-d0094.firebaseio.com",
  projectId: "bootcamp-project-1-d0094",
  storageBucket: "bootcamp-project-1-d0094.appspot.com",
  messagingSenderId: "1061128339510",
  appId: "1:1061128339510:web:e27275aa9407ce877b1897",
  measurementId: "G-5G4EQWVG43"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var searchCounter = 0;
var database = firebase.database();
var searchRef = database.ref("/searches");
var resultsTallyArray = [];


function count(myArray) {
  var counts = {};
  var bandName = "";
  // * This creates counts objects w bandname, searchCounter
  myArray.forEach(function(x) {
    counts[x] = (counts[x] || 0) + 1;
  });

  // * Grabs property name of the object (bandNames)
  var countsProperties = Object.getOwnPropertyNames(counts).sort();
  countsProperties.sort();
  // * Grabs bandName to use to get thier count from counts
  for (var i = 0; i < countsProperties.length; i++) {
    bandName = countsProperties[i];
    console.log(bandName + ": " + counts[bandName]);
  }
  
  // ! In order to sort the data, I need to move it out of the object and into an array
  var sortable = [];
  for (var name in counts) {
    sortable.push([name, counts[name]]);
  }
  // * sort the array by search count, order by desc
  sortable.sort(function(a, b) {
    return (a[1] - b[1]) * -1;
  });

  // * loop through array and display top 5 searchs via call to displayTopSearches()
  for (var i=0; i < sortable.length; i ++) {
    tmpRec = sortable[i];
    console.log(tmpRec[0] + ": " + tmpRec[1]/3);  // * dividing by 3 since each search adds 3 songs to the DB
    displayTopSearches(tmpRec);

    if (i == 4) {
      break;
    }
  }
}

function searchStats() {
  // console.log("searchStats function called");
  // * grab a snapshot of the search results from DB
  return firebase
    .database()
    .ref("/searches")
    .once("value")
    .then(function(snapshot) {
      var tempObj = {}; // ? do I really need this
      var searchedArtistArray = [];

      // * Grabs snapshot of DB
      var searchStatsResults = snapshot.val();
      // * This grabs the db record IDs and puts into searchIds array
      var searchIds = Object.getOwnPropertyNames(searchStatsResults).sort();
      // * Loop through records..grabs Artist Name and put into searchedArtistArray
      for (var i = 0; i < searchIds.length; i++) {
        searchedArtistArray.push(
          searchStatsResults[searchIds[i]].itunesSearchResults.artistName
        );
      }
      searchedArtistArray.sort();
      // * send searchedArtistArray to count()
      count(searchedArtistArray);     
    });
}

function updateFireBaseItunesData(resultsObj) {
  // * writing the itunesSearchResults to the DB = we use this to track artist searched later
  database.ref("/searches").push({
    itunesSearchResults: resultsObj,
    dateAdded: firebase.database.ServerValue.TIMESTAMP
  });
}

function displayTopSearches(resultsObj) {
  // * Function to display the searched artist info
 
  var tBody = $(".topSearches");
  var tRow = $("<tr>");

  var topSearchNameDiv = $("<td>").text(resultsObj[0]);
  var topSearchCountDiv = $("<td>").text(resultsObj[1]/3);

  tRow.append(topSearchNameDiv,topSearchCountDiv);
  tBody.append(tRow);
}

function displayAlbumInfo(resultsObj) {
  // * Function to display some random artists song to preview

  var tBody = $(".iTunesPreview");
  var tRow = $("<tr>");

  var trackNameDiv = $("<td>").text(resultsObj.trackName);
  var artWorkDiv = $("<img>").text(resultsObj.artworkUrl30);
  var previewUrlDiv = $("<td>").text(resultsObj.previewUrl);

  previewUrlDiv.addClass("songpreview");

  previewUrlDiv.html(
    '<a href="' + resultsObj.previewUrl + '">Click to Preview Song!</a>'
  );
  $("a").attr("target", "blank");
  artWorkDiv.attr("src", resultsObj.artworkUrl100);
  tRow.append(artWorkDiv, trackNameDiv, previewUrlDiv);
  tBody.append(tRow);
}

function callItunesApi(search) {
  // * Calls iTunes API to obtain data for Songs to Preview section
  // * said data to be stored in the db
  var ituneSettings = {
    async: true,
    crossDomain: true,
    url: "https://itunes.apple.com/search?term=" + search + "&limit=3",
    method: "GET"
  };

  // * Ajax API call to itunes
  $.ajax(ituneSettings).done(function(response) {
    var itunesObj = {
      artistName: "",
      trackName: "",
      artistId: "",
      albumName: "",
      releaseDate: "",
      previewUrl: "",
      artworkUrl30: "",
      artworkUrl60: "",
      artworkUrl100: ""
    };

    var itunesObjArray = [];
    var responseObj = JSON.parse(response);

    resultCount = responseObj.resultCount;
    resultsArray = responseObj.results;

    // * loop through resultsArray and create itunesResultsArray
    // * using itunesObj
    for (var x = 0; x < resultCount; x++) {
      itunesObj.artistName = resultsArray[x].artistName;
      itunesObj.trackName = resultsArray[x].trackName;
      itunesObj.artistId = resultsArray[x].artistId;
      itunesObj.albumName = resultsArray[x].collectionName;
      itunesObj.releaseDate = resultsArray[x].releaseDate;
      itunesObj.previewUrl = resultsArray[x].previewUrl;
      itunesObj.artworkUrl30 = resultsArray[x].artworkUrl30;
      itunesObj.artworkUrl60 = resultsArray[x].artworkUrl60;
      itunesObj.artworkUrl100 = resultsArray[x].artworkUrl100;

      itunesObjArray.push(itunesObj);
      // console.log(itunesObj.trackName);
      updateFireBaseItunesData(itunesObj);
      displayAlbumInfo(itunesObj);
    }
  });
}

function printShowsToPage(shows) {
  if (!shows) {
    console.log("Array does not exist for shows - no upcoming shows");
    // print to screen no shows line
    $(".td").empty();
    var tBody = $(".td");
    var tRow = $("<tr>");
    var noShowsRow = $("<td>").text(
      "There are no upcoming shows for this artist"
    );
    tRow.append(noShowsRow);
    tBody.append(tRow);
  } else {
    // Got back expected show array

    console.log("print upcoming shows");
    $(".td").empty();
    for (var i = 0; i < shows.events.length; i++) {
      if (i >= 5) {
        return;
      }
      // console.log(shows.events[i]._embedded.venues[0].name);
      // console.log(shows.events[i]._embedded.venues[0].city.name);
      // console.log(shows.events[i]._embedded.venues[0].state.name);
      // console.log(shows.events[i].dates.start.localDate);
      var tBody = $(".td");
      var tRow = $("<tr>");
      var venueNameDiv = $("<td>").text(
        shows.events[i]._embedded.venues[0].name
      );
      var cityNameDiv = $("<td>").text(
        shows.events[i]._embedded.venues[0].city.name
      );
      var stateNameDiv = $("<td>").text(
        shows.events[i]._embedded.venues[0].state.name
      );
      var dateNameDiv = $("<td>").text(shows.events[i].dates.start.localDate);
      tRow.append(venueNameDiv, cityNameDiv, stateNameDiv, dateNameDiv);
      tBody.append(tRow);
    }
  }
}

function getSearchInfo() {
  console.log("getSearchInfo function called");
  event.preventDefault();
  $(".iTunesPreview").empty(); // * clears out Album Info display on new search
  $(".topSearches").empty();
  var artistInput = $("#textarea1")
    .val()
    .trim();

  console.log(artistInput);
  callItunesApi(artistInput);
  searchStats();
  
  var queryURL =
    "https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&keyword=" +
    artistInput +
    "&apikey=VNUkdWcssRsgC8X8Vg617XiGSpQQYPfV";

  $.ajax({
    type: "GET",
    url: queryURL,
    async: true,
    dataType: "json",
    success: function(json) {
      console.log(json);

      // Where we added changes
      // Checks is json._embedded is array or undefined
      if (json._embedded) {
        // array route
        console.log("has shows");
        // send array argument
        printShowsToPage(json._embedded);
      } else {
        // undefined route
        console.log("no shows");
        // sends false argument
        printShowsToPage(false);
      }
    }
  });
}


$(document).on("click", ".btn", getSearchInfo);
