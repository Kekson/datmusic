/* ========================================================================
 * Music v2.0.7
 * https://github.com/alashow/music
 * ======================================================================== */

$(document).ready(function($) {

    $(document).keydown(function(e) {
        if (!$('#query').is(':focus')) {
            var unicode = e.charCode ? e.charCode : e.keyCode;
            if (unicode == 39) {
                playNext();
                track('button', 'next');
            } else if (unicode == 37) {
                playPrev();
                track('button', 'prev');
            }
        };
    });

    $('#player').affix({
        offset: {
            top: 400,
            bottom: function() {
                return (this.bottom = $('.footer').outerHeight(true))
            }
        }
    });

    var config = {
        title: "datmusic", //will be changed after i18n init
        apiUrl: "https://api.example.com/",
        appUrl: window.location.protocol + "//datmusic.xyz/",
        bitratesEnabled: true,
        oldQuery: null,
        /*for storing previous queries. Used to not search again with the same query*/
        defaultLang: "en",
        langCookie: "musicLang",
        currentTrack: -1
    };

    i18n.init({
        lng: (!$.cookie(config.langCookie)) ? config.defaultLang : $.cookie(config.langCookie),
        resStore: locales,
        cookieName: config.langCookie,
    }, function(err, t) {
        $("body").i18n();
        config.title = i18n.t("title");
    });

    //render all tooltips
    $('[data-toggle="tooltip"]').tooltip();

    //Parse audioTemplate
    var audioTemplate = $('#audioTemplate').html();
    Mustache.parse(audioTemplate);

    //Download apk if android
    if ($.cookie('showAndroidDownload') === undefined) {

        //show again after 2 days :)
        $.cookie('showAndroidDownload', false, {
            expires: 2
        });

        var ua = navigator.userAgent.toLowerCase();
        var isAndroid = ua.indexOf("android") > -1;
        if (isAndroid) {
            var r = confirm(i18n.t("apkDownload"));
            if (r == true) {
                track('android', "confirm");
                var win = window.open("https://play.google.com/store/apps/details?id=tm.alashow.datmusic", '_blank');
                win.focus();
            } else {
                track('android', "deny");
            }
        }
    };

    //Settings
    $('#settings').on('click', function(event) {
        $('#settingsModal').modal("show");
    });

    //set selected settings, please.
    $('#languageSelect').val(i18n.lng());

    //change language live
    $('#languageSelect').on('change', function(event) {
        i18n.setLng($(this).val(), function(err, t) {
            $("body").i18n();
            title = $('#jp_container_1').attr('title');
            $('#jp_container_1').attr('data-original-title', title);
            $('#jp_container_1').attr('title', '');
        });
    });

    //Trigger search button when pressing enter button
    $('#query').bind('keypress', function(event) {
        if (event.keyCode == 13) {
            $('.search').trigger('click');
        };
    });

    $('.search').on('click', function(event) {
        typedQuery = $('#query').val();
        if (typedQuery == "") return; // return if query empty
        search(typedQuery, null, null, true);
    });

    // Initialize player
    $("#jquery_jplayer_1").jPlayer({
        swfPath: config.appUrl + "js",
        supplied: "mp3",
        wmode: "window",
        smoothPlayBar: true,
        keyEnabled: true,
        remainingDuration: true,
        toggleDuration: true,
        volume: 1,
        keyBindings: {
            play: {
                key: 32, // p
                fn: function(f) {
                    track('button', 'play/pause');
                    if (f.status.paused) {
                        f.play();
                    } else {
                        f.pause();
                    }
                }
            }
        },
        ended: function() {
            itemCount = $('.list-group-item').length;
            console.log("#" + config.currentTrack + " ended, audios count in dom = " + itemCount);
            playNext();
        },
        //sync playing/paused status with audio element
        play: function() {
            currentTrackEl = $($('.list-group-item')[config.currentTrack]).find('.play');
            $(el).find('.glyphicon').addClass('glyphicon-pause');
            $(el).find('.glyphicon').removeClass('glyphicon-play');
        },
        pause: function() {
            currentTrackEl = $($('.list-group-item')[config.currentTrack]).find('.play');
            $(el).find('.glyphicon').addClass('glyphicon-play');
            $(el).find('.glyphicon').removeClass('glyphicon-pause');
        }
    });

    window.onpopstate = function(event) {
        searchFromQueryParam();
        console.log(event);
    };

    if (location.hash.length > 2) {
        var decodedQuery = decodeURIComponent(escape(window.atob(location.hash.substring(1, location.hash.length))));
        search(decodedQuery, null, null, true);
        $('#query').val(decodedQuery);
    } else if (!searchFromQueryParam()) {
        //Simulating search for demo of searching
        var artists = [
            "2 Cellos", "Agnes Obel", "Aloe Black", "Andrew Belle", "Angus Stone", "Aquilo", "Arctic Monkeys",
            "Avicii", "Balmorhea", "Barcelona", "Bastille", "Ben Howard", "Benj Heard", "Birdy", "Broods",
            "Calvin Harris", "Charlotte OC", "City of The Sun", "Civil Twilight", "Clint Mansel", "Coldplay",
            "Daft Punk", "Damien Rice", "Daniela Andrade", "Daughter", "David O'Dowda", "Dawn Golden", "Dirk Maassen",
            "Ed Sheeran", "Eminem", "Fabrizio Paterlini", "Fink", "Fleurie", "Florence and The Machine", "Gem club",
            "Glass Animals", "Greg Haines", "Greg Maroney", "Groen Land", "Halsey", "Hans Zimmer", "Hozier",
            "Imagine Dragons", "Ingrid Michaelson", "Jamie XX", "Jarryd James", "Jasmin Thompson", "Jaymes Young",
            "Jessie J", "Josef Salvat", "Julia Kent", "Kai Engel", "Keaton Henson", "Kendra Logozar", "Kina Grannis",
            "Kodaline", "Kygo", "Kyle Landry", "Lana Del Rey", "Lera Lynn", "Lights & Motion", "Linus Young", "Lo-Fang",
            "Lorde", "Ludovico Einaudi", "M83", "MONO", "MS MR", "Macklemore", "Mammals", "Maroon 5", "Martin Garrix",
            "Mattia Cupelli", "Max Richter", "Message To Bears", "Mogwai", "Mumford & Sons", "Nils Frahm", "ODESZA", "Oasis",
            "Of Monsters and Men", "Oh Wonder", "Philip Glass", "Phoebe Ryan", "Rachel Grimes", "Radiohead", "Ryan Keen",
            "Sam Smith", "Seinabo Sey", "Sia", "Takahiro Kido", "The Irrepressibles", "The Neighbourhood", "The xx",
            "VLNY", "Wye Oak", "X ambassadors", "Yann Tiersen", "Yiruma", "Young Summer", "Zack Hemsey", "Zinovia",
            "deadmau5", "pg.lost", "Ólafur Arnalds"
        ]

        var demoArtist = artists[Math.floor(Math.random() * artists.length)];
        search(demoArtist, null, null, false, true);
        $('#query').val(demoArtist);
    }

    //app.extra.js is for customizing site, without touching base js.
    $.getScript("js/app.extra.js");

    //Main function for search
    function search(newQuery, captcha_sid, captcha_key, analytics, performer_only) {
        config.currentTrack = -1; //reset current, so it won't play next song with wrong list

        if (newQuery.length > 1 && newQuery != config.oldQuery) {
            //change url with new query and page back support
            window.history.pushState(newQuery, $('title').html(), "?q=" + newQuery);
            //artist name for title
            document.title = newQuery.split(" -")[0] + " - " + config.title;
        };

        config.oldQuery = newQuery;

        //request params
        var data = {
            q: newQuery,
            page: 0
        };

        $.ajax({
            url: config.apiUrl + "search",
            data: data,
            method: "GET",
            dataType: "json",
            cache: true,
            beforeSend: function() {
                $('#loading').show(); // Show loading
            },
            error: function() {
                appendError(i18n.t("networkError")); //Network error, ajax failed
            },
            success: function(msg) {
                if (msg.data == 0) {
                    appendError(i18n.t("notFound")); //Response empty, audios not found 
                    return;
                };

                $('#result > .list-group').html(""); //clear list

                //appending audio items to dom
                for (var i = 0; i < msg.data.length; i++) {
                    downloadUrl = msg.data[i].download;
                    streamUrl = msg.data[i].stream;

                    audioTitle = msg.data[i].artist + ' - ' + msg.data[i].title;
                    audioDuration = msg.data[i].duration.toTime();

                    audioView = {
                        "clickToPlay": i18n.t("clickToPlay"),
                        "clickToDownload": i18n.t("clickToDownload"),
                        "durationSeconds": msg.data[i].duration,
                        "duration": audioDuration,
                        "url": {
                            "stream": streamUrl,
                            "download": {
                                "original": downloadUrl,
                                "64": downloadUrl + "/64",
                                "128": downloadUrl + "/128",
                                "192": downloadUrl + "/192",
                            }
                        },
                        "audio": audioTitle
                    };

                    audioRendered = Mustache.render(audioTemplate, audioView);
                    $('#result > .list-group').append(audioRendered);
                };

                //tracking search query
                track('search', newQuery);

                //hide dat thing after all
                $('#loading').hide();

                onListRendered();
            }
        });
    }

    function onListRendered() {
        //set listeners
        $('.play').on('click', function(event) {
            play($(".list-group-item").index($(this).parent()));
        });

        //showing fileSize and bitrate on dropdown shown
        $('.badge-download').on('shown.bs.dropdown', function() {
            dropdown = $(this);
            infoEl = $(dropdown.find('.info-link')[0]);

            link = infoEl.attr('data-stream');
            duration = parseInt($(infoEl).attr('data-duration'));

            if (!config.bitratesEnabled) {
                infoEl.text(i18n.t("clickToDownload"));
            } else if (infoEl.text() == "...") { //if it's not shown yet
                parts = link.split("/");
                length = parts.length;
                bytesUrl = config.apiUrl + "bytes/" + parts[length - 2] + "/" + parts[length - 1];
                getFileSize(bytesUrl, function(sizeInBytes) {
                    bitrate = parseInt(sizeInBytes * 8 / duration / 1000);
                    info = bitrate + " kbps" + ", " + humanFileSize(sizeInBytes, true);
                    infoEl.text(info);

                    allowedBitrateClasses = {
                        64: "bitrate-64",
                        128: "bitrate-128",
                        192: "bitrate-192",
                    };

                    //remove bitrate convertation link from list if allowedBitrate equal or greater than original bitrate
                    //otherwise, add calculated size of bitrate to list 
                    for (var allowedBitrate in allowedBitrateClasses) {
                        bitrateEl = dropdown.find('.' + allowedBitrateClasses[allowedBitrate]);
                        if (allowedBitrate >= bitrate) {
                            bitrateEl.remove();
                        } else {
                            bytes = allowedBitrate / 8 * duration * 1000;
                            bitrateEl.text(bitrateEl.text() + ", " + humanFileSize(bytes, true));
                        };
                    };

                });
            };
        });

        $('.badge-download a').on('click', function() {
            if ($(this).attr('href') != "#") {
                if ($(this).hasClass('info-link')) {
                    track("download", "bitrate = default")
                } else {
                    bitrate = $(this).text().replace(/[^\d.]/g, ''); //extracting integers, if any

                    if (bitrate.length == 0) {
                        track("download", "bitrate = default")
                    } else {
                        track("download", "bitrate = " + bitrate)
                    }
                }
            }
        });
    }

    /**
     *  Play next track.
     **/
    function playNext() {
        if (0 > config.currentTrack) {
            return; //there no music currently playing.
        };

        itemCount = $('.list-group-item').length - 1;
        if (config.currentTrack + 1 <= itemCount) {
            play(config.currentTrack + 1);
        } else { //else play first track
            console.log('seems like there no audios to play, i think. playing first one.');
            play(0);
        }

        track('play', "next");
    }

    /**
     *  Play previous track
     **/
    function playPrev() {
        if (0 > config.currentTrack) {
            return; //there no music currently playing.
        };

        if (config.currentTrack - 1 >= 0) {
            play(config.currentTrack - 1);
        } else { //else play last track
            console.log('this is first audio, nothing in back. playing last one.');
            itemCount = $('.list-group-item').length - 1;
            play(itemCount);
        }

        track('play', "prev");
    }

    /**
     * Set audio, play, show, set index, restate audios.
     * @param index of audio, in .list-group-item
     **/
    function play(index) {
        el = $($('.list-group-item')[index]).find('.play');

        //pause/play if clicked to current
        if (index == config.currentTrack) {
            if (!$('#jquery_jplayer_1').data().jPlayer.status.paused) {
                $("#jquery_jplayer_1").jPlayer("pause");
                $(el).find('.glyphicon').removeClass('glyphicon-pause');
                $(el).find('.glyphicon').addClass('glyphicon-play');
            } else {
                $("#jquery_jplayer_1").jPlayer("play");
                $(el).find('.glyphicon').removeClass('glyphicon-play');
                $(el).find('.glyphicon').addClass('glyphicon-pause');
            }
            return;
        };


        if (!el.length) {
            console.log("#" + index + " audio not found in dom")
            return;
        };

        $("#jquery_jplayer_1").jPlayer("setMedia", {
            mp3: $(el).parent().find('a.name').attr('data-src')
        });

        //set text of current audio to player
        $('.jp-audio .jp-current-name').text($(el).parent().find('a.name').text());

        //do magic
        $("#jquery_jplayer_1").jPlayer("play");
        $('#jp_container_1').show();
        $('#player-space').show();

        //set current track index
        config.currentTrack = index;

        // changing all paused items to play
        $('.list-group').find('.glyphicon-pause').each(function(index, e) {
            $(e).removeClass('glyphicon-pause');
            $(e).addClass('glyphicon-play');
        });

        //change current audio to playing state
        $(el).find('.glyphicon').removeClass('glyphicon-play');
        $(el).find('.glyphicon').addClass('glyphicon-pause');

        track('playAudio', $($('.list-group-item')[index]).find('a.name').html());
    }

    //Clear list and append given error
    function appendError(error) {
        $('#result > .list-group').html("");
        $('#result > .list-group').append('<li class="list-group-item list-group-item-danger">' + error + '</li>');
        $('#loading').hide();
    }

    /**
     * @return isSearched from query param
     **/
    function searchFromQueryParam() {
        paramQuery = getParameterByName("q");
        if (paramQuery.length > 1) {
            search(paramQuery, null, null, true);
            $('#query').val(paramQuery);
            return true;
        } else {
            return false;
        }
    }

    /**
     * @param query param name
     * @return query param value
     **/
    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function getFileSize(url, callback) {
        $.get(url, function(data) {
            callback(parseInt(data));
        });
    }

    function track(type, value) {
        try {
            if (ga) {
                ga('send', 'event', type, value);
            };
        } catch (e) {
            console.error("outer", e.message);
        }
    }

    //Sec To Time
    Number.prototype.toTime = function() {
        var s = parseInt(this, 10);
        //some dark magic thing happens here
        return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s;
    }

    //http://stackoverflow.com/a/14919494/2897341
    function humanFileSize(bytes, si) {
        var thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        var units = si ? ['kB', 'MB', 'GB'] : ['KiB', 'MiB', 'GiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
    }
});