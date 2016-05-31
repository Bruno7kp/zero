<?php
namespace B7KP\Utils;

use B7KP\Model\Model;
use B7KP\Entity\Week; 
use B7KP\Entity\User; 
use B7KP\Entity\Music_charts; 
use B7KP\Entity\Album_charts; 
use B7KP\Entity\Artist_charts; 
use B7KP\Library\Url; 
use B7KP\Utils\Snippets; 
use B7KP\Utils\Functions as Fn; 
use B7KP\Utils\Constants as C;

class Charts
{
	private $factory;
	private $user;
	private $css_file = "chart.css";
	static $referenceweek;
	
	function __construct(Model $factory, User $user)
	{
		$this->factory = $factory;
		$this->user = $user;
	}

	public function setCssFile($name)
	{
		$this->css_file = $name;
	}

	private function getCssContent()
	{
		$css = "<style>";
		$css .= file_get_contents(Url::asset("css/".$this->css_file));
		$css .= "</style>";
		return $css;
	}

	private function getMainContent()
	{
		$js = "<script src='".Url::asset("js/chart.js")."'></script>";
		$js .= "<link rel='stylesheet' href='".Url::asset("css/themify-icons.css")."'>";
		return $js;
	}

	private function getTable($list, $type, $settings, $week)
	{
		ob_start();
		include MAIN_DIR.'/view/inc/chart-table.php';
		$table = ob_get_clean();
		return $table;
	}

	/* If $html = true: returns table with the charts, else: array of the items */
	public function getWeeklyCharts(Week $week, $type, $limit, $html = false, $settings = false)
	{
		$cond = array("idweek" => $week->id);
		$limit = ($limit == C::LIMIT_MAX) ? false : "0, ".$limit;
		$newlist = array();
		switch ($type) {
			case 'album':
				$list  = $this->factory->find("B7KP\Entity\Album_charts", $cond, "updated DESC, rank ASC", $limit);
				$i = 0;
				foreach ($list as $key => $value) {
					$chartstats = $this->getAlbumStats($value->album, $value->artist, $value->alb_mbid);
					$ext = $this->extract($chartstats, false, $week->week);
					$newlist[$i]['stats'] = $ext;
					$newlist[$i]['item'] = $value;
					$i++;
				}
				break;

			case 'artist':
				$list = $this->factory->find("B7KP\Entity\Artist_charts", $cond, "updated DESC, rank ASC", $limit);
				$i = 0;
				foreach ($list as $key => $value) {
					$chartstats = $this->getArtistStats($value->artist, $value->art_mbid);
					$ext = $this->extract($chartstats, false, $week->week);
					$newlist[$i]['stats'] = $ext;
					$newlist[$i]['item'] = $value;
					$i++;
				}
				break;
			
			default:
				$list  = $this->factory->find("B7KP\Entity\Music_charts", $cond, "updated DESC, rank ASC", $limit);
				$i = 0;
				foreach ($list as $key => $value) {
					$chartstats = $this->getMusicStats($value->music, $value->artist, $value->mus_mbid);
					$ext = $this->extract($chartstats, false, $week->week);
					$newlist[$i]['stats'] = $ext;
					$newlist[$i]['item'] = $value;
					$i++;
				}
				break;
		}


		if($html && $settings)
		{
			$list = $this->getTable($newlist, $type, $settings, $week->week);
		}
		else
		{
			$list = $newlist;
		}

		return $list;
	}

	private function aux($method, $value)
	{
		switch ($method) {
			case 'getRankColor':
				$color = "";
				if($value == 1)
				{
					$color .= "ch-pos-one";
				}
				return $color;
				break;

			case 'getMoveColor':
				$color = "non-mover";
				if($value == "NEW")
				{
					$color = "text-info";
				}
				elseif ($value == "RE") {
					$color = "text-waring";
				}
				elseif($value > 0)
				{
					$color = "text-success";
				}
				elseif($value < 0)
				{
					$color = "text-danger";
				}
				return $color;
				break;

			case 'getMoveIcon':
				$icon = "ti-arrows-horizontal";
				if($value === "NEW")
				{
					$icon = "ti-target";
				}
				elseif ($value === "RE") {
					$icon = "ti-back-right";
				}
				elseif($value > 0)
				{
					$icon = "ti-arrow-up";
				}
				elseif($value < 0)
				{
					$icon = "ti-arrow-down";
				}
				return $icon;
				break;
			
			default:
				return false;
				break;
		}
	}

	public function extract($array, $chartrun = true, $referenceweek = false)
	{
		if(!is_array($array) || count($array) == 0)
		{
			return false;
		}
		$stats = array();

		if($array[0] instanceof Music_charts || $array[0] instanceof Album_charts || $array[0] instanceof Artist_charts)
		{
			foreach ($array as $value) {
				$week = $this->factory->findOneBy("B7KP\Entity\Week", $value->idweek);
				$thisweek = array();
				$thisweek['week']['id'] = $value->idweek;
				$thisweek['week']['week'] = $week->week;
				$thisweek['week']['from'] = $week->from_day;
				$to = new \DateTime($week->to_day);
				$to->modify('-1 day');
				$thisweek['week']['to'] = $to->format('Y-m-d');
				$thisweek['week']['to_orginal'] = $week->to_day;
				$thisweek['week']['id'] = $value->idweek;
				$thisweek['rank']['rank'] = $value->rank;
				$thisweek['playcount']['playcount'] = $value->playcount;
				$stats[$week->week] = $thisweek;
			}

			foreach ($stats as $key => $value) {
				if(isset($stats[$key-1]))
				{
					$stats[$key]['rank']['lw'] = $stats[$key-1]['rank']['rank'];
					$stats[$key]['rank']['move'] = $stats[$key]['rank']['lw'] - $stats[$key]['rank']['rank'];
					$stats[$key]['playcount']['lw'] = $stats[$key-1]['playcount']['playcount'];
					$stats[$key]['playcount']['move'] = $stats[$key]['playcount']['playcount'] - $stats[$key]['playcount']['lw'];
				}
				else
				{
					if(count($stats) > 1)
					{
						$stats[$key]['rank']['lw'] = "RE";
						$stats[$key]['rank']['move'] = "RE";
						$stats[$key]['playcount']['lw'] = "RE";
						$stats[$key]['playcount']['move'] = "RE";
					}
					else
					{
						$stats[$key]['rank']['lw'] = "NEW";
						$stats[$key]['rank']['move'] = "NEW";
						$stats[$key]['playcount']['lw'] = "NEW";
						$stats[$key]['playcount']['move'] = "NEW";
					}
				}
			}

			if($chartrun == false)
			{
				$data = array();
				$data["alltime"] = $this->extractFromCR($stats);
				
				if($referenceweek && is_numeric($referenceweek))
				{
					self::$referenceweek = $referenceweek;
					$stats = array_filter($stats, function($k) {
												    return $k <= \B7KP\Utils\Charts::$referenceweek;
													}, ARRAY_FILTER_USE_KEY);
					$data['todate'] = $this->extractFromCR($stats);
				}
				else
				{
					$data["todate"] = $data["alltime"]; 
				}

				$stats = array("chartrun" => $stats, "stats" => $data);
			}
		}

		return $stats;
	}

	private function extractFromCR($stats)
	{
		$extract = array();
		$extract["weeks"]["total"] = count($stats);
		$extract["overall"] = array();
		$extract["overall"]["chartplays"] = 0;
		$extract["overall"]["chartpoints"] = 0;
		$extract["rank"] = array();
		$extract["playcount"] = array();

		foreach ($stats as $key => $value) {
			$p = $value["rank"]["rank"];
			$pc = $value["playcount"]["playcount"];
			$extract["overall"]["chartpoints"] += $p;
			$extract["overall"]["chartplays"] += $pc;
			if(!isset($extract["overall"]["peak"]) || $extract["overall"]["peak"] > $p)
			{
				$extract["overall"]["peak"] = $p;
				$extract["overall"]["peakdate"] = $key;
			}

			if(!isset($extract["overall"]["peakplay"]) || $extract["overall"]["peakplay"] < $pc)
			{
				$extract["overall"]["peakplay"] = $pc;
				$extract["overall"]["peakplaydate"] = $key;
			}

			if(!isset($extract["rank"][$p]))
			{
				$extract["rank"][$p] = 1;
			}
			else
			{
				$extract["rank"][$p]++;
			}

			if(!isset($extract["playcount"][$pc]))
			{
				$extract["playcount"][$pc] = 1;
			}
			else
			{
				$extract["playcount"][$pc]++;
			}
		}

		$extract["weeks"]["top01"] = self::wksInTop(1, $extract["rank"]);
		$extract["weeks"]["top05"] = self::wksInTop(5, $extract["rank"]);
		$extract["weeks"]["top10"] = self::wksInTop(10, $extract["rank"]);
		$extract["weeks"]["top20"] = self::wksInTop(20, $extract["rank"]);

		return $extract;
	}

	// $extract['rank']
	static function wksInTop($value, $array)
	{
		$val = 0;
		foreach ($array as $key => $item) {
			if($key <= $value)
			{
				$val += $item;
			}
		}
		return $val;
	}

	// $extract['playcount']
	static function wksWithMorePlays($value, $array)
	{
		$val = 0;
		foreach ($array as $key => $item) {
			if($key >= $value)
			{
				$val += $item;
			}
		}
		return $val;
	}

	public function getMusicStats($name, $artist, $mbid)
	{
		$cond = "music_charts.mus_mbid = '".$mbid."'";
		if(empty($mbid))
		{
			$cond = "music_charts.music = '$name' AND music_charts.artist = '$artist'";
		}
		$sql = "SELECT music_charts.* FROM music_charts, week WHERE ".$cond." AND week.iduser = '".$this->user->id."' GROUP BY music_charts.id ORDER BY week.week DESC, music_charts.updated";
		$weeks = $this->factory->findSql("B7KP\Entity\Music_charts", $sql);

		return $weeks;
	}

	public function getAlbumStats($name, $artist, $mbid)
	{
		$cond = "album_charts.alb_mbid = '".$mbid."'";
		if(empty($mbid))
		{
			$cond = "album_charts.album = '$name' AND album_charts.artist = '$artist'";
		}
		$sql = "SELECT album_charts.* FROM album_charts, week WHERE ".$cond." AND week.iduser = '".$this->user->id."' GROUP BY album_charts.id ORDER BY week.week DESC, album_charts.updated";
		$weeks = $this->factory->findSql("B7KP\Entity\Album_charts", $sql);

		return $weeks;
	}

	public function getArtistStats($name, $mbid)
	{
		$cond = "artist_charts.art_mbid = '".$mbid."'";
		if(empty($mbid))
		{
			$cond = "artist_charts.artist = '$name'";
		}
		$sql = "SELECT artist_charts.* FROM artist_charts, week WHERE ".$cond." AND week.iduser = '".$this->user->id."' GROUP BY artist_charts.id ORDER BY week.week DESC, artist_charts.updated";
		$weeks = $this->factory->findSql("B7KP\Entity\Artist_charts", $sql);

		return $weeks;
	}

	public function getHomeWeeklyChartsAlt(Week $week)
	{
		$html = "";
		$from = new \DateTime($week->from_day);
		$from = $from->format("Y.m.d");
		$to = new \DateTime($week->to_day);
		$to->modify('-1 day');
		$to = $to->format("Y.m.d");
		$cond = array("idweek" => $week->id);
		$album  = $this->factory->find("B7KP\Entity\Album_charts", $cond, "updated DESC, rank ASC", "0, 1");
		$artist = $this->factory->find("B7KP\Entity\Artist_charts", $cond, "updated DESC, rank ASC", "0, 1");
		$music  = $this->factory->find("B7KP\Entity\Music_charts", $cond, "updated DESC, rank ASC", "0, 1");
		$lfm = new \LastFmApi\Main\LastFm();
		$lfm->setUser($this->user->login);
		$html .= "<div class='text-center bottomspace-sm'>";
		$html .= "<h2>WEEK ".$week->week."</h2>";
		$html .= "<small><b>".$from." - ".$to."</b></small>";
		$html .= "</div>";
		foreach ($artist as $value) {
			$chartstats = $this->getArtistStats($value->artist, $value->art_mbid);
			$ext = $this->extract($chartstats);
			//var_dump($ext);
			$move = $ext[$week->week]['rank']['move'];
			$icon = $this->aux('getMoveIcon', $move);
			$html .= Snippets::specArtRow($value, $this->user, Fn::formatNum($move), $icon);
		}
		foreach ($album as $value) {
			$chartstats = $this->getAlbumStats($value->album, $value->artist, $value->alb_mbid);
			$ext = $this->extract($chartstats);
			$move = $ext[$week->week]['rank']['move'];
			$icon = $this->aux('getMoveIcon', $move);
			$html .= Snippets::specAlbRow($value, $this->user, Fn::formatNum($move), $icon);
		}
		foreach ($music as $value) {
			$chartstats = $this->getMusicStats($value->music, $value->artist, $value->mus_mbid);
			$ext = $this->extract($chartstats);
			//var_dump($ext);
			$move = $ext[$week->week]['rank']['move'];
			$icon = $this->aux('getMoveIcon', $move);
			$html .= Snippets::specMusRow($value, $this->user, Fn::formatNum($move), $icon);
		}
		$html .= "<div class='row topspace-md text-center'><div class='col-xs-12'><a class='btn btn-outline'>View full chart</a></div></div>";
		return $html;
	}
	
}
