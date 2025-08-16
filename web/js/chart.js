$(document).ready(function(){
	chartinit();
});

function chartinit()
{
	getSpotifyAccessToken().then(function(spotifyToken) {
		loadimages(spotifyToken);
		loadPlaycount(spotifyToken);
		loadSpotifyImages(spotifyToken);
	});
	openChartRun();
	pop();
	updateUniqueWeek();
	switchToSimpleCR();
	editWeek();

}

function getChartMsg(msgid)
{
	var array = {};
	if (lang === 1)
	{
		array.att = "Updated";
		array.fail = "Fail";
	}
	else
	{
		array.att = "Atualizado";
		array.fail = "Falha";
	}

	return array[msgid];
}

function switchToSimpleCR()
{
	$(".switchto").click(function(event) {
		var main = $(this).closest('div').find(".main");
		var sub = $(this).closest('div').find(".sub");
		if(main.hasClass('hidden'))
		{
			main.removeClass('hidden');
			sub.addClass('hidden');
		}
		else
		{
			main.addClass('hidden');
			sub.removeClass('hidden');
		}
	});
}

function updateUniqueWeek()
{
	var updateBtn = $(".upwk");
	updateBtn.click(function(event) {
		$(this).addClass('disabled');
		$(this).attr('disabled','disabled');
		var from = $(this).attr('data-from');
		var to = $(this).attr('data-to');
		updateWeek(from, to);
	});
	function updateWeek(from, to)
	{
		$.ajax({
			url: baseUrl + '/update/week/' + from + "/" + to,
			dataType: 'json'
		})
		.done(function(data) {
			if(data.error === 0)
			{
				updateBtn.text('Ok');
				setTimeout(function(){
				   window.location.reload(1);
				}, 2500);
			}
			else
			{
				updateBtn.text(getChartMsg('fail'));
			}
		})
		.fail(function() {
			updateBtn.text(getChartMsg('fail'));
			//console.log("error");
		})
		.always(function() {
			//console.log("complete");
		});
	}
}

function editWeek()
{
	var editBtn = $(".editwk");
	editBtn.click(function(event) {
		var id = $(this).attr('data-id');
		var type = $(this).attr('data-type');

		showModal(id, type);
	});

	function showModal(id, type)
	{
		$.ajax({
			url: baseUrl + '/editweek/'+id+'/'+type,
			type: 'POST',
			dataType: 'html',
		})
		.done(function(data) {
			$.magnificPopup.open({
				  items: {
				      src: $(data),
				      type: 'inline'
				  }
			});
			sortList();
		})
		.fail(function() {
			//console.log("error");
		})
		.always(function() {
			//console.log("complete");
		});
	}

	function sortList()
	{
		var list = $(".editablelist");
		$.each(list, function(index, val) {
			if($(this).find("li").length>1)
			{
				$(this).find("li").prepend("<i class='ti-arrows-vertical'></i> ")
				var ed = document.getElementById($(this).attr("id"));
				Sortable.create(ed);
			}
		});

		editWeek();
	}

	function editWeek()
	{
		$('#btn-wk-edit').on('click', function(event) {
			event.preventDefault();
			var list = $(".editablelist").find("li");
			var finallist = {};
			finallist.week = $(this).attr('data-week');
			finallist.type = $(this).attr('data-type');
			var i = 0;
			finallist.items = [];
			var last = list.length;
			$.each(list, function(index, val) {
				var eachdata = {
					name: $(this).attr('data-name'),
					mbid: $(this).attr('data-mbid'),
					rank: (i+1),
					playcount: $(this).attr('data-playcount'),
					artist: {name: $(this).attr('data-artist'), mbid: $(this).attr('data-artist-mbid')}
				};
				finallist.items[i] = eachdata;
				i++;
				if(i === last)
				{
					$.ajax({
						url: baseUrl + '/update/edited/week',
						type: 'POST',
						dataType: 'json',
						data: finallist
					})
					.done(function(data) {
						if(data.error === 0)
						{
							location.reload();
						}
						//console.log("success");
					})
					.fail(function() {
						alert("Ops, algo deu errado, tente novamente mais tarde.");
						//console.log("error");
					})
					.always(function() {
						//console.log("complete");
					});
					
				}
			});
		});
	}
}

function pop()
{
	$('[data-toggle="popover"]').popover({html: true}); 

	$('body').on('click', function (e) {
	    if ($(e.target).data('toggle') !== 'popover'
	        && $(e.target).parents('.popover.in').length === 0) { 
	        $('[data-toggle="popover"]').popover('hide');
	    }

	});
}

function openChartRun()
{
	$(".cr-icon").click(function(event) {
		var trCr = $(this).closest('tr').next();
		if(trCr.is(':visible'))
		{
			trCr.hide('400');
		}
		else
		{
			trCr.show('400');
		}
	});
}

function loadimages(token)
{
	var tds = $(".getimage");
	$.each(tds, function(index, val) {
		var type = $(this).attr('data-type');
		var name = $(this).attr('data-name');
		name = name.replace(/\\/g, "");
		var mbid = $(this).attr('data-mbid');
		var artist = $(this).attr('data-artist');
		artist = artist.replace(/\\/g, "");
		var rankid = $(this).attr('id');
		var td = $(this);
		var last = "";
		if(type === "album")
		{
			last = 'https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key='+apiKey+'&artist='+artist+'&album='+name+'&mbid='+mbid+'&format=json';
			last = encodeURI(last);
			last = last.replace("+", "%2B");
			last = last.replace("#", "%23");
			last = last.replace("%20&", "%20%26");
			last = last.replace("&%20", "%26%20");
			getF(last, td, artist);
			function getF(last, td, artistIn)
			{
				$.ajax({
					url: last,
					type: 'GET',
					dataType: 'json'
				})
					.done(function(data) {
						if(artistIn === true)
						{
							type = "artist";
						}
						if(type === "music")
						{

							var nartist = artistIn.replace("&", "%26").replace("+", "%2B");

							var newa = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key='+apiKey+'&artist='+nartist+'&mbid=&format=json';

							getF(newa, td, true);
						}
						else if(type === "album")
						{
							var img = data.album.image[1]["#text"];
							setImg(td.attr('id'), img);
						}
						else
						{
							if(typeof data.artist !== "undefined")
							{
								img = data.artist.image[1]["#text"];
							}
							else
							{
								img = null;
							}
							setImg(td.attr('id'), img);
						}

						//console.log("success");
					})
					.fail(function() {
						var img = null;
						setImg(td.attr('id'), img);
						//console.log("error");
					})
					.always(function() {
						//console.log("complete");
					});
			}
		}
		else
		{
			loadSpotifyImage(artist, token).then(function(imageUrl) {
				setImg(td.attr('id'), imageUrl);
			});
		}
	});
}

function loadPlaycount(token)
{
	var tds = $(".loadplaycount");
	var loadplugin = false;
	var i = 1;
	$.each(tds, function(index, val) {
		var type = $(this).attr('data-type');
		var name = $(this).attr('data-name');
		var user = $(this).attr('data-login');
		name = name.replace(/\\/g, "");
        name = encodeURI(name);
        name = name.replace("+", "%2B");
        name = name.replace("#", "%23");
        name = name.replace("&", "%26");
		var mbid = $(this).attr('data-mbid');
		var artist = $(this).attr('data-artist');
		artist = artist.replace(/\\/g, "");
        artist = encodeURI(artist);
        artist = artist.replace("+", "%2B");
        artist = artist.replace("#", "%23");
        artist = artist.replace("&", "%26");
		var rankid = $(this).attr('id');
		var td = $(this);
		var last = "";
		if(type === "artist")
		{
			mbid = "";
			last = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key='+apiKey+'&username='+user+'&artist='+artist+'&mbid='+mbid+'&format=json';
		}
		else if(type === "album")
		{
			last = 'https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key='+apiKey+'&username='+user+'&artist='+artist+'&album='+name+'&mbid=&format=json';
		}
		else
		{
			last = 'https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key='+apiKey+'&username='+user+'&artist='+artist+'&track='+name+'&mbid=&format=json&autocorrect=0';
		}

		//console.log(last);
		getF(last, td, type, user);
		function getF(last, td, type, user)
		{
			$.ajax({
				url: last,
				type: 'GET',
				dataType: 'json'
			})
			.done(function(data) {
				if(typeof data.track !== "undefined" || typeof data.album !== "undefined" || typeof data.artist !== "undefined")
				{
				    var plays = 0;
				    var image = $("[data-i=\"" + td.attr('id') + "\"]");;
					var genPlaque = $("[data-gen=\"" + td.attr('id') + "\"]");;
				    if(typeof data.track !== "undefined"){
                        plays = parseInt(data.track.userplaycount);
                        if(image.length > 0 || genPlaque.length > 0){
                            loadArtImg(data.track.artist.name, "", $(image).find("img"), genPlaque, token);
                            /**if(typeof data.track.album !== "undefined" && data.track.album.image[3]["#text"] !== ""){
                                $(image).find("img").attr("src", data.track.album.image[3]["#text"]);
                                $(genPlaque).attr("data-image", data.track.album.image[3]["#text"]);
                            }else{
                                loadArtImg(data.track.artist.name, "", $(image).find("img"), genPlaque);
                            }**/
                        }
                    }else if(typeof data.album !== "undefined"){
                        plays = parseInt(data.album.userplaycount);
                        if(image.length > 0 || genPlaque.length > 0) {
                            //console.log(data.album.image);
                            if(typeof data.album.image !== "undefined" && data.album.image[3]["#text"] !== ""){
                                $(image).find("img").attr("src", data.album.image[3]["#text"]);
                                $(genPlaque).attr("data-image", data.album.image[3]["#text"]);
                            }
                        }
                    }else if(typeof data.artist !== "undefined"){
                        plays = parseInt(data.artist.userplaycount);
                        if(image.length > 0) {
							loadArtImg(data.artist.name, "", $(image).find("img"), $(image).find("img"), token);
                        }
					}
                    td.text(plays);
                    var pp = $("[data-pp=\"" + td.attr('id') + "\"]");
                    if(pp.length > 0)
                    {
                        var points = parseInt($(pp).attr('data-p'));
                        var wPlays = parseFloat($(pp).attr('data-w-pl'));
                        if(wPlays > 0){
                            plays = plays * wPlays;
                        }
                        var wPoints = parseFloat($(pp).attr('data-w-pt'));
                        if(wPoints > 0){
                            points = points * wPoints;
                        }
                        pp.text(plays + points);
                    }
                    var cert = $("[data-c=\"" + td.attr('id') + "\"]");
					if(cert.length > 0)
					{
					    var curr = parseInt($(cert).attr('data-p'));
					    var rowClass = $("[data-class=\"" + td.attr('id') + "\"]");

                        wPoints = parseFloat($(pp).attr('data-w-pt'));
                        if(wPoints > 0){
                            curr = curr * wPoints;
                        }
                        console.log(plays, curr);
						getCert(user, type, plays + curr, cert, rowClass);
					}
					var gen = $("[data-gen=\"" + td.attr('id') + "\"]");
					if(gen.length > 0)
                    {
                        $(gen).attr("data-points", plays + curr);
                    }
				}
				else
				{
					td.text("-");
				}

				if(i === td.length)
				{
					setTimeout(function(){ 
					//$(".tablesorteralt").tablesorter({theme : "bootstrap", headerTemplate : '{content} {icon}',widgets : [ "uitheme"]});
					 }, 1000);
				}
				i++;
				$(".tablesorter").trigger("update");
				//console.log("success");
			})
			.fail(function() {
				//console.log("error");
			})
			.always(function() {
				//console.log("complete");
			});
		}

		function getCert(user, type, plays, whereCert, whereClass)
		{
			$.ajax({
				url: baseUrl + '/ajax/cert/'+user+'/'+type+'/'+plays,
				dataType: 'json'
			})
			.done(function(data) {
                whereCert.html(data["text+icon"]);
                if(whereClass && whereClass.length > 0){
                    if((data["cert"].g + data["cert"].p + data["cert"].d) > 0){
                        var currentPlaque = $(whereClass).attr("data-plaque");
                        try{
                            currentPlaque = JSON.parse(currentPlaque);
                        }catch(e){
                            currentPlaque = 0;
                        }
                        if(currentPlaque === 0 || currentPlaque.g !== data["cert"].g || currentPlaque.p !== data["cert"].p || currentPlaque.d !== data["cert"].d){
                            $(whereClass).removeClass('hide');
                            $(whereClass).addClass(data['class']);
                            $(whereClass).find('[data-text]').attr('data-text', data['text']);
                            $(whereClass).find('[data-value]').attr('data-value', data['value'] + "+ " + data['type']);
                            $(whereClass).find('[data-disc]').attr('data-disc', data['disc']);
                            $("[data-cert-header]").removeClass('hide');
                        }
                    }
                }
			})
			.fail(function() {
				//console.log("error");
			})
			.always(function() {
				//console.log("complete");
			});
			
		}
		
	});
}

function setImg(rankid, img)
{
	//console.log(img.length);
	if(typeof img === 'undefined' || img == null || img.length < 2)
	{
		img = baseUrl + '/web/img/default-alb.png';
	}
	$("#"+rankid).html("<img width='64' src='"+img+"'/>");
	if(rankid.indexOf("newcert") >= 0)
	{
		img = img.replace("/64s/", "/174s/");
		$("#n"+rankid).attr('data-image', img);
	}
}

function loadArtImg(name, mbid, seton, altseton, token)
{
	loadSpotifyImage(name, token).then(function(imageUrl) {
		$(seton).attr("src", imageUrl);
		$(altseton).attr("data-image", imageUrl);
	});
	
}

function getSpotifyAccessToken() {
	return fetch('/spotify/token', {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
		},
		credentials: 'same-origin'
	}).then((response) => {
		if (response.status === 200) {
			return response.json().then((data) => {
				return data.access_token;
			});
		}
		return false;
	});
}

function cacheArtist(artistName, spotifyId, imageUrl) {
	let date = new Date();
	date.setMonth(date.getMonth() + 1);
	let key = 'zero:' + artistName;
	let value = {
		name: artistName,
		spotifyId: spotifyId,
		imageUrl: imageUrl,
		time: date.getTime()
	};
	window.localStorage.setItem(key, JSON.stringify(value));
}

function getCachedImage(artistName) {
	let date = new Date();
	let key = 'zero:' + artistName;
	let cached = window.localStorage.getItem(key);
	if (cached && cached.length > 0) {
		let data = JSON.parse(cached);
		let expiration = new Date(data.time);
		if (date < expiration) {
			return data.imageUrl;
		}
	}
	return false;
}

function loadSpotifyImage(artistName, token) {
	let spotifyApi = new SpotifyWebApi();
	spotifyApi.setAccessToken(token);
	let cached = getCachedImage(artistName);
	if (cached) {
		return new Promise(function(resolve, reject) {
			resolve(cached);
		});
	} else {
		return spotifyApi.searchArtists(artistName, {limit: 1, offset: 0}).then((response) => {
			if (typeof response.artists !== 'undefined') {
				let artists = response.artists;
				if (typeof response.artists.items !== 'undefined' && response.artists.items.length > 0) {
					let artist = artists.items[0];
					let imageUrl = baseUrl + '/web/img/default-art.png';
					if (artist.images.length > 0) {
						imageUrl = artist.images[0].url;
					}
					let artistId = artist.uri.replace("spotify:artist:", "");
					cacheArtist(artistName, artistId, imageUrl);
					return imageUrl;
				}
			}
		});
	}
}

function loadSpotifyImages(token) {
	let els = document.querySelectorAll('[data-spotify-artist]');
	for (let i = 0; i < els.length; i++) {
		let item = els[i];
		let artistName = item.getAttribute('data-spotify-artist');
		loadSpotifyImage(artistName, token).then((imageUrl) => {
			item.src = imageUrl;
		});
	}
	let bgs = document.querySelectorAll('[data-spotify-artist-bg]');
	for (let i = 0; i < bgs.length; i++) {
		let item = bgs[i];
		let artistName = item.getAttribute('data-spotify-artist-bg');
		loadSpotifyImage(artistName, token).then((imageUrl) => {
			item.style.background = "url(" + imageUrl + ") center";
		});
	}
}

function offsetAnchor() {
	if(curRoute === "about"){
	    if(location.hash.length !== 0) {
	        window.scrollTo(window.scrollX, window.scrollY - 100);
	    }
	}
}

// This will capture hash changes while on the page
$(window).on("hashchange", function () {
    offsetAnchor();
});

// This is here so that when you enter the page with a hash,
// it can provide the offset in that case too. Having a timeout
// seems necessary to allow the browser to jump to the anchor first.
window.setTimeout(function() {
    offsetAnchor();
}, 1);