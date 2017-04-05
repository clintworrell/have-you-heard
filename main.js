const API_BASE_URL = 'https://api.spotify.com';
const API_VERSION = 'v1';
var audio;

$("#search-button").click(function() {
  var artistName = $("#search-box").val();

  changeStylesAfterSearch();
  artistName ? getSeedArtistId(artistName) : console.log("Please enter a band name");
});

function changeStylesAfterSearch() {
  $("#heading").addClass("heading-after-search");
  $("#title").addClass("title-after-search");
  $("#title").append($("<div id='search-icon' class='fa fa-search'></div>"));
  $("#subtitle").remove();
  $("#search").children().remove();
  $("#search").addClass("search-after-search");
  $("#tracks").addClass("tracks-after-search");
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
      // var artistImage = $(`<div class='artist-image' style='background-image:url(${artistImageUrl})'></div>`);
      // var playlistTrack = $(`<div class="track">${track.artistName} - ${track.trackName}</div>`);
      // var playlistTrack = $(`<i class="fa fa-play-circle fa-2x"></i> <div class="track">${track.artistName} - ${track.trackName}</div>`);
      // var playlistTrack = $(`<div class="track"><i class="fa fa-play-circle fa-2x"></i>${track.artistName} - ${track.trackName}</div>`);
      var playlistTrack = $(`<div class="track"><i class="fa fa-play-circle fa-2x"></i><div class="track-song-info"><div class="track-song-artist">${track.artistName}</div><div class="track-song-title">${track.trackName}</div></div></div>`);
      playlistTrack[0].artistName = track.artistName;
      playlistTrack[0].trackName = track.trackName;
      playlistTrack[0].trackPreviewUrl = track.previewUrl;
      playlistTrack[0].artistImageUrl = artistImageUrl;
      playlistTrack.click(function() {
        // $("#now-playing-img").css({
        //   "width": 200,
        //   "height": 200
        // });
        if(audio === undefined || audio.paused) {
          $(this).addClass("track-playing");
          $(this).children("i").removeClass("fa-play-circle");
          $(this).children("i").addClass("fa-stop-circle");
          // $(this).children("i").addClass("fa-circle-playing");
          $("body").css("margin-bottom", "30px");
          $("#player").css("display", "flex");
          // $("#player").css("float", "left");
          $("#player-title").text(`${track.trackName}`);
          $("#player-artist").text(`${track.artistName}`);
          $("#player-img").css("background-image", `url(${this.artistImageUrl})`);


          $("#now-playing-img").css("background-image", `url(${this.artistImageUrl})`);
          audio = new Audio(this.trackPreviewUrl);
          audio.play();
          audio.addEventListener("ended", function() {
            var stoppedTrack = $(".fa-stop-circle");
            stoppedTrack.removeClass("fa-stop-circle");
            stoppedTrack.addClass("fa-play-circle");
            // stoppedTrack.removeClass("fa-circle-playing");

            var finishedTrack = $(".track-playing");
            finishedTrack.removeClass("track-playing");
            autoplay(finishedTrack);
          })
        }
        else if(audio.src === this.trackPreviewUrl) {
          audio.pause();
          var stoppedTrack = $(".fa-stop-circle");
          stoppedTrack.removeClass("fa-stop-circle");
          stoppedTrack.addClass("fa-play-circle");
          // stoppedTrack.removeClass("fa-circle-playing");

          var finishedTrack = $(".track-playing");
          finishedTrack.removeClass("track-playing");
        }
        else {
          var trackPlaying = $(".track-playing");
          trackPlaying.removeClass("track-playing");
          trackPlaying.children("i").removeClass("fa-stop-circle");
          trackPlaying.children("i").addClass("fa-play-circle");
          // trackPlaying.removeClass("fa-circle-playing");

          audio.pause();
          audio = new Audio(this.trackPreviewUrl);
          audio.play();

          $(this).addClass("track-playing");
          $(this).children("i").removeClass("fa-play-circle");
          $(this).children("i").addClass("fa-stop-circle");
          // $(this).children("i").addClass("fa-circle-playing");
          $("body").css("margin-bottom", "30px");
          $("#player").css("display", "flex");
          // $("#player").css("float", "left");
          $("#player-title").text(`${track.trackName}`);
          $("#player-artist").text(`${track.artistName}`);
          $("#player-img").css("background-image", `url(${this.artistImageUrl})`);
          audio.addEventListener("ended", function() {
            var stoppedTrack = $(".fa-stop-circle");
            stoppedTrack.removeClass("fa-stop-circle");
            stoppedTrack.addClass("fa-play-circle");
            // stoppedTrack.removeClass("fa-circle-playing");

            var finishedTrack = $(".track-playing");
            finishedTrack.removeClass("track-playing");
            autoplay(finishedTrack);
          })
        }
      });
      // $("#tracks").append(artistImage);
      $("#tracks").append(playlistTrack);
    });
  });
}

function autoplay(finishedTrack) {
  var nextTrack = finishedTrack.next(".track")[0];
  $(nextTrack).addClass("track-playing");
  $(nextTrack).children("i").removeClass("fa-play-circle");
  $(nextTrack).children("i").addClass("fa-stop-circle");
  // $(nextTrack).children("i").addClass("fa-circle-playing");

  $("#player-title").text(`${nextTrack.trackName}`);
  $("#player-artist").text(`${nextTrack.artistName}`);
  $("#player-img").css("background-image", `url(${nextTrack.artistImageUrl})`);

  audio = new Audio(nextTrack.trackPreviewUrl);
  audio.play();
  audio.addEventListener("ended", function() {
    var stoppedTrack = $(".fa-stop-circle");
    stoppedTrack.removeClass("fa-stop-circle");
    stoppedTrack.addClass("fa-play-circle");
    stoppedTrack.removeClass("fa-circle-playing");

    var finishedTrack = $(".track-playing");
    finishedTrack.removeClass("track-playing");
    autoplay(finishedTrack);
  })
}
