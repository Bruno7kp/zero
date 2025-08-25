<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Utils\Certified;
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

	$show_times = $settings->show_times;
	$limit = $settings->mus_limit;
	$name = $artist["artist"];
	$totalentries = 0;
	$entriestop1 	= 0;
	$entriestop5 	= 0;
	$entriestop10 	= 0;
	$entriestop20 	= 0;
	$totalweeks = 0;
	$wkstop1 	= 0;
	$wkstop5 	= 0;
	$wkstop10 	= 0;
	$wkstop20 	= 0;
	foreach ($music as $item) {
		$pe = $item->stats["stats"]["alltime"]["overall"]["peak"];
		$wk = $item->stats["stats"]["alltime"]["weeks"]["total"];
		$totalentries++;
		$totalweeks += $wk;
		$wkstop1 += $item->stats["stats"]["alltime"]["weeks"]["top01"];
		$wkstop5 += $item->stats["stats"]["alltime"]["weeks"]["top05"];
		$wkstop10 += $item->stats["stats"]["alltime"]["weeks"]["top10"];
		$wkstop20 += $item->stats["stats"]["alltime"]["weeks"]["top20"];
		if($pe == 1) {
			$entriestop1++;
		}
		if($pe <= 5) {
			$entriestop5++;
		}
		if($pe <= 10) {
			$entriestop10++;
		}
		if($pe <= 20) {
			$entriestop20++;
		}
	}
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
							<h2><?php echo Lang::get("mus_x")." ".Lang::get("of");?> <a href=<?php echo Route::url("lib_art", array("login" => $user->login, "name" => F::fixLFM($name)));?>><?php echo htmlentities($name);?></a></h2>
							<div class="row">
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="rk-sp bold">Top 1</small>
									<br>
									<span>
										<?php echo $entriestop1;?>
										<small class="text-muted">
											(<?php echo $wkstop1;?>x)		
										</small>					
									</span>
								</div>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="rk-sp bold">Top 5</small>
									<br>
									<span>
										<?php echo $entriestop5?>	
										<small class="text-muted">
											(<?php echo $wkstop5;?>x)		
										</small>				
									</span>
								</div>
								<?php if ($limit >= 10) { ?>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="rk-sp bold">Top 10</small>
									<br>
									<span>
										<?php echo $entriestop10;?>
										<small class="text-muted">
											(<?php echo $wkstop10;?>x)	
										</small>			
									</span>
								</div>
								<?php } ?>
								<?php if ($limit >= 20) { ?>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="rk-sp bold">Top 20</small>
									<br>
									<span>
										<?php echo $entriestop20;?>
										<small class="text-muted">
											(<?php echo $wkstop20;?>x)		
										</small>			
									</span>
								</div>
								<?php } ?>
								<?php if ($limit > 20) { ?>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="rk-sp bold">Top <?php echo $limit;?></small>
									<br>
									<span>
										<?php echo $totalentries;?>
										<small class="text-muted">
											(<?php echo $totalweeks;?>x)		
										</small>			
									</span>
								</div>
								<?php } ?>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-12">
							<hr/>
						</div>
					</div>
					<div class="row">
						<div class="col-md-12">
							<?php
							if(count($music) > 0)
							{
							?>
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
								foreach ($music as $item) 
								{
									$peak = $item->stats["stats"]["alltime"]["overall"]["peak"];
									$times = $item->stats["stats"]["alltime"]["rank"][$peak];
									$todate = $item->stats["stats"]["alltime"];
									$pts = intval($item->stats["stats"]["alltime"]["overall"]["chartpoints"]);
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
										echo "<td id='".md5($item->music)."' class='text-center rk-col loadplaycount' data-type='music' data-login=".$user->login." data-name='".htmlentities($item->music, ENT_QUOTES)."' data-artist='".htmlentities($name, ENT_QUOTES)."'></td>";
										if($settings->show_points)
										{
											echo "<td class='text-center rk-col'>".$pts."</td>";
											echo "<td class='text-center rk-col' data-p='".$pts."' data-w-pl='{$settings->weight_mus_pls}' data-w-pt='{$settings->weight_mus_pts}' data-pp='".md5($item->music)."'></td>";
										}
										if($settings->show_chart_cert)
										{
											$c = new Certified($user, $this->factory);
											switch ($settings->cert_type){
                                                case "2":
                                                    echo "<td class='text-center rk-col' data-w-pl='{$settings->weight_mus_pls}' data-w-pt='{$settings->weight_mus_pts}' data-p='".$pts."' data-c='".md5($item->music)."'></td>";
                                                    break;
                                                case "1":
                                                    $cert = $c->getCertification("music", $pts, "text+icon");
                                                    echo '<td class="text-center rk-col"> '.$cert.'</td>';
                                                    break;
                                                default:
                                                    echo "<td class='text-center rk-col' data-p='0' data-c='".md5($item->music)."'></td>";
                                                    break;
                                            }
										}
									echo "</tr>";
									echo "<tr style='display:none;' class='cr-row'>";
										echo "<td colspan='10' data-cr='".base64_encode($crurl)."'><p>".Lang::get("loading")."...</p>";
											// echo S::chartRun("music", $cr, $user, $todate, $mlimit, $item->music, $item->artist);
										echo "</td>";
									echo "</tr>";

								}
								echo "</tbody></table>";
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