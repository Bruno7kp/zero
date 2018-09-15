<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Library\Assert;
use B7KP\Library\Route;
use B7KP\Entity\User;
use B7KP\Entity\Settings;
use LastFmApi\Main\LastFm;

use League\Flysystem\Adapter\Local;
use League\Flysystem\Filesystem;
use Cache\Adapter\Filesystem\FilesystemCachePool;

class UpdateController extends Controller
{
	private $settings;
	private $user;
	private $pool;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
		$this->settings = $this->factory->findOneBy("B7KP\Entity\Settings", $this->user->id, "iduser");
		$filesystemAdapter = new Local(MAIN_DIR.'cache');
		$filesystem        = new Filesystem($filesystemAdapter);
		$this->pool = new FilesystemCachePool($filesystem);
	}

	/**
	* @Route(name=update|route=/update)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$this->render("update.php");
	}

	/**
	* @Route(name=check_update|route=/check/update/{time})
	*/
	public function updateChart($time)
	{
		if($this->isAjaxRequest() && $this->user instanceof User)
		{
			$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $this->user->id, "iduser");
			$startday = $settings->start_day ? "friday" : "sunday";
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($this->user->login)->setStartDate($startday)->getUserInfo();
			$date 	= \DateTime::createFromFormat("U",$last['registered'])->format("Y-m-d");
			if($last["registered"] < 1 && $this->user->lfm_register)
			{
				$date = $this->user->lfm_register;
			}
			$wksfm 	= $lfm->getWeeklyChartList();
			$wksfm 	= $lfm->removeWeeksBeforeDate($wksfm, $date, $this->user->id);
			$weeks 	= $this->factory->find("B7KP\Entity\Week", array("iduser" => $this->user->id), "week DESC");
			$wksfm = array_reverse($wksfm);
			if($time == "new")
			{
				if(count($weeks)>0)
				{
					if(count($weeks) != count($wksfm))
					{
						$getlast = (count($wksfm) - count($weeks)) * -1;
						$wksfm = array_slice($wksfm, $getlast);
					}
					else
					{
						$wksfm = array();
					}
				}
			}
			echo json_encode($wksfm);
		}
		else
		{
			$this->redirectToRoute("update");
		}
	}

	/**
	* @Route(name=update_week|route=/update/week/{from}/{to})
	*/
	public function updateWeek($from, $to)
	{
		if($this->isAjaxRequest() && $this->user instanceof User)
		{
			$fromu   = $from;
			$from 	 = \DateTime::createFromFormat("U", $from)->format("Y-m-d");
			$to 	 = \DateTime::createFromFormat("U", $to)->format("Y-m-d");
			$updated = new \DateTime();
			$updated = $updated->format("YmdHis");
			$week 	 = $this->factory->find("B7KP\Entity\Week", array("iduser" => $this->user->id, "from_day" => $from, "to_day" => $to));

			if(count($week) == 0)
			{
				$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $this->user->id, "iduser");
				$startday = $settings->start_day ? "friday" : "sunday";
				$data = new \stdClass();
				$data->iduser = $this->user->id;
				$data->from_day = $from;
				$data->to_day = $to;
				$lfm 	= new LastFm();
				$last 	= $lfm->setUser($this->user->login)->setStartDate($startday);
				if($this->user->lfm_register){
					$date = $this->user->lfm_register;
				}else{
					$last = $lfm->getUserInfo();
					$date 	= \DateTime::createFromFormat("U",$last['registered'])->format("Y-m-d");
				}
				$wksfm 	= $lfm->getWeeklyChartList();
				$wksfm 	= $lfm->removeWeeksBeforeDate($wksfm, $date, $this->user->id);
				$wksfm 	= array_reverse($wksfm);
				//$key 	= array_search($fromu, array_column($wksfm, 'from'));
				$cond = array("iduser" => $this->user->id);
				$key = $this->factory->find("B7KP\Entity\Week", $cond);
				$data->week = count($key) + 1;
				$idweek = $this->factory->add("B7KP\Entity\Week", $data);
			}
			else
			{
				$idweek = $week[0]->id;
			}

			if($idweek > 0)
			{
				$thiswk = $this->factory->findOneBy("B7KP\Entity\Week", $idweek);
				$gmt = new \DateTimeZone("GMT");
				$from_day = new \DateTime($thiswk->from_day, $gmt);
				$to_day = new \DateTime($thiswk->to_day, $gmt);
				$from_day = $from_day->format("U");
				$to_day = $to_day->format("U");
				$lastfm = new LastFm();
				$lastfm->setUser($this->user->login);
				$vars = array("from" => $from_day, "to" => $to_day);
				$muslist = $lastfm->getWeeklyMusicList($vars);
				$artlist = $lastfm->getWeeklyArtistList($vars);
				$alblist = $lastfm->getWeeklyAlbumList($vars);
				$resT = $this->setArtistList($artlist, $idweek, $updated);
				$resM = $this->setMusicList($muslist, $idweek, $updated);
				$resA = $this->setAlbumList($alblist, $idweek, $updated);
				if(($resT + $resM + $resA) == 0)
				{
					$resp = array("error" => 0, "msg" => "Success");
				}
				else
				{
					$message = $resT ? "Artist ": "";
					$message .= $resM ? ",Music " : "";
					$message .= $resA ? ",Album " : "";
					$resp = array("error" => 2, "msg" => $message." not loaded");
				}
			}
			else
			{
				$resp = array("error" => 1, "msg" => "Week not found/loaded");
			}

			echo json_encode($resp);

		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	private function isWeekOwner($id)
	{
		$w = $this->factory->find("B7KP\Entity\Week", array("iduser" => $this->user->id, "id" => $id));

		return (is_array($w) && count($w) > 0);
	}

	/**
	* @Route(name=update_edited_week|route=/update/edited/week)
	*/
	public function updateEditedWeek()
	{
		if($this->isAjaxRequest() && $this->user instanceof User)
		{
			if(isset($_POST["type"]) && isset($_POST["items"]) && isset($_POST["week"]) && $this->isWeekOwner($_POST["week"]))
			{
				$post = (object) $_POST;
				$call = "set".ucfirst($post->type)."List";
				$updated = new \DateTime();
				$updated = $updated->format("YmdHis");
				$list = array();
				foreach ($post->items as $key => $value) {
					$value = (object) $value;
					$list[$key]["name"] = $value->name;
					$list[$key]["mbid"] = $value->mbid;
					$list[$key]["artist"]["name"] = $value->artist["name"];
					$list[$key]["artist"]["mbid"] = $value->artist["mbid"];
					$list[$key]["rank"] = $value->rank;
					$list[$key]["playcount"] = $value->playcount;
				}
				$error = $this->$call($list, $post->week, $updated);
				$resp = array("error" => $error, "msg" => "fail");
			}
			else
			{
				$resp = array("error" => 1, "msg" => "Data not found/loaded");
			}

			echo json_encode($resp);
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	private function setArtistList($list, $idweek, $updated)
	{
		$error = 0;
		$i = 0;
		if(is_array($list) && count($list)>0)
		{
			foreach ($list as $value) {
				$data[$i] = new \stdClass();
				$data[$i]->idweek = $idweek;
				$data[$i]->artist = $value['name'];
				$data[$i]->art_mbid = $value['mbid'];
				$data[$i]->playcount = $value['playcount'];
				$data[$i]->rank = $value['rank'];
				$data[$i]->updated = $updated;
				$i++;
			}

			$cut = 10;
			if($this->settings)
			{
				$cut = $this->settings->art_limit;
			}
			if($cut > 1){
				$data = array_slice($data, 0, $cut);
			}
			$id = $this->factory->multiAdd('B7KP\Entity\Artist_charts', "idweek, artist, art_mbid, playcount, rank, updated", $data);
			if(!$id > 0)
			{
				$error++;
			}
			$this->factory->removeBy("B7KP\Entity\Artist_charts", "idweek = ".$idweek." AND updated", $updated, "<");
			$login = $this->user->login;
			$this->pool->invalidateTags([md5($login)."_artist"]);
		}
		return $error;
	}

	private function setAlbumList($list, $idweek, $updated)
	{
		$error = 0;
		$i = 0;
		if(is_array($list) && count($list)>0){
			foreach ($list as $value) {
				$data[$i] = new \stdClass();
				$data[$i]->idweek = $idweek;
				$data[$i]->album = $value['name'];
				$data[$i]->alb_mbid = $value['mbid'];
				$data[$i]->artist = $value['artist']['name'];
				$data[$i]->art_mbid = $value['artist']['mbid'];
				$data[$i]->playcount = $value['playcount'];
				$data[$i]->rank = $value['rank'];
				$data[$i]->updated = $updated;
				$i++;
			}
			$cut = 10;
			if($this->settings)
			{
				$cut = $this->settings->alb_limit;
			}
			if($cut > 1){
				$data = array_slice($data, 0, $cut);
			}
			$id = $this->factory->multiAdd('B7KP\Entity\Album_charts', "idweek, album, alb_mbid, artist, art_mbid, playcount, rank, updated", $data);
			if(!$id > 0)
			{
				$error++;
			}
			$this->factory->removeBy("B7KP\Entity\Album_charts", "idweek = ".$idweek." AND updated", $updated, "<");
			$login = $this->user->login;
			$this->pool->invalidateTags([md5($login)."_album"]);
		}

		return $error;
	}

	private function setMusicList($list, $idweek, $updated)
	{
		$error = 0;
		$i = 0;
		if(is_array($list) && count($list)>0)
		{
			foreach ($list as $value) {
				$data[$i] = new \stdClass();
				$data[$i]->idweek = $idweek;
				$data[$i]->music = $value['name'];
				$data[$i]->mus_mbid = $value['mbid'];
				$data[$i]->artist = $value['artist']['name'];
				$data[$i]->art_mbid = $value['artist']['mbid'];
				$data[$i]->playcount = $value['playcount'];
				$data[$i]->rank = $value['rank'];
				$data[$i]->updated = $updated;
				$i++;
			}
			$cut = 10;
			if($this->settings)
			{
				$cut = $this->settings->mus_limit;
			}
			if($cut > 1){
				$data = array_slice($data, 0, $cut);
			}
			$id = $this->factory->multiAdd('B7KP\Entity\Music_charts', "idweek, music, mus_mbid, artist, art_mbid, playcount, rank, updated", $data);
			if(!$id > 0)
			{
				$error++;
			}
			$this->factory->removeBy("B7KP\Entity\Music_charts", "idweek = ".$idweek." AND updated", $updated, "<");
			$login = $this->user->login;
			$this->pool->invalidateTags([md5($login)."_music"]);
		}
		return $error;
	}

	private function checkAssert($post)
	{
		$assert = new Assert();
		$assert->check("\B7KP\Entity\Settings", $post, false);
		$this->assertErrors = $assert->getErrors();

		return count($this->assertErrors)==0;
	}

	protected function checkAccess()
	{
		if(!$this->user instanceof User)
		{
			$this->redirectToRoute("login");
		}
	}
}
