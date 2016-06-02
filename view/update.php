<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
use B7KP\Library\Url;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get('update'));
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
							<h2><?php echo Lang::get('update')." ".Lang::get('ur');?> chart</h2>
							<p class="text-muted"><?php echo Lang::get('look_at');?> <a href="<?php echo Route::url('settings');?>"><?php echo Lang::get('sett');?></a></p>
							<button data-url="<?php echo Route::url('check_update', array('time'=>'new'));?>" class="updaters new btn btn-outline"><?php echo Lang::get('up_new_week');?></button>
							<br>
							<button data-url="<?php echo Route::url('check_update', array('time'=>'all'));?>" class="updaters all btn btn-outline"><?php echo Lang::get('up_all');?></button>
							<hr>
							<div id="updateaction"></div>
							
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	
					</div>
				</div>
				</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>