<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login}'s Profile");
	$this->render("ext/head.php", $head);
	$blockalt = "<h3>
					<a class='white' href=''>".$user->login."</a> 
					<a href='http://last.fm/user/{$user->login}' class='white-hover' title='View Last.fm profile' target='_blank'>
						<i class='fa fa-lastfm'></i>
					</a>
				</h3>";
	$blocktitle = "<img class='img-circle' src='".$lfm_image."'>";
?>
	<body class="inner-page">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("title" => $blocktitle, "subtitle" => "", "image" => $lfm_bg, "alttitle" => $blockalt));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-md">
						<div class="col-xs-12">
							<div class="">
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted">Last.fm register</small>
									<br/>
									<strong>
									<i class="fa fa-calendar fa-fw ico-color"></i>
										<?php echo $lfm_register;?>
									</strong>
								</div>
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted">Country</small>
									<br/>
									<strong>
									<i class="fa fa-flag-o fa-fw ico-color"></i>
									<?php echo $lfm_country;?>
									</strong>
								</div>
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted">Playcount</small>
									<br/>
									<strong>
									<i class="ti-control-play ico-color"></i>
									<?php echo number_format($lfm_playcount);?>
									</strong>
								</div>
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted">Chart weeks</small>
									<br/>
									<strong>
									<i class="fa fa-calendar-check-o fa-fw ico-color"></i>
									<?php echo count($weeks);?>
									</strong>
								</div>
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted">Scrobbles/week</small>
									<br/>
									<strong>
									<i class="ti-headphone ico-color"></i>
									<?php echo $average;?>
									</strong>
								</div>
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted">Top artist</small>
									<br/>
									<strong>
									<i class="ti-microphone ico-color"></i>
									<?php echo $topartist["name"];?>
									</strong>
								</div>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-8 col-sm-7 col-xs-12">
							<?php
							$outofdateweeks = $weekstodate - count($weeks);
							if($user->checkSelfPermission($this->factory))
							{
								if(count($weekstodate) == 0)
								{
									echo "<div class='alert alert-info'>Hello, looks like you're new in last.fm, you'll have to wait till the week ends.</div>";
								}
								elseif($outofdateweeks > 0)
								{
									echo "<div class='alert alert-info'>Hello, you have ".$outofdateweeks." week(s) outdated, <a href='".Route::url("update")."'>update now?</a></div>";
								}
							}
							if(count($weeks) <= 0)
							{
								echo "<div class='row'><div class='col-md-12'>There's no data to show here. <i class='fa fa-frown-o'></i></div></div>";
							}
							else
							{
								$weeks = $weeks[0];
								$charts = new Charts($this->factory, $user);
								echo $charts->getHomeWeeklyChartsAlt($weeks);
							}
							?>
						</div>
						<div class="col-md-4 col-sm-5 col-xs-12">
							<div id="fh5co-tab-feature" class="fh5co-tab" style="display: block; width: 100%; margin: 0px;">
								<ul class="resp-tabs-list hor_1 hidden-xs">
									<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-0" role="tab" style=""><i class="fh5co-tab-menu-icon ti-user"></i>&nbsp;<span class="hidden-sm">Artist</span></li>
									<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-1" role="tab" style=""><i class="fh5co-tab-menu-icon ti-music"></i>&nbsp;<span class="hidden-sm">Music</span></li>
									<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-2" role="tab" style=""><i class="fh5co-tab-menu-icon icon-vynil except"></i>&nbsp;<span class="hidden-sm">Album</span></li>
								</ul>
								<div class="resp-tabs-container hor_1 divider-lr divider-bottom">
									<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-0" style="">
										<div class="row">
											<div class="col-md-12">
												<h2 class="h3">Overall Top Artists</h2>
											</div>
											<div class="col-md-12 top-artists">
												<?php echo Snippets::loader(50);?>
											</div>
										</div>
									</div>
									<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-1">
										<div class="row">
											<div class="col-md-12">
												<h2 class="h3">Overall Top Musics</h2>
											</div>
											<div class="col-md-12 top-musics">
												<?php echo Snippets::loader(50);?>
											</div>
										</div>
									</div>
									<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-2">
										<div class="row">
											<div class="col-md-12">
												<h2 class="h3">Overall Top Albums</h2>
											</div>
											<div class="col-md-12 top-albums">
												<?php echo Snippets::loader(50);?>
											</div>
										</div>
									</div>
								</div>
							</div>	
							<div class="row">
								<div class="col-xs-12">
									<div class="col-xs-12 recent divider topspace-md">
										<?php echo Snippets::loader(50);?>
									</div>
								</div>
							</div>
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>