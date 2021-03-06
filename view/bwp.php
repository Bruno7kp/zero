<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Utils\Functions as F;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} Charts");
	$this->render("ext/head.php", $head);
	$top = isset($top) ? $top : "1";
	$signal = isset($signal) ? $signal : ">=";
	$curRoute = Route::getName(Url::getRequest());
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
					<div class="row bottomspace-md text-center">
						<div class="col-xs-12">
							<h3 class="h3">
								<?php 
								switch ($signal) {
									case '=':
										$rest = " (".Lang::get("in")." #".$top.")";
										break;
									
									case '>':
										$rest = " (".Lang::get("out_of_top")." ".$top.")";
										break;

									case '<':
										if($top > 1){
											$rest = " (".Lang::get("inside_of_top")." ".($top-1).")";
										}else{
											$rest = "";
										}
										break;
									case '>=':
										if($top > 1){
											$rest = " (".Lang::get("out_of_top")." ".($top-1).")";
										}else{
											$rest = "";
										}
										break;
									case '<=':
										$rest = " (".Lang::get("inside_of_top")." ".$top.")";
										break;
								}
								echo Lang::get('big_one').$rest;
								?>
								
							</h3>
						</div>
					</div>
					<div class="row text-center">
						<div class="col-xs-12">
							<div class="btn-group" role="group">
								<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => 'artist', 'top' => $top, 'signal' => $signal));?>" class="no-margin btn btn-custom btn-info"><i class="ti-user"></i></a>
								<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => 'album', 'top' => $top, 'signal' => $signal));?>" class="no-margin btn btn-custom btn-info"><i class="icon-vynil except"></i></a>
								<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => 'music', 'top' => $top, 'signal' => $signal));?>" class="no-margin btn btn-custom btn-info"><i class="ti-music"></i></a>
							</div>
						</div>
					</div>
					<div class="row text-center topspace-sm">
						<div class="col-xs-12">
							<small><?php echo Lang::get("filter_rank");?></small>
							<br/>
							<div class="col-xs-3 col-xs-offset-3 col-sm-2 col-sm-offset-4 col-md-1 col-md-offset-5 text-center">
								<select class="form-control urlselector">
								<?php 
								$signs = array(">=", "<=", "=", ">", "<");
								foreach ($signs as $value) 
								{
								?>
								<option <?php echo ($signal == $value ? "selected='selected'" : "");?>value="<?php echo Route::url("bwp_at", array('login' => $user->login, 'type' => $type, 'top' => $top, 'signal' => $value));?>">
								<?php echo $value;?>
								</option>
								<?php
								}
								?>
								</select>
							</div>
							<div class="col-xs-3 col-sm-2 col-md-1">
								<select class="form-control urlselector">
								<?php 
								for ($i=0; $i < $limit; $i++) 
								{ 
								?>
								<option <?php echo ($top == $i+1 ? "selected='selected'" : "");?>value="<?php echo Route::url("bwp_at", array('login' => $user->login, 'type' => $type, 'top' => ($i+1), 'signal' => $signal));?>">
								<?php echo $i+1;?>
								</option>
								<?php
								}
								?>
								</select>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-10 col-md-offset-1 topspace-md">
						<?php
						if(is_array($list) && count($list) > 0)
						{
						?>
							<table class="table middle divider tablesorter">
								<thead>
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
								</thead>
								<tbody>
								<?php 
								$weekurl = Url::getBaseUrl()."/user/".$user->login."/charts/".$type."/week/";
								$itemurl = Url::getBaseUrl()."/user/".$user->login."/music/";
								foreach ($list as $key => $value) 
								{
									$week = $this->factory->findOneBy("B7KP\Entity\Week", $value->idweek);
									$url = $weekurl.$week->week;
									$rest = $type != "artist" ? $type == "album" ? "/".F::fixLFM($value->$type) : "/_/".F::fixLFM($value->$type) : "" ;
								?>
								<tr>
									<td class="text-center"><?php echo $key+1;?></td>
									<td>
										<a href=<?php echo $itemurl.F::fixLFM($value->artist).$rest;?>>
										<?php echo $value->$type; ?>
										</a>
									</td>
									<?php if($type != "artist") { ?>
									<td>
										<a href=<?php echo $itemurl.F::fixLFM($value->artist);?>>
										<?php echo $value->artist; ?>
										</a>
									</td>
									<?php } ?>
									<td class="text-center"><?php echo $value->playcount; ?></td>
									<td class="text-center"><?php echo $value->rank; ?></td>
									<td class="text-center">
										<a target="_blank" href="<?php echo $url;?>">
											<?php echo $week->week; ?>
										</a>
									</td>
								</tr>
								<?php 
								}
								?>
								</tbody>
							</table>
						<?php
						}
						else
						{
							echo "<h3 class='text-center'>".Lang::get("no_data")."</h3>";
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