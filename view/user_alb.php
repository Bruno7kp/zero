<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
use B7KP\Utils\UserSession;
use B7KP\Utils\Certified;
use B7KP\Utils\Constants as C;
use B7KP\Utils\Snippets as S;
use B7KP\Utils\Functions as F;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} - ".$album["album"]);
	$this->render("ext/head.php", $head);

	$c = new Certified($user, $this->factory);

	$name = $album["album"];
	$artist = $album["artist"];
	$plays =  $album["userplaycount"];
	$totalwks = $album["stats"]["stats"]["alltime"]["weeks"]["total"];
	$points = $album["stats"]["stats"]["alltime"]["overall"]["chartpoints"];
	$totalwks = empty($totalwks) ? "N/C" : $totalwks;
	$peak = $album["stats"]["stats"]["alltime"]["overall"]["peak"];
	$peak = empty($peak) ? "N/C" : $peak;
	$times = $peak > 0 ? "(".$album["stats"]["stats"]["alltime"]["rank"][$peak]."x)" : "";
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
							<img data-fabric="<?php echo md5($name . $artist);?>" class="img-responsive" src="<?php echo $album['img'];?>">
						</div>
						<div class="col-xs-8 col-sm-9 col-md-10">
							<h2 class="no-margin"><?php echo $name;?></h2>
							<h3><?php echo Lang::get("by");?> <a href=<?php echo Route::url("lib_art", array("login" => $user->login, "name" => F::fixLFM($artist)));?>><?php echo $artist;?></a>
							<?php 
							$session = UserSession::getUser($this->factory);
							if($session && $session->id != $user->id)
							{
							?>
							<small> • <a href="<?php echo Route::url('lib_alb', array("login" => $session->login, "name" => F::fixLFM($name), "artist" => F::fixLFM($artist)));?>"><?php echo Lang::get("view_in_your");?></a></small>
							<?php
							}
							?>
							</h3>
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
								<?php 
								if($settings->show_points > 0)
								{
								?>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted"><?php echo Lang::get('pt_x');?></small>
									<br>
									<strong>
										<i class="ti-bar-chart-alt ico-color"></i>
										<?php echo $points;?>			
									</strong>
								</div>
                                <div class="col-md-2 col-sm-3 col-xs-6 text-center">
                                    <small class="text-muted"><?php echo empty($settings->custom_unity) ? Lang::get('both_x') : $settings->custom_unity;?></small>
                                    <br>
                                    <strong>
                                        <i class="ti-bar-chart-alt ico-color"></i>
                                        <?php echo ($points * $settings->weight_alb_pts) + ($plays * $settings->weight_alb_pls);?>
                                    </strong>
                                </div>
								<?php
								}
								?>
								<?php
                                $cert_type = "";
                                switch ($settings->cert_type){
                                    case "2":
                                        $pts = ($points * $settings->weight_alb_pts) + ($plays * $settings->weight_alb_pls);
                                        $cert_type = empty($settings->custom_unity) ? Lang::get('both_x') : $settings->custom_unity;
                                        break;
                                    case "1":
                                        $pts = $points;
                                        $cert_type = Lang::get("pt_x");
                                        break;
                                    default:
                                        $pts = $plays;
                                        $cert_type = Lang::get("play_x");
                                        break;
                                }
								if($settings->show_cert > 0)
								{
								?>
								<div class="col-md-2 col-sm-3 col-xs-6 text-center">
									<small class="text-muted"><?php echo Lang::get('cert_s');?></small>
									<br>
									<?php
									$txt = $c->getCertification("album", $pts, "text+icon");
									echo " <strong>".$txt."</strong>"; 
									?>
								</div>
								<?php
								}
								?>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-12">
							<hr/>
						</div>
					</div>
					<?php
					echo S::chartRun("album", $album["stats"]["chartrun"], $user, $album["stats"]["stats"]["alltime"], $limit, $name, $artist);
					?>
					<div class="row">
						<div class="col-md-12">
							<hr/>
						</div>
					</div>
					<div class="row">
						<div class="col-md-12">
							<?php 
							if($settings->show_cert > 0 && $settings->show_plaque)
							{
								if($user->checkSelfPermission($this->factory) && $c->getCertification("album", $pts, "text") != Lang::get('none'))
								{

							?>
							<button class="btn btn-custom btn-info btn-sm"
                                    data-plaque="default"
                                    data-type="album"
                                    data-name="<?php echo htmlentities($name, ENT_QUOTES);?>"
                                    data-artist="<?php echo htmlentities($artist, ENT_QUOTES);?>"
                                    data-image="<?php echo $album['img'];?>" data-login="<?php echo $settings->cert_name;?>"
                                    data-points="<?php echo $pts;?>"
                                    data-text="<?php echo $c->getCertification("album", $pts, "text");?>"
                                    data-disc="<?php echo $c->getCertification("album", $pts, "image");?>"
                                    data-value="<?php echo $c->getValueByCert("album", $pts)."+ ".($cert_type);?>"
                            >
                                <?php echo Lang::get("gen_plaque");?>
                            </button>
							<?php
								}
								$plaques = $c->getPlaque("album", $name, $artist);
								if(count($plaques) > 0)
								{
							?>
								<button class="btn btn-custom btn-info btn-sm" type="button" data-toggle="collapse" data-target="#collapsecertified" aria-expanded="false" aria-controls="collapsecertified">
								  	<?php echo Lang::get("plaque");?>
								</button>
								<div class="collapse" id="collapsecertified">
								  	<div class="well">
								  		<div class="row">
							<?php
									foreach ($plaques as $key => $value) {
										echo "<div class='col-md-4 col-sm-6 col-xs-12 bottomspace-md col-plaque'>
										<img class='img-responsive bottomspace-xs' src='".$value->url."'>";
										if($user->checkSelfPermission($this->factory))
										{
											echo "<button class='btn btn-custom btn-sm btn-danger remove-plaque' data-id='".$value->id."'><i class='fa fa-times'></i></button>";
										}
										echo "</div>";
									}
							?>
								  		</div>
								  	</div>
								</div>
							<?php
								}
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