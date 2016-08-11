<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Utils\Functions;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get("search"));
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php");?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-md">
						<div class="col-xs-12">
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $this->user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row">
						<div class="col-xs-12 bottomspace-md">
						<?php 
						if($this->search)
						{
							echo "<div class\"row\">";
							foreach ($this->search as $key => $value) {
						?>
							<div class="col-md-4 col-sm-6 col-xs-12 bottomspace-lg">
								<div class="row">
									<div class="col-xs-3">
										<img src="<?php echo $value["image"];?>" class="img-responsive img-circle">
									</div>
									<div class="col-xs-9">
										<?php
											switch ($this->type) {
											 	case 'artist':
											 		$vars = array("name" => Functions::fixLFM($value["name"]), "login" => $this->guessUser());
													echo "<a href=".Route::url("lib_art", $vars).">".$value["name"]."</a>";
											 		break;

											 	case 'album':
													$vars = array("name" => Functions::fixLFM($value["name"]), "artist" => Functions::fixLFM($value["artist"]), "login" => $this->guessUser());
													echo "<a href=".Route::url("lib_alb", $vars).">".$value["name"]."</a>";
											 		break;
											 	
											 	default:
													$vars = array("name" => Functions::fixLFM($value["name"]), "artist" => Functions::fixLFM($value["artist"]), "login" => $this->guessUser());
													echo "<a href=".Route::url("lib_mus", $vars).">".$value["name"]."</a>";
											 		break;
											 } 
										?>
										<br>
										<?php 
										if($value["logged_lib"])
										{
										?>
										<span class="tipup" title="<?php echo Lang::get('in_your_lib');?>"><i class="text-main flaticon-badge-2"></i></span>
										<?php
										}
										if($value["this_lib"])
										{
										?>
										<span class="tipup" title="<?php echo Lang::get('in_this_lib');?>"><i class="text-sec flaticon-badge-2"></i></span>
										<?php
										}
										?>
									</div>
								</div>
							</div>
						<?php
							}
							echo "</div>";
						}
						else
						{
							if(isset($this->q) && !empty($this->q))
							{
								echo Lang::get("no_results");
							}
							else
							{
								echo Lang::get("tip_something");
							}
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