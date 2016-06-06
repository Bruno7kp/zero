<?php
use B7KP\Library\Route;
use B7KP\Core\App;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "Users");
	$this->render("ext/head.php", $head);
?>
	<body class="well">
	<div class="row">
		
		<div class="white-bg divider col-md-8 col-md-offset-2 topspace-lg">
			<h1 class="topspace-lg text-center">USERS</h1>
			<hr>
			<?php 
			foreach ($users as $user) {
				$label = $user->permissionLevel() == 7 ? "<span class='label label-danger'>admin</span>" : "";
				$href = "<a target='_blank' href='".Route::url("profile", array("login" => $user->login))."' class='label label-info'><i class='ti-new-window'></i></a>"; 
			?>
			<big><?php echo $user->login." ".$href." ".$label;?></big><br/>
			<hr>
			<?php
			}
			?>
		</div>
	</div>
	</body>
</html>