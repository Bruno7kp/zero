<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get("search"));
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php");?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-md">
						<div class="col-xs-12">
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $this->user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row">
						<div class="col-xs-12 bottomspace-md">
						<?php 
						if($this->search)
						{
							echo "<div class\"row\">";
							foreach ($this->search as $key => $value) {
						?>
							<div class="col-md-3 col-sm-6 col-xs-12">
								<div class="row">
									<div class="col-xs-3">
										<img src="<?php echo $value["image"];?>" class="img-responsive">
									</div>
									<div class="col-xs-9">
										<?php echo $value["name"];?>	
									</div>
								</div>
							</div>
						<?php
							}
							echo "</div>";
						}
						else
						{
							if(isset($this->q) && !empty($this->q))
							{
								echo Lang::get("no_results");
							}
							else
							{
								echo Lang::get("tip_something");
							}
						}
						?>
						</div>
					</div>
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>