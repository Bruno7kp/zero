<?php
namespace B7KP\Controller;

use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Notify;
use B7KP\Model\Model;
use LastFmApi\Main\LastFm;

class SearchController extends Controller
{
	private $user, $user_lib;
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
		$this->lastfm = new LastFm();
	}

	/**
	* @Route(name=search|route=/user/{login}/search/{type})
	*/
	public function userSearch($login, $type)
	{
		$search = $this->isValidSearch($type);
		$this->user_lib = $this->isValidUser($login);
		$this->render("search.php", array("search" => $search));
	}

	private function isValidSearch($type)
	{
		if(isset($_GET["q"]) && !empty($_GET["q"])){
			$get = $_GET["q"];
			return $this->lastfm->search($type, $get);
		}else{
			return array();
		}	
	}

	/**
	* @Route(name=search_all|route=/search/{type})
	*/
	public function overallSearch($login, $type)
	{
		$this->render("search.php", array("search" => new Notify($this->user)));
	}

	protected function checkAccess()
	{
		return true;
	}

	protected function isValidUser($login)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		if($user instanceof User)
		{
			return $user;
		}
		else
		{
			$this->redirectToRoute("404");
		}
	}
}
?>