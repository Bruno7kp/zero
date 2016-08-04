<?php
namespace B7KP\Controller;

use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Notify;
use B7KP\Model\Model;

class NotificationController extends Controller
{
	private $user, $settings;
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
	}

	/**
	* @Route(name=notification|route=/notifications)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$this->render("notifications.php", array("notifications" => new Notify($this->user)));
	}

	protected function checkAccess()
	{
		if(!$this->user instanceof User)
		{
			$this->redirectToRoute("login");
		}
	}
}
?>