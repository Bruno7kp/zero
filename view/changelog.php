<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "Changelog");
	$this->render("ext/head.php", $head);
	$header = array("title" => "Changelog", "subtitle" => false);
?>
	<body class="inner-page">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", $header);?>
		<div id="fh5co-main">
			<section>
				<div class="container">
						<div class="row">
							<div class="col-md-2" id="fh5co-sidebar">

								<div class="fh5co-side-section fh5co-nav-links">
									<h2 class="fh5co-uppercase-heading-sm">Versões</h2>
									<ul>
										<?php
										$ids = array();
										foreach ($changes as $key => $value) {
											echo "<li><a href='#".$key."'>".$key."</a></li>";
											$ids[] = $key;
										}
										?>
									</ul>
								</div>
							</div>
							<div class="col-md-8" id="fh5co-content">
								<?php 
								foreach ($changes as $key => $value) {
									echo "<h2 class='no-margin' id='".$key."'>".$key."</h2>";
									$date = $value[0];
									unset($value[0]);
									echo "<small>".$date."</small>";
								?>
								<div class="row">
									<div class="col-md-12">
										<p><?php echo "<ul><li>" . implode("</li><li>", $value) . "</li></ul>";?></p>
									</div>
								</div>
								<div class="fh5co-spacer fh5co-spacer-sm"></div>

								<?php
								}
								?>
								<div class="fh5co-spacer fh5co-spacer-sm"></div>
								<h2>Próxima atualização</h2>
								<div class="row">
									<div class="col-md-12">
										<span><?php echo $next["complete"];?>% completo</span>
										<div class="progress">
										  	<div class="progress-bar progress-bar-info" style="width: <?php echo $next["complete"];?>%"></div>
										</div>
										<p>
											<?php echo "<ul><li>" . implode("</li><li>", $next["text"]) . "</li></ul>";?>
										</p>
									</div>
								</div>

							</div>
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>
					</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>