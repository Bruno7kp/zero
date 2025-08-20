<?php
namespace LastFmApi\Main;

use LastFmApi\Api\AuthApi;
use LastFmApi\Api\ArtistApi;
use LastFmApi\Api\AlbumApi;
use LastFmApi\Api\TrackApi;
use LastFmApi\Api\LibraryApi;
use LastFmApi\Api\UserApi;
use B7KP\Core\App;

class LastFm
{
    private $apiKey;
    private $sessionKey;
    private $secret;
    private $token = false;
    private $artistApi;
    private $userName;
    private $artists = array();
    private $albums = array();
    private $musics = array();
    private $limit = 50;
    private $page = 1;
    private $startunix = 1108296000;

    public function __construct()
    {
        $this->apiKey = App::get('lastfmapikey');
        $this->secret = App::get('lastfmapisecret');
        $auth = new AuthApi('setsession', array('apiKey' => $this->apiKey, 'secret' => $this->secret));
        $this->artistApi = new ArtistApi($auth);
        $this->albumApi = new AlbumApi($auth);
        $this->trackApi = new TrackApi($auth);
        $this->libraryApi = new LibraryApi($auth);
        $this->userApi = new UserApi($auth);
    }

    public function setToken($token)
    {
        $auth = new AuthApi('getsession', array('apiKey' => $this->apiKey, 'secret' => $this->secret, 'token' => $token));
        return $auth->username;
    }

    public function setUser($user)
    {
        $this->userName = $user;
        return $this;
    }

    public function setLimit($val)
    {
        $this->limit = $val;
        return $this;
    }

    public function setPage($val)
    {
        $this->page = $val;
        return $this;
    }

    public function getUserInfo($vars = array())
    {
        if(!isset($vars['user'])) {
            $vars['user'] = $this->userName;
        }
        $cacheKey = 'userinfo_' . md5(json_encode($vars));

        if (isset($_SESSION['lastfm_cache'][$cacheKey])) {
            return $_SESSION['lastfm_cache'][$cacheKey];
        }
        
        $data = $this->userApi->getInfo($vars);
        $_SESSION['lastfm_cache'][$cacheKey] = $data;
        return $data;
    }

    public function getUserTopArtist($vars = array())
    {
        if(!isset($vars['user'])) {
            $vars['user'] = $this->userName;
        }
        $cacheKey = 'usertopartist_' . md5(json_encode($vars));

        if (isset($_SESSION['lastfm_cache'][$cacheKey])) {
            return $_SESSION['lastfm_cache'][$cacheKey];
        }

        $data = $this->userApi->getTopArtists($vars);
        $_SESSION['lastfm_cache'][$cacheKey] = $data;
        return $data;
    }

    public function getUserTopAlbum($vars = array())
    {
        if(!isset($vars['user'])) {
            $vars['user'] = $this->userName;
        }
        $cacheKey = 'usertopalbum_' . md5(json_encode($vars));

        if (isset($_SESSION['lastfm_cache'][$cacheKey])) {
            return $_SESSION['lastfm_cache'][$cacheKey];
        }

        $data = $this->userApi->getTopAlbums($vars);
        $_SESSION['lastfm_cache'][$cacheKey] = $data;
        return $data;
    }

    public function getUserTopMusic($vars = array())
    {
        if(!isset($vars['user'])) {
            $vars['user'] = $this->userName;
        }
        $cacheKey = 'usertopmusic_' . md5(json_encode($vars));

        if (isset($_SESSION['lastfm_cache'][$cacheKey])) {
            return $_SESSION['lastfm_cache'][$cacheKey];
        }

        $data = $this->userApi->getTopTracks($vars);
        $_SESSION['lastfm_cache'][$cacheKey] = $data;
        return $data;
    }

    public function getRecentTrack($vars = array())
    {
        if(!isset($vars['user']))
        {
            $vars['user'] = $this->userName;
        }
        $vars['limit'] = 4;
        return $this->userApi->getRecentTracks($vars);   
    }

    public function setStartDate($var)
    {
        if($var == "friday"){
             $this->startunix = 1108123200;
        }else{
            $this->startunix = 1108296000;
        }

        return $this;
    }

    public function getWeeklyChartList($vars = array())
    {
        $unixdate = $this->startunix;
        $nowdate = new \DateTime("now", new \DateTimeZone('GMT'));
        $nowunix = $nowdate->format("U");
        $unixdates = array();
        $i = 0;
        while ($unixdate + 604800 - (60*60*12) < $nowunix) {
            $unixdates[$i]["from"] = $unixdate;
            $unixdate += 604800;
            $unixdates[$i]["to"] = $unixdate;
            $i++;
        }
        return $unixdates; 
    }

    public function getWeeklyArtistList($vars = array())
    {
        if(!isset($vars['user']))
        {
            $vars['user'] = $this->userName;
        }
        return $this->userApi->getWeeklyArtistChart($vars);
    }

    public function getWeeklyAlbumList($vars = array())
    {
        if(!isset($vars['user']))
        {
            $vars['user'] = $this->userName;
        }
        return $this->userApi->getWeeklyAlbumChart($vars); 
    }

    public function getWeeklyMusicList($vars = array())
    {
        if(!isset($vars['user']))
        {
            $vars['user'] = $this->userName;
        }
        return $this->userApi->getWeeklyTrackChart($vars);
    }

    public function getArtistInfo($str, $mbid = null)
    {
        $mbid = ""; // bug: ignore mbid
        $vars = array("artist" => $str, "mbid" => $mbid);
        $vars['username'] = $this->userName;
        $cacheKey = 'artistinfo_' . md5(json_encode($vars));

        if (isset($_SESSION['lastfm_cache'][$cacheKey])) {
            return $_SESSION['lastfm_cache'][$cacheKey];
        }
        
        $data = $this->artistApi->getInfo($vars);
        $_SESSION['lastfm_cache'][$cacheKey] = $data;
        return $data;
    }

    public function getMusicInfo($str, $artist, $mbid = null, $autocorrect = 0)
    {
        $mbid = ""; // bug: ignore mbid
        $vars = array("track" => $str, "artist" => $artist, "mbid" => $mbid, "autocorrect" => $autocorrect);
        $vars['username'] = $this->userName;
        $cacheKey = 'musicinfo_' . md5(json_encode($vars));

        if (isset($_SESSION['lastfm_cache'][$cacheKey])) {
            return $_SESSION['lastfm_cache'][$cacheKey];
        }

        $data = $this->trackApi->getInfo($vars);
        $_SESSION['lastfm_cache'][$cacheKey] = $data;
        return $data;
    }

    public function getAlbumInfo($str, $artist, $mbid = null)
    {
        $mbid = ""; // bug: ignore mbid
        $vars = array("album" => $str, "artist" => $artist, "mbid" => $mbid);
        $vars['username'] = $this->userName;
        $cacheKey = 'albuminfo_' . md5(json_encode($vars));

        if (isset($_SESSION['lastfm_cache'][$cacheKey])) {
            return $_SESSION['lastfm_cache'][$cacheKey];
        }

        $data = $this->albumApi->getInfo($vars);
        $_SESSION['lastfm_cache'][$cacheKey] = $data;
        return $data;
    }

    public function loadLibrary()
    {
        $this->loadArtists()
            ->loadAlbums()
            ->loadTracks();
        return $this;
    }

    public function loadArtists()
    {
        $vars = array('user' => $this->userName, 'limit' => $this->limit, 'page' => $this->page);
        $this->artists = $this->userApi->getTopArtists($vars);
        return $this;
    }

    public function loadAlbums()
    {
        $vars = array('user' => $this->userName, 'limit' => $this->limit, 'page' => $this->page);
        $this->albums = $this->userApi->getTopAlbums($vars);
        return $this;
    }

    public function loadTracks()
    {
        $vars = array('user' => $this->userName, 'limit' => $this->limit, 'page' => $this->page);
        $this->musics = $this->userApi->getTopTracks($vars);
        return $this;
    }

    public function getArtists()
    {
        return $this->artists;
    }

    public function findArtist($str)
    {
        foreach ($this->artists as $value) {
            if($value['name'] == $str)
            {
                return $value;
                break;
            }
        }
    }

    public function findAlbum($str, $art)
    {
        foreach ($this->albums as $value) {
            if($value['name'] == $str && $value['artist']['name'] == $art)
            {
                return $value;
                break;
            }
        }
    }

    public function findTrack($str, $art)
    {
        foreach ($this->musics as $value) {
            if($value['name'] == $str && $value['artist']['name'] == $art)
            {
                return $value;
                break;
            }
        }
    }

    public function getBio($artist)
    {
        $artistInfo = $this->artistApi->getInfo(array("artist" => $artist));

        return $artistInfo['bio'];
    }  

    // Funções auxiliares

    public function removeWeeksBeforeDate($array = array(), $date, $id)
    {
        $date   = str_replace("/", "-", str_replace(".", "-", $date)); 
        $array  = (array) $array;
        $array  = array_reverse($array);
        $date   = new \DateTime($date);
        if(isset($id))
        {
            if($id == 38 || $id == 258 || $id > 274)
            {
                $date->modify("+1 day");
            }
        }
        $date   = $date->format("U");
        $final  = array();
        foreach ($array as $value) {
            if($value['to'] <= $date)
            {
                break;
            }
            $final[] = $value;
        }

        return $final;
    }

    public function search($type, $str)
    {
        switch ($type) {
            case 'artist':
                $array = array("artist" => $str);
                return $this->artistApi->search($array);
                break;

            case 'album':
                $array = array("album" => $str);
                return $this->albumApi->search($array);
                break;
            
            default:
                $array = array("track" => $str);
                return $this->trackApi->search($array);
                break;
        }
    }
}
?>