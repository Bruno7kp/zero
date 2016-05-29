<?php
namespace B7KP\Utils;

use B7KP\Model\Model;
use B7KP\Entity\Week; 
use B7KP\Library\Url; 

class Charts
{
	private $factory;
	private $css_file = "chart.css";
	
	function __construct(Model $factory)
	{
		$this->factory = $factory;
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

	public function getHomeWeeklyCharts(Week $week, $limit)
	{
		$cond = array("idweek" => $week->id);
		$album  = $this->factory->find("B7KP\Entity\Album_charts", $cond, "updated DESC, rank ASC", "0, 5");
		$artist = $this->factory->find("B7KP\Entity\Artist_charts", $cond, "updated DESC, rank ASC", "0, 5");
		$music  = $this->factory->find("B7KP\Entity\Music_charts", $cond, "updated DESC, rank ASC", "0, 5");
		$html = "<div class='col-md-6 col-xs-12'> \n";
		$html .= "<h3>TOP ARTISTS</h3>\n";
		$html .= $this->createTable($artist, "artist", true);
		$html .= "<div class='text-center topspace-sm'> \n";
		$html .= "<a href='' class='btn btn-info btn-sm'>View full chart</a>";
		$html .= "</div> \n";
		$html .= "</div> \n";
		$html .= "<div class='col-md-6 col-xs-12'> \n";
		$html .= "<h3>TOP MUSICS</h3>\n";
		$html .= $this->createTable($music, "music", true);
		$html .= "<div class='text-center topspace-sm'> \n";
		$html .= "<a href='' class='btn btn-info btn-sm'>View full chart</a>";
		$html .= "</div> \n";
		$html .= "</div> \n";
		$html .= "<div class='col-md-6 col-xs-12'> \n";
		$html .= "<h3>TOP ALBUMS</h3>\n";
		$html .= $this->createTable($album, "album", true);
		$html .= "<div class='text-center topspace-sm'> \n";
		$html .= "<a href='' class='btn btn-info btn-sm'>View full chart</a>";
		$html .= "</div> \n";
		$html .= "</div> \n";

		return $html;
	}

	public function getHomeWeeklyChartsAlt(Week $week)
	{
		$html = "";
		$cond = array("idweek" => $week->id);
		$album  = $this->factory->find("B7KP\Entity\Album_charts", $cond, "updated DESC, rank ASC", "0, 1");
		$artist = $this->factory->find("B7KP\Entity\Artist_charts", $cond, "updated DESC, rank ASC", "0, 1");
		$music  = $this->factory->find("B7KP\Entity\Music_charts", $cond, "updated DESC, rank ASC", "0, 1");
		$lfm = new \LastFmApi\Main\LastFm();
		foreach ($artist as $value) {
			$art = $lfm->getArtistInfo($value->artist, $value->art_mbid);
			$html .= "<img src='".$art['images']['extralarge']."'>";
		}
		return $html;
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
				break;
			
			default:
				return false;
				break;
		}
	}

	private function createTable($items, $type, $fluid = false)
	{
		ob_start();
		include MAIN_DIR."view/inc/simple-table.php";
		return ob_get_clean();
	}

	private function createFullTable()
	{

	}
}
