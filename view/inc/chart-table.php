<?php
use B7KP\Entity\Settings;

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
$show_points 		= $settings->show_points;
$show_move 			= $settings->show_move;

echo $style;
echo $js;
if($show_first_image)
{
//var_dump($list);
}
?>
<table class="chart-table table-fluid">
	<tr>
		<th class="cr-col">Chart-run</th>
		<th>Rank</th>
		<th>Name</th>
		<?php if($type != "artist"): ?><th>Artist</th> <?php ; endif;?>
		<th>Plays</th>
		<th>Peak</th>
		<th>Weeks</th>
	</tr>
	<?php 
	foreach ($list as $value) {
		$todate 	= $value["stats"]["stats"]["todate"];
		$stats 		= $value["stats"]["chartrun"][$week];
		$item 		= $value["item"];
		// vars
		$position 	= $stats["rank"]["rank"];
		$move 		= $stats["rank"]["move"];
		$name 		= $item->$type;
		$artist 	= $item->artist;
		$plays 		= $stats["playcount"]["playcount"];
		$playsmove 	= $stats["playcount"]["move"];
		$totalweeks = $todate["weeks"]["total"];
		$peak 		= $todate["overall"]["peak"];
	?>
	<tr>
		<td class="cr-col">
			<a class="cr-icon"><i class="ti-stats-up"></i></a>
		</td>
		<td><?php echo $position;?></td>
		<td><?php echo $name;?></td>
		<?php if($type != "artist"): ?>
		<td><?php echo $artist;?></td> 
		<?php ; endif;?>
		<td><?php echo $plays;?></td>
		<td><?php echo $peak;?></td>
		<td><?php echo $totalweeks;?></td>
		<?php 

		?>
	</tr>
	<tr style="display:none;">
		<td colspan="7">
		Chart-run
		</td>
	</tr>
	<?php
	}
	?>
</table>
<div style="display:none;"><div id="copyme_alt">dasd</div></div>