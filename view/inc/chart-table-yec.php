<?php
use B7KP\Entity\Settings;
use B7KP\Library\Lang;
use B7KP\Library\Route;
use B7KP\Library\Url;
use LastFmApi\Main\LastFm;
use B7KP\Utils\Constants as C;
use B7KP\Utils\Certified;
use B7KP\Utils\Functions;
use B7KP\Utils\Snippets as S;

if($settings instanceof Settings)
{
	isset($settings->style) ? $this->setCssFile($settings->style) : "";
}
else
{
	$settings = new Settings();
}
//$style 				= $this->getCssContent();
$js 				= $this->getMainContent();
$show_images 		= $settings->show_images;
$show_dropouts 		= false;
$show_first_image 	= $settings->show_first_image;
$show_playcounts 	= $settings->show_playcounts;
$show_move 			= false;
$show_times 		= $settings->show_times;
$show_plaque		= false;
$show_wkl_cert		= false;
$show_cert			= false;
$subs 				= substr($type, 0,3)."_limit";
$limit 				= $settings->$subs;
$new_certs = array();

//echo $style;
echo $js;
if($show_first_image && count($list)>0)
{
	$first = $list[0]['item'];
	$get = "get".ucfirst($type)."Info";
	$lfm = new LastFM();
	if($type == "artist")
	{
		$f = $lfm->$get($first->$type);
	}
	else
	{
		$t = substr($type, 0,3)."_mbid";
		$f = $lfm->$get($first->$type, $first->artist, $first->$t);
	}
	if($type == "music")
	{
		$fa = $lfm->getArtistInfo($f["artist"]["name"]);
		$fimg = $fa["images"]["large"];
	}
	else
	{
		$fimg = $f["images"]["large"];
	}

	if ($type == "album") {
		echo "<div class='text-center bottomspace-xl'><img src='" . $fimg . "'/></div>";
	} else {
		echo "<div class='text-center bottomspace-xl'><img height='174' src='/web/img/default-art.png' data-spotify-artist='".htmlentities($first->artist, ENT_QUOTES)."'/></div>";
	}
}
$lastw = array();
?>
<table class="chart-table table-fluid topspace-md">
	<tr>
		<th class="cr-col min center">+</th>
		<th class="center"><?php echo Lang::get('rk');?></th>
		<?php if($show_images): ?>
			<th class="center">Img</th>
		<?php ; endif;?>
		<?php if($type != "artist"): ?>
			<th><?php echo Lang::get('title');?></th>
		<?php ; endif;?>
		<th><?php echo Lang::get('art')?></th> 
		<?php if($show_playcounts): ?>
			<th class="center"><?php echo Lang::get('play_x')?></th>
		<?php ; endif;?>
		<th class="center"><?php echo Lang::get('pk')?></th>
		<th class="center"><?php echo Lang::get('wk_x')?></th>
	</tr>
	<?php 
	//var_dump($lastw);
	if(!is_array($list) || count($list) == 0)
	{
		$list = array();
		echo "<tr><td colspan='10'>".Lang::get('no_data')."</td></tr>";
	}
	else
	{
		foreach ($list as $value) 
		{
			$todate 	= $value["stats"]["stats"]["todate"];
			//$stats 		= $value["stats"]["chartrun"][$lw];
			$cr 		= $value["stats"]["chartrun"];
			$item 		= $value["item"];
			$cp_todate 	= $todate["overall"]["chartpoints"];

			// vars
			$position 	= $item->rank;
			$move 		= false;
			$moveclass  = false;
			$name 		= $item->$type;
			$artist 	= $item->artist;
			$plays 		= $item->playcount;
			$playsmove 	= false;
			$pmclass  	= false;
			$playsmove  = false;
			$move  		= false;
			$totalweeks = $todate["weeks"]["total"];
			$wkstop1 	= $todate["weeks"]["top01"];
			$wkstop5 	= $todate["weeks"]["top05"];
			$wkstop10 	= $todate["weeks"]["top10"];
			$wkstop20 	= $todate["weeks"]["top20"];
			$peak 		= isset($todate["overall"]["peak"]) ? $todate["overall"]["peak"] : 0;
			$t = substr($type, 0,3)."_mbid";
			$mbid = $item->$t;

			# new certs
			
			if($show_cert && $show_wkl_cert && $type != "artist" && $settings->cert_type == "1")
			{
				$certified = new Certified($this->user, $this->factory);
				$cert_todate = $certified->getCertification($type, $cp_todate);
				$cert_tolw = $certified->getCertification($type, ($cp_todate - (100-(($position-1)*2))));
				$comp_tw = $certified->getValueByArray($type, $cert_todate);
				$comp_lw = $certified->getValueByArray($type, $cert_tolw);
				if($comp_lw != $comp_tw)
				{
					$cert_new = $certified->getCertification($type, $cp_todate, "text+icon");
					$class_new = $certified->getCertification($type, $cp_todate, "class");
					$new_certs[] = array("name" => $name, "artist" => $artist, "points" => $cp_todate, "certified" => $cert_new, "class" => $class_new);
				}	
			}
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
			<?php if($show_images): ?>
				<td class="getimage" id="rankid<?php echo $position;?>" data-type="<?php echo $type;?>" data-name="<?php echo htmlentities($name, ENT_QUOTES);?>" data-mbid="<?php echo $mbid;?>" data-artist="<?php echo htmlentities($artist, ENT_QUOTES);?>"><?php echo S::loader(33);?></td>
			<?php ; endif;?>
			<td class="left"><?php echo htmlentities($name);?></td>
			<?php 
			if($type != "artist")
			{ 
			?>
				<td class="left"><?php echo htmlentities($artist);?></td> 
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
			<?php
			$sp = "";
			if($peak == 1):
				$sp = "rk-sp";
			endif;
			$timespk = isset($todate["rank"][$peak]) ? $todate["rank"][$peak] : 0;
			?>
			<td class='rk-col <?php echo $sp;?>'><?php echo (string) $peak;?>
				<?php 
				if($show_times && $timespk)
				{
				?>
				<br><span class='black'><?php echo $timespk."x"?></span>
				<?php 
				}	
				?>
			</td>
			<td class='rk-col'><?php echo intval($totalweeks)."";?></td>
		</tr>
		<tr style="display:none;" class="cr-row">
			<td colspan="10">
			<?php
				echo S::chartRun($type, $cr, $this->user, $todate, $limit, $name, $artist);
			?>
			</td>
		</tr>
		<?php
		}
	}
	?>
</table>