<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$lang = substr($type, 0, 3)."_x";
	$title 	= $user->login." :: Top ".Lang::get($lang)." - ".Lang::get('wk')." ".$week->week;
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

					<div class="row">

						<div id="copyme" class="col-md-10 col-md-offset-1">
							<div class="text-center">
								<h2><?php echo $title?></h2>
								<h5><strong><?php echo $from . " - " . $to;?></strong></h5>
								<?php echo $list;?>
							</div>
						</div>
						<div class="col-md-5 col-md-offset-1 topspace-lg">
							<button class="btn btn-custom btn-info btn-sm" id="copy" data-clipboard-target="#copyme">
								<i class="ti-clipboard"></i> <span><?php echo Lang::get('copy');?> chart</span>
							</button>
							<button class="btn btn-custom btn-info btn-sm showonhover" id="copy_alt" data-clipboard-target="#copyme_alt">
								<i class="ti-clipboard"></i> <span class="hidden"><?php echo Lang::get('copy_w');?></span>
							</button>
						</div>
						<div class="col-md-5 topspace-lg">
							<div class="chart-table">
								<small>
									<span class="deb">NEW</span> = <?php echo Lang::get('new_def');?> | 
									<span class="ret">RE</span> = <?php echo Lang::get('re_def');?> | 
									<span>LW</span> = <?php echo Lang::get('lw_def');?>
								</small>
							</div>
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>