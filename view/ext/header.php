<?php
use B7KP\Library\Url;
use B7KP\Library\Lang;
use B7KP\Core\App;

isset($image) || $image = Url::asset("img/hero2.jpg");
isset($subimage) || $subimage = "";
isset($title) || $title = App::get("name");
isset($subtitle) || $subtitle = Lang::get('wel_to');
isset($alttitle) || $alttitle = false;
?>
<aside id="fh5co-hero" >
	<div id="bg" style="background-image: url(<?php echo $image;?>);"></div>
	<div class="container">
		<div class="row">
			<div class="col-md-8 col-md-offset-2">
				<div class="fh5co-hero-wrap">
					<div class="fh5co-hero-intro">
						<?php 
						if($subtitle)
						{
						?>
						<h2><?php echo $subtitle;?><span></span></h2>
						<?php
						}
						?>
						<h1><?php echo $title;?></h1>
						<?php 
						if($alttitle)
						{
						 echo $alttitle;
						}
						?>
					</div>
				</div>
			</div>
		</div>
	</div>
</aside>