<?php 
namespace B7KP\Utils;

use B7KP\Utils\Constants as C;
use B7KP\Library\Url; 

class Snippets
{
	static function recentListRow($name, $img, $artist, $album, $url)
	{
		if(empty($img))
		{
			$img = Url::asset("img/default-alb.png");
		}
		if(!empty($album))
		{
			$album = "<small class='text-muted'>".$album."</small>
				<br>";
		}
		return "
		<div class='row bottomspace-xs'>
			<div class='col-xs-3'>
				<img class='img-responsive' src='{$img}' alt='{$name}'>
			</div>
			<div class='col-xs-9'>
				<a href='{$url}' target='_blank'>{$name}</a>
				<br>
				".$album."
				<small>{$artist}</small>
			</div>
		</div>
		";
	}

	static function topActListRow($name, $url, $playcount, $img, $biggest)
	{
		$perc = $playcount/$biggest*100;
		return "
		<div class='row'>
			<div class='col-xs-3'>
				<img class='img-responsive' src='{$img}' alt='{$name}'>
			</div>
			<div class='col-xs-9'>
				<a href='{$url}' target='_blank'>{$name}</a>
				<br>
				<small class='text-muted'>{$playcount} plays</small>
				<br>
				<div class='progress'>
				  <div class='progress-bar progress-bar-default' role='progressbar' aria-valuenow='{$perc}' aria-valuemin='0' aria-valuemax='100' style='width: {$perc}%'>
				    <span class='sr-only'>{$perc}% of the number 1 act</span>
				  </div>
				</div>
			</div>
		</div>
		";
	}

	static function topAlbListRow($name, $url, $playcount, $img, $biggest, $artist, $arturl)
	{
		$perc = $playcount/$biggest*100;
		return "
		<div class='row'>
			<div class='col-xs-3'>
				<img class='img-responsive' src='{$img}' alt='{$name}'>
			</div>
			<div class='col-xs-9'>
				<a href='{$url}' target='_blank'>{$name}</a> 
				<br>
				<small class='text-muted'>by <a href='{$arturl}' target='_blank'>{$artist}</a></small>
				<br>
				<small class='text-muted'>{$playcount} plays</small>
				<br>
				<div class='progress'>
				  <div class='progress-bar progress-bar-default' role='progressbar' aria-valuenow='{$perc}' aria-valuemin='0' aria-valuemax='100' style='width: {$perc}%'>
				    <span class='sr-only'>{$perc}% of the number 1 act</span>
				  </div>
				</div>
			</div>
		</div>
		";
	}

	static function topMusListRow($name, $url, $playcount, $img, $biggest, $artist, $arturl, $album, $alburl)
	{
		$perc = $playcount/$biggest*100;
		return "
		<div class='row'>
			<div class='col-xs-3'>
				<img class='img-responsive' src='{$img}' alt='{$name}'>
			</div>
			<div class='col-xs-9'>
				<a href='{$url}' target='_blank'>{$name}</a> 
				<br>
				<small class='text-muted'>by <a href='{$arturl}' target='_blank'>{$artist}</a></small>
				<br>
				<small class='text-muted'>{$playcount} plays</small>
				<br>
				<div class='progress'>
				  <div class='progress-bar progress-bar-default' role='progressbar' aria-valuenow='{$perc}' aria-valuemin='0' aria-valuemax='100' style='width: {$perc}%'>
				    <span class='sr-only'>{$perc}% of the number 1 act</span>
				  </div>
				</div>
			</div>
		</div>
		";
	}

	static function loader($size)
	{
		return "
		<img src='".Url::asset("img/loader.gif")."' style='margin: 15px 0px; width: ".$size."px' alt='loading...'>
		";
	}

	static function specMusRow($value, $user, $move, $icon)
	{
		$lfm = new \LastFmApi\Main\LastFm();
		$lfm->setUser($user->login);
		$art = $lfm->getMusicInfo($value->music, $value->artist, $value->mus_mbid);
		$bgimg = $art['album']['image']['extralarge'];
		if(empty($bgimg))
		{
			$artimg = $lfm->getArtistInfo($art['artist']['name'], $art['artist']['mbid']);
			$bgimg = $artimg['images']['extralarge'];
		}
		$html = "<div class='row'>";
		$html .= "<div class='col-xs-12'>";
		$html .= "<div style='background: url(".$bgimg.") center; background-size:cover;'>";
		$html .= "<div class='bg text-center'>";
		$html .= "<div class='row'>";
		$html .= "<div class='col-sm-8 white'>";
		$html .= "<h1>".$value->music."<small class='text-muted-alt br'>".$value->artist."</small><h1>";
		$html .= "<div class='row bigtxt'>";
		$html .= "<div class='col-xs-4'>";
		$html .= "#".$value->rank."<small>rank</small>";
		$html .= "</div>";
		$html .= "<div class='col-xs-4'>";
		$html .= "".$value->playcount."<small>plays</small>";
		$html .= "</div>"; // col-xs-4
		$html .= "<div class='col-xs-4'>";
		$html .= "<i class='".$icon."'></i><small>".$move."</small>";
		$html .= "</div>"; // col-xs-4
		$html .= "</div>"; // row3
		$html .= "</div>"; // col-md-8
		$html .= "<div class='col-sm-4'>";
		$html .= "<img class='full' src='".$bgimg."'>";
		$html .= "</div>"; // col-md-4
		$html .= "</div>"; // row2
		$html .= "</div>"; // bg
		$html .= "</div>"; // background
		$html .= "</div>"; // col-xs-12
		$html .= "</div>"; // row1
		
		return $html;
	}

	static function specArtRow($value, $user, $move, $icon)
	{
		$lfm = new \LastFmApi\Main\LastFm();
		$lfm->setUser($user->login);
		$art = $lfm->getArtistInfo($value->artist, $value->art_mbid);
		$html = "<div class='row'>";
		$html .= "<div class='col-xs-12'>";
		$html .= "<div style='background: url(".$art['images']['mega'].") center; background-size:cover;'>";
		$html .= "<div class='bg text-center'>";
		$html .= "<div class='row'>";
		$html .= "<div class='col-sm-8 white'>";
		$html .= "<h1>".$value->artist."<h1>";
		$html .= "<div class='row bigtxt'>";
		$html .= "<div class='col-xs-4'>";
		$html .= "#".$value->rank."<small>rank</small>";
		$html .= "</div>";
		$html .= "<div class='col-xs-4'>";
		$html .= "".$value->playcount."<small>plays</small>";
		$html .= "</div>"; // col-xs-4
		$html .= "<div class='col-xs-4'>";
		$html .= "<i class='".$icon."'></i><small>".$move."</small>";
		$html .= "</div>"; // col-xs-4
		$html .= "</div>"; // row3
		$html .= "</div>"; // col-md-8
		$html .= "<div class='col-sm-4'>";
		$html .= "<img class='full' src='".$art['images']['extralarge']."'>";
		$html .= "</div>"; // col-md-4
		$html .= "</div>"; // row2
		$html .= "</div>"; // bg
		$html .= "</div>"; // background
		$html .= "</div>"; // col-xs-12
		$html .= "</div>"; // row1

		return $html;
	}

	static function specAlbRow($value, $user, $move, $icon)
	{
		$lfm = new \LastFmApi\Main\LastFm();
		$lfm->setUser($user->login);
		$art = $lfm->getAlbumInfo($value->album, $value->artist, $value->alb_mbid);
		$html = "<div class='row'>";
		$html .= "<div class='col-xs-12'>";
		$html .= "<div style='background: url(".$art['images']['mega'].") center; background-size:cover;'>";
		$html .= "<div class='bg text-center'>";
		$html .= "<div class='row'>";
		$html .= "<div class='col-sm-8 white'>";
		$html .= "<h1>".$value->album."<small class='text-muted-alt br'>".$value->artist."</small><h1>";
		$html .= "<div class='row bigtxt'>";
		$html .= "<div class='col-xs-4'>";
		$html .= "#".$value->rank."<small>rank</small>";
		$html .= "</div>";
		$html .= "<div class='col-xs-4'>";
		$html .= "".$value->playcount."<small>plays</small>";
		$html .= "</div>"; // col-xs-4
		$html .= "<div class='col-xs-4'>";
		$html .= "<i class='".$icon."'></i><small>".$move."</small>";
		$html .= "</div>"; // col-xs-4
		$html .= "</div>"; // row3
		$html .= "</div>"; // col-md-8
		$html .= "<div class='col-sm-4'>";
		$html .= "<img class='full' src='".$art['images']['extralarge']."'>";
		$html .= "</div>"; // col-md-4
		$html .= "</div>"; // row2
		$html .= "</div>"; // bg
		$html .= "</div>"; // background
		$html .= "</div>"; // col-xs-12
		$html .= "</div>"; // row1

		return $html;
	}

	static function getMove($show_move, $move, $lw, $ispt = false)
	{
		switch ($show_move) {
		case C::SHOW_MOVE_HIDDEN:
			$move = "";
			break;

		case C::SHOW_MOVE_DIFF:
			$move = $move;
			break;

		case C::SHOW_MOVE_LW:
			$move = $lw;
			break;

		case C::SHOW_MOVE_PERC:
			if($ispt)
			{
				if(is_numeric($lw))
				{
					$tw = $lw + intval($move);
					$move = round((($tw/$lw)-1)*100, 2)."%";
				}
				else
				{
					$move = $lw;
				}
			}
			else
			{
				$move = self::getMove(C::SHOW_MOVE_DIFF, $move, $lw);
			}
			break;
		}
		return $move;
	}
}
?>