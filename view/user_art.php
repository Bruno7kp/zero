<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Utils\Certified;
use B7KP\Utils\Constants as C;
use B7KP\Utils\Functions as F;
use B7KP\Utils\Snippets as S;
use B7KP\Utils\UserSession;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} - ".$artist["artist"]);
	$this->render("ext/head.php", $head);

	$show_times = $settings->show_times;
	$c = new Certified($user, $this->factory);

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
							<h2><?php echo $name;?>
							<?php 
							$session = UserSession::getUser($this->factory);
							if($session && $session->id != $user->id)
							{
							?>
							<small> • <a href="<?php echo Route::url('lib_art', array("login" => $session->login, "name" => F::fixLFM($name)));?>"><?php echo Lang::get("view_in_your");?></a></small>
							<?php
							}
							?>
							</h2>
							
							<div class="row">
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted"><?php echo Lang::get('play_x');?></small>
									<br>
									<strong>
										<i class="ti-control-play ico-color"></i>
										<span class="fmt-nmb"><?php echo $plays;?></span>					
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
								<?php 
								if($settings->show_points > 0)
								{
								?>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted"><?php echo Lang::get('pt_x');?></small>
									<br>
									<strong>
										<i class="ti-bar-chart-alt ico-color"></i>
										<span class="fmt-nmb"><?php echo $c->getArtistChartPoints($name);?></span>		
									</strong>
								</div>
                                <div class="col-md-2 col-sm-3 col-xs-6 text-center">
                                    <small class="text-muted"><?php echo Lang::get('both_x');?></small>
                                    <br>
                                    <strong>
                                        <i class="ti-bar-chart-alt ico-color"></i>
                                        <span class="fmt-nmb"><?php echo $c->getArtistChartPoints($name) + $plays;?></span>
                                    </strong>
                                </div>
								<?php
								}
								?>
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
						<div class="col-md-12">

							<?php 
							if(count($album) > 0)
							{
							?>
							<h2 class="text-center topspace-xxl"><?php echo Lang::get("alb_x");?></h2>
							<table class="chart-table no-no1 table-fluid topspace-md">
								<tr>
									<th class="cr-col min center">+</th>
									<th class="center"><?php echo Lang::get('pk');?></th>
									<th class="center">Img</th>
									<th><?php echo Lang::get('title');?></th>
									<th class="center"><?php echo Lang::get('wk_x')?></th>
									<th class="center"><?php echo Lang::get('play_x')?></th>
									<?php 
									if($settings->show_points)
									{
									?>
									<th class="center"><?php echo Lang::get('pt_x')?></th>
									<th class="center"><?php echo Lang::get('both_x')?></th>
									<?php
									}
									?>
									<?php 
									if($settings->show_chart_cert)
									{
									?>
									<th class="center"><?php echo Lang::get('cert_s')?></th>
									<?php
									}
									?>
								</tr>
							<?php
								foreach ($album as $item) 
								{
									$peak = $item->stats["stats"]["alltime"]["overall"]["peak"];
									$pts = intval($item->stats["stats"]["alltime"]["overall"]["chartpoints"]);
									$times = $item->stats["stats"]["alltime"]["rank"][$peak];
									$todate = $item->stats["stats"]["alltime"];
									$cr = $item->stats["chartrun"];
									$weeks = $item->stats["stats"]["alltime"]["weeks"]["total"];
									$sp = "";
									if($peak == 1):
										$sp = "rk-sp";
									endif;
									echo "<tr>";
										echo "<td class='cr-col min'>";
											echo "<a class='cr-icon'><i class='ti-stats-up'></i></a>";
										echo "</td>";
										echo "<td class='rk-col text-center ".$sp."'>";
											echo $peak;
										if($show_times)
										{
											echo "<br><span class='black'>".$times."x</span>";
										}
										echo "</td>";
										echo "<td class=\"text-center\" data-i='".md5($item->album)."'><img width='64' src='".Url::getBaseUrl()."/web/img/default-alb.png'/></td>";
										echo "<td>";
											echo "<a class='mg-5' href=".Route::url('lib_alb', array("login" => $user->login, "artist" => F::fixLFM($name), "name" => F::fixLFM($item->album))).">".$item->album."</a>";
										echo "</td>";
										echo "<td class='text-center rk-col'>";
											echo $weeks;
										echo "</td>";
										echo "<td id='".md5($item->album)."' class='text-center rk-col loadplaycount' data-type='album' data-login=".$user->login." data-name='".htmlentities($item->album, ENT_QUOTES)."' data-artist='".htmlentities($name, ENT_QUOTES)."'></td>";
										echo "</td>";
										if($settings->show_points)
										{
											echo "<td class='text-center rk-col'>".$pts."</td>";
											echo "<td class='text-center rk-col' data-w-pl='{$settings->weight_alb_pls}' data-w-pt='{$settings->weight_alb_pts}' data-p='".$pts."' data-pp='".md5($item->album)."'></td>";
										}
										if($settings->show_chart_cert)
										{
                                            $c = new Certified($user, $this->factory);
                                            switch ($settings->cert_type){
                                                case "2":
                                                    echo "<td class='text-center rk-col' data-w-pl='{$settings->weight_alb_pls}' data-w-pt='{$settings->weight_alb_pts}' data-p='".$pts."' data-c='".md5($item->album)."'></td>";
                                                    break;
                                                case "1":
                                                    $cert = $c->getCertification("album", $pts, "text+icon");
                                                    echo '<td class="text-center rk-col"> '.$cert.'</td>';
                                                    break;
                                                default:
                                                    echo "<td class='text-center rk-col' data-p='0' data-c='".md5($item->album)."'></td>";
                                                    break;
                                            }
										}
									echo "</tr>";
									echo "<tr style='display:none;' class='cr-row'>";
										echo "<td colspan='8'>";
											echo S::chartRun("album", $cr, $user, $todate, $alimit, $item->album, $item->artist);
										echo "</td>";
									echo "</tr>";
								}
								echo "</table>";
							}
							else
							{
								echo Lang::get("no_alb");
							}
							?>
						</div>
						<div class="col-md-12">
							<?php
							if(count($music) > 0)
							{
							?>
							<h2 class="text-center topspace-xxl"><?php echo Lang::get("mus_x");?></h2>
							<table class="chart-table no-no1 table-fluid topspace-md">
								<tr>
									<th class="cr-col min center">+</th>
									<th class="center"><?php echo Lang::get('pk');?></th>
									<th><?php echo Lang::get('title');?></th>
									<th class="center"><?php echo Lang::get('wk_x')?></th>
								</tr>
							<?php
								$max = 0;
								foreach ($music as $item) 
								{
									if($max == 10)
									{
										break;
									}
									$max++;
									$peak = $item->stats["stats"]["alltime"]["overall"]["peak"];
									$times = $item->stats["stats"]["alltime"]["rank"][$peak];
									$todate = $item->stats["stats"]["alltime"];
									$cr = $item->stats["chartrun"];
									$weeks = $item->stats["stats"]["alltime"]["weeks"]["total"];
									$sp = "";
									if($peak == 1):
										$sp = "rk-sp";
									endif;
									echo "<tr>";
										echo "<td class='cr-col min'>";
											echo "<a class='cr-icon'><i class='ti-stats-up'></i></a>";
										echo "</td>";
										echo "<td class='rk-col text-center ".$sp."'>";
											echo $peak;
										if($show_times)
										{
											echo "<br><span class='black'>".$times."x</span>";
										}
										echo "</td>";
										echo "<td>";
											echo "<a class='mg-5' href=".Route::url('lib_mus', array("login" => $user->login, "artist" => F::fixLFM($name), "name" => F::fixLFM($item->music))).">".$item->music."</a>";
										echo "</td>";
										echo "<td class='text-center rk-col'>";
											echo $weeks;
										echo "</td>";
									echo "</tr>";
									echo "<tr style='display:none;' class='cr-row'>";
										echo "<td colspan='8'>";
											echo S::chartRun("music", $cr, $user, $todate, $mlimit, $item->music, $item->artist);
										echo "</td>";
									echo "</tr>";

								}
								echo "</table>";
								echo "<a class='btn btn-outline topspace-md' href=".Route::url('lib_art_music', array('login' => $user->login, 'artist' => F::fixLFM($name))).">".Lang::get('view')."</a>";
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