<?php
use B7KP\Library\Url;
use B7KP\Library\Route;
use B7KP\Core\App;
?>
<footer id="fh5co-footer">
	<div class="container">
		
		<ul class="fh5co-social-icons">
			<li><a href="https://twitter.com/Bruno7kp"><i class="fa fa-twitter"></i></a></li>
			<li><a href="https://www.facebook.com/bruno7kp"><i class="fa fa-facebook"></i></a></li>
			<li><a href="http://www.last.fm/user/Bruno7kp"><i class="fa fa-lastfm"></i></a></li>
			<li><a href="https://github.com/Bruno7kp/zero"><i class="fa fa-github"></i></a></li>
		</ul>
		<p class="text-muted fh5co-no-margin-bottom text-center"><small>&copy; 2016 <a href="#"><?php echo App::get("name");?></a> <?php echo App::get("version");?>. All rights reserved. Development <em>by</em> <a href="#" target="_blank"><?php echo App::get("author");?></a> <br> Thanks to <a href="http://freehtml5.co" target="_blank">Freehtml5.co</a>, <a href="#">Last.fm</a></small></p>

	</div>
</footer>
<!-- JS -->
<script>
	baseUrl = "<?php echo Url::getBaseUrl();?>";
	curPage = "<?php echo Url::getRequest();?>";
	curRoute = "<?php echo Route::getName(Url::getRequest());?>";
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
<script src="<?php echo Url::asset('js/bootstrap-notify.min.js');?>"></script>
<!-- /JS -->