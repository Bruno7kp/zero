<?php 
namespace B7KP\Library;

use B7KP\Core\Dao;
use B7KP\Model\Model;

class Template
{
	private static $dao;
	private static $factory;
	
	private function __construct() {}

	private static function setFactory()
	{
		self::$dao = Dao::getConn();
		self::$factory = new Model(self::$dao);
	}

	public static function render()
	{
		self::setFactory();
		$route = Url::getRequest();
		$class = Route::getClass($route);
		$method = Route::getMethod($route);
		$routename = Route::getName($route);
		$routeparams = Route::getRouteParams($route);

		$call = new $class(self::$factory);
		$call->$method(...$routeparams);
	}
}
?>