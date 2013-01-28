var SONGKICK_API = "BqcAtDFIwWbUbjI9";
var SONGKICK_HOST = "http://api.songkick.com/api/3.0/";
var QUERY_STRING = "&apikey=" + SONGKICK_API + "&jsoncallback=?"

var ECHONEST_API = 'YTD2TUBLESXKMGCTY'
var ECHONEST_HOST = 'http://developer.echonest.com/api/v4/'

videos = [];

function onPlayerStateChange(event) {
  if(event.data == 0) {
    $('.skip').click()
  }
}

$(document).ready(function(){
  $("form#query").submit(function(event){
    event.preventDefault();
    constructApiCall();
  });

  var tag = document.createElement('script');
  tag.src = "http://www.youtube.com/player_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  var player;

  $('#results div').ready(function(){
    var length = $('#results li').length
    if(length > 0 && length < 2) {
      alert('hello');
    }
  });

  function constructApiCall(){
    var location = $("input#location").val();
    var locationUrl = SONGKICK_HOST + 'search/locations.json?query=' + location + QUERY_STRING;
    ajaxRequest(locationUrl, locationResponse, 'Sending Data...');
  };

  function ajaxRequest(url, response, status) {
    status = status || "Loading...";
    $.ajax({
      url: url,
      async: false,
      crossDomain: true,
      beforeSend: function () {
        $('#status').html(status);
      },
      dataType: "jsonp",
      success: response
    });
  }

  locationResponse = function(data){
    var locationId = data.resultsPage.results.location[0].metroArea.id;
    var concertUrl = constructConcertUrl(locationId)
    ajaxRequest(concertUrl, concertResults, 'Gathering location data...');
  }

  function constructConcertUrl(id) {
    return SONGKICK_HOST + 'events.json?location=sk:' + id + QUERY_STRING;
  }

  concertResults = function(data){
    var shitTonOfInfo = data.resultsPage.results.event;
    var ids = [];
    $.each(shitTonOfInfo, function() {
      ids.push(this.id);
    })

    $.each(ids, function() {
      var concertDetailUrl = constructConcertDetailsUrl(this);
      ajaxRequest(concertDetailUrl, concertDetailsResponse, 'Finding Concert Details...');
    });
  }

  function constructConcertDetailsUrl(id) {
    return SONGKICK_HOST + 'events/' + id + '.json?' + QUERY_STRING;
  }

  concertDetailsResponse = function(data) {
    $.each(data.resultsPage.results, function() {
      var object = {
        artist: this.performance[0].artist.displayName,
        venue: this.venue.displayName,
        date: this.start.date,
        time: this.start.time,
        tickets: this.uri
      }
      var url = 'https://gdata.youtube.com/feeds/api/videos?q=' + object.artist + '&start-index=1&max-results=1&v=2&alt=json-in-script&format=5&origin=http://v1.goddamnyouryan.com';

      ajaxRequest(url, function(data) { getYouTubeVideos(object, data); }, 'Loading in YouTube Videos...');
      //var url = constructEchoNestUrl(this.displayName)
      //ajaxRequest(url, sortArtistGenres, 'Sorting Artist Genres...');
    });
    removeStatus();
  }

  function constructEchoNestUrl(name) {
    return ECHONEST_HOST + 'artist/search?' + 'api_key=' + ECHONEST_API + '&name=' + name + '&bucket=genre&format=jsonp'
  }

  function removeStatus() {
    $('#status').html('');
  }

  function getYouTubeVideos(hash, data) {
    var video = data.feed.entry[0].id.$t.split(':').slice(-1)[0]
    var div = '<div data-youtube-id="' + video + '">' +
              '<h2>' + hash.artist + '</h2>' +
              '<h2>' + hash.venue + '</h2>' +
              '<h2>' + hash.date + ' at ' + hash.time + '</h2>' +
              '<a class="buy" href="' + hash.tickets +'" target="_blank">Buy Tickets</a>' +
              '<a class="skip" href="#">Skip!</a>'
    $('#results').append(div)
    if($('#results div').length > 0) {
      if($('#results div').length < 2) {
        current = $('#results div').first()
        current.show()
        $('form').hide()
        var firstId = current.data('youtube-id');
        loadVideo(firstId);
      }
    }
  }


  function loadVideo(id) {
    var iframe = '<iframe width="560" id="youtube" height="315" src="http://www.youtube.com/embed/' + id +
                 '?autoplay=1&controls=0&showinfo=0&enablejsapi=1&origin=http://v1.goddamnyouryan.com" frameborder="0" allowfullscreen></iframe>'
    $('#video').html(iframe);

    player = new YT.Player('youtube', {
      events: {
        'onStateChange': onPlayerStateChange,
        'onReady': playVideo
      }
    });

    function playVideo() {
      player.playVideo()
    }

    $('.skip').click(function(event) {
      event.preventDefault();
      current.hide()
      current = current.next();
      current.show();
      loadVideo(current.data('youtube-id'));
    });
  }

  sortArtistGenres = function(data) {
    var userGenre = new RegExp($('input#genre').val().toLowerCase())
    var response = data.response.artists
    var artists = []
    if(response.length > 0 && response[0].genres.length > 0) {
      $.each(response[0].genres, function() {
        var genre = this.name
        if(userGenre.test(genre)) {
          artists.push(response[0].name)
        }
      });
    }

    var uniqueArtists = artists.getUnique()
    $.each(uniqueArtists, function() {
      $('#results').append('<li>' + this + '</li>');
    })
  }
});
