const API_BASE_URL = 'https://api.spotify.com';
const API_VERSION = 'v1';
var audio;
var autoplay = true;  // Default to autoplay on
var currentTrack;

$("#search-button").click(function() {
  var artistName = $("#search-box").val();

  changeStylesAfterSearch();
  artistName ? getSeedArtistId(artistName) : console.log("Please enter a band name");
});

$("#player-controls-next").click(function() {
  goToNextTrack();
});

function changeStylesAfterSearch() {
  $("#heading").addClass("heading-after-search");
  $("#title").addClass("title-after-search");
  $("#heading").append($("<div id='search-again-container' class='search-again-container'></div>"));
  $("#search-again-container").append($("<input id='search-again' class='search-again' placeholder='Search again...' type='text'>"));
  $("#search-again-container").append($("<button id='search-again-button' class='search-again-button' type='button'>Search</button>"));
  $("#search-again-button").click(function() {
    var artistName = $("#search-again").val();
    artistName ? getSeedArtistId(artistName) : console.log("Please enter a band name");
    searchAgain();
    $("#search-again").val('');
  });
  $("#search-again-container").append($("<i id='search-again-icon' class='search-again-icon fa fa-search'></i>"));
  $("#heading").after($("<div id='mobile-search-again-container' class='mobile-search-again-container-hidden'></div>"));
  $("#mobile-search-again-container").append($("<input id='mobile-search-again' class='mobile-search-again' placeholder='Search again...' type='text'>"));
  $("#mobile-search-again-container").append($("<button id='mobile-search-again-button' class='mobile-search-again-button' type='button'>Search</button>"));
  $("#search-again-icon").click(function() {
    $("#mobile-search-again-container").toggleClass("mobile-search-again-container-visible");
    $("#mobile-search-again").val('');
  });
  $("#mobile-search-again-button").click(function() {
    var artistName = $("#mobile-search-again").val();
    $("#mobile-search-again-container").removeClass("mobile-search-again-container-visible");
    $("#mobile-search-again-container").addClass("mobile-search-again-container-hidden");
    artistName ? getSeedArtistId(artistName) : console.log("Please enter a band name");
    searchAgain();
    $("#mobile-search-again").val('');
  });
  $("#subtitle").remove();
  $("#search").children().remove();
  $("#search").addClass("search-after-search");
  $("#tracks").addClass("tracks-after-search");
}

function searchAgain() {
  if(audio) { audio.pause(); }
  $("#player").css("display", "none");
  $("#tracks").children().remove();
  $('html,body').scrollTop(0);
}

function getSeedArtistId(artistName) {
  var artistId, artistName;
  var searchArtistUrl = `${API_BASE_URL}/${API_VERSION}/search?q=${artistName}&type=artist`;

  $.get(searchArtistUrl, function(data) {
    artistId = data.artists.items[0].id;
    artistName = data.artists.items[0].name;
    $("#search").text(`Showing bands similar to ${artistName}`);
    getRelatedArtists(artistId);
  });
}

function getRelatedArtists(artistId) {
  var relatedArtistsUrl = `${API_BASE_URL}/${API_VERSION}/artists/${artistId}/related-artists`;

  $.get(relatedArtistsUrl, function(data) {
    // console.log(data.artists);
    var relatedArtistsNames = data.artists.map(function(artist) {
      return artist.name;
    });

    var relatedArtistsIds = data.artists.map(function(artist) {
      return artist.id;
    });

    var artistsData = data.artists.map(function(artist) {
      var artistInfo = {};
      var maxImageWidth = 200;
      var maxImageHeight = 200;
      artistInfo.id = artist.id;
      artistInfo.imageUrl = (function() {
        for(var i = 0; i < artist.images.length; i++) {
          if(artist.images[i].width <= maxImageWidth && artist.images[i].height <= maxImageHeight) {
            return artist.images[i].url;
          }
        }
      }) ();
      return artistInfo;
    });

    // getArtistsTopTracks(relatedArtistsIds);  // works
    getArtistsTopTracks(artistsData);
  });
}

function getArtistsTopTracks(artistsData) {
  // console.log(artistsData);
  var playlistTracks = artistsData.map(getArtistTopTracks);  // works
}

function getArtistTopTracks(artistData) {
  var artistId = artistData.id;
  var artistImageUrl = artistData.imageUrl;
  var topTracksUrl = `${API_BASE_URL}/${API_VERSION}/artists/${artistId}/top-tracks?country=US`;

  $.get(topTracksUrl, function(data) {
    topTracks = data.tracks.map(function(track) {
      var trackInfo = {};
      trackInfo.artistName = track.artists[0].name;
      trackInfo.trackName = track.name;
      trackInfo.previewUrl = track.preview_url;
      return trackInfo;
    });

    var allTrackNames = topTracks.map(function(track) {
      var trackDiv = $(`<div class="track"><i class="fa fa-play-circle fa-2x"></i><div class="track-song-info"><div class="track-song-artist">${track.artistName}</div><div class="track-song-title">${track.trackName}</div></div></div>`);
      trackDiv[0].artistName = track.artistName;
      trackDiv[0].trackName = track.trackName;
      trackDiv[0].trackPreviewUrl = track.previewUrl;
      trackDiv[0].artistImageUrl = artistImageUrl;
      trackDiv.click(function() {
        // audio will be undefined if never started
        if(audio === undefined || audio.paused) {
          startPlayback(trackDiv[0]);
        } else if(audio.src === this.trackPreviewUrl) {
          stopPlayback();
        }
        else {
          stopPlayback();
          startPlayback(trackDiv[0]);
        }
      });
      $("#tracks").append(trackDiv);
    });
  });
}

function stopPlayback() {
  currentTrack = $(".track-playing");
  audio.pause();
  trackEndedStyles();
}

function startPlayback(track) {
  currentTrack = track;
  audio = new Audio(track.trackPreviewUrl);
  audio.play();
  audio.addEventListener("ended", function() {
    trackEndedStyles();
    if(autoplay) { autoplayNextTrack(track); }
  });
  trackStartedStyles(track);
}

function autoplayNextTrack(track) {
  var nextTrack = $(track).next(".track")[0];
  $(nextTrack).addClass("track-playing");
  $(nextTrack).children("i").removeClass("fa-play-circle");
  $(nextTrack).children("i").addClass("fa-stop-circle");

  $("#player-title").text(`${nextTrack.trackName}`);
  $("#player-artist").text(`${nextTrack.artistName}`);
  $("#player-img").css("background-image", `url(${nextTrack.artistImageUrl})`);

  startPlayback(nextTrack);
}

function goToNextTrack() {
  var nextTrack = $(currentTrack).next(".track")[0]
  if(!nextTrack) {
    nextTrack = $(".track").first()[0];
    $('html,body').scrollTop(0);
  };

  if(audio.paused === false) {
    stopPlayback();
    startPlayback(nextTrack);
  } else {
    currentTrack = nextTrack;  // When 'play' clicked, currentTrack will be played
    $("#player-title").text(`${currentTrack.trackName}`);
    $("#player-artist").text(`${currentTrack.artistName}`);
    $("#player-img").css("background-image", `url(${currentTrack.artistImageUrl})`);
  };
}

function trackStartedStyles(track) {
  $(track).addClass("track-playing");
  $(track).children("i").removeClass("fa-play-circle");
  $(track).children("i").addClass("fa-stop-circle");
  $("body").css("margin-bottom", "30px");
  $("#player").css("display", "flex");
  $("#player-title").text(`${track.trackName}`);
  $("#player-artist").text(`${track.artistName}`);
  $("#player-img").css("background-image", `url(${track.artistImageUrl})`);
}

function trackEndedStyles() {
  var track = $(".track-playing");
  var trackControls = track.children("i");

  track.removeClass("track-playing");
  trackControls.removeClass("fa-stop-circle");
  trackControls.addClass("fa-play-circle");
}
