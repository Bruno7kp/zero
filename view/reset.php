<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get('edit')." ".Lang::get('ur')." ".Lang::get('prof'));
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
							<h2><?php echo Lang::get('reset_account');?></h2>
							
							<p class="text-muted text-justify"><?php echo Lang::get("reset_acc_txt");?></p>
							<a href="#!" id="reset_acc" class="btn btn-danger"><?php echo Lang::get('reset_acc');?></a>
							<p class="text-muted text-justify"><?php echo Lang::get("reset_plaques_txt");?></p>
							<a href="#!" id="reset_plaques" class="btn btn-danger"><?php echo Lang::get('reset_plaques');?></a>
							<p class="text-muted text-justify"><?php echo Lang::get("remove_acc_txt");?></p>
							<a href="#!" id="delete_acc" class="btn btn-danger"><?php echo Lang::get('remove_acc');?></a>
							

							<hr>
							<a href="<?php echo Route::url('settings');?>" class="btn btn-outline"><?php echo Lang::get('sett');?></a>
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>