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
							echo "<div class=\"row\">";
							echo "<div class=\"grid\">";
							foreach ($this->search as $key => $value) 
							{
						?>
							<div class="col-md-4 col-sm-6 col-xs-12 bottomspace-lg grid-item <?php if(!isset($this->search[$key-1])){ echo 'grid-sizer';} ?>">
								<div class="row">
									<div class="col-xs-3">
										<img src="<?php echo $value["image"];?>" class="img-responsive img-circle">
									</div>
									<div class="col-xs-9">
										<?php
											switch ($this->type) {
											 	case 'artist':
												 	$route = "lib_art";
											 		$vars = array("name" => Functions::fixLFM($value["name"]), "login" => $this->guessUser());
													echo "<a href=".Route::url($route, $vars).">".$value["name"]."</a>";
											 		break;

											 	case 'album':
												 	$route = "lib_alb";
													$vars = array("name" => Functions::fixLFM($value["name"]), "artist" => Functions::fixLFM($value["artist"]), "login" => $this->guessUser());
													echo "<a href=".Route::url($route, $vars).">".$value["name"]."</a>";
													$varsact = array("name" => Functions::fixLFM($value["artist"]), "login" => $this->guessUser());
													echo "<br><small><a href=".Route::url("lib_art", $varsact).">".$value["artist"]."</a></small>";
											 		break;
											 	
											 	default:
												 	$route = "lib_mus";
													$vars = array("name" => Functions::fixLFM($value["name"]), "artist" => Functions::fixLFM($value["artist"]), "login" => $this->guessUser());
													echo "<a href=".Route::url($route, $vars).">".$value["name"]."</a>";
													$varsact = array("name" => Functions::fixLFM($value["artist"]), "login" => $this->guessUser());
													echo "<br><small><a href=".Route::url("lib_art", $varsact).">".$value["artist"]."</a></small>";
											 		break;
											 } 
										?>
										<br>
										<?php 
										if($value["logged_lib"])
										{
											$showloglegend = true;
											$vars["login"] = $this->user->login;
										?>
										<a href="<?php echo Route::url($route, $vars);?>" class="tipup no-decoration" title="<?php echo Lang::get('in_your_lib');?>"><i class="text-main flaticon-badge-2"></i></a>
										<?php
										}
										if($value["this_lib"])
										{
											$showliblegend = true;
										?>
										<a href="<?php echo Route::url($route, $vars);?>" class="tipup no-decoration" title="<?php echo Lang::get('in_this_lib');?>"><i class="text-sec flaticon-badge-2"></i></a>
										<?php
										}
										?>
									</div>
								</div>
							</div>
						<?php
							}
							echo "</div>";
							echo "</div>";
						?>
							<div class="row">
								<div class="col-xs-12">
									<?php 
									if(isset($showloglegend))
									{
									?>
										<a href="#!" class="tipup no-decoration" title="<?php echo Lang::get('in_your_lib');?>"><i class="text-main flaticon-badge-2"></i></a> = <?php echo Lang::get('in_your_lib_long');?> &nbsp;
									<?php
									}
									?>
									<?php 
									if(isset($showliblegend))
									{
									?>
										<a href="#!" class="tipup no-decoration" title="<?php echo Lang::get('in_this_lib');?>"><i class="text-sec flaticon-badge-2"></i></a> = <?php echo Lang::get('in_this_lib_long');?>
									<?php
									}
									?>
								</div>
							</div>
						<?php
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