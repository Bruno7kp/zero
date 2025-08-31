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
						<div class="col-xs-12 topspace-md" data-live="<?php echo $type;?>" data-user="<?php echo $user->login;?>" data-from="<?php echo $time["from"];?>" data-to="<?php echo $time["to"];?>">
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
										<td class="getimage" id="rankid<?php echo $value["rank"];?>" data-type="<?php echo $type;?>" data-name="<?php echo htmlentities($name, ENT_QUOTES);?>" data-mbid="" data-artist="<?php echo htmlentities($artist, ENT_QUOTES);?>"><?php echo S::loader(33);?></td>
										<td class="left"><a href=<?php echo Route::url("lib_".substr($type, 0, 3), array("name" => Functions::fixLFM($name), "artist" => Functions::fixLFM($artist), "login" => $user->login));?>><?php echo htmlentities($name);?></a></td>
										<?php 
										if($type != "artist")
										{ 
										?>
											<td class="left col-md-4"><a href=<?php echo Route::url("lib_art", array("name" => Functions::fixLFM($artist), "login" => $user->login));?>><?php echo htmlentities($artist);?></a></td> 
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
			<table class="chart-table table-fluid topspace-md" data-template style="display:none;">
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
				<tr>
					<td></td>
					<td class='rk-col text-center'>
						
					</td>
					<td id="rankid" data-type="" data-name="" data-mbid="" data-artist=""><?php echo S::loader(33);?></td>
					<td class="left"></td>
					<?php 
					if($type != "artist")
					{ 
					?>
					<td class="left col-md-4"></td> 
					<?php 
					}
					?>
					<td class='rk-col text-center'>
						
					</td>
				</tr>
			</table>
			<script>
				$(document).ready(function() {
					const el = $("[data-live]");
					let type = el.attr("data-live");
					if (type == "music") {
						type = "track";
					}
					const login = el.attr("data-user");
					const from = el.attr("data-from");
					const to = el.attr("data-to");
					$.ajax({
						url: "https://ws.audioscrobbler.com/2.0/",
						data: {
							method: "user.getweekly" + type + "chart",
							user: login,
							api_key: apiKey,
							from: from,
							to: to,
							format: "json"
						},
						success: function(data) {
							let artists = [];
							if (type == "artist") {
								artists = data.weeklyartistchart.artist;
							} else if (type == "album") {
								artists = data.weeklyalbumchart.album;
							} else if (type == "track") {
								artists = data.weeklytrackchart.track;
							}
							artists = artists.slice(0, 50);
							const table = $("[data-template]").clone();
							const row = table.find("tr:eq(1)");
							let i = 0;
							for(const artist of artists) {
								const clone = row.clone();
								clone.find("td:eq(1)").text(i + 1);
								clone.find("td:eq(3)").text(artist.name);
								if (type != "artist") {
									clone.find("td:eq(4)").html(artist.artist["#text"]);
									clone.find("td:eq(5)").text(artist.playcount);
								} else {
									clone.find("td:eq(4)").text(artist.playcount);
								}
								clone.find("td:eq(2)")
									.addClass("getimage")
									.attr("id", "rankid" + i)
									.attr("data-type", type)
									.attr("data-name", artist.name)
									.attr("data-mbid", artist.mbid ? artist.mbid : "")
									.attr("data-artist", type == "artist" ? artist.name : artist.artist["#text"]);
								table.append(clone);
								i++;
							}
							row.remove();
							table.removeAttr("style");
							table.removeAttr("data-template");
							el.html(table);
							setTimeout(function() {
								chartinit();
							}, 1000);
						}
					});
					
				});
			</script>
		</div>
	</body>
</html>