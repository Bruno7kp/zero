<?php
use B7KP\Library\Route;
?>
<!doctype html>
<html>
<?php
	$title 	= $user->login."'s Top ".ucfirst($type)." - Week ".$week->week;
	$head 	= array("title" => $title);
	$this->render("ext/head.php", $head);
	$from 	= new DateTime($week->from_day);
	$from 	= $from->format("Y.m.d");
	$to 	= new DateTime($week->to_day);
	$to->modify('-1 day');
	$to 	= $to->format("Y.m.d");
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php");?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="fh5co-spacer fh5co-spacer-sm"></div>
					<button id="copy" data-clipboard-target="#copyme">Copy</button>
					<button id="copy_alt" data-clipboard-target="#copyme_alt">Copy</button>

					<div class="row">

						<div id="copyme" class="col-md-10 col-md-offset-1 text-center">
							<h2><?php echo $title?></h2>
							<small><strong><?php echo $from . " - " . $to;?></strong></small>
							<hr>
							<?php echo $list;?>
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>