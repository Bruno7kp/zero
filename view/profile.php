<?php
use B7KP\Utils\Snippets;
?>
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
					<div class="row">
						<div class="col-md-4 col-sm-6 col-xs-12">
							<h2>OVERVIEW</h2>
							<div id="fh5co-tab-feature" class="fh5co-tab" style="display: block; width: 100%; margin: 0px;">
									<ul class="resp-tabs-list hor_1 hidden-xs">
										<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-0" role="tab" style=""><i class="fh5co-tab-menu-icon ti-microphone"></i> Artist</li>
										<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-1" role="tab" style=""><i class="fh5co-tab-menu-icon ti-music"></i> Music</li>
										<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-2" role="tab" style=""><i class="fh5co-tab-menu-icon icon-vynil except"></i> Album</li>
									</ul>
									<div class="resp-tabs-container hor_1">
										<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-0" style="">
											<div class="row">
												<div class="col-md-12">
													<h2 class="h3">Top Artists</h2>
												</div>
												<div class="col-md-12">
													<?php 
													if (count($lfm_topacts) > 0) 
													{
														foreach ($lfm_topacts as $act) 
														{
															echo Snippets::topActListRow($act['name'], $act['url'], $act['playcount'], $act['images']['medium'], $lfm_topacts[0]['playcount']);
														}
													}
													else
													{
														echo "Nothing to show here.";
													}
													?>
												</div>
											</div>
										</div>
										<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-1">
											<div class="row">
												<div class="col-md-12">
													<h2 class="h3">Top Musics</h2>
												</div>
												<div class="col-md-12">
													<?php 
													if (count($lfm_topmus) > 0) 
													{
														foreach ($lfm_topmus as $mus) 
														{
															echo Snippets::topAlbListRow($mus['name'], $mus['url'], $mus['playcount'], $mus['images']['medium'], $lfm_topmus[0]['playcount'], $mus['artist']['name'], $mus['artist']['url']);
														}
													}
													else
													{
														echo "Nothing to show here.";
													}
													?>
												</div>
											</div>
										</div>
										<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-2">
											<div class="row">
												<div class="col-md-12">
													<h2 class="h3">Top Albums</h2>
												</div>
												<div class="col-md-12">
													<?php 
													if (count($lfm_topalbs) > 0) 
													{
														foreach ($lfm_topalbs as $alb) 
														{
															echo Snippets::topAlbListRow($alb['name'], $alb['url'], $alb['playcount'], $alb['images']['medium'], $lfm_topalbs[0]['playcount'], $alb['artist']['name'], $alb['artist']['url']);
														}
													}
													else
													{
														echo "Nothing to show here.";
													}
													?>
												</div>
											</div>
										</div>
									</div>
								</div>							
						</div>
						<div class="col-md-4 col-sm-6 col-xs-12">
							<h2>STATS</h2>
							<small class="text-muted">Last.fm register date</small>
							<br/>
							<i class="fa fa-calendar fa-fw ico-color"></i>
							<?php echo $lfm_register;?>
							<br/>
							<small class="text-muted">Country</small>
							<br/>
							<i class="fa fa-flag-o fa-fw ico-color"></i>
							<?php echo $lfm_country;?>
							<br/>
							<small class="text-muted">Playcount</small>
							<br/>
							<i class="fa fa-play fa-fw ico-color"></i>
							<?php echo number_format($lfm_playcount);?>
							<br/>
							<small class="text-muted">Chart weeks</small>
							<br/>
							<i class="fa fa-calendar-check-o fa-fw ico-color"></i>
							<?php echo count($weeks);?>
							<hr>
							
						</div>
						<div class="col-md-4 col-sm-6 col-xs-12">
							<h2>RECENT</h2>
							<?php 
							if(count($recent) > 0)
							{
								foreach ($recent as $key => $value) 
								{
									echo Snippets::recentListRow($value['name'], $value['images']['medium'], $value['artist']['name'], $value['album']['name'], $value['url']);
								}
								echo "<a class='btn btn-danger btn-block' target='_blank' href='http://last.fm/user/{$user->login}/library'>View more <i class='fa fa-lastfm'></i></a>";
							}
							else
							{
								echo "Nothing to show here.";
							}
							?>
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>