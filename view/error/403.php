<?php
use B7KP\Library\Route;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "403 - Not authorized");
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
							<i class='icon-sad-face fa-4x'></i>
							<h2>You can not access this page <br><small>go to <a href="<?php echo Route::url('home');?>">Home</a></small></h2>
							

						</div>

						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
				</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>