<?php
use B7KP\Entity\Settings;
use B7KP\Library\Lang;
use B7KP\Library\Route;
use B7KP\Library\Url;
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
//$style 				= $this->getCssContent();
$js 				= $this->getMainContent();
$show_images 		= $settings->show_images;
$show_dropouts 		= $settings->show_dropouts;
$show_first_image 	= $settings->show_first_image;
$show_playcounts 	= $settings->show_playcounts;
$show_move 			= $settings->show_move;
$subs 				= substr($type, 0,3)."_limit";
$limit 				= $settings->$subs;

//echo $style;
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
	
	echo "<div class='text-center bottomspace-xl'><img src='".$fimg."'/></div>";
}

if($show_dropouts && $week > 1)
{
	$weekbefore = $week - 1;
	$cond = array("week" => $weekbefore, "iduser" => $this->user->id);
	$lastweek = $this->factory->find("B7KP\Entity\Week", $cond);
	if(count($lastweek) > 0)
	{
		$lastweek = $lastweek[0];
		$lastw = $this->getWeeklyCharts($lastweek, $type, $limit);
	}
	else
	{
		$show_dropouts = false;
	}
}
?>
<table class="chart-table table-fluid topspace-md">
	<tr>
		<th class="cr-col min center">+</th>
		<th class="center"><?php echo Lang::get('rk');?></th>
		<?php if($show_images): ?>
			<th class="center">Img</th>
		<?php ; endif;?>
		<th><?php echo Lang::get('name');?></th>
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
	//var_dump($lastw);
	foreach ($list as $value) {
		$todate 	= $value["stats"]["stats"]["todate"];
		$stats 		= $value["stats"]["chartrun"][$week];
		$cr 		= $value["stats"]["chartrun"];
		$item 		= $value["item"];
		if($show_dropouts)
		{
			$thembid = substr($type, 0, 3)."_mbid";

			foreach ($lastw as $k => $v) {
				if(!empty($v["item"]->$thembid) && $v["item"]->$thembid == $item->$thembid)
				{
					unset($lastw[$k]);
					break;
				}
				else
				{
					if($type == "artist")
					{
						if($v["item"]->artist == $item->artist)
						{
							unset($lastw[$k]);
							break;
						}
					}
					else
					{
						if($v["item"]->artist == $item->artist && $v["item"]->$type == $item->$type)
						{
							unset($lastw[$k]);
							break;
						}
					}
				}
			}
		}
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
		$wkstop1 	= $todate["weeks"]["top01"];
		$wkstop5 	= $todate["weeks"]["top05"];
		$wkstop10 	= $todate["weeks"]["top10"];
		$wkstop20 	= $todate["weeks"]["top20"];
		$peak 		= $todate["overall"]["peak"];
		$t = substr($type, 0,3)."_mbid";
		$mbid = $item->$t;
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
			<td class="getimage" id="rankid<?php echo $position;?>" data-type="<?php echo $type;?>" data-name="<?php echo $name?>" data-mbid="<?php echo $mbid;?>" data-artist="<?php echo $artist;?>"><?php echo S::loader(30);?></td>
		<?php ; endif;?>
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
	<tr style="display:none;" class="cr-row">
		<td colspan="8">
		<div class="row">
			<h3>Chart-run</h3>
			<div class="col-md-12 text-center">
				<?php 
				$base = Url::getBaseUrl()."/user/".$this->user->login."/charts/".$type."/week/";
				$cr = array_reverse($cr);
				$wktxt = strtoupper(Lang::get('wk'));
				$wktxtplu = strtoupper(Lang::get('wk_x'));
				$outof = strtoupper(Lang::get('outof'));
				$wktxt = strlen($wktxt) > 4 ? substr($wktxt, 0, 3)."." : $wktxt;
				foreach ($cr as $key => $value) {
					$thisweek = $value["week"]["week"];
					$thisfrom = $value["week"]["from"];
					$url 	  = $base.$thisweek;
					$thisto = "<a href=\"".$url."\">".$value["week"]["to"]."</a>\n";
					$thisto .= "<span class=\"text-muted\">".$value["playcount"]["playcount"]." ".strtolower(Lang::get('play_x'))."</span>\n";
					echo "<a class='cr-btn divider ".S::getRankColor($value["rank"]["rank"], $peak)."' title='".$wktxt." ".$thisweek."' data-toggle='popover' data-placement='auto top' data-content='".$thisto."'>";
					echo $value["rank"]["rank"];
					echo "</a>";
					if(isset($cr[$key+1]))
					{

						$diff = $cr[$key+1]["week"]["week"] - $thisweek - 1; 
						if($diff > 0)
						{
							echo "<a class='cr-btn divider wksout' title='".$wktxtplu." ".$outof."' data-toggle='popover' data-placement='auto top' data-content=''>";
								echo $diff."x";
								echo "</a>";
						}
					}
				}
				?>
			</div>
		</div>
		<div class="row text-center topspace-lg">
			<div class="col-md-8 col-md-offset-2">
				<div class="center">
				<?php 
				echo "<h4>".Lang::get('wk_x')." ".Lang::get('on')."...</h4>";

				echo "<div class='dest divider'><b>Top 1</b><hr/>".$wkstop1."</div>";
				echo "<div class='dest divider'><b>Top 5</b><hr/>".$wkstop5."</div>";
				if($limit >= 10)
				{
					echo "<div class='dest divider'><b>Top 10</b><hr/>".$wkstop10."</div>";
					if($limit >= 20)
					{
						echo "<div class='dest divider'><b>Top 20</b><hr/>".$wkstop20."</div>";
					}
				}
				?>
				</div>
		</div>
		</td>
	</tr>
	<?php
	}
	?>
	<?php 
	if($show_dropouts && count($lastw) > 0)
	{
	?>
	<tr>
		<th colspan="8"><small class="topspace-lg"><?php echo Lang::get('dropouts');?></small></th>
	</tr>
	<?php
		foreach ($lastw as $dropk => $dropv) 
		{
			$dropitem = $dropv["item"];
			$name 	= $dropitem->$type;
			$artist = $dropitem->artist;
			$mbid 	= "";
			$todate = $dropv["stats"]["stats"]["todate"];
			$stats 	= $dropv["stats"]["chartrun"][$week-1];
			$cr 		= $dropv["stats"]["chartrun"];
			$position 	= $stats["rank"]["rank"];
			$plays 		= $stats["playcount"]["playcount"];
			$totalweeks = $todate["weeks"]["total"];
			$wkstop1 	= $todate["weeks"]["top01"];
			$wkstop5 	= $todate["weeks"]["top05"];
			$wkstop10 	= $todate["weeks"]["top10"];
			$wkstop20 	= $todate["weeks"]["top20"];
			$peak 		= $todate["overall"]["peak"];
	?>
	<tr class="drops">
		<td class="cr-col min">
			<a class="cr-icon"><i class="ti-stats-up"></i></a>
		</td>
		<td>
			<?php echo strtoupper(Lang::get('out'));?>
			<br/>
			<small>LW: <?php echo $position;?></small>
		</td>
		<?php if($show_images): ?>
			<td class="getimage" id="rankout<?php echo $dropk;?>" data-type="<?php echo $type;?>" data-name="<?php echo $name?>" data-mbid="<?php echo $mbid;?>" data-artist="<?php echo $artist;?>"><?php echo S::loader(30);?></td>
		<?php ; endif;?>
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
			<td>
				<?php echo strtoupper(Lang::get('out'));?>
				<br/>
				<small>LW: <?php echo $plays;?></small>
			</td>
		<?php 
		}
		?>
		<td><?php echo $peak;?></td>
		<td><?php echo $totalweeks;?></td>
	</tr>
	<tr style="display:none;" class="cr-row">
		<td colspan="8">
		<div class="row">
			<h3>Chart-run</h3>
			<div class="col-md-12 text-center">
				<?php 
				$base = Url::getBaseUrl()."/user/".$this->user->login."/charts/".$type."/week/";
				$cr = array_reverse($cr);
				$wktxt = strtoupper(Lang::get('wk'));
				$wktxtplu = strtoupper(Lang::get('wk_x'));
				$outof = strtoupper(Lang::get('outof'));
				$wktxt = strlen($wktxt) > 4 ? substr($wktxt, 0, 3)."." : $wktxt;
				foreach ($cr as $key => $value) {
					$thisweek = $value["week"]["week"];
					$thisfrom = $value["week"]["from"];
					$url 	  = $base.$thisweek;
					$thisto = "<a href=\"".$url."\">".$value["week"]["to"]."</a>\n";
					$thisto .= "<span class=\"text-muted\">".$value["playcount"]["playcount"]." ".strtolower(Lang::get('play_x'))."</span>\n";
					echo "<a class='cr-btn divider ".S::getRankColor($value["rank"]["rank"], $peak)."' title='".$wktxt." ".$thisweek."' data-toggle='popover' data-placement='auto top' data-content='".$thisto."'>";
					echo $value["rank"]["rank"];
					echo "</a>";
					if(isset($cr[$key+1]))
					{

						$diff = $cr[$key+1]["week"]["week"] - $thisweek - 1; 
						if($diff > 0)
						{
							echo "<a class='cr-btn divider wksout' title='".$wktxtplu." ".$outof."' data-toggle='popover' data-placement='auto top' data-content=''>";
								echo $diff."x";
								echo "</a>";
						}
					}
				}
				?>
			</div>
		</div>
		<div class="row text-center topspace-lg">
			<div class="col-md-8 col-md-offset-2">
				<div class="center">
				<?php 
				echo "<h4>".Lang::get('wk_x')." ".Lang::get('on')."...</h4>";

				echo "<div class='dest divider'><b>Top 1</b><hr/>".$wkstop1."</div>";
				echo "<div class='dest divider'><b>Top 5</b><hr/>".$wkstop5."</div>";
				if($limit >= 10)
				{
					echo "<div class='dest divider'><b>Top 10</b><hr/>".$wkstop10."</div>";
					if($limit >= 20)
					{
						echo "<div class='dest divider'><b>Top 20</b><hr/>".$wkstop20."</div>";
					}
				}
				?>
				</div>
		</div>
		</td>
	</tr>
	<?php
		}
	}
	?>
</table>
<div style="display:none;">
	<div id="copyme_alt">
		<?php 
		$simple = $this->user->login." :: Top ".Lang::get(substr($type, 0,3)."_x")." - ".Lang::get('wk')." ".$week." \n";
		$simple .= Lang::get('rk')." | ".Lang::get('name')." | ";
		if($type != "artist"): $simple .= Lang::get('art')." | "; endif;
		if($show_playcounts): $simple .= Lang::get('play_x')." | "; endif;
		$simple .= Lang::get('pk')." | ".Lang::get('wk_x')."\n";

		foreach ($list as $sim => $ple) {
			$todate 	= $ple["stats"]["stats"]["todate"];
			$stats 		= $ple["stats"]["chartrun"][$week];
			$cr 		= $ple["stats"]["chartrun"];
			$item 		= $ple["item"];
			$position 	= $stats["rank"]["rank"];
			$move 		= S::getMove($show_move, $stats["rank"]["move"], $stats["rank"]["lw"]);
			$name 		= $item->$type;
			$artist 	= $item->artist;
			$plays 		= $stats["playcount"]["playcount"];
			$playsmove 	= S::getMove($show_move, $stats["playcount"]["move"], $stats["playcount"]["lw"], true);
			if(intval($move) > 0 && C::SHOW_MOVE_LW != $show_move):	$move = "+".$move; endif;
			if(intval($playsmove) > 0 && C::SHOW_MOVE_LW != $show_move):	$playsmove = "+".$playsmove; endif;
			$totalweeks = $todate["weeks"]["total"];
			$peak 		= $todate["overall"]["peak"];

			$simple .= $position." (".$move.") ";
			$simple .= $name." ";
			if($type != "artist"): $simple .= "- ".$artist; endif; 
			if($show_playcounts): $simple .= " | ".$plays." (".$playsmove.")"; endif;
			$simple .= " | ".$peak." | ".$totalweeks."\n";

		}

		echo $simple;
		?>
	</div>
</div>