<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "Oops");
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
						<?php 
						if($error)
						{
						?>
							<i class='icon-winking-face fa-4x'></i>
							<h2><?php echo Lang::get("need_update");?> <br><small><a href="<?php echo Route::url('update');?>"><?php echo Lang::get('update');?></a></small></h2>
						<?php
						}
						else
						{
						?>
							<i class='icon-sad-face fa-4x'></i>
							<h2><?php echo Lang::get("need_update");?> <br><small><a href="<?php echo Route::url('update');?>"><?php echo Lang::get('update');?></a></small></h2>
						<?php
						}
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