<?php
namespace B7KP\Library;

use B7KP\Utils\Functions;
use B7KP\Entity\User;

class Route
{
	private static $routes;
	private static $specialRoutes;

	private static function findRoutes()
	{
		$reader = new AnnotationReader();
		$controllers = $reader->find("method","Route");
		self::mapRoutes($controllers);
	}

	private static function mapRoutes($controllers)
	{
		// Get the route for each controller
		foreach ($controllers as $classname => $methods) {
			// If the route accept variable values
			foreach ($methods as $key => $value) {
				$array = array("route" => $value->route, "class" => $classname, "method" => $key);
				$special = Functions::getStringBetween($value->route, "{", "}");
				if(count($special) > 0)
				{
					self::$specialRoutes[$value->name] = $array;
					self::$routes[$value->name] = $array;
				}
				else
				{
					self::$routes[$value->name] = $array;
				}
			}
		}
	}

	static function url($name, $array = array())
	{
		self::findRoutes();
		if(isset(self::$specialRoutes[$name]))
		{
			$url = Url::getBaseUrl().self::$routes[$name]["route"];
			$special = Functions::getStringBetween(self::$specialRoutes[$name]["route"], "{", "}");
			$tomatch = count($special);
			foreach ($special as $value) {
				if(!isset($array[$value]) || empty($array[$value]))
				{
					throw new \Exception("Missing one argument to create url: ".$value);
				}
				$url = str_replace("{".$value."}", $array[$value], $url);
			}
			return $url;
		}
		elseif(isset(self::$routes[$name]))
		{
			return Url::getBaseUrl().self::$routes[$name]["route"];
		}
		else
		{
			return "Route not found";
		}
	}

	private static function routeExists($route, $getname = false, $getparams = false)
	{
		$withoutlast = substr($route, 0, -1);
		self::findRoutes();
		foreach (self::$routes as $key => $value) {
			if($value["route"] == $route || $value["route"] == $withoutlast)
			{
				$realroute = self::$routes[$key];
				if($getname)
				{
					$realroute = $key;
				}
				break;
			}
		}

		if(!isset($realroute))
		{
			$realroute = self::specialRouteFix($route, $getname, $getparams);
		}

		return $realroute;
	}

	private static function specialRouteFix($route, $getname = false, $getparams = false)
	{
		$r = self::$routes["404"];
		$p = array();

		if($getname)
		{
			$r = "404";
		}

		if(count(self::$specialRoutes)>0)
		{
			foreach (self::$specialRoutes as $key => $value) 
			{
				$exploded = Functions::removeEmpty(explode("/", $route));
				$theroute = Functions::removeEmpty(explode("/", $value["route"]));
				$tomatch = count($theroute);
				$matches = 0;
				$p = array();

				if($tomatch != count($exploded))
				{
					continue;
				}
				foreach ($theroute as $thekey => $thevalue) 
				{
					if($thevalue == $exploded[$thekey])
					{
						$matches++;
					}
					else
					{
						if(substr_count($thevalue, "{") == 1 && substr_count($thevalue, "}"))
						{
							$p[] = $exploded[$thekey];
							$matches++;
						}
					}
				}
				if($tomatch == $matches)
				{
					$r = self::$routes[$key];
					if($getname)
					{
						$r = $key;
					}
					break;
				}
			}
		}
		return $getparams ? $p : $r;
	}

	public static function getClass($route)
	{
		$find = self::routeExists($route);
		return $find["class"];
	}

	public static function getMethod($route)
	{
		$find = self::routeExists($route);
		return $find["method"];
	}

	public static function getName($route)
	{
		$find = self::routeExists($route, true);
		return $find;
	}

	public static function gerCurRoute()
	{
		return self::getName(Url::getRequest());
	}

	public static function getRouteParams($route)
	{
		$find = self::routeExists($route, false, true);
		$find = Functions::hasStringKeys($find) ? array() : $find;
		return $find;
	}

	public static function isCurRoute($route)
	{
		return $route == self::getName(Url::getRequest());
	}

	public static function getRoutes(User $user)
	{
		if($user->permissionLevel() == 7)
		{
			self::findRoutes();
			return self::$routes;
		}
	}
}
?>