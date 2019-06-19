<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Route;
use B7KP\Library\Lang;
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Utils\Certified;
use B7KP\Entity\Settings;
use LastFmApi\Main\LastFm;

class YecController extends Controller
{
	private $user;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($factory);
		$this->checkAccess();
		$this->settings = false;
	}


	/**
	* @Route(name=full_yec_list|route=/user/{login}/yec/list/{by})
	*/
	public function fullYEC($login, $by)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		$by = $by === "points" || $by === "plays" ? $by : false;
		if($user instanceof User && $by)
		{
			$perm = new \B7KP\Utils\PermissionCheck("User");
			$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
			$visibility = $perm->viewPermission($user, $this->factory, $settings->visibility);
			if(!$visibility)
			{
				$this->redirectToRoute("profile", array("login" => $user->login));
			}
			$bgimage = $this->getUserBg($user);
			$numberones = array();
			$cond = array("iduser" => $user->id);
			$years = $this->factory->find("B7KP\Entity\Yec", $cond, "year DESC");
			$i = 0;
			foreach ($years as $year) 
			{
				$numberones[$i]["year"] = $year->year;
				$cond = array("idyec" => $year->id);
				$numberones[$i]["album"]  = $this->factory->find("B7KP\Entity\\Album_yec", $cond, "updated DESC, rank ASC", "0, 1");
				$numberones[$i]["artist"]  = $this->factory->find("B7KP\Entity\\Artist_yec", $cond, "updated DESC, rank ASC", "0, 1");
				$numberones[$i]["music"]  = $this->factory->find("B7KP\Entity\\Music_yec", $cond, "updated DESC, rank ASC", "0, 1");
				$i++;
			}
			$var = array
					(
						"yecs" 	=> $numberones,
						"by" 	=> $by,
						"user" 		=> $user,
						"lfm_bg" 	=> $bgimage,
						"lfm_image" => $this->getUserBg($user, true)
					);
			$this->render("chartlistyec.php", $var);
		}
		else
		{
			$this->redirectToRoute("registernotfound", array("entity" => "user"));
		}
	}

	/**
	* @Route(name=yec_chart|route=/user/{login}/charts/{type}/year/{year})
	*/
	public function yecChart($login, $type, $year)
	{
		$user = $this->isValidUser($login);
		$this->isValidType($type, $user);
		if(is_numeric($year))
		{
			$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
			$year = $this->factory->find("B7KP\Entity\Yec", array("iduser" => $user->id, "year" => $year), "year DESC");
			$bgimage = $this->getUserBg($user);
			if(is_array($year) && count($year) > 0)
			{
				$limit = 100;
				if($settings instanceof Settings)
				{

					//$prop = substr($type, 0, 3) . "_limit";
					//$limit = $settings->$prop;
				}
				$year = $year[0];
				$chart = new Charts($this->factory, $user);
				$list = $chart->getYecCharts($year, $type, $limit, true, $settings);
				$vars = array
							(
								'user' 		=> $user, 
								'list' 		=> $list, 
								'type' 		=> $type, 
								'week' 		=> $year,
								'year' 		=> $year,
								"lfm_bg" 	=> $bgimage,
								"lfm_image" => $this->getUserBg($user, true)
								);
				$this->render("chart-yec.php", $vars);
			}
			else
			{
				$this->redirectToRoute("registernotfound", array("entity" => "Week"));
			}
		}
		else
		{
			$this->redirectToRoute("chart_list", array("login" => $user->login));
		}
	}

	/**
	* @Route(name=update_yec|route=/update/yec)
	*/
	public function indexYecPage()
	{
		$this->render("update_yec.php", ["year" => $this->checkFirstYear()]);
	}

	/**
	* @Route(name=update_yec_time|route=/update_yec/{time})
	*/
	public function updateYec($time)
	{
		echo json_encode($this->checkYear($time));
	}

	private function checkYear($year)
	{
		$resp = array("error" => 1, "msg" => Lang::get("yec_update_error"));

		$data = ["iduser" => $this->user->id, "year" => $year];
		$years = $this->factory->find("B7KP\Entity\Yec", $data);
		if(isset($years[0]))
		{
			$year = $years[0];
		}
		else
		{
			$id = $this->factory->add("B7KP\Entity\Yec", $data);
			$years = $this->factory->find("B7KP\Entity\Yec", $data);
			if(isset($years[0]))
			{
				$year = $years[0];
			}
			else
			{
				return false;
			}
		}

		$idyec = $year->id;
		$updated = new \DateTime();
		$updated = $updated->format("YmdHis");
		$gmt = new \DateTimeZone("GMT");
		$from_day = new \DateTime($year->year."-01-01", $gmt);
		$to_day = new \DateTime($year->year."-12-31", $gmt);
		$from_day = $from_day->format("U");
		$to_day = $to_day->format("U");
		$lastfm = new LastFm();
		$lastfm->setUser($this->user->login);
		$vars = array("from" => $from_day, "to" => $to_day);
		$muslist = $lastfm->getWeeklyMusicList($vars);
		$artlist = $lastfm->getWeeklyArtistList($vars);
		$alblist = $lastfm->getWeeklyAlbumList($vars);
		$resT = $this->setArtistList($artlist, $idyec, $updated);
		$resM = $this->setMusicList($muslist, $idyec, $updated);
		$resA = $this->setAlbumList($alblist, $idyec, $updated);
		if(($resT + $resM + $resA) == 0)
		{
			$resp = array("error" => 0, "msg" => Lang::get("yec_update_success"));
		}
		else
		{
			$message = $resT ? "Artist ": "";
			$message .= $resM ? ",Music " : "";
			$message .= $resA ? ",Album " : "";
			$resp = array("error" => 2, "msg" => $message." not loaded");
		}
		
		return $resp;
	}

	private function setArtistList($list, $idyec, $updated)
	{
		$error = 0;
		$i = 0;
		if(is_array($list) && count($list)>0)
		{
			foreach ($list as $value) {
				$data[$i] = new \stdClass();
				$data[$i]->idyec = $idyec;
				$data[$i]->artist = $value['name'];
				$data[$i]->art_mbid = $value['mbid'];
				$data[$i]->playcount = $value['playcount'];
				$data[$i]->rank = $value['rank'];
				$data[$i]->updated = $updated;
				$i++;
			}

			$cut = 100;
			if($this->settings)
			{
				$cut = $this->settings->art_limit;
			}
			if($cut > 1){
				$data = array_slice($data, 0, $cut);
			}
			$id = $this->factory->multiAdd('B7KP\Entity\Artist_yec', "idyec, artist, art_mbid, playcount, rank, updated", $data);

			if(!$id > 0)
			{
				$error++;
			}
			$this->factory->removeBy("B7KP\Entity\Artist_yec", "idyec = ".$idyec." AND updated", $updated, "<");
		}
		return $error;
	}

	private function setAlbumList($list, $idyec, $updated)
	{
		$error = 0;
		$i = 0;
		if(is_array($list) && count($list)>0){
			foreach ($list as $value) {
				$data[$i] = new \stdClass();
				$data[$i]->idyec = $idyec;
				$data[$i]->album = $value['name'];
				$data[$i]->alb_mbid = $value['mbid'];
				$data[$i]->artist = $value['artist']['name'];
				$data[$i]->art_mbid = $value['artist']['mbid'];
				$data[$i]->playcount = $value['playcount'];
				$data[$i]->rank = $value['rank'];
				$data[$i]->updated = $updated;
				$i++;
			}
			$cut = 100;
			if($this->settings)
			{
				$cut = $this->settings->alb_limit;
			}
			if($cut > 1){
				$data = array_slice($data, 0, $cut);
			}
			$id = $this->factory->multiAdd('B7KP\Entity\Album_yec', "idyec, album, alb_mbid, artist, art_mbid, playcount, rank, updated", $data);
			if(!$id > 0)
			{
				$error++;
			}
			$this->factory->removeBy("B7KP\Entity\Album_yec", "idyec = ".$idyec." AND updated", $updated, "<");
		}

		return $error;
	}

	private function setMusicList($list, $idyec, $updated)
	{
		$error = 0;
		$i = 0;
		if(is_array($list) && count($list)>0)
		{
			foreach ($list as $value) {
				$data[$i] = new \stdClass();
				$data[$i]->idyec = $idyec;
				$data[$i]->music = $value['name'];
				$data[$i]->mus_mbid = $value['mbid'];
				$data[$i]->artist = $value['artist']['name'];
				$data[$i]->art_mbid = $value['artist']['mbid'];
				$data[$i]->playcount = $value['playcount'];
				$data[$i]->rank = $value['rank'];
				$data[$i]->updated = $updated;
				$i++;
			}
			$cut = 100;
			if($this->settings)
			{
				$cut = $this->settings->mus_limit;
			}
			if($cut > 1){
				$data = array_slice($data, 0, $cut);
			}
			$id = $this->factory->multiAdd('B7KP\Entity\Music_yec', "idyec, music, mus_mbid, artist, art_mbid, playcount, rank, updated", $data);
			if(!$id > 0)
			{
				$error++;
			}
			$this->factory->removeBy("B7KP\Entity\Music_yec", "idyec = ".$idyec." AND updated", $updated, "<");
		}
		return $error;
	}

	private function checkFirstYear()
	{
		$year = 2005;
		$user = $this->user;
		if($user->lfm_register){
			$date = new \DateTime($user->lfm_register);
			$year = $date->format("Y");
		}else{
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login)->setStartDate($startday)->getUserInfo();
			$year 	= \DateTime::createFromFormat("U",$last['registered'])->format("Y");
			$dateuser 	= \DateTime::createFromFormat("U",$last['registered'])->format("Y-m-d");
			$data = new \stdClass();
			$data->lfm_register = $dateuser;
			$data->id = $user->id;
			$this->factory->update("\B7KP\Entity\User", $data);
		}

		return $year;
	}

	protected function checkAccess()
	{
		$check = $this->user instanceof User;
		if(!$check)
		{
			$this->redirectToRoute("403");
		}
	}

	protected function isValidType($type, $user)
	{
		if($type != "artist" && $type != "music" && $type != "album")
		{
			$this->redirectToRoute("chart_list", array("login" => $user->login));
		}
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
			return false; // last.fm não envia mais imagens do artista
			$acts 	= $lfm->getUserTopArtist(array("limit" => 1, "period" => "overall"));
			$bgimage = false;
			if(isset($acts[0])): 
				$bgimage = $acts[0]["images"]["mega"];
			endif;
		}

		return $bgimage;
	}
}
