<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Functions as F;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} Charts");
	$this->render("ext/head.php", $head);
	$ptsorplays = $by === "points" ? "pt_x" : "play_x";
	$ptsorplaysv = $by === "points" ? "points" : "playcount";
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("image" => $lfm_bg));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-md text-center">
						<div class="col-xs-12">
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row">
						<div class="col-md-8 col-md-offset-2 text-center bottomspace-md">
							<h3 class="topspace-sm"><?php echo Lang::get('ch_yecli');?></h3>
							<div id="fh5co-tab-feature" class="fh5co-tab" style="display: block; width: 100%; margin: 0px;">
								<ul class="resp-tabs-list hor_1 hidden-xs">
									<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-0" role="tab" style=""><i class="fh5co-tab-menu-icon ti-user"></i>&nbsp;<span class="hidden-sm"><?php echo Lang::get('art');?></span></li>
									<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-2" role="tab" style=""><i class="fh5co-tab-menu-icon icon-vynil except"></i>&nbsp;<span class="hidden-sm"><?php echo Lang::get('alb');?></span></li>
									<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-1" role="tab" style=""><i class="fh5co-tab-menu-icon ti-music"></i>&nbsp;<span class="hidden-sm"><?php echo Lang::get('mus');?></span></li>
								</ul>
								<div class="resp-tabs-container hor_1 divider-lr divider-bottom">
									<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-0" style="">
										<div class="row">
											<div class="col-md-12 text-center">
												<h2 class="h3">Top <?php echo Lang::get('art_x');?></h2>
											</div>
											<div class="col-md-12 top-artists">
												<?php 
												if(is_array($yecs) && count($yecs) > 0)
												{
													$mainlink = Url::getBaseUrl()."/user/".$user->login."/charts/artist/year/";
													$muslink = Url::getBaseUrl()."/user/".$user->login."/music/";
													foreach ($yecs as $value) {
														$rep = isset($value["artist"][0]->$ptsorplaysv) ? $value["artist"][0]->$ptsorplaysv : "";
														$reptxt = $rep ? Lang::get($ptsorplays) : "";
												?>
													<div class="row divider-tb bottomspace-sm">
														<div class="col-md-4 text-center">
															<h4 class="h3 no-margin"><?php echo $value["year"]?></h4>
															<small class="min-bold"><?php echo $rep;?></small>
															<small class="min-min"><?php echo $reptxt;?></small>
														</div>
														<div class="col-md-6 topspace-md text-center">
															<?php 
															if(is_array($value["artist"]) && count($value["artist"]) > 0)
															{
																$actlink = $muslink.F::fixLFM($value["artist"][0]->artist);
																$r = array("login" => $user->login, "type" => "artist", "week" => $value["year"]);
																$weeklink = $mainlink.$value["year"];
																$artist = $value["artist"][0];
															?>
															<h4 class="h3 no-margin"><?php echo "<a href=".$actlink.">".$artist->artist."</a>";?></h4>
															<?php
															}
															else
															{
																echo Lang::get('no_data');
															}
															?>
														</div>
														<div class="col-md-2 topspace-md bottomspace-sm text-center">
															<a href="<?php echo $weeklink;?>" class="btn no-margin btn-custom btn-info btn-sm"><i class="ti-stats-up"></i></a>
														</div>
													</div>
												<?php
													}
												?>
												
												<?php
												}
												else
												{
													echo Lang::get('no_data');
												}
												?>
											</div>
										</div>
									</div>
									<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-2">
										<div class="row">
											<div class="col-md-12 text-center">
												<h2 class="h3">Top <?php echo Lang::get('alb_x');?></h2>
											</div>
											<div class="col-md-12 top-albums">
												<?php 
												if(is_array($yecs) && count($yecs) > 0)
												{
													$mainlink = Url::getBaseUrl()."/user/".$user->login."/charts/album/year/";
													$muslink = Url::getBaseUrl()."/user/".$user->login."/music/";
													foreach ($yecs as $value) {
														$rep = isset($value["album"][0]->$ptsorplaysv) ? $value["album"][0]->$ptsorplaysv : "";
														$reptxt = $rep ? Lang::get($ptsorplays) : "";
												?>
													<div class="row divider-tb bottomspace-sm">
														<div class="col-md-4 text-center">
															<h4 class="h3 no-margin"><?php echo $value["year"]; ?></h4>
															<small class="min-bold"><?php echo $rep; ?></small>
															<small class="min-min"><?php echo $reptxt;?></small>
														</div>
														<div class="col-md-6 text-center">
															<?php 
															if(is_array($value["album"]) && count($value["album"]) > 0)
															{
															$actlink = $muslink.F::fixLFM($value["album"][0]->artist);
															$alblink = $muslink.F::fixLFM($value["album"][0]->artist)."/".F::fixLFM($value["album"][0]->album);
																$r = array("login" => $user->login, "type" => "album", "week" => $value["year"]);
																$weeklink = $mainlink.$value["year"];
																$album = $value["album"][0];
															?>
															<h4 class="no-margin"><?php echo "<a href=".$alblink.">".$album->album."</a>";?></h4>
															<span class="text-muted"><?php echo Lang::get('by');?></span>
															<?php echo "<a href=".$actlink.">".$album->artist."</a>";?>
															<?php
															}
															else
															{
																echo Lang::get('no_data');
															}
															?>
														</div>
														<div class="col-md-2 topspace-md bottomspace-sm text-center">
															<a href="<?php echo $weeklink;?>" class="btn no-margin btn-custom btn-info btn-sm"><i class="ti-stats-up"></i></a>
														</div>
													</div>
												<?php
													}
												?>
												
												<?php
												}
												else
												{
													echo Lang::get('no_data');
												}
												?>
											</div>
										</div>
									</div>
									<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-1">
										<div class="row">
											<div class="col-md-12 text-center">
												<h2 class="h3">Top <?php echo Lang::get('mus_x');?></h2>
											</div>
											<div class="col-md-12 top-musics">
												<?php 
												if(is_array($yecs) && count($yecs) > 0)
												{
													$mainlink = Url::getBaseUrl()."/user/".$user->login."/charts/music/year/";
													$muslink = Url::getBaseUrl()."/user/".$user->login."/music/";
													foreach ($yecs as $value) {
														$rep = isset($value["music"][0]->$ptsorplaysv) ? $value["music"][0]->$ptsorplaysv : "";
														$reptxt = $rep ? Lang::get($ptsorplays) : "";
												?>
													<div class="row divider-tb bottomspace-sm">
														<div class="col-md-4 text-center">
															<h4 class="h3 no-margin"><?php echo $value["year"]?></h4>
															<small class="min-bold"><?php echo $rep;?></small>
															<small class="min-min"><?php echo $reptxt;?></small>
														</div>
														<div class="col-md-6 text-center">
															<?php 
															if(is_array($value["music"]) && count($value["music"]) > 0)
															{
																$actlink = $muslink.F::fixLFM($value["music"][0]->artist);
																$mlink = $muslink.F::fixLFM($value["music"][0]->artist)."/_/".F::fixLFM($value["music"][0]->music);
																$r = array("login" => $user->login, "type" => "music", "week" => $value["year"]);
																$weeklink = $mainlink.$value["year"];
																$music = $value["music"][0];
															?>
															<h4 class="no-margin"><?php echo "<a href=".$mlink.">".$music->music."</a>";?></h4>
															<span class="text-muted"><?php echo Lang::get('by');?></span>
															<?php echo "<a href=".$actlink.">".$music->artist."</a>";?>
															<?php
															}
															else
															{
																echo Lang::get('no_data');
															}
															?>
														</div>
														<div class="col-md-2 topspace-md bottomspace-sm text-center">
															<a href="<?php echo $weeklink;?>" class="btn no-margin btn-custom btn-info btn-sm"><i class="ti-stats-up"></i></a>
														</div>
													</div>
												<?php
													}
												?>
												
												<?php
												}
												else
												{
													echo Lang::get('no_data');
												}
												?>
											</div>
										</div>
									</div>
								</div>
								<br>
							</div>	
						</div>
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>