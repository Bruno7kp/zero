<?php
namespace B7KP\Library;

use B7KP\Core\Dao;
use B7KP\Model\Model;
use B7KP\Entity\User;
use B7KP\Entity\Settings;
use B7KP\Utils\UserSession;
use B7KP\Library\Lang;
use B7KP\Library\Route;
use LastFmApi\Main\LastFm;

class Notify
{
	private $user, $dao, $factory, $notifications, $settings;

	function __construct($user = false)
	{
		$this->dao = Dao::getConn();
		$this->factory = new Model($this->dao);
		if($user instanceof User)
		{
			$this->user = $user;
		}
		else
		{
			$this->user = UserSession::getUser($this->factory);
		}
		$this->checkNotifications();
	}

	private function checkNotifications()
	{
		$this->notifications = array();
		if($this->user instanceof User)
		{
			$this->settings = $this->factory->findOneBy("B7KP\Entity\Settings", $this->user->id, "iduser");
			$this->getWeeksToUpdate();
		}
	}

	private function setNotification($from, $info = array())
	{
		$this->notifications[$from] = $info;
	}

	public function getNotifications()
	{
		return $this->notifications;
	}

	public function getNotificationsFrom($from)
	{
		if(isset($this->notifications[$from]))
		{
			return $this->notifications[$from];
		}
	}

	public function getNotificationsNumber($unique = false)
	{
		if($unique)
		{
			return count($this->notifications);
		}
		else
		{
			$count = 0;
			foreach ($this->notifications as $key => $value) {
				$count += count($value);
			}
			return $count;
		}
	}

	public function outputNumber($showonzero = false)
	{
		$n = $this->getNotificationsNumber();
		if($n > 0 || $showonzero)
		{
			echo "<span class=\"badge\">".$n."</span>";
		}
	}

	public function outputLine($showonzero = false)
	{
		$n = $this->getNotificationsNumber();
		echo "<li><a href=>".Lang::get("notifications");
		if($n > 0 || $showonzero)
		{
			echo " <span class=\"badge\">".$n."</span>";
		}
		echo "</a></li>";
	}

	public function outputNotification($from, $index)
	{
		if(isset($this->notifications[$from]) && isset($this->notifications[$from][$index]))
		{
			$n = $this->notifications[$from][$index];
			$vals = $this->mergeDefault($n);
			echo "<div class=\"row ".$vals["class"]."\">\n";
				echo "<div class=\"col-md-2 col-xs-3\">";
				if($vals["url"])
				{
					echo "<a href=".$vals["url"].">\n";
				}
					echo "<i class=\"".$vals["icon"]."\"></i>\n";
				if($vals["url"])
				{
					echo "</a>\n";
				}
				echo "</div>";
				echo "<div class=\"col-md-10 col-xs-9\">";
				if($vals["url"])
				{
					echo "<a href=".$vals["url"].">\n";
				}
					echo "<i class=\"".$vals["text"]."\"></i>\n";
				if($vals["url"])
				{
					echo "</a>\n";
				}
				if($vals["render"]["file"] && file_exists(MAIN_DIR."view/".$vals["render"]["file"]))
				{
					$render_id = $vals["render"]["id"];
					include MAIN_DIR."view/".$vals["render"]["file"];
				}
				echo "</div>\n";
			echo "</div>\n";
		}
	}

	private function mergeDefault($val)
	{
		$default = array
					(
						"text" => false,
						"url" => false,
						"icon" => "fa fa-bell fa-fw",
						"class" => "",
						"render" => array
									(
										"file" => false,
										"id" => false
									)
					);
		foreach ($default as $key => $value) 
		{
			if(isset($val[$key]))
			{
				if(is_array($default[$key]))
				{
					foreach ($default[$key] as $defk => $defv) 
					{
						if(isset($val[$key][$defk]))
						{
							$default[$key][$defk] = $val[$key][$defk];
						}
					}
				}
				else
				{
					$default[$key] = $val[$key];
				}
			}
		}

		return $default;
	}

	public function outputAll($from = false)
	{
		$nots = array();
		if($from)
		{
			$nots[] = (array) $this->getNotificationsFrom($from);
		}
		else
		{
			$nots = $this->getNotifications();
		}

		foreach ($nots as $key => $value) {
			echo "<div class=row>\n";
			echo "<div class=col-xs-12>\n";
			echo "<h2>".Lang::get($key)."</h2>";
			foreach ($value as $k => $v) {
				$this->outputNotification($key, $k);
			}
			echo "</div>\n";
			echo "</div>\n";
		}
	}

	/**
	*	Aqui ficam as buscas por notificações
	*/

	private function getWeeksToUpdate()
	{
		$startday = $this->settings->start_day ? "friday" : "sunday";
		$lfm 	= new LastFm();
		$lfm->setUser($this->user->login)->setStartDate($startday);
		if($this->user->lfm_register){
			$date = new \DateTime($this->user->lfm_register);
			$date = $date->format("Y.m.d");
		}else{
			$last 		= $lfm->getUserInfo();
			$date 		= \DateTime::createFromFormat("U", $last['registered'])->format("Y.m.d");
			$dateuser 	= \DateTime::createFromFormat("U", $last['registered'])->format("Y-m-d");
			$data 		= new \stdClass();
			$data->lfm_register = $dateuser;
			$data->id 	= $this->user->id;
			$this->factory->update("\B7KP\Entity\User", $data);
		}
		$wksfm 	= $lfm->getWeeklyChartList();
		$wksfm 	= count($lfm->removeWeeksBeforeDate($wksfm, $date, $this->user->id));
		$weeks 	= $this->factory->find("B7KP\Entity\Week", array("iduser" => $this->user->id), "week DESC");
		$toupdate = $wksfm - (is_array($weeks) ? count($weeks) : 0);
		if($toupdate > 0)
		{
			$array[0] = array("text" => Lang::get("noty_you_weeks_to_update"), "url" => Route::url("update"), "icon" => "fa fa-calendar fa-fw");
			$this->setNotification("noty_weeks_to_update", $array);
		}
	}
}
?>