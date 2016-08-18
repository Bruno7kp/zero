$(document).ready(function(){
	chartinit();
});

function chartinit()
{
	loadimages();
	openChartRun();
	pop();
	updateUniqueWeek();
	switchToSimpleCR();
	editWeek();
	loadPlaycount();
}

function getChartMsg(msgid)
{
	// eng
	if (lang == 1) 
	{
		array = {};
		array.att = "Updated";
		array.fail = "Fail";
	}
	// pt
	else
	{
		array = {};
		array.att = "Atualizado";
		array.fail = "Falha";
	}

	return array[msgid];
}

function switchToSimpleCR()
{
	$(".switchto").click(function(event) {
		main = $(this).closest('div').find(".main");
		sub = $(this).closest('div').find(".sub");
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
	updateBtn = $(".upwk");
	updateBtn.click(function(event) {
		$(this).addClass('disabled');
		$(this).attr('disabled','disabled');
		from = $(this).attr('data-from');
		to = $(this).attr('data-to');
		updateWeek(from, to);
	});
	function updateWeek(from, to)
	{
		$.ajax({
			url: baseUrl + '/update/week/' + from + "/" + to,
			dataType: 'json'
		})
		.done(function(data) {
			console.log(data);
			if(data.error == 0)
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
			console.log("success");
		})
		.fail(function() {
			updateBtn.text(getChartMsg('fail'));
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
	}
}

function editWeek()
{
	editBtn = $(".editwk");
	editBtn.click(function(event) {
		id = $(this).attr('data-id');
		type = $(this).attr('data-type');

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
			console.log("success");
			console.log(data);
			$.magnificPopup.open({
				  items: {
				      src: $(data),
				      type: 'inline'
				  }
			});
			sortList();
		})
		.fail(function() {
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
	}

	function sortList()
	{
		list = $(".editablelist");
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
			list = $(".editablelist").find("li");
			finallist = {};
			finallist.week = $(this).attr('data-week');
			finallist.type = $(this).attr('data-type');
			i = 0;
			finallist.items = [];
			last = list.length;
			$.each(list, function(index, val) {
				eachdata = {
					name: $(this).attr('data-name'),
					mbid: $(this).attr('data-mbid'),
					rank: (i+1),
					playcount: $(this).attr('data-playcount'),
					artist: {name: $(this).attr('data-artist'), mbid: $(this).attr('data-artist-mbid')}
				};
				finallist.items[i] = eachdata;
				i++;
				if(i == last)
				{
					$.ajax({
						url: baseUrl + '/update/edited/week',
						type: 'POST',
						dataType: 'json',
						data: finallist,
					})
					.done(function(data) {
						if(data.error == 0)
						{
							location.reload();
						}
						console.log("success");
					})
					.fail(function() {
						alert("Ops, algo deu errado, tente novamente mais tarde.");
						console.log("error");
					})
					.always(function() {
						console.log("complete");
					});
					
				}
			});
			console.log(finallist);
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
		trCr = $(this).closest('tr').next();
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

function loadimages()
{
	tds = $(".getimage");
	$.each(tds, function(index, val) {
		type = $(this).attr('data-type');
		name = $(this).attr('data-name');
		name = name.replace(/\\/g, "");
		mbid = $(this).attr('data-mbid');
		artist = $(this).attr('data-artist');
		artist = artist.replace(/\\/g, "");
		rankid = $(this).attr('id');
		td = $(this);
		if(type == "artist")
		{
			//except = ["The Killers", "Ellie Goulding"];
			
			mbid = "";
			//artist = artist.replace("&", "%26");
			
			last = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key='+apiKey+'&artist='+artist+'&mbid='+mbid+'&format=json';
		}
		else if(type == "album")
		{
			//artist = artist.replace("&", "%26").replace("+", "%2B");
			last = 'http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key='+apiKey+'&artist='+artist+'&album='+name+'&mbid='+mbid+'&format=json';

		}
		else
		{
			//artist = artist.replace("&", "%26").replace("+", "%2B");;
			last = 'http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key='+apiKey+'&artist='+artist+'&track='+name+'&mbid='+mbid+'&format=json';
		}
		last = encodeURI(last);
		last = last.replace("+", "%2B");
		last = last.replace("#", "%23");
		last = last.replace("%20&", "%20%26");
		last = last.replace("&%20", "%26%20");
		//console.log(last);
		getF(last, td, artist);
		function getF(last, td, artistIn)
		{
			console.log(last);
			$.ajax({
				url: last,
				type: 'GET',
				async: false,
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
					if(typeof data.artist != "undefined")
					{
						img = data.artist.image[1]["#text"];
					}
					else
					{
						img = null;
					}
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

function loadPlaycount()
{
	tds = $(".loadplaycount");
	loadplugin = false;
	i = 1;
	$.each(tds, function(index, val) {
		type = $(this).attr('data-type');
		name = $(this).attr('data-name');
		user = $(this).attr('data-login');
		name = name.replace(/\\/g, "");
		mbid = $(this).attr('data-mbid');
		artist = $(this).attr('data-artist');
		artist = artist.replace(/\\/g, "");
		rankid = $(this).attr('id');
		cert = $(this).attr('data-cert');
		td = $(this);
		if(type == "artist")
		{
			//except = ["The Killers", "Ellie Goulding"];
			
			mbid = "";
			//artist = artist.replace("&", "%26");
			
			last = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key='+apiKey+'&username='+user+'&artist='+artist+'&mbid='+mbid+'&format=json';
		}
		else if(type == "album")
		{
			//artist = artist.replace("&", "%26").replace("+", "%2B");
			last = 'http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key='+apiKey+'&username='+user+'&artist='+artist+'&album='+name+'&mbid=&format=json';

		}
		else
		{
			//artist = artist.replace("&", "%26").replace("+", "%2B");;
			last = 'http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key='+apiKey+'&username='+user+'&artist='+artist+'&track='+name+'&mbid=&format=json';
		}
		last = encodeURI(last);
		last = last.replace("+", "%2B");
		last = last.replace("#", "%23");
		last = last.replace("%20&", "%20%26");
		last = last.replace("&%20", "%26%20");
		//console.log(last);
		getF(last, td, type, cert, user);
		function getF(last, td, type, cert, user)
		{
			console.log(last);
			$.ajax({
				url: last,
				type: 'GET',
				dataType: 'json'
			})
			.done(function(data) {
				console.log(i);
				if(typeof data.track != "undefined" && typeof data.track.userplaycount != "undefined")
				{
					if(typeof cert != "undefined")
					{
						getCert(user, type, data.track.userplaycount, td);
					}
					else
					{
						td.text(data.track.userplaycount);
					}
				}
				else if(typeof data.album.userplaycount != "undefined")
				{
					if(typeof cert != "undefined")
					{
						getCert(user, type, data.album.userplaycount, td);
					}
					else
					{
						td.text(data.album.userplaycount);
					}
				}
				else
				{
					td.text("-");
				}

				if(i == td.length)
				{
					setTimeout(function(){ 
					//$(".tablesorteralt").tablesorter({theme : "bootstrap", headerTemplate : '{content} {icon}',widgets : [ "uitheme"]});

					 }, 1000);

				}
				i++;
				console.log("success");
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
				console.log("complete");
			});
		}

		function getCert(user, type, plays, where)
		{
			$.ajax({
				url: baseUrl + '/ajax/cert/'+user+'/'+type+'/'+plays,
				dataType: 'html',
			})
			.done(function(data) {
				console.log("success");
				where.html(data);
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
	if(rankid.indexOf("newcert") >= 0)
	{
		$("#n"+rankid).attr('data-image', img);
	}
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

function offsetAnchor() {
    if(location.hash.length !== 0) {
        window.scrollTo(window.scrollX, window.scrollY - 100);
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