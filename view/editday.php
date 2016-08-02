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
							<h2><?php echo Lang::get('edit');?></h2>
							
							<?php 
							if($weeks)
							{
								echo "<p>".Lang::get("reset_weeks")."</p>";
							}
							else
							{
								$form->output(); 
							}
							?>

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