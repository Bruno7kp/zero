<?php 
namespace B7KP\Utils;

use B7KP\Library\Url; 

class Snippets
{
	static function recentListRow($name, $img, $artist, $album, $url)
	{
		return "
		<div class='row'>
			<div class='col-xs-3'>
				<img class='img-responsive' src='{$img}' alt='{$album}'>
			</div>
			<div class='col-xs-9'>
				<a href='{$url}' target='_blank'>{$name}</a>
				<br>
				<small class='text-muted'>{$album}</small>
				<br>
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
}
?>