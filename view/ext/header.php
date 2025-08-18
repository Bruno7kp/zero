<?php
use B7KP\Library\Url;
use B7KP\Library\Lang;
use B7KP\Core\App;

$bgstyle = "";
if(!isset($image))
{
	$bgstyle = "filter: blur(0px); -webkit-filter: blur(0px); -moz-filter: blur(0px);";
}
isset($image) && $image || $image = "https://i.imgur.com/y4ZHuCx.png";
isset($subimage) || $subimage = "";
isset($title) || $title = "<img src=https://i.imgur.com/imcNtzL.png height=100 />";
isset($subtitle) || $subtitle = Lang::get('wel_to');
isset($alttitle) || $alttitle = false;
?>
<aside id="fh5co-hero" >
	<div id="bg" style="background-image: url(<?php echo $image;?>); <?php echo $bgstyle;?>"></div>
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