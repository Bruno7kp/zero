<?php
use B7KP\Utils\Snippets;
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
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php");?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-md text-center">
						<div class="col-xs-12">
							<h1 class="h3"><?php echo $user->login;?> Charts</h1>
							<h3 class="h3"><?php echo Lang::get('big_one');?></h3>
						</div>
					</div>
					<div class="row text-center">
						<div class="col-xs-12">
							<div class="btn-group" role="group">
								<a href="<?php echo Route::url('chart_list', array('login' => $user->login));?>" class="no-margin btn btn-custom btn-success"><i class="ti-stats-up"></i></a>
								<a href="<?php echo Route::url('bwp', array('login' => $user->login, 'type' => 'artist'));?>" class="no-margin btn btn-custom btn-info"><i class="ti-user"></i></a>
								<a href="<?php echo Route::url('bwp', array('login' => $user->login, 'type' => 'album'));?>" class="no-margin btn btn-custom btn-info"><i class="icon-vynil except"></i></a>
								<a href="<?php echo Route::url('bwp', array('login' => $user->login, 'type' => 'music'));?>" class="no-margin btn btn-custom btn-info"><i class="ti-music"></i></a>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-8 col-md-offset-2 topspace-md">
						<?php
						if(is_array($list) && count($list) > 0)
						{
						?>
							<table class="table middle divider">
								<tr>
									<th class="text-center">#</th>
									<?php if($type != "artist")  { ?>
									<th><?php echo Lang::get('title');?></th>
									<?php } ?>
									<th><?php echo Lang::get('art');?></th>
									<th class="text-center"><?php echo Lang::get('play_x');?></th>
									<th class="text-center"><?php echo Lang::get('rk');?></th>
									<th class="text-center"><?php echo Lang::get('wk');?></th>
								</tr>								
								<?php 
								$weekurl = Url::getBaseUrl()."/user/".$user->login."/charts/".$type."/week/";
								foreach ($list as $key => $value) 
								{
									$week = $this->factory->findOneBy("B7KP\Entity\Week", $value->idweek);
									$url = $weekurl.$week->week;
								?>
								<tr>
									<td class="text-center"><?php echo $key+1;?></td>
									<td><?php echo $value->$type; ?></td>
									<?php if($type != "artist") { ?>
									<td><?php echo $value->artist; ?></td>
									<?php } ?>
									<td class="text-center"><?php echo $value->playcount; ?></td>
									<td class="text-center"><?php echo $value->rank; ?></td>
									<td class="text-center">
										<?php echo $week->week; ?>
										<small><a target="_blank" href="<?php echo $url;?>"><i class="ti-new-window"></i></a></small>
									</td>
								</tr>
								<?php 
								}
								?>
							</table>
						<?php
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