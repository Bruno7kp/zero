<?php

namespace LastFmApi\Api;

/**
 * File that stores api calls for getting authentication values
 */

/**
 * Allows access to the api requests relating to authentication
 */
class AuthApi extends BaseApi
{

    /**
     * Stores the api key
     * @access public
     * @var string
     */
    public $apiKey;

    /**
     * Stores the secret
     * @access public
     * @var string
     */
    public $secret;

    /**
     * Stores the authenticated username
     * @access public
     * @var string
     */
    public $username;

    /**
     * Stores the session key
     * @access public
     * @var string
     */
    public $sessionKey;

    /**
     * Stores the users subscriber status
     * @access public
     * @var boolean
     */
    public $subscriber;

    /**
     * Stores the authentication token
     * @access private
     * @var string
     */
    public $token;

    /**
     * Run when the class is created
     * @param string $method <i>getsession</i> to get a new session, <i>setsession</i> to set a current session
     * @param array $vars An array of variables to pass to the class
     * @return void
     * @access public
     */
    public function __construct($method, $vars)
    {
        if ($method == 'getsession') {
            if (!empty($vars['apiKey']) && !empty($vars['secret']) && !empty($vars['token'])) {
                $this->apiKey = $vars['apiKey'];
                $this->secret = $vars['secret'];
                $this->token = $vars['token'];
                $this->getSession();
            } else {
                $this->handleError(91, 'Must send an apiKey, token and a secret in the call for getsession');
                return false;
            }
        } elseif ($method == 'gettoken') {
            if (!empty($vars['apiKey']) && !empty($vars['secret'])) {
                $this->apiKey = $vars['apiKey'];
                $this->secret = $vars['secret'];
                $this->getToken();
            } else {
                $this->handleError(91, 'Must send an apiKey and a secret in the call for gettoken');
                return false;
            }
        } elseif ($method == 'setsession') {
            if (!empty($vars['apiKey'])) {
                $this->apiKey = $vars['apiKey'];
                if(!empty($vars['secret']))
                {
                    $this->secret = $vars['secret'];
                }
                if (!empty($vars['secret']) && !empty($vars['username']) && !empty($vars['sessionKey']) && isset($vars['subscriber'])) {
                    $this->username = $vars['username'];
                    $this->sessionKey = $vars['sessionKey'];
                    $this->subscriber = $vars['subscriber'];
                }
            } else {
                $this->handleError(91, 'Must send an apiKey, secret, usernamne, subcriber and sessionKey in the call for setsession');
                return false;
            }
        } else {
            $this->handleError(91, 'Incorrect use of method variable ("getsession" or "setsession")');
            return false;
        }
    }

    /**
     * Internal method uses to get a new session via an api call
     * @return void
     * @access private
     */
    private function getSession()
    {
        $vars = array(
            'method' => 'auth.getsession',
            'api_key' => $this->apiKey,
            'token' => $this->token
        );
        $sig = $this->apiSig($this->secret, $vars);
        $vars['api_sig'] = $sig;

        if ($call = $this->apiGetCall($vars)) {
            $this->username = (string) $call->session->name;
            $this->sessionKey = (string) $call->session->key;
            $this->subscriber = (string) $call->session->subscriber;
        } else {
            return false;
        }
    }

    /**
     * Internal method uses to get a new token via an api call
     * @return void
     * @access private
     */
    private function getToken()
    {
        $vars = array(
            'method' => 'auth.gettoken',
            'api_key' => $this->apiKey
        );

        $sig = $this->apiSig($this->secret, $vars);
        $vars['api_sig'] = $sig;

        if ($call = $this->apiGetCall($vars)) {
            $this->token = (string) $call->token;
        } else {
            return false;
        }
    }

}
