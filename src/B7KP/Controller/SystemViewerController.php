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

		// Como não tenho acesso ao phpmyadmin...

		// Add coluna
		//$affected = $dao->run("ALTER TABLE settings ADD show_wkl_cert INT NOT NULL");

		// Add tabela
		$dao->run("CREATE TABLE `yec` ( `id` INT NOT NULL AUTO_INCREMENT , `iduser` INT NOT NULL , `year` INT NOT NULL , PRIMARY KEY (`id`))");
		$dao->run("
		CREATE TABLE `album_yec` (
		  `id` int(11) NOT NULL,
		  `idyec` int(11) NOT NULL,
		  `album` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
		  `alb_mbid` varchar(255) NOT NULL,
		  `artist` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
		  `art_mbid` varchar(255) NOT NULL,
		  `playcount` int(11) NOT NULL,
		  `rank` int(6) NOT NULL,
		  `updated` bigint(16) NOT NULL
		)");
		$dao->run("
		CREATE TABLE `artist_yec` (
		  `id` int(11) NOT NULL,
		  `idyec` int(11) NOT NULL,
		  `artist` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
		  `art_mbid` varchar(255) NOT NULL,
		  `playcount` int(11) NOT NULL,
		  `rank` int(5) NOT NULL,
		  `updated` bigint(16) NOT NULL
		)");
		$dao->run("
		CREATE TABLE `music_yec` (
		  `id` int(11) NOT NULL,
		  `idyec` int(11) NOT NULL,
		  `music` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
		  `mus_mbid` varchar(255) DEFAULT NULL,
		  `artist` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
		  `art_mbid` varchar(255) NOT NULL,
		  `playcount` int(11) NOT NULL,
		  `rank` int(7) NOT NULL,
		  `updated` bigint(16) NOT NULL
		)");
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