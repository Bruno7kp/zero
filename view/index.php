<!doctype html>
<html>
<?php
	$head = array("title" => "Index");
	$this->render("ext/head.php", $head);
?>
	<body>
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php");?>
		<div id="fh5co-main">
			<div class="container">
				<div class="row">
					<div class="col-md-8 col-md-offset-2 text-center fh5co-lead-wrap">
						<h2>Soon...</h2>
					</div>
				</div>
			</div>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>