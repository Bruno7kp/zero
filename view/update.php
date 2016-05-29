<?php
use B7KP\Library\Route;
use B7KP\Library\Url;
?>
<html>
<?php
	$head = array("title" => "Update");
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
							<h2>Update your charts</h2>
							<p class="text-muted">Take a look at the <a href="<?php echo Route::url('settings');?>">settings</a></p>
							<button data-url="<?php echo Route::url('check_update', array('time'=>'new'));?>" class="updaters new btn btn-outline">Update new weeks</button>
							<br>
							<button data-url="<?php echo Route::url('check_update', array('time'=>'all'));?>" class="updaters all btn btn-outline">Update all</button>
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