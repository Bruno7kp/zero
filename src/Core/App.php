<?php 
/**
* src/Core/App.php
*/

class App
{
	private static $name;
	private static $author;
	private static $version;
	private static $environment;
	private static $db;
	private static $dbname;
	private static $host;
	private static $user;
	private static $password;
	private static $dsn;
	private static $loaded = false;
	
	private function __construct(){}

	public static function get($property)
	{
		if(!self::$loaded)
		{
			self::load();
		}

		if(property_exists(__CLASS__, $property))
		{
			return self::$$property;
		}
	}

	private static function setDsn()
	{
		return self::$db.":host=".self::$host.";dbname=".self::$dbname.";charset=utf8";
	}

	private static function load()
	{
		self::$name = "ZERO";
		self::$author = "Bruno7kp";
		self::$version = "0.1.5"; //21009409

		switch ($_SERVER['SERVER_NAME']) {
			case 'localhost':
				self::$environment = "DEV";
				self::$db = "mysql";
				self::$dbname = "mydb";
				self::$host = "localhost";
				self::$user = "root";
				self::$password = "";
				self::$dsn = self::setDsn();
				break;
			
			default:
				self::$environment = "PROD";
				self::$db = "mysql";
				self::$dbname = "mydb";
				self::$host = "localhost";
				self::$user = "root";
				self::$password = "";
				self::$dsn = self::setDsn();
				break;
		}

		self::$loaded = true;
	}
}
?>