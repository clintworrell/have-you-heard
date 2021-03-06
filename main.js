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

$("#search").keypress(function(event) {
  if(event.which === 13) {
    var artistName = $("#search-box").val();

    changeStylesAfterSearch();
    artistName ? getSeedArtistId(artistName) : console.log("Please enter a band name");
  }
});

$("#player-controls-next").click(function() {
  goToNextTrack();
});

$("#player-controls-previous").click(function() {
  goToPreviousTrack();
});

$("#player-controls-play-stop").click(function() {
  if(audio.paused === false) {
    stopPlayback();
  } else {
    startPlayback(currentTrack);
  }
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
  $("#search-again").keypress(function(event) {
    if(event.which === 13) {
      var artistName = $("#search-again").val();
      artistName ? getSeedArtistId(artistName) : console.log("Please enter a band name");
      searchAgain();
      $("#search-again").val('');
    }
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
  $("#mobile-search-again").keypress(function(event) {
    if(event.which === 13) {
      var artistName = $("#mobile-search-again").val();
      $("#mobile-search-again-container").removeClass("mobile-search-again-container-visible");
      $("#mobile-search-again-container").addClass("mobile-search-again-container-hidden");
      artistName ? getSeedArtistId(artistName) : console.log("Please enter a band name");
      searchAgain();
      $("#mobile-search-again").val('');
    }
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

    getArtistsTopTracks(artistsData);
  });
}

function getArtistsTopTracks(artistsData) {
  var playlistTracks = artistsData.map(getArtistTopTracks);
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
      trackDiv.data("artistName", track.artistName);
      trackDiv.data("trackName", track.trackName);
      trackDiv.data("trackPreviewUrl", track.previewUrl);
      trackDiv.data("artistImageUrl", artistImageUrl);
      trackDiv.click(function() {
        // audio will be undefined if never started
        if(audio === undefined || audio.paused) {
          startPlayback(trackDiv);
        } else if(audio.src === trackDiv.data("trackPreviewUrl")) {
          stopPlayback();
        }
        else {
          stopPlayback();
          startPlayback(trackDiv);
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
  audio = new Audio(track.data("trackPreviewUrl"));
  var audioPromise = audio.play();
  if(audioPromise === undefined) {
    trackStartedStyles(track);
  }
  else {
    audioPromise.then(function() {
      trackStartedStyles(track);
    }).catch(function(error) {
      console.log("User agent or platform doesn't support autoplay. Manually play additional tracks");
    });
  }
  audio.addEventListener("ended", function() {
    trackEndedStyles();
    if(autoplay) {
      var nextTrack = $(track).next(".track");
      startPlayback(nextTrack);
    }
  });
}

function goToNextTrack() {
  var nextTrack = $(currentTrack).next(".track");
  if(!nextTrack.data()) {
    nextTrack = $(".track").first();
  };

  if(audio.paused === false) {
    stopPlayback();
    startPlayback(nextTrack);
  } else {
    currentTrack = nextTrack;  // When 'play' clicked, currentTrack will be played
    $("#player-title").text(`${currentTrack.data("trackName")}`);
    $("#player-artist").text(`${currentTrack.data("artistName")}`);
    $("#player-img").css("background-image", `url(${currentTrack.data("artistImageUrl")})`);
  };
}

function goToPreviousTrack() {
  if(audio.paused === false) {
    stopPlayback();
    setTimeout(function() {
      startPlayback(currentTrack);
    }, 1000);

  } else {
    currentTrack = $(currentTrack).prev(".track");
    if(!currentTrack.data()) {
      currentTrack = $(".track").last();
    }
    $("#player-title").text(`${currentTrack.data("trackName")}`);
    $("#player-artist").text(`${currentTrack.data("artistName")}`);
    $("#player-img").css("background-image", `url(${currentTrack.data("artistImageUrl")})`);
  }
}

function trackStartedStyles(track) {
  $(track).addClass("track-playing");
  $(track).children("i").removeClass("fa-play-circle");
  $(track).children("i").addClass("fa-stop-circle");
  $("body").css("margin-bottom", "30px");
  $("#player").css("display", "flex");
  $("#player-title").text(`${track.data("trackName")}`);
  $("#player-artist").text(`${track.data("artistName")}`);
  $("#player-img").css("background-image", `url(${track.data("artistImageUrl")})`);
  $("#player-controls-play-stop").removeClass("fa-play");
  $("#player-controls-play-stop").addClass("fa-stop");
  $(".track").last().css("padding-bottom", "44px");
}

function trackEndedStyles() {
  var track = $(".track-playing");
  var trackControls = track.children("i");

  track.removeClass("track-playing");
  trackControls.removeClass("fa-stop-circle");
  trackControls.addClass("fa-play-circle");

  $("#player-controls-play-stop").removeClass("fa-stop");
  $("#player-controls-play-stop").addClass("fa-play");
}
