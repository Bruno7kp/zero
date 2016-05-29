<?php
use B7KP\Library\Route;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "Settings");
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
							<h2>Settings</h2>
							<?php $form->output();?>
							<hr>
							<a href="<?php echo Route::url('update');?>" class="btn btn-outline">Update charts</a>
							<br>
							<a href="<?php echo Route::url('useredit');?>" class="btn btn-outline">Edit e-mail</a>
							<br>
							<a href="" class="btn btn-outline">Edit password</a>
							
						</div>

						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
				</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>