<?php
use B7KP\Utils\Snippets as S;
use B7KP\Utils\Charts;
use B7KP\Utils\Functions;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "Live Charts");
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
							<h3 class="h3"><?php echo Lang::get('prev_of');?></h3>
						</div>
					</div>
					<div class="row text-center">
						<div class="col-xs-12">
							<div class="btn-group" role="group">
								<a href="<?php echo Route::url('live_charts', array('type' => 'artist'));?>" class="no-margin btn btn-custom btn-info"><i class="ti-user"></i></a>
								<a href="<?php echo Route::url('live_charts', array('type' => 'album'));?>" class="no-margin btn btn-custom btn-info"><i class="icon-vynil except"></i></a>
								<a href="<?php echo Route::url('live_charts', array('type' => 'music'));?>" class="no-margin btn btn-custom btn-info"><i class="ti-music"></i></a>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-xs-12 topspace-md">
						<?php
						if(is_array($list) && count($list) > 0)
						{
							$mainurl = Url::getBaseUrl()."/user/".$user->login."/music/";
						?>
							<table class="chart-table table-fluid topspace-md">
								<tr>
									<th></th>
									<th class="center"><?php echo Lang::get('rk');?></th>
									<th class="center">Img</th>
									<?php if($type != "artist"): ?>
										<th><?php echo Lang::get('title');?></th>
									<?php ; endif;?>
									<th><?php echo Lang::get('art')?></th> 
									<th class="center"><?php echo Lang::get('play_x')?></th>
								</tr>
								<?php 
									$i = 0;
									foreach ($list as $value) 
									{
										$name = $value["name"];
										if($type == "artist"){
											$artist = $name;
										}else{
											$artist = $value["artist"]["name"];
										}	
										$plays = $value["playcount"];
										
									?>
									<tr>
										<td></td>
										<td class='rk-col text-center'>
											<?php echo $value["rank"];?>
										</td>
										<td class="getimage" id="rankid<?php echo $value["rank"];?>" data-type="<?php echo $type;?>" data-name="<?php echo htmlentities($name, ENT_QUOTES);?>" data-mbid="" data-artist="<?php echo htmlentities($artist, ENT_QUOTES);?>"><?php echo S::loader(30);?></td>
										<td class="left"><a href=<?php echo Route::url("lib_".substr($type, 0, 3), array("name" => Functions::fixLFM($name), "artist" => Functions::fixLFM($artist), "login" => $user->login));?>><?php echo $name;?></a></td>
										<?php 
										if($type != "artist")
										{ 
										?>
											<td class="left col-md-4"><a href=<?php echo Route::url("lib_art", array("name" => Functions::fixLFM($artist), "login" => $user->login));?>><?php echo $artist;?></a></td> 
										<?php 
										}
										?>
										<td class='rk-col text-center'>
											<?php echo $plays;?>
										</td>
									</tr>

									<?php
										$i++;
										if($i >= 50)
										{
											break;
										}
									}

								?>
							</table>
								
						<?php
						}
						else
						{
							echo "<div class=text-center>".Lang::get("no_data")."</div>";
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