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
	$totalwks = $stats->weeks;
	$totalwks = empty($totalwks) ? "N/C" : $totalwks;
	$peak = $stats->peak;
	$peak = empty($peak) ? "N/C" : $peak;
	$times = $peak > 0 ? "(".$stats->peak_count."x)" : "";
	$crurl = Route::url("get_chartrun", array("type" => "artist", "user" => $user->login, "name" => F::fixLFM($name), "artist" => F::fixLFM($name), "weekstart" => "first", "weekend" => "last"));
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
						<div class="col-xs-4 col-sm-3 col-md-2"  data-i="<?php echo md5($name);?>">
							<img class="img-circle img-responsive" src="<?php echo $artist['img'];?>">
						</div>
						<div class="col-xs-8 col-sm-9 col-md-10">
							<h2><?php echo htmlentities($name);?>
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
										<span class="loadplaycount" id="<?php echo md5($name); ?>"
											data-type="artist" data-login="<?php echo $user->login; ?>"
											data-name="<?php echo htmlentities($name, ENT_QUOTES); ?>"
											data-artist="<?php echo htmlentities($name, ENT_QUOTES); ?>"><?php echo $plays;?></span>					
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
										<span class=""><?php echo $stats->points;?></span>		
									</strong>
								</div>
                                <div class="col-md-2 col-sm-3 col-xs-6 text-center">
                                    <small class="text-muted"><?php echo Lang::get('both_x');?></small>
                                    <br>
                                    <strong>
                                        <i class="ti-bar-chart-alt ico-color"></i>
                                        <span class="" data-w-pl="1" data-w-pt="1" data-p="<?php echo $stats->points;?>" data-pl="<?php echo $plays;?>" data-pts="<?php echo $stats->points;?>" data-pp="<?php echo md5($name);?>"><?php echo $stats->points + $plays;?></span>
                                    </strong>
                                </div>
								<?php
								}
								?>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted">Chart-run</small>
                                    <br>
									<a class="cr-icon" href="javascript:void(0)" data-crb="<?php echo base64_encode($crurl)?>"><i class="ti-stats-up"></i></a>
								</div>
							</div>

						</div>
					</div>
					<div class="row">
						<div class="col-md-12" style="display: none" data-cr="<?php echo base64_encode($crurl)?>"></div>
					</div>
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
							<h2 class="text-center topspace-xxl">
								<a href="<?php echo Route::url('lib_art_album', array('login' => $user->login, 'artist' => F::fixLFM($name)));?>">
									<?php echo Lang::get("alb_x");?>
								</a>
							</h2>
							<table class="chart-table no-no1 table-fluid tablesorter topspace-md no-header-bg">
								<thead>
								<tr>
									<th class="cr-col min center sorter-false">+</th>
									<th class="center"><?php echo Lang::get('pk');?></th>
									<th class="center sorter-false">Img</th>
									<th><?php echo Lang::get('title');?></th>
									<th class="center"><?php echo Lang::get('wk_x')?></th>
									<th class="center sorter-br-number"><?php echo Lang::get('play_x')?></th>
									<?php 
									if($settings->show_points)
									{
									?>
									<th class="center sorter-br-number"><?php echo Lang::get('pt_x')?></th>
									<th class="center sorter-br-number"><?php echo Lang::get('both_x')?></th>
									<?php
									}
									?>
									<?php 
									if($settings->show_chart_cert)
									{
									?>
									<th class="center sorter-false"><?php echo Lang::get('cert_s')?></th>
									<?php
									}
									?>
								</tr>
								</thead>
								<tbody>
							<?php
								$max = 0;
								foreach ($album as $item) 
								{
									if($max == 5)
									{
										break;
									}
									$max++;
									$peak = $item->stats["stats"]["alltime"]["overall"]["peak"];
									$pts = intval($item->stats["stats"]["alltime"]["overall"]["chartpoints"]);
									$times = $item->stats["stats"]["alltime"]["rank"][$peak];
									$todate = $item->stats["stats"]["alltime"];
									$cr = $item->stats["chartrun"];
									$weeks = $item->stats["stats"]["alltime"]["weeks"]["total"];
									$crurl = Route::url("get_chartrun", array("type" => "album", "user" => $user->login, "name" => F::fixLFM($item->album), "artist" => F::fixLFM($item->artist), "weekstart" => "first", "weekend" => "last"));
									$sp = "";
									if($peak == 1):
										$sp = "rk-sp";
									endif;
									echo "<tr>";
										echo "<td class='cr-col min'>";
											echo "<a class='cr-icon' data-crb='".base64_encode($crurl)."'><i class='ti-stats-up'></i></a>";
										echo "</td>";
										echo "<td class='rk-col text-center ".$sp."'>";
											echo $peak;
										if($show_times)
										{
											echo "<br><span class='black'>".$times."x</span>";
										}
										echo "</td>";
										echo "<td class=\"text-center\" data-i='".md5('a'.$item->album)."'><img width='64' src='".Url::getBaseUrl()."/web/img/default-alb.png'/></td>";
										echo "<td>";
											echo "<a class='mg-5' href=".Route::url('lib_alb', array("login" => $user->login, "artist" => F::fixLFM($name), "name" => F::fixLFM($item->album))).">".htmlentities($item->album)."</a>";
										echo "</td>";
										echo "<td class='text-center rk-col'>";
											echo $weeks;
										echo "</td>";
										echo "<td id='".md5('a'.$item->album)."' class='text-center rk-col loadplaycount' data-type='album' data-login=".$user->login." data-name='".htmlentities($item->album, ENT_QUOTES)."' data-artist='".htmlentities($name, ENT_QUOTES)."'></td>";
										echo "</td>";
										if($settings->show_points)
										{
											echo "<td class='text-center rk-col'>".$pts."</td>";
											echo "<td class='text-center rk-col' data-w-pl='{$settings->weight_alb_pls}' data-w-pt='{$settings->weight_alb_pts}' data-p='".$pts."' data-pp='".md5('a'.$item->album)."'></td>";
										}
										if($settings->show_chart_cert)
										{
                                            $c = new Certified($user, $this->factory);
                                            switch ($settings->cert_type){
                                                case "2":
                                                    echo "<td class='text-center rk-col' data-w-pl='{$settings->weight_alb_pls}' data-w-pt='{$settings->weight_alb_pts}' data-p='".$pts."' data-c='".md5('a'.$item->album)."'></td>";
                                                    break;
                                                case "1":
                                                    $cert = $c->getCertification("album", $pts, "text+icon");
                                                    echo '<td class="text-center rk-col"> '.$cert.'</td>';
                                                    break;
                                                default:
                                                    echo "<td class='text-center rk-col' data-p='0' data-c='".md5('a'.$item->album)."'></td>";
                                                    break;
                                            }
										}
									echo "</tr>";
									
									echo "<tr style='display:none;' class='cr-row'>";
										echo "<td colspan='10' data-cr='".base64_encode($crurl)."'><p>".Lang::get("loading")."...</p>";
											// echo S::chartRun("album", $cr, $user, $todate, $alimit, $item->album, $item->artist);
										echo "</td>";
									echo "</tr>";
									
								}
								echo "</tbody></table>";
								echo "<a class='btn btn-outline topspace-md' href=".Route::url('lib_art_album', array('login' => $user->login, 'artist' => F::fixLFM($name))).">".Lang::get('view')."</a>";

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
							<h2 class="text-center topspace-xxl">
								<a href="<?php echo Route::url('lib_art_music', array('login' => $user->login, 'artist' => F::fixLFM($name)));?>">
									<?php echo Lang::get("mus_x");?>
								</a>
							</h2>
							<table class="chart-table no-no1 table-fluid tablesorter topspace-md no-header-bg">
								<thead>
								<tr>
									<th class="cr-col min center sorter-false">+</th>
									<th class="center"><?php echo Lang::get('pk');?></th>
									<th><?php echo Lang::get('title');?></th>
									<th class="center"><?php echo Lang::get('wk_x')?></th>
									<th class="center sorter-br-number"><?php echo Lang::get('play_x')?></th>
									<?php
									if($settings->show_points)
									{
									?>
									<th class="center sorter-br-number"><?php echo Lang::get('pt_x')?></th>
									<th class="center sorter-br-number"><?php echo Lang::get('both_x')?></th>
									<?php
									}
									?>
								</tr>
								</thead>
								<tbody>
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
									$pts = intval($item->stats["stats"]["alltime"]["overall"]["chartpoints"]);
									$todate = $item->stats["stats"]["alltime"];
									$cr = $item->stats["chartrun"];
									$weeks = $item->stats["stats"]["alltime"]["weeks"]["total"];
									$crurl = Route::url("get_chartrun", array("type" => "music", "user" => $user->login, "name" => F::fixLFM($item->music), "artist" => F::fixLFM($item->artist), "weekstart" => "first", "weekend" => "last"));
									$sp = "";
									if($peak == 1):
										$sp = "rk-sp";
									endif;
									echo "<tr>";
										echo "<td class='cr-col min'>";
											echo "<a class='cr-icon' data-crb='".base64_encode($crurl)."'><i class='ti-stats-up'></i></a>";
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
										echo "<td id='".md5('m'.$item->music)."' class='text-center rk-col loadplaycount' data-type='music' data-login=".$user->login." data-name='".htmlentities($item->music, ENT_QUOTES)."' data-artist='".htmlentities($name, ENT_QUOTES)."'></td>";
										if($settings->show_points)
										{
											echo "<td class='text-center rk-col'>".$pts."</td>";
											echo "<td class='text-center rk-col' data-p='".$pts."' data-w-pl='{$settings->weight_mus_pls}' data-w-pt='{$settings->weight_mus_pts}' data-pp='".md5('m'.$item->music)."'></td>";
										}
									echo "</tr>";
									
									echo "<tr style='display:none;' class='cr-row'>";
										echo "<td colspan='10' data-cr='".base64_encode($crurl)."'><p>".Lang::get("loading")."...</p>";
											// echo S::chartRun("music", $cr, $user, $todate, $mlimit, $item->music, $item->artist);
										echo "</td>";
									echo "</tr>";
									

								}
								echo "</tbody></table>";
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