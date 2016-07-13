<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
use B7KP\Library\Url;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get("stats"));
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php");?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row">
						<div class="col-md-10 col-md-offset-1 text-center">
							<div class="">
								<img src="http://i.imgur.com/m0l8YGA.png" alt="ZERO" height="100">
								<hr>
								<div class="row fh5co-feature-2">
									<div class="col-md-12 bottomspace-lg fh5co-feature-item">
										<span class="fh5co-feature-icon"><i class="ti-headphone"></i></span>
										<h3 class="h3"><?php echo mb_strtoupper(Lang::get("user_x"));?></h3>
										<div class="row">
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo $user_total;?></h3>
												<small class="text-muted">TOTAL DE USUÁRIOS</small>
											</div>
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo "<a target='_blank' href=".Route::url("profile", array("login" => $user_last->login)).">".$user_last->login."</a>";?></h3>
												<small class="text-muted">ÚLTIMO CADASTRO</small>
											</div>
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo $weeks_total;?></h3>
												<small class="text-muted">CHARTS SEMANAIS</small>
											</div>
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo "<a target='_blank' href=".Route::url("profile", array("login" => $user_weeks->login)).">".$user_weeks->login."</a> (".$user_weeks->t.")";?></h3>
												<small class="text-muted">USUÁRIO COM MAIS CHARTS</small>
											</div>
										</div>
										<hr>
									</div>
									<div class="col-md-12 bottomspace-lg">
										<span class="fh5co-feature-icon"><i class="icon-vynil"></i></span>
										<div class="row">
											<h3 class="h3 topspace-md">CERTIFICADOS</h3>
											<h3 class="h3 no-margin"><?php echo mb_strtoupper(Lang::get("pt_x"))." vs ".mb_strtoupper(Lang::get("play_x")) ;?></h3>
											<p>Porcentagem de usuários que utilizam pontos/reproduções</p>
											<?php 
											$totalcert = 0;
											$typec = array();
											foreach ($cert_type as $ct) {
												$totalcert += $ct->t;
												$typec[$ct->cert_type] = $ct;
											}
											$pl_perc = isset($typec[0]) ? $typec[0]->t/$totalcert*100 : 0;
											$pt_perc = isset($typec[1]) ? $typec[1]->t/$totalcert*100 : 0;

											$typemc = array();
											foreach ($cert_c as $ck => $ct) {
												foreach ($ct as $cv) {
													$typemc[$cv->cert_type][$ck] = $cv->v;
												}
											}
											?>
											<div class="col-xs-12">
												<div class="row">
													<div class="col-xs-6">
														<h4 class="no-margin text-right"><span class="text-info"><?php echo mb_strtoupper(Lang::get("pt_x"))." (".round($pt_perc,2)."%)";?></span></h4>
													</div>
													<div class="col-xs-6">
														<h4 class="no-margin text-left"><span class="text-warning"><?php echo mb_strtoupper(Lang::get("play_x"))." (".round($pl_perc,2)."%)";?></span></h4>
													</div>
												</div>
												<div class="progress">
												  	<div class="progress-bar progress-bar-info" style="width: <?php echo $pt_perc;?>%"></div>
												  	<div class="progress-bar progress-bar-warning" style="width: <?php echo $pl_perc;?>%"></div>
												</div>
											</div>
											<div class="col-xs-12">
												<p>Média dos valores colocados para cada certificado</p>
												<div class="row">
													<div class="col-xs-6">
														<?php 
														if(isset($typec[1])){
														?>
														<ul class="list-group">
															<li class="list-group-item list-group-item-info">
																<span class="text-info">PONTOS - ÁLBUM</span>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/gold-icon.png");?>">
																<?php echo intval($typec[1]->ag);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/platinum-icon.png");?>">
																<?php echo intval($typec[1]->ap);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/diamond-icon.png");?>">
																<?php echo intval($typec[1]->ad);?>
														    </li>
														</ul>
														<ul class="list-group">
														    <li class="list-group-item list-group-item-info">
																<span class="text-info">PONTOS - MÚSICA</span>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/gold-icon.png");?>">
																<?php echo intval($typec[1]->mg);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/platinum-icon.png");?>">
																<?php echo intval($typec[1]->mp);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/diamond-icon.png");?>">
																<?php echo intval($typec[1]->md);?>
													  		</li>
													  	</ul>
														<?php
														}
														?>
													</div>
													<div class="col-xs-6">
														<?php 
														if(isset($typec[0])){
														?>
														<ul class="list-group">
															<li class="list-group-item list-group-item-warning">
																<span class="text-warning">REPRODUÇÕES - ÁLBUM</span>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/gold-icon.png");?>">
																<?php echo intval($typec[0]->ag);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/platinum-icon.png");?>">
																<?php echo intval($typec[0]->ap);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/diamond-icon.png");?>">
																<?php echo intval($typec[0]->ad);?>
														    </li>
														</ul>
														<ul class="list-group">
														    <li class="list-group-item list-group-item-warning">
																<span class="text-warning">REPRODUÇÕES - MÚSICA</span>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/gold-icon.png");?>">
																<?php echo intval($typec[0]->mg);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/platinum-icon.png");?>">
																<?php echo intval($typec[0]->mp);?>
														    </li>
														    <li class="list-group-item">
																<img src="<?php echo Url::asset("img/diamond-icon.png");?>">
																<?php echo intval($typec[0]->md);?>
													  		</li>
													  	</ul>
														<?php
														}
														?>
													</div>
												</div>
												<p>Valor mais utilizado para cada certificado</p>
												<div class="row">
													<div class="col-xs-6">
														<?php 
														if(isset($typemc[1])){
														?>
														<ul class="list-group">
															<li class="list-group-item list-group-item-info">
																<span class="text-info">PONTOS - ÁLBUM</span>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/gold-icon.png");?>">
																<?php echo intval($typemc[1]["ag"]);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/platinum-icon.png");?>">
																<?php echo intval($typemc[1]["ap"]);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/diamond-icon.png");?>">
																<?php echo intval($typemc[1]["ad"]);?>
														    </li>
														</ul>
														<ul class="list-group">
														    <li class="list-group-item list-group-item-info">
																<span class="text-info">PONTOS - MÚSICA</span>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/gold-icon.png");?>">
																<?php echo intval($typemc[1]["mg"]);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/platinum-icon.png");?>">
																<?php echo intval($typemc[1]["mp"]);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/diamond-icon.png");?>">
																<?php echo intval($typemc[1]["md"]);?>
													  		</li>
													  	</ul>
														<?php
														}
														?>
													</div>
													<div class="col-xs-6">
														<?php 
														if(isset($typemc[0])){
														?>
														<ul class="list-group">
															<li class="list-group-item list-group-item-warning">
																<span class="text-warning">REPRODUÇÕES - ÁLBUM</span>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/gold-icon.png");?>">
																<?php echo intval($typemc[0]["ag"]);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/platinum-icon.png");?>">
																<?php echo intval($typemc[0]["ap"]);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/diamond-icon.png");?>">
																<?php echo intval($typemc[0]["ad"]);?>
														    </li>
														</ul>
														<ul class="list-group">
														    <li class="list-group-item list-group-item-warning">
																<span class="text-warning">REPRODUÇÕES - MÚSICA</span>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/gold-icon.png");?>">
																<?php echo intval($typemc[0]["mg"]);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/platinum-icon.png");?>">
																<?php echo intval($typemc[0]["mp"]);?>
														    </li>
														    <li class="list-group-item">
														    	<img src="<?php echo Url::asset("img/diamond-icon.png");?>">
																<?php echo intval($typemc[0]["md"]);?>
													  		</li>
													  	</ul>
														<?php
														}
														?>
													</div>
												</div>
											</div>
										</div>
										<hr>
										<h3><?php echo mb_strtoupper(Lang::get("plaque"));?></h3>
										<div class="row">
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo $plaque_total;?></h3>
												<small class="text-muted">TOTAL DE PLACAS</small>
											</div>
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo $plaque_last_day;?></h3>
												<small class="text-muted">PLACAS GERADAS HOJE</small>
											</div>
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo $plaque_biggest_day->date." (".$plaque_biggest_day->t,")";?></h3>
												<small class="text-muted">DIA COM MAIS PLACAS GERADAS</small>
											</div>
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo "<a href='".Route::url("profile", array("login" => $user_plaque->login))."'>".$user_plaque->login."</a> (".$user_plaque->t.")";?></h3>
												<small class="text-muted">USUÁRIO COM MAIS PLACAS</small>
											</div>
										</div>
										<div class="row">
											<h3 class="no-margin">ÚLTIMAS PLACAS</h3>
											<?php 
											foreach ($plaque_last as $key => $value) {
											?>
											<div class="col-sm-4 col-sm-offset-0 col-xs-10 col-xs-offset-1 bottomspace-sm">
												<a target="_blank" href="<?php echo Route::url("profile", array("login" => $value->login));?>">
													<img class="img-responsive" src="<?php echo $value->url;?>" alt="<?php echo Lang::get('plaque');?>">
												</a>
											</div>
											<?php
											}
											?>
										</div>
										<hr>
									</div>
									<div class="col-md-12 bottomspace-lg">
										<span class="fh5co-feature-icon"><i class="ti-stats-up"></i></span>
										<h3><?php echo "CHART";?></h3>
										<div class="row">
											<div class="col-xs-12 col-md-4 bottomspace-md">
												<?php 
												foreach ($top_artist as $key => $act) {
													$one = isset($one) ? $one : $act->u;
													$perc = $act->u/$one*100;
												?>
										    	<h4 class="h3 no-margin text-left"><?php echo $act->artist." (".$act->u.")";?></h4>
												<div class="progress">
												  	<div class="progress-bar progress-bar-info" style="width: <?php echo $perc;?>%"></div>
												</div>
												<?php
												}
												unset($one);
												?>
											</div>
											<div class="col-xs-12 col-md-4 bottomspace-md">
												<?php 
												foreach ($top_album as $key => $alb) {
													$one = isset($one) ? $one : $alb->u;
													$perc = $alb->u/$one*100;
												?>
										    	<h4 class="h3 no-margin text-left"><?php echo $alb->album." (".$alb->u.")";?></h4>
												<div class="progress">
												  	<div class="progress-bar progress-bar-info" style="width: <?php echo $perc;?>%"></div>
												</div>
												<?php
												}
												unset($one);
												?>
											</div>
											<div class="col-xs-12 col-md-4 bottomspace-md">
												<?php 
												foreach ($top_music as $key => $mus) {
													$one = isset($one) ? $one : $mus->u;
													$perc = $mus->u/$one*100;
												?>
										    	<h4 class="h3 no-margin text-left"><?php echo $mus->music." (".$mus->u.")";?></h4>
												<div class="progress">
												  	<div class="progress-bar progress-bar-info" style="width: <?php echo $perc;?>%"></div>
												</div>
												<?php
												}
												unset($one);
												?>
											</div>
										</div>
										<div class="row">
											<div class="col-xs-12 col-md-4 bottomspace-md">
												<?php 
												foreach ($top_artist_one as $key => $act) {
													$one = isset($one) ? $one : $act->u;
													$perc = $act->u/$one*100;
												?>
										    	<h4 class="h3 no-margin text-left"><?php echo $act->artist." (".$act->u.")";?></h4>
												<div class="progress">
												  	<div class="progress-bar progress-bar-info" style="width: <?php echo $perc;?>%"></div>
												</div>
												<?php
												}
												unset($one);
												?>
											</div>
											<div class="col-xs-12 col-md-4 bottomspace-md">
												<?php 
												foreach ($top_album_one as $key => $alb) {
													$one = isset($one) ? $one : $alb->u;
													$perc = $alb->u/$one*100;
												?>
										    	<h4 class="h3 no-margin text-left"><?php echo $alb->album." (".$alb->u.")";?></h4>
												<div class="progress">
												  	<div class="progress-bar progress-bar-info" style="width: <?php echo $perc;?>%"></div>
												</div>
												<?php
												}
												unset($one);
												?>
											</div>
											<div class="col-xs-12 col-md-4 bottomspace-md">
												<?php 
												foreach ($top_music_one as $key => $mus) {
													$one = isset($one) ? $one : $mus->u;
													$perc = $mus->u/$one*100;
												?>
										    	<h4 class="h3 no-margin text-left"><?php echo $mus->music." (".$mus->u.")";?></h4>
												<div class="progress">
												  	<div class="progress-bar progress-bar-info" style="width: <?php echo $perc;?>%"></div>
												</div>
												<?php
												}
												unset($one);
												?>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>