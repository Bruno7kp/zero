<html>
<?php
	$head = array("title" => "{$user->login}'s Profile");
	$this->render("ext/head.php", $head);
	$blockalt = "<h3>
					<a class='white' href=''>".$user->login."</a> 
					<a href='http://last.fm/user/{$user->login}' class='white-hover' title='View Last.fm profile' target='_blank'>
						<i class='fa fa-lastfm'></i>
					</a>
				</h3>";
	$blocktitle = "<img class='img-circle' src='".$lfm_image."'>";
?>
	<body class="inner-page">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("title" => $blocktitle, "subtitle" => "", "image" => $lfm_bg, "alttitle" => $blockalt));?>
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