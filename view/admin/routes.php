<?php
use B7KP\Library\Route;
use B7KP\Core\App;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "Routes");
	$this->render("ext/head.php", $head);
?>
	<body class="well">
	<div class="row">
		
		<div class="white-bg divider col-md-8 col-md-offset-2 topspace-lg">
			<h1 class="topspace-lg text-center">ROUTES</h1>
			<hr>
			<?php 
			foreach ($routes as $key => $value) {
				$label = strpos($value["route"], "{") > 0 ? "<span class='label label-info'>special</span>" : "";
			?>
			<big><?php echo $key." ".$label;?></big><br/>
			<small><b>Route:</b> <?php echo $value["route"];?></small><br/>
			<small><b>Class:</b> <?php echo $value["class"];?></small><br/> 
			<small><b>Method:</b> <?php echo $value["method"];?></small><br/>
			<hr>
			<?php
			}
			?>
		</div>
	</div>
	</body>
</html>