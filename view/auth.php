<?php
use B7KP\Library\Route;
use B7KP\Core\App;
?>
<html>
<?php
	$head = array("title" => "Register");
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
							<h2>Connect <?php echo App::get('name');?> with Last.fm <br><small>You already did that? <a href="<?php echo Route::url('login');?>">Login</a></small></h2>

							<a class="btn btn-danger" href="<?php echo "http://www.last.fm/api/auth/?api_key=68d81020be83713df69720b5acdf0a1f";?>">
							<i class="fa fa-lastfm"></i> Click Here
							</a>
							<?php 
							if(isset($error) && $error)
							{
							?>
							<div class="alert alert-danger">Something went wrong when checking the token. Try again later. <i class="fa-frown-o fa-fw fa"></i></div>
							<?php
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