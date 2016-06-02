<?php
use B7KP\Library\Url;
use B7KP\Library\Route;
use B7KP\Core\App;
?>
<footer id="fh5co-footer">
	<div class="container">
		
		<ul class="fh5co-social-icons">
			<li><a target="_blank" href="https://twitter.com/Bruno7kp"><i class="fa fa-twitter"></i></a></li>
			<li><a target="_blank" href="https://www.facebook.com/bruno7kp"><i class="fa fa-facebook"></i></a></li>
			<li><a target="_blank" href="http://www.last.fm/user/Bruno7kp"><i class="fa fa-lastfm"></i></a></li>
			<li><a target="_blank" href="https://github.com/Bruno7kp/zero"><i class="fa fa-github"></i></a></li>
		</ul>
		<p class="text-muted fh5co-no-margin-bottom text-center"><small>&copy; 2016 <a href="#"><?php echo App::get("name");?></a> <?php echo App::get("version");?>.</p>

	</div>
</footer>
<!-- JS -->
<script>
	baseUrl = "<?php echo Url::getBaseUrl();?>";
	curPage = "<?php echo Url::getRequest();?>";
	curRoute = "<?php echo Route::getName(Url::getRequest());?>";
	apiKey = "<?php echo App::get('lastfmapikey');?>";
</script>
<script src="<?php echo Url::asset('js/jquery.min.js');?>"></script>
<script src="<?php echo Url::asset('js/bootstrap.min.js');?>"></script>
<script src="<?php echo Url::asset('js/owl.carousel.min.js');?>"></script>
<script src="<?php echo Url::asset('js/jquery.magnific-popup.min.js');?>"></script>
<script src="<?php echo Url::asset('js/easyResponsiveTabs.js');?>"></script>
<script src="<?php echo Url::asset('js/fastclick.js');?>"></script>
<script src="<?php echo Url::asset('js/hoverIntent.js');?>"></script>
<script src="<?php echo Url::asset('js/superfish.js');?>"></script>
<script src="<?php echo Url::asset('js/custom.js');?>"></script>
<script src="<?php echo Url::asset('js/main.js');?>"></script>
<script src="<?php echo Url::asset('js/script.js');?>"></script>
<script src="<?php echo Url::asset('js/chart.js');?>"></script>
<script src="<?php echo Url::asset('js/bootstrap-notify.min.js');?>"></script>
<!-- cdn -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.5.10/clipboard.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/tooltipster/3.3.0/js/jquery.tooltipster.min.js"></script>

<!-- /JS -->