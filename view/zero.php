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
						<div class="col-md-8 col-md-offset-2 text-center">
							<h1><?php echo Lang::get("stats");?></h1>
							<div class="row">
								<div class="col-md-6 bottomspace-lg">
									<h3 class="h3"><?php echo mb_strtoupper(Lang::get("user_x"));?></h3>
									<div class="row">
										<div class="col-md-6">
											<h3 class="no-margin"><?php echo $user_total;?></h4>
											<small class="text-muted">TOTAL DE USUÁRIOS</small>
										</div>
										<div class="col-md-6">
											<h3 class="no-margin"><?php echo $user_last->login;?></h4>
											<small class="text-muted">ÚLTIMO CADASTRO</small>
										</div>
									</div>
								</div>
								<div class="col-md-6 bottomspace-lg">
									<h3>CHARTS</h3>
									<div class="row">
										<div class="col-md-6">
											<h3 class="no-margin"><?php echo $user_total;?></h4>
											<small class="text-muted">TOTAL DE USUÁRIOS</small>
										</div>
										<div class="col-md-6">
											<h3 class="no-margin"><?php echo $user_last->login;?></h4>
											<small class="text-muted">ÚLTIMO CADASTRO</small>
										</div>
									</div>
								</div>
								<div class="col-md-12 bottomspace-lg">
									<h3><?php echo mb_strtoupper(Lang::get("plaque"));?></h3>
									<div class="row">
										<div class="col-md-4">
											<h3 class="no-margin"><?php echo $plaque_total;?></h4>
											<small class="text-muted">TOTAL DE PLACAS</small>
										</div>
										<div class="col-md-4">
											<h3 class="no-margin"><?php echo $plaque_last_day;?></h4>
											<small class="text-muted">PLACAS GERADAS HOJE</small>
										</div>
										<div class="col-md-4">
											<h3 class="no-margin"><?php echo $plaque_biggest_day->date." (".$plaque_biggest_day->t,")";?></h4>
											<small class="text-muted">DIA COM MAIS PLACAS GERADAS</small>
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
							</div>
						</div>
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>