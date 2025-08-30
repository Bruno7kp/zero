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
	$curRoute = Route::getName(Url::getRequest());
	$date = new DateTime($user->lfm_register);
	$startYear = intval($date->format("Y"));
	if ($startYear < 2000) {
		$startYear = 2000;
	}
	$currentYear = intval(date("Y"));
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
							<h3 class="h3"><?php echo Lang::get("big_num");?> Top <?php echo $rank;?></h3>
						</div>
					</div>
					<div class="row text-center">
						<div class="col-xs-12">
							<div class="btn-group" role="group">
								<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => 'artist', 'rank' => $rank, 'year' => $year));?>" class="no-margin btn btn-custom btn-info"><i class="ti-user"></i></a>
								<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => 'album', 'rank' => $rank, 'year' => $year));?>" class="no-margin btn btn-custom btn-info"><i class="icon-vynil except"></i></a>
								<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => 'music', 'rank' => $rank, 'year' => $year));?>" class="no-margin btn btn-custom btn-info"><i class="ti-music"></i></a>
							</div>
							<br>
							<div class="btn-group topspace-xs">
								<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => $type, 'rank' => 1, 'year' => $year));?>" class="no-margin btn btn-custom btn-sm btn-info">#1</a>
								<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => $type, 'rank' => 5, 'year' => $year));?>" class="no-margin btn btn-custom btn-sm btn-info">Top 5</a>
								<?php 
								$typelimit = substr($type, 0, 3)."_limit";
								$limits = array(10, 15, 20, 25, 30, 40, 50);
								foreach ($limits as $value) 
								{
									if($settings->$typelimit >= $value)
									{
								?>
									<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => $type, 'rank' => $value, 'year' => $year));?>" class="no-margin btn btn-custom btn-sm btn-info">Top <?php echo $value?></a>

								<?php
									}
								}
								?>
							</div>
						</div>
					</div>
					<div class="row topspace-sm">
						<div class="col-xs-12">
							<div class="row">
								<div class="col-xs-12 text-center">
									<small><?php echo Lang::get("filter_year");?></small>
								</div>
								<div class="col-xs-4 col-xs-offset-4 col-sm-2 col-sm-offset-5 col-md-2 col-md-offset-5 text-center">
									<select class="form-control urlselector">
										<option value="<?php echo Route::url(str_replace("_year", "", $curRoute), array('login' => $user->login, 'type' => $type, 'rank' => $rank));?>"><?php echo Lang::get("all");?></option>
									<?php 
									while ($startYear <= $currentYear) 
									{
									?>
									<option <?php echo ($startYear == $year ? "selected='selected'" : "");?>value="<?php echo Route::url("mwa_year", array('login' => $user->login, 'type' => $type, 'rank' => $rank, 'year' => $startYear));?>">
									<?php echo $startYear;?>
									</option>
									<?php
										$startYear++;
									}
									?>
									</select>
								</div>
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
									<?php if($type != "artist")  { ?>
									<th><?php echo Lang::get('title');?></th>
									<?php } ?>
									<th><?php echo Lang::get('art');?></th>
									<th class="text-center">Total</th>
								</tr>								
								</thead>
								<tbody>
								<?php 
								$itemurl = Url::getBaseUrl()."/user/".$user->login."/music/";
								$weekurl = Url::getBaseUrl()."/user/".$user->login."/charts/".$type."/week/";
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
										<?php echo htmlentities($value->$type); ?>
										</a>
									</td>
									<?php if($type != "artist") { ?>
									<td>
										<a href=<?php echo $itemurl.F::fixLFM($value->artist);?>>
										<?php echo htmlentities($value->artist); ?>
										</a>
									</td>
									<?php } ?>
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