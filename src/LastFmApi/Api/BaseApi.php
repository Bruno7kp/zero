<?php

namespace LastFmApi\Api;

use LastFmApi\Lib\Socket;
use LastFmApi\Lib\Cache;
use \SimpleXMLElement;

/**
 * File that contains all base methods used by all api calls
 */

/**
 * Stores the methods used by all api calls
 */
class BaseApi
{
    /*
     * Stores error details
     * @access public
     * @var array has two elements: <i>code</i> and <i>desc</i> which stores the error code and description respectivly
     */

    public $error;
    /*
     * Stores the connection status
     * @access public
     * @var boolean
     */
    public $connected;

    /*
     * Stores the host name
     * @access private
     * @var string
     */
    private $host;
    /*
     * Stores the port number
     * @access private
     * @var string
     */
    private $port;
    /*
     * Stores the raw api call response
     * @access private
     * @var string
     */
    private $response;
    /*
     * Stores the socket class
     * @access private
     * @var class
     */
    private $socket;
    /*
     * Stores the cache class
     * @access private
     * @var class
     */
    private $cache;
    /*
     * Stores the config
     * @access private
     * @var class
     */
    protected $config;

    /**
     * Stores the auth variables used in all api calls
     * @var array
     */
    protected $auth;

    /**
     * States if the user has full authentication to use api requests that modify data
     * @var boolean
     */
    protected $fullAuth;

    public function __construct($auth, $config = array())
    {
        $this->config = $config;
        if (empty($this->config)) {
            $this->config = array(
                'enabled' => false
            );
        }

        if (is_object($auth)) {
            if (!empty($auth->apiKey) && !empty($auth->secret) && !empty($auth->username) && !empty($auth->sessionKey) && ($auth->subscriber == 0 || $auth->subscriber == 1)) {
                $this->fullAuth = true;
            } elseif (!empty($auth->apiKey)) {
                $this->fullAuth = false;
            } else {
                $this->handleError(91, 'Invalid auth class was passed to lastfmApi. You need to have at least an apiKey set');
                return false;
            }
            $this->auth = $auth;
        } else {
            $this->handleError(91, 'You need to pass a lastfmApiAuth class as the first variable to this class');
            return false;
        }
    }

    /**
     * 
     * @return boolean
     */
    public function getFullAuth()
    {
        return $this->fullAuth;
    }

    /**
     * 
     * @return array
     */
    public function getConfig()
    {
        return $this->config;
    }

    /**
     * 
     * @return array
     */
    public function getAuth()
    {
        return $this->auth;
    }

    /*
     * Used to return the correct package to allow access to the api calls for that package
     * @deprecated
     * @access public
     * @return class
     */

    public function getPackage($auth, $package, $config = '')
    {
        if ($config == '') {
            $config = array(
                'enabled' => false
            );
        }

        if (is_object($auth)) {
            if (!empty($auth->apiKey) && !empty($auth->secret) && !empty($auth->username) && !empty($auth->sessionKey) && ($auth->subscriber == 0 || $auth->subscriber == 1)) {
                $fullAuth = 1;
            } elseif (!empty($auth->apiKey)) {
                $fullAuth = 0;
            } else {
                $this->handleError(91, 'Invalid auth class was passed to lastfmApi. You need to have at least an apiKey set');
                return false;
            }
        } else {
            $this->handleError(91, 'You need to pass a lastfmApiAuth class as the first variable to this class');
            return false;
        }

        if ($package == 'album' || $package == 'artist' || $package == 'event' || $package == 'geo' || $package == 'group' || $package == 'library' || $package == 'playlist' || $package == 'radio' || $package == 'tag' || $package == 'tasteometer' || $package == 'track' || $package == 'user' || $package == 'venue') {
            $className = 'lastfmApi' . ucfirst($package);
            return new $className($auth, $fullAuth, $config);
        } else {
            $this->handleError(91, 'The package name you past was invalid');
            return false;
        }
    }

    /*
     * Setup the socket to get the raw api call return
     * @access private
     * @return boolean
     */

    private function setup()
    {
        $this->host = 'ws.audioscrobbler.com';
        $this->port = 80;
        $this->connected = 0;

        $this->socket = new Socket($this->host, $this->port);
        if (!$this->socket->error_number && !$this->socket->error_string) {
            $this->connected = 1;
            return true;
        } else {
            $this->handleError(99, $this->socket->error_string);
            return false;
        }
    }

    /*
     * Turns the raw response into an xml object
     * @access private
     * @return object
     */

    private function process_response()
    {
        $end = false;
        $resp = "";
        for ($i=11; $end == false; $i++) { 
            if(isset($this->response[$i])){
                $resp .= $this->response[$i];
            }
            else
            {
                $end = true;
            }
        }
        return json_decode($resp);
    }

    /*
     * Used in api calls that do not require write access. Returns an xml object
     * @access protected
     * @return object
     */

    protected function apiGetCall($vars)
    {
        $this->setup();
        if ($this->connected == 1) {
            $this->cache = new Cache($this->config);
            if (!empty($this->cache->error)) {
                $this->handleError(96, $this->cache->error);
                return false;
            } else {
                if ($cache = $this->cache->get($vars)) {
                    // Cache exists
                    $this->response = $cache;
                } else {
                    // Cache doesnt exist
                    $url = '/2.0/?';
                    foreach ($vars as $name => $value) {
                        $url .= trim(urlencode($name)) . '=' . trim(urlencode($value)) . '&';
                    }
                    $url = substr($url, 0, -1);
                    $url = str_replace(' ', '%20', $url);
                    $url .= "&format=json";

                    $out = "GET " . $url . " HTTP/1.0\r\n";
                    $out .= "Host: " . $this->host . "\r\n";
                    $out .= "\r\n";
                    $this->response = $this->socket->send($out, 'array');
                    $this->cache->set($vars, $this->response);
                }

                return $this->process_response();
            }
        } else {
            return false;
        }
    }

    /*
     * Used in api calls that require write access. Returns an xml object
     * @access protected
     * @return object
     */

    protected function apiPostCall($vars, $return = 'bool')
    {
        $this->setup();
        if ($this->connected == 1) {
            $url = '/2.0/';

            $data = '';
            foreach ($vars as $name => $value) {
                $data .= trim($name) . '=' . trim(urlencode($value)) . '&';
            }
            $data = substr($data, 0, -1);

            $out = "POST " . $url . " HTTP/1.1\r\n";
            $out .= "Host: " . $this->host . "\r\n";
            $out .= "Content-Length: " . strlen($data) . "\r\n";
            $out .= "Content-Type: application/x-www-form-urlencoded\r\n";
            $out .= "\r\n";
            $out .= $data . "\r\n";
            $this->response = $this->socket->send($out, 'array');

            return $this->process_response();
        } else {
            return false;
        }
    }

    /*
     * Processes and error and writes to the public variable $error
     * @access protected
     * @return void
     */

    protected function handleError($error = '', $customDesc = '')
    {
        if (!empty($error) && is_object($error)) {
            // Fail with error code
            $this->error['code'] = $error['code'];
            $this->error['desc'] = $error;
        } elseif (!empty($error) && is_numeric($error)) {
            // Fail with custom error code
            $this->error['code'] = $error;
            $this->error['desc'] = $customDesc;
        } else {
            //Hard failure
            $this->error['code'] = 0;
            $this->error['desc'] = 'Unknown error';
        }
    }

    /*
     * Generates the api signature for use in api calls that require write access
     * @access protected
     * @return string
     */

    protected function apiSig($secret, $vars)
    {
        ksort($vars);

        $sig = '';
        foreach ($vars as $name => $value) {
            $sig .= $name . $value;
        }
        $sig .= $secret;
        $sig = md5($sig);

        return $sig;
    }

}
