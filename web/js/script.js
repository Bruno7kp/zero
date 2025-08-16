$(document).ready(function () {
    initialize();
});

function initialize() {
    updateAction();
    updateYecAction();
    formSubmit();
    routesFns();
    copyChart();
    sortTable();
    generatePlaque();
    removePlaque();
    urlSelector();
    btnCertShow();
    resetAcc();
    tipUp();
    grid();
    friendControl();
}

function friendControl() {
    $(".add_friend").click(function (event) {
        event.stopImmediatePropagation();
        idfriend = $(this).attr('data-id');
        this_btn = $(this);
        this_div = $(this).parent();
        $.ajax({
            url: baseUrl + '/check/add_friend/' + idfriend,
            dataType: 'json'
        })
            .done(function (data) {
                showAlert(data.error, data.msg);
                if (data.btn) {
                    this_div.html(data.btn);
                    tipUp();
                    friendControl();
                }
                console.log("success");
            })
            .fail(function () {
                console.log("error");
                showAlert(1, getMsg("error"));
            })
            .always(function () {
                console.log("complete");
            });
    });

    $(".remove_friend").click(function (event) {
        event.stopImmediatePropagation();
        if (confirm(getMsg("sure"))) {
            idfriend = $(this).attr('data-id');
            this_btn = $(this);
            this_div = $(this).parent();
            $.ajax({
                url: baseUrl + '/check/remove_friend/' + idfriend,
                dataType: 'json'
            })
                .done(function (data) {
                    showAlert(data.error, data.msg);
                    if (data.btn) {
                        this_div.html(data.btn);
                        tipUp();
                        friendControl();
                    }
                    console.log("success");
                })
                .fail(function () {
                    console.log("error");
                    showAlert(1, getMsg("error"));
                })
                .always(function () {
                    console.log("complete");
                });
        }
    });
}

function tipUp() {
    $('.tipup').tooltipster({
        theme: 'tooltipster-blue'
    });
}

function grid() {
    $('.grid').masonry({
        itemSelector: '.grid-item', // use a separate class for itemSelector, other than .col-
        columnWidth: '.grid-sizer',
        percentPosition: true
    });
}

function resetAcc() {
    $("#reset_acc").click(function (event) {
        if (confirm(getMsg("sure"))) {
            $.ajax({
                url: baseUrl + '/check/reset',
                dataType: 'json'
            })
                .done(function (data) {
                    showAlert(data.error, data.msg);
                    setTimeout(function () {
                        window.location.reload();
                    }, 3000);
                    console.log("success");
                })
                .fail(function () {
                    console.log("error");
                    showAlert(1, getMsg("error"));
                })
                .always(function () {
                    console.log("complete");
                });

        }
    });

    $("#delete_acc").click(function (event) {
        if (confirm(getMsg("sure"))) {
            $.ajax({
                url: baseUrl + '/check/delete',
                dataType: 'json'
            })
                .done(function (data) {
                    showAlert(data.error, data.msg);
                    setTimeout(function () {
                        window.location.reload();
                    }, 3000);
                    console.log("success");
                })
                .fail(function () {
                    console.log("error");
                    showAlert(1, getMsg("error"));
                })
                .always(function () {
                    console.log("complete");
                });

        }
    });

    $("#reset_plaques").click(function (event) {
        if (confirm(getMsg("sure"))) {
            $.ajax({
                url: baseUrl + '/check/delete_plaques',
                dataType: 'json'
            })
                .done(function (data) {
                    showAlert(data.error, data.msg);
                    setTimeout(function () {
                        window.location.reload();
                    }, 3000);
                    console.log("success");
                })
                .fail(function () {
                    console.log("error");
                    showAlert(1, getMsg("error"));
                })
                .always(function () {
                    console.log("complete");
                });
        }
    });

    $("img[get-user-image]").each(function (index, el) {
        user_img_tag = $(this);
        user_name = user_img_tag.attr('get-user-image');
        get_img_url = 'https://ws.audioscrobbler.com/2.0/?method=user.getinfo&api_key=' + apiKey + '&user=' + user_name + '&format=json';
        $.ajax({
            url: get_img_url,
            dataType: 'json',
            async: false,
        })
            .done(function (data) {
                if (typeof data.user.image[2] != "undefined" && data.user.image[2]["#text"] != "") {
                    user_img_tag.attr('src', data.user.image[2]["#text"]);
                }
                console.log("success");
            })
            .fail(function () {
                console.log("error");
            })
            .always(function () {
                console.log("complete");
            });

    });
}

function btnCertShow() {
    $("#nid").on('click', function (event) {
        event.preventDefault();
        $('.nclass').show();
        $('.uclass').hide();
        $('.wclass').hide();
    });

    $("#uid").on('click', function (event) {
        event.preventDefault();
        $('.nclass').hide();
        $('.uclass').show();
        $('.wclass').hide();
    });

    $("#wid").on('click', function (event) {
        event.preventDefault();
        $('.nclass').hide();
        $('.uclass').hide();
        $('.wclass').show();
    });
}

function urlSelector() {
    $(".urlselector").on('change', function (event) {
        event.preventDefault();
        var url = $(this).val();
        if (url) {
            window.location = url;
        }
        return false;
    });
}

function getMsg(msgid) {
    // eng
    if (lang == 1) {
        array = {};
        array.att = "Updated";
        array.success = "Success";
        array.atting = "Updating";
        array.fail = "Fail";
        array.failload = "Something went wrong while saving some of your data. Please try update again later. :[";
        array.error = "Something went wrong. Try Again later.";
        array.copy = "Chart Copied!";
        array.wait = "Wait";
        array.updatenew = "Update new weeks";
        array.updateall = "Update all";
        array.wksloaded = "of weeks loaded";
        array.finish = "Now you can enjoy your weekly charts :]";
        array.uptodate = "Your charts are up to date :]";
        array.nothingnew = "Look like there's nothing to update for now, come back later.";
        array.sure = "Are you sure?";
        array.newplaque = "Create certification plaque";
        array.newplaque_alt = "Create plaque";
        array.limitplaque = "You can only generate one certificate per day for each album/music";
    }
    // pt
    else {
        array = {};
        array.att = "Atualizado";
        array.success = "Sucesso";
        array.atting = "Atualizando";
        array.fail = "Falha";
        array.failload = "Algo deu errado ao salvar seus dados. Tente novamente. :[";
        array.error = "Algo deu errado. Tente novamente mais tarde.";
        array.copy = "Chart Copiado!";
        array.wait = "Aguarde";
        array.updatenew = "Atualizar novas semanas";
        array.updateall = "Atualizar tudo";
        array.wksloaded = "de semanas carregadas";
        array.finish = "Agora você pode aproveitar seus chart semanais :]";
        array.uptodate = "Seus charts estão atualizados :]";
        array.nothingnew = "Parece que não há nada para atualizar por enquanto, volte mais tarde.";
        array.sure = "Tem certeza?";
        array.newplaque = "Gerar placa de certificado";
        array.newplaque_alt = "Gerar placa";
        array.limitplaque = "Só é possível gerar um certificado por dia para cada álbum/música";
    }

    return array[msgid];
}

function sendToImgur(url, certData, btn) {
    certData.image = url;
    if(!certData.isBase64)
        url = baseUrl + "/" + url;
    //url = 'http://www.skyscrapercity.com/images/headers/9.jpg';
    var ids = ["22de39ba618b7e2", "818ee7e54b3dcf6", "3366c677fd95c95", "fcd9ca28ca485f1"];
    var formData = new FormData();
    if(certData.isBase64){
        url = url.replace('data:image/png;base64,', '');
        formData.append('type', 'data:image/png;base64');
    }
    formData.append('image', url);
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', 'https://api.imgur.com/3/image');
    xhttp.setRequestHeader('Authorization', 'Client-ID ' + ids[(Math.floor(Math.random() * (4)))]);
    xhttp.onreadystatechange = function () {
        if (xhttp.status === 200 && xhttp.readyState === 4) {
            var res = JSON.parse(xhttp.responseText);
            certData.url = res.data.link;
            var newXhttp = new XMLHttpRequest();
            newXhttp.open('POST', baseUrl + "/new/plaque/save");
            newXhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            newXhttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            newXhttp.onreadystatechange = function () {
                if (newXhttp.status === 200 && newXhttp.readyState === 4) {
                    var res = JSON.parse(xhttp.responseText);
                    $.magnificPopup.open({
                        items: {
                            src: certData.url
                        },
                        type: 'image'
                    });
                }
                if (curRoute === "weekly_chart") {
                    undisable_alt(btn, getMsg("newplaque_alt"));
                }
                else {
                    undisable_alt(btn, getMsg("newplaque"));
                }
            };
            newXhttp.send(JSON.stringify(certData));
        }
    };
    xhttp.send(formData);
}

function generateDefaultPlaque() {
    $("[data-plaque=\"default\"]").click(function (event) {
        var btn = $(this);
        disable(btn);
        var certData = {};
        certData.isBase64 = true;
        certData.type = $(this).attr('data-type');
        certData.points = $(this).attr('data-points');
        certData.name = $(this).attr('data-name');
        var originalName = certData.name;
        certData.artist = $(this).attr('data-artist');
        certData.image = $(this).attr('data-image');
        certData.login = $(this).attr('data-login');
        certData.text = $(this).attr('data-text');
        certData.value = $(this).attr('data-value');
        certData.disc = $(this).attr('data-disc');
        if (certData.name.length > 20)
            certData.name = certData.name.substr(0, 20) + "...";

        if (certData.image) {
            var can = document.createElement("canvas");
            can.height = 500;
            can.width = 400;
            var canvas = new fabric.Canvas(can);
            var image = new Image();
            image.crossOrigin = "anonymous";  // This enables CORS
            image.onload = function (event) {
                try {
                    var bgInstance = new fabric.Image(image);
                    canvas.setBackgroundImage(bgInstance, canvas.renderAll.bind(canvas), {
                        scaleX: 500 / bgInstance.width,
                        scaleY: 500 / bgInstance.height,
                        left: -50
                    });
                    fabric.Image.fromURL(baseUrl + '/web/img/base2.png', function (baseImage) {
                        canvas.add(baseImage);
                        canvas.sendToBack(baseImage);
                    });
                    var coverInstance = new fabric.Image(image, {
                        left: 37,
                        top: 370,
                        scaleX: 100 / bgInstance.width,
                        scaleY: 100 / bgInstance.height
                    });
                    canvas.add(coverInstance);
                    fabric.Image.fromURL(baseUrl + "/" + certData.disc, function (certImage) {
                        certImage.set('scaleX', 250 / certImage.width);
                        certImage.set('scaleY', 250 / certImage.width);
                        certImage.set('top', 100);
                        certImage.set('left', 75);
                        canvas.add(certImage);
                        //canvas.sendToFront(certImage);
                    });

                    var userText = new fabric.Text(certData.login, {
                        left: 100,
                        top: 40,
                        fontSize: 30,
                        fontFamily: 'Arial',
                        fill: 'white'
                    });
                    var nameText = new fabric.Text(certData.name, {
                        left: 150,
                        top: 370,
                        fontSize: 20,
                        fontFamily: 'Arial',
                        fill: 'white'
                    });
                    var artistText = new fabric.Text(certData.artist, {
                        left: 150,
                        top: 390,
                        fontSize: 16,
                        fontFamily: 'Arial',
                        fill: 'white'
                    });
                    var valueText = new fabric.Text(certData.value, {
                        left: 150,
                        top: 435,
                        fontSize: 14,
                        fontFamily: 'Arial',
                        fill: 'white'
                    });
                    var certText = new fabric.Text(certData.text, {
                        left: 150,
                        top: 415,
                        fontSize: 15,
                        fontFamily: 'Arial',
                        fill: 'white'
                    });
                    var date = new Date();
                    var dateText = new fabric.Text(date.getFullYear() + "." + (date.getMonth()+1) + "." + date.getDate(), {
                        left: 150,
                        top: 460,
                        fontSize: 12,
                        fontFamily: 'Arial',
                        fill: 'white'
                    });
                    canvas.add(userText);
                    canvas.add(nameText);
                    canvas.add(artistText);
                    canvas.add(valueText);
                    canvas.add(certText);
                    canvas.add(dateText);
                    setTimeout(function () {
                        var base64 = canvas.toDataURL('png');
                        certData.name = originalName;
                        sendToImgur(base64, certData, btn);
                    }, 1000);
                } catch (e) {
                    undisable_alt(btn, getMsg("newplaque_alt"));
                    console.log(e);
                }
            };
            image.src = certData.image;
        }
    });
}

function generatePlaque() {
    generateDefaultPlaque();
    var genBtn = $("#gen_plaque, .gen_plaque");
    genBtn.on('click', function (event) {
        event.preventDefault();
        var btn = $(this);
        var certData = {};
        certData.type = $(this).attr('data-type');
        certData.points = $(this).attr('data-points');
        certData.name = $(this).attr('data-name');
        certData.artist = $(this).attr('data-artist');
        certData.image = $(this).attr('data-image');
        disable(btn);
        $.ajax({
            url: baseUrl + '/new/plaque',
            type: 'POST',
            dataType: 'json',
            data: certData
        })
            .done(function (data) {
                if (typeof data.url !== "undefined" && data.url.length > 1) {
                    sendToImgur(data.url, certData, btn);
                }
                else {
                    if (typeof data.error !== "undefined" && data.error == 1) {
                        showAlert(1, getMsg("limitplaque"));
                    }
                    else {
                        showAlert(1, getMsg("error"));
                    }
                    if (curRoute === "weekly_chart") {
                        undisable_alt(btn, getMsg("newplaque_alt"));
                    }
                    else {
                        undisable_alt(btn, getMsg("newplaque"));
                    }
                }
            })
            .fail(function () {
                console.log("error");
                showAlert(1, getMsg("error"));
                undisable_alt(btn, getMsg("newplaque"));
            })
            .always(function () {
                console.log("complete");
            });

    });
}

function removePlaque() {
    $(".remove-plaque").on('click', function (event) {
        event.preventDefault();
        if (confirm(getMsg("sure"))) {
            var id = $(this).attr('data-id');
            var div = $(this);
            $.ajax({
                url: baseUrl + '/delete/plaque/' + id,
                dataType: 'json'
            })
                .done(function (data) {
                    console.log("success");
                    if (data.error == 0) {
                        div.closest('.col-plaque').hide('slow');
                    }
                    else {
                        showAlert(1, getMsg("error"));
                    }
                })
                .fail(function () {
                    console.log("error");
                    showAlert(1, getMsg("error"));
                })
                .always(function () {
                    console.log("complete");
                });
        }
    });
}

function copyChart() {
    var copyBtn = $("#copy");
    var copyBtnAlt = $("#copy_alt");

    copyBtn.tooltipster({
        theme: 'tooltipster-blue',
        trigger: 'custom',
        content: $('<span>' + getMsg('copy') + '</span>')
    });

    copyBtnAlt.tooltipster({
        theme: 'tooltipster-blue',
        trigger: 'custom',
        content: $('<span>' + getMsg('copy') + '</span>')
    });

    copyBtn.click(function (event) {
        $(".cr-col").hide(); // remove chart-run col
        $(".cr-row").hide(); // remove chart-run row
        $(".gen_plaque").hide(); // remove plaque generator button

        var clip = new Clipboard('#copy');
        clip.on('success', function (e) {
            copyBtn.tooltipster('show');
            console.log(e);
            e.clearSelection();
            $(".cr-col").show();
            $(".gen_plaque").show();
        });
    });

    copyBtnAlt.click(function (event) {
        var clipb = new Clipboard('#copy_alt', {
            text: function () {
                return document.querySelector('#copyme_alt').innerHTML;
            }
        });
        clipb.on('success', function (e) {
            copyBtnAlt.tooltipster('show');
            e.clearSelection();
        });
    });

    $('.showonhover').hover(function () {
        /* Stuff to do when the mouse enters the element */
        $(this).find('span').removeClass('hidden');
    }, function () {
        /* Stuff to do when the mouse leaves the element */
        $(this).find('span').addClass('hidden');
    });

    $("body").click(function (event) {
        copyBtn.tooltipster('hide');
        copyBtnAlt.tooltipster('hide');
    });
}

function formSubmit() {
    var submitBtn = $(".send");
    submitBtn.on('click', function (event) {
        event.preventDefault();
        var thisBtn = $(this);
        disable(thisBtn);
        var form = $(this).closest('form').serializeArray();
        var url = $(this).closest('form').attr('action');
        var method = $(this).closest('form').attr('method');
        $.ajax({
            url: url,
            type: method,
            data: form,
        })
            .done(function (data) {
                data = JSON.parse(data);
                if (data.erro == 0) {
                    window[data.call](data);
                }
                else {
                    showAlert(data.erro, data.message);
                    undisable(thisBtn);
                }
            })
            .fail(function () {
                console.log("error");
                showAlert(1, getMsg('error'));
                undisable(thisBtn);
            })
            .always(function () {
                console.log("complete");
            });
    });
}

function sortTable() {
    $.tablesorter.addParser({
        id: 'br-number',
        is: function(s) {
            return /^\d{1,3}(\.\d{3})*(,\d+)?$/.test(s);
        },
        format: function(s) {
            // Remove pontos (milhar), troca vírgula por ponto (decimal)
            return parseFloat(s.replace(/\./g, '').replace(',', '.'));
        },
        type: 'numeric',
    });
    $.tablesorter.themes.bootstrap = {
        table: 'table table-striped',
        caption: 'caption',
        // header class names
        header: 'bootstrap-header', // give the header a gradient background (theme.bootstrap_2.css)
        sortNone: '',
        sortAsc: '',
        sortDesc: '',
        active: '', // applied when column is sorted
        hover: '', // custom css required - a defined bootstrap style may not override other classes
        // icon class names
        icons: '', // add "icon-white" to make them white; this icon class is added to the <i> in the header
        iconSortNone: 'ti-arrows-vertical', // class name added to icon when column is not sorted
        iconSortAsc: 'ti-angle-up', // class name added to icon when column has ascending sort
        iconSortDesc: 'ti-angle-down',
    };
    $(".tablesorter").tablesorter({theme: "bootstrap", headerTemplate: '{content} {icon}', widgets: ["uitheme"]});
}

function disable(item) {
    item.attr('disabled', 'disabled');
    item.addClass('disabled');
    item.text(getMsg('wait') + '...');
}

function undisable(item) {
    item.removeAttr('disabled');
    item.removeClass('disabled');
    item.text('submit');
}

function undisable_alt(item, txt) {
    item.removeAttr('disabled');
    item.removeClass('disabled');
    item.text(txt);
}

function goTo(data) {
    window.location.href = data.url;
}

function successAndGoTo(data) {
    showAlert(0, '');
    setTimeout(function () {
        window.location.href = data.url;
    }, 3000);
}

function showAlert(erro, message) {
    var type = "danger";
    var title = "Oops";
    var icon = "icon-sad-face fa-4x";
    if (erro == 0) {
        type = "success";
        title = getMsg('success');
        icon = "ti-thumb-up fa-4x";
    }

    $.notify({
        icon: icon,
        title: title,
        message: message,
        animate: {
            enter: 'animated fadeInUp',
            exit: 'animated fadeOutDown'
        }
    }, {
        type: 'minimalist',
        delay: 4000,
        z_index: 10002,
        allow_dismiss: true,
        newest_on_top: true,
        template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
        '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
        '<i data-notify="icon" class="bottomspace-sm pull-left"></i>' +
        '<span data-notify="title">{1}</span>' +
        '<span data-notify="message">{2}</span>' +
        '</div>',
        placement: {
            from: "top",
            align: "center"
        }
    });
}

function updateYecAction() {
    var allon = 0;
    $(".yecupdaters").click(function (event) {
        /* Act on the event */
        var that = $(this);
        disable(that);
        var url = $(this).attr('data-url');
        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'json'
        })
            .done(function (data) {
                //updateControl(data);
                showAlert(data.error, data.msg);
                undisable_alt($(that), "YEC " + $(that).attr('data-time'));
                if (allon) {
                    $(".yecupdateall").click();
                }
                console.log("success");
            })
            .fail(function () {
                console.log("error");
                undisable_alt($(that), "YEC " + $(that).attr('data-time'));
                showAlert('danger', getMsg('error'));
            })
            .always(function () {
                console.log("complete");
            });

    });

    $(".yecupdateall").click(function (event) {
        disable($(this));
        var yecs = $(".yecupdaters");
        console.log(allon);
        if (typeof yecs[allon] != "undefined") {
            yecs[allon].click();
            allon++;
        } else if (allon == yecs.length) {
            undisable_alt($(this), getMsg('updateall'));
            allon = 0;
        }
    });
}


function updateAction() {
    $(".updaters").click(function (event) {
        /* Act on the event */
        disable($(".updaters"));
        var url = $(this).attr('data-url');
        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'json'
        })
            .done(function (data) {
                updateControl(data);
                console.log("success");
            })
            .fail(function () {
                console.log("error");
                undisable($(".updaters"));
                showAlert('danger', getMsg('error'));
            })
            .always(function () {
                console.log("complete");
            });

    });
}

function updateControl(weeks) {
    var total = weeks.length;
    if (total > 0) {
        loadStatus(0, total);
        updateWeek(0);
    }
    else {
        nothingNew();
    }

    function updateWeek(index) {
        var val = weeks[index];
        $.ajax({
            url: baseUrl + '/update/week/' + val.from + "/" + val.to,
            dataType: 'json'
        })
            .done(function (data) {
                console.log("success");
                var update = index + 1;
                loadStatus(update, total);
                updateWeek(update);
            })
            .fail(function () {
                console.log("error" + index);
                failMsg();
            })
            .always(function () {
                console.log("complete");
            });
    }
}

function loadStatus(actual, total) {
    var divAct = $("#updateaction");
    var perc = actual / total * 100;
    var txt = "<h2>" + getMsg('atting') + "</h2> " +
        "<small class='text-muted'>" + actual + " / " + total + " </small>" +
        "<div class='progress'>" +
        "<div class='progress-bar progress-bar-default' role='progressbar' aria-valuenow='" + perc + "' aria-valuemin='0' aria-valuemax='100' style='width: " + perc + "%'>" +
        "<span class='sr-only'>" + perc + "% " + getMsg('wksloaded') + "</span>" +
        "</div>" +
        "</div>";
    divAct.html(txt);
    if (actual == total) {
        txt = "<h2>" + getMsg('success') + "</h2>" +
            getMsg('finish');
        undisable_alt($(".new"), getMsg('updatenew'));
        undisable_alt($(".all"), getMsg('updateall'));
    }
    divAct.html(txt);
}

function nothingNew() {
    var divAct = $("#updateaction");
    var txt = "<h2>" + getMsg('uptodate') + "</h2> " +
        "<small class='text-muted'>" + getMsg('nothingnew') + "</small>";
    divAct.html(txt);
    undisable_alt($(".new"), getMsg('updatenew'));
    undisable_alt($(".all"), getMsg('updateall'));
}

function failMsg() {
    var divAct = $("#updateaction");
    var txt = "<h2>Oops</h2> " +
        "<small class='text-muted'>" + getMsg('failload') + "</small>";
    divAct.html(txt);
    undisable_alt($(".new"), getMsg('updatenew'));
    undisable_alt($(".all"), getMsg('updateall'));
}


function routesFns() {
    switch (curRoute) {
        case "profile":
            loadOverall();
            break;

        default:
            break;
    }
}

function loadOverall() {
    var cur = curPage.split("/");
    var login = cur[cur.length - 1];

    if (login.length === 0) {
        login = cur[cur.length - 2];
    }
    //loadAct(login, true);
    var alb = $(".top-albums");
    var rec = $(".recent");
    var art = $(".top-artists");
    var mus = $(".top-musics");
    $.ajax({
        url: baseUrl + '/load_all/' + login + '/' + 5,
        dataType: 'json'
    })
        .done(function (data) {
            art.html(data.artist);
            alb.html(data.album);
            mus.html(data.music);
            rec.html(data.recent);
            console.log("success");
        })
        .fail(function () {
            console.log("error");
        })
        .always(function () {
            console.log("complete");
        });
}