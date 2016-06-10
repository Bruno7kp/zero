<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
use B7KP\Utils\Constants as C;
use B7KP\Utils\Snippets as S;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} - ".Lang::get("art_x"));
	$this->render("ext/head.php", $head);
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
					<div class="row">
						<div class="col-md-12 topspace-md">
						<?php
						if(is_array($list) && count($list) > 0)
						{
						?>
							<table class="chart-table table-fluid topspace-md">

								<tr>
									<th class="text-center">#</th>
									<th class="text-center">Img</th>
									<th><?php echo Lang::get('art');?></th>
									<th class="text-center"><?php echo Lang::get('play_x');?></th>
									<th class="text-center"><?php echo Lang::get('wk_x');?></th>
									<th class="text-center"><?php echo Lang::get('pk');?></th>
									<th class="text-center"><?php echo Lang::get('wk_min')." ".Lang::get('at')." ".Lang::get('pk');?></th>
								</tr>								


								<?php 
								foreach ($list as $value) 
								{
								?>
								<tr>
									<td class="text-center rk-col"><?php echo $value["rank"];?></td>
									<td class="text-center">
										<img class="img-circle" src="<?php echo $value["img"]; ?>" height="60">
									</td>
									<td><?php echo $value["artist"]; ?></td>
									<td class="text-center rk-col"><?php echo $value["playcount"]; ?></td>
									<td class="text-center rk-col"><?php echo $value["stats"]["stats"]["alltime"]["weeks"]["total"]; ?></td>
									<td class="text-center rk-col"><?php $peak = $value["stats"]["stats"]["alltime"]["overall"]["peak"]; echo $peak; ?></td>
									<td class="text-center"><?php echo $value["stats"]["stats"]["alltime"]["rank"][$peak]; ?></td>
								</tr>
								<?php 
								}
								$cond = array("login" => $user->login);
								$totalpages = $info->totalPages;
								?>

							</table>
							<div class="row topspace-md">
								<div class="col-xs-12">
									<?php 
									if($page > 2)
									{
									?>
										<a class="btn btn-custom btn-sm divider" href="<?php echo Route::url('lib_art_list', $cond)."?page=1";?>"><i class="ti-angle-double-left"></i></a>
									<?php
									}
									?>

									<?php 
									if($page > 1)
									{
									?>
										<a class="btn btn-custom btn-sm divider" href="<?php echo Route::url('lib_art_list', $cond)."?page=".($page-1);?>"><i class="ti-angle-left"></i></a>
									<?php
									}
									?>
									<a class="btn btn-custom btn-sm divider disabled" href="<?php echo Route::url('lib_art_list', $cond)."?page=".$page;?>"><?php echo $page;?></a>

									<?php 
									if($totalpages > $page)
									{
									?>
										<a class="btn btn-custom btn-sm divider" href="<?php echo Route::url('lib_art_list', $cond)."?page=".($page+1);?>"><i class="ti-angle-right"></i></a>
									<?php
									}
									?>

									<?php 
									if($totalpages > 1 && ($totalpages - $page) >= 2)
									{
									?>
										<a class="btn btn-custom btn-sm divider" href="<?php echo Route::url('lib_art_list', $cond)."?page=".$totalpages;?>"><i class="ti-angle-double-right"></i></a>
									<?php
									}
									?>
								</div>
							</div>
							<?php 

							?>
						<?php
						}
						else
						{

							echo "<div class='bottomspace-mega'>".Lang::get("no_data")."</div>";
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