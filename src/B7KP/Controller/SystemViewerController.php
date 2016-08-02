<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Core\App;
use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Route;
use B7KP\Utils\Pass;

class SystemViewerController extends Controller
{
	private $user;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($factory);
	}

	/**
	* @Route(name=routes|route=/routes)
	*/
	public function viewRoutes()
	{
		$this->checkAccess();
		$routes = Route::getRoutes($this->user);
		ksort($routes);
		$vars = array("routes" => $routes);
		$this->render("admin/routes.php", $vars);
	}

	/**
	* @Route(name=users|route=/users)
	*/
	public function viewUsers()
	{
		$this->checkAccess();
		$users = $this->factory->find("B7KP\Entity\User", array());
		$vars = array("users" => $users);
		$this->render("admin/users.php", $vars);
	}

	/**
	* @Route(name=exec_query|route=/execute)
	*/
	public function executeQuery()
	{
		$this->checkAccess();
		$dao = Dao::getConn();
		// $tables = $dao->run("SELECT COUNT(*) AS t, date FROM plaque GROUP BY date");
		// foreach ($tables as $key => $value) {
		// 	echo $value->date." - ".$value->t."<br/>";
		// }
		$affected = $dao->run("ALTER TABLE settings ADD theme INT NOT NULL");
		//$affected = $dao->run("UPDATE week SET week = 198 WHERE iduser = 124 AND week = 1 AND to_day > '2015-01-01'");
		//$affected = $this->factory->removeBy("\B7KP\Entity\Settings", "iduser", 1227);
		// $affected = $dao->run("SELECT * FROM music_charts t, week w, user u WHERE t.idweek = w.id AND u.id = w.iduser AND w.iduser = 472");
		// var_dump($affected);

	}

	/**
	* @Route(name=dbinfo|route=/dbinfo)
	*/
	public function dbInfo()
	{
		$this->checkAccess();
		$dao = Dao::getConn();
		$tables = $dao->run("SELECT table_name, column_name, is_nullable, data_type, character_maximum_length, character_set_name, collation_name, column_type, column_key, extra FROM `INFORMATION_SCHEMA`.`COLUMNS` WHERE `TABLE_SCHEMA`='".App::get("dbname")."'");
			echo "<table>";
				echo "<tr>";
			foreach ($tables[0] as $kt => $vt) {
					echo "<td>".$kt."</td>";
			}
				echo "</tr>";
		foreach ($tables as $key => $value) {
			echo "<tr>";
			foreach ($value as $k => $v) {
				echo "<td>".$v."</td>";
			}
			echo "</tr>";
		}
			echo "</table>";
	}


	/**
	* @Route(name=php|route=/phpinfo)
	*/
	public function phpInfo()
	{
		$this->checkAccess();
		phpinfo();
	}

	/**
	* @Route(name=setuser|route=/setuser)
	*/
	public function setUsers()
	{
		$this->checkAccess();
		$form = $this->createForm("AdminRegisterForm");
		$this->render("admin/setuser.php", array("form" => $form));
	}

	protected function checkAccess()
	{
		$check = $this->user instanceof User && $this->user->permissionLevel() == 7;
		if(!$check)
		{
			$this->redirectToRoute("403");
		}
	}
}
?>