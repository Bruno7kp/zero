<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>

<div class="col-md-6 col-md-offset-3 bg-white">
	<h3><?php echo Lang::get("edit")." Chart"." :: ".Lang::get("wk")." ".$week->week;?></h3>
	<p class="text-muted"><?php echo Lang::get("tied");?></p>
	<?php 
		$limit = substr($type, 0, 3)."_limit";
		$limit = $settings->$limit;
		$editgroup = array();
		$editable = false;
		foreach ($list as $key => $value) 
		{
			if($value["rank"] <= $limit || $value["playcount"] == $list[$key-1]["playcount"])
			{
				if(!isset($editgroup[$value["playcount"]]))
				{
					$editgroup[$value["playcount"]] = 1;
					echo "<ul class='list-group editablelist' id='".$value["playcount"]."'>";
					echo "<small class='text-primary'>".$value["playcount"]." ".Lang::get('play_x')." - ".Lang::get('rk')." #".$value["rank"]."</small>";
				}
				else
				{
					$editgroup[$value["playcount"]]++;
					$editable = true;
				}
				$name = $value["name"];
				$artist = null;
				$artmbid = null;
				if($type != "artist")
				{
					$name = $value["name"]." - ".$value["artist"]["name"];
					$artist = $value["artist"]["name"];
					$artmbid = $value["artist"]["mbid"];
				}
					echo "<li class='list-group-item pd-list-fix' data-playcount=".$value["playcount"]." data-name='".htmlentities($value["name"], ENT_QUOTES)."' data-artist='".htmlentities($artist, ENT_QUOTES)."' data-mbid='".$value["mbid"]."' data-artist-mbid='".$artmbid."''>".$name."</li>";

				if(!isset($list[$key+1]) || $list[$key+1]["playcount"] != $value["playcount"])
				{
					echo "</ul>";
				}
			}
			else
			{
				break;
			}
		}
	?>
	<div class="topspace-md">
		<?php 
		if($editable)
		{
			echo "<button class='btn btn-info btn-custom btn-sm' id='btn-wk-edit' data-type='".$type."' data-week=".$week->id.">".Lang::get('edit')."</button>";
		}
		else
		{
			echo Lang::get('no_edit');
		}
		?>
	</div>
</div>
