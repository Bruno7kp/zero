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
	$mintype = substr($type, 0, 3);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("image" => $lfm_bg));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-md text-center">
						<div class="col-xs-12">
							<h1 class="h3"><?php echo $user->login;?> Charts</h1>
							<h3 class="h3"><?php echo Lang::get("big_n")." ".mb_strtolower(Lang::get($mintype.'_x'))." ".Lang::get('on');?>  Top <?php echo $rank;?></h3>
						</div>
					</div>
					<div class="row text-center">
						<div class="col-xs-12">
							<div class="btn-group" role="group">
								<a href="<?php echo Route::url('chart_list', array('login' => $user->login));?>" class="no-margin btn btn-custom btn-success"><i class="ti-stats-up"></i></a>
								<a href="<?php echo Route::url('mia', array('login' => $user->login, 'type' => 'album', 'rank' => $rank));?>" class="no-margin btn btn-custom btn-info"><i class="ti-user"></i><i class="icon-vynil except"></i></a>
								<a href="<?php echo Route::url('mia', array('login' => $user->login, 'type' => 'music', 'rank' => $rank));?>" class="no-margin btn btn-custom btn-info"><i class="ti-user"></i><i class="ti-music"></i></a>
							</div>
							<br>
							<div class="btn-group topspace-xs">
								<a href="<?php echo Route::url('mia', array('login' => $user->login, 'type' => $type, 'rank' => 1));?>" class="no-margin btn btn-custom btn-sm btn-info">#1</a>
								<a href="<?php echo Route::url('mia', array('login' => $user->login, 'type' => $type, 'rank' => 5));?>" class="no-margin btn btn-custom btn-sm btn-info">Top 5</a>
								<?php 
								$typelimit = substr($type, 0, 3)."_limit";
								$limits = array(10, 15, 20, 25, 30, 40, 50);
								foreach ($limits as $value) 
								{
									if($settings->$typelimit >= $value)
									{
								?>
									<a href="<?php echo Route::url('mia', array('login' => $user->login, 'type' => $type, 'rank' => $value));?>" class="no-margin btn btn-custom btn-sm btn-info">Top <?php echo $value?></a>

								<?php
									}
								}
								?>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-8 col-md-offset-2 topspace-md">
						<?php
						if(is_array($list) && count($list) > 0)
						{
						?>
							<table class="table middle divider tablesorter">
							<thead>
								<tr>
									<th class="text-center">#</th>
									<th><?php echo Lang::get('art');?></th>
									<th class="text-center"><?php echo Lang::get($mintype.'_x');?></th>
									<th class="text-center"><?php echo "Total ".Lang::get('of')." ".mb_strtolower(Lang::get('wk_x'));?></th>
								</tr>								
							</thead>
							<tbody>
								<?php 
								$weekurl = Url::getBaseUrl()."/user/".$user->login."/charts/".$type."/week/";
								foreach ($list as $key => $value) 
								{
									$week = $this->factory->findOneBy("B7KP\Entity\Week", $value->idweek);
									$url = $weekurl.$week->week;
								?>
								<tr>
									<td class="text-center"><?php echo $key+1;?></td>
									<td><?php echo $value->artist; ?></td>
									<td class="text-center"><?php echo $value->uniques; ?></td>
									<td class="text-center"><?php echo $value->total; ?></td>
								</tr>
								<?php 
								}
								?>
							</tbody>
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