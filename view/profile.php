<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login}");
	$this->render("ext/head.php", $head);
	$blockalt = "<h3>
					<a class='white' href=''>".$user->login."</a> 
					<a href='http://last.fm/user/{$user->login}' class='white-hover' title='View Last.fm profile' target='_blank'>
						<i class='fa fa-lastfm'></i>
					</a>
				</h3>
				";
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
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row">
						<div class="col-md-2 col-sm-3 col-xs-6 text-center">
							<small class="text-muted"><?php echo Lang::get('reg_alt');?></small>
							<br/>
							<strong>
							<i class="fa fa-calendar fa-fw ico-color"></i>
								<?php echo $lfm_register;?>
							</strong>
						</div>
						<div class="col-md-2 col-sm-3 col-xs-6 text-center">
							<small class="text-muted"><?php echo Lang::get('scr');?></small>
							<br/>
							<strong>
							<i class="ti-control-play ico-color"></i>
							<?php echo number_format($lfm_playcount);?>
							</strong>
						</div>
						<div class="col-md-2 col-sm-3 col-xs-6 text-center">
							<small class="text-muted"><?php echo Lang::get('wk_x');?></small>
							<br/>
							<strong>
							<i class="fa fa-calendar-check-o fa-fw ico-color"></i>
							<?php echo count($weeks);?>
							</strong>
						</div>
						<div class="col-md-2 col-sm-3 col-xs-6 text-center">
							<small class="text-muted"><?php echo Lang::get('scr');?>/<?php echo Lang::get('wk');?></small>
							<br/>
							<strong>
							<i class="ti-headphone ico-color"></i>
							<?php echo $average;?>
							</strong>
						</div>
						<div class="col-xs-12 bottomspace-md">
							<hr>
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
									echo "<div class='alert alert-info'>".Lang::get('new_on')."</div>";
								}
								elseif($outofdateweeks > 0)
								{
									echo "<div class='alert alert-info'>".Lang::get('hello').", ".Lang::get('u')." ".Lang::get('hv')." ".$outofdateweeks." ".Lang::get('wk')."(s) ".Lang::get('desatt').", <a href='".Route::url("update")."'>".Lang::get('update')." ".Lang::get('now')."?</a></div>";
								}
							}
							if(count($weeks) <= 0)
							{
								echo "<div class='alert alert-warning'>".Lang::get('no_data')."</div>";
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
									<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-0" role="tab" style=""><i class="fh5co-tab-menu-icon ti-user"></i>&nbsp;<span class="hidden-sm"><?php echo Lang::get('art');?></span></li>
									<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-1" role="tab" style=""><i class="fh5co-tab-menu-icon ti-music"></i>&nbsp;<span class="hidden-sm"><?php echo Lang::get('mus');?></span></li>
									<li class="resp-tab-item hor_1" aria-controls="hor_1_tab_item-2" role="tab" style=""><i class="fh5co-tab-menu-icon icon-vynil except"></i>&nbsp;<span class="hidden-sm"><?php echo Lang::get('alb');?></span></li>
								</ul>
								<div class="resp-tabs-container hor_1 divider-lr divider-bottom">
									<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-0" style="">
										<div class="row">
											<div class="col-md-12">
												<h2 class="h3">Top <?php echo Lang::get('art_x');?></h2>
											</div>
											<div class="col-md-12 top-artists">
												<?php echo Snippets::loader(50);?>
											</div>
										</div>
									</div>
									<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-1">
										<div class="row">
											<div class="col-md-12">
												<h2 class="h3">Top <?php echo Lang::get('mus_x');?></h2>
											</div>
											<div class="col-md-12 top-musics">
												<?php echo Snippets::loader(50);?>
											</div>
										</div>
									</div>
									<div class="resp-tab-content hor_1" aria-labelledby="hor_1_tab_item-2">
										<div class="row">
											<div class="col-md-12">
												<h2 class="h3">Top <?php echo Lang::get('alb_x');?></h2>
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