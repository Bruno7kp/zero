<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Core\App;
use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Route;
use B7KP\Library\Options;
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
		$weeks = $dao->run("SELECT COUNT(w.id) AS t FROM week w");
		$totalweeks = 0;
		foreach ($weeks as $key => $value) {
			$totalweeks += $value->t;
		}
		// art/alb/mus
		$artist = $dao->run("SELECT COUNT(t.id) AS t, COUNT(DISTINCT w.iduser) AS u, t.artist FROM week w, artist_charts t WHERE w.id = t.idweek GROUP BY t.artist ORDER BY u DESC, t DESC LIMIT 0, 5");
		$album = $dao->run("SELECT COUNT(t.id) AS t, COUNT(DISTINCT w.iduser) AS u, t.album, t.artist FROM week w, album_charts t WHERE w.id = t.idweek GROUP BY t.artist, t.album ORDER BY u DESC, t DESC LIMIT 0, 5");
		$music = $dao->run("SELECT COUNT(t.id) AS t, COUNT(DISTINCT w.iduser) AS u, t.music, t.artist FROM week w, music_charts t WHERE w.id = t.idweek GROUP BY t.artist, t.music ORDER BY u DESC, t DESC LIMIT 0, 5");
		$artist_one = $dao->run("SELECT COUNT(t.id) AS t, COUNT(DISTINCT w.iduser) AS u, t.artist FROM week w, artist_charts t WHERE t.rank = 1 AND w.id = t.idweek GROUP BY t.artist ORDER BY u DESC, t DESC LIMIT 0, 5");
		$album_one = $dao->run("SELECT COUNT(t.id) AS t, COUNT(DISTINCT w.iduser) AS u, t.album, t.artist FROM week w, album_charts t WHERE t.rank = 1 AND w.id = t.idweek GROUP BY t.artist, t.album ORDER BY u DESC, t DESC LIMIT 0, 5");
		$music_one = $dao->run("SELECT COUNT(t.id) AS t, COUNT(DISTINCT w.iduser) AS u, t.music, t.artist FROM week w, music_charts t WHERE t.rank = 1 AND w.id = t.idweek GROUP BY t.artist, t.music ORDER BY u DESC, t DESC LIMIT 0, 5");

		// SETTINGS
		$options = new Options();
		$limits["art"] = $dao->run("SELECT count(id) AS t, art_limit FROM settings GROUP BY art_limit");
		$limits["alb"] = $dao->run("SELECT count(id) AS t, alb_limit FROM settings GROUP BY alb_limit");
		$limits["mus"] = $dao->run("SELECT count(id) AS t, mus_limit FROM settings GROUP BY mus_limit");
		$cert = $dao->run("SELECT cert_type, count(id) AS t, avg(alb_cert_gold) as ag, avg(alb_cert_platinum) as ap, avg(alb_cert_diamond) as ad, avg(mus_cert_gold) as mg, avg(mus_cert_platinum) as mp, avg(mus_cert_diamond) as md FROM settings WHERE show_cert = 1 GROUP BY cert_type");
		$cert_c["ag"] = $dao->run("SELECT count(id) AS t, cert_type, alb_cert_gold AS v  FROM settings WHERE show_cert = 1 GROUP BY cert_type, alb_cert_gold ORDER BY t DESC");
		$cert_c["ap"] = $dao->run("SELECT count(id) AS t, cert_type, alb_cert_platinum AS v  FROM settings WHERE show_cert = 1 GROUP BY cert_type, alb_cert_platinum ORDER BY t DESC");
		$cert_c["ad"] = $dao->run("SELECT count(id) AS t, cert_type, alb_cert_diamond AS v  FROM settings WHERE show_cert = 1 GROUP BY cert_type, alb_cert_diamond ORDER BY t DESC");
		$cert_c["mg"] = $dao->run("SELECT count(id) AS t, cert_type, mus_cert_gold AS v  FROM settings WHERE show_cert = 1 GROUP BY cert_type, mus_cert_gold ORDER BY t DESC");
		$cert_c["mp"] = $dao->run("SELECT count(id) AS t, cert_type, mus_cert_platinum AS v  FROM settings WHERE show_cert = 1 GROUP BY cert_type, mus_cert_platinum ORDER BY t DESC");
		$cert_c["md"] = $dao->run("SELECT count(id) AS t, cert_type, mus_cert_diamond AS v  FROM settings WHERE show_cert = 1 GROUP BY cert_type, mus_cert_diamond ORDER BY t DESC");

		//$limit = $options->get("B7KP\Entity\Settings", "");
		$vars = array
				(
					"plaque_last_day" 	 => $last->t,
					"plaque_biggest_day" => $biggest,
					"plaque_total"		 => $total,
					"plaque_last" 		 => $lastplaque,
					"user_total"		 => $users[0]->t,
					"user_last"			 => $user[0],
					"user_plaque"		 => $userplaque[0],
					"weeks_total" 		 => $totalweeks,
					"top_artist"		 => $artist,
					"top_album"			 => $album,
					"top_music"			 => $music,
					"top_artist_one"	 => $artist_one,
					"top_album_one"		 => $album_one,
					"top_music_one"		 => $music_one,
					"limits"			 => $limits,
					"cert_type"			 => $cert,
					"cert_c"			 => $cert_c
				);
		$this->render("zero.php", $vars);
	}

	protected function checkAccess()
	{
		return true;
	}
}
?>