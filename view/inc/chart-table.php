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
		<th>Chart-run</th>
		<th>Rank</th>
		<th>Name</th>
		<?php if($type != "artist"): ?><th>Artist</th> <?php ; endif;?>
		<th>Plays</th>
	</tr>
	<?php 
	var_dump($list);
	foreach ($list as $value) {
		$stats = $value['stats'][$week];
		$item = $value['item'];
	?>
	<tr>
		<td><i class='ti-plus'></i></td>
		<td><?php echo $stats["rank"]["rank"];?></td>
		<td><?php echo $stats["rank"]["move"];?></td>
		<td><?php echo $item->$type;?></td>
		<td><?php echo $item->artist;?></td>
		<td><?php echo $stats["playcount"]["playcount"];?></td>
		<td><?php echo $stats["playcount"]["move"];?></td>
		<td><?php echo $stats["week"];?></td>
		<?php 

		?>
	</tr>
	<tr>
		<td colspan=>
		Chart-run
		</td>
	</tr>
	<?php
	}
	?>
</table>