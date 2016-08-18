<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Utils\UserSession;
use B7KP\Utils\Certified;
use B7KP\Utils\Charts;
use B7KP\Utils\Snippets;
use B7KP\Entity\User;
use B7KP\Library\Lang;
use LastFmApi\Main\LastFm;

class LibraryController extends Controller
{
	protected $user;
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=live_charts|route=/livechart/{type})
	*/
	public function liveChart($type)
	{
		$this->validTypeFor("all", $type);
		$user 	= UserSession::getUser($this->factory);
		$login  = isset($user->login) ? $user->login : "";
		$user 	= $this->isValidUser($login);
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		if($settings->hide_livechart){
			$this->redirectToRoute("chart_list", array("login" => $login));
		}
		$startday = $settings->start_day ? "friday" : "sunday";
		$weeks 	= $this->factory->find("B7KP\Entity\Week", array("iduser" => $user->id), "week DESC");

		$lfm 	= new LastFm();
		$lfm->setUser($user->login)->setStartDate($startday);
		if($user->lfm_register){
			$lastdate = $user->lfm_register;
			$date = new \DateTime($lastdate);
			$date = $date->format("Y.m.d");
		}else{
			$last 	= $lfm->getUserInfo();
			$date 	= \DateTime::createFromFormat("U",$last['registered'])->format("Y.m.d");
		}
		$wksfm 	= $lfm->getWeeklyChartList();
		$wksfm 	= count($lfm->removeWeeksBeforeDate($wksfm, $date, $user->id));
		$outofdateweeks = $wksfm - count($weeks);
		$list = false;
		if($outofdateweeks > 0)
		{
			$this->render("error/live.php", array("error" => 0, "lfm_bg" => $this->getUserBg($user), "lfm_image" => $this->getUserBg($user, true)));
		}
		else
		{
			$fn = "getWeekly".ucfirst($type)."List";
			$gmt = new \DateTimeZone("GMT");
			$now = new \DateTime("now", $gmt);
			$now = $now->format("U");
			$date = new \DateTime($weeks[0]->to_day, $gmt);
			$from_day = $date->format("U");
			$date->modify("+7 day");
			$to_day = $date->format("U");
			if($now > $to_day)
			{
				//$this->render("error/live.php", array("error" => 1, "lfm_bg" => $this->getUserBg($user), "lfm_image" => $this->getUserBg($user, true)));
				$date->modify("+7 day");
				$to_to = $date->format("U");
				$vars = array("from" => $to_day, "to" => $to_to);
			}
			else
			{
				$vars = array("from" => $from_day, "to" => $to_day);
			}
			$list = $lfm->$fn($vars);
			$this->render("live_.php", array("week" => ($weeks[0]->week + 1), "user" => $user,"list" => $list, "type" => $type, "lfm_bg" => $this->getUserBg($user), "lfm_image" => $this->getUserBg($user, true)));
		}
	}

	private function validTypeFor($for, $type)
	{
		switch ($for) {
			case 'artist':
				if($type != "album" && $type != "music")
				{
					$this->redirectToRoute("404");
				}
				break;
			
			default:
				if($type != "artist" && $type != "album" && $type != "music")
				{
					$this->redirectToRoute("404");
				}
				break;
		}
	}

	/**
	* @Route(name=gen_cert|route=/new/plaque)
	*/
	public function newPlaque()
	{
		$user = UserSession::getUser($this->factory);
		if($this->isAjaxRequest())
		{
			$post = (object) $_POST;
			$c = new Certified($user, $this->factory);
			if($this->checkDate($post->type, $post->name, $post->artist, $c))
			{
				if($this->checkCert($post->type, $post->points, $c))
				{
					$url = $c->createPlaque($post->type, $post->points, $post->image, $post->name, $post->artist);
					echo json_encode(array("url" => $url));
				}
				else
				{
					echo json_encode(array("error" => 2));
				}
			}
			else
			{
				echo json_encode(array("error" => 1));
			}	
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	private function checkDate($type, $name, $artist, Certified $c)
	{
		$p = $c->getPlaque($type, $name, $artist);
		$date = new \DateTime();
		if(count($p) > 0 && $p[0]->date == $date->format("Y-m-d"))
		{
			return false;
		}
		return true;
	}

	private function checkCert($type, $points, Certified $c)
	{
		$p = $c->getCertification($type, $points);
		$v = $p["g"] + $p["p"] + $p["d"];
		if($v > 0)
		{
			return true;
		}
		return false;
	}

	/**
	* @Route(name=remove_cert|route=/delete/plaque/{id})
	*/
	public function removePlaque($id)
	{
		$user = UserSession::getUser($this->factory);
		if($this->isAjaxRequest())
		{
			$cert = $this->factory->findOneBy("B7KP\Entity\Plaque", $id);
			if(is_object($cert) && isset($cert->iduser) && $cert->iduser == $user->id)
			{
				$this->factory->remove("\B7KP\Entity\Plaque", $id);
				echo json_encode(array("error" => 0));
			}
			else
			{
				echo json_encode(array("error" => 1));
			}
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=lib_art_music|route=/user/{login}/library/{artist}/music)
	*/
	public function artMusLibList($login, $artist)
	{
		$user = $this->isValidUser($login);
		$chart = new Charts($this->factory, $user);
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		$fixed = urldecode($artist);
		$fixed = str_replace("+", " ", $fixed);
		$fixed = str_replace("%2b", "+", $fixed);
		$fixed = str_replace("%2f", "/", $fixed);
		$fixed = str_replace("%5c", "\\", $fixed);
		$music = $chart->getMusicByArtist($fixed, $settings->mus_limit);
		$lfm 	= new LastFm();
		$lfm 	= $lfm->setUser($user->login);
		$data = $lfm->getArtistInfo($fixed);
		if($data)
		{
			$act["artist"] = $data["name"];
			$act["userplaycount"] = $data["userplaycount"];
			$act["img"] = $data["images"]["large"];
			$stats = $chart->getArtistStats($data["name"], "");
			$act["stats"] = $chart->extract($stats, false);
			foreach ($music as $key => $value) {
				$albstats = $chart->getMusicStats($value->music, $value->artist, "");
				$music[$key]->stats = $chart->extract($albstats, false);
			}
		}
		else
		{
			$this->redirectToRoute("lib_art", array("login" => $user->login));
		}

		$vars = array 
					(
						"user" 		=> $user,
						"music" 	=> $music,
						"artist" 	=> $act,
						"settings"	=> $settings,
						"mlimit"	=> $settings->mus_limit,
						"lfm_bg" 	=> $this->getUserBg($user),
						"lfm_image" => $this->getUserBg($user, true)
					);

		$this->render("user_art_mus.php", $vars);
	}

	/**
	* @Route(name=lib_art_album|route=/user/{login}/library/{artist}/album)
	*/
	public function artAlbLibList($login, $artist)
	{
		$this->redirectToRoute("lib_art", array("login" => $login, "name" => $artist));
		$user = $this->isValidUser($login);
		$chart = new Charts($this->factory, $user);
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		$fixed = urldecode($artist);
		$fixed = str_replace("+", " ", $fixed);
		$fixed = str_replace("%2b", "+", $fixed);
		$fixed = str_replace("%2f", "/", $fixed);
		$fixed = str_replace("%5c", "\\", $fixed);
		$album = $chart->getAlbumByArtist($fixed, $settings->alb_limit);
		$lfm 	= new LastFm();
		$lfm 	= $lfm->setUser($user->login);
		$data = $lfm->getArtistInfo($fixed);
		if($data)
		{
			$act["artist"] = $data["name"];
			$act["userplaycount"] = $data["userplaycount"];
			$act["img"] = $data["images"]["large"];
			$stats = $chart->getArtistStats($data["name"], "");
			$act["stats"] = $chart->extract($stats, false);
		}
		else
		{
			$this->redirectToRoute("lib_art", array("login" => $user->login));
		}

		$vars = array 
					(
						"user" 		=> $user,
						"album" 	=> $album,
						"artist" 	=> $act,
						"lfm_bg" 	=> $this->getUserBg($user),
						"lfm_image" => $this->getUserBg($user, true)
					);

		$this->render("user_art_alb.php", $vars);
	}

	/**
	* @Route(name=lib_art_list|route=/user/{login}/charts/artists)
	*/
	public function artistList($login)
	{
		$user = $this->isValidUser($login);
		$chart = new Charts($this->factory, $user);
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		$lastfm = new Lastfm();
		$lastfm->setUser($user->login);
		$page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;
		$v = array
				(
					"period" => "overall",
					"limit" => 50,
					"page" => $page
				);
		$top = $lastfm->getUserTopArtist($v);
		$info = $top["info"];
		unset($top["info"]);
		$list = array();

		if(is_array($top) && count($top) > 0)
		{
			foreach ($top as $key => $value) {
				$list[$key]["artist"] = $value["name"];
				$list[$key]["rank"] = $value["rank"];
				$list[$key]["playcount"] = $value["playcount"];
				$list[$key]["img"] = $value["images"]["large"];
				$stats = $chart->getArtistStats($value["name"], "");
				$list[$key]["stats"] = $chart->extract($stats, false);
			}
		}

		$dao = Dao::getConn();

		$vars = array
					(
						"user" => $user,
						"list" => $list,
						"info" => $info,
						"page" => $page,
						"limit"		=> $settings->art_limit,
						"settings"	=> $settings,
						"lfm_bg" 	=> $this->getUserBg($user),
						"lfm_image" => $this->getUserBg($user, true),
						"biggest_playcount" => $this->getBiggestPlaycount($user)
					);

		$this->render("lib_art.php", $vars);
	}

	/**
	* @Route(name=lib_mus_list|route=/user/{login}/charts/musics)
	*/
	public function musicList($login)
	{
		$user = $this->isValidUser($login);
		$chart = new Charts($this->factory, $user);
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		$lastfm = new Lastfm();
		$lastfm->setUser($user->login);
		$page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;
		$v = array
				(
					"period" => "overall",
					"limit" => 50,
					"page" => $page
				);
		$top = $lastfm->getUserTopMusic($v);
		$info = $top["info"];
		unset($top["info"]);
		$list = array();

		if(is_array($top) && count($top) > 0)
		{
			foreach ($top as $key => $value) {
				$list[$key]["artist"] = $value["artist"]["name"];
				$list[$key]["music"] = $value["name"];
				$list[$key]["rank"] = $value["rank"];
				$list[$key]["playcount"] = $value["playcount"];
				$list[$key]["img"] = $value["images"]["large"];
				$stats = $chart->getMusicStats($value["name"],$value["artist"]["name"], "");
				$list[$key]["stats"] = $chart->extract($stats, false);
			}
		}

		$dao = Dao::getConn();

		$vars = array
					(
						"user" => $user,
						"list" => $list,
						"info" => $info,
						"page" => $page,
						"settings"	=> $settings,
						"limit"		=> $settings->art_limit,
						"lfm_bg" 	=> $this->getUserBg($user),
						"lfm_image" => $this->getUserBg($user, true),
						"biggest_playcount" => $this->getBiggestPlaycount($user)
					);

		$this->render("lib_mus.php", $vars);

	}

	/**
	* @Route(name=lib_alb_list|route=/user/{login}/charts/albums)
	*/
	public function albumList($login)
	{
		$user = $this->isValidUser($login);
		$chart = new Charts($this->factory, $user);
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		$lastfm = new Lastfm();
		$lastfm->setUser($user->login);
		$page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;
		$v = array
				(
					"period" => "overall",
					"limit" => 50,
					"page" => $page
				);
		$top = $lastfm->getUserTopAlbum($v);
		$info = $top["info"];
		unset($top["info"]);
		$list = array();

		if(is_array($top) && count($top) > 0)
		{
			foreach ($top as $key => $value) {
				$list[$key]["artist"] = $value["artist"]["name"];
				$list[$key]["music"] = $value["name"];
				$list[$key]["rank"] = $value["rank"];
				$list[$key]["playcount"] = $value["playcount"];
				$list[$key]["img"] = $value["images"]["large"];
				$stats = $chart->getAlbumStats($value["name"],$value["artist"]["name"], "");
				$list[$key]["stats"] = $chart->extract($stats, false);
			}
		}

		$dao = Dao::getConn();

		$vars = array
					(
						"user" => $user,
						"list" => $list,
						"info" => $info,
						"page" => $page,
						"settings"	=> $settings,
						"limit"		=> $settings->art_limit,
						"lfm_bg" 	=> $this->getUserBg($user),
						"lfm_image" => $this->getUserBg($user, true),
						"biggest_playcount" => $this->getBiggestPlaycount($user)
					);

		$this->render("lib_alb.php", $vars);

	}

	/**
	* @Route(name=lib_art|route=/user/{login}/music/{name})
	*/
	public function artistLib($login, $name)
	{
		$user = $this->isValidUser($login);
		$chart = new Charts($this->factory, $user);
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		$lastfm = new Lastfm();
		$lastfm->setUser($user->login);
		$fixed = mb_strtoupper($name);
		$fixed = urldecode($name);
		$fixed = str_replace("+", " ", $fixed);
		$fixed = str_replace("%2b", "+", $fixed);
		$fixed = str_replace("%2f", "/", $fixed);
		$fixed = str_replace("%5c", "\\", $fixed);
		$data = $lastfm->getArtistInfo($fixed);

		if($data)
		{
			$artist["artist"] = $data["name"];
			$artist["userplaycount"] = $data["userplaycount"];
			$artist["img"] = $data["images"]["large"];
			$stats = $chart->getArtistStats($data["name"], "");
			$album = $chart->getAlbumByArtist($data["name"], $settings->alb_limit);
			$music = $chart->getMusicByArtist($data["name"], $settings->mus_limit);
			$artist["stats"] = $chart->extract($stats, false);
			foreach ($album as $key => $value) {
				$albstats = $chart->getAlbumStats($value->album, $value->artist, "");
				$album[$key]->stats = $chart->extract($albstats, false);
			}

			foreach ($music as $key => $value) {
				$albstats = $chart->getMusicStats($value->music, $value->artist, "");
				$music[$key]->stats = $chart->extract($albstats, false);
			}

			$vars = array
						(
							"user" => $user,
							"artist" => $artist,
							"album" => $album,
							"music" => $music,
							"limit" => $settings->art_limit,
							"alimit" => $settings->alb_limit,
							"mlimit" => $settings->mus_limit,
							"settings" => $settings,
							"lfm_bg" 	=> $this->getUserBg($user),
							"lfm_image" => $this->getUserBg($user, true)
						);

			$this->render("user_art.php", $vars);
		}
		else
		{
			$this->redirectToRoute("lib_art_list", array("login" => $login));
		}
	}

	/**
	* @Route(name=lib_mus|route=/user/{login}/music/{artist}/_/{name})
	*/
	public function musLib($login, $artist, $name)
	{
		$user = $this->isValidUser($login);
		$chart = new Charts($this->factory, $user);
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		$lastfm = new Lastfm();
		$lastfm->setUser($user->login);
		//$fixed = mb_strtoupper($name);
		$fixed = urldecode($name);
		$fixed = str_replace("+", " ", $fixed);
		$fixed = str_replace("%2b", "+", $fixed);
		$fixed = str_replace("%2f", "/", $fixed);
		$fixed = str_replace("%5c", "\\", $fixed);
		$fixedart = urldecode($artist);
		$fixedart = str_replace("+", " ", $fixedart);
		$fixedart = str_replace("%2b", "+", $fixedart);
		$fixedart = str_replace("%2f", "/", $fixedart);
		$fixedart = str_replace("%5c", "\\", $fixedart);
		$data = $lastfm->getMusicInfo($fixed, $fixedart);


		if($data)
		{
			$art = $lastfm->getArtistInfo($fixedart);
			$music["music"] = $data["name"];
			$music["artist"] = $data["artist"]["name"];
			$music["userplaycount"] = $data["userplaycount"];
			$music["img"] = $art["images"]["large"];
			$stats = $chart->getMusicStats($music["music"], $music["artist"], "");
			//var_dump($stats);
			$music["stats"] = $chart->extract($stats, false);
			$dao = Dao::getConn();

			$vars = array
						(
							"user" => $user,
							"music" => $music,
							"settings" => $settings,
							"limit" => $settings->mus_limit,
							"lfm_bg" 	=> $this->getUserBg($user),
							"lfm_image" => $this->getUserBg($user, true)
						);

			$this->render("user_mus.php", $vars);
		}
		else
		{
			$this->redirectToRoute("lib_mus_list", array("login" => $login));
		}
	}

	/**
	* @Route(name=lib_alb|route=/user/{login}/music/{artist}/{name})
	*/
	public function albLib($login, $artist, $name)
	{
		$user = $this->isValidUser($login);
		$chart = new Charts($this->factory, $user);
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		$lastfm = new Lastfm();
		$lastfm->setUser($user->login);
		//$fixed = mb_strtoupper($name);
		$fixed = urldecode($name);
		$fixed = str_replace("+", " ", $fixed);
		$fixed = str_replace("%2b", "+", $fixed);
		$fixed = str_replace("%2f", "/", $fixed);
		$fixed = str_replace("%5c", "\\", $fixed);
		$fixedart = urldecode($artist);
		$fixedart = str_replace("+", " ", $fixedart);
		$fixedart = str_replace("%2b", "+", $fixedart);
		$fixedart = str_replace("%2f", "/", $fixedart);
		$fixedart = str_replace("%5c", "\\", $fixedart);
		$data = $lastfm->getAlbumInfo($fixed, $fixedart);


		if($data)
		{
			$album["artist"] = $data["artist"];
			$album["album"] = $data["name"];
			$album["userplaycount"] = $data["userplaycount"];
			$album["img"] = $data["images"]["large"];
			$stats = $chart->getAlbumStats($album["album"], $album["artist"], "");
			//var_dump($stats);
			$album["stats"] = $chart->extract($stats, false);
			$dao = Dao::getConn();

			$vars = array
						(
							"user" => $user,
							"settings" => $settings,
							"album" => $album,
							"limit" => $settings->alb_limit,
							"lfm_bg" 	=> $this->getUserBg($user),
							"lfm_image" => $this->getUserBg($user, true)
						);

			$this->render("user_alb.php", $vars);
		}
		else
		{
			$this->redirectToRoute("lib_alb_list", array("login" => $login));
		}
	}


	/**
	* @Route(name=friends_list|route=/user/{login}/friends)
	*/
	public function friendsList($login)
	{
		$user = $this->isValidUser($login);
		$perm = new \B7KP\Utils\PermissionCheck("User");
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		$visibility = $perm->viewPermission($user, $this->factory, $settings->visibility);
		if($visibility)
		{
			$friends = new \B7KP\Utils\Friends($this->factory);
			$vars = array
						(
							"user" => $user,
							"lfm_bg" 	=> $this->getUserBg($user),
							"lfm_image" => $this->getUserBg($user, true),
							"friends"=> $friends->getFriends($user)
						);
			$this->render("friends.php", $vars);
		}
		else
		{
			$this->redirectToRoute("profile", array("login" => $user->login));
		}

	}

	protected function getBgImage($artist)
	{
		$img = null;
		if(isset($artist["images"]))
		{
			if(isset($artist["images"]["mega"]))
			{
				$img = $artist["images"]["mega"];
			}
			else
			{
				if(isset($artist["images"]["extralarge"]))
				{
					$img = $artist["images"]["extralarge"];
				}
				else
				{
					if(isset($artist["images"]["large"]))
					{
						$img = $artist["images"]["large"];
					}
					else
					{
						if(isset($artist["images"]["medium"]))
						{
							$img = $artist["images"]["medium"];
						}
					}
				}
			}
		}

		return $img;
	}

	protected function isValidUser($login)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		if($user instanceof User)
		{
			$perm = new \B7KP\Utils\PermissionCheck("User");
			$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
			$visibility = $perm->viewPermission($user, $this->factory, $settings->visibility);
			if($visibility)
			{
				return $user;
			}
			else
			{
				$this->redirectToRoute("profile", array("login" => $user->login));
			}
		}
		else
		{
			$this->redirectToRoute("404");
		}
	}

	protected function getUserBg($user, $avatar = false)
	{
		$lfm 	= new LastFm();
		$last 	= $lfm->setUser($user->login)->getUserInfo();
		if($avatar)
		{
			$bgimage = str_replace("34s", "avatar170s", $last["image"]);
		}
		else
		{
			$acts 	= $lfm->getUserTopArtist(array("limit" => 1, "period" => "overall"));
			$bgimage = false;
			if(isset($acts[0])): 
				$bgimage = $acts[0]["images"]["mega"];
			endif;
		}

		return $bgimage;
	}

	protected function getBiggestPlaycount($user)
	{
		$lfm 	= new LastFm();
		$lfm->setUser($user->login);
		$acts 	= $lfm->getUserTopArtist(array("limit" => 1, "period" => "overall"));
		$plays = 0;
		if(isset($acts[0]["playcount"])): 
			$plays = $acts[0]["playcount"];
		endif;


		return $plays;
	}

	protected function checkAccess()
	{
		return true;
	}

}
?>