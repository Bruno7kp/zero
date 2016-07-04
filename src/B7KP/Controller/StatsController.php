<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Core\App;
use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Route;
use B7KP\Utils\Pass;

class StatsController extends Controller
{

	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=zero_stats|route=/zero)
	*/
	public function executeQuery()
	{
		$dao = Dao::getConn();

		// PLAQUE
		$plaques 	= $dao->run("SELECT COUNT(*) AS t, date FROM plaque GROUP BY date ORDER BY date DESC");
		$userplaque = $dao->run("SELECT COUNT(*) AS t, login FROM plaque, user WHERE plaque.iduser = user.id GROUP BY iduser ORDER BY t DESC LIMIT 0,1");
		$lastplaque = $dao->run("SELECT plaque.*, user.login FROM plaque, user WHERE user.id = plaque.iduser ORDER BY id DESC LIMIT 0, 3");

		$last = $plaques[0];
		usort($plaques, function($a, $b){ return $a->t < $b->t; });
		$biggest = $plaques[0];
		$total = 0;
		foreach ($plaques as $key => $value) { $total += $value->t; }

		// USER
		$users = $dao->run("SELECT COUNT(*) as t FROM user"); 
		$user = $dao->run("SELECT * FROM user ORDER BY id DESC LIMIT 0,1"); 

		// CHART
		$weeks = $dao->run("SELECT COUNT(w.id) AS t, u.login FROM week w, user u WHERE u.id = w.iduser GROUP BY u.id ORDER BY t");
		$biggestuser = $weeks[0];
		$totalweeks = 0;
		foreach ($weeks as $key => $value) {
			$totalweeks += $value->t;
		}
		$artist = $dao->run("SELECT COUNT(id) AS t, artist FROM artist_charts GROUP BY artist ORDER BY t");
		$album = $dao->run("SELECT COUNT(id) AS t, album, artist FROM album_charts GROUP BY artist, album ORDER BY t");
		$music = $dao->run("SELECT COUNT(id) AS t, music, artist FROM music_charts GROUP BY artist, music ORDER BY t");
		$vars = array
				(
					"plaque_last_day" 	 => $last->t,
					"plaque_biggest_day" => $biggest,
					"plaque_total"		 => $total,
					"plaque_last" 		 => $lastplaque,
					"user_total"		 => $users[0]->t,
					"user_last"			 => $user[0],
					"user_plaque"		 => $userplaque[0],
					"user_weeks"		 => $biggestuser,
					"weeks_total" 		 => $totalweeks,
					"weeks_total"
				);
		$this->render("zero.php", $vars);
	}

	protected function checkAccess()
	{
		return true;
	}
}
?>