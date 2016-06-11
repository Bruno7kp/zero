<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
use B7KP\Core\App;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get('reg'));
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
							<h2><?php echo Lang::get('reg');?> <br><small><?php echo Lang::get('or');?> <a href="<?php echo Route::url('login');?>">Login</a></small></h2>
							<small class="text-muted">
								<?php echo Lang::get('hello');?>, <strong><?php echo $lfm_user;?></strong>. 
							<?php echo Lang::get('init');?>
							</small>
							<?php 
								$form->output();
							?>
						</div>

						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>