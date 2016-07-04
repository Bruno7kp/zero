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
								echo Lang::get('big_one_cert')." (".Lang::get(substr($type, 0, 3)."_x").")";
								?>
								
							</h3>
						</div>
					</div>
					<div class="row text-center">
						<div class="col-xs-12">
							<div class="btn-group" role="group">
								<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => 'album'));?>" class="no-margin btn btn-custom btn-info"><i class="ti-user"></i> <i class="icon-vynil except"></i></a>
								<a href="<?php echo Route::url($curRoute, array('login' => $user->login, 'type' => 'music'));?>" class="no-margin btn btn-custom btn-info"><i class="ti-user"></i> <i class="ti-music"></i></a>
							</div>
						</div>
					</div>
					<div class="row text-center topspace-md">
						<div class="col-xs-12">
							<div class="btn-group" role="group">
								<a href="#!" class="btn-info btn-sm" id="nid"><?php echo Lang::get("sum");?></a>
								<a href="#!" class="btn-info btn-sm" id="uid"><?php echo Lang::get("unique");?></a>
								<a href="#!" class="btn-info btn-sm" id="wid"><?php echo Lang::get("weighted");?></a>
							</div>
							<p class="topspace-md nclass min">
								<big><b><?php echo Lang::get("sum");?></b></big>
								<a href="#exp"><i class="ti-help"></i></a>
							</p>
							<p class="topspace-md uclass min" style="display: none;">
								<big><b><?php echo Lang::get("unique");?></b></big>
								<a href="#exp"><i class="ti-help"></i></a>
							</p>
							<p class="topspace-md wclass min" style="display: none;">
								<big><b><?php echo Lang::get("weighted");?></b></big>
								<a href="#exp"><i class="ti-help"></i></a>
								<br>
								<b><?php echo Lang::get("weight");?></b><br/>
								<?php echo Lang::get("gold").": <b>".$weight["g"]."</b>";?>
								<?php echo Lang::get("plat").": <b>".$weight["p"]."</b>";?>
								<?php echo Lang::get("diam").": <b>".$weight["d"]."</b>";?>
							</p>
						</div>
					</div>
					<div class="row">
						<div class="col-md-12 topspace-md">
						<?php
						if(is_array($list) && count($list) > 0)
						{
						?>
							<table class="table middle divider tablesorter">
								<thead>
								<tr>
									<th class="text-center">#</th>
									<th><?php echo Lang::get('art');?></th>
									<th class="text-center nclass"><?php echo Lang::get('gold');?></th>
									<th class="text-center nclass"><?php echo Lang::get('plat');?></th>
									<th class="text-center nclass"><?php echo Lang::get('diam');?></th>
									<th class="text-center nclass"><?php echo Lang::get('total');?></th>
									<th class="text-center uclass" style="display: none;"><?php echo Lang::get('gold');?></th>
									<th class="text-center uclass" style="display: none;"><?php echo Lang::get('plat');?></th>
									<th class="text-center uclass" style="display: none;"><?php echo Lang::get('diam');?></th>
									<th class="text-center uclass" style="display: none;"><?php echo Lang::get('total');?></th>
									<th class="text-center wclass" style="display: none;"><?php echo Lang::get('gold');?></th>
									<th class="text-center wclass" style="display: none;"><?php echo Lang::get('plat');?></th>
									<th class="text-center wclass" style="display: none;"><?php echo Lang::get('diam');?></th>
									<th class="text-center wclass" style="display: none;"><?php echo Lang::get('total');?></th>
								</tr>								
								</thead>
								<tbody>
								<?php 
								$itemurl = Url::getBaseUrl()."/user/".$user->login."/library/";
								$i = 1;
								foreach ($list as $key => $value) 
								{
								?>
								<tr>
									<td class="text-center"><?php echo $i;?></td>
									<td>
										<a href=<?php echo $itemurl.F::fixLFM($key)."/".$type;?>>
										<?php echo $key; ?>
										</a>
									</td>
									<td class="text-center nclass"><?php echo $value["g"]; ?></td>
									<td class="text-center nclass"><?php echo $value["p"]; ?></td>
									<td class="text-center nclass"><?php echo $value["d"]; ?></td>
									<td class="text-center nclass"><?php echo $value["total"]; ?></td>
									<td class="text-center uclass" style="display: none;"><?php echo $value["ug"]; ?></td>
									<td class="text-center uclass" style="display: none;"><?php echo $value["up"]; ?></td>
									<td class="text-center uclass" style="display: none;"><?php echo $value["ud"]; ?></td>
									<td class="text-center uclass" style="display: none;"><?php echo $value["utotal"]; ?></td>
									<td class="text-center wclass" style="display: none;"><?php echo $value["wg"]; ?></td>
									<td class="text-center wclass" style="display: none;"><?php echo $value["wp"]; ?></td>
									<td class="text-center wclass" style="display: none;"><?php echo $value["wd"]; ?></td>
									<td class="text-center wclass" style="display: none;"><?php echo $value["wtotal"]; ?></td>
								</tr>
								<?php 
									$i++;
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
					<div class="row text-justify" id="exp">
						<div class="col-md-4 topspace-md bottomspace-md">
							<b><?php echo Lang::get("sum");?></b>
							<br/>
							<small>
							<?php echo Lang::get("sum_exp");?>
							</small>
						</div>
						<div class="col-md-4 topspace-md bottomspace-md">
							<b><?php echo Lang::get("unique");?></b>
							<br>
							<small>
							<?php echo Lang::get("unique_exp");?>
							</small>
						</div>
						<div class="col-md-4 topspace-md bottomspace-md">
							<b><?php echo Lang::get("weighted");?></b>
							<br>
							<small>
							<?php echo Lang::get("weighted_exp");?>
							</small>
						</div>
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>