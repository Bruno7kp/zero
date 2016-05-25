<html>
<?php
	$head = array("title" => "{$user->login}'s Profile");
	$this->render("ext/head.php", $head);
?>
	<body class="inner-page">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("title" => $user->login, "subtitle" => ""));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row">
						<div class="col-md-4">
							<h2>PROFILE</h2>
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>