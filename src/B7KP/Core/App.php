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
		self::$version = "0.04.025";

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
				self::$dbname = "u484388465_bd";
				self::$host = "mysql.hostinger.com.br";
				self::$user = "u484388465_user";
				self::$password = "b3tt3rg1v3ch4rts";
				self::$dsn = self::setDsn();
				self::$lastfmapikey = "2009fbfac80cacfae524cb384040403b";
				self::$lastfmapisecret = "7a8bce33c7232ed3eb3493061267820f";
				break;
		}

		self::$loaded = true;
	}
}
?>