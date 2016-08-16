<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Functions as F;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} Charts");
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("image" => $lfm_bg));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-md">
						<div class="col-xs-12">
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row">
						<div class="col-xs-12 bottomspace-md">
						<?php 
						if(count($friends) > 0)
						{
							echo "<div class=\"row\">";
							echo "<div class=\"grid\">";
							foreach ($friends as $key => $value) 
							{
						?>
							<div class="col-md-4 col-sm-6 col-xs-12 bottomspace-lg grid-item <?php if($key == 0){ echo 'grid-sizer';} ?>">
								<div class="row">
									<div class="col-xs-12">
										<?php echo $value->login;?>
									</div>
								</div>
							</div>
						<?php
							}
							echo "</div>";
							echo "</div>";
						}
						else
						{
							echo Lang::get("no_results");
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