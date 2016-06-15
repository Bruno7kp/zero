<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "Login");
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
							<h2>Login <br><small><?php echo Lang::get('or');?> <a href="<?php echo Route::url('register');?>"><?php echo Lang::get('reg');?></a></small></h2>
							
							<?php $form->output();?>
							<a href="<?php echo Route::url('forgotpass');?>"><?php echo Lang::get('forg_pass');?></a>
						</div>

						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
				</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>