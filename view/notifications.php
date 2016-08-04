<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
use B7KP\Utils\Notify;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get("notifications"));
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php");?>
		<div id="fh5co-main">
			<div class="row">
				<div class="col-xs-12 col-md-8 col-md-offset-2 bottomspace-lg">
					<h2 class="text-center"><?php echo Lang::get("notifications")." (".$notifications->getNotificationsNumber().")";?></h2>
					<?php 
					$notifications->outputAll();
					?>
				</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	
			</div>

			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>