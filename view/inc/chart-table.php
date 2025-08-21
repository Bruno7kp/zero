<?php

use B7KP\Entity\Settings;
use B7KP\Library\Lang;
use B7KP\Library\Route;
use B7KP\Library\Url;
use LastFmApi\Main\LastFm;
use B7KP\Utils\Constants as C;
use B7KP\Utils\Certified;
use B7KP\Utils\Functions;
use B7KP\Utils\Snippets as S;

if ($settings instanceof Settings) {
    isset($settings->style) ? $this->setCssFile($settings->style) : "";
} else {
    $settings = new Settings();
}
//$style 				= $this->getCssContent();
$js = $this->getMainContent();
$show_images = $settings->show_images;
$show_dropouts = $settings->show_dropouts;
$show_first_image = $settings->show_first_image;
$show_playcounts = $settings->show_playcounts;
$show_move = $settings->show_move;
$show_times = $settings->show_times;
$show_plaque = $settings->show_plaque;
$show_wkl_cert = $settings->show_wkl_cert;
$show_cert = $settings->show_cert;
$cert_type = $settings->cert_type;
$subs = substr($type, 0, 3) . "_limit";
$limit = $settings->$subs;
$new_certs = array();

//echo $style;
echo $js;
if ($show_first_image && count($list) > 0) {
    $first = $list[0]['item'];
    $get = "get" . ucfirst($type) . "Info";
    $lfm = new LastFM();
    if ($type == "artist") {
        $f = $lfm->$get($first->$type);
    } else {
        $t = substr($type, 0, 3) . "_mbid";
        $f = $lfm->$get($first->$type, $first->artist, $first->$t);
    }
    if ($type == "music") {
        $fa = $lfm->getArtistInfo($f["artist"]["name"]);
        $fimg = $fa["images"]["large"];
    } else {
        $fimg = $f["images"]["large"];
    }

    if ($type == "album") {
	    echo "<div class='text-center bottomspace-xl'><img src='" . $fimg . "'/></div>";
    } else {
	    echo "<div class='text-center bottomspace-xl'><img height='174' src='/web/img/default-art.png' data-spotify-artist='".htmlentities($first->artist, ENT_QUOTES)."'/></div>";
    }

}
$lastw = array();
if ($show_dropouts && $week > 1) {
    $weekbefore = $week - 1;
    $cond = array("week" => $weekbefore, "iduser" => $this->user->id);
    $lastweek = $this->factory->find("B7KP\Entity\Week", $cond);
    if (count($lastweek) > 0) {
        $lastweek = $lastweek[0];
        $lastw = $this->getWeeklyCharts($lastweek, $type, $limit);
    } else {
        $show_dropouts = false;
    }
}
?>
<table class="chart-table table-fluid topspace-md">
    <tr>
        <th class="cr-col min center">+</th>
        <th class="center"><?php echo Lang::get('rk'); ?></th>
        <?php if ($show_images): ?>
            <th class="center">Img</th>
            <?php ; endif; ?>
        <?php if ($type != "artist"): ?>
            <th><?php echo Lang::get('title'); ?></th>
            <?php ; endif; ?>
        <th><?php echo Lang::get('art') ?></th>
        <?php if ($show_playcounts): ?>
            <th class="center"><?php echo Lang::get('play_x') ?></th>
            <?php ; endif; ?>
        <th class="center"><?php echo Lang::get('pk') ?></th>
        <th class="center"><?php echo Lang::get('wk_x') ?></th>
    </tr>
    <?php
    //var_dump($lastw);
    if (!isset($list) || !is_array($list) || count($list) == 0) {
        $list = array();
        echo "<tr><td colspan='10'>" . Lang::get('nodata_week') . "</td></tr>";
    } else {
        foreach ($list as $value) {
            $todate = $value["stats"]["stats"]["todate"];
            $stats = $value["stats"]["chartrun"][$week];
            $cr = $value["stats"]["chartrun"];
            $item = $value["item"];
            $cp_todate = $todate["overall"]["chartpoints"];

            if ($show_dropouts) {
                $thembid = substr($type, 0, 3) . "_mbid";

                foreach ($lastw as $k => $v) {
                    if (!empty($v["item"]->$thembid) && $v["item"]->$thembid == $item->$thembid) {
                        unset($lastw[$k]);
                        break;
                    } else {
                        if ($type == "artist") {
                            if ($v["item"]->artist == $item->artist) {
                                unset($lastw[$k]);
                                break;
                            }
                        } else {
                            if ($v["item"]->artist == $item->artist && mb_strtolower($v["item"]->$type) == mb_strtolower($item->$type)) {
                                unset($lastw[$k]);
                                break;
                            }
                        }
                    }
                }
            }
            // vars
            $position = $stats["rank"]["rank"];
            $move = S::getMove($show_move, $stats["rank"]["move"], $stats["rank"]["lw"]);
            $moveclass = S::getMoveClass($show_move, $move, $position, true);
            $name = $item->$type;
            $artist = $item->artist;
            $plays = $stats["playcount"]["playcount"];
            $playsmove = S::getMove($show_move, $stats["playcount"]["move"], $stats["playcount"]["lw"], true);
            $pmclass = S::getMoveClass($show_move, $playsmove, $plays, false);
            $playsmove = C::SHOW_MOVE_LW == $show_move ? "<span class='black'>LW:</span> " . $playsmove : $playsmove;
            $move = C::SHOW_MOVE_LW == $show_move ? "<span class='black'>LW:</span> " . $move : $move;
            if (intval($move) > 0): $move = "+" . $move; endif;
            if (intval($playsmove) > 0): $playsmove = "+" . $playsmove; endif;
            $totalweeks = $todate["weeks"]["total"];
            $wkstop1 = $todate["weeks"]["top01"];
            $wkstop5 = $todate["weeks"]["top05"];
            $wkstop10 = $todate["weeks"]["top10"];
            $wkstop20 = $todate["weeks"]["top20"];
            $peak = $todate["overall"]["peak"];
            $t = substr($type, 0, 3) . "_mbid";
            $mbid = $item->$t;

            # new certs

            if ($show_cert && $show_wkl_cert && $type != "artist" && $cert_type == "1") {
                $certified = new Certified($this->user, $this->factory);
                $cert_todate = $certified->getCertification($type, $cp_todate);
                $cert_tolw = $certified->getCertification($type, ($cp_todate - (100 - (($position - 1) * 2))));
                $comp_tw = $certified->getValueByArray($type, $cert_todate);
                $comp_lw = $certified->getValueByArray($type, $cert_tolw);
                if ($comp_lw != $comp_tw) {
                    $cert_new = $certified->getCertification($type, $cp_todate, "text+icon");
                    $class_new = $certified->getCertification($type, $cp_todate, "class");
                    $new_certs[] = array(
                        "name" => $name,
                        "artist" => $artist,
                        "points" => $cp_todate,
                        "certified" => $cert_new,
                        "class" => $class_new,
                        "cert_text" => $certified->getCertification($type, $cp_todate, "text"),
                        "cert_value" => $certified->getValueByCert($type, $cp_todate),
                        "disc" => $certified->getCertification($type, $cp_todate, "image"),
                    );
                }
            }
            ?>
            <tr>
                <span style="display: none" id="<?php echo md5($name . $artist); ?>" class="loadplaycount"
                      data-type="<?php echo $type; ?>" data-login="<?php echo $this->user->login; ?>"
                      data-name="<?php echo htmlentities($name, ENT_QUOTES); ?>"
                      data-artist="<?php echo htmlentities($artist, ENT_QUOTES); ?>"></span>
                <td class="cr-col min">
                    <a class="cr-icon"><i class="ti-stats-up"></i></a>
                </td>
                <td class='rk-col'>
                    <?php echo $position; ?>
                    <br/>
                    <span class="<?php echo $moveclass; ?>"><?php echo $move; ?></span>
                </td>
                <?php if ($show_images): ?>
                    <td class="text-center" data-i="<?php echo md5($name . $artist); ?>">
                        <img width="64" src="<?php echo Url::getBaseUrl() . "/web/img/default-alb.png"; ?>"/>
                    </td>
                    <?php ; endif; ?>
                <td class="left"><?php echo $name; ?></td>
                <?php
                if ($type != "artist") {
                    ?>
                    <td class="left"><?php echo $artist; ?></td>
                    <?php
                }
                if ($show_playcounts) {
                    ?>
                    <td class='rk-col'>
                        <?php echo $plays; ?>
                        <br/>
                        <span class="<?php echo $pmclass; ?>"><?php echo $playsmove; ?></span>
                    </td>
                    <?php
                }
                ?>
                <?php
                $sp = "";
                if ($peak == 1):
                    $sp = "rk-sp";
                endif;
                $timespk = $todate["rank"][$peak]
                ?>
                <td class='rk-col <?php echo $sp; ?>'><?php echo $peak; ?>
                    <?php
                    if ($show_times) {
                        ?>
                        <br><span class='black'><?php echo $timespk . "x" ?></span>
                        <?php
                    }
                    ?>
                </td>
                <td class='rk-col'><?php echo $totalweeks; ?></td>
            </tr>
            <tr style="display:none;" class="cr-row">
                <td colspan="10">
                    <?php
                    echo S::chartRun($type, $cr, $this->user, $todate, $limit, $name, $artist);
                    ?>
                </td>
            </tr>
            <?php
        }
    }
    ?>
    <?php
    if ($show_dropouts && isset($lastw) && count($lastw) > 0) {
        ?>
        <tr>
            <th colspan="10">
                <small class="topspace-lg"><?php echo Lang::get('dropouts'); ?></small>
            </th>
        </tr>
        <?php
        foreach ($lastw as $dropk => $dropv) {
            $dropitem = $dropv["item"];
            $name = $dropitem->$type;
            $artist = $dropitem->artist;
            $mbid = "";
            $todate = $dropv["stats"]["stats"]["todate"];
            $stats = $dropv["stats"]["chartrun"][$week - 1];
            $cr = $dropv["stats"]["chartrun"];
            $position = $stats["rank"]["rank"];
            $plays = $stats["playcount"]["playcount"];
            $totalweeks = $todate["weeks"]["total"];
            $wkstop1 = $todate["weeks"]["top01"];
            $wkstop5 = $todate["weeks"]["top05"];
            $wkstop10 = $todate["weeks"]["top10"];
            $wkstop20 = $todate["weeks"]["top20"];
            $peak = $todate["overall"]["peak"];
            ?>
            <tr class="drops">
                <span style="display: none" id="<?php echo md5($name . $artist); ?>" class="loadplaycount"
                      data-type="<?php echo $type; ?>" data-login="<?php echo $this->user->login; ?>"
                      data-name="<?php echo htmlentities($name, ENT_QUOTES); ?>"
                      data-artist="<?php echo htmlentities($artist, ENT_QUOTES); ?>"></span>
                <td class="cr-col min">
                    <a class="cr-icon"><i class="ti-stats-up"></i></a>
                </td>
                <td>
                    <?php echo strtoupper(Lang::get('out')); ?>
                    <br/>
                    <small>LW: <?php echo $position; ?></small>
                </td>
                <?php if ($show_images): ?>
                    <td class="text-center" data-i="<?php echo md5($name . $artist); ?>"><img width="32"
                                                                                              src="<?php echo Url::getBaseUrl() . "/web/img/default-alb.png"; ?>"/>
                    </td>
                    <?php ; endif; ?>
                <td class="left"><?php echo $name; ?></td>
                <?php
                if ($type != "artist") {
                    ?>
                    <td class="left"><?php echo $artist; ?></td>
                    <?php
                }
                if ($show_playcounts) {
                    ?>
                    <td>
                        <?php echo strtoupper(Lang::get('out')); ?>
                        <br/>
                        <small>LW: <?php echo $plays; ?></small>
                    </td>
                    <?php
                }
                ?>
                <td><?php echo $peak; ?></td>
                <td><?php echo $totalweeks; ?></td>
            </tr>
            <tr style="display:none;" class="cr-row">
                <td colspan="10">
                    <?php
                    echo S::chartRun($type, $cr, $this->user, $todate, $limit, $name, $artist);
                    ?>
                </td>
            </tr>
            <?php
        }
    }
    ?>
    <?php
    if ($show_wkl_cert) {
        if ($cert_type != "1") {
            $new_certs = array();
            $certified = new Certified($this->user, $this->factory);
            foreach ($list as $certItem) {
                $plaque = $certified->getPlaque($type, $certItem["item"]->$type, $certItem["item"]->artist);
                $plaque = isset($plaque[0]) ? $plaque[0] : false;
                //$plaque = false;
                $certItemPoints = $cert_type == "0" ? 0 : $certItem["stats"]["stats"]["alltime"]["overall"]["chartpoints"];
                $new_certs[] = array(
                    "name" => $certItem["item"]->$type,
                    "artist" => $certItem["item"]->artist,
                    "points" => $certItemPoints,
                    "certified" => "",
                    "class" => "hide",
                    "last_plaque" => $plaque,
                    "cert_text" => "",
                    "cert_value" => 0,
                    "disc" => ""
                );
            }
        }
        if (count($new_certs) > 0) {
            $new_cert_title = Lang::get('new_certs');
            $cert_type_text = Lang::get("pt_x");
            if ($cert_type == "0") {
                $new_cert_title = Lang::get('cert_o') . " (" . Lang::get("play_x") . ") " . Lang::get("cert_note");
                $cert_type_text = Lang::get("pt_x");
            } else if ($cert_type == "2") {
                $new_cert_title = Lang::get('cert_o') . " (" . Lang::get("both_x") . ") " . Lang::get("cert_note");
                $cert_type_text = Lang::get("pt_x");
            }
            ?>
            <tr data-cert-header <?php if($cert_type != "1"){ ?>class="hide"<?php } ?>>
                <th colspan="10">
                    <small class="topspace-lg"><?php echo $new_cert_title; ?></small>
                </th>
            </tr>

            <?php
            usort($new_certs, function ($a, $b) {
                return $b['points'] - $a['points'];
            });
            foreach ($new_certs as $key => $value) {
                $name = $value["name"];
                $artist = $value["artist"];
                $points = $value["points"];
                $certified = $value["certified"];
                $class = $value["class"];
                $disc = $value["disc"];
                $cert_value = $value["cert_value"];
                $cert_text = $value["cert_text"];
                $mbid = "";
                $lastPlaque = 0;
                if (isset($value["last_plaque"]) && $value["last_plaque"] instanceof \B7KP\Entity\Plaque) {
                    $lastPlaque = $value["last_plaque"]->certified;
                }
                ?>
                <tr class="new-certs <?php echo $class; ?>" data-plaque="<?php echo htmlentities($lastPlaque); ?>"
                    data-class="<?php echo md5($name . $artist); ?>">
                    <td><a target="_blank"
                           href="<?php echo Route::url("lib_" . substr($type, 0, 3), array("name" => Functions::fixLFM($name), "artist" => Functions::fixLFM($artist), "login" => $this->user->login)); ?>"><i
                                    class="ti-new-window"></i></a></td>
                    <td <?php if ($cert_type != "1") { ?>
                        data-p="<?php echo $points; ?>" data-c="<?php echo md5($name . $artist); ?>"
                        <?php if($cert_type == "2") { $wname = substr($type, 0, 3); ?> data-w-pl='<?php echo $settings->{"weight_".$wname."_pls"};?>' data-w-pt='<?php echo $settings->{"weight_".$wname."_pts"};?>' <?php } ?>
                    <?php } ?>>

                        <?php echo $certified; ?>
                    </td>
                    <?php
                    if ($show_images) {
                        ?>
                        <td class="text-center" data-i="<?php echo md5($name . $artist); ?>">
                            <img width="32" src="<?php echo Url::getBaseUrl() . "/web/img/default-alb.png"; ?>"/>
                        </td>
                        <?php
                    }
                    ?>
                    <td class="left">
                        <?php echo $name; ?>
                    </td>
                    <td class="left"><?php echo $artist; ?></td>
                    <?php if ($cert_type == "1") { ?>
                        <td><?php echo $points . " " . Lang::get("pt_x"); ?></td>
                    <?php } else { ?>
                        <td data-p="<?php echo $points; ?>" data-pp="<?php echo md5($name . $artist); ?>"
                            <?php if($cert_type == "2") { $wname = substr($type, 0, 3); ?> data-w-pl='<?php echo $settings->{"weight_".$wname."_pls"};?>' data-w-pt='<?php echo $settings->{"weight_".$wname."_pts"};?>' <?php } ?>
                        ></td>
                    <?php } ?>
                    <td colspan="2">
                        <?php
                        if ($show_plaque && $this->user->checkSelfPermission($this->factory)) {
                            ?>
                            <button class="btn no-margin btn-custom btn-info btn-sm"
                                    data-gen="<?php echo md5($name . $artist); ?>"
                                    data-plaque="default"
                                    data-login="<?php echo $settings->cert_name;?>"
                                    data-type="<?php echo $type; ?>"
                                    data-name="<?php echo htmlentities($name, ENT_QUOTES); ?>"
                                    data-artist="<?php echo htmlentities($artist, ENT_QUOTES); ?>"
                                    data-image=""
                                    data-points="<?php echo $points; ?>"
                                    data-text="<?php echo $cert_text; ?>"
                                    data-disc="<?php echo $disc; ?>"
                                    data-value="<?php echo $cert_value."+ ".mb_strtolower($cert_type_text); ?>"
                                    id="nnewcert<?php echo $key; ?>"><?php echo Lang::get("gen_plaque_alt"); ?></button>
                            <?php
                        }
                        ?>
                    </td>
                </tr>
                <?php
            }
        }
    }
    ?>
</table>
<div style="display:none;">
    <div id="copyme_alt">
        <?php
        $simple = $this->user->login . " :: Top " . Lang::get(substr($type, 0, 3) . "_x") . " - " . Lang::get('wk') . " " . $week . " \n";
        $simple .= Lang::get('rk') . " | " . Lang::get('name') . " | ";
        if ($type != "artist"): $simple .= Lang::get('art') . " | "; endif;
        if ($show_playcounts): $simple .= Lang::get('play_x') . " | "; endif;
        $simple .= Lang::get('pk') . " | " . Lang::get('wk_x') . "\n";

        foreach ($list as $sim => $ple) {
            $todate = $ple["stats"]["stats"]["todate"];
            $stats = $ple["stats"]["chartrun"][$week];
            $cr = $ple["stats"]["chartrun"];
            $item = $ple["item"];
            $position = $stats["rank"]["rank"];
            $move = S::getMove($show_move, $stats["rank"]["move"], $stats["rank"]["lw"]);
            $name = $item->$type;
            $artist = $item->artist;
            $plays = $stats["playcount"]["playcount"];
            $playsmove = S::getMove($show_move, $stats["playcount"]["move"], $stats["playcount"]["lw"], true);
            if (intval($move) > 0 && C::SHOW_MOVE_LW != $show_move): $move = "+" . $move; endif;
            if (intval($playsmove) > 0 && C::SHOW_MOVE_LW != $show_move): $playsmove = "+" . $playsmove; endif;
            $totalweeks = $todate["weeks"]["total"];
            $peak = $todate["overall"]["peak"];

            $simple .= $position . " (" . $move . ") ";
            $simple .= $name . " ";
            if ($type != "artist"): $simple .= "- " . $artist; endif;
            if ($show_playcounts): $simple .= " | " . $plays . " (" . $playsmove . ")"; endif;
            $simple .= " | " . $peak . " | " . $totalweeks . "\n";

        }

        echo $simple;
        ?>
    </div>
</div>