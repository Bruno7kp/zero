<?php
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
use B7KP\Utils\UserSession;
?>
<!doctype html>
<html>
<?php
	$lang = substr($type, 0, 3)."_x";
	$title 	= $user->login." :: Top ".Lang::get($lang)." - ".Lang::get('wk')." ".$week->week;
	$head 	= array("title" => $title);
	$this->render("ext/head.php", $head);
	$from 	= new DateTime($week->from_day);
	$from 	= $from->format("Y.m.d");
	$to 	= new DateTime($week->to_day);
	$to->modify('-1 day');
	$to 	= $to->format("Y.m.d");
	$weeks = $this->factory->find("\B7KP\Entity\Week", array("iduser" => $user->id), "week ASC");
	$last = end($weeks);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("image" => $lfm_bg));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-xxl text-center">
						<div class="col-xs-12">
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row">
						<div class="col-md-6 topspace-sm">
							<?php if($week->week > 1): ?> 
							<a class="btn btn-outline" href="<?php echo Route::url('weekly_chart', array('login' => $user->login, 'type' => $type, 'week' => ($week->week - 1)));?>">
								<i class='ti-arrow-left'></i> 
								<span class="hidden-xs"><?php echo Lang::get('previous');?></span>
							</a>
							<?php ; endif;?>

							<div class="btn-group">
							  	<button type="button" class="btn btn-outline dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							  		<span class="ti-calendar"></span>
  								</button>
  								<ul class="dropdown-menu min-165">
								    <?php 
								    $weeks = array_reverse($weeks);
								    $u = Url::getBaseUrl()."/user/".$user->login."/charts/".$type."/week/";
								    foreach ($weeks as $key => $value) {
								    	$d = new DateTime($value->to_day);
								    	$d->modify('-1 day');
								    	echo "<li><a href='".$u.$value->week."'>".$value->week." | ".$d->format('Y.m.d')."</a></li>";
								    }
								    ?>
  								</ul>
							</div>

							<?php if($last->week != $week->week): ?> 
							<a class="btn btn-outline" href="<?php echo Route::url('weekly_chart', array('login' => $user->login, 'type' => $type, 'week' => ($week->week + 1)));?>">
								<span class="hidden-xs"><?php echo Lang::get('next');?> </span>
								<i class='ti-arrow-right'></i>
							</a>
							<?php ; endif;?>
						</div>
						<div class="col-md-6 text-right">
							<a class="btn btn-outline" href="<?php echo Route::url('weekly_chart', array('login' => $user->login, 'type' => 'artist', 'week' => $week->week));?>"><i class='ti-user'></i></a>
							<a class="btn btn-outline" href="<?php echo Route::url('weekly_chart', array('login' => $user->login, 'type' => 'album', 'week' => $week->week));?>"><i class='icon-vynil except'></i></a>
							<a class="btn btn-outline" href="<?php echo Route::url('weekly_chart', array('login' => $user->login, 'type' => 'music', 'week' => $week->week));?>"><i class='ti-music'></i></a>
						</div>
					</div>
					<div class="row">
						<div id="copyme" class="col-md-12">
							<div class="text-center">
								<h2><?php echo $title?></h2>
								<h5><strong><?php echo $from . " - " . $to;?></strong></h5>
								<?php echo $list;?>
							</div>
						</div>
						<div class="col-md-6 topspace-lg">
							<button class="btn btn-custom btn-info btn-sm" id="copy" data-clipboard-target="#copyme">
								<i class="ti-clipboard"></i> <span><?php echo Lang::get('copy');?> chart</span>
							</button>
							<button class="btn btn-custom btn-info btn-sm showonhover" id="copy_alt" data-clipboard-target="#copyme_alt">
								<i class="ti-clipboard"></i> <span class="hidden"><?php echo Lang::get('copy_w');?></span>
							</button>
							<?php 
							
							if($user->checkSelfPermission($this->factory))
							{
								$gmt = new \DateTimeZone("GMT");
								$from = new \DateTime($week->from_day, $gmt);
								$to = new \DateTime($week->to_day, $gmt);
							?>
							<br>
							<button class="btn btn-custom btn-info btn-sm upwk" data-from="<?php echo $from->format("U");?>" data-to="<?php echo $to->format("U");?>">
								<i class="ti-reload"></i> <span> <?php echo Lang::get('update');?> chart </span>
							</button>
							<button class="btn btn-custom btn-info btn-sm editwk" data-id="<?php echo $week->id;?>" data-type="<?php echo $type;?>">
								<i class="ti-pencil"></i> <span> <?php echo Lang::get('edit');?> chart </span>
							</button>
							<?php
							}
							?>
						</div>
						<div class="col-md-6 topspace-lg">
							<div class="chart-table">
								<small>
									<span class="deb">NEW</span> = <?php echo Lang::get('new_def');?> | 
									<span class="ret">RE</span> = <?php echo Lang::get('re_def');?> | 
									<span>LW</span> = <?php echo Lang::get('lw_def');?>
								</small>
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