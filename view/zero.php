<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
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
									</div>
									<div class="col-md-12 bottomspace-lg">
										<span class="fh5co-feature-icon"><i class="icon-vynil"></i></span>
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
												<a href="<?php echo Route::url("profile", array("login" => $value->login));?>">
													<img class="img-responsive" src="<?php echo $value->url;?>" alt="<?php echo Lang::get('plaque');?>">
												</a>
											</div>
											<?php
											}
											?>
										</div>
									</div>
									<div class="col-md-12 bottomspace-lg">
										<span class="fh5co-feature-icon"><i class="icon-vynil"></i></span>
										<h3><?php echo mb_strtoupper(Lang::get("plaque"));?></h3>
										<div class="row">
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo $top_artist->artist." (".$top_artist->t,")";?></h3>
												<small class="text-muted">ARTISTA COM MAIS SEMANAS #1</small>
											</div>
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo $top_album->album." (".$top_album->t,")";?></h3>
												<small class="text-muted">PLACAS GERADAS HOJE</small>
											</div>
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo $top_music->music." (".$top_music->t,")";?></h3>
												<small class="text-muted">DIA COM MAIS PLACAS GERADAS</small>
											</div>
											<div class="col-md-3 col-xs-6 bottomspace-md">
												<h3 class="no-margin"><?php echo "<a href='".Route::url("profile", array("login" => $user_plaque->login))."'>".$user_plaque->login."</a> (".$user_plaque->t.")";?></h3>
												<small class="text-muted">USUÁRIO COM MAIS PLACAS</small>
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