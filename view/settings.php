<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get('sett'));
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php");?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row">

						<div class="fh5co-spacer fh5co-spacer-sm"></div>	
						<div class="col-md-4 col-md-offset-4 text-center">
							<h2><?php echo Lang::get('sett');?></h2>
							<?php $form->output();?>
							<hr>
							<a href="<?php echo Route::url('update');?>" class="btn btn-outline"><?php echo Lang::get('update');?> charts</a>
							<br>
							<a href="<?php echo Route::url('cert_settings');?>" class="btn btn-outline"><?php echo Lang::get('cert');?></a>
							<br>
							<a href="<?php echo Route::url('usereditpass');?>" class="btn btn-outline"><?php echo Lang::get('edit');?> <?php echo Lang::get('pass');?></a>
							<br>
							<a href="<?php echo Route::url('useredit');?>" class="btn btn-outline"><?php echo Lang::get('edit');?> e-mail</a>
							<br>
							<a href="<?php echo Route::url('cert_settings');?>" class="btn btn-outline"><?php echo Lang::get('change_start_date');?></a>
							<br>
							<a href="<?php echo Route::url('cert_settings');?>" class="btn btn-outline"><?php echo Lang::get('reset_account');?></a>

						</div>

						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
				</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>