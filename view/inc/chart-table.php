<?php
use B7KP\Entity\Settings;
use B7KP\Library\Lang;
use LastFmApi\Main\LastFm;
use B7KP\Utils\Constants as C;
use B7KP\Utils\Snippets as S;

if($settings instanceof Settings)
{
	isset($settings->style) ? $this->setCssFile($settings->style) : "";
}
else
{
	$settings = new Settings();
}
$style 				= $this->getCssContent();
$js 				= $this->getMainContent();
$show_images 		= $settings->show_images;
$show_dropouts 		= $settings->show_dropouts;
$show_first_image 	= $settings->show_first_image;
$show_playcounts 		= $settings->show_playcounts;
$show_move 			= $settings->show_move;


echo $style;
echo $js;
if($show_first_image && count($list)>0)
{
	$first = $list[0]['item'];
	$get = "get".ucfirst($type)."Info";
	$lfm = new LastFM();
	if($type == "artist")
	{
		$f = $lfm->$get($first->$type, $first->art_mbid);
	}
	else
	{
		$t = substr($type, 0,3)."_mbid";
		$f = $lfm->$get($first->$type, $first->artist, $first->$t);
	}
	if($type == "music")
	{
		if(isset($f["album"]["image"]["large"]) && !empty($f["album"]["image"]["large"]))
		{
			$fimg = $f["album"]["image"]["large"];
		}
		else
		{
			$fa = $lfm->getArtistInfo($f["artist"]["name"], $f["artist"]["mbid"]);
			$fimg = $fa["images"]["large"];
		}
	}
	else
	{
		$fimg = $f["images"]["large"];
	}
	
	echo "<div class='text-center'><img src='".$fimg."'/></div>";
}
?>
<table class="chart-table table-fluid topspace-md">
	<tr>
		<th class="cr-col min center">+</th>
		<th class="center"><?php echo Lang::get('rk')?></th>
		<th><?php echo Lang::get('name')?></th>
		<?php if($type != "artist"): ?>
			<th><?php echo Lang::get('art')?></th> 
		<?php ; endif;?>
		<?php if($show_playcounts): ?>
			<th class="center"><?php echo Lang::get('play_x')?></th>
		<?php ; endif;?>
		<th class="center"><?php echo Lang::get('pk')?></th>
		<th class="center"><?php echo Lang::get('wk_x')?></th>
	</tr>
	<?php 
	foreach ($list as $value) {
		$todate 	= $value["stats"]["stats"]["todate"];
		$stats 		= $value["stats"]["chartrun"][$week];
		$item 		= $value["item"];
		// vars
		$position 	= $stats["rank"]["rank"];
		$move 		= S::getMove($show_move, $stats["rank"]["move"], $stats["rank"]["lw"]);
		$moveclass  = S::getMoveClass($show_move, $move, $position, true);
		$name 		= $item->$type;
		$artist 	= $item->artist;
		$plays 		= $stats["playcount"]["playcount"];
		$playsmove 	= S::getMove($show_move, $stats["playcount"]["move"], $stats["playcount"]["lw"], true);
		$pmclass  	= S::getMoveClass($show_move, $playsmove, $plays, false);
		$playsmove  = C::SHOW_MOVE_LW == $show_move ? "<span class='black'>LW:</span> ".$playsmove : $playsmove; 
		$move  		= C::SHOW_MOVE_LW == $show_move ? "<span class='black'>LW:</span> ".$move : $move;
		if(intval($move) > 0):	$move = "+".$move; endif;
		if(intval($playsmove) > 0):	$playsmove = "+".$playsmove; endif;
		$totalweeks = $todate["weeks"]["total"];
		$peak 		= $todate["overall"]["peak"];
	?>
	<tr>
		<td class="cr-col min">
			<a class="cr-icon"><i class="ti-stats-up"></i></a>
		</td>
		<td class='rk-col'>
			<?php echo $position;?>
			<br/>
			<span class="<?php echo $moveclass;?>"><?php echo $move;?></span>
		</td>
		<td class="left"><?php echo $name;?></td>
		<?php 
		if($type != "artist")
		{ 
		?>
			<td class="left"><?php echo $artist;?></td> 
		<?php 
		}
		if($show_playcounts)
		{ 
		?>
			<td class='rk-col'>
				<?php echo $plays;?>
				<br/>
				<span class="<?php echo $pmclass;?>"><?php echo $playsmove;?></span>
			</td>
		<?php 
		}
		?>
		<td><?php echo $peak;?></td>
		<td><?php echo $totalweeks;?></td>
	</tr>
	<tr style="display:none;">
		<td colspan="7">
		Chart-run
		</td>
	</tr>
	<?php
	}
	?>
	<?php 
	if($show_dropouts)
	{
	?>
	<tr>
		<th colspan="7">Dropouts</th>
	</tr>
	<?php
	}
	?>
</table>
<div style="display:none;"><div id="copyme_alt">dasd</div></div>