<?php
namespace LastFmApi\Main;

use LastFmApi\Api\AuthApi;
use LastFmApi\Api\ArtistApi;
use LastFmApi\Api\AlbumApi;
use LastFmApi\Api\TrackApi;
use LastFmApi\Api\LibraryApi;
use LastFmApi\Api\UserApi;

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

    public function __construct()
    {
        $this->apiKey = '68d81020be83713df69720b5acdf0a1f';
        $this->secret = 'daf57401387415299a1778da3544ab10';
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
        if(!isset($vars['user']))
        {
            $vars['user'] = $this->userName;
        }
        return $this->userApi->getInfo($vars);
    }

    public function getUserTopArtist($vars = array())
    {
        if(!isset($vars['user']))
        {
            $vars['user'] = $this->userName;
        }
        return $this->userApi->getTopArtists($vars);
    }

    public function getUserTopAlbum($vars = array())
    {
        if(!isset($vars['user']))
        {
            $vars['user'] = $this->userName;
        }
        return $this->userApi->getTopAlbums($vars);
    }

    public function getUserTopMusic($vars = array())
    {
        if(!isset($vars['user']))
        {
            $vars['user'] = $this->userName;
        }
        return $this->userApi->getTopTracks($vars);
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

    public function getWeeklyChartList($vars = array())
    {
        if(!isset($vars['user']))
        {
            $vars['user'] = $this->userName;
        }
        return $this->userApi->getWeeklyChartList($vars); 
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
        $vars = array("artist" => $str, "mbid" => $mbid);
        return $this->artistApi->getInfo($vars);
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

    public function removeWeeksBeforeDate($array = array(), $date)
    {
        $date   = str_replace("/", "-", str_replace(".", "-", $date)); 
        $array  = (array) $array;
        $array  = array_reverse($array);
        $date   = new \DateTime($date);
        $date   = $date->format("U");
        $final  = array();
        foreach ($array as $value) {
            if($value['to'] < $date)
            {
                break;
            }
            $final[] = $value;
        }

        return $final;
    }
}
?>