<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Utils\Functions as F;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} Charts - All-Kill");
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("image" => $lfm_bg));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-xl text-center">
						<div class="col-xs-12">
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row bottomspace-md text-center">
						<div class="col-xs-12">
							<h3 class="h3">ALL-KILL</h3>
							<p><?php echo Lang::get('allkill');?></p>
						</div>
					</div>
					<div class="row">
						<div class="col-md-10 col-md-offset-1 topspace-md">
						<?php
						if(is_array($allkill) && count($allkill) > 0)
						{
						?>
							<table class="table middle divider tablesorter">
								<thead>
									
								<tr>
									<th class="text-center">#</th>
									<th><?php echo Lang::get('art');?></th>
									<th><?php echo Lang::get('alb');?></th>
									<th><?php echo Lang::get('mus');?></th>
									<th class="text-center"><?php echo Lang::get('wk');?></th>
								</tr>								
								</thead>
								<tbody>
								<?php 
								$weekurl = Url::getBaseUrl()."/user/".$user->login."/charts/artist/week/";
								$itemurl = Url::getBaseUrl()."/user/".$user->login."/music/";
								foreach ($allkill as $key => $value) 
								{
									$url = $weekurl.$value->week;
								?>
								<tr>
									<td class="text-center"><?php echo $key+1;?></td>
									<td>
										<a href=<?php echo $itemurl.F::fixLFM($value->artist);?>>
										<?php echo $value->artist; ?>
										</a>
									</td>
									<td>
										<a href=<?php echo $itemurl.F::fixLFM($value->artist)."/".F::fixLFM($value->album);?>>
										<?php echo $value->album; ?>
										</a>
									</td>
									<td>
										<a href=<?php echo $itemurl.F::fixLFM($value->artist)."/_/".F::fixLFM($value->music);?>>
										<?php echo $value->music; ?>
										</a>
									</td>
									<td class="text-center"><?php echo "<a href='".$url."'>".$value->week."</a>"; ?></td>
								</tr>
								<?php 
								}
								?>
								</tbody>
							</table>
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