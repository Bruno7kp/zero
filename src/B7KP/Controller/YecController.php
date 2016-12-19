<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Route;
use B7KP\Library\Lang;
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
}
