<?php
use B7KP\Library\Route;
use B7KP\Core\App;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get('forg_pass'));
	$this->render("ext/head.php", $head);
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
							<?php 
							if($error == 0 && isset($form) && $form) { 
								if(isset($user) && $user)
								{
							?>
								<h2><?php echo Lang::get('type_new_pass');?></h2>
								<h4><?php echo Lang::get('note_app');?></h4>
								<h4><?php echo Lang::get('after_new_pass');?></h4>
							<?php
								}
								else
								{
							?>
								<h2><?php echo Lang::get('forg_pass');?> <br><small> <?php echo Lang::get('type_user');?></small></h2>
							<?php
								}
							?>
								<?php $form->output(); ?>
							<?php 
							}
							else if($error == 0 && isset($form) && !$form)
							{
							?>
								<h2><?php echo Lang::get("conf_prop");?></h2>
								<a class="btn btn-danger" href="<?php echo "http://www.last.fm/api/auth/?api_key=".App::get('lastfmapikey')."&cb=".Route::url('forgotpass')."?user=".$_GET['user'];?>">
								<i class="fa fa-lastfm"></i> <?php echo Lang::get('click_h');?>
							</a>
							<?php
							}
							else if($error == 1)
							{
								echo "<h2>".Lang::get("acc_not_exists")." <a href='".Route::url('register')."'>".Lang::get('click_h')."</a></h2>";
							} 
							else if($error == 2)
							{
								echo "<h2>".Lang::get("error_token")."</h2>";
							}
							?>
						</div>

						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
				</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>