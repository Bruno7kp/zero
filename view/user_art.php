<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
use B7KP\Utils\Constants as C;
use B7KP\Utils\Functions as F;
use B7KP\Utils\Snippets as S;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} - ".$artist["artist"]);
	$this->render("ext/head.php", $head);

	$name = $artist["artist"];
	$plays =  $artist["userplaycount"];
	$totalwks = $artist["stats"]["stats"]["alltime"]["weeks"]["total"];
	$totalwks = empty($totalwks) ? "N/C" : $totalwks;
	$peak = $artist["stats"]["stats"]["alltime"]["overall"]["peak"];
	$peak = empty($peak) ? "N/C" : $peak;
	$times = $peak > 0 ? "(".$artist["stats"]["stats"]["alltime"]["rank"][$peak]."x)" : "";
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
					<div class="row topspace-md">
						<div class="col-xs-4 col-sm-3 col-md-2">
							<img class="img-circle img-responsive" src="<?php echo $artist['img'];?>">
						</div>
						<div class="col-xs-8 col-sm-9 col-md-10">
							<h2><?php echo $name;?></h2>
							<div class="row">
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted"><?php echo Lang::get('play_x');?></small>
									<br>
									<strong>
										<i class="ti-control-play ico-color"></i>
										<?php echo $plays;?>					
									</strong>
								</div>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted"><?php echo Lang::get('wk_x');?></small>
									<br>
									<strong>
										<i class="fa fa-calendar fa-fw ico-color"></i>
										<?php echo $totalwks?>					
									</strong>
								</div>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted"><?php echo Lang::get('pk');?></small>
									<br>
									<strong>
										<i class="ti-stats-up ico-color"></i>
										<?php echo $peak;?>
										<small class="text-muted">
											<?php echo $times;?>		
										</small>			
									</strong>
								</div>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-12">
							<?php if(!empty($times)): ?>
							<hr/>
							<?php ; endif; ?>
						</div>
					</div>
					<?php
					echo S::chartRun("artist", $artist["stats"]["chartrun"], $user, $artist["stats"]["stats"]["alltime"], $limit, $name);
					?>
					<div class="row">
						<div class="col-md-12">
							<hr/>
						</div>
					</div>
					<div class="row">
						<div class="col-md-6">
							<h3 class="pd"><?php echo Lang::get("alb_x");?></h3>
							<?php 
							if(count($album) > 0)
							{
								$max = 0;
								foreach ($album as $item) 
								{
									if($max == 5)
									{
										break;
									}
									$max++;
									echo "<div class='pd'>";
									echo "<div class='getimage float' id='rankid".md5($item->album)."' data-type='album' data-name='".htmlentities($item->album, ENT_QUOTES)."' data-mbid='' data-artist='".htmlentities($name, ENT_QUOTES)."'></div>";
									echo "<a class='pd-5' href=".Route::url('lib_alb', array("login" => $user->login, "artist" => F::fixLFM($name), "name" => F::fixLFM($item->album))).">".$item->album."</a>";
									echo "<br/>";
										echo "<div class='row' style='font-size: small;'>";
											echo "<div class='col-xs-2 text-center'>";
												echo "<small class='text-muted'>".Lang::get("pk")."</small><br>";
												echo "<b>".$item->peak."</b>";
											echo "</div>";
											echo "<div class='col-xs-2 text-center'>";
												echo "<small class='text-muted'>".Lang::get("wk_x")."</small><br>";
												echo "<b>".$item->weeks."</b>";
											echo "</div>";
										echo "</div>";
									echo "</div>";

								}
								echo "<a class='btn btn-outline' href=".Route::url('lib_art_album', array('login' => $user->login, 'artist' => F::fixLFM($name))).">".Lang::get('view')."</a>";
							}
							else
							{
								echo Lang::get("no_alb");
							}
							?>
						</div>
						<div class="col-md-6">
							<h3><?php echo Lang::get("mus_x");?></h3>
							<?php
							if(count($music) > 0)
							{
								$max = 0;
								foreach ($music as $item) 
								{
									if($max == 5)
									{
										break;
									}
									$max++;
									echo "<div class='pd'>";
									echo "<div class='float' id='rankid".md5($item->music)."' data-type='music' data-name='".htmlentities($item->music, ENT_QUOTES)."' data-mbid='' data-artist='".htmlentities($name, ENT_QUOTES)."'><img src='".$artist['img']."' height='64'></div>";
									echo "<a class='pd-5' href=".Route::url('lib_mus', array("login" => $user->login, "artist" => F::fixLFM($name), "name" => F::fixLFM($item->music))).">".$item->music."</a>";
									echo "<br/>";
										echo "<div class='row' style='font-size: small;'>";
											echo "<div class='col-xs-2 text-center'>";
												echo "<small class='text-muted'>".Lang::get("pk")."</small><br>";
												echo "<b>".$item->peak."</b>";
											echo "</div>";
											echo "<div class='col-xs-2 text-center'>";
												echo "<small class='text-muted'>".Lang::get("wk_x")."</small><br>";
												echo "<b>".$item->weeks."</b>";
											echo "</div>";
										echo "</div>";
									echo "</div>";

								}
								echo "<a class='btn btn-outline' href=".Route::url('lib_art_music', array('login' => $user->login, 'artist' => F::fixLFM($name))).">".Lang::get('view')."</a>";
							}
							else
							{
								echo Lang::get("no_mus");
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