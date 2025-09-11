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
    private static $updatedate;
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
            return self::${$property};
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
        self::$version = "0.14.000";
        self::$updatedate = "2025.08.30";

        self::$environment = $_ENV["ENV"];
        self::$db = $_ENV["DB"];
        self::$dbname = $_ENV["DB_NAME"];
        self::$host = $_ENV["DB_HOST"];
        self::$user = $_ENV["DB_USER"];
        self::$password = $_ENV["DB_PASS"];
        self::$dsn = self::setDsn();
        self::$lastfmapikey = $_ENV["LASTFM_KEY"];
        self::$lastfmapisecret = $_ENV["LASTFM_SECRET"];
        self::$loaded = true;
    }
}
