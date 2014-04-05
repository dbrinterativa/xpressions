/*
 Class Xpressions
 // jquery dependency
 */

$j = jQuery;
var timeToRedirect = 1;

(function () {
    /*
     * Class Xpressions
     */
    if ('undefined' === typeof Xpressions) {
        Xpressions = {};

        if ('undefined' !== typeof window) {
            window.Xp = window.Xpressions = Xp = Xpressions;
        }
    }

    //set xpressions version
    Xpressions.version = 1.0;
    //APPKEY
    Xpressions.APPKEY = '';
    //BASE API
    Xpressions.APIURL = 'http://api.xpbos.co/';

    //helpers
    Xpressions.helpers = {

        extend: function () {
            for (var i = 1; i < arguments.length; i++)
                for (var key in arguments[i])
                    if (arguments[i].hasOwnProperty(key))
                        arguments[0][key] = arguments[i][key];
            return arguments[0];
        },
        updateQueryStringParameter: function (uri, key, value) {
            var re = new RegExp("([?|&])" + key + "=.*?(&|$)", "i");
            separator = uri.indexOf('?') !== -1 ? "&" : "?";
            if (uri.match(re)) {
                return uri.replace(re, '$1' + key + "=" + value + '$2');
            }
            else {
                return uri + separator + key + "=" + value;
            }
        },

        getURLParameter: function (name) {
            return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
        },

        cookie: {
            set: function (name, value, days) {
                var date, expires;
                if (days) {
                    date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toGMTString();
                } else {
                    expires = "";
                }
                document.cookie = name + "=" + JSON.stringify(value) + expires + "; domain=.xpbos.co;path=/";
            },
            get: function (name) {
                var i, c, ca, nameEQ = name + "=";
                ca = document.cookie.split(';');
                for (i = 0; i < ca.length; i++) {
                    c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1, c.length);
                    }
                    if (c.indexOf(nameEQ) == 0) {
                        return JSON.parse(unescape(c.substring(nameEQ.length, c.length)));
                    }
                }
                return '';
            },
            remove: function (name) {
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=.xpbos.co;path=/';
            }
        },
        //aux functions
        redirect: function (url) {
            setTimeout(function () {
                return window.location.href = url;
            }, timeToRedirect);
        },
        /* Nano Templates (Tomasz Mazur, Jacek Becela) */
        nano: function (template, data) {
            return template.replace(/\{([\w\.]*)\}/g, function (str, key) {
                var keys = key.split("."), v = data[keys.shift()];
                for (var i = 0, l = keys.length; i < l; i++) v = v[keys[i]];
                return (typeof v !== "undefined" && v !== null) ? v : "";
            });
        }
    }
    var H = Xpressions.helpers;
    //init object to api's
    Xpressions.api = {
        load: function () {
            //console.info(Xpressions.api.facebook.auth);
            $j(function () {
                Xpressions.api.facebook.bind();
            });
        },
        //Facebook Class
        facebook: {
            call: function (path, params, callback, method) {//method defaults to GET
                method = method || "GET";
                var myParams = Xp.getParams(params);
                console.info(myParams);
                $j.ajax({
                    url: Xp.APIURL + path,
                    dataType: 'json',
                    type: method,
                    data: myParams,
                    success: callback
                });
            },
            doLogin: function (params) {
                //response.url expect to redirect
                this.call('login/facebook', params, function (response) {
                    if (response.url)
                        Xp.helpers.redirect(response.url);
                });
            },
            getUser: function (callback) {
                this.call('user/facebook', {}, callback);
            },
            shareUrl: function (params, callback) {
                return this.call('share/facebook', params, callback, 'post');
            },
            shareProduct: function (params, callback) {
                return this.call('share/facebook/product', params, callback, 'post');
            },
            like: function (params, callback) {
                return this.call('like/facebook', params, callback, 'post');
            },
            want: function (params, callback) {
                return this.call('want/facebook', params, callback, 'post');
            },
            discount: function (params, callback) {
                return this.call('discount/facebook', params, callback, 'post');
            },
            buy: function (params, callback) {
                return this.call('buy/facebook', params, callback, 'post');
            },
            user: function (callback) {
                if (Xp.api.facebook.auth.check()) {
                    return callback(Xp.api.facebook.auth.user());
                } else {
                    Xp.api.facebook.getUser(function (response) {
                        if (response.error)
                            throw response.msg;

                        Xp.api.facebook.auth.save(response);
                        $j.event.trigger({
                            type: "xp.userChange",
                            user: response
                        });
                        $j.event.trigger({
                            type: "xp.userStateChange"
                        });
                        return callback(response)
                    });
                }
            },
            auth: {
                check: function () {
                    return Xp.api.facebook.auth.logged;
                },
                save: function (data) {
                    if (!data)
                        return false;

                    Xp.helpers.cookie.set('_xp_fb_user', data);
                    $j.event.trigger({
                        type: "xp.userStateChange",
                        logged: true
                    });
                    return Xp.api.facebook.auth.logged = true;
                },
                user: function () {
                    return (Xp.helpers.cookie.get('_xp_fb_user') ? Xp.helpers.cookie.get('_xp_fb_user') : { uid: null, first_name: null, last_name: null, email: null });
                },
                logout: function (url) {
                    Xp.helpers.cookie.remove('_xp_fb_user');
                    Xp.api.facebook.auth.logged = false;

                    $j.event.trigger({
                        type: "xp.userStateChange",
                        logout: true
                    });


                    if (url)
                        return Xp.helpers.redirect(url);

                    return true;
                },
                logged: ( Xp.helpers.cookie.get('_xp_fb_user') ? true : false )
            },
            bind: function () {
                $j(".xp-facebook-login").on("click", function (event) {
                    event.preventDefault();
                    //make an get to api
                    Xp.api.facebook.doLogin($j(this).data());
                });

                $j(".xp-facebook-logout").on("click", function (event) {
                    event.preventDefault();
                    //make an get to api
                    Xp.api.facebook.auth.logout();
                });

                $j(document).on('xp.userChange',function (event, data) {

                    $j('*[data-xp-facebook-user]').each(function () {
                        //check if user is logged in
                        var _box_user = $j(this)
                        var _template = _box_user.html();
                        //hide
                        _box_user.hide().addClass("xp-facebook-user");

                        Xp.api.facebook.user(function (user) {
                            if (user.error) {
                                $j(this).hide();
                                return;
                            }
                            var avatar = new Image();
                            avatar.src = 'https://graph.facebook.com/' + user.uid + '/picture';
                            user.avatar = avatar.outerHTML;
                            var data = {
                                user: user
                            };
                            console.info(data)

                            if (_template)
                                return _box_user.html(Xp.helpers.nano(_template, data)).show();
                        });
                    });

                }).trigger('xp.userChange');
                //hide login button if already logged
                $j(document).on('xp.userStateChange',function (event) {
                    $j("*[data-xp-facebook-login-button]").each(function () {
                        if (Xp.api.facebook.auth.check()) {
                            $j(this).hide();
                        } else {
                            $j(this).show();
                        }
                    });

                    //hide logout button if not logged in
                    $j("*[data-xp-facebook-logout-button]").each(function () {
                        if (Xp.api.facebook.auth.check() === false) {
                            $j(this).hide();
                        } else {
                            $j(this).show();
                        }
                    });
                }).trigger('xp.userStateChange');

                //share url button
                $j(".xp-facebook-share-url").not('.disabled').on('click', function (event) {
                    event.preventDefault();
                    var _button = $j(this);
                    if (!Xp.api.facebook.auth.check()) {
                        return Xp.api.facebook.doLogin();
                    }

                    _button.addClass("disabled");
                    Xp.api.facebook.shareUrl($j(this).data(), function (post) {
                        var el = $j("<span/>").text("Url compartilhada no seu mural.");
                        el.insertAfter(_button);
                        setTimeout(function () {
                            el.fadeOut(function () {
                                el.remove();
                                _button.removeClass('disabled');
                            })
                        }, 5000)
                    })
                });
                //share product button
                $j(".xp-facebook-share-product").not('.disabled').on('click', function (event) {
                    event.preventDefault();
                    var _button = $j(this);
                    if (!Xp.api.facebook.auth.check()) {
                        return Xp.api.facebook.doLogin();
                    }

                    _button.addClass("disabled");
                    Xp.api.facebook.shareProduct($j(this).data(), function (post) {
                        var el = $j("<span/>").text("Produto compartilhado no seu mural.");
                        el.insertAfter(_button);
                        setTimeout(function () {
                            el.fadeOut(function () {
                                el.remove();
                                _button.removeClass('disabled');
                            })
                        }, 5000)
                    })
                });

                //like button
                $j(".xp-facebook-like").not('.disabled').on('click', function (event) {
                    event.preventDefault();
                    var _button = $j(this);
                    if (!Xp.api.facebook.auth.check()) {
                        return Xp.api.facebook.doLogin();
                    }

                    _button.addClass("disabled");
                    Xp.api.facebook.like($j(this).data(), function (post) {
                        var el = $j("<span/>").text("Você curtiu isso.");
                        el.insertAfter(_button);
                        setTimeout(function () {
                            el.fadeOut(function () {
                                el.remove();
                                _button.removeClass('disabled');
                            })
                        }, 5000)
                    })
                });

                //want button
                $j(".xp-facebook-want").not('.disabled').on('click', function (event) {
                    event.preventDefault();
                    var _button = $j(this);
                    if (!Xp.api.facebook.auth.check()) {
                        return Xp.api.facebook.doLogin();
                    }

                    _button.addClass("disabled");
                    Xp.api.facebook.want($j(this).data(), function (post) {
                        var el = $j("<span/>").text("Eu quero.");
                        el.insertAfter(_button);
                        setTimeout(function () {
                            el.fadeOut(function () {
                                el.remove();
                                _button.removeClass('disabled');
                            })
                        }, 5000)
                    })
                });

                //discount button
                $j(".xp-facebook-discount").not('.disabled').on('click', function (event) {
                    event.preventDefault();
                    var _button = $j(this);
                    if (!Xp.api.facebook.auth.check()) {
                        return Xp.api.facebook.doLogin();
                    }

                    _button.addClass("disabled");
                    Xp.api.facebook.discount($j(this).data(), function (post) {
                        var el = $j("<span/>").text("Eu quero desconto.");
                        el.insertAfter(_button);
                        setTimeout(function () {
                            el.fadeOut(function () {
                                el.remove();
                                _button.removeClass('disabled');
                            })
                        }, 5000)
                    })
                });

                //buy button
                $j(".xp-facebook-buy").not('.disabled').on('click', function (event) {
                    event.preventDefault();
                    var _button = $j(this);
                    if (!Xp.api.facebook.auth.check()) {
                        return Xp.api.facebook.doLogin();
                    }

                    _button.addClass("disabled");
                    Xp.api.facebook.buy($j(this).data(), function (post) {
                        var el = $j("<span/>").text("Eu comprei.");
                        el.insertAfter(_button);
                        setTimeout(function () {
                            el.fadeOut(function () {
                                el.remove();
                                _button.removeClass('disabled');
                            })
                        }, 5000)
                    })
                });

            }
        },
        twitter: {  },
        gplus: {  }
    }

    Xpressions.format = function(){
        var selector = $j(".xp-box a");
        var appendTemplate = "<i/>";
        selector.each(function(){
            console.info(this)
            $j(this).prepend(appendTemplate);
        })
    }

    Xpressions.startSection = function () {

        if (!Xp.helpers.cookie.get('_xp')) {
            var _ses = {
                appKey: Xp.APPKEY
            };
            Xp.helpers.cookie.set('_xp', _ses);
        } else {
            //check if has aci params on query string
            var aci = Xp.helpers.getURLParameter('aci');
            console.info(aci);
            if (aci) {
                var _ses = Xp.helpers.cookie.get('_xp');
                _ses.aci = aci;
                Xp.helpers.cookie.set('_xp', _ses);
            }
        }
        return _ses;
    }

    Xpressions.getParams = function (params) {
        return Xp.helpers.extend({ appKey: Xp.APPKEY, aci: Xp.getAci(), redirect_uri: window.location.href }, params);
    }

    Xpressions.getAci = function () {
        var response = Xp.helpers.cookie.get("_xp");
        if (response.aci) {
            return response.aci;
        }else if(Xp.helpers.getURLParameter('aci')){
            return Xp.helpers.getURLParameter('aci');
        }

        return false;
    }

    Xpressions.load = function () {
        //load the appKey and start tracking ACI
        if (!window.XP.appKey == 'appKey') {
            throw "undefined appKey";
        }
        Xpressions.APPKEY = window.XP.appKey;
        Xp.startSection();
        Xp.format();
        Xp.api.load();
    }()

})();