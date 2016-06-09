<?php
use B7KP\Core\App;
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Utils\Functions as F;
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$name}");
	$this->render("ext/head.php", $head);
	$blockalt = "<h3>
					<a class='white' href=''>".$name."</a> 
					<a href='{$lfmurl}' class='white-hover' title='View Last.fm page' target='_blank'>
						<i class='fa fa-lastfm'></i>
					</a>
				</h3>";
	if(is_object($user))
	{
		$blockalt .= "<a href='#!' class='btn btn-sm btn-custom'>".$userplaycount." ".Lang::get("play_x")."</a>";
	}
	$blocktitle = "<img height='174' class='img-circle' src='".$lfm_image."'>";
?>
	<body class="inner-page">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("title" => $blocktitle, "subtitle" => "", "image" => $lfm_bg, "alttitle" => $blockalt));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row">
						<div class="col-xs-12">
							<div class="">
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted"><?php echo Lang::get('listener_x');?> (Last.fm)</small>
									<br/>
									<strong>
									<i class="fa fa-lastfm fa-fw ico-color"></i>
										<?php echo number_format($listeners);?>
									</strong>
								</div>
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted"><?php echo Lang::get('play_x');?> (Last.fm)</small>
									<br/>
									<strong>
									<i class="fa fa-lastfm fa-fw ico-color"></i>
									<?php echo number_format($playcount);?>
									</strong>
								</div>
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted"><?php echo Lang::get('entries');?> <a href="#notes">¹</a></small>
									<br/>
									<strong>
									<i class="ti-medall-alt ico-color"></i>
									<?php echo number_format($totalcharts);?>
									</strong>
								</div>
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted">Charts <?php echo Lang::get('in');?> #1 <a href="#notes">²</a></small>
									<br/>
									<strong>
									<i class="ti-medall-alt ico-color"></i>
									<?php echo number_format($totalusers);?>
									</strong>
								</div>
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted"><?php echo Lang::get('wk_x');?> <?php echo Lang::get('in');?> #1 <a href="#notes">³</a></small>
									<br/>
									<strong>
									<i class="ti-headphone ico-color"></i>
									<?php echo number_format($totaln1);?>
									</strong>
								</div>
								<div class="col-md-2 col-sm-4 col-xs-6 text-center divider">
									<small class="text-muted">#1 <?php echo Lang::get('user');?> <a href="#notes">*</a></small>
									<br/>
									<strong>
									<i class="ti-headphone ico-color"></i>
									<?php echo isset($topusers[0]["user"]) ? "<a href='".Route::url("profile", array('login' => $topusers[0]["user"]->login))."'>".$topusers[0]["user"]->login."</a>" : "N/A"; ?>
									</strong>
								</div>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-8 col-sm-8">
							<!-- Artist -->
							<!-- Album -->
							<!-- Tracks -->
						</div>
						<div class="col-md-4 col-sm-4">
							<!-- Users -->
							<div class="row">
								<div class="col-md-12 topspace-md">
								<?php 
								if(count($topusers) > 0)
								{
								?>
								<div class="divider">
								<h2 class='h3 text-center topspace-sm'>Top <?php echo Lang::get('user_x');?></h2>
										<?php 
										foreach ($topusers as $key => $value) {
										?>
										<div class="row bottomspace-md pd-5">
											<div class="col-xs-4">
												<img class="img-circle img-responsive" src="<?php echo $value["avatar"];?>">
											</div>
											<div class="col-xs-8 topspace-xl">
												<h3>
													<a href="<?php echo Route::url("profile", array("login" => $value["user"]->login));?>"><?php echo $value["user"]->login;?></a>
													<br>
													<small class="text-muted"><?php echo $value["weeks"]." ".Lang::get("wk_x")." ".Lang::get("at")." #1";?></small>
												</h3>
											</div>
										</div>
										<?php 
										} 
										?>
								</div>
								<?php
								}
								?>								
								</div>
							</div>
							<!-- Similar -->
							<div class="row">
								<div class="col-md-12">
									<?php 
									if(count($similar) > 0)
									{
									?>	
										<div class="divider topspace-md">
											
										<h2 class='h3 text-center topspace-sm'>Similar</h2>
										<?php 
										foreach ($similar as $key => $value) {
										?>
										<div class="row bottomspace-md pd-5">
											<div class="col-xs-4">
												<img class="img-circle img-responsive" src="<?php echo $value["image"]["large"];?>">
											</div>
											<div class="col-xs-8 topspace-xxl">
												<h3>
													<a href="<?php echo Route::url("artist", array("name" => F::fixLFM($value["name"])));?>"><?php echo $value["name"];?></a>
												</h3>
											</div>
										</div>
										<?php 
										} 
										?>
										</div>
									<?php
									}
									?>
								</div>
							</div>
						</div>

					</div>
					<div class="row">
						<div class="col-xs-12">
							<small class="text-muted" id="notes">
								¹ = <small>Número de usuários que colocaram este artista em algum de seus charts semanais</small> 
								<br/>
								² = <small>Números de usuário que colocaram este artista em #1 em algum de seus charts semanais</small>  
								<br/>
								³ = <small>Soma de semanas em #1 entre todos os charts/usuários</small>  
								<br/>
								* = <small>Usuário com maior número de semanas em #1 deste artista</small>
							</small>
						</div>
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>