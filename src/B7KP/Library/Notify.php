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
		echo "<li><a href=".Route::url("notification").">".Lang::get("notifications");
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
			echo "<li class=\"notification ".$vals["class"]."\"><div class=\"media\">\n";
				echo "<div class=\"media-left\">";
				echo "<div class=\"media-object\">";
					echo "<i class=\"".$vals["icon"]."\"></i>\n";
				echo "</div>";
				echo "</div>";
				echo "<div class=\"media-body\">";
				echo "<strong class=\"notification-title\">".Lang::get($from)."</strong>";
				echo "<p class=\"notification-desc\">".$vals["text"]."</p>";
				if($vals["render"]["file"] && file_exists(MAIN_DIR."view/".$vals["render"]["file"]))
				{
					$render_id = $vals["render"]["id"];
					include MAIN_DIR."view/".$vals["render"]["file"];
				}
				echo "</div>\n";
			echo "</div></li>\n";
		}
	}

	private function mergeDefault($val)
	{
		$default = array
					(
						"text" => false,
						"icon" => "fa fa-bell fa-fw fa-2x text-center",
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

		if(count($nots) > 0)
		{
			foreach ($nots as $key => $value) 
			{
				echo "<div class=row>\n";
				echo "<div class=col-xs-12>\n";
				echo "<ul class=notifications>";
				foreach ($value as $k => $v) {
					$this->outputNotification($key, $k);
				}
				echo "</ul>\n";
				echo "</div>\n";
				echo "</div>\n";
			}
		}
		else
		{
			$this->setNotification("Oops", array(array("text" => Lang::get("no_noty"), "icon" => "fa fa-meh-o fa-2x fa-fw text-primary")));
			$this->outputNotification("Oops", 0);
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
			$array[0] = array("text" => Lang::sub(Lang::get("noty_you_weeks_to_update"), array($toupdate))." <br/><a href=\"".Route::url("update")."\">".Lang::get('update')." ".Lang::get('now')."?</a>", "icon" => "fa fa-calendar-times-o fa-fw fa-2x text-center text-primary");
			$this->setNotification("noty_weeks_to_update", $array);
		}
	}
}
?>