<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "Live Charts");
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("image" => $lfm_bg));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-xl text-center">
						<div class="col-xs-12">
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row bottomspace-md text-center">
						<div class="col-xs-12">
							<h3 class="h3"><?php echo Lang::get('prev_of');?></h3>
						</div>
					</div>
					<div class="row text-center">
						<div class="col-xs-12">
							<div class="btn-group" role="group">
								<a href="<?php echo Route::url('live_charts', array('type' => 'artist'));?>" class="no-margin btn btn-custom btn-info"><i class="ti-user"></i></a>
								<a href="<?php echo Route::url('live_charts', array('type' => 'album'));?>" class="no-margin btn btn-custom btn-info"><i class="icon-vynil except"></i></a>
								<a href="<?php echo Route::url('live_charts', array('type' => 'music'));?>" class="no-margin btn btn-custom btn-info"><i class="ti-music"></i></a>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-8 col-md-offset-2 topspace-md">
						<?php
						if(is_array($list) && count($list) > 0)
						{
						?>
							
							<?php 
							$mainurl = Url::getBaseUrl()."/user/".$user->login."/music/";
							foreach ($list as $item) 
							{
								switch ($type) {
									case 'album':
										$item["url"] = $mainurl.$item["artist"]["name"]."/".$item["name"];
										$item["artist"]["url"] = $mainurl.$item["artist"]["name"];
										$item["images"]["medium"] = ""; 
										echo Snippets::topAlbListRow($item['name'], $item['url'], $item['playcount'], $item['images']['medium'], $list[0]['playcount'], $item['artist']['name'], $item['artist']['url'], $user->login); 
										break;
									
									case 'music':
										$item["url"] = $mainurl.$item["artist"]["name"]."/_/".$item["name"];;
										$item["artist"]["url"] = $mainurl.$item["artist"]["name"];
										$item["images"]["medium"] = ""; 
										echo Snippets::topMusListRow($item['name'], $item['url'], $item['playcount'], $item['images']['medium'], $list[0]['playcount'], $item['artist']['name'], $item['artist']['url'], null, null, $user->login); 
										break;

									case 'artist':
										$item["url"] = $mainurl.$item["name"];
										$item["images"]["medium"] = ""; 
										echo Snippets::topActListRow($item['name'], $item['url'], $item['playcount'], $item['images']['medium'], $list[0]['playcount'], $user->login); 
										break;
								}
							}
							?>
								
						<?php
						}
						?>
						</div>
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>