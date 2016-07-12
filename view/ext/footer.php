<?php
use B7KP\Library\Url;
use B7KP\Library\Route;
use B7KP\Library\Lang;
use B7KP\Core\App;
?>
<footer id="fh5co-footer">
	<div class="container">
		
		<ul class="fh5co-social-icons">
			<li><a target="_blank" href="https://twitter.com/Bruno7kp"><i class="fa fa-twitter"></i></a></li>
			<li><a target="_blank" href="http://www.last.fm/user/Bruno7kp"><i class="fa fa-lastfm"></i></a></li>
			<li><a target="_blank" href="https://github.com/Bruno7kp/zero"><i class="fa fa-github"></i></a></li>
		</ul>
		<p class="text-muted fh5co-no-margin-bottom text-center"><small>&copy; 2016 <a href="#"><?php echo App::get("name");?></a> <?php echo App::get("version");?>.</small><span id="time"></span></p>

	</div>
</footer>
<!-- JS -->
<script>
	baseUrl = "<?php echo Url::getBaseUrl();?>";
	curPage = "<?php echo Url::getRequest();?>";
	curRoute = "<?php echo Route::getName(Url::getRequest());?>";
	curController = "<?php echo Route::getClass(Url::getRequest());?>";
	apiKey = "<?php echo App::get('lastfmapikey');?>";
	lang = <?php echo Lang::getUserLang();?>;
	langCode = "<?php echo Lang::getLangCode(Lang::getUserLang());?>";
</script>
<script src="<?php echo Url::asset('js/jquery.min.js');?>"></script>
<script src="<?php echo Url::asset('js/bootstrap.min.js');?>"></script>
<script src="<?php echo Url::asset('js/owl.carousel.min.js');?>"></script>
<script src="<?php echo Url::asset('js/jquery.magnific-popup.min.js');?>"></script>
<!-- <script src="<?php echo Url::asset('js/jquery.tablesorter.js');?>"></script> -->
<script src="<?php echo Url::asset('js/easyResponsiveTabs.js');?>"></script>
<script src="<?php echo Url::asset('js/fastclick.js');?>"></script>
<script src="<?php echo Url::asset('js/hoverIntent.js');?>"></script>
<script src="<?php echo Url::asset('js/superfish.js');?>"></script>
<script src="<?php echo Url::asset('js/bootstrap-notify.min.js');?>"></script>
<script src="<?php echo Url::asset('js/custom.js');?>"></script>
<script src="<?php echo Url::asset('js/main.js');?>"></script>
<script src="<?php echo Url::asset('js/script.js');?>"></script>
<script src="<?php echo Url::asset('js/chart.js');?>"></script>
<!-- cdn -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.26.2/js/jquery.tablesorter.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.5.10/clipboard.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/tooltipster/3.3.0/js/jquery.tooltipster.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.26.2/js/jquery.tablesorter.widgets.min.js"></script>

<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.26.2/js/widgets/widget-uitheme.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/Sortable/1.4.2/Sortable.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.14.1/moment.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.14.1/locale/pt-br.js"></script>
<script>
	moment.locale(langCode);
	local = moment();
	utc = moment().utc();
	nextUpdate = moment(moment().format("DD-MM-YYYY")).utc();
	nextUpdate.day(7);

	test = nextUpdate.format();
	$("#time").html(test);
</script>

<?php
if(App::get('environment') != "DEV")
{
?>
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-79543567-1', 'auto');
  ga('send', 'pageview');

</script>

<?php
}
?>
<!-- /JS -->