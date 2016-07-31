<?php 
use B7KP\Library\Lang;
use B7KP\Library\Route;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} - ".Lang::get("plaque"));
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("image" => $lfm_bg));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-md">
						<div class="col-xs-12">
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row">
						<div class="col-xs-12">
							<h3 class="text-center"><?php echo Lang::get("plaque");?></h3>
							<div class="text-center">
								<a clasS="btn btn-info btn-custom" href="<?php echo Route::url('plaque_gallery', array('login' => $user->login, 'type' => 'album', 'by' => $by));?>"><i class="icon-vynil except"></i></a>
								<a clasS="btn btn-info btn-custom" href="<?php echo Route::url('plaque_gallery', array('login' => $user->login, 'type' => 'music', 'by' => $by));?>"><i class="ti-music"></i></a>
								<br/>
								<a clasS="btn btn-info btn-custom" href="<?php echo Route::url('plaque_gallery', array('login' => $user->login, 'type' => $type, 'by' => 'artist'));?>"><?php echo Lang::get("by_art");?></a>
								<a clasS="btn btn-info btn-custom" href="<?php echo Route::url('plaque_gallery', array('login' => $user->login, 'type' => $type, 'by' => 'week'));?>"><?php echo Lang::get("by_wk");?></a>
								<a clasS="btn btn-info btn-custom" href="<?php echo Route::url('plaque_gallery', array('login' => $user->login, 'type' => $type, 'by' => 'certified'));?>"><?php echo Lang::get("by_cert");?></a>
							</div>
							<div class="panel-group fh5co-accordion" id="accordion" role="tablist" aria-multiselectable="true">
								<?php
								foreach ($plaques as $key => $value) 
								{
								?>
							 	<div class="panel panel-default">
							    	<div class="panel-heading collapsed" role="tab" id="heading<?php echo md5($key);?>" data-toggle="collapse" data-parent="#accordion" data-target="#collapse<?php echo md5($key);?>" aria-expanded="false" aria-controls="collapse<?php echo md5($key);?>">
							      		<h4 class="panel-title">
							        		<a class="accordion-toggle">
							          			<?php echo $key;?>
							        		</a>
							      		</h4>
							    	</div>
							    	<div id="collapse<?php echo md5($key);?>" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading<?php echo md5($key);?>" aria-expanded="false" style="height: 0px;">
							      		<div class="panel-body">
							      			<?php 
							      			foreach ($value as $ky => $ve) {
							      			?>
							        		<img src="<?php echo $ve->url;?>" class="col-md-4 col-sm-6 col-xs-12 bottomspace-md">
							      			<?php
							      			}
							      			?>
							      		</div>
							    	</div>
							 	</div>
								<?php
								}
								?>
							</div>
						</div>
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>