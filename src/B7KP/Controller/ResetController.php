<?php
namespace B7KP\Controller;

use B7KP\Core\Dao;
use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Login;
use B7KP\Library\Assert;
use B7KP\Library\Route;
use B7KP\Library\Lang;
use B7KP\Entity\User;

class ResetController extends Controller
{
	private $user, $settings;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
	}

	/**
	* @Route(name=reset_acc|route=/edit/reset)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$this->render("reset.php");
	}

	protected function checkAccess()
	{
		if(!$this->user instanceof User)
		{
			$this->redirectToRoute("login");
		}
	}

	/**
	* @Route(name=reset_profile|route=/check/reset)
	*/
	public function reset()
	{
		$this->removeWeeklyCharts();
		echo json_encode(array("error" => 0, "msg" => Lang::get("acc_success")));
	}

	/**
	* @Route(name=delete_profile|route=/check/delete)
	*/
	public function delete()
	{
		$this->removeWeeklyCharts();
		$this->factory->removeBy("\B7KP\Entity\Settings", "iduser", $this->user->id);
		$this->factory->removeBy("\B7KP\Entity\Plaque", "iduser", $this->user->id);
		$this->factory->removeBy("\B7KP\Entity\User", "id", $this->user->id);
		
		echo json_encode(array("error" => 0, "msg" => Lang::get("acc_success_rem")));
	}

	/**
	* @Route(name=delete_plaques|route=/check/delete_plaques)
	*/
	public function deletePlaques()
	{
		$this->factory->removeBy("\B7KP\Entity\Plaque", "iduser", $this->user->id);
		
		echo json_encode(array("error" => 0, "msg" => Lang::get("acc_success_pla")));
	}

	private function removeWeeklyCharts()
	{
		$dao = Dao::getConn();

		$affected = $dao->run("SELECT t.* FROM artist_charts t, week w, user u WHERE t.idweek = w.id AND u.id = w.iduser AND w.iduser = ".$this->user->id);
		foreach ($affected as $key => $value) {
			$this->factory->removeBy("\B7KP\Entity\Artist_charts", "id", $value->id);
		}

		$affected = $dao->run("SELECT t.* FROM album_charts t, week w, user u WHERE t.idweek = w.id AND u.id = w.iduser AND w.iduser = ".$this->user->id);
		foreach ($affected as $key => $value) {
			$this->factory->removeBy("\B7KP\Entity\Album_charts", "id", $value->id);
		}

		$affected = $dao->run("SELECT t.* FROM music_charts t, week w, user u WHERE t.idweek = w.id AND u.id = w.iduser AND w.iduser = ".$this->user->id);
		foreach ($affected as $key => $value) {
			$this->factory->removeBy("\B7KP\Entity\Music_charts", "id", $value->id);
		}

		$this->factory->removeBy("\B7KP\Entity\Week", "iduser", $this->user->id);
	}
}
?>