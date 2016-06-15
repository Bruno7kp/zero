<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
use B7KP\Utils\Constants as C;
use B7KP\Utils\Functions as F;
use B7KP\Utils\Snippets as S;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} - ".$artist["artist"]);
	$this->render("ext/head.php", $head);

	$name = $artist["artist"];
	$plays =  $artist["userplaycount"];
	$totalwks = $artist["stats"]["stats"]["alltime"]["weeks"]["total"];
	$totalwks = empty($totalwks) ? "N/C" : $totalwks;
	$peak = $artist["stats"]["stats"]["alltime"]["overall"]["peak"];
	$peak = empty($peak) ? "N/C" : $peak;
	$times = $peak > 0 ? "(".$artist["stats"]["stats"]["alltime"]["rank"][$peak]."x)" : "";
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
					<div class="row topspace-md">
						<div class="col-xs-4 col-sm-3 col-md-2">
							<img class="img-circle img-responsive" src="<?php echo $artist['img'];?>">
						</div>
						<div class="col-xs-8 col-sm-9 col-md-10">
							<h2><?php echo $name;?></h2>
							<div class="row">
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted"><?php echo Lang::get('play_x');?></small>
									<br>
									<strong>
										<i class="ti-control-play ico-color"></i>
										<?php echo $plays;?>					
									</strong>
								</div>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted"><?php echo Lang::get('wk_x');?></small>
									<br>
									<strong>
										<i class="fa fa-calendar fa-fw ico-color"></i>
										<?php echo $totalwks?>					
									</strong>
								</div>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted"><?php echo Lang::get('pk');?></small>
									<br>
									<strong>
										<i class="ti-stats-up ico-color"></i>
										<?php echo $peak;?>
										<small class="text-muted">
											<?php echo $times;?>		
										</small>			
									</strong>
								</div>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-12">
							<hr/>
						</div>
					</div>
					<div class="row">
						<div class="col-md-8">
							<h3><?php echo Lang::get("mus_x")." ".Lang::get("of")." <a href='".Route::url('lib_art', array("login" => $user->login, "name" => F::fixLFM($name)))."'>".$name."</a>";?></h3>
							<?php
							if(count($music) > 0)
							{
								echo "	<table class='table middle tablesorteralt'>";
								echo "	<thead>
											<tr>
												<th class=text-center>".Lang::get('pk')."</th>
												<th>
													".Lang::get("mus")."
												</th>
												<th class=text-center>".Lang::get('wk_x')."</th>
												<th class=text-center>".Lang::get('play_x')."</th>
											</tr>
										<thead>
										<tbody class=large>";
								foreach ($music as $item) 
								{
									echo "<tr>";
										echo "<td class='text-center'>";
											echo $item->peak;
										echo "</td>";
										echo "<td>";
											echo "<a class='mg-5' href=".Route::url('lib_mus', array("login" => $user->login, "artist" => F::fixLFM($name), "name" => F::fixLFM($item->music))).">".$item->music."</a>";
										echo "</td>";
										echo "<td class='text-center'>";
											echo $item->weeks;
										echo "</td>";
										echo "<td id='".md5($item->music)."' class='text-center loadplaycount' data-type='music' data-login=".$user->login." data-name='".htmlentities($item->music, ENT_QUOTES)."'' data-artist='".htmlentities($name, ENT_QUOTES)."'>";
											//echo $item->weeks;
										echo "</td>";
									echo "</tr>";

								}
								echo "</tbody></table>";
							}
							else
							{
								echo Lang::get("no_mus");
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