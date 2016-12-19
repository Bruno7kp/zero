<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
use B7KP\Library\Url;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get('update_yec'));
	$this->render("ext/head.php");
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
							<h2><?php echo Lang::get('update_yec');?></h2>
							<p><?php echo Lang::get('update_yec_notice');?></p>
							<hr>
							<button data-url="<?php echo Route::url('update_yec_time', array('time'=>'all'));?>" data-time="all" class="yecupdaters all btn btn-outline"><?php echo Lang::get('up_all');?></button>
							<?php 
							$year = isset($year) && $year >= 2005 ? $year : 2005;
							$now = new DateTime();
							$now = $now->format("Y");
							for ($i = $year; $i <= $now; $i++) 
							{ 
							?>
							<button data-url="<?php echo Route::url('update_yec_time', array('time'=>$i));?>" data-time="<?php echo $i;?>" class="yecupdaters all btn btn-outline">YEC <?php echo $i;?></button>
							<?php
							}
							?>
							<div id="updateyecaction"></div>
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	
					</div>
				</div>
				</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>