<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Functions as F;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Utils\UserSession;
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
						<div class="col-xs-12 bottomspace-lg">
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
										<div class="jumbotron">
											<div class="row">
												<div class="col-xs-3">
													<img src="https://i.imgur.com/OOKNwlp.png" class="img-responsive img-circle" get-user-image="<?php echo $value->login;?>">
												</div>
												<div class="col-xs-9">
													<h3 class="no-margin">
													<?php 
													echo "<a href=".Route::url("profile", array("login" => $value->login)).">".$value->login."</a>";
													?>														
													</h3>
													<a class="btn btn-custom-alt btn-danger btn-sm radius-2" target="_blank" href="http://last.fm/user/<?php echo $value->login;?>">
														<i class="fa fa-fw fa-lastfm"></i>
														<?php echo Lang::get("lastfm");?>
													</a>
													<?php 
													if($user == UserSession::getUser($this->factory))
													{
													?>
														<span class=friend>
															<a class="btn btn-custom-alt btn-danger btn-sm radius-2 remove_friend" href="#!" data-id="<?php echo $value->id;?>">
																<i class="fa fa-fw fa-times"></i>
																<?php echo Lang::get("remove");?>
															</a>
														</span>
													<?php
													}
													?>
																									
												</div>
											</div>
										</div>
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
						?>
							<div class="col-md-4 col-sm-6 col-xs-12 bottomspace-lg grid-item">
								<div class="row">
									<div class="col-xs-12">
										<div class="jumbotron">
											<h3><?php echo Lang::get("no_results"); ?></h3>
										</div>
									</div>
								</div>
							</div>
						<?php
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