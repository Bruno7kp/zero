$(document).ready(function(){
	chartinit();
});

function chartinit()
{
	loadimages();
}

function loadimages()
{
	tds = $(".getimage");
	$.each(tds, function(index, val) {
		type = $(this).attr('data-type');
		name = $(this).attr('data-name');
		mbid = $(this).attr('data-mbid');
		artist = $(this).attr('data-artist');
		rankid = $(this).attr('id');
		td = $(this);
		if(type == "artist")
		{
			//except = ["The Killers", "Ellie Goulding"];
			
			mbid = "";
			artist = artist.replace("&", "%26").replace("+", "%2B");
			
			last = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key='+apiKey+'&artist='+artist+'&mbid='+mbid+'&format=json';
		}
		else if(type == "album")
		{
			artist = artist.replace("&", "%26").replace("+", "%2B");
			last = 'http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key='+apiKey+'&artist='+artist+'&album='+name+'&mbid='+mbid+'&format=json';

		}
		else
		{
			artist = artist.replace("&", "%26").replace("+", "%2B");;
			last = 'http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key='+apiKey+'&artist='+artist+'&track='+name+'&mbid='+mbid+'&format=json';
		}
		last = encodeURI(last);
		//console.log(last);
		getF(last, td, artist);
		function getF(last, td, artistIn)
		{
			console.log(last);
			$.ajax({
				url: last,
				type: 'GET',
				dataType: 'json'
			})
			.done(function(data) {
				if(artistIn == true)
				{
					type = "artist";
				}
				if(type == "music")
				{

					nartist = artistIn.replace("&", "%26").replace("+", "%2B");
		
					newa = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key='+apiKey+'&artist='+nartist+'&mbid=&format=json';
					
					getF(newa, td, true);
				}
				else if(type == "album")
				{
					img = data.album.image[1]["#text"];
					setImg(td.attr('id'), img);
				}
				else
				{
					img = data.artist.image[1]["#text"];
					setImg(td.attr('id'), img);
				}
				
				console.log("success");
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
				console.log("complete");
			});
		}
		 
	});
}

function setImg(rankid, img)
{
	//console.log(img.length);
	if(typeof img == 'undefined' || img == null || img.length < 2)
	{
		img = baseUrl + '/web/img/default-alb.png';
	}
	$("#"+rankid).html("<img width='64' src='"+img+"'/>");
}

function loadArtImg(name, mbid, seton)
{
	last = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key='+apiKey+'&artist='+name+'&mbid='+mbid+'&format=json';
	last = encodeURI(last);
	$.ajax({
		url: last,
		type: 'GET',
		dataType: 'json',
	})
	.done(function(data) {
		img = baseUrl + '/web/img/default-alb.png';
		if(typeof data.artist != 'undefined')
		{
			img = data.artist.image[1]["#text"];
		}
		setImg(seton, img);
		console.log("success");
	})
	.fail(function() {
		console.log("error");
	})
	.always(function() {
		console.log("complete");
	});
	
}