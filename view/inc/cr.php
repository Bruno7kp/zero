<?php 
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
use B7KP\Utils\Constants as C;
use B7KP\Utils\Snippets as S;
use B7KP\Utils\Functions as F;
?>

<?php 
if(is_array($cr)) 
{ 
	$typelib = "lib_".substr($type, 0, 3);
	$cond = array("name" => F::fixLFM($name), "artist" => F::fixLFM($artist), "login" => $user->login);
	$liburl = Route::url($typelib, $cond);
?>
<div class="row text-center">
<h3 class="bottomspace-xs">Chart-run <?php echo Lang::get("of");?> <a href=<?php echo $liburl;?>><?php echo $name;?></a></h3>
<a href="#!" class="switchto"><small><?php echo Lang::get("switch");?> chart-run</small></a>
<div class="col-md-12 text-center topspace-md main">
	<?php 
	$base = Url::getBaseUrl()."/user/".$user->login."/charts/".$type."/week/";
	$cr = array_reverse($cr);
	$wktxt = strtoupper(Lang::get('wk'));
	$wktxtplu = strtoupper(Lang::get('wk_x'));
	$outof = strtoupper(Lang::get('outof'));
	$wktxt = strlen($wktxt) > 4 ? substr($wktxt, 0, 3)."." : $wktxt;
	$simplerun = "";
	foreach ($cr as $key => $value) {
		$thisweek = $value["week"]["week"];
		$thisfrom = $value["week"]["from"];
		$url 	  = $base.$thisweek;
		$thisto = "<a href=\"".$url."\">".$value["week"]["to"]."</a>\n";
		$thisto .= "<span class=\"text-muted\">".$value["playcount"]["playcount"]." ".mb_strtolower(Lang::get('play_x'))."</span>\n";
		echo "<a class='cr-btn divider ".S::getRankColor($value["rank"]["rank"], $peak)."' title='".$wktxt." ".$thisweek."' data-toggle='popover' data-placement='auto top' data-content='".$thisto."'>";
		echo $value["rank"]["rank"];
		echo "</a>";
		$simplerun .= $value["rank"]["rank"] . " - ";
		if(isset($cr[$key+1]))
		{
			$diff = $cr[$key+1]["week"]["week"] - $thisweek - 1; 
			if($diff > 0)
			{
				$simplerun .= "OUT (".$diff."x) - ";
				echo "<a class='cr-btn divider wksout' title='<i class=\"ti-help\"></i>' data-toggle='popover' data-placement='auto top' data-content='<a>".$wktxtplu." ".$outof."</a>'>";
					echo $diff."x";
					echo "</a>";
			}
		}
	}
	?>
</div>
<div class="col-md-12 text-center topspace-md sub hidden">
	<?php echo "<small class='simplerun'>".$simplerun."...</small>"; ?>
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
</div>
<?php } ?>