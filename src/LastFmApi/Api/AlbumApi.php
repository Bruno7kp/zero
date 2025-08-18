<?php

namespace LastFmApi\Api;

use SimpleXMLElement;

/**
 * File that stores api calls for album api calls
 * @package apicalls
 */

/**
 * Allows access to the api requests relating to albums
 */
class AlbumApi extends BaseApi
{

    /**
     * Tag an album using a list of user supplied tags. (Requires full auth)
     * @param array $methodVars An array with the following required values: <i>album</i>, <i>artist</i>, <i>tags</i>
     * @return boolean
     */
    public function addTags($methodVars)
    {
        // Only allow full authed calls
        if ($this->getFullAuth() === true) {
            // Check for required variables
            if (!empty($methodVars['album']) && !empty($methodVars['artist']) && !empty($methodVars['tags'])) {
                // If the tags variables is an array build a CS list
                if (is_array($methodVars['tags'])) {
                    $tags = '';
                    foreach ($methodVars['tags'] as $tag) {
                        $tags .= $tag . ',';
                    }
                    $tags = substr($tags, 0, -1);
                } else {
                    $tags = $methodVars['tags'];
                }
                $methodVars['tags'] = $tags;

                // Set the call variables
                $vars = array(
                    'method' => 'album.addtags',
                    'api_key' => $this->getAuth()->apiKey,
                    'sk' => $this->getAuth()->sessionKey
                );
                $vars = array_merge($vars, $methodVars);

                // Generate a call signiture
                $sig = $this->apiSig($this->getAuth()->secret, $vars);
                $vars['api_sig'] = $sig;

                // Do the call and check for errors
                if ($call = $this->apiPostCall($vars)) {
                    // If none return true
                    return true;
                } else {
                    // If there is return false
                    return false;
                }
            } else {
                // Give a 91 error if incorrect variables are used
                $this->handleError(91, 'You must include album, artist and tags varialbes in the call for this method');
                return false;
            }
        } else {
            // Give a 92 error if not fully authed
            $this->handleError(92, 'Method requires full auth. Call auth.getSession using lastfmApiAuth class');
            return false;
        }
    }

    /**
     * Get the metadata for an album on Last.fm using the album name or a musicbrainz id
     * @param array $methodVars An array with the following required values: <i>album</i> and optional values: <i>artist</i>, <i>mbid</i>
     * @return array
     */
    public function getInfo($methodVars)
    {
        // Set the call variables
        $vars = array(
            'method' => 'album.getinfo',
            'api_key' => $this->getAuth()->apiKey
        );
        $vars = array_merge($vars, $methodVars);

        $info = array();
        $i = 0;
        if ($call = $this->apiGetCall($vars)) {
            //var_dump($call);
            if(isset($call->album))
            {
                $a = (array)$call->album;
                $image[0] = (array) $call->album->image[0];
                $image[1] = (array) $call->album->image[1];
                $image[2] = (array) $call->album->image[2];
                $image[3] = (array) $call->album->image[3];
                $image[4] = (array) $call->album->image[4];
                $info['name'] = (string) $call->album->name;
                $info['artist'] = (string) $call->album->artist;
                //$info['lastfmid'] = (string) $call->album->id;

                $info['mbid'] = isset($call->album->mbid) ? (string) $call->album->mbid : "";
                $info['url'] = (string) $call->album->url;
                //$info['releasedate'] = strtotime(trim((string) $call->album->releasedate));
                $info['userplaycount'] = isset($call->album->userplaycount) ? (string) $call->album->userplaycount : 0;
                $info['images']['small'] = (string) $image[0]["#text"];
                $info['images']['medium'] = (string) $image[1]["#text"];
                $info['images']['large'] = (string) $image[2]["#text"];
                $info['images']['extralarge'] = (string) $image[3]["#text"];
                $info['images']['mega'] = (string) $image[4]["#text"];
                $info['listeners'] = (string) $call->album->listeners;
                $info['playcount'] = (string) $call->album->playcount;
                if (isset($call->album->tags) && isset($call->album->tags->tag) && ia_array($call->album->tags->tag)) {
                    foreach ($call->album->tags->tag as $tags) {
                        $info['toptags'][$i]['name'] = (string) $tags->name;
                        $info['toptags'][$i]['url'] = (string) $tags->url;
                        $i++;
                    }
                }
                $i = 0;
                if (isset($call->album->tracks) && isset($call->album->tracks->track) && ia_array($call->album->tracks->track)) {
                    foreach ($call->album->tracks->track as $track) {
                        $info['tracks'][$i]['name'] = isset($track->name) ? (string) $track->name : '';
                        $info['tracks'][$i]['url'] = isset($track->url) ? (string) $track->url : '';
                        $info['tracks'][$i]['duration'] = isset($track->duration) ? (string) $track->duration : '';
                        $info['tracks'][$i]['artist'] = array();
                        if (isset($track->artist)) {
                            $info['tracks'][$i]['artist']['name'] = isset($track->artist->name) ? (string) $track->artist->name : '';
                            $info['tracks'][$i]['artist']['mbid'] = isset($track->artist->mbid) ? (string) $track->artist->mbid : '';
                            $info['tracks'][$i]['artist']['url'] = isset($track->artist->url) ? (string) $track->artist->url : '';
                        } else {
                            $info['tracks'][$i]['artist']['name'] = '';
                            $info['tracks'][$i]['artist']['mbid'] = '';
                            $info['tracks'][$i]['artist']['url'] = '';
                        }
                        $i++;
                    }
                }
                // $info['wiki'] = array(
                //     'summary' => (string) $call->album->wiki->summary,
                //     'content' => (string) $call->album->wiki->content
                // );

                return $info;
            }
            else
            {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Get the tags applied by an individual user to an album on Last.fm
     * @param array $methodVars An array with the following required values: <i>album</i>, <i>artist</i>
     * @return array
     */
    public function getTags($methodVars)
    {
        // Only allow full authed calls
        if ($this->getFullAuth() === true) {
            // Check for required variables
            if (!empty($methodVars['album']) && !empty($methodVars['artist'])) {
                // Set the variables
                $vars = array(
                    'method' => 'album.gettags',
                    'api_key' => $this->getAuth()->apiKey,
                    'sk' => $this->getAuth()->sessionKey
                );
                $vars = array_merge($vars, $methodVars);

                // Generate a call signiture
                $sig = $this->apiSig($this->getAuth()->secret, $vars);
                $vars['api_sig'] = $sig;

                $tags = array();
                // Make the call
                if ($call = $this->apiGetCall($vars)) {
                    if (count($call->tags->tag) > 0) {
                        $i = 0;
                        foreach ($call->tags->tag as $tag) {
                            $tags[$i]['name'] = (string) $tag->name;
                            $tags[$i]['url'] = (string) $tag->url;
                            $i++;
                        }

                        return $tags;
                    } else {
                        $this->handleError(90, 'User has no tags for this artist');
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                // Give a 91 error if incorrect variables are used
                $this->handleError(91, 'You must include album and artist varialbes in the call for this method');
                return false;
            }
        } else {
            // Give a 92 error if not fully authed
            $this->handleError(92, 'Method requires full auth. Call auth.getSession using lastfmApiAuth class');
            return false;
        }
    }

    /**
     * Remove a user's tag from an album. (Requires full auth)
     * @param array $methodVars An array with the following required values: <i>album</i>, <i>artist</i>, <i>tag</i>
     * @return boolean
     */
    public function removeTag($methodVars)
    {
        // Only allow full authed calls
        if ($this->getFullAuth() === true) {
            // Check for required variables
            if (!empty($methodVars['album']) && !empty($methodVars['artist']) && !empty($methodVars['tag'])) {
                // Set the variables
                $vars = array(
                    'method' => 'album.removetag',
                    'api_key' => $this->getAuth()->apiKey,
                    'sk' => $this->getAuth()->sessionKey
                );
                $vars = array_merge($vars, $methodVars);

                // Generate a call signature
                $sig = $this->apiSig($this->getAuth()->secret, $vars);
                $vars['api_sig'] = $sig;

                // Do the call
                if ($call = $this->apiPostCall($vars)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                // Give a 91 error if incorrect variables are used
                $this->handleError(91, 'You must include album, artist and tag varialbes in the call for this method');
                return false;
            }
        } else {
            // Give a 92 error if not fully authed
            $this->handleError(92, 'Method requires full auth. Call auth.getSession using lastfmApiAuth class');
            return false;
        }
    }

    /**
     * Search for an album by name. Returns album matches sorted by relevance
     * @param array $methodVars An array with the following required values: <i>album</i>
     * @return array
     */
    public function search($methodVars)
    {
        // Check for required variables
        if (!empty($methodVars['album'])) {
            $vars = array(
                'method' => 'album.search',
                'api_key' => $this->auth->apiKey
            );
            $vars = array_merge($vars, $methodVars);

            $searchresults = array();
            if ($call = $this->apiGetCall($vars)) {
                    $i = 0;
                    foreach ($call->results->albummatches->album as $album) {
                        $searchresults[$i]['name'] = (string) $album->name;
                        $searchresults[$i]['artist'] = (string) $album->artist;
                        //$searchresults[$i]['id'] = (string) $album->id;
                        $searchresults[$i]['url'] = (string) $album->url;
                        //$searchresults[$i]['streamable'] = (string) $album->streamable;
                        $img = (array) $album->image[1];
                        $searchresults[$i]['image'] = (string) $img["#text"];
                        $i++;
                    }

                    return $searchresults;
            } else {
                return false;
            }
        } else {
            // Give a 91 error if incorrect variables are used
            $this->handleError(91, 'You must include album varialbe in the call for this method');
            return false;
        }
    }

}
