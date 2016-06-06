<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Entity\User;
use B7KP\Entity\Settings;
use B7KP\Entity\Week;
use LastFmApi\Main\LastFm;

class ChartController extends Controller
{
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=chart_list|route=/user/{login}/charts)
	*/
	public function chartsIndex($login)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		if($user instanceof User)
		{
			$numberones = array();
			$cond = array("iduser" => $user->id);
			$weeks = $this->factory->find("B7KP\Entity\Week", $cond, "week DESC", "0, 5");
			$i = 0;
			foreach ($weeks as $week) 
			{
				$numberones[$i]["week"] = $week->week;
				$from = new \DateTime($week->from_day);
				$numberones[$i]["from"] = $from->format("Y.m.d");
				$to = new \DateTime($week->to_day);
				$to->modify('-1 day');
				$numberones[$i]["to"] = $to->format("Y.m.d");
				$cond = array("idweek" => $week->id);
				$numberones[$i]["album"]  = $this->factory->find("B7KP\Entity\Album_charts", $cond, "updated DESC, rank ASC", "0, 1");
				$numberones[$i]["artist"] = $this->factory->find("B7KP\Entity\Artist_charts", $cond, "updated DESC, rank ASC", "0, 1");
				$numberones[$i]["music"]  = $this->factory->find("B7KP\Entity\Music_charts", $cond, "updated DESC, rank ASC", "0, 1");
				$i++;
			}
			$var = array
					(
						"weeks" => $numberones,
						"user" => $user
					);
			$this->render("mainchart.php", $var);
		}
		else
		{
			$this->redirectToRoute("registernotfound", array("entity" => "user"));
		}
	}

	/**
	* @Route(name=weekly_chart|route=/user/{login}/charts/{type}/week/{week})
	*/
	public function weeklyChart($login, $type, $week)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		$validtype = ($type == "artist" || $type == "album" || $type == "music");
		if($user instanceof User && $validtype && is_numeric($week))
		{
			$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
			$week = $this->factory->find("B7KP\Entity\Week", array("iduser" => $user->id, "week" => $week), "week DESC");
			if(is_array($week) && count($week) > 0)
			{
				$limit = 10;
				if($settings instanceof Settings)
				{
					$prop = substr($type, 0, 3) . "_limit";
					$limit = $settings->$prop;
				}
				$week = $week[0];
				$chart = new Charts($this->factory, $user);
				$list = $chart->getWeeklyCharts($week, $type, $limit, true, $settings);
				$vars = array('user' => $user, 'list' => $list, 'type' => $type, 'week' => $week);
				$this->render("chart.php", $vars);
			}
			else
			{
				$this->redirectToRoute("registernotfound", array("entity" => "Week"));
			}
		}
		else
		{
			$this->redirectToRoute("registernotfound", array("entity" => "User"));
		}
	}


	protected function checkAccess()
	{
		if(UserSession::getUser($this->factory) == false)
		{
			$this->redirectToRoute("login");
		}
	}
}
?>