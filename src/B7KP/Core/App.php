<?php 
namespace B7KP\Core;

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
	private static $lastfmapikey;
	private static $lastfmapisecret;
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
		self::$version = "0.11.000";

		switch ($_SERVER['SERVER_NAME']) {
			case 'localhost':
				self::$environment = "DEV";
				self::$db = "mysql";
				self::$dbname = "mydb";
				self::$host = "localhost";
				self::$user = "root";
				self::$password = "";
				self::$dsn = self::setDsn();
				self::$lastfmapikey = "68d81020be83713df69720b5acdf0a1f";
				self::$lastfmapisecret = "daf57401387415299a1778da3544ab10";
				break;
			
			default:
				self::$environment = "PROD";
				self::$db = "mysql";
				self::$dbname = "";
				self::$host = "";
				self::$user = "";
				self::$password = "";
				self::$dsn = self::setDsn();
				self::$lastfmapikey = "f383ea53a3df0bb4c8c1387018ec6c58";
				self::$lastfmapisecret = "2d32aeac2eaf2c7014d1591b01b2001f";
				break;
		}

		self::$loaded = true;
	}
}
?>