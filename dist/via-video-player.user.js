// ==UserScript==
// @name         Via 视频嗅探播放器
// @name:en      Via Video Sniffer & Player
// @namespace    viamodes.local
// @version      0.1.75
// @vvbuild      2026-11-10 08:22
// @author       ViaModes
// @description  网页视频嗅探 + 全屏播放器：网页铺满（把站点播放器放大到可视区）、悬浮角标、mp4/m3u8 播放、手势调节音量亮度与快进、倍速、画质/音轨切换、进度记忆、锁屏、片头片尾、连播、调 Via 下载
// @description:en  Sniff web videos and play with a fullscreen player; page-fill mode enlarges the site's own player to the viewport (gestures, speed, resume, m3u8, next-episode, download)
// @match        http://*/*
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-start
// @license      MIT
// ==/UserScript==
(function(){
"use strict";
var VV_VERSION = "0.1.75", VV_BUILD = "2026-11-10 08:22";
var VV_HLS_URLS = ["https://fastly.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://unpkg.com/hls.js@1/dist/hls.light.min.js"];
/*! hls.js 1.7.3 | Copyright (c) 2017 Dailymotion (http://www.dailymotion.com) | Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0) | https://github.com/video-dev/hls.js | 本副本为官方 dist/hls.light.min.js 原样内联，未修改；许可证全文见 vendor/LICENSE-hlsjs 与 vendor/LICENSE-Apache-2.0 */
(function(){try{!function e(t){var r,i;r=this,i=function(){"use strict";function r(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,i=Array(t);r<t;r++)i[r]=e[r];return i}function i(e,t){for(var r=0;r<t.length;r++){var i=t[r];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,g(i.key),i)}}function a(e,t,r){return t&&i(e.prototype,t),r&&i(e,r),Object.defineProperty(e,"prototype",{writable:!1}),e}function n(e,t){var i="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(i)return(i=i.call(e)).next.bind(i);if(Array.isArray(e)||(i=function(e,t){if(e){if("string"==typeof e)return r(e,t);var i={}.toString.call(e).slice(8,-1);return"Object"===i&&e.constructor&&(i=e.constructor.name),"Map"===i||"Set"===i?Array.from(e):"Arguments"===i||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i)?r(e,t):void 0}}(e))||t){i&&(e=i);var a=0;return function(){return a>=e.length?{done:!0}:{done:!1,value:e[a++]}}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function s(e,t,r){return(t=g(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(){return o=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var i in r)({}).hasOwnProperty.call(r,i)&&(e[i]=r[i])}return e},o.apply(null,arguments)}function l(e){return l=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},l(e)}function u(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,c(e,t)}function d(){try{var e=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){})))}catch(e){}return(d=function(){return!!e})()}function h(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,i)}return r}function f(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?h(Object(r),!0).forEach((function(t){s(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):h(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){return c=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},c(e,t)}function g(e){var t=function(e,t){if("object"!=typeof e||!e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var i=r.call(e,t);if("object"!=typeof i)return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(e,"string");return"symbol"==typeof t?t:t+""}function v(e){var t="function"==typeof Map?new Map:void 0;return v=function(e){if(null===e||!function(e){try{return-1!==Function.toString.call(e).indexOf("[native code]")}catch(t){return"function"==typeof e}}(e))return e;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if(void 0!==t){if(t.has(e))return t.get(e);t.set(e,r)}function r(){return function(e,t,r){if(d())return Reflect.construct.apply(null,arguments);var i=[null];i.push.apply(i,t);var a=new(e.bind.apply(e,i));return r&&c(a,r.prototype),a}(e,arguments,l(this).constructor)}return r.prototype=Object.create(e.prototype,{constructor:{value:r,enumerable:!1,writable:!0,configurable:!0}}),c(r,e)},v(e)}function m(e){return e instanceof ArrayBuffer||"undefined"!=typeof SharedArrayBuffer&&e instanceof SharedArrayBuffer}var p="utf-16",y="utf-16be",E="utf-16le",T="utf-8";function S(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var L,R,A={exports:{}},b=(L||(L=1,function(e){var t=Object.prototype.hasOwnProperty,r="~";function i(){}function a(e,t,r){this.fn=e,this.context=t,this.once=r||!1}function n(e,t,i,n,s){if("function"!=typeof i)throw new TypeError("The listener must be a function");var o=new a(i,n||e,s),l=r?r+t:t;return e._events[l]?e._events[l].fn?e._events[l]=[e._events[l],o]:e._events[l].push(o):(e._events[l]=o,e._eventsCount++),e}function s(e,t){0==--e._eventsCount?e._events=new i:delete e._events[t]}function o(){this._events=new i,this._eventsCount=0}Object.create&&(i.prototype=Object.create(null),(new i).__proto__||(r=!1)),o.prototype.eventNames=function(){var e,i,a=[];if(0===this._eventsCount)return a;for(i in e=this._events)t.call(e,i)&&a.push(r?i.slice(1):i);return Object.getOwnPropertySymbols?a.concat(Object.getOwnPropertySymbols(e)):a},o.prototype.listeners=function(e){var t=r?r+e:e,i=this._events[t];if(!i)return[];if(i.fn)return[i.fn];for(var a=0,n=i.length,s=new Array(n);a<n;a++)s[a]=i[a].fn;return s},o.prototype.listenerCount=function(e){var t=r?r+e:e,i=this._events[t];return i?i.fn?1:i.length:0},o.prototype.emit=function(e,t,i,a,n,s){var o=r?r+e:e;if(!this._events[o])return!1;var l,u,d=this._events[o],h=arguments.length;if(d.fn){switch(d.once&&this.removeListener(e,d.fn,void 0,!0),h){case 1:return d.fn.call(d.context),!0;case 2:return d.fn.call(d.context,t),!0;case 3:return d.fn.call(d.context,t,i),!0;case 4:return d.fn.call(d.context,t,i,a),!0;case 5:return d.fn.call(d.context,t,i,a,n),!0;case 6:return d.fn.call(d.context,t,i,a,n,s),!0}for(u=1,l=new Array(h-1);u<h;u++)l[u-1]=arguments[u];d.fn.apply(d.context,l)}else{var f,c=d.length;for(u=0;u<c;u++)switch(d[u].once&&this.removeListener(e,d[u].fn,void 0,!0),h){case 1:d[u].fn.call(d[u].context);break;case 2:d[u].fn.call(d[u].context,t);break;case 3:d[u].fn.call(d[u].context,t,i);break;case 4:d[u].fn.call(d[u].context,t,i,a);break;default:if(!l)for(f=1,l=new Array(h-1);f<h;f++)l[f-1]=arguments[f];d[u].fn.apply(d[u].context,l)}}return!0},o.prototype.on=function(e,t,r){return n(this,e,t,r,!1)},o.prototype.once=function(e,t,r){return n(this,e,t,r,!0)},o.prototype.removeListener=function(e,t,i,a){var n=r?r+e:e;if(!this._events[n])return this;if(!t)return s(this,n),this;var o=this._events[n];if(o.fn)o.fn!==t||a&&!o.once||i&&o.context!==i||s(this,n);else{for(var l=0,u=[],d=o.length;l<d;l++)(o[l].fn!==t||a&&!o[l].once||i&&o[l].context!==i)&&u.push(o[l]);u.length?this._events[n]=1===u.length?u[0]:u:s(this,n)}return this},o.prototype.removeAllListeners=function(e){var t;return e?(t=r?r+e:e,this._events[t]&&s(this,t)):(this._events=new i,this._eventsCount=0),this},o.prototype.off=o.prototype.removeListener,o.prototype.addListener=o.prototype.on,o.prefixed=r,o.EventEmitter=o,e.exports=o}(A)),A.exports),k=S(b),D={exports:{}},I=(R||(R=1,function(e,t){var r,i,a,n,s;r=/^(?=((?:[a-zA-Z0-9+\-.]+:)?))\1(?=((?:\/\/[^\/?#]*)?))\2(?=((?:(?:[^?#\/]*\/)*[^;?#\/]*)?))\3((?:;[^?#]*)?)(\?[^#]*)?(#[^]*)?$/,i=/^(?=([^\/?#]*))\1([^]*)$/,a=/(?:\/|^)\.(?=\/)/g,n=/(?:\/|^)\.\.\/(?!\.\.\/)[^\/]*(?=\/)/g,s={buildAbsoluteURL:function(e,t,r){if(r=r||{},e=e.trim(),!(t=t.trim())){if(!r.alwaysNormalize)return e;var a=s.parseURL(e);if(!a)throw new Error("Error trying to parse base URL.");return a.path=s.normalizePath(a.path),s.buildURLFromParts(a)}var n=s.parseURL(t);if(!n)throw new Error("Error trying to parse relative URL.");if(n.scheme)return r.alwaysNormalize?(n.path=s.normalizePath(n.path),s.buildURLFromParts(n)):t;var o=s.parseURL(e);if(!o)throw new Error("Error trying to parse base URL.");if(!o.netLoc&&o.path&&"/"!==o.path[0]){var l=i.exec(o.path);o.netLoc=l[1],o.path=l[2]}o.netLoc&&!o.path&&(o.path="/");var u={scheme:o.scheme,netLoc:n.netLoc,path:null,params:n.params,query:n.query,fragment:n.fragment};if(!n.netLoc&&(u.netLoc=o.netLoc,"/"!==n.path[0]))if(n.path){var d=o.path,h=d.substring(0,d.lastIndexOf("/")+1)+n.path;u.path=s.normalizePath(h)}else u.path=o.path,n.params||(u.params=o.params,n.query||(u.query=o.query));return null===u.path&&(u.path=r.alwaysNormalize?s.normalizePath(n.path):n.path),s.buildURLFromParts(u)},parseURL:function(e){var t=r.exec(e);return t?{scheme:t[1]||"",netLoc:t[2]||"",path:t[3]||"",params:t[4]||"",query:t[5]||"",fragment:t[6]||""}:null},normalizePath:function(e){for(e=e.split("").reverse().join("").replace(a,"");e.length!==(e=e.replace(n,"")).length;);return e.split("").reverse().join("")},buildURLFromParts:function(e){return e.scheme+e.netLoc+e.path+e.params+e.query+e.fragment}},e.exports=s}(D)),D.exports),_=Number.isFinite||function(e){return"number"==typeof e&&isFinite(e)},C=Number.isSafeInteger||function(e){return"number"==typeof e&&Math.abs(e)<=P},P=Number.MAX_SAFE_INTEGER||9007199254740991,x=function(e){return e.NETWORK_ERROR="networkError",e.MEDIA_ERROR="mediaError",e.KEY_SYSTEM_ERROR="keySystemError",e.MUX_ERROR="muxError",e.OTHER_ERROR="otherError",e}({}),w=function(e){return e.KEY_SYSTEM_NO_KEYS="keySystemNoKeys",e.KEY_SYSTEM_NO_ACCESS="keySystemNoAccess",e.KEY_SYSTEM_NO_SESSION="keySystemNoSession",e.KEY_SYSTEM_NO_CONFIGURED_LICENSE="keySystemNoConfiguredLicense",e.KEY_SYSTEM_LICENSE_REQUEST_FAILED="keySystemLicenseRequestFailed",e.KEY_SYSTEM_SERVER_CERTIFICATE_REQUEST_FAILED="keySystemServerCertificateRequestFailed",e.KEY_SYSTEM_SERVER_CERTIFICATE_UPDATE_FAILED="keySystemServerCertificateUpdateFailed",e.KEY_SYSTEM_SESSION_UPDATE_FAILED="keySystemSessionUpdateFailed",e.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED="keySystemStatusOutputRestricted",e.KEY_SYSTEM_STATUS_INTERNAL_ERROR="keySystemStatusInternalError",e.KEY_SYSTEM_DESTROY_MEDIA_KEYS_ERROR="keySystemDestroyMediaKeysError",e.KEY_SYSTEM_DESTROY_CLOSE_SESSION_ERROR="keySystemDestroyCloseSessionError",e.KEY_SYSTEM_DESTROY_REMOVE_SESSION_ERROR="keySystemDestroyRemoveSessionError",e.MANIFEST_LOAD_ERROR="manifestLoadError",e.MANIFEST_LOAD_TIMEOUT="manifestLoadTimeOut",e.MANIFEST_PARSING_ERROR="manifestParsingError",e.MANIFEST_INCOMPATIBLE_CODECS_ERROR="manifestIncompatibleCodecsError",e.LEVEL_EMPTY_ERROR="levelEmptyError",e.PLAYLIST_UNCHANGED_ERROR="playlistUnchangedError",e.LEVEL_LOAD_ERROR="levelLoadError",e.LEVEL_LOAD_TIMEOUT="levelLoadTimeOut",e.LEVEL_PARSING_ERROR="levelParsingError",e.LEVEL_SWITCH_ERROR="levelSwitchError",e.AUDIO_TRACK_LOAD_ERROR="audioTrackLoadError",e.AUDIO_TRACK_LOAD_TIMEOUT="audioTrackLoadTimeOut",e.SUBTITLE_LOAD_ERROR="subtitleTrackLoadError",e.SUBTITLE_TRACK_LOAD_TIMEOUT="subtitleTrackLoadTimeOut",e.FRAG_LOAD_ERROR="fragLoadError",e.FRAG_LOAD_TIMEOUT="fragLoadTimeOut",e.FRAG_DECRYPT_ERROR="fragDecryptError",e.FRAG_PARSING_ERROR="fragParsingError",e.FRAG_GAP="fragGap",e.REMUX_ALLOC_ERROR="remuxAllocError",e.KEY_LOAD_ERROR="keyLoadError",e.KEY_LOAD_TIMEOUT="keyLoadTimeOut",e.BUFFER_ADD_CODEC_ERROR="bufferAddCodecError",e.BUFFER_INCOMPATIBLE_CODECS_ERROR="bufferIncompatibleCodecsError",e.BUFFER_APPEND_ERROR="bufferAppendError",e.BUFFER_APPENDING_ERROR="bufferAppendingError",e.BUFFER_APPEND_NO_PROGRESS="bufferAppendNoProgress",e.BUFFER_STALLED_ERROR="bufferStalledError",e.BUFFER_FULL_ERROR="bufferFullError",e.BUFFER_SEEK_OVER_HOLE="bufferSeekOverHole",e.BUFFER_NUDGE_ON_STALL="bufferNudgeOnStall",e.ASSET_LIST_LOAD_ERROR="assetListLoadError",e.ASSET_LIST_LOAD_TIMEOUT="assetListLoadTimeout",e.ASSET_LIST_PARSING_ERROR="assetListParsingError",e.INTERSTITIAL_ASSET_ITEM_ERROR="interstitialAssetItemError",e.INTERNAL_EXCEPTION="internalException",e.INTERNAL_ABORTED="aborted",e.ATTACH_MEDIA_ERROR="attachMediaError",e.MEDIA_SOURCE_REQUIRES_RESET="mediaSourceRequiresReset",e.UNKNOWN="unknown",e}({}),O=function(e){return e.MEDIA_ATTACHING="hlsMediaAttaching",e.MEDIA_ATTACHED="hlsMediaAttached",e.MEDIA_DETACHING="hlsMediaDetaching",e.MEDIA_DETACHED="hlsMediaDetached",e.MEDIA_ENDED="hlsMediaEnded",e.STALL_RESOLVED="hlsStallResolved",e.BUFFER_RESET="hlsBufferReset",e.BUFFER_CODECS="hlsBufferCodecs",e.BUFFER_CREATED="hlsBufferCreated",e.BUFFER_APPENDING="hlsBufferAppending",e.BUFFER_APPENDED="hlsBufferAppended",e.BUFFER_EOS="hlsBufferEos",e.BUFFERED_TO_END="hlsBufferedToEnd",e.BUFFER_FLUSHING="hlsBufferFlushing",e.BUFFER_FLUSHED="hlsBufferFlushed",e.MANIFEST_LOADING="hlsManifestLoading",e.MANIFEST_LOADED="hlsManifestLoaded",e.MANIFEST_PARSED="hlsManifestParsed",e.LEVEL_SWITCHING="hlsLevelSwitching",e.LEVEL_SWITCHED="hlsLevelSwitched",e.LEVEL_LOADING="hlsLevelLoading",e.LEVEL_LOADED="hlsLevelLoaded",e.LEVEL_UPDATED="hlsLevelUpdated",e.LEVEL_PTS_UPDATED="hlsLevelPtsUpdated",e.LEVELS_UPDATED="hlsLevelsUpdated",e.AUDIO_TRACKS_UPDATED="hlsAudioTracksUpdated",e.AUDIO_TRACK_SWITCHING="hlsAudioTrackSwitching",e.AUDIO_TRACK_SWITCHED="hlsAudioTrackSwitched",e.AUDIO_TRACK_LOADING="hlsAudioTrackLoading",e.AUDIO_TRACK_LOADED="hlsAudioTrackLoaded",e.AUDIO_TRACK_UPDATED="hlsAudioTrackUpdated",e.SUBTITLE_TRACKS_UPDATED="hlsSubtitleTracksUpdated",e.SUBTITLE_TRACKS_CLEARED="hlsSubtitleTracksCleared",e.SUBTITLE_TRACK_SWITCH="hlsSubtitleTrackSwitch",e.SUBTITLE_TRACK_LOADING="hlsSubtitleTrackLoading",e.SUBTITLE_TRACK_LOADED="hlsSubtitleTrackLoaded",e.SUBTITLE_TRACK_UPDATED="hlsSubtitleTrackUpdated",e.SUBTITLE_FRAG_PROCESSED="hlsSubtitleFragProcessed",e.CUES_PARSED="hlsCuesParsed",e.NON_NATIVE_TEXT_TRACKS_FOUND="hlsNonNativeTextTracksFound",e.INIT_PTS_FOUND="hlsInitPtsFound",e.FRAG_LOADING="hlsFragLoading",e.FRAG_LOAD_EMERGENCY_ABORTED="hlsFragLoadEmergencyAborted",e.FRAG_LOADED="hlsFragLoaded",e.FRAG_DECRYPTED="hlsFragDecrypted",e.FRAG_PARSING_INIT_SEGMENT="hlsFragParsingInitSegment",e.FRAG_PARSING_USERDATA="hlsFragParsingUserdata",e.FRAG_PARSING_METADATA="hlsFragParsingMetadata",e.FRAG_PARSED="hlsFragParsed",e.FRAG_BUFFERED="hlsFragBuffered",e.FRAG_CHANGED="hlsFragChanged",e.FPS_DROP="hlsFpsDrop",e.FPS_DROP_LEVEL_CAPPING="hlsFpsDropLevelCapping",e.MAX_AUTO_LEVEL_UPDATED="hlsMaxAutoLevelUpdated",e.ERROR="hlsError",e.DESTROYING="hlsDestroying",e.KEY_LOADING="hlsKeyLoading",e.KEY_LOADED="hlsKeyLoaded",e.LIVE_BACK_BUFFER_REACHED="hlsLiveBackBufferReached",e.BACK_BUFFER_REACHED="hlsBackBufferReached",e.STEERING_MANIFEST_LOADED="hlsSteeringManifestLoaded",e.ASSET_LIST_LOADING="hlsAssetListLoading",e.ASSET_LIST_LOADED="hlsAssetListLoaded",e.INTERSTITIALS_UPDATED="hlsInterstitialsUpdated",e.INTERSTITIALS_BUFFERED_TO_BOUNDARY="hlsInterstitialsBufferedToBoundary",e.INTERSTITIAL_ASSET_PLAYER_CREATED="hlsInterstitialAssetPlayerCreated",e.INTERSTITIAL_STARTED="hlsInterstitialStarted",e.INTERSTITIAL_ASSET_STARTED="hlsInterstitialAssetStarted",e.INTERSTITIAL_ASSET_ENDED="hlsInterstitialAssetEnded",e.INTERSTITIAL_ASSET_ERROR="hlsInterstitialAssetError",e.INTERSTITIAL_ENDED="hlsInterstitialEnded",e.INTERSTITIALS_PRIMARY_RESUMED="hlsInterstitialsPrimaryResumed",e.PLAYOUT_LIMIT_REACHED="hlsPlayoutLimitReached",e.EVENT_CUE_ENTER="hlsEventCueEnter",e}({}),M=function(){this.aborted=!1,this.loaded=0,this.retry=0,this.total=0,this.chunkCount=0,this.bwEstimate=0,this.loading={start:0,first:0,end:0},this.parsing={start:0,end:0},this.buffering={start:0,first:0,end:0}},F=function(e){return e.MANIFEST="manifest",e.LEVEL="level",e.AUDIO_TRACK="audioTrack",e.SUBTITLE_TRACK="subtitleTrack",e.MEDIA_FRAGMENT="media-fragment",e.KEY="key",e.STEERING_MANIFEST="steering-manifest",e.SERVER_CERTIFICATE="server-certificate",e.INTERSTITIAL_ASSET_LIST="interstitial-asset-list",e}({}),N=function(e){return e.MAIN="main",e.AUDIO="audio",e.SUBTITLE="subtitle",e}({}),B={AUDIO:"audio",VIDEO:"video",AUDIOVIDEO:"audiovideo"},U=function(){function e(e){var t,r,i;this._byteRange=null,this._url=null,this._stats=null,this._streams=null,this.base=void 0,this.relurl=void 0,"string"==typeof e&&(e={url:e}),this.base=e,(i=W(t=this,r="stats"))&&(i.enumerable=!0,Object.defineProperty(t,r,i))}var t=e.prototype;return t.setByteRange=function(e,t){var r,i=e.split("@",2);r=1===i.length?(null==t?void 0:t.byteRangeEndOffset)||0:parseInt(i[1]),this._byteRange=[r,parseInt(i[0])+r]},t.clearElementaryStreamInfo=function(){var e=this.elementaryStreams;e[B.AUDIO]=null,e[B.VIDEO]=null,e[B.AUDIOVIDEO]=null,this.url=null},a(e,[{key:"baseurl",get:function(){return this.base.url}},{key:"byteRange",get:function(){return null===this._byteRange?[]:this._byteRange}},{key:"byteRangeStartOffset",get:function(){return this.byteRange[0]}},{key:"byteRangeEndOffset",get:function(){return this.byteRange[1]}},{key:"elementaryStreams",get:function(){var e;return null===this._streams&&(this._streams=((e={})[B.AUDIO]=null,e[B.VIDEO]=null,e[B.AUDIOVIDEO]=null,e)),this._streams},set:function(e){this._streams=e}},{key:"hasStats",get:function(){return null!==this._stats}},{key:"hasStreams",get:function(){return null!==this._streams}},{key:"stats",get:function(){return null===this._stats&&(this._stats=new M),this._stats},set:function(e){this._stats=e}},{key:"url",get:function(){return!this._url&&this.relurl&&(this._url=I.buildAbsoluteURL(this.baseurl,this.relurl,{alwaysNormalize:!0})),this._url||""},set:function(e){this._url=e}}])}();function G(e){return"initSegment"!==e.sn}function V(e,t){return e.sn===(null==t?void 0:t.sn)&&e.level===t.level}function H(e,t){return e.sn===(null==t?void 0:t.sn)&&e.level===t.level&&e.cc===t.cc}var K=function(e){function t(t,r){var i;return(i=e.call(this,r)||this)._decryptdata=null,i._programDateTime=null,i._ref=null,i._bitrate=void 0,i.rawProgramDateTime=null,i.tagList=[],i.duration=0,i.sn=0,i.levelkeys=void 0,i.type=void 0,i.loader=null,i.keyLoader=null,i.level=-1,i.cc=0,i.startPTS=void 0,i.endPTS=void 0,i.startDTS=void 0,i.endDTS=void 0,i.start=0,i.playlistOffset=0,i.deltaPTS=void 0,i.maxStartPTS=void 0,i.minEndPTS=void 0,i.data=void 0,i.bitrateTest=!1,i.title=null,i.initSegment=null,i.endList=void 0,i.gap=void 0,i.urlId=0,i.type=t,i}u(t,e);var r=t.prototype;return r.addStart=function(e){this.setStart(this.start+e)},r.setStart=function(e){this.start=e,this._ref&&(this._ref.start=e)},r.setDuration=function(e){this.duration=e,this._ref&&(this._ref.duration=e)},r.setKeyFormat=function(e){var t=this.levelkeys;if(t){var r,i=t[e];!i||null!=(r=this._decryptdata)&&r.keyId||(this._decryptdata=i.getDecryptData(this.sn,t))}},r.abortRequests=function(){var e,t;null==(e=this.loader)||e.abort(),null==(t=this.keyLoader)||t.abort()},r.setElementaryStreamInfo=function(e,t,r,i,a,n){void 0===n&&(n=!1);var s=this.elementaryStreams,o=s[e];o?(o.startPTS=Math.min(o.startPTS,t),o.endPTS=Math.max(o.endPTS,r),o.startDTS=Math.min(o.startDTS,i),o.endDTS=Math.max(o.endDTS,a)):s[e]={startPTS:t,endPTS:r,startDTS:i,endDTS:a,partial:n}},a(t,[{key:"byteLength",get:function(){if(this.hasStats){var e=this.stats.total;if(e)return e}if(this.byteRange.length){var t=this.byteRange[0],r=this.byteRange[1];if(_(t)&&_(r))return r-t}return null}},{key:"bitrate",get:function(){return this.byteLength?8*this.byteLength/this.duration:this._bitrate?this._bitrate:null},set:function(e){this._bitrate=e}},{key:"decryptdata",get:function(){var e,t=this.levelkeys;if(!t||t.NONE)return null;if(t.identity)this._decryptdata||(this._decryptdata=t.identity.getDecryptData(this.sn));else if(null==(e=this._decryptdata)||!e.keyId){var r=Object.keys(t);if(1===r.length){var i=this._decryptdata=t[r[0]]||null;i&&(this._decryptdata=i.getDecryptData(this.sn,t))}}return this._decryptdata}},{key:"end",get:function(){return this.start+this.duration}},{key:"endProgramDateTime",get:function(){if(null===this.programDateTime)return null;var e=_(this.duration)?this.duration:0;return this.programDateTime+1e3*e}},{key:"encrypted",get:function(){var e;if(null!=(e=this._decryptdata)&&e.encrypted)return!0;if(this.levelkeys){var t,r=Object.keys(this.levelkeys),i=r.length;if(i>1||1===i&&null!=(t=this.levelkeys[r[0]])&&t.encrypted)return!0}return!1}},{key:"programDateTime",get:function(){return null===this._programDateTime&&this.rawProgramDateTime&&(this.programDateTime=Date.parse(this.rawProgramDateTime)),this._programDateTime},set:function(e){_(e)?this._programDateTime=e:this._programDateTime=this.rawProgramDateTime=null}},{key:"ref",get:function(){return G(this)?(this._ref||(this._ref={base:this.base,start:this.start,duration:this.duration,sn:this.sn,programDateTime:this.programDateTime}),this._ref):null}}])}(U),Y=function(e){function t(t,r,i,a,n){var s;(s=e.call(this,i)||this).fragOffset=0,s.duration=0,s.independent=!1,s.relurl=void 0,s.fragment=void 0,s.index=void 0,s.gap=!1,s.duration=t.decimalFloatingPoint("DURATION"),s.gap=t.bool("GAP"),s.independent=t.bool("INDEPENDENT"),s.relurl=t.enumeratedString("URI"),s.fragment=r,s.index=a;var o=t.enumeratedString("BYTERANGE");return o&&s.setByteRange(o,n),n&&(s.fragOffset=n.fragOffset+n.duration),s}return u(t,e),a(t,[{key:"start",get:function(){return this.fragment.start+this.fragOffset}},{key:"end",get:function(){return this.start+this.duration}},{key:"loaded",get:function(){var e=this.elementaryStreams;return!!(e.audio||e.video||e.audiovideo||this.fragment.type===N.SUBTITLE&&this.stats.loading.end>0)}}])}(U);function W(e,t){var r=Object.getPrototypeOf(e);if(r){var i=Object.getOwnPropertyDescriptor(r,t);return i||W(r,t)}}function j(e){switch(e.details){case w.FRAG_LOAD_TIMEOUT:case w.KEY_LOAD_TIMEOUT:case w.LEVEL_LOAD_TIMEOUT:case w.MANIFEST_LOAD_TIMEOUT:case w.AUDIO_TRACK_LOAD_TIMEOUT:case w.SUBTITLE_TRACK_LOAD_TIMEOUT:case w.ASSET_LIST_LOAD_TIMEOUT:return!0}return!1}function q(e){return e.details.startsWith("key")}function X(e){return q(e)&&!!e.frag&&!e.frag.decryptdata}function z(e,t){var r=j(t);return e.default[(r?"timeout":"error")+"Retry"]}function Q(e,t){var r="linear"===e.backoff?1:Math.pow(2,t);return Math.min(r*e.retryDelayMs,e.maxRetryDelayMs)}function $(e){return f(f({},e),{errorRetry:null,timeoutRetry:null})}function Z(e,t,r,i){if(!e)return!1;var a=null==i?void 0:i.code,n=t<e.maxNumRetry&&(function(e){return J(e)||!!e&&(e<400||e>499)}(a)||!!r);return e.shouldRetry?e.shouldRetry(e,t,r,i,n):n}function J(e){return 0===e&&!1===navigator.onLine}function ee(e,t){return t>0&&e.loadError>0&&0!==e.loadErrorTime&&self.performance.now()-e.loadErrorTime>t}var te=function(){function e(e,t,r){void 0===t&&(t=0),void 0===r&&(r=0),this.halfLife=void 0,this.alpha_=void 0,this.estimate_=void 0,this.totalWeight_=void 0,this.halfLife=e,this.alpha_=e?Math.exp(Math.log(.5)/e):0,this.estimate_=t,this.totalWeight_=r}var t=e.prototype;return t.sample=function(e,t){var r=Math.pow(this.alpha_,e);this.estimate_=t*(1-r)+r*this.estimate_,this.totalWeight_+=e},t.getTotalWeight=function(){return this.totalWeight_},t.getEstimate=function(){if(this.alpha_){var e=1-Math.pow(this.alpha_,this.totalWeight_);if(e)return this.estimate_/e}return this.estimate_},e}(),re=function(){function e(e,t,r,i){void 0===i&&(i=100),this.defaultEstimate_=void 0,this.minWeight_=void 0,this.minDelayMs_=void 0,this.slow_=void 0,this.fast_=void 0,this.defaultTTFB_=void 0,this.ttfb_=void 0,this.defaultEstimate_=r,this.minWeight_=.001,this.minDelayMs_=50,this.slow_=new te(e),this.fast_=new te(t),this.defaultTTFB_=i,this.ttfb_=new te(e)}var t=e.prototype;return t.update=function(e,t){var r=this.slow_,i=this.fast_,a=this.ttfb_;r.halfLife!==e&&(this.slow_=new te(e,r.getEstimate(),r.getTotalWeight())),i.halfLife!==t&&(this.fast_=new te(t,i.getEstimate(),i.getTotalWeight())),a.halfLife!==e&&(this.ttfb_=new te(e,a.getEstimate(),a.getTotalWeight()))},t.sample=function(e,t){if(!(t<=0)){var r=Math.min(this.minDelayMs_,t/1e5),i=8*t,a=Math.max(e,r)/1e3,n=i/a;this.fast_.sample(a,n),this.slow_.sample(a,n)}},t.sampleTTFB=function(e){var t=e/1e3,r=Math.sqrt(2)*Math.exp(-Math.pow(t,2)/2);this.ttfb_.sample(r,Math.max(e,5))},t.canEstimate=function(){return this.fast_.getTotalWeight()>=this.minWeight_},t.getEstimate=function(){return this.canEstimate()?Math.min(this.fast_.getEstimate(),this.slow_.getEstimate()):this.defaultEstimate_},t.getEstimateTTFB=function(){return this.ttfb_.getTotalWeight()>=this.minWeight_?this.ttfb_.getEstimate():this.defaultTTFB_},t.destroy=function(){},a(e,[{key:"defaultEstimate",get:function(){return this.defaultEstimate_}}])}(),ie=function(e,t){this.trace=void 0,this.debug=void 0,this.log=void 0,this.warn=void 0,this.info=void 0,this.error=void 0;var r="["+e+"]:";this.trace=ae,this.debug=t.debug.bind(null,r),this.log=t.log.bind(null,r),this.warn=t.warn.bind(null,r),this.info=t.info.bind(null,r),this.error=t.error.bind(null,r)},ae=function(){},ne={trace:ae,debug:ae,log:ae,warn:ae,info:ae,error:ae};function se(){return o({},ne)}function oe(e,t,r){return t[e]?t[e].bind(t):function(e,t){var r=self.console[e];return r?r.bind(self.console,(t?"["+t+"] ":"")+"["+e+"] >"):ae}(e,r)}var le=se();function ue(e,t,r){var i=se();if("object"==typeof console&&!0===e||"object"==typeof e){var a=["debug","log","info","warn","error"];a.forEach((function(t){i[t]=oe(t,e,r)}));try{i.log('Debug logs enabled for "'+t+'" in hls.js version 1.7.3')}catch(e){return se()}a.forEach((function(t){le[t]=oe(t,e)}))}else o(le,i);return i}var de,he,fe=le,ce=he?de:(he=1,de=void 0),ge=S(ce);function ve(e){if(void 0===e&&(e=!0),"undefined"!=typeof self)return(e||!self.MediaSource)&&self.ManagedMediaSource||self.MediaSource||self.WebKitMediaSource}function me(e,t){return t+10<=e.length&&73===e[t]&&68===e[t+1]&&51===e[t+2]&&e[t+3]<255&&e[t+4]<255&&e[t+6]<128&&e[t+7]<128&&e[t+8]<128&&e[t+9]<128}function pe(e,t){var r=0;return r=(127&e[t])<<21,r|=(127&e[t+1])<<14,r|=(127&e[t+2])<<7,r|=127&e[t+3]}function ye(e,t){return me(e,t)&&pe(e,t+6)+10<=e.length-t}function Ee(e,t){return t+10<=e.length&&51===e[t]&&68===e[t+1]&&73===e[t+2]&&e[t+3]<255&&e[t+4]<255&&e[t+6]<128&&e[t+7]<128&&e[t+8]<128&&e[t+9]<128}function Te(e,t){for(var r=t,i=0;me(e,t);)i+=10,i+=pe(e,t+6),Ee(e,t+10)&&(i+=10),t+=i;if(i>0)return e.subarray(r,r+i)}function Se(e,t,r){return void 0===t&&(t=0),void 0===r&&(r=1/0),function(e,t,r,i){var a,n=m(a=e)?a:a.buffer,s=1;"BYTES_PER_ELEMENT"in i&&(s=i.BYTES_PER_ELEMENT);var o,l=(o=e)&&m(o.buffer)&&void 0!==o.byteLength&&void 0!==o.byteOffset?e.byteOffset:0,u=(l+e.byteLength)/s,d=(l+t)/s,h=Math.floor(Math.max(0,Math.min(d,u)));return new i(n,h,Math.floor(Math.min(h+Math.max(r,0),u))-h)}(e,t,r,Uint8Array)}function Le(e,t){void 0===t&&(t=!1);var r=t?e.indexOf(0):e.length,i=function(e,t){var r;void 0===t&&(t={}),r=m(e)?new DataView(e):new DataView(e.buffer,e.byteOffset,e.byteLength);var i=0,a=t.encoding;if(!a){var n=r.getUint8(0),s=r.getUint8(1);239==n&&187==s&&191==r.getUint8(2)?(a=T,i=3):254==n&&255==s?(a=y,i=2):255==n&&254==s?(a=E,i=2):a=T}if("undefined"!=typeof TextDecoder)return new TextDecoder(a).decode(r);for(var o,l=r.byteLength,u=a!==y,d="";i<l;){switch(a){case T:if((o=r.getUint8(i))<128)i++;else if(o>=194&&o<=223)if(i+1<l){var h=r.getUint8(i+1);h>=128&&h<=191?(o=(31&o)<<6|63&h,i+=2):i++}else i++;else if(o>=224&&o<=239)if(i+2<=l-1){var f=r.getUint8(i+1),c=r.getUint8(i+2);f>=128&&f<=191&&c>=128&&c<=191?(o=(15&o)<<12|(63&f)<<6|63&c,i+=3):i++}else i++;else if(o>=240&&o<=244)if(i+3<=l-1){var g=r.getUint8(i+1),v=r.getUint8(i+2),S=r.getUint8(i+3);g>=128&&g<=191&&v>=128&&v<=191&&S>=128&&S<=191?(o=(7&o)<<18|(63&g)<<12|(63&v)<<6|63&S,i+=4):i++}else i++;else i++;break;case y:case p:case E:o=r.getUint16(i,u),i+=2}d+=String.fromCodePoint(o)}return d}(new DataView(e.buffer,e.byteOffset,r),{encoding:T});return t?i:i.replace(/\0/g,"")}function Re(e){var t={key:e.type,description:"",data:"",mimeType:null,pictureType:null};if(!(e.size<2))if(3===e.data[0]){var r=e.data.subarray(1).indexOf(0);if(-1!==r){var i=Le(Se(e.data,1,r)),a=e.data[2+r],n=e.data.subarray(3+r).indexOf(0);if(-1!==n){var s,o,l=Le(Se(e.data,3+r,n));return s="--\x3e"===i?Le(Se(e.data,4+r+n)):m(o=e.data.subarray(4+r+n))?o:0==o.byteOffset&&o.byteLength==o.buffer.byteLength?o.buffer:new Uint8Array(o).buffer,t.mimeType=i,t.pictureType=a,t.description=l,t.data=s,t}}}else console.log("Ignore frame with unrecognized character encoding")}function Ae(e){return"PRIV"===e.type?function(e){if(!(e.size<2)){var t=Le(e.data,!0),r=new Uint8Array(e.data.subarray(t.length+1));return{key:e.type,info:t,data:r.buffer}}}(e):"W"===e.type[0]?function(e){if("WXXX"===e.type){if(e.size<2)return;var t=1,r=Le(e.data.subarray(t),!0);t+=r.length+1;var i=Le(e.data.subarray(t));return{key:e.type,info:r,data:i}}var a=Le(e.data);return{key:e.type,info:"",data:a}}(e):"APIC"===e.type?Re(e):function(e){if(!(e.size<2)){if("TXXX"===e.type){var t=1,r=e.data,i=Le(r.subarray(t),!0);t+=i.length+1;var a=Le(r.subarray(t));return{key:e.type,info:i,data:a}}var n=Le(e.data.subarray(1));return{key:e.type,info:"",data:n}}}(e)}function be(e){var t=String.fromCharCode(e[0],e[1],e[2],e[3]),r=pe(e,4);return{type:t,size:r,data:e.subarray(10,10+r)}}var ke=10,De=10;function Ie(e){for(var t=0,r=[];me(e,t);){var i=pe(e,t+6);e[t+5]>>6&1&&(t+=ke);for(var a=(t+=ke)+i;t+De<a;){var n=be(e.subarray(t)),s=Ae(n);s&&r.push(s),t+=n.size+ke}Ee(e,t)&&(t+=ke)}return r}function _e(e){return e&&"PRIV"===e.key&&"com.apple.streaming.transportStreamTimestamp"===e.info}function Ce(e){if(8===e.data.byteLength){var t=new Uint8Array(e.data),r=1&t[3],i=(t[4]<<23)+(t[5]<<15)+(t[6]<<7)+t[7];return i/=45,r&&(i+=47721858.84),Math.round(i)}}function Pe(e){for(var t,r=n(Ie(e));!(t=r()).done;){var i=t.value;if(_e(i))return Ce(i)}}function xe(e){for(var t="",r=0;r<e.length;r++){var i=e[r].toString(16);i.length<2&&(i="0"+i),t+=i}return t}function we(e){return Uint8Array.from(e.replace(/^0x/,"").replace(/([\da-fA-F]{2}) ?/g,"0x$1 ").replace(/ +$/,"").split(" ")).buffer}function Oe(e){return String.fromCharCode.apply(null,e)}var Me,Fe=Math.pow(2,32)-1,Ne={avc1:1635148593,avcC:1635148611,hvc1:1752589105,hvcC:1752589123,btrt:1651798644,dinf:1684631142,dref:1685218662,esds:1702061171,free:1718773093,ftyp:1718909296,hdlr:1751411826,mdat:1835295092,mdhd:1835296868,mdia:1835297121,mfhd:1835427940,minf:1835626086,moof:1836019558,moov:1836019574,mp4a:1836069985,".mp3":778924083,dac3:1684103987,"ac-3":1633889587,mvex:1836475768,mvhd:1836476516,pasp:1885434736,sdtp:1935963248,stbl:1937007212,stco:1937007471,stsc:1937011555,stsd:1937011556,stsz:1937011578,stts:1937011827,tfdt:1952867444,tfhd:1952868452,traf:1953653094,trak:1953653099,trun:1953658222,trex:1953654136,tkhd:1953196132,vmhd:1986881636,smhd:1936549988},Be={video:1,audio:2,id3:3,text:4};function Ue(e,t){var r=e[t]<<8|e[t+1];return r<0?65536+r:r}function Ge(e,t){var r=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3];return r<0?4294967296+r:r}function Ve(e,t){var r=Ge(e,t);return r*=Math.pow(2,32),r+=Ge(e,t+4)}function He(e,t){for(var r="",i=t;i<e.length;i++)if(r+=String.fromCharCode(e[i]),0===e[i])return r;return null}function Ke(e,t){return e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3]}function Ye(e,t,r){e[t]=r>>24,e[t+1]=r>>16&255,e[t+2]=r>>8&255,e[t+3]=255&r}function We(e,t){var r=[];return t.length?(je(e,t,0,0,e.byteLength,r),r):r}function je(e,t,r,i,a,n){var s=t[r];if(4===(null==s?void 0:s.length))for(var o=s.charCodeAt(0),l=s.charCodeAt(1),u=s.charCodeAt(2),d=s.charCodeAt(3),h=t.length-1,f=i;f<a;){var c=f+8<=a,g=f+4<=a?16777216*e[f]+(e[f+1]<<16|e[f+2]<<8|e[f+3]):Ge(e,f),v=g>1?f+g:a;if(c&&e[f+4]===o&&e[f+5]===l&&e[f+6]===u&&e[f+7]===d){var m=Math.min(v,a);r===h?n.push(e.subarray(f+8,m)):je(e,t,r+1,f+8,m,n)}f=v}}function qe(e){var t=[],r=e[0],i=8,a=Ge(e,i);i+=4;var n=0,s=0;0===r?(n=Ge(e,i),s=Ge(e,i+4),i+=8):(n=Ve(e,i),s=Ve(e,i+8),i+=16),i+=2;var o=e.length+s,l=Ue(e,i);i+=2;for(var u=0;u<l;u++){var d=i,h=Ge(e,d);d+=4;var f=2147483647&h;if(1==(2147483648&h)>>>31)return fe.warn("SIDX has hierarchical references (not supported)"),null;var c=Ge(e,d);d+=4,t.push({referenceSize:f,subsegmentDuration:c,info:{duration:c/a,start:o,end:o+f-1}}),o+=f,i=d+=4}return{earliestPresentationTime:n,timescale:a,version:r,referencesCount:l,references:t}}function Xe(e){for(var t=[],r=We(e,["moov","trak"]),i=0;i<r.length;i++){var a=r[i],n=We(a,["tkhd"])[0];if(n){var s=n[0],o=Ge(n,0===s?12:20),l=We(a,["mdia","mdhd"])[0];if(l){var u=Ge(l,0===(s=l[0])?12:20),d=We(a,["mdia","hdlr"])[0];if(d){var h=Oe(d.subarray(8,12)),c={soun:B.AUDIO,vide:B.VIDEO}[h],g=ze(We(a,["mdia","minf","stbl","stsd"])[0]);c?(t[o]={timescale:u,type:c,stsd:g},t[c]=f({timescale:u,id:o},g)):t[o]={timescale:u,type:h,stsd:g}}}}}return We(e,["moov","mvex","trex"]).forEach((function(e){var r=Ge(e,4),i=t[r];i&&(i.default={duration:Ge(e,12),sampleSize:Ge(e,16),flags:Ge(e,20)})})),t}function ze(e){var t,r=e.subarray(8),i=r.subarray(86),a=Oe(r.subarray(4,8)),n=a,s="enca"===a||"encv"===a;if(s){var o=We(r,[a])[0];We(o.subarray("enca"===a?28:78),["sinf"]).forEach((function(e){var t=We(e,["schm"])[0];if(t){var r=Oe(t.subarray(4,8));if("cbcs"===r||"cenc"===r){var i=We(e,["frma"])[0];i&&(n=Oe(i))}}}))}var l=n;switch(n){case"avc1":case"avc2":case"avc3":case"avc4":var u=We(i,["avcC"])[0];u&&u.length>3&&(n+="."+Ze(u[1])+Ze(u[2])+Ze(u[3]),t=Qe("avc1"===l?"dva1":"dvav",i));break;case"mp4a":var d=We(r,[a])[0],h=We(d.subarray(28),["esds"])[0];if(h&&h.length>7){var f=4;if(3!==h[f++])break;f=$e(h,f),f+=2;var c=h[f++];if(128&c&&(f+=2),64&c&&(f+=h[f++]),4!==h[f++])break;f=$e(h,f);var g=h[f++];if(64!==g)break;if(n+="."+Ze(g),f+=12,5!==h[f++])break;f=$e(h,f);var v=h[f++],m=(248&v)>>3;31===m&&(m+=1+((7&v)<<3)+((224&h[f])>>5)),n+="."+m}break;case"hvc1":case"hev1":var p=We(i,["hvcC"])[0];if(p&&p.length>12){var y=p[1],E=["","A","B","C"][y>>6],T=31&y,S=Ge(p,2),L=(32&y)>>5?"H":"L",R=p[12],A=p.subarray(6,12);n+="."+E+T,n+="."+function(e){for(var t=0,r=0;r<32;r++)t|=(e>>r&1)<<31-r;return t>>>0}(S).toString(16).toUpperCase(),n+="."+L+R;for(var b="",k=A.length;k--;){var D=A[k];(D||b)&&(b="."+D.toString(16).toUpperCase()+b)}n+=b}t=Qe("hev1"==l?"dvhe":"dvh1",i);break;case"dvh1":case"dvhe":case"dvav":case"dva1":case"dav1":n=Qe(n,i)||n;break;case"vp09":var I=We(i,["vpcC"])[0];if(I&&I.length>6){var _=I[4],C=I[5],P=I[6]>>4&15;n+="."+Je(_)+"."+Je(C)+"."+Je(P)}break;case"av01":var x=We(i,["av1C"])[0];if(x&&x.length>2){var w=x[1]>>>5,O=31&x[1],M=x[2]>>>7?"H":"M",F=(64&x[2])>>6,N=(32&x[2])>>5,B=2===w&&F?N?12:10:F?10:8,U=(16&x[2])>>4,G=(8&x[2])>>3,V=(4&x[2])>>2,H=3&x[2];n+="."+w+"."+Je(O)+M+"."+Je(B)+"."+U+"."+G+V+H+"."+Je(1)+"."+Je(1)+"."+Je(1)+".0",t=Qe("dav1",i)}}return{codec:n,encrypted:s,supplemental:t}}function Qe(e,t){var r=We(t,["dvvC"]),i=r.length?r[0]:We(t,["dvcC"])[0];if(i){var a=i[2]>>1&127,n=i[2]<<5&32|i[3]>>3&31;return e+"."+Je(a)+"."+Je(n)}}function $e(e,t){for(var r=t+5;128&e[t++]&&t<r;);return t}function Ze(e){return("0"+e.toString(16).toUpperCase()).slice(-2)}function Je(e){return(e<10?"0":"")+e}function et(e,t){We(e,["moov","trak"]).forEach((function(e){var r=We(e,["mdia","minf","stbl","stsd"])[0];if(r){var i=r.subarray(8),a=We(i,["enca"]),n=a.length>0;n||(a=We(i,["encv"])),a.forEach((function(e){We(n?e.subarray(28):e.subarray(78),["sinf"]).forEach((function(e){var r=function(e){var t=We(e,["schm"])[0];if(t){var r=Oe(t.subarray(4,8));if("cbcs"===r||"cenc"===r){var i=We(e,["schi","tenc"])[0];if(i)return i}}}(e);r&&t(r,n)}))}))}}))}function tt(e){return"undefined"==typeof TextDecoder?Le(e):(Me||(Me=new TextDecoder("utf-8"))).decode(e).replace(/\0/g,"")}function rt(e,t,r,i,a){for(var n={},s=!1,o=function(e){for(var t=e.byteLength,r=[],i=0;i<t;){var a=i+8<=t,n=i+4<=t?16777216*e[i]+(e[i+1]<<16|e[i+2]<<8|e[i+3]):Ge(e,i),s=n>1?i+n:t;if(a&&109===e[i+4]&&111===e[i+5]&&111===e[i+6]&&102===e[i+7])for(var o=Math.min(s,t),l=i+8;l<o;){var u=l+8<=o,d=l+4<=o?16777216*e[l]+(e[l+1]<<16|e[l+2]<<8|e[l+3]):Ge(e,l),h=d>1?l+d:o;if(u&&116===e[l+4]&&114===e[l+5]&&97===e[l+6]&&102===e[l+7]){for(var f=Math.min(h,o),c=void 0,g=void 0,v=[],m=l+8;m<f;){var p=m+8<=f,y=m+4<=f?16777216*e[m]+(e[m+1]<<16|e[m+2]<<8|e[m+3]):Ge(e,m),E=y>1?m+y:f;if(p&&116===e[m+4]){var T=Math.min(E,f);102===e[m+5]&&104===e[m+6]&&100===e[m+7]?g||(g=e.subarray(m+8,T)):102===e[m+5]&&100===e[m+6]&&116===e[m+7]?c||(c=e.subarray(m+8,T)):114===e[m+5]&&117===e[m+6]&&110===e[m+7]&&v.push(e.subarray(m+8,T))}m=E}r.push({moofOffset:e.byteOffset+i,tfdt:c,tfhd:g,truns:v})}l=h}i=s}return r}(e),l=e.byteLength,u=0;u<o.length;u++){var d=o[u],h=d.moofOffset,f=d.tfdt,c=d.tfhd,g=d.truns,v=Ge(c,4),m=t[v];if(m){var p=n[v]||(n[v]={start:NaN,duration:0,sampleCount:0,trun:[],timescale:m.timescale,type:m.type}),y=void 0;if(f){var E=f[0];y=Ge(f,4),1===E&&(y===Fe?r.warn("[mp4-demuxer]: Ignoring assumed invalid signed 64-bit track fragment decode time"):(y*=Fe+1,y+=Ge(f,8))),_(y)&&(!_(p.start)||y<p.start)&&(p.start=y),a&&_(y)&&(a.timeOffset=y/a.timescale)}var T=(null==a?void 0:a.trackId)===v&&m.type===B.VIDEO,S=m.default,L=16777215&Ge(c,0),R=(null==S?void 0:S.duration)||0,A=(null==S?void 0:S.sampleSize)||0,b=8;1&L&&(b+=8),2&L&&(b+=4),8&L&&(R=Ge(c,b),c.byteOffset,e.byteOffset,b+=4),16&L&&(A=Ge(c,b));var k=0,D=0!=(1&L),I=!D&&0!=(131072&L);D?(k=Ge(c,8),k*=Math.pow(2,32),k+=Ge(c,12)):I&&(k=h);for(var C=y||0,P=0,x=R,w=0;w<g.length;w++){var O=g[w],M=Ge(O,4),F=p.sampleCount;p.sampleCount+=M;var N=1&O[3],U=0,G=4&O[3],V=1&O[2],H=2&O[2],K=4&O[2],Y=8&O[2],W=8;N&&(U=Ke(O,W),W+=4),G&&(1&O[W+1]||void 0!==p.keyFrameIndex||(p.keyFrameIndex=F),W+=4);var j=k+U;if(0!==O[1]||6!==O[2]||1!==O[3]){for(var q=void 0,X=0;X<M;X++){V?(x=Ge(O,W),W+=4):x=R,H?(q=Ge(O,W),W+=4):q=A;var z=void 0;K&&(z=1&O[W+1]?1:0,W+=4);var Q=0;if(Y&&(Q=0===O[0]?Ge(O,W):Ke(O,W),W+=4),T){for(var $=j,Z=0;Z<q;){var J=Ge(e,$);$+=4,nt(a.isHEVCFlavor,e[$])&&st(e.subarray($,$+J),a.isHEVCFlavor?2:1,a.timeOffset+Q/a.timescale,a.samples),$+=J,Z+=J+4}a.timeOffset+=x/a.timescale}if((j+=q)<=l){0===z&&void 0===p.keyFrameIndex&&(p.keyFrameIndex=X,p.keyFrameStart=C);var ee=C+Q;(!_(p.ptsMin)||ee<p.ptsMin)&&(p.ptsMin=ee),(!_(p.ptsMax)||ee+x>p.ptsMax)&&(p.ptsMax=ee+x)}C+=x,P+=x}!P&&R&&(P+=R*M)}else{for(var te,re,ie=C,ae=j,ne=W,se=-1,oe=0,le=0,ue=null!=(te=null==a?void 0:a.timeOffset)?te:0,de=R/(null!=(re=null==a?void 0:a.timescale)?re:1),he=!0===(null==a?void 0:a.isHEVCFlavor),fe=he?2:1,ce=0;ce<M;ce++){var ge=0===O[W]?O[W+1]<<16|O[W+2]<<8|O[W+3]:Ge(O,W),ve=-1===se&&void 0===p.keyFrameIndex&&0==(1&O[W+5]);W+=8;var me=j+ge;if(T){if(ge>0){var pe=j;do{var ye=0===e[pe]?e[pe+1]<<16|e[pe+2]<<8|e[pe+3]:Ge(e,pe),Ee=e[pe+=4],Te=he?Ee>>1&63:31&Ee;(he?39===Te||40===Te:6===Te)&&st(e.subarray(pe,pe+ye),fe,ue,a.samples),pe+=ye}while(pe<me)}ue+=de}j=me,ve&&(se=ce,oe=j)}if(j<=l)le=M;else for(var Se=ae,Le=ne,Re=0;Re<M&&!((Se+=0===O[Le]?O[Le+1]<<16|O[Le+2]<<8|O[Le+3]:Ge(O,Le))>l);Re++)le=Re+1,Le+=8;if(T&&(a.timeOffset=ue),-1!==se&&oe<=l&&void 0===p.keyFrameIndex&&(p.keyFrameIndex=se,p.keyFrameStart=ie+se*R),le){(!_(p.ptsMin)||ie<p.ptsMin)&&(p.ptsMin=ie);var Ae=ie+le*R;(!_(p.ptsMax)||Ae>p.ptsMax)&&(p.ptsMax=Ae)}var be=R*M;C=ie+be,P+=be}}p.duration+=P,p.duration&&(s=!0)}}if(!s){for(var ke=1/0,De=0,Ie=We(e,["sidx"]),_e=0;_e<Ie.length;_e++){var Ce=qe(Ie[_e]);if(null!=Ce&&Ce.references){ke=Math.min(ke,Ce.earliestPresentationTime/Ce.timescale);var Pe=Ce.references.reduce((function(e,t){return e+t.info.duration||0}),0);De=Math.max(De,Pe+Ce.earliestPresentationTime/Ce.timescale)}}De&&_(De)&&Object.keys(n).forEach((function(e){n[e].duration||(n[e].duration=De*n[e].timescale-n[e].start)}))}return n}function it(e,t){var r=new Uint8Array(e.length+t.length);return r.set(e),r.set(t,e.length),r}function at(e){if(!e)return!1;var t=e.substring(0,4);return"hvc1"===t||"hev1"===t||"dvh1"===t||"dvhe"===t}function nt(e,t){if(e){var r=t>>1&63;return 39===r||40===r}return 6==(31&t)}function st(e,t,r,i){var a=ot(e),n=0;n+=t;for(var s=0,o=0,l=0;n<a.length;){s=0;do{if(n>=a.length)break;s+=l=a[n++]}while(255===l);o=0;do{if(n>=a.length)break;o+=l=a[n++]}while(255===l);var u=a.length-n,d=n;if(o<u)n+=o;else if(o>u){fe.error("Malformed SEI payload. "+o+" is too small, only "+u+" bytes left to parse.");break}if(4===s){if(181===a[d++]){var h=Ue(a,d);if(d+=2,49===h){var f=Ge(a,d);if(d+=4,1195456820===f){var c=a[d++];if(3===c){var g=a[d++],v=64&g,m=v?2+3*(31&g):0,p=new Uint8Array(m);if(v){p[0]=g;for(var y=1;y<m;y++)p[y]=a[d++]}i.push({type:c,payloadType:s,pts:r,bytes:p})}}}}}else if(5===s&&o>16){for(var E=[],T=0;T<16;T++){var S=a[d++].toString(16);E.push(1==S.length?"0"+S:S),3!==T&&5!==T&&7!==T&&9!==T||E.push("-")}for(var L=o-16,R=new Uint8Array(L),A=0;A<L;A++)R[A]=a[d++];i.push({payloadType:s,pts:r,uuid:E.join(""),userData:tt(R),userDataBytes:R})}}}function ot(e){for(var t,r=e.byteLength,i=e.indexOf(3,3);-1!==i;)0===e[i-1]&&0===e[i-2]&&(t||(t=[])).push(i),i=e.indexOf(3,i+1);if(!t)return e;for(var a=r-t.length,n=new Uint8Array(a),s=0,o=0,l=0;l<a;o++,l++)o===t[s]&&(o++,s++),n[l]=e[o];return n}var lt,ut,dt,ht=ft("userAgent");function ft(e){try{return navigator[e]||""}catch(e){}return""}function ct(){if(void 0===lt){var e=ht.match(/Chrome\/(\d+)/i);lt=e?parseInt(e[1]):0}return lt}ft("vendor");var gt={audio:{a3ds:1,"ac-3":.95,"ac-4":1,alac:.9,alaw:1,dra1:1,"dts+":1,"dts-":1,dtsc:1,dtse:1,dtsh:1,"ec-3":.9,enca:1,fLaC:.9,flac:.9,FLAC:.9,g719:1,g726:1,m4ae:1,mha1:1,mha2:1,mhm1:1,mhm2:1,mlpa:1,mp4a:1,"raw ":1,Opus:1,opus:1,samr:1,sawb:1,sawp:1,sevc:1,sqcp:1,ssmv:1,twos:1,ulaw:1},video:{avc1:1,avc2:1,avc3:1,avc4:1,avcp:1,av01:.8,dav1:.8,drac:1,dva1:1,dvav:1,dvh1:.7,dvhe:.7,encv:1,hev1:.75,hvc1:.75,mjp2:1,mp4v:1,mvc1:1,mvc2:1,mvc3:1,mvc4:1,resv:1,rv60:1,s263:1,svc1:1,svc2:1,"vc-1":1,vp08:1,vp09:.9},text:{stpp:1,wvtt:1},image:{mjpg:1}};function vt(e,t){var r=gt[t];return!!r&&!!r[e.slice(0,4)]}function mt(e,t,r){return void 0===r&&(r=!0),!e.split(",").some((function(e){return!pt(e,t,r)}))}function pt(e,t,r){var i;void 0===r&&(r=!0);var a=ve(r);return null!=(i=null==a?void 0:a.isTypeSupported(yt(e,t)))&&i}function yt(e,t){return t+"/mp4;codecs="+e}function Et(e){if(e){var t=e.substring(0,4);return gt.video[t]}return 2}function Tt(e){var t=/\(Windows.+Firefox\//i.test(ht);return e.split(",").reduce((function(e,r){var i=t&&at(r)?9:gt.video[r];return i?(2*i+e)/(e?3:2):(gt.audio[r]+e)/(e?2:1)}),0)}var St={},Lt=/flac|opus|mp4a\.40\.34/i;function Rt(e,t){return void 0===t&&(t=!0),e.replace(Lt,(function(e){return function(e,t){if(void 0===t&&(t=!0),St[e])return St[e];for(var r={flac:["flac","fLaC","FLAC"],opus:["opus","Opus"],"mp4a.40.34":["mp3"]}[e],i=0;i<r.length;i++){var a;if(pt(r[i],"audio",t))return St[e]=r[i],r[i];if("mp3"===r[i]&&null!=(a=ve(t))&&a.isTypeSupported("audio/mpeg"))return""}return e}(e.toLowerCase(),t)}))}function At(e,t){if(e&&(e.length>4||-1!==["ac-3","ec-3","alac","fLaC","Opus"].indexOf(e))&&(bt(e,"audio")||bt(e,"video")))return e;if(t){var r=t.split(",");if(r.length>1){if(e)for(var i=r.length;i--;)if(r[i].substring(0,4)===e.substring(0,4))return r[i];return r[0]}}return t||e}function bt(e,t){return vt(e,t)&&pt(e,t)}function kt(e){var t=ve(e)||{isTypeSupported:function(){return!1}};return{mpeg:t.isTypeSupported("audio/mpeg"),mp3:t.isTypeSupported('audio/mp4; codecs="mp3"'),ac3:!1}}function Dt(e,t,r){var i=encodeURIComponent(t),a=i+"="+encodeURIComponent(r),n=!1,s=[];e.search.substring(1).split("&").forEach((function(e){e===i||e.startsWith(i+"=")?n||(s.push(a),n=!0):e&&s.push(e)})),n||s.push(a),e.search=s.join("&")}var It=["NONE","TYPE-0","TYPE-1",null],_t=["SDR","PQ","HLG"],Ct="",Pt="YES",xt="v2";function wt(e){var t=e.canSkipUntil,r=e.canSkipDateRanges,i=e.age;return t&&i<t/2?r?xt:Pt:Ct}var Ot=function(){function e(e,t,r){this.msn=void 0,this.part=void 0,this.skip=void 0,this.msn=e,this.part=t,this.skip=r}return e.prototype.addDirectives=function(e){var t=new self.URL(e);return void 0!==this.msn&&Dt(t,"_HLS_msn",this.msn.toString()),void 0!==this.part&&Dt(t,"_HLS_part",this.part.toString()),this.skip&&Dt(t,"_HLS_skip",this.skip),t.href},e}(),Mt=function(){function e(e){if(this._attrs=void 0,this.audioCodec=void 0,this.bitrate=void 0,this.codecSet=void 0,this.url=void 0,this.frameRate=void 0,this.height=void 0,this.id=void 0,this.name=void 0,this.supplemental=void 0,this.videoCodec=void 0,this.width=void 0,this.imageCodec=void 0,this.iframes=void 0,this.details=void 0,this.fragmentError=0,this.loadError=0,this.loadErrorTime=0,this.loaded=void 0,this.realBitrate=0,this.supportedPromise=void 0,this.supportedResult=void 0,this._avgBitrate=0,this._audioGroups=void 0,this._subtitleGroups=void 0,this._urlId=0,this.url=[e.url],this._attrs=[e.attrs],this.bitrate=e.bitrate,e.details&&(this.details=e.details),this.id=e.id||0,this.name=e.name,this.width=e.width||0,this.height=e.height||0,this.frameRate=e.attrs.optionalFloat("FRAME-RATE",0),this._avgBitrate=e.attrs.decimalInteger("AVERAGE-BANDWIDTH"),this.audioCodec=e.audioCodec,this.videoCodec=e.videoCodec,"imageCodec"in e&&(this.imageCodec=e.imageCodec),this.codecSet=[e.videoCodec,e.audioCodec].filter((function(e){return!!e})).map((function(e){return e.substring(0,4)})).join(","),"supplemental"in e){var t;this.supplemental=e.supplemental;var r=null==(t=e.supplemental)?void 0:t.videoCodec;r&&r!==e.videoCodec&&(this.codecSet+=","+r.substring(0,4))}"iframes"in e&&e.iframes?this.iframes=!0:(this.addGroupId("audio",e.attrs.AUDIO),this.addGroupId("text",e.attrs.SUBTITLES))}var t=e.prototype;return t.hasAudioGroup=function(e){return Ft(this._audioGroups,e)},t.hasSubtitleGroup=function(e){return Ft(this._subtitleGroups,e)},t.addGroupId=function(e,t){if(t)if("audio"===e){var r=this._audioGroups;r||(r=this._audioGroups=[]),-1===r.indexOf(t)&&r.push(t)}else if("text"===e){var i=this._subtitleGroups;i||(i=this._subtitleGroups=[]),-1===i.indexOf(t)&&i.push(t)}},t.addFallback=function(){},a(e,[{key:"maxBitrate",get:function(){return Math.max(this.realBitrate,this.bitrate)}},{key:"averageBitrate",get:function(){return this._avgBitrate||this.realBitrate||this.bitrate}},{key:"attrs",get:function(){return this._attrs[0]}},{key:"codecs",get:function(){return this.attrs.CODECS||""}},{key:"pathwayId",get:function(){return this.attrs["PATHWAY-ID"]||"."}},{key:"videoRange",get:function(){return this.attrs["VIDEO-RANGE"]||"SDR"}},{key:"score",get:function(){return this.attrs.optionalFloat("SCORE",0)}},{key:"uri",get:function(){return this.url[0]||""}},{key:"audioGroups",get:function(){return this._audioGroups}},{key:"subtitleGroups",get:function(){return this._subtitleGroups}},{key:"urlId",get:function(){return 0},set:function(e){}},{key:"audioGroupIds",get:function(){return this.audioGroups?[this.audioGroupId]:void 0}},{key:"textGroupIds",get:function(){return this.subtitleGroups?[this.textGroupId]:void 0}},{key:"audioGroupId",get:function(){var e;return null==(e=this.audioGroups)?void 0:e[0]}},{key:"textGroupId",get:function(){var e;return null==(e=this.subtitleGroups)?void 0:e[0]}}])}();function Ft(e,t){return!(!t||!e)&&-1!==e.indexOf(t)}function Nt(e,t){var r=!1,i=[];if(e&&(r="SDR"!==e,i=[e]),t){var a="SDR"!==(i=t.allowedVideoRanges||_t.slice(0)).join("")&&!t.videoCodec;(r=void 0!==t.preferHDR?t.preferHDR:a&&function(){if("function"==typeof matchMedia){var e=matchMedia("(dynamic-range: high)"),t=matchMedia("bad query");if(e.media!==t.media)return!0===e.matches}return!1}())||(i=["SDR"])}return{preferHDR:r,allowedVideoRanges:i}}var Bt=function(e,t){return JSON.stringify(e,function(e){var t=new WeakSet;return function(r,i){if(e&&(i=e(r,i)),"object"==typeof i&&null!==i){if(t.has(i))return;t.add(i)}return i}}(t))};function Ut(e,t){fe.log('[abr] start candidates with "'+e+'" ignored because '+t)}function Gt(e){return e.reduce((function(e,t){var r=e.groups[t.groupId];r||(r=e.groups[t.groupId]={tracks:[],channels:{2:0},hasDefault:!1,hasAutoSelect:!1}),r.tracks.push(t);var i=t.channels||"2";return r.channels[i]=(r.channels[i]||0)+1,r.hasDefault=r.hasDefault||t.default,r.hasAutoSelect=r.hasAutoSelect||t.autoselect,r.hasDefault&&(e.hasDefaultAudio=!0),r.hasAutoSelect&&(e.hasAutoSelectAudio=!0),e}),{hasDefaultAudio:!1,hasAutoSelectAudio:!1,groups:{}})}function Vt(e,t){var r;return!!e&&e!==(null==(r=t.loadLevelObj)?void 0:r.uri)}var Ht=function(e){function t(t){var r;return(r=e.call(this,"abr",t.logger)||this).hls=void 0,r.lastLevelLoadSec=0,r.lastLoadedFragLevel=-1,r.firstSelection=-1,r.firstAutoFloor=-1,r._nextAutoLevel=-1,r.nextAutoLevelKey="",r.audioTracksByGroup=null,r.codecTiers=null,r.timer=-1,r.fragCurrent=null,r.partCurrent=null,r.bitrateTestDelay=0,r.rebufferNotice=-1,r.supportedCache={},r.bwEstimator=void 0,r._abandonRulesCheck=function(e){var t,i=r,a=i.fragCurrent,n=i.partCurrent,s=i.hls;if(s){var o=s.autoLevelEnabled,l=s.media;if(a&&l){var u=performance.now(),d=n?n.stats:a.stats,h=n?n.duration:a.duration,f=u-d.loading.start,c=s.minAutoLevel,g=a.level,v=r._nextAutoLevel;if(d.aborted||d.loaded&&d.loaded===d.total||g<=c)return r.clearTimer(),void(r._nextAutoLevel=-1);if(o){var m=v>-1&&v!==g,p=!!e||m;if(p||!l.paused&&l.playbackRate&&l.readyState){var y=s.mainForwardBufferInfo;if(p||null!==y){var E=r.bwEstimator.getEstimateTTFB(),T=Math.abs(l.playbackRate);if(!(f<=Math.max(E,h/(2*T)*1e3))){var S=y?y.len/T:0,L=d.loading.first?d.loading.first-d.loading.start:-1,R=d.loaded&&L>-1,A=r.getBwEstimate(),b=s.levels,k=b[g],D=Math.max(d.loaded,Math.round(h*(a.bitrate||k.averageBitrate)/8)),I=R?f-L:f;I<1&&R&&(I=Math.min(f,8*d.loaded/A));var C=R?1e3*d.loaded/I:0,P=E/1e3,x=C?(D-d.loaded)/C:8*D/A+P;if(!(x<=S)){var w,M=C?8*C:A,F=!0===(null==(t=(null==e?void 0:e.details)||s.latestLevelDetails)?void 0:t.live),N=s.config.abrBandWidthUpFactor,B=Number.POSITIVE_INFINITY;for(w=g-1;w>c;w--){var U=b[w].maxBitrate,G=!b[w].details||F;if((B=r.getTimeToLoadFrag(P,M,h*U,G))<Math.min(S,h+P))break}if(!(B>=x||B>10*h)){R?r.bwEstimator.sample(f-Math.min(E,L),d.loaded):r.bwEstimator.sampleTTFB(f);var V=b[w].maxBitrate;r.getBwEstimate()*N>V&&(r.firstAutoFloor=Math.min(w,s.firstLevel),r.resetEstimator(V));var H=r.findBestLevel(V,c,w,0,S,1,1);H>-1&&(w=H),r.warn("Fragment "+a.sn+(n?" part "+n.index:"")+" of level "+g+" is loading too slowly;\n      Fragment duration: "+a.duration.toFixed(3)+"\n      Time to underbuffer: "+S.toFixed(3)+" s\n      Estimated load time for current fragment: "+x.toFixed(3)+" s\n      Estimated load time for down switch fragment: "+B.toFixed(3)+" s\n      TTFB estimate: "+(0|L)+" ms\n      Current BW estimate: "+(_(A)?0|A:"Unknown")+" bps\n      New BW estimate: "+(0|r.getBwEstimate())+" bps\n      Switching to level "+w+" @ "+(0|V)+" bps"),s.nextLoadLevel=s.nextAutoLevel=w,r.clearTimer();var K=function(){r.clearTimer();var e=r.hls;if(r.fragCurrent===a&&e.loadLevel===w&&w>0){var t=r.getStarvationDelay();if(r.warn("Aborting inflight request "+(w>0?"and switching down":"")+"\n      Fragment duration: "+a.duration.toFixed(3)+" s\n      Time to underbuffer: "+t.toFixed(3)+" s"),a.abortRequests(),r.fragCurrent=r.partCurrent=null,w>c){var i=r.findBestLevel(e.levels[c].bitrate,c,w,0,t,1,1);-1===i&&(i=c),e.nextLoadLevel=e.nextAutoLevel=i,r.firstAutoFloor=Math.min(i,e.firstLevel),r.resetEstimator(e.levels[i].bitrate)}}};m||x>2*B?K():r.timer=self.setInterval(K,1e3*B),s.trigger(O.FRAG_LOAD_EMERGENCY_ABORTED,{frag:a,part:n,stats:d})}}}}}}}}},r.hls=t,r.bwEstimator=r.initEstimator(),r.registerListeners(),r}u(t,e);var r=t.prototype;return r.resetEstimator=function(e){this.hls&&(e&&(this.log("setting initial bwe to "+e),this.hls.config.abrEwmaDefaultEstimate=e),this.firstSelection=-1,this.bwEstimator=this.initEstimator())},r.initEstimator=function(){var e=this.hls.config;return new re(e.abrEwmaSlowVoD,e.abrEwmaFastVoD,e.abrEwmaDefaultEstimate)},r.registerListeners=function(){var e=this.hls;e.on(O.MANIFEST_LOADING,this.onManifestLoading,this),e.on(O.FRAG_LOADING,this.onFragLoading,this),e.on(O.FRAG_LOADED,this.onFragLoaded,this),e.on(O.FRAG_BUFFERED,this.onFragBuffered,this),e.on(O.LEVEL_SWITCHING,this.onLevelSwitching,this),e.on(O.LEVEL_LOADED,this.onLevelLoaded,this),e.on(O.LEVELS_UPDATED,this.onLevelsUpdated,this),e.on(O.MAX_AUTO_LEVEL_UPDATED,this.onMaxAutoLevelUpdated,this),e.on(O.ERROR,this.onError,this)},r.unregisterListeners=function(){var e=this.hls;e&&(e.off(O.MANIFEST_LOADING,this.onManifestLoading,this),e.off(O.FRAG_LOADING,this.onFragLoading,this),e.off(O.FRAG_LOADED,this.onFragLoaded,this),e.off(O.FRAG_BUFFERED,this.onFragBuffered,this),e.off(O.LEVEL_SWITCHING,this.onLevelSwitching,this),e.off(O.LEVEL_LOADED,this.onLevelLoaded,this),e.off(O.LEVELS_UPDATED,this.onLevelsUpdated,this),e.off(O.MAX_AUTO_LEVEL_UPDATED,this.onMaxAutoLevelUpdated,this),e.off(O.ERROR,this.onError,this))},r.destroy=function(){this.unregisterListeners(),this.clearTimer(),this.hls=this._abandonRulesCheck=this.supportedCache=null,this.audioTracksByGroup=this.codecTiers=this.fragCurrent=this.partCurrent=null},r.onManifestLoading=function(e,t){this.lastLoadedFragLevel=-1,this.firstSelection=-1,this.firstAutoFloor=-1,this.lastLevelLoadSec=0,this.supportedCache={},this.fragCurrent=this.partCurrent=null,this.onLevelsUpdated(),this.clearTimer()},r.onLevelsUpdated=function(){this.lastLoadedFragLevel>-1&&this.fragCurrent&&(this.lastLoadedFragLevel=this.fragCurrent.level),this._nextAutoLevel=-1,this.onMaxAutoLevelUpdated(),this.codecTiers=null,this.audioTracksByGroup=null},r.onMaxAutoLevelUpdated=function(){this.firstSelection=-1,this.nextAutoLevelKey=""},r.onFragLoading=function(e,t){var r,i=t.frag;this.ignoreFragment(i)||(i.bitrateTest||(this.fragCurrent=i,this.partCurrent=null!=(r=t.part)?r:null),this.clearTimer(),this.timer=self.setInterval(this._abandonRulesCheck,100))},r.onLevelSwitching=function(e,t){this.clearTimer()},r.onError=function(e,t){if(!t.fatal)switch(t.details){case w.BUFFER_ADD_CODEC_ERROR:case w.BUFFER_APPEND_ERROR:this.lastLoadedFragLevel=-1,this.firstSelection=-1;break;case w.FRAG_LOAD_TIMEOUT:var r=t.frag,i=this.fragCurrent,a=this.partCurrent;if(r&&H(r,i)){var n=performance.now(),s=a?a.stats:r.stats,o=n-s.loading.start,l=s.loading.first?s.loading.first-s.loading.start:-1;if(s.loaded&&l>-1){var u=this.bwEstimator.getEstimateTTFB();this.bwEstimator.sample(o-Math.min(u,l),s.loaded)}else this.bwEstimator.sampleTTFB(o)}}},r.getTimeToLoadFrag=function(e,t,r,i){return e+r/t+(i?e+this.lastLevelLoadSec:0)},r.onLevelLoaded=function(e,t){var r=this.hls.config,i=t.stats.loading,a=i.end-i.first;_(a)&&(this.lastLevelLoadSec=a/1e3),t.details.live?this.bwEstimator.update(r.abrEwmaSlowLive,r.abrEwmaFastLive):this.bwEstimator.update(r.abrEwmaSlowVoD,r.abrEwmaFastVoD),this.timer>-1&&this._abandonRulesCheck(t.levelInfo)},r.onFragLoaded=function(e,t){var r,i=t.frag,a=t.part,n=a?a.stats:i.stats;if(i.type===N.MAIN&&this.bwEstimator.sampleTTFB(n.loading.first-n.loading.start),!this.ignoreFragment(i)){if(this.clearTimer(),i.level===this._nextAutoLevel&&(this._nextAutoLevel=-1),this.firstSelection=-1,null!=(r=this.hls)&&r.config.abrMaxWithRealBitrate){var s=a?a.duration:i.duration,o=this.hls.levels[i.level],l=(o.loaded?o.loaded.bytes:0)+n.loaded,u=(o.loaded?o.loaded.duration:0)+s;o.loaded={bytes:l,duration:u},o.realBitrate=Math.round(8*l/u)}if(i.bitrateTest){var d={stats:n,frag:i,part:a,id:i.type};this.onFragBuffered(O.FRAG_BUFFERED,d),i.bitrateTest=!1}else this.lastLoadedFragLevel=i.level}},r.onFragBuffered=function(e,t){var r=t.frag,i=t.part,a=null!=i&&i.stats.loaded?i.stats:r.stats;if(!a.aborted&&!this.ignoreFragment(r)){var n=((r.bitrate||0)>=1e5?a.parsing.end:a.loading.end)-a.loading.start-Math.min(a.loading.first-a.loading.start,this.bwEstimator.getEstimateTTFB());this.bwEstimator.sample(n,a.loaded),a.bwEstimate=this.getBwEstimate(),r.bitrateTest?this.bitrateTestDelay=n/1e3:(this.bitrateTestDelay=0,this.firstAutoFloor>-1&&this.bwEstimator.canEstimate()&&(this.firstAutoFloor=-1))}},r.ignoreFragment=function(e){return e.type!==N.MAIN||"initSegment"===e.sn},r.clearTimer=function(){this.timer>-1&&(self.clearInterval(this.timer),this.timer=-1)},r.getAutoLevelKey=function(){return this.getBwEstimate()+"_"+this.getStarvationDelay().toFixed(2)},r.getNextABRAutoLevel=function(){var e=this.fragCurrent,t=this.partCurrent,r=this.hls;if(!r)return-1;if(r.levels.length<=1)return r.loadLevel;var i=r.maxAutoLevel,a=r.config,n=r.minAutoLevel,s=t?t.duration:e?e.duration:0,o=this.getBwEstimate(),l=this.getStarvationDelay(),u=a.abrBandWidthFactor,d=a.abrBandWidthUpFactor;if(l){var h=this.findBestLevel(o,n,i,l,0,u,d);if(h>=0)return this.rebufferNotice=-1,h}var f=s?Math.min(s,a.maxStarvationDelay):a.maxStarvationDelay;if(!l){var c=this.bitrateTestDelay;c&&(f=(s?Math.min(s,a.maxLoadingDelay):a.maxLoadingDelay)-c,this.info("bitrate test took "+Math.round(1e3*c)+"ms, set first fragment max fetchDuration to "+Math.round(1e3*f)+" ms"),u=d=1)}var g=this.findBestLevel(o,n,i,l,f,u,d);if(this.rebufferNotice!==g&&(this.rebufferNotice=g,this.info((l?"rebuffering expected":"buffer is empty")+", optimal quality level "+g)),g>-1)return g;var v=r.levels[n],m=r.loadLevelObj;return m&&(null==v?void 0:v.bitrate)<m.bitrate?n:r.loadLevel},r.getStarvationDelay=function(){var e=this.hls,t=null==e?void 0:e.media;if(!t)return 1/0;var r=t&&0!==t.playbackRate?Math.abs(t.playbackRate):1,i=e.mainForwardBufferInfo;return(i?i.len:0)/r},r.getBwEstimate=function(){return this.bwEstimator.getEstimate()},r.findBestLevel=function(e,t,r,i,a,n,s){var o=this,l=this.hls,u=this.lastLoadedFragLevel,d=this.fragCurrent,h=this.partCurrent;if(!l)return-1;var f=i+a,c=-1===u?l.firstLevel:u,g=l.levels,v=l.allAudioTracks,m=l.loadLevel,p=l.latestLevelDetails,y=l.config;if(1===g.length)return 0;var E,T=g[c],S=!(null==p||!p.live),L=-1===m||-1===u,R="SDR",A=(null==T?void 0:T.frameRate)||0,b=y.audioPreference,k=y.videoPreference,D=(this.audioTracksByGroup||(this.audioTracksByGroup=Gt(v)),-1);if(L){if(-1!==this.firstSelection)return this.firstSelection;var I=this.codecTiers||(this.codecTiers=function(e,t,r,i){return e.slice(r,i+1).reduce((function(e,t,r){if(!t.codecSet)return e;var i=t.audioGroups,a=e[t.codecSet];a||(e[t.codecSet]=a={minBitrate:1/0,minHeight:1/0,minFramerate:1/0,minIndex:r,maxScore:0,videoRanges:{SDR:0},channels:{2:0},hasDefaultAudio:!i,fragmentError:0}),a.minBitrate=Math.min(a.minBitrate,t.bitrate);var n=Math.min(t.height,t.width);return a.minHeight=Math.min(a.minHeight,n),a.minFramerate=Math.min(a.minFramerate,t.frameRate),a.minIndex=Math.min(a.minIndex,r),a.maxScore=Math.max(a.maxScore,t.score),a.fragmentError+=t.fragmentError,a.videoRanges[t.videoRange]=(a.videoRanges[t.videoRange]||0)+1,e}),{})}(g,0,t,r)),C=function(e,t,r,i,a){for(var n=Object.keys(e),s=null==i?void 0:i.channels,o=null==i?void 0:i.audioCodec,l=null==a?void 0:a.videoCodec,u=s&&2===parseInt(s),d=!1,h=!1,f=1/0,c=1/0,g=1/0,v=1/0,m=0,p=[],y=Nt(t,a),E=y.preferHDR,T=y.allowedVideoRanges,S=function(){var t=e[n[L]];d||(d=t.channels[2]>0),f=Math.min(f,t.minHeight),c=Math.min(c,t.minFramerate),g=Math.min(g,t.minBitrate),T.filter((function(e){return t.videoRanges[e]>0})).length>0&&(h=!0)},L=n.length;L--;)S();f=_(f)?f:0,c=_(c)?c:0;var R=Math.max(1080,f),A=Math.max(30,c);g=_(g)?g:r,r=Math.max(g,r),h||(t=void 0);var b=n.length>1;return{codecSet:n.reduce((function(t,i){var a=e[i];if(i===t)return t;if(p=h?T.filter((function(e){return a.videoRanges[e]>0})):[],b){if(a.minBitrate>r)return Ut(i,"min bitrate of "+a.minBitrate+" > current estimate of "+r),t;if(!a.hasDefaultAudio)return Ut(i,"no renditions with default or auto-select sound found"),t;if(o&&i.indexOf(o.substring(0,4))%5!=0)return Ut(i,'audio codec preference "'+o+'" not found'),t;if(s&&!u){if(!a.channels[s])return Ut(i,"no renditions with "+s+" channel sound found (channels options: "+Object.keys(a.channels)+")"),t}else if((!o||u)&&d&&0===a.channels[2])return Ut(i,"no renditions with stereo sound found"),t;if(a.minHeight>R)return Ut(i,"min resolution of "+a.minHeight+" > maximum of "+R),t;if(a.minFramerate>A)return Ut(i,"min framerate of "+a.minFramerate+" > maximum of "+A),t;if(!p.some((function(e){return a.videoRanges[e]>0})))return Ut(i,"no variants with VIDEO-RANGE of "+Bt(p)+" found"),t;if(l&&i.indexOf(l.substring(0,4))%5!=0)return Ut(i,'video codec preference "'+l+'" not found'),t;if(a.maxScore<m)return Ut(i,"max score of "+a.maxScore+" < selected max of "+m),t}return t&&(Tt(i)>=Tt(t)||a.fragmentError>e[t].fragmentError)?t:(v=a.minIndex,m=a.maxScore,i)}),void 0),videoRanges:p,preferHDR:E,minFramerate:c,minBitrate:g,minIndex:v}}(I,R,e,b,k),P=C.codecSet,x=C.videoRanges,w=C.minFramerate,O=C.minBitrate,M=C.minIndex,F=C.preferHDR;D=M,E=P,R=F?x[x.length-1]:x[0],A=w,e=Math.max(e,O),this.log("picked start tier "+Bt(C))}else E=null==T?void 0:T.codecSet,R=null==T?void 0:T.videoRange;for(var N,B=h?h.duration:d?d.duration:0,U=this.bwEstimator.getEstimateTTFB()/1e3,G=[],V=function(){var t,l=g[H],d=H>c;if(!l)return 0;if((E&&l.codecSet!==E||R&&l.videoRange!==R||d&&A>l.frameRate||!d&&A>0&&A<l.frameRate||null!=(t=l.supportedResult)&&null!=(t=t.decodingInfoResults)&&t.some((function(e){return!1===e.smooth})))&&(!L||H!==D))return G.push(H),0;var v,p=l.details,T=(h?null==p?void 0:p.partTarget:null==p?void 0:p.averagetargetduration)||B||1;v=d?s*e:n*e;var b=B&&i>=2*B&&0===a?l.averageBitrate:l.maxBitrate,k=o.getTimeToLoadFrag(U,v,b*T,!p||p.live);if(v>=b&&(H===u||0===l.loadError&&0===l.fragmentError||ee(l,y.errorPenaltyExpireMs))&&(k<=U||!_(k)||S&&!o.bitrateTestDelay||k<f)){var I=o.forcedAutoLevel;return H===m||-1!==I&&I===m||(G.length&&o.trace("Skipped level(s) "+G.join(",")+" of "+r+' max with CODECS and VIDEO-RANGE:"'+g[G[0]].codecs+'" '+g[G[0]].videoRange+'; not compatible with "'+E+'" '+R),o.info("switch candidate:"+c+"->"+H+" adjustedbw("+Math.round(v)+")-bitrate="+Math.round(v-b)+" ttfb:"+U.toFixed(1)+" avgDuration:"+T.toFixed(1)+" maxFetchDuration:"+f.toFixed(1)+" fetchDuration:"+k.toFixed(1)+" firstSelection:"+L+" codecSet:"+l.codecSet+" videoRange:"+l.videoRange+" hls.loadLevel:"+m)),L&&(o.firstSelection=H),{v:H}}},H=r;H>=t;H--)if(0!==(N=V())&&N)return N.v;return-1},r.deriveNextAutoLevel=function(e){if(!this.hls)return-1;var t=this.hls,r=t.maxAutoLevel,i=t.minAutoLevel;return Math.min(Math.max(e,i),r)},a(t,[{key:"firstAutoLevel",get:function(){var e=this.hls;if(!e)return 0;var t=e.maxAutoLevel,r=e.minAutoLevel,i=this.getBwEstimate(),a=this.getStarvationDelay(),n=e.config.maxStarvationDelay,s=this.findBestLevel(i,r,t,a/2,n,1,1);if(s>-1)return s;var o=e.firstLevel,l=-1===this.firstAutoFloor?1/0:this.firstAutoFloor,u=Math.min(Math.max(o,r),t,l);return this.warn("Could not find best starting auto level. Defaulting to first in playlist "+o+" clamped to "+u),u}},{key:"forcedAutoLevel",get:function(){return this.nextAutoLevelKey?-1:this._nextAutoLevel}},{key:"nextAutoLevel",get:function(){if(!this.hls)return-1;var e=this.forcedAutoLevel,t=this.bwEstimator.canEstimate(),r=this.lastLoadedFragLevel>-1;if(!(-1===e||t&&r&&this.nextAutoLevelKey!==this.getAutoLevelKey()))return e;var i=t&&r?this.getNextABRAutoLevel():this.firstAutoLevel;if(-1!==e){var a=this.hls.levels;if(a.length>Math.max(e,i)&&a[e].loadError<=a[i].loadError)return e}return this._nextAutoLevel=i,this.nextAutoLevelKey=this.getAutoLevelKey(),i},set:function(e){var t=this.deriveNextAutoLevel(e);this._nextAutoLevel!==t&&(this.nextAutoLevelKey="",this._nextAutoLevel=t)}}])}(ie),Kt=function(){function e(e){this.tracks=void 0,this.queues={video:[],audio:[],audiovideo:[]},this.tracks=e}var t=e.prototype;return t.destroy=function(){this.tracks=this.queues=null},t.append=function(e,t,r){if(null!==this.queues&&null!==this.tracks){var i=this.queues[t];i.push(e),1!==i.length||r||this.executeNext(t)}},t.appendBlocker=function(e){var t=this;return new Promise((function(r){var i={label:"async-blocker",execute:r,onStart:function(){},onComplete:function(){},onError:function(){}};t.append(i,e)}))},t.prependBlocker=function(e){var t=this;return new Promise((function(r){if(t.queues){var i={label:"async-blocker-prepend",execute:r,onStart:function(){},onComplete:function(){},onError:function(){}};t.queues[e].unshift(i)}}))},t.removeBlockers=function(){null!==this.queues&&[this.queues.video,this.queues.audio,this.queues.audiovideo].forEach((function(e){var t,r=null==(t=e[0])?void 0:t.label;"async-blocker"===r||"async-blocker-prepend"===r?(e[0].execute(),e.splice(0,1)):"block-audio"===r&&e.splice(0,1)}))},t.insertNext=function(e,t){var r;null!==this.queues&&(r=this.queues[t]).splice.apply(r,[1,0].concat(e))},t.unblockAudio=function(){var e;null!==this.queues&&"block-audio"===(null==(e=this.current("audio"))?void 0:e.label)&&this.shiftAndExecuteNext("audio")},t.audioBlocking=function(){return null!==this.queues&&this.queues.audio.some((function(e){return"block-audio"===e.label}))},t.executeNext=function(e){if(null!==this.queues&&null!==this.tracks){var t=this.queues[e];if(t.length){var r=t[0];try{r.execute()}catch(t){var i;if(r.onError(t),null===this.queues||null===this.tracks)return;var a=null==(i=this.tracks[e])?void 0:i.buffer;null!=a&&a.updating||this.shiftAndExecuteNext(e)}}}},t.shiftAndExecuteNext=function(e){null!==this.queues&&(this.queues[e].shift(),this.executeNext(e))},t.current=function(e){var t;return(null==(t=this.queues)?void 0:t[e][0])||null},t.toString=function(){var e=this.queues,t=this.tracks;return null===e||null===t?"<destroyed>":"\n"+this.list("video")+"\n"+this.list("audio")+"\n"+this.list("audiovideo")+"}"},t.list=function(e){var t,r;return null!=(t=this.queues)&&t[e]||null!=(r=this.tracks)&&r[e]?e+": ("+this.listSbInfo(e)+") "+this.listOps(e):""},t.listSbInfo=function(e){var t,r=null==(t=this.tracks)?void 0:t[e],i=null==r?void 0:r.buffer;return i?"SourceBuffer"+(i.updating?" updating":"")+(r.ended?" ended":"")+(r.ending?" ending":""):"none"},t.listOps=function(e){var t;return(null==(t=this.queues)?void 0:t[e].map((function(e){return e.label})).join(", "))||""},e}(),Yt=function(e,t){for(var r=0,i=e.length-1,a=null,n=null;r<=i;){var s=t(n=e[a=(r+i)/2|0]);if(s>0)r=a+1;else{if(!(s<0))return n;i=a-1}}return null};function Wt(e,t,r,i,a){void 0===r&&(r=0),void 0===i&&(i=0),void 0===a&&(a=.005);var n=null;if(e){n=t[1+e.sn-t[0].sn]||null;var s=e.endDTS-r;s>0&&s<15e-7&&(r+=15e-7),n&&e.level!==n.level&&n.end<=e.end&&(n=t[2+e.sn-t[0].sn]||null)}else 0===r&&0===t[0].start&&(n=t[0]);if(n&&((!e||e.level===n.level)&&0===jt(r,i,n)||function(e,t,r){if(0===(null==t?void 0:t.start)&&t.level<e.level&&(t.endPTS||0)>0){var i=t.tagList.reduce((function(e,t){return"INF"===t[0]&&(e+=parseFloat(t[1])),e}),r);return e.start<=i}return!1}(n,e,Math.min(a,i))))return n;var o=Yt(t,jt.bind(null,r,i));return!o||o===e&&n?n:o}function jt(e,t,r){if(void 0===e&&(e=0),void 0===t&&(t=0),r.start<=e&&r.start+r.duration>e)return 0;var i=Math.min(t,r.duration+(r.deltaPTS?r.deltaPTS:0));return r.start+r.duration-i<=e?1:r.start-i>e&&r.start?-1:0}function qt(e,t,r){var i=1e3*Math.min(t,r.duration+(r.deltaPTS?r.deltaPTS:0));return(r.endProgramDateTime||0)-i>e}var Xt=0,zt=2,Qt=3,$t=5,Zt=0,Jt=1,er=2,tr=4,rr=8,ir=16,ar=function(e){function t(t){var r;return(r=e.call(this,"error-controller",t.logger)||this).hls=void 0,r.playlistError=0,r.hls=t,r.registerListeners(),r}u(t,e);var r=t.prototype;return r.registerListeners=function(){var e=this.hls;e.on(O.ERROR,this.onError,this),e.on(O.MANIFEST_LOADING,this.onManifestLoading,this),e.on(O.LEVEL_UPDATED,this.onLevelUpdated,this)},r.unregisterListeners=function(){var e=this.hls;e&&(e.off(O.ERROR,this.onError,this),e.off(O.ERROR,this.onErrorOut,this),e.off(O.MANIFEST_LOADING,this.onManifestLoading,this),e.off(O.LEVEL_UPDATED,this.onLevelUpdated,this))},r.destroy=function(){this.unregisterListeners(),this.hls=null},r.startLoad=function(e){},r.stopLoad=function(){this.playlistError=0},r.getVariantLevelIndex=function(e){return(null==e?void 0:e.type)===N.MAIN?e.level:this.getVariantIndex()},r.getVariantIndex=function(){var e,t=this.hls,r=t.currentLevel;return null!=(e=t.loadLevelObj)&&e.details||-1===r?t.loadLevel:r},r.variantHasKey=function(e,t){if(e){var r;if(null!=(r=e.details)&&r.hasKey(t))return!0;var i=e.audioGroups;if(i)return this.hls.allAudioTracks.filter((function(e){return i.indexOf(e.groupId)>=0})).some((function(e){var r;return null==(r=e.details)?void 0:r.hasKey(t)}))}return!1},r.onManifestLoading=function(){this.playlistError=0},r.onLevelUpdated=function(){this.playlistError=0},r.onError=function(e,t){var r;if(!t.fatal){var i=this.hls,a=t.context;switch(t.details){case w.FRAG_LOAD_ERROR:case w.FRAG_LOAD_TIMEOUT:case w.KEY_LOAD_ERROR:case w.KEY_LOAD_TIMEOUT:return void(t.errorAction=this.getFragRetryOrSwitchAction(t));case w.FRAG_PARSING_ERROR:if(null!=(r=t.frag)&&r.gap)return void(t.errorAction=or());case w.FRAG_GAP:case w.FRAG_DECRYPT_ERROR:return t.errorAction=this.getFragRetryOrSwitchAction(t),void(t.errorAction.action=zt);case w.PLAYLIST_UNCHANGED_ERROR:case w.LEVEL_EMPTY_ERROR:case w.LEVEL_PARSING_ERROR:var n,s=t.parent===N.MAIN?t.level:i.loadLevel;return void(t.details===w.LEVEL_EMPTY_ERROR&&null!=(n=t.context)&&null!=(n=n.levelDetails)&&n.live?t.errorAction=this.getPlaylistRetryOrSwitchAction(t,s):(t.levelRetry=!1,t.errorAction=this.getLevelSwitchAction(t,s)));case w.LEVEL_LOAD_ERROR:case w.LEVEL_LOAD_TIMEOUT:return void("number"==typeof(null==a?void 0:a.level)&&(t.errorAction=this.getPlaylistRetryOrSwitchAction(t,a.level)));case w.AUDIO_TRACK_LOAD_ERROR:case w.AUDIO_TRACK_LOAD_TIMEOUT:case w.SUBTITLE_LOAD_ERROR:case w.SUBTITLE_TRACK_LOAD_TIMEOUT:if(a){var o=i.loadLevelObj;if(o&&(a.type===F.AUDIO_TRACK&&o.hasAudioGroup(a.groupId)||a.type===F.SUBTITLE_TRACK&&o.hasSubtitleGroup(a.groupId)))return t.errorAction=this.getPlaylistRetryOrSwitchAction(t,i.loadLevel),t.errorAction.action=zt,void(t.errorAction.flags=Jt)}return;case w.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED:return void(t.errorAction={action:zt,flags:er});case w.KEY_SYSTEM_SESSION_UPDATE_FAILED:case w.KEY_SYSTEM_STATUS_INTERNAL_ERROR:case w.KEY_SYSTEM_NO_SESSION:return void(t.errorAction={action:zt,flags:tr});case w.BUFFER_ADD_CODEC_ERROR:case w.REMUX_ALLOC_ERROR:case w.BUFFER_APPEND_ERROR:return void(t.errorAction||(t.errorAction=this.getLevelSwitchAction(t,t.level)));case w.MEDIA_SOURCE_REQUIRES_RESET:return t.errorAction||(t.errorAction=this.getLevelSwitchAction(t,t.level)),void(t.errorAction.flags|=ir|rr);case w.INTERNAL_EXCEPTION:case w.BUFFER_APPENDING_ERROR:case w.BUFFER_APPEND_NO_PROGRESS:case w.BUFFER_FULL_ERROR:case w.LEVEL_SWITCH_ERROR:case w.BUFFER_STALLED_ERROR:case w.BUFFER_SEEK_OVER_HOLE:case w.BUFFER_NUDGE_ON_STALL:return void(t.errorAction=or())}t.type===x.KEY_SYSTEM_ERROR&&(t.levelRetry=!1,t.errorAction=or())}},r.getPlaylistRetryOrSwitchAction=function(e,t){var r=z(this.hls.config.playlistLoadPolicy,e),i=this.playlistError++;if(Z(r,i,j(e),e.response))return{action:$t,flags:Zt,retryConfig:r,retryCount:i};var a=this.getLevelSwitchAction(e,t);return r&&(a.retryConfig=r,a.retryCount=i),a},r.getFragRetryOrSwitchAction=function(e){var t=this.hls,r=this.getVariantLevelIndex(e.frag),i=t.levels[r],a=t.config,n=a.fragLoadPolicy,s=a.keyLoadPolicy,o=z(q(e)?s:n,e),l=t.levels.reduce((function(e,t){return e+t.fragmentError}),0);if(i&&(e.details!==w.FRAG_GAP&&i.fragmentError++,!X(e)&&Z(o,l,j(e),e.response)))return{action:$t,flags:Zt,retryConfig:o,retryCount:l};var u=this.getLevelSwitchAction(e,r);return o&&(u.retryConfig=o,u.retryCount=l),u},r.getLevelSwitchAction=function(e,t){var r=this.hls;null==t&&(t=r.loadLevel);var i=this.hls.levels[t];if(i){var a,n,s=e.details;i.loadError++,i.loadErrorTime=self.performance.now(),s===w.BUFFER_APPEND_ERROR&&i.fragmentError++;var o=-1,l=r.levels,u=r.loadLevel,d=r.minAutoLevel,h=r.maxAutoLevel;r.autoLevelEnabled||r.config.preserveManualLevelOnError||(r.loadLevel=-1);for(var f,c=null==(a=e.frag)?void 0:a.type,g=(c===N.AUDIO&&s===w.FRAG_PARSING_ERROR||"audio"===e.sourceBufferName&&nr(e))&&l.some((function(e){var t=e.audioCodec;return i.audioCodec!==t})),v="video"===e.sourceBufferName&&nr(e)&&l.some((function(e){var t=e.codecSet,r=e.audioCodec;return i.codecSet!==t&&i.audioCodec===r})),m=null!=(n=e.context)?n:{},p=m.type,y=m.groupId,E=function(){var t=(T+u)%l.length;if(t!==u&&t>=d&&t<=h&&(0===l[t].loadError||ee(l[t],r.config.errorPenaltyExpireMs))){var a,n,f=l[t];if(s===w.FRAG_GAP&&c===N.MAIN&&e.frag){var m=l[t].details;if(m){var E=Wt(e.frag,m.fragments,e.frag.start);if(null!=E&&E.gap)return 0}}else{if(p===F.AUDIO_TRACK&&f.hasAudioGroup(y)||p===F.SUBTITLE_TRACK&&f.hasSubtitleGroup(y))return 0;if(c===N.AUDIO&&null!=(a=i.audioGroups)&&a.some((function(e){return f.hasAudioGroup(e)}))||c===N.SUBTITLE&&null!=(n=i.subtitleGroups)&&n.some((function(e){return f.hasSubtitleGroup(e)}))||g&&i.audioCodec===f.audioCodec||v&&i.codecSet===f.codecSet||!g&&i.audioCodec!==f.audioCodec)return 0}return o=t,1}},T=l.length;T--&&(0===(f=E())||1!==f););if(o>-1&&r.loadLevel!==o)return e.levelRetry=!0,this.playlistError=0,{action:zt,flags:Zt,nextAutoLevel:o}}return{action:zt,flags:Jt}},r.onErrorOut=function(e,t){var r,i;switch(null==(r=t.errorAction)?void 0:r.action){case Xt:break;case zt:this.sendAlternateToPenaltyBox(t),t.errorAction.resolved||t.details===w.FRAG_GAP||t.details===w.PLAYLIST_UNCHANGED_ERROR||sr(t)||(t.fatal=!0)}((null==(i=t.errorAction)?void 0:i.flags)||0)&ir&&this.hls.recoverMediaError(),t.fatal&&this.hls.stopLoad()},r.sendAlternateToPenaltyBox=function(e){var t=this.hls,r=e.errorAction;if(r){var i=r.nextAutoLevel;if(r.flags===Zt)this.switchLevel(e,i);else if(r.flags&rr)for(var a=this.hls.levels,n=a.length;n--;)"SDR"!==a[n].videoRange?(a[n].fragmentError++,a[n].loadError++):void 0===i&&(i=n);else if(r.flags&er){var s=this.getVariantLevelIndex(e.frag),o=t.levels[s],l=null==o?void 0:o.attrs["HDCP-LEVEL"];r.hdcpLevel=l;var u="NONE"===l;l&&!u?(t.maxHdcpLevel=It[It.indexOf(l)-1],r.resolved=!0,this.warn('Restricting playback to HDCP-LEVEL of "'+t.maxHdcpLevel+'" or lower')):(u&&this.warn("HDCP policy resticted output with HDCP-LEVEL=NONE"),r.flags|=tr)}if(r.flags&tr){var d=e.decryptdata;if(d){for(var h=this.hls.levels,f=h.length,c=f;c--;){var g,v;this.variantHasKey(h[c],d)&&(this.log("Banned key found in level "+c+" ("+h[c].bitrate+'bps) or audio group "'+(null==(g=h[c].audioGroups)?void 0:g.join(","))+'" ('+(null==(v=e.frag)?void 0:v.type)+" fragment) "+xe(d.keyId||[])),h[c].fragmentError++,h[c].loadError++,this.log("Removing level "+c+" with key error ("+e.error+")"),this.hls.removeLevel(c))}var m=e.frag;if(this.hls.levels.length<f)r.resolved=!0;else if(m&&m.type!==N.MAIN){var p=m.decryptdata;p&&!d.matches(p)&&(r.resolved=!0)}}}r.resolved||this.switchLevel(e,i)}},r.switchLevel=function(e,t){if(void 0!==t&&e.errorAction&&(this.warn("switching to level "+t+" after "+e.details),this.hls.nextAutoLevel=t,e.errorAction.resolved=!0,this.hls.nextLoadLevel=this.hls.nextAutoLevel,e.details===w.BUFFER_ADD_CODEC_ERROR&&e.mimeType&&"audiovideo"!==e.sourceBufferName))for(var r=e.mimeType.replace(/^.+codecs=["']?([^"']+).*$/,"$1"),i=this.hls.levels,a=i.length;a--;)i[a][e.sourceBufferName+"Codec"]===r&&(this.log("Removing level "+a+" for "+e.details+' ("'+r+'" not supported)'),this.hls.removeLevel(a))},t}(ie);function nr(e){var t=e.details;return t===w.BUFFER_ADD_CODEC_ERROR||t===w.MEDIA_SOURCE_REQUIRES_RESET||t===w.BUFFER_APPEND_ERROR&&!sr(e)}function sr(e){return e.details===w.BUFFER_APPEND_ERROR&&("QuotaExceededError"===e.error.name||"InvalidStateError"===e.error.name)}function or(e){var t={action:Xt,flags:Zt};return e&&(t.resolved=!0),t}var lr=function(){function e(e){this.PTSKnown=!1,this.alignedSliding=!1,this.averagetargetduration=void 0,this.endCC=0,this.endSN=0,this.fragments=void 0,this.fragmentHint=void 0,this.partList=null,this.dateRanges=void 0,this.dateRangeTagCount=0,this.live=!0,this.iframesOnly=!1,this.requestScheduled=-1,this.ageHeader=0,this.advancedDateTime=void 0,this.updated=!0,this.advanced=!0,this.misses=0,this.startCC=0,this.startSN=0,this.startTimeOffset=null,this.targetduration=0,this.totalduration=0,this.type=null,this.url=void 0,this.m3u8="",this.version=null,this.canBlockReload=!1,this.canSkipUntil=0,this.canSkipDateRanges=!1,this.skippedSegments=0,this.recentlyRemovedDateranges=void 0,this.partHoldBack=0,this.holdBack=0,this.partTarget=0,this.preloadHint=void 0,this.renditionReports=void 0,this.tuneInGoal=0,this.deltaUpdateFailed=void 0,this.driftStartTime=0,this.driftEndTime=0,this.driftStart=0,this.driftEnd=0,this.encryptedFragments=void 0,this.playlistParsingError=null,this.variableList=null,this.hasVariableRefs=!1,this.appliedTimelineOffset=void 0,this.fragments=[],this.encryptedFragments=[],this.dateRanges={},this.url=e}var t=e.prototype;return t.reloaded=function(e){if(!e)return this.advanced=!0,void(this.updated=!0);var t=this.lastPartSn-e.lastPartSn,r=this.lastPartIndex-e.lastPartIndex;this.updated=this.endSN!==e.endSN||!!r||!!t||!this.live,this.advanced=this.endSN>e.endSN||t>0||0===t&&r>0,this.updated||this.advanced?this.misses=0:this.misses=e.misses+1},t.hasKey=function(e){return this.encryptedFragments.some((function(t){var r=t.decryptdata;return r||(t.setKeyFormat(e.keyFormat),r=t.decryptdata),!!r&&e.matches(r)}))},a(e,[{key:"hasProgramDateTime",get:function(){return!!this.fragments.length&&_(this.fragments[this.fragments.length-1].programDateTime)}},{key:"levelTargetDuration",get:function(){return this.averagetargetduration||this.targetduration||10}},{key:"drift",get:function(){var e=this.driftEndTime-this.driftStartTime;return e>0?1e3*(this.driftEnd-this.driftStart)/e:1}},{key:"edge",get:function(){return this.partEnd||this.fragmentEnd}},{key:"partEnd",get:function(){var e;return null!=(e=this.partList)&&e.length?this.partList[this.partList.length-1].end:this.fragmentEnd}},{key:"fragmentEnd",get:function(){return this.fragments.length?this.fragments[this.fragments.length-1].end:0}},{key:"fragmentStart",get:function(){return this.fragments.length?this.fragments[0].start:0}},{key:"age",get:function(){return this.advancedDateTime?Math.max(Date.now()-this.advancedDateTime,0)/1e3:0}},{key:"lastPartIndex",get:function(){var e;return null!=(e=this.partList)&&e.length?this.partList[this.partList.length-1].index:-1}},{key:"maxPartIndex",get:function(){var e=this.partList;if(e){var t=this.lastPartIndex;if(-1!==t){for(var r=e.length;r--;)if(e[r].index>t)return e[r].index;return t}}return 0}},{key:"lastPartSn",get:function(){var e;return null!=(e=this.partList)&&e.length?this.partList[this.partList.length-1].fragment.sn:this.endSN}},{key:"expired",get:function(){if(this.live&&this.age&&this.misses<3){var e=this.partEnd-this.fragmentStart;return this.age>Math.max(e,this.totalduration)+this.levelTargetDuration}return!1}}])}(),ur={length:0,start:function(){return 0},end:function(){return 0}},dr=function(){function e(){}return e.isBuffered=function(t,r){if(t)for(var i=e.getBuffered(t),a=i.length;a--;)if(r>=i.start(a)&&r<=i.end(a))return!0;return!1},e.bufferedRanges=function(t){if(t){var r=e.getBuffered(t);return e.timeRangesToArray(r)}return[]},e.timeRangesToArray=function(e){for(var t=[],r=0;r<e.length;r++)t.push({start:e.start(r),end:e.end(r)});return t},e.bufferInfo=function(t,r,i){if(t){var a=e.bufferedRanges(t);if(a.length)return e.bufferedInfo(a,r,i)}return{len:0,start:r,end:r,bufferedIndex:-1}},e.bufferedInfo=function(e,t,r){t=Math.max(0,t),e.length>1&&e.sort((function(e,t){return e.start-t.start||t.end-e.end}));var i=-1,a=[];if(r)for(var n=0;n<e.length;n++){t>=e[n].start&&t<=e[n].end&&(i=n);var s=a.length;if(s){var o=a[s-1].end;e[n].start-o<r?e[n].end>o&&(a[s-1].end=e[n].end):a.push(e[n])}else a.push(e[n])}else a=e;for(var l,u=0,d=t,h=t,f=0;f<a.length;f++){var c=a[f].start,g=a[f].end;if(-1===i&&t>=c&&t<=g&&(i=f),t+r>=c&&t<g)d=c,u=(h=g)-t;else if(t+r<c){l=c;break}}return{len:u,start:d||0,end:h||0,nextStart:l,buffered:e,bufferedIndex:i}},e.getBuffered=function(e){try{return e.buffered||ur}catch(e){return fe.log("failed to get media.buffered",e),ur}},e}();function hr(e,t,r){fr(e,t,r),e.addEventListener(t,r)}function fr(e,t,r){e.removeEventListener(t,r)}function cr(e){for(var t="",r=e.length,i=0;i<r;i++)t+="["+e.start(i).toFixed(3)+"-"+e.end(i).toFixed(3)+"]";return t}var gr=/(avc[1234]|hvc1|hev1|dvh[1e]|vp09|av01)(?:\.[^.,]+)+/,vr="HlsJsTrackRemovedError",mr=function(e){function t(t){var r;return(r=e.call(this,t)||this).name=vr,r}return u(t,e),t}(v(Error)),pr=function(e){function t(t,r){var i,a;return(i=e.call(this,"buffer-controller",t.logger)||this).hls=void 0,i.fragmentTracker=void 0,i.fragmentAppendProgress=Object.create(null),i.appendsWithoutProgress=Object.create(null),i.details=null,i._objectUrl=null,i.operationQueue=null,i.bufferCodecEventsTotal=0,i.media=null,i.mediaSource=null,i.lastMpegAudioChunk=null,i.lastVideoAppendEnd=0,i.appendSource=void 0,i.transferData=void 0,i.overrides=void 0,i.appendErrors={audio:0,video:0,audiovideo:0},i.appendError=void 0,i._quotaEvictionPending={},i.tracks={},i.sourceBuffers=[[null,null],[null,null]],i._onEndStreaming=function(e){var t;i.hls&&"open"===(null==(t=i.mediaSource)?void 0:t.readyState)&&i.media&&!i.media.seeking&&i.hls.pauseBuffering()},i._onStartStreaming=function(e){i.hls&&i.hls.resumeBuffering()},i._onMediaSourceOpen=function(e){var t=i,r=t.media,a=t.mediaSource;e&&i.log("Media source opened"),r&&a&&(fr(a,"sourceopen",i._onMediaSourceOpen),fr(r,"emptied",i._onMediaEmptied),i.updateDuration(),i.hls.trigger(O.MEDIA_ATTACHED,{media:r,mediaSource:a}),null!==i.mediaSource&&i.checkPendingTracks())},i._onMediaSourceClose=function(){if(i.log("Media source closed"),i.media){var e=i.media.error,t=i,r=t.appendError,a=t.appendErrors,n=!1;!r&&e&&(n=Math.max(++a.audio,++a.video,++a.audiovideo)>=i.hls.config.appendErrorMaxRetry);var s=new Error("MediaSource closed while media attached"+Tr(n,e));i.warn(s),i.hls.trigger(O.ERROR,o({fatal:n},r,{type:x.MEDIA_ERROR,details:w.MEDIA_SOURCE_REQUIRES_RESET,error:s}))}},i._onMediaSourceEnded=function(){i.log("Media source ended")},i._onMediaEmptied=function(){var e=i,t=e.mediaSrc,r=e._objectUrl;t!==r&&i.error("Media element src was set while attaching MediaSource ("+r+" > "+t+")")},i._onMediaError=function(){var e,t,r=i.media;r&&i.log("Media error (code: "+(null==(e=r.error)?void 0:e.code)+"): "+(null==(t=r.error)?void 0:t.message))},i.hls=t,i.fragmentTracker=r,i.appendSource=(a=ve(t.config.preferManagedMediaSource),"undefined"!=typeof self&&a===self.ManagedMediaSource),i.initTracks(),i.registerListeners(),i}u(t,e);var r=t.prototype;return r.hasSourceTypes=function(){return Object.keys(this.tracks).length>0},r.destroy=function(){this.unregisterListeners(),this.details=null,this.lastMpegAudioChunk=null,this.transferData=this.overrides=void 0,this.operationQueue&&(this.operationQueue.destroy(),this.operationQueue=null),this.hls=this.fragmentTracker=null,this._onMediaSourceOpen=this._onMediaSourceClose=null,this._onMediaSourceEnded=null,this._onStartStreaming=this._onEndStreaming=null,this._onMediaEmptied=this._onMediaError=null},r.registerListeners=function(){var e=this.hls;e.on(O.MEDIA_ATTACHING,this.onMediaAttaching,this),e.on(O.MEDIA_DETACHING,this.onMediaDetaching,this),e.on(O.MANIFEST_LOADING,this.onManifestLoading,this),e.on(O.MANIFEST_PARSED,this.onManifestParsed,this),e.on(O.BUFFER_RESET,this.onBufferReset,this),e.on(O.BUFFER_APPENDING,this.onBufferAppending,this),e.on(O.BUFFER_CODECS,this.onBufferCodecs,this),e.on(O.BUFFER_EOS,this.onBufferEos,this),e.on(O.BUFFER_FLUSHING,this.onBufferFlushing,this),e.on(O.LEVEL_UPDATED,this.onLevelUpdated,this),e.on(O.FRAG_PARSED,this.onFragParsed,this),e.on(O.FRAG_CHANGED,this.onFragChanged,this),e.on(O.ERROR,this.onError,this)},r.unregisterListeners=function(){var e=this.hls;e.off(O.MEDIA_ATTACHING,this.onMediaAttaching,this),e.off(O.MEDIA_DETACHING,this.onMediaDetaching,this),e.off(O.MANIFEST_LOADING,this.onManifestLoading,this),e.off(O.MANIFEST_PARSED,this.onManifestParsed,this),e.off(O.BUFFER_RESET,this.onBufferReset,this),e.off(O.BUFFER_APPENDING,this.onBufferAppending,this),e.off(O.BUFFER_CODECS,this.onBufferCodecs,this),e.off(O.BUFFER_EOS,this.onBufferEos,this),e.off(O.BUFFER_FLUSHING,this.onBufferFlushing,this),e.off(O.LEVEL_UPDATED,this.onLevelUpdated,this),e.off(O.FRAG_PARSED,this.onFragParsed,this),e.off(O.FRAG_CHANGED,this.onFragChanged,this),e.off(O.ERROR,this.onError,this)},r.transferMedia=function(){var e=this,t=this.media,r=this.mediaSource;if(!t)return null;var i={};if(this.operationQueue){var a=this.isUpdating();a||this.operationQueue.removeBlockers();var n=this.isQueued();(a||n)&&this.warn("Transfering MediaSource with"+(n?" operations in queue":"")+(a?" updating SourceBuffer(s)":"")+" "+this.operationQueue),this.operationQueue.destroy()}var s=this.transferData;return s&&!this.sourceBufferCount&&s.mediaSource===r?o(i,s.tracks):this.sourceBuffers.forEach((function(t){var r=t[0];r&&(i[r]=o({},e.tracks[r]),e.removeBuffer(r)),t[0]=t[1]=null})),{media:t,mediaSource:r,tracks:i}},r.initTracks=function(){this.resetAppendProgress(),this.sourceBuffers=[[null,null],[null,null]],this.tracks={},this.resetQueue(),this.lastMpegAudioChunk=null,this.lastVideoAppendEnd=0},r.onManifestLoading=function(){this.bufferCodecEventsTotal=0,this.details=null,this.resetAppendErrors(),this.resetAppendProgress()},r.onManifestParsed=function(e,t){var r,i=2;(t.audio&&!t.video||!t.altAudio)&&(i=1),this.bufferCodecEventsTotal=i,this.log(i+" bufferCodec event(s) expected."),null!=(r=this.transferData)&&r.mediaSource&&this.sourceBufferCount&&i&&this.bufferCreated()},r.onMediaAttaching=function(e,t){var r=this.media=t.media;this.transferData=this.overrides=void 0;var i=ve(this.appendSource);if(i){var a=!!t.mediaSource;(a||t.overrides)&&(this.transferData=t,this.overrides=t.overrides);var n=this.mediaSource=t.mediaSource||new i;if(this.assignMediaSource(n),a)this._objectUrl=r.src,this.attachTransferred();else{var s=this._objectUrl=self.URL.createObjectURL(n);if(this.appendSource)try{r.removeAttribute("src");var o=self.ManagedMediaSource;r.disableRemotePlayback=r.disableRemotePlayback||o&&n instanceof o,yr(r),function(e,t){var r=self.document.createElement("source");r.type="video/mp4",r.src=t,e.appendChild(r)}(r,s),r.load()}catch(e){r.src=s}else r.src=s}hr(r,"emptied",this._onMediaEmptied),hr(r,"error",this._onMediaError),this.appendSource&&hr(r,"seeking",this._onStartStreaming)}},r.assignMediaSource=function(e){var t,r;this.log(((null==(t=this.transferData)?void 0:t.mediaSource)===e?"transferred":"created")+" media source: "+(null==(r=e.constructor)?void 0:r.name)),hr(e,"sourceopen",this._onMediaSourceOpen),hr(e,"sourceended",this._onMediaSourceEnded),hr(e,"sourceclose",this._onMediaSourceClose),this.appendSource&&(hr(e,"startstreaming",this._onStartStreaming),hr(e,"endstreaming",this._onEndStreaming))},r.attachTransferred=function(){var e=this,t=this.media,r=this.transferData;if(r&&t){var i=this.tracks,a=r.tracks,n=a?Object.keys(a):null,s=n?n.length:0,o=function(){Promise.resolve().then((function(){e.media&&e.mediaSourceOpenOrEnded&&e._onMediaSourceOpen()}))};if(a&&n&&s){if(!this.tracksReady)return this.hls.config.startFragPrefetch=!0,void this.log("attachTransferred: waiting for SourceBuffer track info");if(this.log("attachTransferred: (bufferCodecEventsTotal "+this.bufferCodecEventsTotal+")\nrequired tracks: "+Bt(i,(function(e,t){return"initSegment"===e?void 0:t}))+";\ntransfer tracks: "+Bt(a,(function(e,t){return"initSegment"===e?void 0:t}))+"}"),!function(e,t){var r=Object.keys(e),i=Object.keys(t),a=r.length,n=i.length;return!a||!n||a===n&&!r.some((function(e){return-1===i.indexOf(e)}))}(a,i)){r.mediaSource=null,r.tracks=void 0;var l=t.currentTime,u=this.details,d=Math.max(l,(null==u?void 0:u.fragments[0].start)||0);return d-l>1?void this.log("attachTransferred: waiting for playback to reach new tracks start time "+l+" -> "+d):(this.warn('attachTransferred: resetting MediaSource for incompatible tracks ("'+Object.keys(a)+'"->"'+Object.keys(i)+'") start time: '+d+" currentTime: "+l),this.onMediaDetaching(O.MEDIA_DETACHING,{}),this.onMediaAttaching(O.MEDIA_ATTACHING,r),void(t.currentTime=d))}this.transferData=void 0,n.forEach((function(t){var r=t,i=a[r];if(i){var n=i.buffer;if(n){var s=e.fragmentTracker,o=i.id;if(s.hasFragments(o)||s.hasParts(o)){var l=dr.getBuffered(n);s.detectEvictedFragments(r,l,o,null,null,!0)}var u=Er(r),d=[r,n];e.sourceBuffers[u]=d,n.updating&&e.operationQueue&&e.operationQueue.prependBlocker(r),e.trackSourceBuffer(r,i)}}})),o(),this.bufferCreated()}else this.log("attachTransferred: MediaSource w/o SourceBuffers"),o()}},r.onMediaDetaching=function(e,t){var r=this,i=!!t.transferMedia;this.transferData=this.overrides=void 0;var a=this.media,n=this.mediaSource,s=this._objectUrl;if(n){if(this.log("media source "+(i?"transferring":"detaching")),i)this.sourceBuffers.forEach((function(e){var t=e[0];t&&r.removeBuffer(t)})),this.resetQueue();else{if(this.mediaSourceOpenOrEnded){var o="open"===n.readyState;try{for(var l=n.sourceBuffers,u=l.length;u--;)o&&l[u].abort(),n.removeSourceBuffer(l[u]);o&&n.endOfStream()}catch(e){this.warn("onMediaDetaching: "+e.message+" while calling endOfStream")}}this.sourceBufferCount&&this.onBufferReset()}fr(n,"sourceopen",this._onMediaSourceOpen),fr(n,"sourceended",this._onMediaSourceEnded),fr(n,"sourceclose",this._onMediaSourceClose),this.appendSource&&(fr(n,"startstreaming",this._onStartStreaming),fr(n,"endstreaming",this._onEndStreaming)),this.mediaSource=null,this._objectUrl=null}a&&(fr(a,"emptied",this._onMediaEmptied),fr(a,"error",this._onMediaError),fr(a,"seeking",this._onStartStreaming),i||(s&&self.URL.revokeObjectURL(s),this.mediaSrc===s?(a.removeAttribute("src"),this.appendSource&&yr(a),a.load()):this.warn("media|source.src was changed by a third party - skip cleanup")),this.media=null)},r.onBufferReset=function(){var e=this;this.sourceBuffers.forEach((function(t){var r=t[0];r&&e.resetBuffer(r)})),this.initTracks()},r.resetBuffer=function(e){var t,r=null==(t=this.tracks[e])?void 0:t.buffer;if(this.removeBuffer(e),r)try{var i;null!=(i=this.mediaSource)&&i.sourceBuffers.length&&this.mediaSource.removeSourceBuffer(r)}catch(t){this.warn("onBufferReset "+e,t)}delete this.tracks[e]},r.removeBuffer=function(e){this.removeBufferListeners(e),this.sourceBuffers[Er(e)]=[null,null];var t=this.tracks[e];t&&(this.clearBufferAppendTimeoutId(t),t.buffer=void 0)},r.resetQueue=function(){this.operationQueue&&this.operationQueue.destroy(),this.operationQueue=new Kt(this.tracks)},r.onBufferCodecs=function(e,t){var r,i=this,a=this.tracks,n=Object.keys(t);this.log('BUFFER_CODECS: "'+n+'" (current SB count '+this.sourceBufferCount+")");var s="audiovideo"in t&&(a.audio||a.video)||a.audiovideo&&("audio"in t||"video"in t),o=!s&&this.sourceBufferCount&&this.media&&n.some((function(e){return!a[e]}));s||o?this.warn('Unsupported transition between "'+Object.keys(a)+'" and "'+n+'" SourceBuffers'):(n.forEach((function(e){var r,n,s=t[e],o=s.id,l=s.codec,u=s.levelCodec,d=s.container,h=s.metadata,f=s.supplemental,c=a[e],g=null==(r=i.transferData)||null==(r=r.tracks)?void 0:r[e],v=null!=g&&g.buffer?g:c,m=(null==v?void 0:v.pendingCodec)||(null==v?void 0:v.codec),p=null==v?void 0:v.levelCodec;c||(c=a[e]={buffer:void 0,listeners:[],codec:l,supplemental:f,container:d,levelCodec:u,metadata:h,id:o});var y=At(m,p),E=null==y?void 0:y.replace(gr,"$1"),T=At(l,u),S=null==(n=T)?void 0:n.replace(gr,"$1");T&&y&&E!==S&&("audio"===e.slice(0,5)&&(T=Rt(T,i.appendSource)),i.log("switching codec "+m+" to "+T),T!==(c.pendingCodec||c.codec)&&(c.pendingCodec=T),c.container=d,i.appendChangeType(e,d,T))})),(this.tracksReady||this.sourceBufferCount)&&(t.tracks=this.sourceBufferTracks),this.sourceBufferCount||(this.bufferCodecEventsTotal>1&&!this.tracks.video&&!t.video&&"main"===(null==(r=t.audio)?void 0:r.id)&&(this.log("Main audio-only"),this.bufferCodecEventsTotal=1),this.mediaSourceOpenOrEnded&&this.checkPendingTracks()))},r.appendChangeType=function(e,t,r){var i=this,a=t+";codecs="+r,n={label:"change-type="+a,execute:function(){var n=i.tracks[e];if(n){var s=n.buffer;null!=s&&s.changeType&&(i.log("changing "+e+" sourceBuffer type to "+a),s.changeType(a),n.codec=r,n.container=t)}i.shiftAndExecuteNext(e)},onStart:function(){},onComplete:function(){},onError:function(t){i.warn("Failed to change "+e+" SourceBuffer type",t)}};this.append(n,e,this.isPending(this.tracks[e]))},r.blockAudio=function(e){var t,r=this,i=e.start,a=i+.05*e.duration;if(!0!==(null==(t=this.fragmentTracker.getAppendedFrag(i,N.MAIN))?void 0:t.gap)){var n={label:"block-audio",execute:function(){var e,t;(r.lastVideoAppendEnd>a||dr.isBuffered(null==(e=r.tracks.video)?void 0:e.buffer,a)||!0===(null==(t=r.fragmentTracker.getAppendedFrag(a,N.MAIN))?void 0:t.gap))&&r.unblockAudio()},onStart:function(){},onComplete:function(){},onError:function(e){r.warn("Error executing block-audio operation",e)}};this.append(n,"audio",!0)}},r.unblockAudio=function(){this.operationQueue&&this.operationQueue.unblockAudio()},r.onBufferAppending=function(e,t){var r=this,i=this.tracks,a=t.data,n=t.type,s=t.parent,o=t.frag,l=t.part,u=t.chunkMeta,d=t.offset,h=u.buffering[n],f=G(o)&&!l&&!o.gap&&!u.partial&&!u.iframe,c=null,g=!1,v=o.sn,m=o.cc,p=self.performance.now();h.start=p;var y=o.stats.buffering,E=l?l.stats.buffering:null;0===y.start&&(y.start=p),0===(null==E?void 0:E.start)&&(E.start=p);var T=i.audio,S=!1;"audio"===n&&"audio/mpeg"===(null==T?void 0:T.container)&&(S=!this.lastMpegAudioChunk||1===u.id||this.lastMpegAudioChunk.sn!==u.sn,this.lastMpegAudioChunk=u);var L=i.video,R=null==L?void 0:L.buffer;if(R&&"initSegment"!==v&&void 0!==d){var A=null==T?void 0:T.buffer,b=l||o;if("audio"===n&&"main"!==s&&!L.ending&&!L.ended&&A&&dr.getBuffered(A).length){var k=b.start+.05*b.duration,D=dr.getBuffered(R),I=this.currentOp("video");D.length||I?!dr.isBuffered(R,k)&&this.lastVideoAppendEnd<k&&this.blockAudio(b):this.blockAudio(b)}else if("video"===n){var C=b.end,P=this.lastVideoAppendEnd-C;this.lastVideoAppendEnd=C,P<0||P>b.duration?this.unblockAudio():this.isAudioBlocked()&&this.executeNext("audio")}}var M=(l||o).start,F={label:"append-"+n,execute:function(){var e;h.executeStart=self.performance.now();var t=null==(e=r.tracks[n])?void 0:e.buffer;t&&(f&&(c=dr.timeRangesToArray(dr.getBuffered(t)),g=Rr(Lr(c,o),o)),S?r.updateTimestampOffset(t,M,.1,n,v,m):void 0!==d&&_(d)&&r.updateTimestampOffset(t,d,1e-6,n,v,m)),r.appendExecutor(a,n)},onStart:function(){},onComplete:function(){r.clearBufferAppendTimeoutId(r.tracks[n]);var e=self.performance.now();h.executeEnd=h.end=e,0===y.first&&(y.first=e),0===(null==E?void 0:E.first)&&(E.first=e);var t={};if(r.sourceBuffers.forEach((function(e){var r=e[0],i=e[1];r&&(t[r]=dr.getBuffered(i))})),f){var i=r.getFragmentAppendProgress(o),a=t[n];if(a&&c){var d=Lr(dr.timeRangesToArray(a),o);i.progressed||(i.progressed=d-Lr(c,o)>.001);var v=g&&Rr(d,o);i.fullyBuffered[n]=(void 0===i.fullyBuffered[n]||i.fullyBuffered[n])&&v}}r.hls.trigger(O.BUFFER_APPENDED,{type:n,frag:o,part:l,chunkMeta:u,parent:s,timeRanges:t})},onError:function(e){var t;r.clearBufferAppendTimeoutId(r.tracks[n]);var i=e.code===DOMException.QUOTA_EXCEEDED_ERR||"QuotaExceededError"==e.name||"quota"in e;if(i&&!r._quotaEvictionPending[n]){var d=r.getBackBufferEvictionTarget(n,a.byteLength,o.type);if(d>0){r._quotaEvictionPending[n]=!0,r.log('QuotaExceededError on "'+n+'" append sn: '+v+" - evicting back buffer to "+d.toFixed(3)+"s and retrying");var h=r.getFlushOp(n,0,d),c=r.getClearEvictionPendingOp(n);return void r.insertNext([h,F,c],n)}r.warn('QuotaExceededError on "'+n+'" sn: '+v+" - no back buffer available to evict")}f&&(r.getFragmentAppendProgress(o).errored=!0);var g={type:x.MEDIA_ERROR,parent:s,details:w.BUFFER_APPEND_ERROR,sourceBufferName:n,frag:o,part:l,chunkMeta:u,error:e,err:e,fatal:!1},m=null==(t=r.media)?void 0:t.error;if(e.name!==vr||0!==r.sourceBufferCount||r.media&&0!==r.pendingTrackCount){var p;i&&(g.details=w.BUFFER_FULL_ERROR);var y=++r.appendErrors[n],E=r.hls.config.appendErrorMaxRetry;r.warn("Failed "+y+"/"+(E+1)+' times to append segment in "'+n+'" sourceBuffer with error: '+e.message),y>=E&&(g.fatal=!i);var T=null==(p=r.mediaSource)?void 0:p.readyState;("ended"===T||"closed"===T||m)&&(r.warn('MediaSource readyState "'+T+'" during SourceBuffer'+Tr(g.fatal,m)),g.details=w.MEDIA_SOURCE_REQUIRES_RESET)}else g.errorAction=or(!0);r.appendError=g,r.hls.trigger(O.ERROR,g),i&&r.hls&&r.trimBuffers(o.start,1)}};this.log('queuing "'+n+'" append sn: '+v+(l?" p: "+l.index:"")+" of "+s+" playlist "+o.level+" cc: "+m+" offset: "+d+" bytes: "+a.byteLength),this.append(F,n,this.isPending(this.tracks[n]))},r.getClearEvictionPendingOp=function(e){var t=this;return{label:"clear",execute:function(){t._quotaEvictionPending[e]=!1,t.shiftAndExecuteNext(e)},onStart:function(){},onComplete:function(){},onError:function(){}}},r.getFlushOp=function(e,t,r){var i=this;return this.log('queuing "'+e+'" remove '+t+"-"+r),{label:"remove",execute:function(){i.removeExecutor(e,t,r)},onStart:function(){},onComplete:function(){var a,n=null==(a=i.tracks[e])?void 0:a.buffer;i.log("Remove request "+t+"-"+r+" from "+e+" Source Buffer complete > buffer: "+(n?cr(dr.getBuffered(n)):"(detached)")),i.hls.trigger(O.BUFFER_FLUSHED,{type:e,start:t,end:r})},onError:function(a){i.warn("Failed to remove "+t+"-"+r+' from "'+e+'" SourceBuffer',a),i.hls.trigger(O.BUFFER_FLUSHED,{type:e,start:0,end:0,error:a})}}},r.onBufferFlushing=function(e,t){var r=this,i=t.type,a=t.startOffset,n=t.endOffset;i&&"audio"!==i||this.unblockAudio(),i?this.append(this.getFlushOp(i,a,n),i):this.sourceBuffers.forEach((function(e){var t=e[0];t&&r.append(r.getFlushOp(t,a,n),t)}))},r.onFragParsed=function(e,t){var r=this,i=t.frag,a=t.part,n=t.chunkMeta,s=[],o=a?a.elementaryStreams:i.elementaryStreams;o[B.AUDIOVIDEO]?s.push("audiovideo"):(o[B.AUDIO]&&s.push("audio"),o[B.VIDEO]&&s.push("video")),0===s.length&&this.log("Fragments must have at least one ElementaryStreamType set. "+i.type+" "+i.level+" "+(a?"part: "+a.index+" of ":"")+"sn: "+i.sn),this.blockBuffers((function(){var e=self.performance.now();i.stats.buffering.end=e,a&&(a.stats.buffering.end=e);var t=a?a.stats:i.stats;r.checkAppendProgress(i,a,n,s),r.hls&&(r.hls.trigger(O.FRAG_BUFFERED,{frag:i,part:a,stats:t,id:i.type,chunkMeta:n}),!a&&i.gap&&t.retry&&r.log("Nothing buffered for "+i.type+" level: "+i.level+" sn: "+i.sn+" retries "+t.retry))}),s).catch((function(e){r.warn("Fragment buffered callback "+e.message),r.stepOperationQueue(r.sourceBufferTypes)}))},r.onFragChanged=function(e,t){var r,i,a=this,n=null==(r=this.hls)?void 0:r.config;if(n){var s=n.backBufferLength,o=n.frontBufferFlushThreshold;this.trimBuffers(o,s,t.frag,t.previousFrag);var l=t.frag.elementaryStreams,u=this.appendErrors,d=null==(i=this.appendError)?void 0:i.sourceBufferName;Object.keys(l).forEach((function(e){l[e]&&(u[e]=0,e===d&&(a.appendError=void 0),"audio"===e||"video"===e?(u.audiovideo=0,"audiovideo"===d&&(a.appendError=void 0)):(u.audio=0,u.video=0,"audiovideo"!==d&&(a.appendError=void 0)))}))}},r.onBufferEos=function(e,t){var r,i=this;this.sourceBuffers.forEach((function(e){var r=e[0];if(r){var a=i.tracks[r];t.type&&t.type!==r||(a.ending=!0,a.ended||(a.ended=!0,i.log(r+" buffer reached EOS")))}}));var a=!1!==(null==(r=this.overrides)?void 0:r.endOfStream);this.sourceBufferCount>0&&!this.sourceBuffers.some((function(e){var t,r=e[0];return r&&!(null!=(t=i.tracks[r])&&t.ended)}))?(this.unblockAudio(),a?(this.log("Queueing EOS"),this.blockUntilOpen((function(){i.tracksEnded();var e=i.mediaSource;"open"===(null==e?void 0:e.readyState)?(i.log("Calling mediaSource.endOfStream()"),e.endOfStream(),i.hls.trigger(O.BUFFERED_TO_END,void 0)):e&&i.log("Could not call mediaSource.endOfStream(). mediaSource.readyState: "+e.readyState)}))):(this.tracksEnded(),this.hls.trigger(O.BUFFERED_TO_END,void 0))):"video"===t.type&&this.unblockAudio()},r.tracksEnded=function(){var e=this;this.sourceBuffers.forEach((function(t){var r=t[0];if(null!==r){var i=e.tracks[r];i&&(i.ending=!1)}}))},r.onLevelUpdated=function(e,t){var r=t.details;r.fragments.length&&(this.details=r,this.updateDuration())},r.updateDuration=function(){var e=this;this.blockUntilOpen((function(){var t=e.getDurationAndRange();t&&e.updateMediaSource(t)}))},r.onError=function(e,t){if(t.details===w.BUFFER_APPEND_ERROR&&t.frag){var r,i=null==(r=t.errorAction)?void 0:r.nextAutoLevel;_(i)&&i!==t.frag.level&&this.resetAppendErrors()}},r.getBackBufferEvictionTarget=function(e,t,r){var i=this.media;return i?this.fragmentTracker.getBackBufferEvictionEnd(i.currentTime,r,t):0},r.getFragmentAppendProgress=function(e){var t,r=Sr(e),i=this.fragmentAppendProgress[r];return(null==(t=i)?void 0:t.stats)!==e.stats&&(i={stats:e.stats,progressed:!1,errored:!1,fullyBuffered:Object.create(null)},this.fragmentAppendProgress[r]=i),i},r.checkAppendProgress=function(e,t,r,i){if(!(t||!G(e)||e.gap||r.iframe||r.partial)){var a=Sr(e),n=this.fragmentAppendProgress[a];delete this.fragmentAppendProgress[a];var s=e.stats.buffering;if(!s.start||s.first){var o=(null==n?void 0:n.stats)===e.stats?n:void 0;if(null==o||!o.errored){var l=i.length>0&&i.every((function(e){return!0===(null==o?void 0:o.fullyBuffered[e])}));if(null!=o&&o.progressed||l)delete this.appendsWithoutProgress[a];else if(o||0!==i.length){var u=(this.appendsWithoutProgress[a]||0)+1,d=this.hls;u>=d.config.appendErrorMaxRetry?delete this.appendsWithoutProgress[a]:this.appendsWithoutProgress[a]=u,this.warn("Fragment "+e.sn+" of "+e.type+" playlist "+e.level+" appended "+u+" time"+(u>1?"s":"")+" without buffered range growth"),d.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.BUFFER_APPEND_NO_PROGRESS,fatal:!1,frag:e,chunkMeta:r,parent:e.type,appendsWithoutProgress:u,error:new Error("Fragment append did not increase buffered coverage ("+u+")")})}}}}},r.resetAppendProgress=function(){this.fragmentAppendProgress=Object.create(null),this.appendsWithoutProgress=Object.create(null)},r.resetAppendErrors=function(){this.appendErrors={audio:0,video:0,audiovideo:0},this.appendError=void 0},r.trimBuffers=function(e,t,r,i){var a=this.hls,n=this.details,s=this.media;if(s&&null!==n&&this.sourceBufferCount){var o=a.config,l=s.currentTime,u=n.levelTargetDuration;t=n.live&&null!==o.liveBackBufferLength?o.liveBackBufferLength:t;var d=-1/0;if(_(t)&&t>=0){var h=Math.max(t,u);d=Math.floor(l/u)*u-h}if(r){var f=this.getLoopBackBufferFlushEnd(r,null!=i?i:null);f>0&&(d=Math.max(d,f))}if(d>0&&this.flushBackBuffer(l,u,d),_(e)&&e>0){var c=Math.max(o.maxBufferLength,e),g=Math.max(c,u),v=Math.floor(l/u)*u+g;this.flushFrontBuffer(l,u,v)}}},r.getLoopBackBufferFlushEnd=function(e,t){var r,i=this.media;if(!1===(null==(r=this.hls)?void 0:r.config.loopBackBufferFlush)||null==i||!i.loop||!t||e.level<=t.level)return 0;var a=e.elementaryStreams,n=a.video,s=a.audiovideo;if(null!=n&&n.partial||null!=s&&s.partial)return 0;var o=this.getEarliestElementaryStreamStart(e)-.25;return o<=0?0:(this.log("Flushing lower quality back buffer for loop: level "+e.level+", range [0-"+o.toFixed(3)+"]"),o)},r.getEarliestElementaryStreamStart=function(e){var t=e.elementaryStreams,r=t.audio,i=t.video,a=t.audiovideo,n=e.start;return a?n=Math.min(n,a.startDTS):(r&&(n=Math.min(n,r.startDTS)),i&&(n=Math.min(n,i.startDTS))),n},r.flushBackBuffer=function(e,t,r){var i=this;this.sourceBuffers.forEach((function(e){var t=e[0],a=e[1];if(a){var n=dr.getBuffered(a);if(n.length>0&&r>n.start(0)){var s,o,l;i.hls.trigger(O.BACK_BUFFER_REACHED,{bufferEnd:r});var u=i.tracks[t];if(null!=(s=i.details)&&s.live)i.hls.trigger(O.LIVE_BACK_BUFFER_REACHED,{bufferEnd:r});else if(null!=u&&u.ended&&(null==(o=i.media)||!o.loop||!1===(null==(l=i.hls)?void 0:l.config.loopBackBufferFlush)))return void i.log("Cannot flush "+t+" back buffer while SourceBuffer is in ended state");i.hls.trigger(O.BUFFER_FLUSHING,{startOffset:0,endOffset:r,type:t})}}}))},r.flushFrontBuffer=function(e,t,r){var i=this;this.sourceBuffers.forEach((function(t){var a=t[0],n=t[1];if(n){var s=dr.getBuffered(n),o=s.length;if(o<2)return;var l=s.start(o-1),u=s.end(o-1);if(r>l||e>=l&&e<=u)return;i.hls.trigger(O.BUFFER_FLUSHING,{startOffset:l,endOffset:1/0,type:a})}}))},r.getDurationAndRange=function(){var e,t=this.details,r=this.mediaSource;if(!t||!this.media||"open"!==(null==r?void 0:r.readyState))return null;var i=t.edge;if(t.live&&this.hls.config.liveDurationInfinity){if(t.fragments.length&&r.setLiveSeekableRange){var a=Math.max(0,t.fragmentStart);return{duration:1/0,start:a,end:Math.max(a,i)}}return{duration:1/0}}var n=null==(e=this.overrides)?void 0:e.duration;if(n)return _(n)?{duration:n}:null;var s=this.media.duration;return i>(_(r.duration)?r.duration:0)&&i>s||!_(s)?{duration:i}:null},r.updateMediaSource=function(e){var t=e.duration,r=e.start,i=e.end,a=this.mediaSource;a&&this.media&&"open"===a.readyState&&(a.duration!==t&&(_(t)&&this.log("Updating MediaSource duration to "+t.toFixed(3)),a.duration=t),void 0!==r&&void 0!==i&&(this.log("MediaSource duration is set to "+a.duration+". Setting seekable range to "+r+"-"+i+"."),a.setLiveSeekableRange(r,i)))},r.checkPendingTracks=function(){var e=this.bufferCodecEventsTotal,t=this.pendingTrackCount,r=this.tracks;if(this.log("checkPendingTracks (pending: "+t+" codec events expected: "+e+") "+Bt(r)),this.tracksReady){var i,a=null==(i=this.transferData)?void 0:i.tracks;a&&Object.keys(a).length?this.attachTransferred():this.createSourceBuffers()}},r.bufferCreated=function(){var e=this;if(this.sourceBufferCount){var t={};this.sourceBuffers.forEach((function(r){var i=r[0],a=r[1];if(i){var n=e.tracks[i];t[i]={buffer:a,container:n.container,codec:n.codec,supplemental:n.supplemental,levelCodec:n.levelCodec,id:n.id,metadata:n.metadata}}})),this.hls.trigger(O.BUFFER_CREATED,{tracks:t}),this.log("SourceBuffers created. Running queue: "+this.operationQueue),this.sourceBuffers.forEach((function(t){var r=t[0];e.executeNext(r)}))}else{var r=new Error("could not create source buffer for media codec(s)");this.hls.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.BUFFER_INCOMPATIBLE_CODECS_ERROR,fatal:!0,error:r,reason:r.message})}},r.createSourceBuffers=function(){var e=this.tracks,t=this.sourceBuffers,r=this.mediaSource;if(!r)throw new Error("createSourceBuffers called when mediaSource was null");for(var i in e){var a=i,n=e[a];if(this.isPending(n)){var s=this.getTrackCodec(n,a),o=n.container+";codecs="+s;n.codec=s,this.log("creating sourceBuffer("+o+")"+(this.currentOp(a)?" Queued":"")+" "+Bt(n));try{var l=r.addSourceBuffer(o),u=Er(a),d=[a,l];t[u]=d,n.buffer=l}catch(e){var h;return this.error("error while trying to add sourceBuffer: "+e.message),this.shiftAndExecuteNext(a),null==(h=this.operationQueue)||h.removeBlockers(),delete this.tracks[a],void this.hls.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.BUFFER_ADD_CODEC_ERROR,fatal:!1,error:e,sourceBufferName:a,mimeType:o,parent:n.id})}this.trackSourceBuffer(a,n)}}this.bufferCreated()},r.clearBufferAppendTimeoutId=function(e){e&&(self.clearTimeout(e.bufferAppendTimeoutId),e.bufferAppendTimeoutId=void 0)},r.getTrackCodec=function(e,t){var r=e.supplemental,i=e.codec;r&&("video"===t||"audiovideo"===t)&&mt(r,"video")&&(i=function(e,t){var r=[];if(e)for(var i=e.split(","),a=0;a<i.length;a++)vt(i[a],"video")||r.push(i[a]);return t&&r.push(t),r.join(",")}(i,r));var a=At(i,e.levelCodec);return a?"audio"===t.slice(0,5)?Rt(a,this.appendSource):a:""},r.trackSourceBuffer=function(e,t){var r=this,i=t.buffer;if(i){var a=this.getTrackCodec(t,e);this.tracks[e]={buffer:i,codec:a,container:t.container,levelCodec:t.levelCodec,supplemental:t.supplemental,metadata:t.metadata,id:t.id,listeners:[]},this.removeBufferListeners(e),this.addBufferListener(e,"updatestart",this.onSBUpdateStart),this.addBufferListener(e,"updateend",this.onSBUpdateEnd),this.addBufferListener(e,"error",this.onSBUpdateError),this.appendSource&&this.addBufferListener(e,"bufferedchange",(function(e,t){var i=t.removedRanges;null!=i&&i.length&&(r.log(e+" buffer removed "+cr(i)),r.hls.trigger(O.BUFFER_FLUSHED,{type:e,start:i.start(0),end:i.end(i.length-1)}))}))}},r.onSBUpdateStart=function(e){var t=this.currentOp(e);t&&t.onStart()},r.onSBUpdateEnd=function(e){var t,r,i=this;if("closed"!==(null==(t=this.mediaSource)?void 0:t.readyState)){var a=this.currentOp(e);if(a){if(a.onComplete(),null==(r=this.tracks[e])||null==(r=r.buffer)?void 0:r.updating)return this.log(e+' SourceBuffer updating on "updateend"'),void this.blockUntilOpen((function(){i.shiftAndExecuteNext(e)}));this.shiftAndExecuteNext(e)}}else this.resetBuffer(e)},r.onSBUpdateError=function(e,t){var r,i=null==(r=this.mediaSource)?void 0:r.readyState,a=new Error(e+" SourceBuffer error. MediaSource readyState: "+i);this.error(""+a.message,t),this.hls.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.BUFFER_APPENDING_ERROR,sourceBufferName:e,error:a,fatal:!1});var n=this.currentOp(e);n&&n.onError(a)},r.updateTimestampOffset=function(e,t,r,i,a,n){var s=t-e.timestampOffset;Math.abs(s)>=r&&(this.log("Updating "+i+" SourceBuffer timestampOffset to "+t+" (sn: "+a+" cc: "+n+")"),e.timestampOffset=t)},r.removeExecutor=function(e,t,r){var i=this.media,a=this.mediaSource,n=this.tracks[e],s=null==n?void 0:n.buffer;if(!i||!a||!s)throw new Error("Attempting to remove from the "+e+" SourceBuffer, but it does not exist");var o,l=_(i.duration)?i.duration:1/0,u=_(a.duration)?a.duration:1/0,d=Math.max(0,t);if(d>=u)return null==(o=this.currentOp(e))||o.onComplete(),void this.shiftAndExecuteNext(e);var h=Math.min(r,l,u);if(!(h>d)||n.ending&&!n.ended)throw new Error("Cannot remove "+(h<=d?"invalid range ("+d+" >= "+h+") ":"")+"from the "+e+" SourceBuffer"+(n.ending?" while track ending":""));n.ended=!1,this.log("Removing ["+d+","+h+"] from the "+e+" SourceBuffer"),s.remove(d,h)},r.appendExecutor=function(e,t){var r=this,i=this.tracks[t],a=null==i?void 0:i.buffer;if(!a)throw new mr("Attempting to append to the "+t+" SourceBuffer, but it does not exist");if(i.ending=!1,i.ended=!1,this.hls.config.appendTimeout!==1/0){var n=this.calculateAppendTimeoutTime(a);i.bufferAppendTimeoutId=self.setTimeout((function(){return r.appendTimeoutHandler(t,a,n)}),n)}a.appendBuffer(e)},r.appendTimeoutHandler=function(e,t,r){this.log("Received timeout after "+r+"ms for append on "+e+" source buffer. Aborting and triggering error.");try{t.abort()}catch(t){this.log("Failed to abort append on "+e+" source buffer after timeout.")}var i=this.currentOp(e);i&&i.onError(new Error(e+"-append-timeout"))},r.calculateAppendTimeoutTime=function(e){var t=10;this.details&&(t=this.details.levelTargetDuration);var r=2*t*1e3;if(null===this.media)return r;var i=dr.bufferInfo(e,this.media.currentTime,0);return i.len?(r=Math.max(1e3*i.len,r),Math.max(this.hls.config.appendTimeout,r)):r},r.blockUntilOpen=function(e){var t=this;if(this.isUpdating()||this.isQueued())this.blockBuffers(e).catch((function(e){t.warn("SourceBuffer blocked callback "+e),t.stepOperationQueue(t.sourceBufferTypes)}));else try{e()}catch(e){this.warn("Callback run without blocking "+this.operationQueue+" "+e)}},r.isUpdating=function(){return this.sourceBuffers.some((function(e){var t=e[0],r=e[1];return t&&r.updating}))},r.isQueued=function(){var e=this;return this.sourceBuffers.some((function(t){var r=t[0];return r&&!!e.currentOp(r)}))},r.isPending=function(e){return!!e&&!e.buffer},r.isAudioBlocked=function(){var e;return"block-audio"===(null==(e=this.currentOp("audio"))?void 0:e.label)},r.isAudioBlocking=function(){return!!this.operationQueue&&this.operationQueue.audioBlocking()},r.blockBuffers=function(e,t){var r=this;if(void 0===t&&(t=this.sourceBufferTypes),!t.length)return this.log("Blocking operation requested, but no SourceBuffers exist"),Promise.resolve().then(e);var i=this.operationQueue,a=2===t.length&&this.isAudioBlocking()?[this.appendBlocker("video")]:t.map((function(e){return r.appendBlocker(e)}));return Promise.all(a).then((function(t){i===r.operationQueue&&(e(),r.stepOperationQueue(r.sourceBufferTypes))}))},r.stepOperationQueue=function(e){var t=this;e.forEach((function(e){var r,i=null==(r=t.tracks[e])?void 0:r.buffer;!i||i.updating||"audio"===e&&t.isAudioBlocked()||t.shiftAndExecuteNext(e)}))},r.append=function(e,t,r){this.operationQueue&&this.operationQueue.append(e,t,r)},r.insertNext=function(e,t){this.operationQueue&&this.operationQueue.insertNext(e,t)},r.appendBlocker=function(e){if(this.operationQueue)return this.operationQueue.appendBlocker(e)},r.currentOp=function(e){return this.operationQueue?this.operationQueue.current(e):null},r.executeNext=function(e){e&&this.operationQueue&&this.operationQueue.executeNext(e)},r.shiftAndExecuteNext=function(e){this.operationQueue&&this.operationQueue.shiftAndExecuteNext(e)},r.addBufferListener=function(e,t,r){var i=this.tracks[e];if(i){var a=i.buffer;if(a){var n=r.bind(this,e);i.listeners.push({event:t,listener:n}),hr(a,t,n)}}},r.removeBufferListeners=function(e){var t=this.tracks[e];if(t){var r=t.buffer;r&&(t.listeners.forEach((function(e){fr(r,e.event,e.listener)})),t.listeners.length=0)}},a(t,[{key:"mediaSourceOpenOrEnded",get:function(){var e,t=null==(e=this.mediaSource)?void 0:e.readyState;return"open"===t||"ended"===t}},{key:"sourceBufferTracks",get:function(){var e=this;return Object.keys(this.tracks).reduce((function(t,r){var i=e.tracks[r];return t[r]={id:i.id,container:i.container,codec:i.codec,levelCodec:i.levelCodec},t}),{})}},{key:"bufferedToEnd",get:function(){var e=this;return this.sourceBufferCount>0&&!this.sourceBuffers.some((function(t){var r=t[0];if(r){var i=e.tracks[r];if(i)return!i.ended||i.ending}return!1}))}},{key:"tracksReady",get:function(){var e=this.pendingTrackCount;return e>0&&(e>=this.bufferCodecEventsTotal||this.isPending(this.tracks.audiovideo))}},{key:"mediaSrc",get:function(){var e,t,r=(null==(e=this.media)||null==(t=e.querySelector)?void 0:t.call(e,"source"))||this.media;return null==r?void 0:r.src}},{key:"pendingTrackCount",get:function(){var e=this;return Object.keys(this.tracks).reduce((function(t,r){return t+(e.isPending(e.tracks[r])?1:0)}),0)}},{key:"sourceBufferCount",get:function(){return this.sourceBuffers.reduce((function(e,t){return e+(t[0]?1:0)}),0)}},{key:"sourceBufferTypes",get:function(){return this.sourceBuffers.map((function(e){return e[0]})).filter((function(e){return!!e}))}}])}(ie);function yr(e){var t=e.querySelectorAll("source");[].slice.call(t).forEach((function(t){e.removeChild(t)}))}function Er(e){return"audio"===e?1:0}function Tr(e,t){return(e?"":" - triggering recovery")+(t?" with HTMLMediaElement Error: "+t.message:"")}function Sr(e){return e.type+"_"+e.sn+"_"+e.level}function Lr(e,t){for(var r=t.start,i=t.end,a=0,n=0;n<e.length;n++){var s=e[n];if(s.start>=i)break;var o=Math.max(r,s.start),l=Math.min(i,s.end);l>o&&(a+=l-o)}return a}function Rr(e,t){return t.duration-e<=.05}var Ar=function(){function e(e){this.hls=null,this.autoLevelCapping=void 0,this.media=void 0,this.restrictedLevels=void 0,this.timer=void 0,this.observer=void 0,this.clientRect=void 0,this.streamController=void 0,this.hls=e,this.autoLevelCapping=Number.POSITIVE_INFINITY,this.media=null,this.restrictedLevels=[],this.clientRect=null,this.registerListeners()}var t=e.prototype;return t.setStreamController=function(e){this.streamController=e},t.destroy=function(){this.hls&&this.unregisterListener(),(this.timer||this.observer)&&this.stopCapping(),this.media=this.clientRect=this.hls=null,this.streamController=void 0},t.registerListeners=function(){var e=this.hls;e&&(e.on(O.FPS_DROP_LEVEL_CAPPING,this.onFpsDropLevelCapping,this),e.on(O.MEDIA_ATTACHING,this.onMediaAttaching,this),e.on(O.MANIFEST_PARSED,this.onManifestParsed,this),e.on(O.LEVELS_UPDATED,this.onLevelsUpdated,this),e.on(O.BUFFER_CODECS,this.onBufferCodecs,this),e.on(O.MEDIA_DETACHING,this.onMediaDetaching,this))},t.unregisterListener=function(){var e=this.hls;e&&(e.off(O.FPS_DROP_LEVEL_CAPPING,this.onFpsDropLevelCapping,this),e.off(O.MEDIA_ATTACHING,this.onMediaAttaching,this),e.off(O.MANIFEST_PARSED,this.onManifestParsed,this),e.off(O.LEVELS_UPDATED,this.onLevelsUpdated,this),e.off(O.BUFFER_CODECS,this.onBufferCodecs,this),e.off(O.MEDIA_DETACHING,this.onMediaDetaching,this))},t.onFpsDropLevelCapping=function(e,t){if(this.hls){var r=this.hls.levels[t.droppedLevel];this.isLevelAllowed(r)&&this.restrictedLevels.push({bitrate:r.bitrate,height:r.height,width:r.width})}},t.onMediaAttaching=function(e,t){var r=t.media;this.clientRect=null,this.hls&&(r instanceof HTMLVideoElement?(this.media=r,this.hls.config.capLevelToPlayerSize&&this.observe()):this.media=null,(this.timer||this.observer)&&this.hls.levels.length>1&&this.detectPlayerSize())},t.onManifestParsed=function(e,t){this.restrictedLevels=[],t.video&&this.startCapping(),this.onLevelsUpdated()},t.onLevelsUpdated=function(){if(this.hls)if((this.timer||this.observer)&&(_(this.autoLevelCapping)||this.clientRect))this.detectPlayerSize();else if(void 0===this.observer&&void 0===this.timer){var e=this.hls.levels;e.length>1&&e.some((function(e){return!!e.videoCodec}))&&this.startCapping()}},t.onBufferCodecs=function(e,t){t.video&&this.startCapping()},t.onMediaDetaching=function(){this.stopCapping(),this.media=null},t.detectPlayerSize=function(){if(this.media){if(this.mediaHeight<=0||this.mediaWidth<=0||!this.hls)return void(this.clientRect=null);var e=this.hls.levels;if(e.length>1){var t=this.hls,r=this.getMaxLevel(e.length-1);r!==this.autoLevelCapping&&t.logger.log("Setting autoLevelCapping to "+r+": "+e[r].height+"p@"+e[r].bitrate+" for media "+this.mediaWidth+"x"+this.mediaHeight),t.autoLevelCapping=r,t.autoLevelEnabled&&t.autoLevelCapping>this.autoLevelCapping&&this.streamController&&this.streamController.nextLevelSwitch(),this.autoLevelCapping=t.autoLevelCapping}else 1===e.length&&this.stopCapping()}},t.getMaxLevel=function(t){var r=this;if(!this.hls)return-1;var i=this.hls.levels;if(!i.length)return-1;var a=i.filter((function(e,i){return r.isLevelAllowed(e)&&i<=t}));return this.observer||(this.clientRect=null),e.getMaxLevelByMediaSize(a,this.mediaWidth,this.mediaHeight)},t.observe=function(){var e=this,t=self.ResizeObserver;t&&(this.observer=new t((function(t){var r,i=null==(r=t[0])?void 0:r.contentRect;i&&(e.clientRect=i,e.detectPlayerSize())}))),this.observer&&this.media&&this.observer.observe(this.media)},t.startCapping=function(){var e;this.timer||this.observer||null==(e=this.hls)||!e.config.capLevelToPlayerSize||(self.clearInterval(this.timer),this.timer=void 0,this.autoLevelCapping=Number.POSITIVE_INFINITY,this.observe(),this.observer||(this.timer=self.setInterval(this.detectPlayerSize.bind(this),1e3)),this.detectPlayerSize())},t.stopCapping=function(){this.restrictedLevels=[],this.autoLevelCapping=Number.POSITIVE_INFINITY,this.timer&&(self.clearInterval(this.timer),this.timer=void 0),this.observer&&(this.observer.disconnect(),this.observer=void 0)},t.getDimensions=function(){if(this.clientRect)return this.clientRect;var e=this.media,t={width:0,height:0};if(e){var r=e.getBoundingClientRect();t.width=r.width,t.height=r.height,t.width||t.height||(t.width=r.right-r.left||e.width||0,t.height=r.bottom-r.top||e.height||0)}return this.clientRect=t,t},t.isLevelAllowed=function(e){return!this.restrictedLevels.some((function(t){return e.bitrate===t.bitrate&&e.width===t.width&&e.height===t.height}))},e.getMaxLevelByMediaSize=function(e,t,r){if(null==e||!e.length)return-1;for(var i,a,n=e.length-1,s=Math.max(t,r),o=0;o<e.length;o+=1){var l=e[o];if((l.width>=s||l.height>=s)&&(i=l,!(a=e[o+1])||i.width!==a.width||i.height!==a.height)){n=o;break}}return n},a(e,[{key:"mediaWidth",get:function(){return this.getDimensions().width*this.contentScaleFactor}},{key:"mediaHeight",get:function(){return this.getDimensions().height*this.contentScaleFactor}},{key:"contentScaleFactor",get:function(){var e=1;if(!this.hls)return e;var t=this.hls.config,r=t.ignoreDevicePixelRatio,i=t.maxDevicePixelRatio;if(!r)try{e=self.devicePixelRatio}catch(e){}return Math.min(e,i)}}])}(),br=/^(\d+)x(\d+)$/,kr=/(.+?)=(".*?"|.*?)(?:,|$)/g,Dr=function(){function e(t,r){"string"==typeof t&&(t=e.parseAttrList(t,r)),o(this,t)}var t=e.prototype;return t.decimalInteger=function(e){var t=parseInt(this[e],10);return t>Number.MAX_SAFE_INTEGER?1/0:t},t.hexadecimalInteger=function(e){if(this[e]){var t=(this[e]||"0x").slice(2);t=(1&t.length?"0":"")+t;for(var r=new Uint8Array(t.length/2),i=0;i<t.length/2;i++)r[i]=parseInt(t.slice(2*i,2*i+2),16);return r}return null},t.hexadecimalIntegerAsNumber=function(e){var t=parseInt(this[e],16);return t>Number.MAX_SAFE_INTEGER?1/0:t},t.decimalFloatingPoint=function(e){return parseFloat(this[e])},t.optionalFloat=function(e,t){var r=this[e];return r?parseFloat(r):t},t.enumeratedString=function(e){return this[e]},t.enumeratedStringList=function(e,t){var r=this[e];return(r?r.split(/[ ,]+/):[]).reduce((function(e,t){return e[t.toLowerCase()]=!0,e}),t)},t.bool=function(e){return"YES"===this[e]},t.decimalResolution=function(e){var t=br.exec(this[e]);if(null!==t)return{width:parseInt(t[1],10),height:parseInt(t[2],10)}},e.parseAttrList=function(e,t){var r,i={};for(kr.lastIndex=0;null!==(r=kr.exec(e));){var a=r[1].trim(),n=r[2],s=0===n.indexOf('"')&&n.lastIndexOf('"')===n.length-1,o=!1;if(s)n=n.slice(1,-1);else switch(a){case"IV":case"SCTE35-CMD":case"SCTE35-IN":case"SCTE35-OUT":o=!0}if(t&&(s||o));else if(!o&&!s)switch(a){case"CLOSED-CAPTIONS":if("NONE"===n)break;case"ALLOWED-CPC":case"CLASS":case"ASSOC-LANGUAGE":case"AUDIO":case"BYTERANGE":case"CHANNELS":case"CHARACTERISTICS":case"CODECS":case"DATA-ID":case"END-DATE":case"GROUP-ID":case"ID":case"IMPORT":case"INSTREAM-ID":case"KEYFORMAT":case"KEYFORMATVERSIONS":case"LANGUAGE":case"NAME":case"PATHWAY-ID":case"QUERYPARAM":case"RECENTLY-REMOVED-DATERANGES":case"SERVER-URI":case"STABLE-RENDITION-ID":case"STABLE-VARIANT-ID":case"START-DATE":case"SUBTITLES":case"SUPPLEMENTAL-CODECS":case"URI":case"VALUE":case"VIDEO":case"X-ASSET-LIST":case"X-ASSET-URI":fe.warn(e+": attribute "+a+" is missing quotes")}i[a]=n}return i},a(e,[{key:"clientAttrs",get:function(){return Object.keys(this).filter((function(e){return"X-"===e.substring(0,2)}))}}])}();function Ir(e){return"SCTE35-OUT"===e||"SCTE35-IN"===e||"SCTE35-CMD"===e}var _r=function(){return a((function(e,t,r){var i;if(void 0===r&&(r=0),this.attr=void 0,this.tagAnchor=void 0,this.tagOrder=void 0,this._startDate=void 0,this._endDate=void 0,this._dateAtEnd=void 0,this._cue=void 0,this._badValueForSameId=void 0,this.tagAnchor=(null==t?void 0:t.tagAnchor)||null,this.tagOrder=null!=(i=null==t?void 0:t.tagOrder)?i:r,t){var a=t.attr;for(var n in a)if(Object.prototype.hasOwnProperty.call(e,n)&&e[n]!==a[n]){fe.warn('DATERANGE tag attribute: "'+n+'" does not match for tags with ID: "'+e.ID+'"'),this._badValueForSameId=n;break}e=o(new Dr({}),a,e)}if(this.attr=e,t?(this._startDate=t._startDate,this._cue=t._cue,this._endDate=t._endDate,this._dateAtEnd=t._dateAtEnd):this._startDate=new Date(e["START-DATE"]),"END-DATE"in e){var s=(null==t?void 0:t.endDate)||new Date(e["END-DATE"]);_(s.getTime())&&(this._endDate=s)}}),[{key:"id",get:function(){return this.attr.ID}},{key:"class",get:function(){return this.attr.CLASS}},{key:"cue",get:function(){var e=this._cue;return void 0===e?this._cue=this.attr.enumeratedStringList(this.attr.CUE?"CUE":"X-CUE",{pre:!1,post:!1,once:!1}):e}},{key:"startTime",get:function(){var e=this.tagAnchor;return null===e||null===e.programDateTime?(fe.warn('Expected tagAnchor Fragment with PDT set for DateRange "'+this.id+'": '+e),NaN):e.start+(this.startDate.getTime()-e.programDateTime)/1e3}},{key:"startDate",get:function(){return this._startDate}},{key:"endDate",get:function(){var e=this._endDate||this._dateAtEnd;if(e)return e;var t=this.duration;return null!==t?this._dateAtEnd=new Date(this._startDate.getTime()+1e3*t):null}},{key:"duration",get:function(){if("DURATION"in this.attr){var e=this.attr.decimalFloatingPoint("DURATION");if(_(e))return e}else if(this._endDate)return(this._endDate.getTime()-this._startDate.getTime())/1e3;return null}},{key:"plannedDuration",get:function(){return"PLANNED-DURATION"in this.attr?this.attr.decimalFloatingPoint("PLANNED-DURATION"):null}},{key:"endOnNext",get:function(){return this.attr.bool("END-ON-NEXT")}},{key:"isInterstitial",get:function(){return"com.apple.hls.interstitial"===this.class}},{key:"isValid",get:function(){return!!this.id&&!this._badValueForSameId&&_(this.startDate.getTime())&&(null===this.duration||this.duration>=0)&&(!this.endOnNext||!!this.class)&&(!this.attr.CUE||!this.cue.pre&&!this.cue.post||this.cue.pre!==this.cue.post)&&(!this.isInterstitial||"X-ASSET-URI"in this.attr||"X-ASSET-LIST"in this.attr)}},{key:"invalidReason",get:function(){return this.id?this._badValueForSameId?"Date range "+this._badValueForSameId+" mismatch":_(this.startDate.getTime())?!this.isInterstitial||"X-ASSET-URI"in this.attr||"X-ASSET-LIST"in this.attr?this.isValid?null:"Unknown (check DURATION(|END|NEXT), CLASS, and CUE)":"Interstitial Date range missing X-ASSET-(LIST|URI)":"Date range invalid start date":"Missing ID"}}])}();function Cr(e,t){return e.length===t.length&&!e.some((function(e,r){return e!==t[r]}))}function Pr(e,t){return!e&&!t||!(!e||!t)&&Cr(e,t)}var xr=0,wr=1;function Or(e){return"AES-128"===e||"AES-256"===e||"AES-256-CTR"===e}function Mr(e){switch(e){case"AES-128":case"AES-256":return xr;case"AES-256-CTR":return wr;default:throw new Error("invalid full segment method "+e)}}var Fr={},Nr=function(){function e(e,t,r,i,a,n){void 0===i&&(i=[1]),void 0===a&&(a=null),this.uri=void 0,this.method=void 0,this.keyFormat=void 0,this.keyFormatVersions=void 0,this.encrypted=void 0,this.isCommonEncryption=void 0,this.iv=null,this.key=null,this.keyId=null,this.pssh=null,this.scheme=void 0,this.method=e,this.uri=t,this.keyFormat=r,this.keyFormatVersions=i,this.iv=a,this.encrypted=!!e&&"NONE"!==e,this.isCommonEncryption=this.encrypted&&!Or(e),null!=n&&n.startsWith("0x")&&(this.keyId=new Uint8Array(we(n)))}e.clearKeyUriToKeyIdMap=function(){Fr={}},e.setKeyIdForUri=function(e,t){Fr[e]=t},e.addKeyIdForUri=function(e){var t=Object.keys(Fr).length%Number.MAX_SAFE_INTEGER,r=new Uint8Array(16);return new DataView(r.buffer,12,4).setUint32(0,t),Fr[e]=r,r};var t=e.prototype;return t.matches=function(e){return e.uri===this.uri&&e.method===this.method&&e.encrypted===this.encrypted&&e.keyFormat===this.keyFormat&&Cr(e.keyFormatVersions,this.keyFormatVersions)&&Pr(e.iv,this.iv)&&Pr(e.keyId,this.keyId)},t.isSupported=function(){if(this.method){if(Or(this.method)||"NONE"===this.method)return!0;if("identity"===this.keyFormat)return"SAMPLE-AES"===this.method}return!1},t.getDecryptData=function(t,r){if(!this.encrypted||!this.uri)return null;if(Or(this.method)){var i=this.iv;return i||("number"!=typeof t&&(fe.warn('missing IV for initialization segment with method="'+this.method+'" - compliance issue'),t=0),i=function(e){for(var t=new Uint8Array(16),r=12;r<16;r++)t[r]=e>>8*(15-r)&255;return t}(t)),new e(this.method,this.uri,"identity",this.keyFormatVersions,i)}return this},e}(),Br=/#EXT-X-STREAM-INF:([^\r\n]*)(?:[\r\n](?:#[^\r\n]*)?)*([^\r\n]+)|#EXT-X-(I-FRAME-STREAM-INF|SESSION-DATA|SESSION-KEY|DEFINE|CONTENT-STEERING|START):([^\r\n]*)(?:[\r\n]+|$)/g,Ur=/#EXT-X-MEDIA:(.*)/g,Gr=/^#EXT(?:INF|-X-TARGETDURATION):/m,Vr=new RegExp([/#EXTINF:\s*(\d*(?:\.\d+)?)(?:,(.*)\s+)?/.source,/(?!#) *(\S[^\r\n]*)/.source,/#.*/.source].join("|"),"g"),Hr=new RegExp([/#EXT-X-(PROGRAM-DATE-TIME|BYTERANGE|DATERANGE|DEFINE|KEY|MAP|PART|PART-INF|PLAYLIST-TYPE|PRELOAD-HINT|RENDITION-REPORT|SERVER-CONTROL|SKIP|START):(.+)/.source,/#EXT-X-(BITRATE|DISCONTINUITY-SEQUENCE|MEDIA-SEQUENCE|TARGETDURATION|VERSION): *(\d+)/.source,/#EXT-X-(DISCONTINUITY|ENDLIST|GAP|INDEPENDENT-SEGMENTS|I-FRAMES-ONLY)/.source,/(#)([^:]*):(.*)/.source,/(#)(.*)(?:.*)\r?\n?/.source].join("|")),Kr=function(){function e(){}return e.findGroup=function(e,t){for(var r=0;r<e.length;r++){var i=e[r];if(i.id===t)return i}},e.resolve=function(e,t){return I.buildAbsoluteURL(t,e,{alwaysNormalize:!0})},e.isMediaPlaylist=function(e){return Gr.test(e)},e.parseMasterPlaylist=function(t,r){var i,a={contentSteering:null,levels:[],iframeVariants:[],playlistParsingError:null,sessionData:null,sessionKeys:null,startTimeOffset:null,variableList:null,hasVariableRefs:!1},n=[];if(Br.lastIndex=0,!t.startsWith("#EXTM3U"))return a.playlistParsingError=new Error("no EXTM3U delimiter"),a;for(;null!=(i=Br.exec(t));)if(i[1]){var s=Yr(new Dr(i[1],a),i[2],r,0,n);s&&a.levels.push(s)}else if(i[3]){var o=i[3],l=i[4];switch(o){case"I-FRAME-STREAM-INF":var u=new Dr(l,a),d=Yr(u,u.URI,r,0,n,!0);d&&a.iframeVariants.push(d);break;case"SESSION-DATA":var h=new Dr(l,a),f=h["DATA-ID"];f&&(null===a.sessionData&&(a.sessionData={}),a.sessionData[f]=h);break;case"SESSION-KEY":var c=qr(l,r,a);c.encrypted&&c.isSupported()?(null===a.sessionKeys&&(a.sessionKeys=[]),a.sessionKeys.push(c)):fe.warn('[Keys] Ignoring invalid EXT-X-SESSION-KEY tag: "'+l+'"');break;case"DEFINE":break;case"CONTENT-STEERING":var g=new Dr(l,a);a.contentSteering={uri:e.resolve(g["SERVER-URI"],r),pathwayId:g["PATHWAY-ID"]||"."};break;case"START":a.startTimeOffset=Xr(l)}}var v=n.length>0&&n.length<a.levels.length;return a.levels=v?n:a.levels,0===a.levels.length&&(a.playlistParsingError=new Error("no levels found in manifest")),a},e.parseMasterPlaylistMedia=function(t,r,i){var a,n={},s=i.levels,o={AUDIO:s.map((function(e){return{id:e.attrs.AUDIO,audioCodec:e.audioCodec}})),SUBTITLES:s.map((function(e){return{id:e.attrs.SUBTITLES,textCodec:e.textCodec}})),"CLOSED-CAPTIONS":[]},l=0;for(Ur.lastIndex=0;null!==(a=Ur.exec(t));){var u=new Dr(a[1],i),d=u.TYPE;if(d){var h=o[d],f=n[d]||[];n[d]=f;var c=u.LANGUAGE,g=u["ASSOC-LANGUAGE"],v=u.CHANNELS,m=u.CHARACTERISTICS,p=u["INSTREAM-ID"],y={attrs:u,bitrate:0,id:l++,groupId:u["GROUP-ID"]||"",name:u.NAME||c||"",type:d,default:u.bool("DEFAULT"),autoselect:u.bool("AUTOSELECT"),forced:u.bool("FORCED"),lang:c,url:u.URI?e.resolve(u.URI,r):""};if(g&&(y.assocLang=g),v&&(y.channels=v),m&&(y.characteristics=m),p&&(y.instreamId=p),null!=h&&h.length){var E=e.findGroup(h,y.groupId)||h[0];Qr(y,E,"audioCodec"),Qr(y,E,"textCodec")}f.push(y)}}return n},e.parseLevelPlaylist=function(e,t,r,i,a,n){var s,l,u,d,h,f={url:t},c=new lr(t),g=c.fragments,v=[],m=null,p=0,y=0,E=0,T=0,S=0,L=null,R=new K(i,f),A=-1,b=!1,k=null;if(Vr.lastIndex=0,c.m3u8=e,c.hasVariableRefs=!1,"#EXTM3U"!==(null==(s=Vr.exec(e))?void 0:s[0]))return c.playlistParsingError=new Error("Missing format identifier #EXTM3U"),c;for(;null!==(l=Vr.exec(e));){b&&(b=!1,(R=new K(i,f)).playlistOffset=E,R.setStart(E),R.sn=p,R.cc=T,S&&(R.bitrate=S),R.level=r,m&&(R.initSegment=m,m.rawProgramDateTime&&(R.rawProgramDateTime=m.rawProgramDateTime,m.rawProgramDateTime=null),k&&(R.setByteRange(k),k=null)));var D=l[1];if(D){R.duration=parseFloat(D);var I=(" "+l[2]).slice(1);R.title=I||null,R.tagList.push(I?["INF",D,I]:["INF",D])}else if(l[3]){if(_(R.duration)){var C;R.playlistOffset=E,R.setStart(E),d&&Jr(R,d,c),R.sn=p,R.level=r,R.cc=T;var P=(" "+l[3]).slice(1);R.relurl=P,$r(R,L,v),L=R,E+=R.duration,p++,y=0;var x=R.byteRange;if(2===x.length&&(R.bitrate=8*(x[1]-x[0])/R.duration|0),c.iframesOnly&&x[0]&&(null==(C=m)?void 0:C.cc)!==T){var w=new K(i,f);w.relurl=R.relurl,w.setByteRange(Math.min(x[0],1316)+"@0"),w.level=r,w.sn="initSegment",d&&(w.levelkeys=d,d.identity&&(w._decryptdata=d.identity.getDecryptData(0))),m=w,R.initSegment=m}g.push(R),b=!0}}else{if(!(l=l[0].match(Hr))){fe.warn("No matches on slow regex match for level playlist!");continue}for(u=1;u<l.length&&void 0===l[u];u++);var O=(" "+l[u]).slice(1),M=(" "+l[u+1]).slice(1),F=l[u+2]?(" "+l[u+2]).slice(1):null;switch(O){case"BYTERANGE":L?R.setByteRange(M,L):R.setByteRange(M);break;case"PROGRAM-DATE-TIME":R.rawProgramDateTime=M,R.tagList.push(["PROGRAM-DATE-TIME",M]),-1===A&&(A=g.length);break;case"PLAYLIST-TYPE":c.type&&ei(c,O,l),c.type=M.toUpperCase();break;case"MEDIA-SEQUENCE":0!==c.startSN?ei(c,O,l):null!==L&&ti(c,O,l),c.startSN=parseInt(M),p=c.startSN+c.skippedSegments;break;case"SKIP":c.skippedSegments&&ei(c,O,l);var N=new Dr(M,c),B=N.decimalInteger("SKIPPED-SEGMENTS");if(_(B)){c.skippedSegments+=B;for(var U=B;U--;)g.push(null);p+=B}var G=N.enumeratedString("RECENTLY-REMOVED-DATERANGES");G&&(c.recentlyRemovedDateranges=(c.recentlyRemovedDateranges||[]).concat(G.split("\t")));break;case"TARGETDURATION":0!==c.targetduration&&ei(c,O,l),c.targetduration=Math.max(parseInt(M),1);break;case"VERSION":null!==c.version&&ei(c,O,l),c.version=parseInt(M);break;case"INDEPENDENT-SEGMENTS":case"DEFINE":break;case"I-FRAMES-ONLY":c.iframesOnly=!0;break;case"ENDLIST":c.live||ei(c,O,l),c.live=!1;break;case"#":(M||F)&&R.tagList.push(F?[M,F]:[M]);break;case"DISCONTINUITY":T++,R.tagList.push(["DIS"]);break;case"GAP":R.gap=!0,R.tagList.push([O]);break;case"BITRATE":R.tagList.push([O,M]),S=1e3*parseInt(M),_(S)?R.bitrate=S:S=0;break;case"DATERANGE":var V=new Dr(M,c),H=new _r(V,c.dateRanges[V.ID],c.dateRangeTagCount);c.dateRangeTagCount++,H.isValid||c.skippedSegments?c.dateRanges[H.id]=H:fe.log("Ignoring invalid DATERANGE tag: "+H.invalidReason+": "+M),R.tagList.push(["EXT-X-DATERANGE",M]);break;case"DISCONTINUITY-SEQUENCE":0!==c.startCC&&ei(c,O,l),c.startCC=T=parseInt(M),g.forEach((function(e){return e&&(e.cc=T)}));break;case"KEY":var W=qr(M,t,c);if(W.isSupported()){if("NONE"===W.method){d=void 0;break}d||(d={});var j=d[W.keyFormat];null!=j&&j.matches(W)||(j&&(d=o({},d)),d[W.keyFormat]=W)}else fe.warn('[Keys] Ignoring unsupported EXT-X-KEY tag: "'+M+'" (light build)');break;case"START":c.startTimeOffset=Xr(M);break;case"MAP":var q=new Dr(M,c);if(R.duration){var X=new K(i,f);Zr(X,q,r,d),m=X,R.initSegment=m,m.rawProgramDateTime&&!R.rawProgramDateTime&&(R.rawProgramDateTime=m.rawProgramDateTime)}else{var z=R.byteRangeEndOffset;if(z){var Q=R.byteRangeStartOffset;k=z-Q+"@"+Q}else k=null;Zr(R,q,r,d),m=R,b=!0}m.cc=T;break;case"SERVER-CONTROL":h&&ei(c,O,l),h=new Dr(M),c.canBlockReload=h.bool("CAN-BLOCK-RELOAD"),c.canSkipUntil=h.optionalFloat("CAN-SKIP-UNTIL",0),c.canSkipDateRanges=c.canSkipUntil>0&&h.bool("CAN-SKIP-DATERANGES"),c.partHoldBack=h.optionalFloat("PART-HOLD-BACK",0),c.holdBack=h.optionalFloat("HOLD-BACK",0);break;case"PART-INF":c.partTarget&&ei(c,O,l);var $=new Dr(M);c.partTarget=$.decimalFloatingPoint("PART-TARGET");break;case"PART":var Z=c.partList;Z||(Z=c.partList=[]);var J=y>0?Z[Z.length-1]:void 0,ee=y++,te=new Dr(M,c),re=new Y(te,R,f,ee,J);Z.push(re),R.duration+=re.duration;break;case"PRELOAD-HINT":var ie=new Dr(M,c);c.preloadHint=ie;break;case"RENDITION-REPORT":var ae=new Dr(M,c);c.renditionReports=c.renditionReports||[],c.renditionReports.push(ae);break;default:fe.warn("line parsed but not handled: "+l)}}}L&&!L.relurl?(g.pop(),E-=L.duration,c.partList&&(c.fragmentHint=L)):c.partList&&($r(R,L,v),R.cc=T,c.fragmentHint=R,d&&Jr(R,d,c)),c.targetduration||(c.playlistParsingError=new Error("Missing Target Duration"));var ne=g.length,se=g[0],oe=g[ne-1];if((E+=c.skippedSegments*c.targetduration)>0&&ne&&oe){c.averagetargetduration=E/ne;var le=oe.sn;c.endSN="initSegment"!==le?le:0,c.live||(oe.endList=!0),A>0&&(function(e,t,r){if(r||(r=e[t]),r)for(var i=t;i--;){var a=e[i];if(!a)return;a.programDateTime=r.programDateTime-1e3*a.duration,r=a}}(g,A,A>ne-1?R:null),se&&v.unshift(se))}return c.fragmentHint&&(E+=c.fragmentHint.duration),c.totalduration=E,v.length&&c.dateRangeTagCount&&se&&Wr(v,c),c.endCC=T,c},e}();function Yr(e,t,r,i,a,n){var s;if(void 0===t)return null;var o=t,l={attrs:e,bitrate:e.decimalInteger("BANDWIDTH")||e.decimalInteger("AVERAGE-BANDWIDTH"),name:e.NAME,url:Kr.resolve(o,r)},u=e.decimalResolution("RESOLUTION");u&&(l.width=u.width,l.height=u.height),zr(e.CODECS,l);var d=e["SUPPLEMENTAL-CODECS"];return d&&(l.supplemental={},zr(d,l.supplemental)),null!=(s=l.unknownCodecs)&&s.length||a.push(l),n&&(l.iframes=!0),l}function Wr(e,t){var r=e.length;if(!r){if(!t.hasProgramDateTime)return;var i=t.fragments[t.fragments.length-1];e.push(i),r++}for(var a=e[r-1],n=t.live?1/0:t.totalduration,s=Object.keys(t.dateRanges),o=s.length;o--;){var l=t.dateRanges[s[o]],u=l.startDate.getTime();l.tagAnchor=a.ref;for(var d=r;d--;){var h;if((null==(h=e[d])?void 0:h.sn)<t.startSN)break;var f=jr(t,u,e,d,n);if(f){l.tagAnchor=f.ref;break}}}}function jr(e,t,r,i,a){var n=r[i];if(n){var s,o=n.programDateTime;if((t>=o||0===i)&&t<=o+1e3*(((null==(s=r[i+1])?void 0:s.start)||a)-n.start)){var l=n.sn-e.startSN,u=e.fragments;if(l>=0&&l<u.length){if(u.length>r.length)for(var d=r[i+1]||u[u.length-1],h=Math.min(d.sn-e.startSN,u.length-1);h>l;h--){var f=u[h].programDateTime;if(t>=f&&t<f+1e3*u[h].duration)return u[h]}return u[l]}}}return null}function qr(e,t,r){var i,a,n=new Dr(e,r),s=null!=(i=n.METHOD)?i:"",o=n.URI,l=n.hexadecimalInteger("IV"),u=n.KEYFORMATVERSIONS,d=null!=(a=n.KEYFORMAT)?a:"identity";o&&n.IV&&!l&&fe.error("Invalid IV: "+n.IV);var h=o?Kr.resolve(o,t):"",f=(u||"1").split("/").map(Number).filter(Number.isFinite);return new Nr(s,h,d,f,l,n.KEYID)}function Xr(e){var t=new Dr(e).decimalFloatingPoint("TIME-OFFSET");return _(t)?t:null}function zr(e,t){var r=(e||"").split(/[ ,]+/).filter((function(e){return e}));["video","audio","text","image"].forEach((function(e){var i=r.filter((function(t){return vt(t,e)}));i.length&&(t[e+"Codec"]=i.map((function(e){return e.split("/")[0]})).join(","),r=r.filter((function(e){return-1===i.indexOf(e)})))})),t.unknownCodecs=r}function Qr(e,t,r){var i=t[r];i&&(e[r]=i)}function $r(e,t,r){e.rawProgramDateTime?r.push(e):null!=t&&t.programDateTime&&(e.programDateTime=t.endProgramDateTime)}function Zr(e,t,r,i){e.relurl=t.URI,t.BYTERANGE&&e.setByteRange(t.BYTERANGE),e.level=r,e.sn="initSegment",i&&(e.levelkeys=i),e.initSegment=null}function Jr(e,t,r){e.levelkeys=t;var i=r.encryptedFragments;i.length&&i[i.length-1].levelkeys===t||!Object.keys(t).some((function(e){return t[e].isCommonEncryption}))||i.push(e)}function ei(e,t,r){e.playlistParsingError=new Error("#EXT-X-"+t+" must not appear more than once ("+r[0]+")")}function ti(e,t,r){e.playlistParsingError=new Error("#EXT-X-"+t+" must appear before the first Media Segment ("+r[0]+")")}function ri(e,t){var r=t.startPTS;if(_(r)){var i,a=0;t.sn>e.sn?(a=r-e.start,i=e):(a=e.start-r,i=t),i.duration!==a&&i.setDuration(a)}else t.sn>e.sn?e.cc===t.cc&&e.minEndPTS?t.setStart(e.start+(e.minEndPTS-e.start)):t.setStart(e.start+e.duration):t.setStart(Math.max(e.start-t.duration,0))}function ii(e,t,r,i,a,n,s,o){i-r<=0&&(o.warn("Fragment should have a positive duration",t),i=r+t.duration,n=a+t.duration);var l=r,u=i,d=t.startPTS,h=t.endPTS;if(_(d)){var f=Math.abs(d-r);e&&f>e.totalduration?o.warn("media timestamps and playlist times differ by "+f+"s for level "+t.level+" "+e.url):_(t.deltaPTS)?t.deltaPTS=Math.max(f,t.deltaPTS):t.deltaPTS=f,l=Math.max(r,d),r=Math.min(r,d),a=void 0!==t.startDTS?Math.min(a,t.startDTS):a,u=Math.min(i,h),i=Math.max(i,h),n=void 0!==t.endDTS?Math.max(n,t.endDTS):n}var c=r-t.start;0!==t.start&&t.setStart(r),t.setDuration(i-t.start),t.startPTS=r,t.maxStartPTS=l,t.startDTS=a,t.endPTS=i,t.minEndPTS=u,t.endDTS=n;var g,v=t.sn;if(!e||v<e.startSN||v>e.endSN)return 0;var m=v-e.startSN,p=e.fragments;for(p[m]=t,g=m;g>0;g--)ri(p[g],p[g-1]);for(g=m;g<p.length-1;g++)ri(p[g],p[g+1]);return e.fragmentHint&&ri(p[p.length-1],e.fragmentHint),e.PTSKnown=e.alignedSliding=!0,c}function ai(e,t,r){if(e!==t){for(var i,a=null,n=e.fragments,s=n.length-1;s>=0;s--){var l=n[s].initSegment;if(l){a=l;break}}e.fragmentHint&&delete e.fragmentHint.endPTS,function(e,t,r){for(var i,a=t.skippedSegments,n=Math.max(e.startSN,t.startSN)-t.startSN,s=(e.fragmentHint?1:0)+(a?t.endSN:Math.min(e.endSN,t.endSN))-t.startSN,o=t.startSN-e.startSN,l=t.fragmentHint?t.fragments.concat(t.fragmentHint):t.fragments,u=null!=(i=e.fragmentHint)&&i.duration?e.fragments.concat(e.fragmentHint):e.fragments,d=n;d<=s;d++){var h=u[o+d],f=l[d];if(a&&!f&&h&&(f=t.fragments[d]=h),h&&f){r(h,f,d,l);var c=h.relurl,g=f.relurl;if(c&&fi(c,g))return void(t.playlistParsingError=ni("media sequence mismatch "+f.sn+":",e,t,0,f));if(h.cc!==f.cc)return void(t.playlistParsingError=ni("discontinuity sequence mismatch ("+h.cc+"!="+f.cc+")",e,t,0,f))}}}(e,t,(function(e,r,n,s){if((!t.startCC||t.skippedSegments)&&r.cc!==e.cc){for(var o=e.cc-r.cc,l=n;l<s.length;l++)s[l].cc+=o;t.endCC=s[s.length-1].cc}_(e.startPTS)&&_(e.endPTS)&&(r.setStart(r.startPTS=e.startPTS),r.startDTS=e.startDTS,r.maxStartPTS=e.maxStartPTS,r.endPTS=e.endPTS,r.endDTS=e.endDTS,r.minEndPTS=e.minEndPTS,r.setDuration(e.endPTS-e.startPTS),r.duration&&(i=r),t.PTSKnown=t.alignedSliding=!0),e.hasStreams&&(r.elementaryStreams=e.elementaryStreams),r.loader=e.loader,e.hasStats&&(r.stats=e.stats),e.initSegment&&(r.initSegment=e.initSegment,a=e.initSegment)}));var u=t.fragments,d=t.fragmentHint?u.concat(t.fragmentHint):u;if(a&&d.forEach((function(e){var t;!e||e.initSegment&&e.initSegment.relurl!==(null==(t=a)?void 0:t.relurl)||(e.initSegment=a)})),t.skippedSegments){if(t.deltaUpdateFailed=u.some((function(e){return!e})),t.deltaUpdateFailed){r.warn("[level-helper] Previous playlist missing segments skipped in delta playlist");for(var h=t.skippedSegments;h--;)u.shift();t.startSN=u[0].sn}else{t.canSkipDateRanges&&(t.dateRanges=function(e,t,r){var i=t.dateRanges,a=t.recentlyRemovedDateranges,n=o({},e);a&&a.forEach((function(e){delete n[e]}));var s=Object.keys(n).length;return s?(Object.keys(i).forEach((function(e){var t=n[e],a=new _r(i[e].attr,t);a.isValid?(n[e]=a,t||(a.tagOrder+=s)):r.warn('Ignoring invalid Playlist Delta Update DATERANGE tag: "'+Bt(i[e].attr)+'"')})),n):i}(e.dateRanges,t,r));var f=e.fragments.filter((function(e){return e.rawProgramDateTime}));if(e.hasProgramDateTime&&!t.hasProgramDateTime)for(var c=1;c<d.length;c++)null===d[c].programDateTime&&$r(d[c],d[c-1],f);Wr(f,t)}t.endCC=u[u.length-1].cc}if(!t.startCC){var g,v=li(e,t.startSN-1);t.startCC=null!=(g=null==v?void 0:v.cc)?g:u[0].cc}(function(e,t,r){if(e&&t)for(var i=0,a=0,n=e.length;a<n;a++){var s=e[a],o=t[a+i];s&&o&&s.index===o.index&&s.fragment.sn===o.fragment.sn?r(s,o):i--}})(e.partList,t.partList,(function(e,t){t.elementaryStreams=e.elementaryStreams,t.stats=e.stats,t.gap=e.gap||t.gap})),i?(t.iframesOnly&&(i.type,N.MAIN),ii(t,i,i.startPTS,i.endPTS,i.startDTS,i.endDTS,0,r)):si(e,t),u.length&&(t.totalduration=t.edge-u[0].start),t.driftStartTime=e.driftStartTime,t.driftStart=e.driftStart;var m=t.advancedDateTime;if(t.advanced&&m){var p=t.edge;t.driftStart||(t.driftStartTime=m,t.driftStart=p),t.driftEndTime=m,t.driftEnd=p}else t.driftEndTime=e.driftEndTime,t.driftEnd=e.driftEnd,t.advancedDateTime=e.advancedDateTime;-1===t.requestScheduled&&(t.requestScheduled=e.requestScheduled)}}function ni(e,t,r,i,a){return new Error(e+" "+a.url+"\nPlaylist starting @"+t.startSN+"\n"+t.m3u8+"\n\nPlaylist starting @"+r.startSN+"\n"+r.m3u8)}function si(e,t,r,i){void 0===r&&(r=!0);var a=t.startSN+t.skippedSegments-e.startSN,n=e.fragments,s=a>=0,o=0;if(s&&a<n.length)o=n[a].start,null==i||i.log("Aligning playlists based on SN "+t.startSN+" (diff: "+o+")");else if(s&&t.startSN===e.endSN+1)o=e.fragmentEnd,null==i||i.log("Aligning playlists based on first/last SN "+t.startSN+" (diff: "+o+")");else if(s&&r)o=e.fragmentStart+a*t.levelTargetDuration;else{if(t.skippedSegments||0!==t.fragmentStart)return o;o=e.fragmentStart,null==i||i.log("Aligning playlists based on first SN "+t.startSN+" (diff: "+o+")")}return function(e,t){if(t){for(var r=e.fragments,i=e.skippedSegments;i<r.length;i++)r[i].addStart(t);e.fragmentHint&&e.fragmentHint.addStart(t)}}(t,o),o}function oi(e,t){void 0===t&&(t=1/0);var r=1e3*e.targetduration;if(e.updated){var i=e.fragments;if(i.length&&4*r>t){var a=1e3*i[i.length-1].duration;a>0&&a<r&&(r=a)}}else r/=2;return Math.round(r)}function li(e,t,r){var i;if(!e)return null;var a=e.fragments[t-e.startSN];return a||((null==(i=a=e.fragmentHint)?void 0:i.sn)===t?a:r&&t<e.startSN&&r.sn===t?r:null)}function ui(e,t,r){return e?di(e.partList,t,r):null}function di(e,t,r){if(e)for(var i=e.length;i--;){var a=e[i];if(a.index===r&&a.fragment.sn===t)return a}return null}function hi(e){e.forEach((function(e,t){var r;null==(r=e.details)||r.fragments.forEach((function(e){e.level=t,e.initSegment&&(e.initSegment.level=t)}))}))}function fi(e,t){return!(e===t||!t)&&ci(e)!==ci(t)}function ci(e){return e.replace(/\?[^?]*$/,"")}var gi=function(e){function t(t){var r;return(r=e.call(this,"content-steering",t.logger)||this).hls=void 0,r.loader=null,r.uri=null,r.pathwayId=".",r._pathwayPriority=null,r.timeToLoad=300,r.reloadTimer=-1,r.updated=0,r.started=!1,r.enabled=!0,r.levels=null,r.audioTracks=null,r.subtitleTracks=null,r.penalizedPathways={},r.hls=t,r.registerListeners(),r}u(t,e);var r=t.prototype;return r.registerListeners=function(){var e=this.hls;e.on(O.MANIFEST_LOADING,this.onManifestLoading,this),e.on(O.MANIFEST_LOADED,this.onManifestLoaded,this),e.on(O.MANIFEST_PARSED,this.onManifestParsed,this),e.on(O.ERROR,this.onError,this)},r.unregisterListeners=function(){var e=this.hls;e&&(e.off(O.MANIFEST_LOADING,this.onManifestLoading,this),e.off(O.MANIFEST_LOADED,this.onManifestLoaded,this),e.off(O.MANIFEST_PARSED,this.onManifestParsed,this),e.off(O.ERROR,this.onError,this))},r.pathways=function(){return(this.levels||[]).reduce((function(e,t){return-1===e.indexOf(t.pathwayId)&&e.push(t.pathwayId),e}),[])},r.startLoad=function(){if(this.started=!0,this.clearTimeout(),this.enabled&&this.uri){if(this.updated){var e=1e3*this.timeToLoad-(performance.now()-this.updated);if(e>0)return void this.scheduleRefresh(this.uri,e)}this.loadSteeringManifest(this.uri)}},r.stopLoad=function(){this.started=!1,this.loader&&(this.loader.destroy(),this.loader=null),this.clearTimeout()},r.clearTimeout=function(){-1!==this.reloadTimer&&(self.clearTimeout(this.reloadTimer),this.reloadTimer=-1)},r.destroy=function(){this.unregisterListeners(),this.stopLoad(),this.hls=null,this.levels=this.audioTracks=this.subtitleTracks=null},r.removeLevel=function(e){var t=this.levels;t&&(this.levels=t.filter((function(t){return t!==e})))},r.onManifestLoading=function(){this.stopLoad(),this.enabled=!0,this.timeToLoad=300,this.updated=0,this.uri=null,this.pathwayId=".",this.levels=this.audioTracks=this.subtitleTracks=null},r.onManifestLoaded=function(e,t){var r=t.contentSteering;null!==r&&(this.pathwayId=r.pathwayId,this.uri=r.uri,this.started&&this.startLoad())},r.onManifestParsed=function(e,t){this.audioTracks=t.audioTracks,this.subtitleTracks=t.subtitleTracks},r.onError=function(e,t){var r=t.errorAction;if((null==r?void 0:r.action)===zt&&r.flags&Jt){var i=this.levels,a=this._pathwayPriority,n=this.pathwayId;if(t.context){var s=t.context,o=s.groupId,l=s.pathwayId,u=s.type;o&&i?n=this.getPathwayForGroupId(o,u,n):l&&(n=l)}n in this.penalizedPathways||(this.penalizedPathways[n]=performance.now()),!a&&i&&(a=this.pathways()),a&&a.length>1&&(this.updatePathwayPriority(a),r.resolved=this.pathwayId!==n,r.resolved||t.details===w.BUFFER_APPEND_ERROR&&!t.fatal||this.warn("Could not resolve "+t.details+' ("'+t.error.message+'") with content-steering for Pathway: '+n+" levels: "+(i?i.length:i)+" priorities: "+Bt(a)+" penalized: "+Bt(this.penalizedPathways)))}},r.filterParsedLevels=function(e){this.levels=e;var t=this.getLevelsForPathway(this.pathwayId);if(0===t.length){var r=e[0].pathwayId;this.log("No levels found in Pathway "+this.pathwayId+'. Setting initial Pathway to "'+r+'"'),t=this.getLevelsForPathway(r),this.pathwayId=r}return t.length!==e.length&&this.log("Found "+t.length+"/"+e.length+' levels in Pathway "'+this.pathwayId+'"'),t},r.getLevelsForPathway=function(e){return null===this.levels?[]:this.levels.filter((function(t){return e===t.pathwayId}))},r.updatePathwayPriority=function(e){var t;this._pathwayPriority=e;var r=this.penalizedPathways,i=performance.now();Object.keys(r).forEach((function(e){i-r[e]>3e5&&delete r[e]}));for(var a=0;a<e.length;a++){var n=e[a];if(!(n in r)){if(n===this.pathwayId)return;var s=this.hls.nextLoadLevel,o=this.hls.levels[s];if((t=this.getLevelsForPathway(n)).length>0){this.log('Setting Pathway to "'+n+'"'),this.pathwayId=n,hi(t),this.hls.trigger(O.LEVELS_UPDATED,{levels:t});var l=this.hls.levels[s];o&&l&&this.levels&&(l.attrs["STABLE-VARIANT-ID"]!==o.attrs["STABLE-VARIANT-ID"]&&l.bitrate!==o.bitrate&&this.log("Unstable Pathways change from bitrate "+o.bitrate+" to "+l.bitrate),this.hls.nextLoadLevel=s);break}}}},r.getPathwayForGroupId=function(e,t,r){for(var i=this.getLevelsForPathway(r).concat(this.levels||[]),a=0;a<i.length;a++)if(t===F.AUDIO_TRACK&&i[a].hasAudioGroup(e)||t===F.SUBTITLE_TRACK&&i[a].hasSubtitleGroup(e))return i[a].pathwayId;return r},r.clonePathways=function(e){var t=this,r=this.levels;if(r){var i={},a={};e.forEach((function(e){var n=e.ID,s=e["BASE-ID"],o=e["URI-REPLACEMENT"];if(!r.some((function(e){return e.pathwayId===n}))){var l=t.getLevelsForPathway(s).map((function(e){var t=new Dr(e.attrs);t["PATHWAY-ID"]=n;var r=t.AUDIO&&t.AUDIO+"_clone_"+n,s=t.SUBTITLES&&t.SUBTITLES+"_clone_"+n;r&&(i[t.AUDIO]=r,t.AUDIO=r),s&&(a[t.SUBTITLES]=s,t.SUBTITLES=s);var l=mi(e.uri,t["STABLE-VARIANT-ID"],"PER-VARIANT-URIS",o),u=new Mt({attrs:t,audioCodec:e.audioCodec,bitrate:e.bitrate,height:e.height,name:e.name,url:l,videoCodec:e.videoCodec,width:e.width});if(e.audioGroups)for(var d=1;d<e.audioGroups.length;d++)u.addGroupId("audio",e.audioGroups[d]+"_clone_"+n);if(e.subtitleGroups)for(var h=1;h<e.subtitleGroups.length;h++)u.addGroupId("text",e.subtitleGroups[h]+"_clone_"+n);return u}));r.push.apply(r,l),vi(t.audioTracks,i,o,n),vi(t.subtitleTracks,a,o,n)}}))}},r.loadSteeringManifest=function(e){var t,r=this,i=this.hls.config,a=i.loader;this.loader&&this.loader.destroy(),this.loader=new a(i);try{t=new self.URL(e)}catch(t){return this.enabled=!1,void this.log("Failed to parse Steering Manifest URI: "+e)}if("data:"!==t.protocol){var n=0|(this.hls.bandwidthEstimate||i.abrEwmaDefaultEstimate);Dt(t,"_HLS_pathway",this.pathwayId),Dt(t,"_HLS_throughput",""+n)}var s={type:F.STEERING_MANIFEST,responseType:"json",url:t.href},o=i.steeringManifestLoadPolicy.default,l=o.errorRetry||o.timeoutRetry||{},u={loadPolicy:o,timeout:o.maxLoadTimeMs,maxRetry:l.maxNumRetry||0,retryDelay:l.retryDelayMs||0,maxRetryDelay:l.maxRetryDelayMs||0},d={onSuccess:function(e,i,a,n){r.log('Loaded steering manifest: "'+t+'"');var s=e.data;if(1===(null==s?void 0:s.VERSION)){r.updated=performance.now(),r.timeToLoad=s.TTL;var o=s["RELOAD-URI"],l=s["PATHWAY-CLONES"],u=s["PATHWAY-PRIORITY"];if(o)try{r.uri=new self.URL(o,t).href}catch(e){return r.enabled=!1,void r.log("Failed to parse Steering Manifest RELOAD-URI: "+o)}r.scheduleRefresh(r.uri||a.url),l&&r.clonePathways(l);var d={steeringManifest:s,url:t.toString()};r.hls.trigger(O.STEERING_MANIFEST_LOADED,d),u&&r.updatePathwayPriority(u)}else r.log("Steering VERSION "+s.VERSION+" not supported!")},onError:function(e,t,i,a){if(r.log("Error loading steering manifest: "+e.code+" "+e.text+" ("+t.url+")"),r.stopLoad(),410===e.code)return r.enabled=!1,void r.log("Steering manifest "+t.url+" no longer available");var n=1e3*r.timeToLoad;if(429!==e.code)r.scheduleRefresh(r.uri||t.url,n);else{var s=r.loader;if("function"==typeof(null==s?void 0:s.getResponseHeader)){var o=s.getResponseHeader("Retry-After");o&&(n=1e3*parseFloat(o))}r.log("Steering manifest "+t.url+" rate limited")}},onTimeout:function(e,t,i){r.log("Timeout loading steering manifest ("+t.url+")"),r.scheduleRefresh(r.uri||t.url)}};this.log("Requesting steering manifest: "+t),this.loader.load(s,u,d)},r.scheduleRefresh=function(e,t){var r=this;void 0===t&&(t=1e3*this.timeToLoad),this.clearTimeout(),this.reloadTimer=self.setTimeout((function(){var t,i=null==(t=r.hls)?void 0:t.media;!i||i.ended?r.scheduleRefresh(e,1e3*r.timeToLoad):r.loadSteeringManifest(e)}),t)},a(t,[{key:"pathwayPriority",get:function(){return this._pathwayPriority},set:function(e){this.updatePathwayPriority(e)}}])}(ie);function vi(e,t,r,i){e&&Object.keys(t).forEach((function(a){var n=e.filter((function(e){return e.groupId===a})).map((function(e){var n=o({},e);return n.details=void 0,n.attrs=new Dr(n.attrs),n.url=n.attrs.URI=mi(e.url,e.attrs["STABLE-RENDITION-ID"],"PER-RENDITION-URIS",r),n.groupId=n.attrs["GROUP-ID"]=t[a],n.attrs["PATHWAY-ID"]=i,n}));e.push.apply(e,n)}))}function mi(e,t,r,i){if(t){var a=i[r];if(a){var n=a[t];if(n)return n}}var s=i.HOST,o=i.PARAMS,l=new self.URL(e);return s&&(l.hostname=s),o&&Object.keys(o).sort().forEach((function(e){e&&Dt(l,e,o[e])})),l.href}var pi=function(){function e(e){this.hls=void 0,this.isVideoPlaybackQualityAvailable=!1,this.timer=void 0,this.media=null,this.lastTime=void 0,this.lastDroppedFrames=0,this.lastDecodedFrames=0,this.streamController=void 0,this.hls=e,this.registerListeners()}var t=e.prototype;return t.setStreamController=function(e){this.streamController=e},t.registerListeners=function(){this.hls.on(O.MEDIA_ATTACHING,this.onMediaAttaching,this),this.hls.on(O.MEDIA_DETACHING,this.onMediaDetaching,this)},t.unregisterListeners=function(){this.hls.off(O.MEDIA_ATTACHING,this.onMediaAttaching,this),this.hls.off(O.MEDIA_DETACHING,this.onMediaDetaching,this)},t.destroy=function(){this.timer&&clearInterval(this.timer),this.unregisterListeners(),this.isVideoPlaybackQualityAvailable=!1,this.media=null},t.onMediaAttaching=function(e,t){var r=this.hls.config;if(r.capLevelOnFPSDrop){var i=t.media instanceof self.HTMLVideoElement?t.media:null;this.media=i,i&&"function"==typeof i.getVideoPlaybackQuality&&(this.isVideoPlaybackQualityAvailable=!0),self.clearInterval(this.timer),this.timer=self.setInterval(this.checkFPSInterval.bind(this),r.fpsDroppedMonitoringPeriod)}},t.onMediaDetaching=function(){this.media=null},t.checkFPS=function(e,t,r){var i=performance.now();if(t){if(this.lastTime){var a=i-this.lastTime,n=r-this.lastDroppedFrames,s=t-this.lastDecodedFrames,o=1e3*n/a,l=this.hls;if(l.trigger(O.FPS_DROP,{currentDropped:n,currentDecoded:s,totalDroppedFrames:r}),o>0&&n>l.config.fpsDroppedMonitoringThreshold*s){var u=l.currentLevel;l.logger.warn("drop FPS ratio greater than max allowed value for currentLevel: "+u),u>0&&(-1===l.autoLevelCapping||l.autoLevelCapping>=u)&&(u-=1,l.trigger(O.FPS_DROP_LEVEL_CAPPING,{level:u,droppedLevel:l.currentLevel}),l.autoLevelCapping=u,this.streamController.nextLevelSwitch())}}this.lastTime=i,this.lastDroppedFrames=r,this.lastDecodedFrames=t}},t.checkFPSInterval=function(){var e=this.media;if(e)if(this.isVideoPlaybackQualityAvailable){var t=e.getVideoPlaybackQuality();this.checkFPS(e,t.totalVideoFrames,t.droppedVideoFrames)}else this.checkFPS(e,e.webkitDecodedFrameCount,e.webkitDroppedFrameCount)},e}(),yi="NOT_LOADED",Ei="APPENDING",Ti="PARTIAL",Si="OK",Li=function(){function e(e){this.activePartLists=Object.create(null),this.endListFragments=Object.create(null),this.fragments=Object.create(null),this.timeRanges=Object.create(null),this.bufferPadding=.2,this.hls=void 0,this.hasGaps=!1,this.hls=e,this._registerListeners()}var t=e.prototype;return t._registerListeners=function(){var e=this.hls;e&&(e.on(O.MANIFEST_LOADING,this.onManifestLoading,this),e.on(O.BUFFER_APPENDED,this.onBufferAppended,this),e.on(O.FRAG_BUFFERED,this.onFragBuffered,this),e.on(O.FRAG_LOADED,this.onFragLoaded,this))},t._unregisterListeners=function(){var e=this.hls;e&&(e.off(O.MANIFEST_LOADING,this.onManifestLoading,this),e.off(O.BUFFER_APPENDED,this.onBufferAppended,this),e.off(O.FRAG_BUFFERED,this.onFragBuffered,this),e.off(O.FRAG_LOADED,this.onFragLoaded,this))},t.destroy=function(){this._unregisterListeners(),this.hls=this.fragments=this.activePartLists=this.endListFragments=this.timeRanges=null},t.getAppendedFrag=function(e,t){var r=this.activePartLists[t];if(r)for(var i=r.length;i--;){var a=r[i];if(!a)break;if(a.start<=e&&e<=a.end&&a.loaded)return a}return this.getBufferedFrag(e,t)},t.getBufferedFrag=function(e,t){return this.getFragAtPos(e,t,!0)},t.getFragAtPos=function(e,t,r){for(var i=this.fragments,a=Object.keys(i),n=a.length;n--;){var s=i[a[n]];if((null==s?void 0:s.body.type)===t&&(!r||s.buffered)){var o=s.body;if(o.start<=e&&e<=o.end)return o}}return null},t.detectEvictedFragments=function(e,t,r,i,a,n){var s=this;this.timeRanges&&(this.timeRanges[e]=t);var o=(null==a?void 0:a.fragment.sn)||-1;Object.keys(this.fragments).forEach((function(a){var l=s.fragments[a];if(l&&s.hls){var u=l.body;if(!(o>=u.sn))if(l.buffered||l.loaded&&!n){var d=l.range[e];if(d)if(0!==d.time.length){if(d.time.some((function(e){var r=!s.isTimeBuffered(e.startPTS,e.endPTS,t);return r&&s.removeFragment(u),r})),i&&i!==u&&ct()){var h=i.endPTS,f=u.startPTS;if(h&&f&&l.range.video){var c=f-h;c<0&&c>-.1&&(s.removeFragment(u),s.hls.trigger(O.BUFFER_FLUSHING,{startOffset:h+.004,endOffset:1/0,type:"video"}))}}}else s.removeFragment(u)}else u.type===r&&s.removeFragment(u)}}))},t.detectPartialFragments=function(e){var t=this,r=this.timeRanges,i=e.frag,a=e.part,n=e.id;if(r&&G(i)){var s=Ai(i),o=this.fragments[s];if(!(!o||o.buffered&&i.gap)){var l=!i.relurl;Object.keys(r).forEach((function(e){var s=i.elementaryStreams[e];if(s){var u=r[e],d=l||!0===s.partial;o.range[e]=t.getBufferedTimes(i,a,d,u),t.detectEvictedFragments(e,u,n,i,a)}})),o.loaded=null;var u=Object.keys(o.range);if(u.length){if(this.bufferedEnd(o,i),Ri(o)||this.removeParts(i.sn-1,i.type),!a){var d=Math.min(.004,i.duration);u.some((function(e){var r,a=null==(r=o.range[e])?void 0:r.time,n=0===a.length||1===a.length&&a[0].endPTS-a[0].startPTS<d;return n&&t.addAsGap(i),n}))}}else this.removeFragment(i)}}},t.addAsGap=function(e){e.gap=!0,this.removeFragment(e),this.fragBuffered(e,!0)},t.bufferedEnd=function(e,t){e.buffered=!0,(e.body.endList=t.endList||e.body.endList)&&!t.gap&&(this.endListFragments[e.body.type]=e)},t.removeParts=function(e,t){var r=this.activePartLists[t];r&&(this.activePartLists[t]=bi(r,(function(t){return t.fragment.sn>=e})))},t.fragBuffered=function(e,t){var r=Ai(e),i=this.fragments[r];return!i&&t&&(i=this.fragments[r]={body:e,appendedPTS:null,loaded:null,buffered:!1,range:Object.create(null)},e.gap&&(this.hasGaps=!0)),i&&(i.loaded=null,this.bufferedEnd(i,e)),i},t.getBufferedTimes=function(e,t,r,i){for(var a={time:[],partial:r},n=e.start,s=e.end,o=e.minEndPTS||s,l=e.maxStartPTS||n,u=0;u<i.length;u++){var d=i.start(u)-this.bufferPadding,h=i.end(u)+this.bufferPadding;if(l>=d&&o<=h){a.time.push({startPTS:Math.max(n,i.start(u)),endPTS:Math.min(s,i.end(u))});break}if(n<h&&s>d){var f=Math.max(n,i.start(u)),c=Math.min(s,i.end(u));c>f&&(a.partial=!0,a.time.push({startPTS:f,endPTS:c}))}else if(s<=d)break}return a},t.getPartialFragment=function(e){var t,r,i,a=null,n=0,s=this.bufferPadding,o=this.fragments;return Object.keys(o).forEach((function(l){var u=o[l];u&&Ri(u)&&(r=u.body.start-s,i=u.body.end+s,e>=r&&e<=i&&(t=Math.min(e-r,i-e),n<=t&&(a=u.body,n=t)))})),a},t.isEndListAppended=function(e){var t=this.endListFragments[e];return void 0!==t&&(t.buffered||Ri(t))},t.getState=function(e){var t=Ai(e),r=this.fragments[t];return r?r.buffered?Ri(r)?Ti:Si:Ei:yi},t.isTimeBuffered=function(e,t,r){for(var i,a,n=0;n<r.length;n++){if(i=r.start(n)-this.bufferPadding,a=r.end(n)+this.bufferPadding,e>=i&&t<=a)return!0;if(t<=i)return!1}return!1},t.onManifestLoading=function(){this.removeAllFragments()},t.onFragLoaded=function(e,t){if(G(t.frag)&&!t.frag.bitrateTest){var r=t.frag,i=t.part?null:t,a=Ai(r);this.fragments[a]={body:r,appendedPTS:null,loaded:i,buffered:!1,range:Object.create(null)}}},t.onBufferAppended=function(e,t){var r=t.frag,i=t.part,a=t.timeRanges;if(G(r)){var n=r.type;if(i){var s=this.activePartLists[n];s||(this.activePartLists[n]=s=[]),s.push(i)}this.timeRanges=a}},t.onFragBuffered=function(e,t){this.detectPartialFragments(t)},t.hasFragment=function(e){var t=Ai(e);return!!this.fragments[t]},t.hasFragments=function(e){var t=this.fragments,r=Object.keys(t);if(!e)return r.length>0;for(var i=r.length;i--;){var a=t[r[i]];if((null==a?void 0:a.body.type)===e)return!0}return!1},t.hasParts=function(e){var t;return!(null==(t=this.activePartLists[e])||!t.length)},t.getBackBufferEvictionEnd=function(e,t,r){for(var i=this.fragments,a=0,n=0,s=Object.keys(i),o=0;o<s.length;o++){var l=i[s[o]];if(l&&l.buffered&&l.body.type===t){var u=l.body;if(u.gap)return 0;var d=u.hasStats&&u.stats.loaded||u.byteLength||u.bitrate&&8*u.bitrate*u.duration;if(u.end<=e&&d&&(a+=d,n=Math.max(n,u.end),a>=r))return n}}return n>0?n:0},t.removeFragmentsInRange=function(e,t,r,i,a){var n=this;i&&!this.hasGaps||Object.keys(this.fragments).forEach((function(s){var o=n.fragments[s];if(o){var l=o.body;l.type!==r||i&&!l.gap||l.start<t&&l.end>e&&(o.buffered||a)&&n.removeFragment(l)}}))},t.removeFragment=function(e){var t=Ai(e);e.clearElementaryStreamInfo();var r=this.activePartLists[e.type];if(r){var i=e.sn;this.activePartLists[e.type]=bi(r,(function(e){return e.fragment.sn!==i}))}delete this.fragments[t],e.endList&&delete this.endListFragments[e.type]},t.removeAllFragments=function(){var e;this.fragments=Object.create(null),this.endListFragments=Object.create(null),this.activePartLists=Object.create(null),this.hasGaps=!1;var t=null==(e=this.hls)||null==(e=e.latestLevelDetails)?void 0:e.partList;t&&t.forEach((function(e){return e.clearElementaryStreamInfo()}))},e}();function Ri(e){var t,r,i,a;return e.buffered&&!!(e.body.gap||null!=(t=e.range.video)&&t.partial||null!=(r=e.range.audio)&&r.partial||null!=(i=e.range.audiovideo)&&i.partial||null!=(a=e.range.subs)&&a.partial)}function Ai(e){return e.type+"_"+e.level+"_"+e.sn}function bi(e,t){return e.filter((function(e){var r=t(e);return r||e.clearElementaryStreamInfo(),r}))}var ki=function(){function e(e,t,r){this.subtle=void 0,this.aesIV=void 0,this.aesMode=void 0,this.subtle=e,this.aesIV=t,this.aesMode=r}return e.prototype.decrypt=function(e,t){switch(this.aesMode){case xr:return this.subtle.decrypt({name:"AES-CBC",iv:this.aesIV},t,e);case wr:return this.subtle.decrypt({name:"AES-CTR",counter:this.aesIV,length:64},t,e);default:throw new Error("[AESCrypto] invalid aes mode "+this.aesMode)}},e}(),Di=function(){function e(){this.rcon=[0,1,2,4,8,16,32,64,128,27,54],this.subMix=[new Uint32Array(256),new Uint32Array(256),new Uint32Array(256),new Uint32Array(256)],this.invSubMix=[new Uint32Array(256),new Uint32Array(256),new Uint32Array(256),new Uint32Array(256)],this.sBox=new Uint32Array(256),this.invSBox=new Uint32Array(256),this.key=new Uint32Array(0),this.ksRows=0,this.keySize=0,this.keySchedule=void 0,this.invKeySchedule=void 0,this.initTable()}var t=e.prototype;return t.uint8ArrayToUint32Array_=function(e){for(var t=new DataView(e),r=new Uint32Array(4),i=0;i<4;i++)r[i]=t.getUint32(4*i);return r},t.initTable=function(){var e=this.sBox,t=this.invSBox,r=this.subMix,i=r[0],a=r[1],n=r[2],s=r[3],o=this.invSubMix,l=o[0],u=o[1],d=o[2],h=o[3],f=new Uint32Array(256),c=0,g=0,v=0;for(v=0;v<256;v++)f[v]=v<128?v<<1:v<<1^283;for(v=0;v<256;v++){var m=g^g<<1^g<<2^g<<3^g<<4;m=m>>>8^255&m^99,e[c]=m,t[m]=c;var p=f[c],y=f[p],E=f[y],T=257*f[m]^16843008*m;i[c]=T<<24|T>>>8,a[c]=T<<16|T>>>16,n[c]=T<<8|T>>>24,s[c]=T,T=16843009*E^65537*y^257*p^16843008*c,l[m]=T<<24|T>>>8,u[m]=T<<16|T>>>16,d[m]=T<<8|T>>>24,h[m]=T,c?(c=p^f[f[f[E^p]]],g^=f[f[g]]):c=g=1}},t.expandKey=function(e){for(var t=this.uint8ArrayToUint32Array_(e),r=!0,i=0;i<t.length&&r;)r=t[i]===this.key[i],i++;if(!r){this.key=t;var a=this.keySize=t.length;if(4!==a&&6!==a&&8!==a)throw new Error("Invalid aes key size="+a);var n,s,o,l,u=this.ksRows=4*(a+6+1),d=this.keySchedule=new Uint32Array(u),h=this.invKeySchedule=new Uint32Array(u),f=this.sBox,c=this.rcon,g=this.invSubMix,v=g[0],m=g[1],p=g[2],y=g[3];for(n=0;n<u;n++)n<a?o=d[n]=t[n]:(l=o,n%a==0?(l=f[(l=l<<8|l>>>24)>>>24]<<24|f[l>>>16&255]<<16|f[l>>>8&255]<<8|f[255&l],l^=c[n/a|0]<<24):a>6&&n%a==4&&(l=f[l>>>24]<<24|f[l>>>16&255]<<16|f[l>>>8&255]<<8|f[255&l]),d[n]=o=(d[n-a]^l)>>>0);for(s=0;s<u;s++)n=u-s,l=3&s?d[n]:d[n-4],h[s]=s<4||n<=4?l:v[f[l>>>24]]^m[f[l>>>16&255]]^p[f[l>>>8&255]]^y[f[255&l]],h[s]=h[s]>>>0}},t.networkToHostOrderSwap=function(e){return e<<24|(65280&e)<<8|(16711680&e)>>8|e>>>24},t.decrypt=function(e,t,r){for(var i,a,n,s,o,l,u,d,h,f,c,g,v,m,p=this.keySize+6,y=this.invKeySchedule,E=this.invSBox,T=this.invSubMix,S=T[0],L=T[1],R=T[2],A=T[3],b=this.uint8ArrayToUint32Array_(r),k=b[0],D=b[1],I=b[2],_=b[3],C=new Int32Array(e),P=new Int32Array(C.length),x=this.networkToHostOrderSwap;t<C.length;){for(h=x(C[t]),f=x(C[t+1]),c=x(C[t+2]),g=x(C[t+3]),o=h^y[0],l=g^y[1],u=c^y[2],d=f^y[3],v=4,m=1;m<p;m++)i=S[o>>>24]^L[l>>16&255]^R[u>>8&255]^A[255&d]^y[v],a=S[l>>>24]^L[u>>16&255]^R[d>>8&255]^A[255&o]^y[v+1],n=S[u>>>24]^L[d>>16&255]^R[o>>8&255]^A[255&l]^y[v+2],s=S[d>>>24]^L[o>>16&255]^R[l>>8&255]^A[255&u]^y[v+3],o=i,l=a,u=n,d=s,v+=4;i=E[o>>>24]<<24^E[l>>16&255]<<16^E[u>>8&255]<<8^E[255&d]^y[v],a=E[l>>>24]<<24^E[u>>16&255]<<16^E[d>>8&255]<<8^E[255&o]^y[v+1],n=E[u>>>24]<<24^E[d>>16&255]<<16^E[o>>8&255]<<8^E[255&l]^y[v+2],s=E[d>>>24]<<24^E[o>>16&255]<<16^E[l>>8&255]<<8^E[255&u]^y[v+3],P[t]=x(i^k),P[t+1]=x(s^D),P[t+2]=x(n^I),P[t+3]=x(a^_),k=h,D=f,I=c,_=g,t+=4}return P.buffer},e}(),Ii=function(){function e(e,t,r){this.subtle=void 0,this.key=void 0,this.aesMode=void 0,this.subtle=e,this.key=t,this.aesMode=r}return e.prototype.expandKey=function(){var e=function(e){switch(e){case xr:return"AES-CBC";case wr:return"AES-CTR";default:throw new Error("[FastAESKey] invalid aes mode "+e)}}(this.aesMode);return this.subtle.importKey("raw",this.key,{name:e},!1,["encrypt","decrypt"])},e}(),_i=function(){function e(e,t){if(this.logEnabled=!0,this.decryptRange=void 0,this.subtle=null,this.softwareDecrypter=null,this.key=null,this.fastAesKey=null,this.remainderData=null,this.currentIV=null,this.currentResult=null,this.useSoftware=void 0,this.enableSoftwareAES=void 0,this.enableSoftwareAES=e.enableSoftwareAES,!0!==t)try{var r=self.crypto;r&&(this.subtle=r.subtle||r.webkitSubtle)}catch(e){}this.useSoftware=!this.subtle}var t=e.prototype;return t.destroy=function(){this.subtle=null,this.softwareDecrypter=null,this.key=null,this.fastAesKey=null,this.remainderData=null,this.currentIV=null,this.currentResult=null},t.isSync=function(){return this.useSoftware},t.flush=function(){var e=this.currentResult,t=this.remainderData;if(!e||t)return this.reset(),null;var r=new Uint8Array(e);this.reset();var i,a,n,s=this.decryptRange;return s?0===s.start&&s.end>=r.length?r:r.slice(s.start,s.end):(a=(i=r).byteLength,(n=a&&new DataView(i.buffer).getUint8(a-1))?i.slice(0,a-n):i)},t.reset=function(){this.currentResult=null,this.currentIV=null,this.remainderData=null,this.softwareDecrypter&&(this.softwareDecrypter=null)},t.decrypt=function(e,t,r,i,a){var n=this;return this.decryptRange=a,this.useSoftware||a?new Promise((function(a,s){var o=ArrayBuffer.isView(e)?e:new Uint8Array(e);n.softwareDecrypt(o,t,r,i);var l=n.flush();l?a(l.buffer):s(new Error("[softwareDecrypt] Failed to decrypt data"))})):this.webCryptoDecrypt(new Uint8Array(e),t,r,i)},t.softwareDecrypt=function(e,t,r,i){var a=this.currentIV,n=this.currentResult,s=this.remainderData;if(i!==xr||16!==t.byteLength)return fe.warn("SoftwareDecrypt: can only handle AES-128-CBC"),null;this.logOnce("JS AES decrypt"),s&&(e=it(s,e),this.remainderData=null);var o=this.getValidChunk(e);if(!o.length)return null;a&&(r=a);var l=this.softwareDecrypter;l||(l=this.softwareDecrypter=new Di),l.expandKey(t);var u=n;return this.currentResult=l.decrypt(o.buffer,0,r),this.currentIV=o.slice(-16).buffer,u||null},t.webCryptoDecrypt=function(e,t,r,i){var a=this;if(this.key!==t||!this.fastAesKey){if(!this.subtle)return Promise.resolve(this.onWebCryptoError(e,t,r,i));this.key=t,this.fastAesKey=new Ii(this.subtle,t,i)}return this.fastAesKey.expandKey().then((function(t){return a.subtle?(a.logOnce("WebCrypto AES decrypt"),new ki(a.subtle,new Uint8Array(r),i).decrypt(e.buffer,t)):Promise.reject(new Error("web crypto not initialized"))})).catch((function(n){return fe.warn("[decrypter]: WebCrypto Error, disable WebCrypto API, "+n.name+": "+n.message),a.onWebCryptoError(e,t,r,i)}))},t.onWebCryptoError=function(e,t,r,i){var a=this.enableSoftwareAES;if(a){this.useSoftware=!0,this.logEnabled=!0,this.softwareDecrypt(e,t,r,i);var n=this.flush();if(n)return n.buffer}throw new Error("WebCrypto"+(a?" and softwareDecrypt":"")+": failed to decrypt data")},t.getValidChunk=function(e){var t=e,r=e.length-e.length%16;return r!==e.length&&(t=e.slice(0,r),this.remainderData=e.slice(r)),t},t.logOnce=function(e){this.logEnabled&&(fe.log("[decrypter]: "+e),this.logEnabled=!1)},e}(),Ci=Math.pow(2,17),Pi=function(){function e(e){this.config=void 0,this.loader=null,this.partLoadTimeout=-1,this.config=e}var t=e.prototype;return t.destroy=function(){this.loader&&(this.loader.destroy(),this.loader=null)},t.abort=function(){this.loader&&this.loader.abort()},t.load=function(e,t,r,i){var a=this,n=e.url;if(!n)return Promise.reject(new Mi({type:x.NETWORK_ERROR,details:w.FRAG_LOAD_ERROR,fatal:!1,frag:e,error:new Error("Fragment does not have a "+(n?"part list":"url")),networkDetails:null}));this.abort();var s=this.config,o=s.fLoader,l=s.loader;return new Promise((function(u,d){if(a.loader&&a.loader.destroy(),e.gap){if(e.tagList.some((function(e){return"GAP"===e[0]})))return void d(Oi(e));e.gap=!1}var h=a.loader=o?new o(s):new l(s),c=xi(e,null,t);e.loader=h;var g=$(s.fragLoadPolicy.default),v={loadPolicy:g,timeout:g.maxLoadTimeMs,maxRetry:0,retryDelay:0,maxRetryDelay:0,highWaterMark:"initSegment"===e.sn?1/0:Ci};h.stats.retry=e.stats.retry,e.stats=h.stats;var m={onSuccess:function(t,r,i,n){a.resetLoader(e,h);var s=t.data;i.resetIV&&e.decryptdata&&(e.decryptdata.iv=new Uint8Array(s.slice(0,16)),s=s.slice(16)),u({frag:e,part:null,payload:s,networkDetails:n})},onError:function(t,r,i,s){a.resetLoader(e,h),d(new Mi({type:x.NETWORK_ERROR,details:w.FRAG_LOAD_ERROR,fatal:!1,frag:e,response:f({url:n,data:void 0},t),error:new Error("HTTP Error "+t.code+" "+t.text),networkDetails:i,stats:s}))},onAbort:function(t,r,i){a.resetLoader(e,h),d(new Mi({type:x.NETWORK_ERROR,details:w.INTERNAL_ABORTED,fatal:!1,frag:e,error:new Error("Aborted"),networkDetails:i,stats:t}))},onTimeout:function(t,r,i){a.resetLoader(e,h),d(new Mi({type:x.NETWORK_ERROR,details:w.FRAG_LOAD_TIMEOUT,fatal:!1,frag:e,error:new Error("Timeout after "+v.timeout+"ms"),networkDetails:i,stats:t}))}};if(r){var p=a.gateProgress(r,i);m.onProgress=function(t,r,i,a){return p({frag:e,part:null,payload:i,networkDetails:a})}}h.load(c,v,m)}))},t.gateProgress=function(e,t){var r=e;if(t){var i=[],a=!1;t.then((function(){a=!0,i.forEach((function(t){return e(t)})),i.length=0})).catch((function(){})),r=function(t){a?e(t):i.push(t)}}return r},t.loadPart=function(e,t,r){var i=this;this.abort();var a=this.config,n=a.fLoader,s=a.loader;return new Promise((function(o,l){if(i.loader&&i.loader.destroy(),e.gap||t.gap)l(Oi(e,t));else{var u=i.loader=n?new n(a):new s(a),d=xi(e,t);e.loader=u;var h=$(a.fragLoadPolicy.default),c={loadPolicy:h,timeout:h.maxLoadTimeMs,maxRetry:0,retryDelay:0,maxRetryDelay:0,highWaterMark:Ci};t.stats=u.stats,u.load(d,c,{onSuccess:function(a,n,s,l){i.resetLoader(e,u),i.updateStatsFromPart(e,t);var d={frag:e,part:t,payload:a.data,networkDetails:l};r(d),o(d)},onError:function(r,a,n,s){i.resetLoader(e,u),l(new Mi({type:x.NETWORK_ERROR,details:w.FRAG_LOAD_ERROR,fatal:!1,frag:e,part:t,response:f({url:d.url,data:void 0},r),error:new Error("HTTP Error "+r.code+" "+r.text),networkDetails:n,stats:s}))},onAbort:function(r,a,n){e.stats.aborted=t.stats.aborted,i.resetLoader(e,u),l(new Mi({type:x.NETWORK_ERROR,details:w.INTERNAL_ABORTED,fatal:!1,frag:e,part:t,error:new Error("Aborted"),networkDetails:n,stats:r}))},onTimeout:function(r,a,n){i.resetLoader(e,u),l(new Mi({type:x.NETWORK_ERROR,details:w.FRAG_LOAD_TIMEOUT,fatal:!1,frag:e,part:t,error:new Error("Timeout after "+c.timeout+"ms"),networkDetails:n,stats:r}))}})}}))},t.updateStatsFromPart=function(e,t){var r=e.stats,i=t.stats,a=i.total;if(r.loaded+=i.loaded,a){var n=Math.round(e.duration/t.duration),s=Math.min(Math.round(r.loaded/a),n),o=(n-s)*Math.round(r.loaded/s);r.total=r.loaded+o}else r.total=Math.max(r.loaded,r.total);var l=r.loading,u=i.loading;l.start?l.first+=u.first-u.start:(l.start=u.start,l.first=u.first),l.end=u.end},t.resetLoader=function(e,t){e.loader=null,e.url=null,this.loader===t&&(self.clearTimeout(this.partLoadTimeout),this.loader=null),t.destroy()},e}();function xi(e,t,r){void 0===t&&(t=null);var i=t||e,a={type:F.MEDIA_FRAGMENT,frag:e,part:t,responseType:"arraybuffer",url:i.url,headers:{},rangeStart:0,rangeEnd:0},n=wi(e,t,r);return n.resetIV&&(a.resetIV=!0),n.byteRange&&(a.rangeStart=n.byteRange.start,a.rangeEnd=n.byteRange.end),a}function wi(e,t,r){void 0===t&&(t=null);var i,a,n={},s=t||e,o=s.byteRangeStartOffset,l=s.byteRangeEndOffset;if(_(o)&&_(l))if("initSegment"!==e.sn&&!r||"AES-128"!==(a=null==(i=e.decryptdata)?void 0:i.method)&&"AES-256"!==a)n.byteRange={start:o,end:l};else{var u=16*Math.floor(o/16),d=16*Math.ceil(l/16);n.decryptRange={start:o-u,end:l-u},u>=16&&(n.resetIV=!0,u-=16),n.byteRange={start:u,end:d}}return n}function Oi(e,t){var r=new Error("GAP "+(e.gap?"tag":"attribute")+" found"),i={type:x.MEDIA_ERROR,details:w.FRAG_GAP,fatal:!1,frag:e,error:r,networkDetails:null};return t&&(i.part=t),(t||e).stats.aborted=!0,new Mi(i)}var Mi=function(e){function t(t){var r;return(r=e.call(this,t.error.message)||this).data=void 0,r.data=t,r}return u(t,e),t}(v(Error)),Fi=function(e){function t(t,r){var i;return(i=e.call(this,t,r)||this)._boundTick=void 0,i._tickTimer=null,i._tickInterval=null,i._tickCallCount=0,i._boundTick=i.tick.bind(i),i}u(t,e);var r=t.prototype;return r.destroy=function(){this.onHandlerDestroying(),this.onHandlerDestroyed()},r.onHandlerDestroying=function(){this.clearNextTick(),this.clearInterval()},r.onHandlerDestroyed=function(){},r.hasInterval=function(){return!!this._tickInterval},r.hasNextTick=function(){return!!this._tickTimer},r.setInterval=function(e){return!this._tickInterval&&(this._tickCallCount=0,this._tickInterval=self.setInterval(this._boundTick,e),!0)},r.clearInterval=function(){return!!this._tickInterval&&(self.clearInterval(this._tickInterval),this._tickInterval=null,!0)},r.clearNextTick=function(){return!!this._tickTimer&&(self.clearTimeout(this._tickTimer),this._tickTimer=null,!0)},r.tick=function(){this._tickCallCount++,1===this._tickCallCount?(this.doTick(),this._tickCallCount>1&&this.tickImmediate(),this._tickCallCount=0):(this.log("possible exception thrown in task-loop ("+this.constructor.name+".doTick)"),this._tickCallCount=0)},r.tickImmediate=function(){this.clearNextTick(),this._tickTimer=self.setTimeout(this._boundTick,0)},r.doTick=function(){},t}(ie),Ni=function(e,t,r,i,a,n,s,o,l){void 0===i&&(i=0),void 0===a&&(a=-1),void 0===n&&(n=!1),this.level=void 0,this.sn=void 0,this.part=void 0,this.id=void 0,this.size=void 0,this.partial=void 0,this.iframe=void 0,this.duration=void 0,this.decryptRange=void 0,this.transmuxing={start:0,executeStart:0,executeEnd:0,end:0},this.buffering={audio:{start:0,executeStart:0,executeEnd:0,end:0},video:{start:0,executeStart:0,executeEnd:0,end:0},audiovideo:{start:0,executeStart:0,executeEnd:0,end:0}},this.level=e,this.sn=t,this.id=r,this.size=i,this.part=a,this.partial=n,this.duration=s||0,this.decryptRange=l,this.iframe=o||!1};function Bi(e,t){for(var r=0,i=e.length;r<i;r++){var a;if((null==(a=e[r])?void 0:a.cc)===t)return e[r]}return null}function Ui(e,t){var r=e.start+t;e.setStart(r)}function Gi(e,t){for(var r=t.fragments,i=0,a=r.length;i<a;i++)Ui(r[i],e);t.fragmentHint&&Ui(t.fragmentHint,e),t.alignedSliding=!0}function Vi(e,t,r){e&&(function(e,t,r){if(function(e,t){return!!(e&&t.startCC<e.endCC&&t.endCC>e.startCC)}(t,e)){var i=Math.min(t.endCC,e.endCC),a=Bi(t.fragments,i),n=Bi(e.fragments,i);if(a&&n){var s=a.start-n.start;r.log("Aligning playlists using dicontinuity sequence "+i+" (diff: "+s+")"),Gi(s,e)}}}(t,e,r),t.alignedSliding||function(e,t,r){if(e.hasProgramDateTime&&t.hasProgramDateTime){var i,a,n=e.fragments,s=t.fragments;if(n.length&&s.length){var o=Math.min(t.endCC,e.endCC);t.startCC<o&&e.startCC<o&&(i=Bi(s,o),a=Bi(n,o)),i&&a||(a=Bi(n,(i=s[Math.floor(s.length/2)]||s.filter((function(e){return!!e}))[0]).cc)||n[Math.floor(n.length/2)]);var l=i.programDateTime,u=a.programDateTime;if(l&&u){var d=(u-l)/1e3;if(Math.abs(d)>Math.max(60,e.totalduration))r.log("Cannot align playlists using PDT without overlap ("+Math.abs(d)+" > "+e.totalduration+")");else{var h=d-(a.start-i.start);r.log("Aligning playlists using PDT (diff: "+h+")"),Gi(h,e)}}}}}(t,e,r),t.alignedSliding||t.skippedSegments||si(e,t,!1,r))}var Hi={STOPPED:"STOPPED",IDLE:"IDLE",KEY_LOADING:"KEY_LOADING",FRAG_LOADING:"FRAG_LOADING",FRAG_LOADING_WAITING_RETRY:"FRAG_LOADING_WAITING_RETRY",PARSING:"PARSING",PARSED:"PARSED",ENDED:"ENDED",ERROR:"ERROR",WAITING_LEVEL:"WAITING_LEVEL"},Ki=function(e){function t(t,r,i,a,n){var s;return(s=e.call(this,a,t.logger)||this).hls=void 0,s.fragPrevious=null,s.fragCurrent=null,s.fragPlaying=null,s.fragmentTracker=void 0,s.transmuxer=null,s._state=Hi.STOPPED,s.playlistType=void 0,s.media=null,s.mediaBuffer=null,s.config=void 0,s.bitrateTest=!1,s.lastCurrentTime=0,s.nextLoadPosition=0,s.startPosition=-1,s.startTimeOffset=null,s.retryDate=0,s.levels=null,s.fragmentLoader=void 0,s.initFragmentLoader=void 0,s.keyLoader=void 0,s.levelLastLoaded=null,s.startFragRequested=!1,s.decrypter=void 0,s.initPTS=[],s.buffering=!0,s.loadingParts=!1,s.loopSn=void 0,s.onMediaSeeking=function(){var e=s,t=e.config,r=e.fragCurrent,i=e.media,a=e.mediaBuffer,n=e.state,o=i?i.currentTime:0,l=dr.bufferInfo(a||i,o,t.maxBufferHole),u=l.len;if(s.log("Media seeking to "+o+", state: "+n+", "+(u?"in":"out of")+" buffer"),s.state===Hi.ENDED)s.resetLoadingState();else if(r){var d=t.maxFragLookUpTolerance,h=r.start-d,f=r.start+r.duration+d;if(!u||f<l.start||h>l.end){var c=o<h,g=o>f;(c||g)&&(!r.loader||!g&&s.isFragmentNearlyDownloaded(r)?s.fragPrevious=null:(s.log("Cancelling fragment load for seek (sn: "+r.sn+") - "+(c?"backward":"forward")+" seek"),r.abortRequests(),s.resetLoadingState()))}}if(i&&(s.fragmentTracker.removeFragmentsInRange(o,1/0,s.playlistType,!0),o>s.lastCurrentTime&&(s.lastCurrentTime=o),!s.loadingParts)){var v=Math.max(l.end,o),m=s.shouldLoadParts(s.getLevelDetails(),v);m&&(s.log("LL-Part loading ON after seeking to "+o+" with buffer @"+v),s.loadingParts=m)}var p=!dr.isBuffered(i,o);s.hls.hasEnoughToStart&&!p||(s.log("Setting "+(p?"startPosition":"nextLoadPosition")+" to "+o+" for seek without enough to start"),s.nextLoadPosition=o,p&&(s.startPosition=o)),u<1&&s.state===Hi.IDLE&&s.tickImmediate()},s.onMediaEnded=function(){s.log("setting startPosition to 0 because media ended"),s.startPosition=s.lastCurrentTime=0},s.playlistType=n,s.hls=t,s.fragmentLoader=new Pi(t.config),s.initFragmentLoader=new Pi(t.config),s.keyLoader=i,s.fragmentTracker=r,s.config=t.config,s.decrypter=new _i(t.config),s}u(t,e);var r=t.prototype;return r.registerListeners=function(){var e=this.hls;e.on(O.MEDIA_ATTACHED,this.onMediaAttached,this),e.on(O.MEDIA_DETACHING,this.onMediaDetaching,this),e.on(O.MANIFEST_LOADING,this.onManifestLoading,this),e.on(O.MANIFEST_LOADED,this.onManifestLoaded,this),e.on(O.ERROR,this.onError,this)},r.unregisterListeners=function(){var e=this.hls;e.off(O.MEDIA_ATTACHED,this.onMediaAttached,this),e.off(O.MEDIA_DETACHING,this.onMediaDetaching,this),e.off(O.MANIFEST_LOADING,this.onManifestLoading,this),e.off(O.MANIFEST_LOADED,this.onManifestLoaded,this),e.off(O.ERROR,this.onError,this)},r.doTick=function(){this.onTickEnd()},r.onTickEnd=function(){},r.startLoad=function(e){},r.stopLoad=function(){if(this.state!==Hi.STOPPED){this.fragmentLoader.abort(),this.initFragmentLoader.abort(),this.keyLoader.abort(this.playlistType);var e=this.fragCurrent;null!=e&&e.loader&&(e.abortRequests(),this.fragmentTracker.removeFragment(e)),this.resetTransmuxer(),this.fragCurrent=null,this.fragPrevious=null,this.clearInterval(),this.clearNextTick(),this.state=Hi.STOPPED}},r.pauseBuffering=function(){this.buffering=!1},r.resumeBuffering=function(){this.buffering=!0},r._streamEnded=function(e,t){if(t.live||!this.media)return!1;var r=e.end||0,i=this.config.timelineOffset||0;if(r<=i)return!1;var a=e.buffered;this.config.maxBufferHole&&a&&a.length>1&&(e=dr.bufferedInfo(a,e.start,0));var n=e.nextStart;if(n&&n>i&&n<t.edge)return!1;if(this.media.currentTime<e.start)return!1;var s=t.partList;if(null!=s&&s.length){var o=s[s.length-1];return dr.isBuffered(this.media,o.start+o.duration/2)}var l=t.fragments[t.fragments.length-1];return this.fragmentTracker.isEndListAppended(l.type)},r.getLevelDetails=function(){if(this.levels&&null!==this.levelLastLoaded)return this.levelLastLoaded.details},r.onMediaAttached=function(e,t){var r=this.media=this.mediaBuffer=t.media;hr(r,"seeking",this.onMediaSeeking),hr(r,"ended",this.onMediaEnded);var i=this.config;this.levels&&i.autoStartLoad&&this.state===Hi.STOPPED&&this.startLoad(i.startPosition)},r.onMediaDetaching=function(e,t){this.fragPlaying=null;var r=!!t.transferMedia,i=this.media;if(null!==i){if(i.ended&&(this.log("MSE detaching and video ended, reset startPosition"),this.startPosition=this.lastCurrentTime=0),fr(i,"seeking",this.onMediaSeeking),fr(i,"ended",this.onMediaEnded),this.media=this.mediaBuffer=null,this.loopSn=void 0,r)return this.resetLoadingState(),void this.resetTransmuxer();this.loadingParts=!1,this.fragmentTracker.removeAllFragments(),this.stopLoad()}},r.onManifestLoading=function(){this.initPTS=[],this.fragPlaying=this.levels=this.levelLastLoaded=this.fragCurrent=null,this.lastCurrentTime=0,this.startPosition=-1,this.startFragRequested=!1},r.onError=function(e,t){},r.onManifestLoaded=function(e,t){this.startTimeOffset=t.startTimeOffset},r.onHandlerDestroying=function(){this.stopLoad(),this.transmuxer&&(this.transmuxer.destroy(),this.transmuxer=null),e.prototype.onHandlerDestroying.call(this),this.hls=this.onMediaSeeking=this.onMediaEnded=null},r.onHandlerDestroyed=function(){this.state=Hi.STOPPED,this.fragmentLoader&&this.fragmentLoader.destroy(),this.initFragmentLoader&&this.initFragmentLoader.destroy(),this.keyLoader&&this.keyLoader.destroy(),this.decrypter&&this.decrypter.destroy(),this.hls=this.decrypter=this.keyLoader=null,this.fragmentLoader=this.initFragmentLoader=this.fragmentTracker=null,e.prototype.onHandlerDestroyed.call(this)},r.loadFragment=function(e,t,r){this.startFragRequested=!0,this._loadFragForPlayback(e,t,r)},r._loadFragForPlayback=function(e,t,r){var i=this;this._doFragLoad(e,t,r,(function(e){var t=e.frag;if(i.fragContextChanged(t))return i.warn(t.type+" sn: "+t.sn+(e.part?" part: "+e.part.index:"")+" of "+i.fragInfo(t,!1,e.part)+" was dropped during download."),void i.fragmentTracker.removeFragment(t);var r=++t.stats.chunkCount;i.log("load progress "+t.type+" sn: "+t.sn+(e.part?" part: "+e.part.index:"")+" of "+i.fragInfo(t,!1,e.part)+" chunk: "+r),i._handleFragmentLoadProgress(e)})).then((function(e){if(e){var t=i.state,r=e.frag;i.fragContextChanged(r)?(t===Hi.FRAG_LOADING||!i.fragCurrent&&t===Hi.PARSING)&&(i.fragmentTracker.removeFragment(r),i.state=Hi.IDLE):("payload"in e&&(i.log("Loaded "+r.type+" sn: "+r.sn+" of "+i.playlistLabel()+" "+r.level+" (bytes "+r.stats.loaded+")"),i.hls.trigger(O.FRAG_LOADED,e)),i._handleFragmentLoadComplete(e))}})).catch((function(t){i.state!==Hi.STOPPED&&i.state!==Hi.ERROR&&(i.log("Frag error "+e.type+" sn:"+e.sn+" cc:"+e.cc+": "+((null==t?void 0:t.message)||t)),i.resetFragmentLoading(e))}))},r.clearTrackerIfNeeded=function(e){var t,r=this.fragmentTracker;if(r.getState(e)===Ei){var i=e.type,a=this.getFwdBufferInfo(this.mediaBuffer,i),n=Math.max(e.duration,a?a.len:this.config.maxBufferLength),s=this.backtrackFragment;(1==(s?e.sn-s.sn:0)||this.reduceMaxBufferLength(n,e.duration))&&r.removeFragment(e)}else 0===(null==(t=this.mediaBuffer)?void 0:t.buffered.length)?r.removeAllFragments():r.hasParts(e.type)&&(r.detectPartialFragments({frag:e,part:null,stats:e.stats,id:e.type}),r.getState(e)===Ti&&r.removeFragment(e))},r.checkLiveUpdate=function(e){if(e.updated&&!e.live){var t=this.fragmentTracker,r=e.fragments[e.fragments.length-1];if(r.endList&&!t.isEndListAppended(this.playlistType)){var i=t.getPartialFragment(r.end);i&&(t.removeFragment(i),t.fragBuffered(r,!0))}t.detectPartialFragments({frag:r,part:null,stats:r.stats,id:r.type})}e.fragments[0]||(e.deltaUpdateFailed=!0)},r.waitForLive=function(e){var t=e.details;return(null==t?void 0:t.live)&&"EVENT"!==t.type&&(this.levelLastLoaded!==e||t.expired)},r.flushMainBuffer=function(e,t,r){if(void 0===r&&(r=null),e-t){var i={startOffset:e,endOffset:t,type:r};this.hls.trigger(O.BUFFER_FLUSHING,i)}},r._loadInitSegment=function(e){var t=this,r=this.hls;return this.initFragmentLoader.abort(),r.trigger(O.FRAG_LOADING,{frag:e,targetBufferTime:0}),this.initFragmentLoader.load(e).then((function(e){var r,i=e.frag;if(!t.levels||!H(i,null==(r=t.fragCurrent)?void 0:r.initSegment))throw new Mi({type:x.NETWORK_ERROR,details:w.INTERNAL_ABORTED,error:new Error("init load aborted"),fatal:!1,frag:i,networkDetails:null});return e})).then((function(e){var i=e.frag,a=e.payload,n=i.decryptdata;if(a&&a.byteLength>0&&null!=n&&n.key&&n.iv&&Or(n.method)){var s=self.performance.now(),o=wi(i,null,t.iframesOnly).decryptRange;return t.decrypter.decrypt(new Uint8Array(a),n.key.buffer,n.iv.buffer,Mr(n.method),o).catch((function(e){throw r.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.FRAG_DECRYPT_ERROR,fatal:!1,error:e,reason:e.message,frag:i}),t.fragmentLoader.abort(),e})).then((function(a){var n=self.performance.now();return r.trigger(O.FRAG_DECRYPTED,{frag:i,part:null,payload:a,stats:{tstart:s,tdecrypt:n}}),e.payload=a,t.completeInitSegmentLoad(e)}))}return t.completeInitSegmentLoad(e)}))},r.completeInitSegmentLoad=function(e){var t=e.frag.stats;e.frag.data=new Uint8Array(e.payload),t.parsing.start=t.buffering.start=self.performance.now(),t.parsing.end=t.buffering.end=self.performance.now()},r.loadInitSegmentIfNeeded=function(e){var t,r=this,i=e.initSegment;if(!this.bitrateTest&&G(e)&&i&&!i.data)return(!i.encrypted||null!=(t=i.decryptdata)&&t.key?this._loadInitSegment(i):this.keyLoader.load(i).then((function(){return r._loadInitSegment(i)}))).catch((function(t){if(r.state===Hi.STOPPED||r.state===Hi.ERROR)throw t;throw"data"in t&&(t.data.frag=e,r.fragmentLoader.abort(),r.handleFragLoadError(t)),r.resetFragmentLoading(e),t}))},r.unhandledEncryptionError=function(e,t){var r,i,a=e.tracks;if(a&&!t.encrypted&&(null!=(r=a.audio)&&r.encrypted||null!=(i=a.video)&&i.encrypted)&&(!this.config.emeEnabled||!this.keyLoader.emeController)){var n=this.media,s=new Error("EME not supported (light build)");return this.warn(s.message),!(!n||n.mediaKeys)&&(this.hls.trigger(O.ERROR,{type:x.KEY_SYSTEM_ERROR,details:w.KEY_SYSTEM_NO_KEYS,fatal:!0,error:s,frag:t}),this.resetTransmuxer(),!0)}return!1},r.fragContextChanged=function(e){var t=this.fragCurrent;return!e||!H(e,t)},r.fragBufferedComplete=function(e,t){var r=this.mediaBuffer?this.mediaBuffer:this.media;if(this.log("Buffered "+e.type+" sn: "+e.sn+(t?" part: "+t.index:"")+" of "+this.fragInfo(e,!1,t)+" > buffer:"+(r?cr(dr.getBuffered(r)):"(detached)")+")"),G(e)){var i;if(e.type!==N.SUBTITLE){var a=e.elementaryStreams;if(!Object.keys(a).some((function(e){return!!a[e]})))return void(this.state=Hi.IDLE)}var n=null==(i=this.levels)?void 0:i[e.level];null!=n&&n.fragmentError&&(t||this.fragmentTracker.getState(e)!==Ti)&&(this.log("Resetting level fragment error count of "+n.fragmentError+" on frag buffered"),n.fragmentError=0,e.stats.retry=0)}this.state=Hi.IDLE},r._handleFragmentLoadComplete=function(e){var t=this.transmuxer;if(t){var r=e.frag,i=e.part,a=e.partsLoaded,n=!a||0===a.length||a.some((function(e){return!e})),s=wi(r,i).decryptRange,o=new Ni(r.level,r.sn,r.stats.chunkCount+1,0,i?i.index:-1,!n,r.duration,this.iframesOnly,s);this.log("load complete "+r.type+" sn: "+r.sn+(i?" part: "+i.index:"")+" of "+this.fragInfo(r,!1,i)),t.flush(o)}},r._handleFragmentLoadProgress=function(e){},r.loadKeyFor=function(e,t,r){var i,a=this,n=null;return!e.encrypted||null!=(i=e.decryptdata)&&i.key?e.encrypted||(n=this.keyLoader.loadClear(e,t.encryptedFragments,this.startFragRequested))&&this.log("[eme] blocking frag sn: "+e.sn+" load until media-keys acquired"):(this.log("Loading key for "+e.sn+" of ["+t.startSN+"-"+t.endSN+"], "+this.playlistLabel()+" "+e.level),this.state=Hi.KEY_LOADING,n=this.keyLoader.load(e,r).then((function(e){if(!a.fragContextChanged(e.frag))return a.hls.trigger(O.KEY_LOADED,e),a.state===Hi.KEY_LOADING&&(a.state=Hi.IDLE),e})),this.hls.trigger(O.KEY_LOADING,{frag:e})),n},r._doFragLoad=function(e,t,r,i){var a=this;void 0===r&&(r=null),this.fragCurrent=e;var n=t.details;if(!this.levels||!n)throw new Error("frag load aborted, missing level"+(n?"":" detail")+"s");var s,o=this.fragPrevious;if(!V(e,o)){var l=this.shouldLoadParts(t.details,e.end);l!==this.loadingParts&&(this.log("LL-Part loading "+(l?"ON":"OFF")+" loading sn "+(null==o?void 0:o.sn)+"->"+e.sn),this.loadingParts=l)}if(r=Math.max(e.start,r||0),this.loadingParts){var u=n.partList;if(u&&i){r>n.fragmentEnd&&n.fragmentHint&&(e=n.fragmentHint);var d=this.getNextPart(u,e,r);if(d>-1){var h=u[d];if(!V(e=this.fragCurrent=h.fragment,o)&&!this.shouldLoadParts(t.details,e.end))return this.log("LL-Part loading OFF @"+this.playhead+" next part: "+this.fragInfo(e,!1,h)),this.loadingParts=!1,Promise.resolve(null);if(!this.filterReplacedPrimary(h,t.details))return Promise.resolve(null);var f,c=this.loadKeyFor(e,n);if(this.fragContextChanged(e))return Promise.resolve(null);this.log("Loading "+e.type+" sn: "+e.sn+" part: "+h.index+" ("+d+"/"+(u.length-1)+") of "+this.fragInfo(e,!1,h)+" cc: "+e.cc+" ["+n.startSN+"-"+n.endSN+"], target: "+r+(h.byteRange.length?" range:"+h.byteRange.join("-"):"")),this.nextLoadPosition=h.start+h.duration,this.state=Hi.FRAG_LOADING;var g=this.loadInitSegmentIfNeeded(e);if(c||g){var v=!!c;f=Promise.all([c,g]).then((function(r){var n=r[0];return!v||n&&!a.fragContextChanged(n.frag)?a.doFragPartsLoad(e,h,t,i):null})).catch((function(e){return a.handleFragLoadError(e)}))}else f=this.doFragPartsLoad(e,h,t,i).catch((function(e){return a.handleFragLoadError(e)}));return this.hls.trigger(O.FRAG_LOADING,{frag:e,part:h,targetBufferTime:r}),null===this.fragCurrent?Promise.reject(new Error("frag load aborted, context changed in FRAG_LOADING parts")):f}if(!e.url||this.loadedEndOfParts(u,r))return Promise.resolve(null)}}if(this.loadingParts)this.log("LL-Part loading OFF after next part miss @"+r+" Check buffer at sn: "+e.sn+" loaded parts: "+(null==(s=n.partList)?void 0:s.filter((function(e){return e.loaded})).map((function(e){return"["+e.start+"-"+e.end+"]"})))),this.loadingParts=!1;else if(!e.url)return Promise.resolve(null);if(!this.filterReplacedPrimary(e,t.details))return Promise.resolve(null);var m,p=this.loadInitSegmentIfNeeded(e),y=this.loadKeyFor(e,n,p);if(this.fragContextChanged(e))return this.log("Context changed in KEY_LOADING sn: "+e.sn+" "+e.relurl+" > "+(null==(m=this.fragCurrent)?void 0:m.relurl)),null==p||p.catch((function(){return null})),null==y||y.catch((function(){return null})),Promise.resolve(null);this.log("Loading "+e.type+" sn: "+e.sn+" of "+this.fragInfo(e,!1)+" cc: "+e.cc+" ["+n.startSN+"-"+n.endSN+"], target: "+r+(e.byteRange.length?" range:"+e.byteRange.join("-"):"")),_(e.sn)&&!this.bitrateTest&&(this.nextLoadPosition=e.start+e.duration),this.state=Hi.FRAG_LOADING;var E,T=this.config.progressive&&e.type!==N.SUBTITLE;return E=T&&y?y.then((function(t){return!t||a.fragContextChanged(t.frag)?null:a.fragmentLoader.load(e,a.iframesOnly,i,p)})).catch((function(e){return a.handleFragLoadError(e)})):Promise.all([this.fragmentLoader.load(e,this.iframesOnly,T?i:void 0,T?p:void 0),y,p]).then((function(e){var t=e[0];return!T&&i&&i(t),t})).catch((function(e){return a.handleFragLoadError(e)})),this.hls.trigger(O.FRAG_LOADING,{frag:e,targetBufferTime:r}),null===this.fragCurrent?Promise.reject(new Error("frag load aborted, context changed in FRAG_LOADING")):Promise.all([E,p]).then((function(e){return e[0]}))},r.doFragPartsLoad=function(e,t,r,i){var a=this;return new Promise((function(n,s){var o,l=[],u=null==(o=r.details)?void 0:o.partList,d=function(t){a.fragmentLoader.loadPart(e,t,i).then((function(i){l[t.index]=i;var s=i.part;a.hls.trigger(O.FRAG_LOADED,i);var o=ui(r.details,e.sn,t.index+1)||di(u,e.sn,t.index+1);if(!o)return n({frag:e,part:s,partsLoaded:l});d(o)})).catch(s)};d(t)}))},r.handleFragLoadError=function(e){if("data"in e){var t=e.data;t.frag&&t.details===w.INTERNAL_ABORTED?this.handleFragLoadAborted(t.frag,t.part):t.frag&&t.type===x.KEY_SYSTEM_ERROR&&!t.fatal&&(t.frag.abortRequests(),this.resetStartWhenNotLoaded(),this.resetFragmentLoading(t.frag)),this.hls.trigger(O.ERROR,t)}else this.hls.trigger(O.ERROR,{type:x.OTHER_ERROR,details:w.INTERNAL_EXCEPTION,err:e,error:e,fatal:!0});return null},r._handleTransmuxerFlush=function(e){var t=this.getCurrentContext(e);if(t&&this.state===Hi.PARSING){var r=t.frag,i=t.part,a=t.level,n=self.performance.now();r.stats.parsing.end=n,i&&(i.stats.parsing.end=n);var s=this.getLevelDetails(),o=s&&r.sn>s.endSN||this.shouldLoadParts(s,r.end);o!==this.loadingParts&&(this.log("LL-Part loading "+(o?"ON":"OFF")+" after parsing segment ending @"+r.end),this.loadingParts=o),this.updateLevelTiming(r,i,a,e)}else this.fragCurrent||this.state===Hi.STOPPED||this.state===Hi.ERROR||(this.state=Hi.IDLE)},r.shouldLoadParts=function(e,t){if(this.config.lowLatencyMode){if(!e)return this.loadingParts;if(e.partList&&!this.iframesOnly){var r,i=e.partList[0];if(t>=i.end+((null==(r=e.fragmentHint)?void 0:r.duration)||0)&&this.playhead>i.start-i.fragment.duration)return!0}}return!1},r.getCurrentContext=function(e){var t=this.levels,r=this.fragCurrent,i=e.level,a=e.sn,n=e.part;if(null==t||!t[i])return this.warn("Levels object was unset while buffering fragment "+a+" of "+this.playlistLabel()+" "+i+". The current chunk will not be buffered."),null;var s=t[i],o=s.details,l=n>-1?ui(o,a,n):null,u=l?l.fragment:li(o,a,r);return u?(r&&r!==u&&(u.stats=r.stats),{frag:u,part:l,level:s}):null},r.bufferFragmentData=function(e,t,r,i,a){if(this.state===Hi.PARSING){G(t)&&!this.fragContextChanged(t)&&(this.fragPrevious=t);var n=e.data1,s=e.data2,o=n;if(s&&(o=it(n,s)),o.length){var l=this.initPTS[t.cc],u=l?-l.baseTime/l.timescale:void 0,d={type:e.type,frag:t,part:r,chunkMeta:i,offset:u,parent:t.type,data:o};if(this.hls.trigger(O.BUFFER_APPENDING,d),e.dropped&&e.independent&&!r){if(a)return;this.flushBufferGap(t)}}}},r.flushBufferGap=function(e){var t=this.media;if(t)if(dr.isBuffered(t,t.currentTime)){var r=t.currentTime,i=dr.bufferInfo(t,r,0),a=e.duration,n=Math.min(2*this.config.maxFragLookUpTolerance,.25*a),s=Math.max(Math.min(e.start-n,i.end-n),r+n);e.start-s>n&&this.flushMainBuffer(s,e.start)}else this.flushMainBuffer(0,e.start)},r.getFwdBufferInfo=function(e,t){var r,i=this.playhead,a=this.lastCurrentTime>i||null!=(r=this.media)&&r.paused?0:this.config.maxBufferHole;return this.getFwdBufferInfoAtPos(e,i,t,a)},r.getFwdBufferInfoAtPos=function(e,t,r,i){var a=dr.bufferInfo(e,t,i);if(0===a.len&&void 0!==a.nextStart){var n=this.fragmentTracker.getBufferedFrag(t,r);if(n&&(a.nextStart<=n.end||n.gap)){var s=Math.max(Math.min(a.nextStart,n.end)-t,i);return dr.bufferInfo(e,t,s)}}return a},r.getMaxBufferLength=function(e){var t,r=this.config;return t=e?Math.max(8*r.maxBufferSize/e,r.maxBufferLength):r.maxBufferLength,Math.min(t,r.maxMaxBufferLength)},r.exceedsMaxBuffer=function(e,t,r){var i=e.nextStart;if(i&&r.start>i){var a=e.buffered;if(a){for(var n=e.len,s=e.bufferedIndex,o=a.length-1;o>s;o--)a[o].start<r.start&&(n+=a[o].end-a[o].start);return n>=t}}return!1},r.reduceMaxBufferLength=function(e,t){var r=this.config,i=Math.max(Math.min(e-t,r.maxBufferLength),t/2),a=Math.max(e-3*t,r.maxMaxBufferLength/2,i);return a>=i&&(r.maxMaxBufferLength=a,this.warn("Reduce max buffer length to "+a+"s"),!0)},r.getAppendedFrag=function(e){var t=this.fragmentTracker?this.fragmentTracker.getAppendedFrag(e,this.playlistType):null;return t&&"fragment"in t?t.fragment:t},r.getNextFragment=function(e,t){var r=t.fragments,i=r.length;if(!i)return null;var a=this.config,n=t.fragmentStart,s=a.lowLatencyMode&&!!t.partList,o=null;if(t.live){var l=a.initialLiveManifestSize;if(i<l)return this.warn("Not enough fragments to start playback (have: "+i+", need: "+l+")"),null;if(this.startFragRequested||!s||this.loadingParts||(this.log("LL-Part loading ON for initial live fragment"),this.loadingParts=!0),!t.PTSKnown&&!this.startFragRequested&&-1===this.startPosition||e<n){var u;o=this.getInitialLiveFragment(t);var d,h,f=this.config.startPosition,c=this.hls.startPosition,g=this.hls.liveSyncPosition,v=(null==(u=o)?void 0:u.start)||0;if(-1!==c&&c>=n?(d=c,h=c===f?"config":"next load start"):g?(d=g,h="live edge"):(d=e,h="buffer pos"),d<v&&(d=v,h="live frag start"),d<n&&(d=n,h="playlist start"),this.startPosition!=d||this.nextLoadPosition!=d){var m=t.live&&!this.filterReplacedPrimary(o,t)?-1:d;this.log("Setting startPosition to "+m+" next load "+d+" "+(-1===c?"":"(from "+f+") ")+"based on "+h+". live edge: "+g+" live frag start: "+v+" playlist start: "+n+" buffer pos: "+e),this.startPosition=m,this.nextLoadPosition=d}}}else e<=n&&(o=r[0]);if(!o){var p=this.loadingParts?t.partEnd:t.fragmentEnd;o=this.getFragmentAtPosition(e,p,t)}var y,E,T=this.filterReplacedPrimary(o,t);return!T&&o&&(y=t,(T=(E=o.sn)===y.endSN&&y.fragmentHint?y.fragmentHint:y.fragments[1+E-y.startSN]||null)&&(this.nextLoadPosition=T.start)),T},r.isLoopLoading=function(e,t){if(this.nextLoadPosition<=t)return!1;var r=this.fragmentTracker.getState(e);if(r===Si)return!0;if(r===Ti){if(e.gap)return!0;if(e.stats.retry>1)return!0}return!1},r.getNextFragmentLoopLoading=function(e,t,r,i,a){var n=null;if(e.gap&&(n=this.getNextFragment(this.nextLoadPosition,t))&&!n.gap&&r.nextStart){var s=this.getFwdBufferInfoAtPos(this.mediaBuffer?this.mediaBuffer:this.media,r.nextStart,i,0);if(null!==s&&r.len+s.len>=a){var o=n.sn;return this.loopSn!==o&&(this.log('buffer full after gaps in "'+i+'" playlist starting at sn: '+o),this.loopSn=o),null}}return this.loopSn=void 0,n},r.filterReplacedPrimary=function(e,t){return e?(this.config,e):e},r.getNextPart=function(e,t,r){for(var i=-1,a=!1,n=!0,s=0,o=e.length;s<o;s++){var l=e[s];if(n=n&&!l.independent,i>-1&&r<l.start)break;var u=l.loaded||l.gap;u?i=-1:(a||(l.independent||n)&&l.fragment===t)&&(i=s),a=u&&!l.gap}var d=e[i];return d&&d.fragment!==t&&this.log("Need buffer at "+r+" but next unloaded part starts at "+d.start+" (sn: "+t.sn+" -> "+d.fragment.sn+")"),i},r.loadedEndOfParts=function(e,t){for(var r,i=e.length;i--;){if(!(r=e[i]).loaded)return!1;if(t>r.start)return!0}return!1},r.getInitialLiveFragment=function(e){var t=e.fragments,r=this.fragPrevious,i=null;if(r){if(e.hasProgramDateTime&&(i=function(e,t,r){if(null===t||!Array.isArray(e)||!e.length||!_(t))return null;if(t<(e[0].programDateTime||0))return null;if(t>=(e[e.length-1].endProgramDateTime||0))return null;for(var i=0;i<e.length;++i){var a=e[i];if(qt(t,r,a))return a}return null}(t,r.endProgramDateTime,this.config.maxFragLookUpTolerance),i&&this.log("Live playlist, switching playlist, load frag with same PDT: "+r.programDateTime)),!i){var a=r.sn+1;if(a>=e.startSN&&a<=e.endSN){var n=t[a-e.startSN];r.cc===n.cc&&(i=n,this.log("Live playlist, switching playlist, load frag with next SN: "+i.sn))}i||(i=function(e,t,r){if(e&&e.startCC<=t&&e.endCC>=t){var i,a=e.fragments,n=e.fragmentHint;return n&&(a=a.concat(n)),Yt(a,(function(e){return e.cc<t?1:e.cc>t?-1:(i=e,e.end<=r?1:e.start>r?-1:0)})),i||null}return null}(e,r.cc,r.end),i&&this.log("Live playlist, switching playlist, load frag with same CC: "+i.sn))}}else{var s=this.hls.liveSyncPosition;null!==s&&(i=this.getFragmentAtPosition(s,this.bitrateTest?e.fragmentEnd:e.edge,e))}return i},r.getFragmentAtPosition=function(e,t,r){var i,a,n=this.config,s=this.fragPrevious,o=r.fragments,l=r.endSN,u=r.fragmentHint,d=n.maxFragLookUpTolerance,h=r.partList,f=!!(this.loadingParts&&null!=h&&h.length&&u);if(f&&!this.bitrateTest&&h[h.length-1].fragment.sn===u.sn&&(o=o.concat(u),l=u.sn),s&&this.fragmentTracker.getState(s)===yi&&(s=null),i=e<t?Wt(s,o,e,e<this.lastCurrentTime||e>t-d||null!=(a=this.media)&&a.paused||!this.startFragRequested?0:d):o[o.length-1]){var c=i.sn-r.startSN,g=this.fragmentTracker.getState(i);if((g===Si||g===Ti&&i.gap)&&(s=i),V(i,s)&&(!f||h[0].fragment.sn>i.sn||!r.live)){var v=o[c+1];i=i.sn<l&&this.fragmentTracker.getState(v)!==Si?v:null}}return i},r.alignPlaylists=function(e,t,r){var i=e.fragments.length;if(!i)return this.warn("No fragments in live playlist"),0;var a=e.fragmentStart,n=!t,s=e.alignedSliding&&_(a);if(n||!s&&!a){Vi(r,e,this);var o=e.fragmentStart;return this.log("Live playlist sliding: "+o+" start-sn: "+(t?t.startSN:"na")+"->"+e.startSN+" fragments: "+i),o}return a},r.waitForCdnTuneIn=function(e){return e.live&&e.canBlockReload&&e.partTarget&&e.tuneInGoal>Math.max(e.partHoldBack,3*e.partTarget)},r.setStartPosition=function(e,t){var r=this.startPosition;r<t&&(r=-1);var i=this.timelineOffset;if(-1===r){var a=null!==this.startTimeOffset,n=a?this.startTimeOffset:e.startTimeOffset;if(null!==n&&_(n))r=t+n,n<0&&(r+=e.edge),r=Math.min(Math.max(t,r),t+e.totalduration),this.log("Setting startPosition to "+r+" for start time offset "+n+" found in "+(a?"multivariant":"media")+" playlist"),this.startPosition=r;else if(e.live){var s=this.hls.liveSyncPosition;r=s||t,this.log("Setting startPosition to -1 to start at "+(s?"live edge":"playlist start")+" "+r),this.startPosition=-1}else this.log("setting startPosition to 0 by default"),this.startPosition=r=0;this.lastCurrentTime=r+i}this.nextLoadPosition=r+i},r.getLoadPosition=function(){var e,t=this.media,r=0;return null!=(e=this.hls)&&e.hasEnoughToStart&&t&&!this.iframesOnly?r=t.currentTime:this.nextLoadPosition>=0&&(r=this.nextLoadPosition),r},r.handleFragLoadAborted=function(e,t){this.transmuxer&&e.type===this.playlistType&&G(e)&&e.stats.aborted&&(this.log("Fragment "+e.sn+(t?" part "+t.index:"")+" of "+this.playlistLabel()+" "+e.level+" was aborted"),this.resetFragmentLoading(e))},r.resetFragmentLoading=function(e){this.fragCurrent&&(this.fragContextChanged(e)||this.state===Hi.FRAG_LOADING_WAITING_RETRY)||(this.state=Hi.IDLE)},r.onFragmentOrKeyLoadError=function(e,t){if(t.chunkMeta&&!t.frag){var r=this.getCurrentContext(t.chunkMeta);r&&(t.frag=r.frag)}var i=t.frag,a=t.part;if(i&&this.levels&&i.type===e)if(this.fragContextChanged(i)){var n;this.warn("Frag load error must match current frag to retry "+i.relurl+" > "+(null==(n=this.fragCurrent)?void 0:n.relurl))}else{var s=t.details===w.FRAG_GAP;s&&this.fragmentTracker.addAsGap(i);var o=t.errorAction;if(o){var l=o.action,u=o.flags,d=o.retryCount,h=void 0===d?0:d,f=o.retryConfig,c=!!f,g=c&&l===$t,v=c&&!o.resolved&&u&Jt,m=this.hls.latestLevelDetails,p=null==m?void 0:m.live;if(!g&&v&&G(i)&&p&&i.sn<m.endSN&&!X(t))this.resetFragmentErrors(e),a?a.gap=!0:this.treatAsGap(i),o.resolved=!0;else if((g||v)&&h<f.maxNumRetry){var y,E=J(null==(y=t.response)?void 0:y.code),T=Q(f,h);if(this.resetStartWhenNotLoaded(),this.retryDate=self.performance.now()+T,this.state=Hi.FRAG_LOADING_WAITING_RETRY,o.resolved=!0,E)return this.log("Waiting for connection (offline)"),this.retryDate=1/0,void(t.reason="offline");this.warn("Fragment "+i.sn+" of "+e+" "+i.level+" errored with "+t.details+", retrying loading "+(h+1)+"/"+f.maxNumRetry+" in "+T+"ms")}else if(f){if(this.resetFragmentErrors(e),!(h<f.maxNumRetry))return void this.warn(t.details+" reached or exceeded max retry ("+h+")");s||l===Qt||(o.resolved=!0)}else this.state=l===zt?Hi.WAITING_LEVEL:Hi.ERROR;this.tickImmediate()}else this.state=Hi.ERROR}},r.checkRetryDate=function(){var e=self.performance.now(),t=this.retryDate,r=t===1/0;(!t||e>=t||r&&!J(0))&&(r&&this.log("Connection restored (online)"),this.resetStartWhenNotLoaded(),this.state=Hi.IDLE)},r.reduceLengthAndFlushBuffer=function(e){if(this.state===Hi.PARSING||this.state===Hi.PARSED){var t=e.frag,r=e.parent,i=this.getFwdBufferInfo(this.mediaBuffer,r),a=i&&i.len>.5;a&&this.reduceMaxBufferLength(i.len,(null==t?void 0:t.duration)||10);var n=!a;return n?this.warn("Buffer full error while media.currentTime ("+this.playhead+") is not buffered, flush "+r+" buffer"):i.nextStart&&t&&i.nextStart>t.start&&this.flushMainBuffer(i.nextStart,Number.POSITIVE_INFINITY,r===N.AUDIO?r:void 0),t&&(this.fragmentTracker.removeFragment(t),this.nextLoadPosition=t.start),this.resetLoadingState(),n}return!1},r.resetFragmentErrors=function(e){e===N.AUDIO&&(this.fragCurrent=null),this.hls.hasEnoughToStart||(this.startFragRequested=!1),this.state!==Hi.STOPPED&&(this.state=Hi.IDLE)},r.afterBufferFlushed=function(e,t){if(e){var r=dr.getBuffered(e);this.fragmentTracker.detectEvictedFragments(t,r,this.playlistType),this.state===Hi.ENDED&&this.resetLoadingState()}},r.resetLoadingState=function(){this.log("Reset loading state"),this.fragCurrent=null,this.fragPrevious=null,this.state!==Hi.STOPPED&&(this.state=Hi.IDLE)},r.resetStartWhenNotLoaded=function(){if(!this.hls.hasEnoughToStart){this.startFragRequested=!1;var e=this.getLevelDetails();null!=e&&e.live?(this.log("resetting startPosition for live start"),this.startPosition=-1,this.setStartPosition(e,e.fragmentStart),this.resetLoadingState()):this.nextLoadPosition=this.startPosition}},r.resetWhenMissingContext=function(e){this.log("Loading context changed while buffering sn "+e.sn+" of "+this.playlistLabel()+" "+(-1===e.level?"<removed>":e.level)+". This chunk will not be buffered."),this.removeUnbufferedFrags(),this.resetStartWhenNotLoaded(),this.resetLoadingState()},r.removeUnbufferedFrags=function(e){void 0===e&&(e=0),this.fragmentTracker.removeFragmentsInRange(e,1/0,this.playlistType,!1,!0)},r.updateLevelTiming=function(e,t,r,i){var a=this,n=r.details;if(n){if(this.log("update level timing "+e.type+" sn: "+e.sn+(t?" part: "+t.index:"")+" of "+this.fragInfo(e,!1,t)),!Object.keys(e.elementaryStreams).reduce((function(t,s){var o=e.elementaryStreams[s];if(o){var l=o.endPTS-o.startPTS;if(l<=0)return a.warn("Could not parse fragment "+e.sn+" "+s+" duration reliably ("+l+")"),t||!1;var u=i.partial?0:ii(n,e,o.startPTS,o.endPTS,o.startDTS,o.endDTS,a.iframesOnly,a);return a.hls.trigger(O.LEVEL_PTS_UPDATED,{details:n,level:r,drift:u,type:s,frag:e,start:o.startPTS,end:o.endPTS}),!0}return t}),!1)){var s,o,l,u,d=null===(null==(s=this.transmuxer)?void 0:s.error),h=null!=(null==(o=this.transmuxer)?void 0:o.error),f=(null!=(l=null==(u=this.levels)?void 0:u.length)?l:0)>1;if((0===r.fragmentError||d&&(r.fragmentError<2||e.endList)||h&&f)&&this.treatAsGap(e,r),d){var c=new Error("Found no media in "+this.playlistLabel()+" "+e.level+" "+(t?"part: "+t.index+" of ":"")+"sn: "+e.sn+" at playlist time: "+e.start+". Resetting transmuxer to fallback to playlist timing");if(this.warn(c.message),this.hls.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.FRAG_PARSING_ERROR,fatal:!1,error:c,frag:e,reason:"Found no media in msn "+e.sn+" of "+this.playlistLabel()+' "'+r.url+'"'}),!this.hls)return;this.resetTransmuxer()}}this.state=Hi.PARSED,this.log("Parsed "+e.type+" sn: "+e.sn+(t?" part: "+t.index:"")+" of "+this.fragInfo(e,!1,t)),this.hls.trigger(O.FRAG_PARSED,{frag:e,part:t,chunkMeta:i})}else this.warn("level.details undefined")},r.playlistLabel=function(){return this.playlistType+" playlist"},r.fragInfo=function(e,t,r){var i,a;return void 0===t&&(t=!0),this.playlistLabel()+" "+e.level+" ("+(r?"part":"frag")+":["+(null!=(i=t&&!r?e.startPTS:(r||e).start)?i:NaN)+"-"+(null!=(a=t&&!r?e.endPTS:(r||e).end)?a:NaN)+"]"+(r&&"main"===e.type?"INDEPENDENT="+(r.independent?"YES":"NO"):"")+")"},r.treatAsGap=function(e,t){t&&t.fragmentError++,this.fragmentTracker.addAsGap(e)},r.resetTransmuxer=function(){var e;null==(e=this.transmuxer)||e.reset()},r.isFragmentNearlyDownloaded=function(e){var t,r=null==(t=e.loader)?void 0:t.stats;if(!r)return!1;var i=r.loading.first>0,a=(r.total-r.loaded)/(this.hls.bandwidthEstimate||this.hls.config.abrEwmaDefaultEstimate);return i&&a<=.15},r.recoverWorkerError=function(e){"demuxerWorker"===e.event&&(this.fragmentTracker.removeAllFragments(),this.transmuxer&&(this.transmuxer.destroy(),this.transmuxer=null),this.resetStartWhenNotLoaded(),this.resetLoadingState())},r.calculateOptimalSwitchPoint=function(e,t){var r=0,i=this.hls,a=this.media,n=this.config,s=this.levels,o=this.playlistType,l=this.getLevelDetails();if(a&&!a.paused&&s){var u,d=o===N.AUDIO?ce.estimatedAudioBitrate(e.audioCodec,128e3):e.maxBitrate,h=1+i.ttfbEstimate/1e3,f=i.bandwidthEstimate*n.abrBandWidthUpFactor;r=h+d*(l&&(this.loadingParts?l.partTarget:l.averagetargetduration)||(null==(u=this.fragCurrent)?void 0:u.duration)||6)/f,e.details||(r+=h)}var c=this.playhead;return{fetchdelay:r,okToFlushForwardBuffer:!(null!=l&&l.live)||t.end-c>1.5*r}},r.scheduleTrackSwitch=function(e,t,r){var i=this.media,a=this.playlistType;if(i&&e){var n=r?this.getBufferedFrag(this.playhead+t):null;if(n){var s=this.followingBufferedFrag(n);if(s){var o;this.abortCurrentFrag();var l=s.maxStartPTS?s.maxStartPTS:s.start,u=s.duration,d=Math.max(n.end,l+Math.min(Math.max(u-this.config.maxFragLookUpTolerance,u*(this.couldBacktrack?.5:.125)),u*(this.couldBacktrack?.75:.25)));if(((null==(o=this.getLevelDetails())?void 0:o.fragmentStart)||0)>d)return;var h=a===N.MAIN?null:"audio";this.flushMainBuffer(d,Number.POSITIVE_INFINITY,h),this.cleanupBackBuffer()}}}},r.cleanupBackBuffer=function(){var e=this.media,t=this.playlistType;if(e){var r=this.getAppendedFrag(this.playhead);if(r&&r.start>1){var i=t===N.AUDIO;this.flushMainBuffer(0,r.start-(i?0:1),i?"audio":null)}}},r.getBufferedFrag=function(e){return this.fragmentTracker.getBufferedFrag(e,this.playlistType)},r.followingBufferedFrag=function(e){return e?this.getBufferedFrag(e.end+.5):null},r.abortCurrentFrag=function(){var e=this.fragCurrent;switch(this.fragCurrent=null,e&&(e.abortRequests(),this.fragmentTracker.removeFragment(e)),this.state){case Hi.KEY_LOADING:case Hi.FRAG_LOADING:case Hi.FRAG_LOADING_WAITING_RETRY:case Hi.PARSING:case Hi.PARSED:this.state=Hi.IDLE}this.nextLoadPosition=this.playhead},r.checkFragPlaying=function(){var e=this.media,t=null;if(e&&e.readyState>1&&!1===e.seeking){var r=e.currentTime;if(dr.isBuffered(e,r)?t=this.getAppendedFrag(r):dr.isBuffered(e,r+.1)&&(t=this.getAppendedFrag(r+.1)),t&&(this.backtrackFragment=void 0,!V(t,this.fragPlaying)))return this.fragPlaying=t,!0}return!1},r.getBufferOutput=function(){return null},r.nextLevelSwitch=function(){var e=this.levels,t=this.media,r=this.hls,i=this.config,a=this.playlistType;if(null!=t&&t.readyState&&e&&r&&i){var n=this.getBufferOutput(),s=this.getFwdBufferInfo(n,a);if(!s)return;var o=e[a===N.AUDIO?r.nextAudioTrack:r.nextLoadLevel],l=this.calculateOptimalSwitchPoint(o,s),u=l.fetchdelay,d=l.okToFlushForwardBuffer;this.scheduleTrackSwitch(s,u,d)}this.tickImmediate()},a(t,[{key:"startPositionValue",get:function(){var e=this.nextLoadPosition,t=this.startPosition;if(-1===t&&e){var r=this.getLevelDetails();return null!=r&&r.live?(this.hls.liveSyncPosition||r.fragmentStart)+this.timelineOffset:e}return t}},{key:"bufferingEnabled",get:function(){return this.buffering}},{key:"backtrackFragment",get:function(){},set:function(e){}},{key:"couldBacktrack",get:function(){return!1},set:function(e){}},{key:"inFlightFrag",get:function(){return{frag:this.fragCurrent,state:this.state}}},{key:"timelineOffset",get:function(){var e,t=this.config.timelineOffset;return t?(null==(e=this.getLevelDetails())?void 0:e.appliedTimelineOffset)||t:0}},{key:"primaryPrefetch",get:function(){return this.config,!1}},{key:"playhead",get:function(){var e;if(null!=(e=this.hls)&&e.hasEnoughToStart){var t,r=null==(t=this.media)?void 0:t.currentTime;return _(r)?r:this.lastCurrentTime}return this.getLoadPosition()}},{key:"iframesOnly",get:function(){var e;if(this.playlistType!==N.MAIN)return!1;var t=this.getLevelDetails();return t?t.iframesOnly:null==(e=this.levelLastLoaded)?void 0:e.iframes}},{key:"state",get:function(){return this._state},set:function(e){var t=this._state;t!==e&&(this._state=e,this.log(t+"->"+e))}}])}(Fi),Yi=function(e){function t(t,r){var i;return(i=e.call(this,"gap-controller",t.logger)||this).hls=void 0,i.fragmentTracker=void 0,i.media=null,i.mediaSource=void 0,i.nudgeRetry=0,i.skipRetry=0,i.stallReported=!1,i.stalled=null,i.moved=!1,i.seeking=!1,i.buffered={},i.lastCurrentTime=void 0,i.ended=0,i.waiting=0,i.onMediaPlaying=function(){i.ended=0,i.waiting=0},i.onMediaWaiting=function(){var e;null!=(e=i.media)&&e.seeking||(i.waiting=self.performance.now(),i.tick())},i.onMediaEnded=function(){var e;i.hls&&(i.ended=(null==(e=i.media)?void 0:e.currentTime)||1,i.hls.trigger(O.MEDIA_ENDED,{stalled:!1}))},i.hls=t,i.fragmentTracker=r,i.lastCurrentTime=i.getCurrentTime(),i.registerListeners(),i}u(t,e);var r=t.prototype;return r.registerListeners=function(){var e=this.hls;e&&(e.on(O.MEDIA_ATTACHED,this.onMediaAttached,this),e.on(O.MEDIA_DETACHING,this.onMediaDetaching,this),e.on(O.BUFFER_APPENDED,this.onBufferAppended,this))},r.unregisterListeners=function(){var e=this.hls;e&&(e.off(O.MEDIA_ATTACHED,this.onMediaAttached,this),e.off(O.MEDIA_DETACHING,this.onMediaDetaching,this),e.off(O.BUFFER_APPENDED,this.onBufferAppended,this))},r.destroy=function(){e.prototype.destroy.call(this),this.unregisterListeners(),this.media=this.hls=this.fragmentTracker=null,this.mediaSource=void 0},r.onMediaAttached=function(e,t){this.setInterval(100),this.mediaSource=t.mediaSource;var r=this.media=t.media;hr(r,"playing",this.onMediaPlaying),hr(r,"waiting",this.onMediaWaiting),hr(r,"ended",this.onMediaEnded)},r.onMediaDetaching=function(e,t){this.clearInterval();var r=this.media;r&&(fr(r,"playing",this.onMediaPlaying),fr(r,"waiting",this.onMediaWaiting),fr(r,"ended",this.onMediaEnded),this.media=null),this.mediaSource=void 0},r.onBufferAppended=function(e,t){this.buffered=t.timeRanges},r.getCurrentTime=function(){var e,t=(null==(e=this.hls)?void 0:e.config.timelineOffset)||0;return this.media?Math.max(this.media.currentTime,t):t},r.tick=function(){var e;if(null!=(e=this.media)&&e.readyState&&this.hasBuffered){var t=this.getCurrentTime();this.media.currentTime<t||(this.poll(t,this.lastCurrentTime),this.lastCurrentTime=t)}},r.poll=function(e,t){var r,i,a=null==(r=this.hls)?void 0:r.config;if(a){var n=this.media;if(n){var s=n.seeking,o=this.seeking&&!s,l=!this.seeking&&s,u=n.paused&&!s||n.ended||0===n.playbackRate;if(this.seeking=s,e!==t)return t&&(this.ended=0),this.moved=!0,s||(this.skipRetry=this.nudgeRetry=0,a.nudgeOnVideoHole&&!u&&e>t&&this.nudgeOnVideoHole(e,t)),void(0===this.waiting&&this.stallResolved(e));if(l||o)o&&this.stallResolved(e);else{if(u)return this.skipRetry=this.nudgeRetry=0,this.stallResolved(e),void(!this.ended&&n.ended&&this.hls&&(this.ended=e||1,this.hls.trigger(O.MEDIA_ENDED,{stalled:!1})));if(dr.getBuffered(n).length){var d=dr.bufferInfo(n,e,0),h=this.fragmentTracker;h&&this.hls&&Xi(0,e,h,this.hls);var f=d.nextStart||0;if(s&&h&&this.hls){var c=Wi(this.hls.inFlightFragments,e),g=d.len>2,v=!f||c||f-e>2&&!h.getPartialFragment(e);if(g||v)return;this.moved=!1}var m=null==(i=this.hls)?void 0:i.latestLevelDetails;if(!this.moved&&null!==this.stalled&&h){if(!(d.len>0||f))return;var p=Math.max(f,d.start||0)-e,y=null!=m&&m.live?2*m.targetduration:2,E=qi(e,h);if(p>0&&(p<=y||E))return void(n.paused||this._trySkipBufferHole(E))}var T=a.detectStallWithCurrentTimeMs,S=self.performance.now(),L=this.waiting,R=this.stalled;if(null===R){if(!(L>0&&S-L<T))return void(this.stalled=S);R=this.stalled=L}var A=S-R;if(!s&&(A>=T||L&&this.moved)&&this.hls){var b;if("ended"===(null==(b=this.mediaSource)?void 0:b.readyState)&&(null==m||!m.live)&&Math.abs(e-((null==m?void 0:m.edge)||0))<1){if(this.ended)return;return this.ended=e||1,void this.hls.trigger(O.MEDIA_ENDED,{stalled:!0})}if(this._reportStall(d),!this.media||!this.hls)return;if(n.currentTime!==e){var k=e;return e=n.currentTime,this.moved=!0,void this.log("currentTime changed "+k+" > "+e)}}var D=dr.bufferInfo(n,e,a.maxBufferHole);this._tryFixBufferStall(D,A,e)}else this.skipRetry=this.nudgeRetry=0}}}},r.stallResolved=function(e){var t=this.stalled;if(t&&this.hls&&(this.stalled=null,this.stallReported)){var r=self.performance.now()-t;this.log("playback not stuck anymore @"+e+", after "+Math.round(r)+"ms"),this.stallReported=!1,this.waiting=0,this.hls.trigger(O.STALL_RESOLVED,{})}},r.nudgeOnVideoHole=function(e,t){var r,i=this.buffered.video;if(this.hls&&this.media&&this.fragmentTracker&&null!=(r=this.buffered.audio)&&r.length&&i&&i.length>1&&e>i.end(0)){var a=dr.bufferedInfo(dr.timeRangesToArray(this.buffered.audio),e,0);if(a.len>1&&t>=a.start){var n=dr.timeRangesToArray(i),s=dr.bufferedInfo(n,t,0).bufferedIndex;if(s>-1&&s<n.length-1){var o=dr.bufferedInfo(n,e,0).bufferedIndex,l=n[s].end,u=n[s+1].start;if((-1===o||o>s)&&u-l<1&&e-l<2){var d=new Error("nudging playhead to flush pipeline after video hole. currentTime: "+e+" hole: "+l+" -> "+u+" buffered index: "+o);this.warn(d.message),this.media.currentTime+=1e-6;var h=qi(e,this.fragmentTracker);h&&"fragment"in h?h=h.fragment:h||(h=void 0);var f=dr.bufferInfo(this.media,e,0);this.hls.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.BUFFER_SEEK_OVER_HOLE,fatal:!1,error:d,reason:d.message,frag:h,buffer:f.len,bufferInfo:f})}}}}},r._tryFixBufferStall=function(e,t,r){var i,a,n=this.fragmentTracker,s=this.media,o=null==(i=this.hls)?void 0:i.config;if(s&&n&&o){var l=null==(a=this.hls)?void 0:a.latestLevelDetails,u=qi(r,n);if((u||null!=l&&l.live&&r<l.fragmentStart)&&(this._trySkipBufferHole(u)||!this.media))return;var d=e.buffered,h=this.adjacentTraversal(e,r);(d&&d.length>1&&e.len>o.maxBufferHole||e.nextStart&&(e.nextStart-r<o.maxBufferHole||h))&&(t>1e3*o.highBufferWatchdogPeriod||this.waiting)&&(this.warn("Trying to nudge playhead over buffer-hole"),this._tryNudgeBuffer(e))}},r.adjacentTraversal=function(e,t){var r=this.fragmentTracker,i=e.nextStart;if(r&&i){var a=r.getFragAtPos(t,N.MAIN),n=r.getFragAtPos(i,N.MAIN);if(a&&n)return n.sn-a.sn<2}return!1},r._reportStall=function(e){var t=this.hls,r=this.media,i=this.stallReported,a=this.stalled;if(!i&&null!==a&&r&&t){this.stallReported=!0;var n=new Error("Playback stalling at @"+r.currentTime+" due to low buffer ("+Bt(e)+")");this.warn(n.message),t.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.BUFFER_STALLED_ERROR,fatal:!1,error:n,buffer:e.len,bufferInfo:e,stalled:{start:a}})}},r._trySkipBufferHole=function(e){var t=this.fragmentTracker,r=this.media,i=this.hls,a=null==i?void 0:i.config;if(!r||!t||!a)return 0;var n=r.currentTime,s=dr.bufferInfo(r,n,0);Xi(0,n,t,i);var o=n<s.start?s.start:s.nextStart;if(o){var l=s.len<=a.maxBufferHole,u=s.len>0&&s.len<1&&r.readyState<3,d=o-n;if(d>0&&(l||u)){if(d>a.maxBufferHole){var h=!1;if(0===n){var f=t.getAppendedFrag(0,N.MAIN);f&&o<f.end&&(h=!0)}if(!h&&e){var c;if(null==(c=i.loadLevelObj)||!c.details)return 0;if(Wi(i.inFlightFragments,o))return 0;for(var g=!1,v=e.end;v<o;){var m=qi(v,t),p=m?m.duration:0;if(!(p>0)){g=!0;break}v+=p}if(g)return 0}}var y=a.nudgeMaxRetry,E=a.skipBufferHolePadding,T=++this.skipRetry>y,S=Math.max(o,n)+E;if(T||(this.warn("skipping hole, adjusting currentTime from "+n+" to "+S),this.moved=!0,r.currentTime=S),null==e||!e.gap||T){var L=new Error(T?"Playhead still not moving after seeking over buffer hole from "+n+" to "+S+" after "+a.nudgeMaxRetry+" attempts.":"fragment loaded with buffer holes, seeking from "+n+" to "+S),R={type:x.MEDIA_ERROR,details:w.BUFFER_SEEK_OVER_HOLE,fatal:T,error:L,reason:L.message,buffer:s.len,bufferInfo:s};e&&("fragment"in e?R.part=e:R.frag=e),i.trigger(O.ERROR,R)}return S}}return 0},r._tryNudgeBuffer=function(e){var t=this.hls,r=this.media,i=this.nudgeRetry,a=null==t?void 0:t.config;if(!r||!a)return 0;var n=r.currentTime;if(this.nudgeRetry++,i<a.nudgeMaxRetry){var s=n+(i+1)*a.nudgeOffset,o=new Error("Nudging 'currentTime' from "+n+" to "+s);this.warn(o.message),r.currentTime=s,t.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.BUFFER_NUDGE_ON_STALL,error:o,fatal:!1,buffer:e.len,bufferInfo:e})}else{var l=new Error("Playhead still not moving while enough data buffered @"+n+" after "+a.nudgeMaxRetry+" nudges");this.error(l.message),t.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.BUFFER_STALLED_ERROR,error:l,fatal:!0,buffer:e.len,bufferInfo:e})}},a(t,[{key:"hasBuffered",get:function(){return Object.keys(this.buffered).length>0}}])}(Fi);function Wi(e,t){var r=ji(e.main);if(r&&r.start<=t)return r;var i=ji(e.audio);return i&&i.start<=t?i:null}function ji(e){if(!e)return null;switch(e.state){case Hi.IDLE:case Hi.STOPPED:case Hi.ENDED:case Hi.ERROR:return null}return e.frag}function qi(e,t){return t.getAppendedFrag(e,N.MAIN)||t.getPartialFragment(e)}function Xi(e,t,r,i){i.latestLevelDetails,qi(t,r),i.config}var zi=function(e){return e.audioId3="org.id3",e.dateRange="com.apple.quicktime.HLS",e.emsg="https://aomedia.org/emsg/ID3",e.misbklv="urn:misb:KLV:bin:1910.1",e}({});function Qi(e,t,r,i){var a=e.mode;if("disabled"===a&&(e.mode="hidden"),e.cues&&e.cues.length>0)for(var n=function(e,t,r){var i=[],a=function(e,t){if(t<=e[0].startTime)return 0;var r=e.length-1;if(t>e[r].endTime)return-1;for(var i,a=0,n=r;a<=n;)if(t<e[i=Math.floor((n+a)/2)].startTime)n=i-1;else{if(!(t>e[i].startTime&&a<r))return i;a=i+1}return e[a].startTime-t<t-e[n].startTime?a:n}(e,t);if(a>-1)for(var n=a,s=e.length;n<s;n++){var o=e[n];if(o.startTime>=t&&o.endTime<=r)i.push(o);else if(o.startTime>r)return i}return i}(e.cues,t,r),s=0;s<n.length;s++)i&&!i(n[s])||e.removeCue(n[s]);"disabled"===a&&(e.mode=a)}function $i(){if("undefined"!=typeof self)return self.VTTCue||self.TextTrackCue}function Zi(e,t,r,i,a){var n=new e(t,r,"");try{n.value=i,a&&(n.type=a)}catch(s){n=new e(t,r,Bt(a?f({type:a},i):i))}return n}var Ji=function(){var e=$i();try{e&&new e(0,Number.POSITIVE_INFINITY,"")}catch(e){return Number.MAX_VALUE}return Number.POSITIVE_INFINITY}(),ea=function(){function e(e){var t=this;this.hls=void 0,this.id3Track=null,this.media=null,this.dateRangeCuesAppended={},this.removeCues=!0,this.assetCue=void 0,this.onEventCueEnter=function(){t.hls&&t.hls.trigger(O.EVENT_CUE_ENTER,{})},this.hls=e,this._registerListeners()}var t=e.prototype;return t.destroy=function(){this._unregisterListeners(),this.id3Track=null,this.media=null,this.dateRangeCuesAppended={},this.hls=this.onEventCueEnter=null},t._registerListeners=function(){var e=this.hls;e&&(e.on(O.MEDIA_ATTACHING,this.onMediaAttaching,this),e.on(O.MEDIA_ATTACHED,this.onMediaAttached,this),e.on(O.MEDIA_DETACHING,this.onMediaDetaching,this),e.on(O.MANIFEST_LOADING,this.onManifestLoading,this),e.on(O.FRAG_PARSING_METADATA,this.onFragParsingMetadata,this),e.on(O.BUFFER_FLUSHING,this.onBufferFlushing,this),e.on(O.LEVEL_UPDATED,this.onLevelUpdated,this),e.on(O.LEVEL_PTS_UPDATED,this.onLevelPtsUpdated,this))},t._unregisterListeners=function(){var e=this.hls;e&&(e.off(O.MEDIA_ATTACHING,this.onMediaAttaching,this),e.off(O.MEDIA_ATTACHED,this.onMediaAttached,this),e.off(O.MEDIA_DETACHING,this.onMediaDetaching,this),e.off(O.MANIFEST_LOADING,this.onManifestLoading,this),e.off(O.FRAG_PARSING_METADATA,this.onFragParsingMetadata,this),e.off(O.BUFFER_FLUSHING,this.onBufferFlushing,this),e.off(O.LEVEL_UPDATED,this.onLevelUpdated,this),e.off(O.LEVEL_PTS_UPDATED,this.onLevelPtsUpdated,this))},t.onMediaAttaching=function(e,t){this.media=t.media},t.onMediaAttached=function(){var e,t=null==(e=this.hls)?void 0:e.latestLevelDetails;t&&this.updateDateRangeCues(t)},t.onMediaDetaching=function(e,t){this.media=null,t.transferMedia||(this.id3Track&&(this.id3Track.remove(),this.id3Track=null),this.dateRangeCuesAppended={})},t.onManifestLoading=function(){this.dateRangeCuesAppended={}},t.createTrack=function(e){return r="metadata",i="id3",a="hidden",(n=(t=e).ownerDocument.createElement("track")).kind=r,n.label=i,n.src="data:,WEBVTT",n.track.mode=a,t.appendChild(n),n;var t,r,i,a,n},t.onFragParsingMetadata=function(e,t){if(this.media&&this.hls){var r=this.hls.config,i=r.enableEmsgMetadataCues,a=r.enableID3MetadataCues;if(i||a){var n=t.samples;this.id3Track||(this.id3Track=this.createTrack(this.media));var s=$i();if(s)for(var o=0;o<n.length;o++){var l=n[o].type;if((l!==zi.emsg||i)&&a){var u=Ie(n[o].data),d=n[o].pts,h=d+n[o].duration;h>Ji&&(h=Ji),h-d<=0&&(h=d+.25);for(var f=0;f<u.length;f++){var c=u[f];if(!_e(c)){this.updateId3CueEnds(d,l);var g=Zi(s,d,h,c,l);g&&this.id3Track.track.addCue(g)}}}}}}},t.updateId3CueEnds=function(e,t){var r,i=null==(r=this.id3Track)?void 0:r.track.cues;if(i)for(var a=i.length;a--;){var n=i[a];n.type===t&&n.startTime<e&&n.endTime===Ji&&(n.endTime=e)}},t.onBufferFlushing=function(e,t){var r=t.startOffset,i=t.endOffset,a=t.type,n=this.id3Track,s=this.hls;if(s){var o,l=s.config,u=l.enableEmsgMetadataCues,d=l.enableID3MetadataCues;n&&(u||d)&&(o="audio"===a?function(e){return e.type===zi.audioId3&&d}:"video"===a?function(e){return e.type===zi.emsg&&u}:function(e){return e.type===zi.audioId3&&d||e.type===zi.emsg&&u},Qi(n.track,r,i,o))}},t.onLevelUpdated=function(e,t){var r=t.details;this.updateDateRangeCues(r,!0)},t.onLevelPtsUpdated=function(e,t){Math.abs(t.drift)>.01&&this.updateDateRangeCues(t.details)},t.updateDateRangeCues=function(e,t){var r=this;if(this.hls&&this.media){var i=this.hls.config;i.assetPlayerId,i.timelineOffset;var a=i.enableDateRangeMetadataCues;if(i.interstitialsController,a){var n=$i();if(e.hasProgramDateTime){var s,o=this.id3Track,l=e.dateRanges,u=Object.keys(l),d=this.dateRangeCuesAppended;if(o&&t)if(null!=(s=o.track.cues)&&s.length)for(var h=Object.keys(d).filter((function(e){return-1===u.indexOf(e)})),f=function(){var e,t=h[c],i=null==(e=d[t])?void 0:e.cues;delete d[t],i&&Object.keys(i).forEach((function(e){var t=i[e];if(t){t.removeEventListener("enter",r.onEventCueEnter);try{o.track.removeCue(t)}catch(e){}}}))},c=h.length;c--;)f();else d=this.dateRangeCuesAppended={};var g=e.fragments[e.fragments.length-1];if(0!==u.length&&_(null==g?void 0:g.programDateTime)){this.id3Track||(this.id3Track=this.createTrack(this.media));for(var v=function(){var e=u[m],t=l[e],i=t.startTime,a=d[e],s=(null==a?void 0:a.cues)||{},o=(null==a?void 0:a.durationKnown)||!1,h=Ji,f=t.duration;if(t.endDate&&null!==f)h=i+f,o=!0;else if(t.endOnNext&&!o){var c=u.reduce((function(e,r){if(r!==t.id){var i=l[r];if(i.class===t.class&&i.startDate>t.startDate&&(!e||t.startDate<e.startDate))return i}return e}),null);c&&(h=c.startTime,o=!0)}for(var g,v=Object.keys(t.attr),p=0;p<v.length;p++){var y=v[p];if("ID"!==(g=y)&&"CLASS"!==g&&"CUE"!==g&&"START-DATE"!==g&&"DURATION"!==g&&"END-DATE"!==g&&"END-ON-NEXT"!==g){var E=s[y];if(E)!o||null!=a&&a.durationKnown?Math.abs(E.startTime-i)>.01&&(E.startTime=i,E.endTime=h):E.endTime=h;else if(n){var T=t.attr[y];Ir(y)&&(T=we(T));var S=Zi(n,i,h,{key:y,data:T},zi.dateRange);S&&(S.id=e,r.id3Track.track.addCue(S),s[y]=S)}}}d[e]={cues:s,dateRange:t,durationKnown:o}},m=0;m<u.length;m++)v()}}}}},e}(),ta=function(){function e(e){var t=this;this.hls=void 0,this.media=null,this.currentTime=0,this.stallCount=0,this._latency=null,this._targetLatencyUpdated=!1,this.onTimeupdate=function(){var e=t.media,r=t.levelDetails;if(e&&r&&t.hls){t.currentTime=e.currentTime;var i=t.hls.config,a=t.computeLatency();if(null!==a){t._latency=a;var n=i.lowLatencyMode,s=i.maxLiveSyncPlaybackRate;if(n&&1!==s&&r.live){var o=t.targetLatency;if(null!==o){var l=a-o;if(l<Math.min(t.maxLatency,o+r.targetduration)&&l>.05&&t.forwardBufferLength>1){var u=Math.min(2,Math.max(1,s)),d=Math.round(2/(1+Math.exp(-.75*l-t.edgeStalled))*20)/20,h=Math.min(u,Math.max(1,d));t.changeMediaPlaybackRate(e,h)}else 1!==e.playbackRate&&0!==e.playbackRate&&t.changeMediaPlaybackRate(e,1)}}}}},this.hls=e,this.registerListeners()}var t=e.prototype;return t.destroy=function(){this.unregisterListeners(),this.onMediaDetaching(),this.hls=null},t.registerListeners=function(){var e=this.hls;e&&(e.on(O.MEDIA_ATTACHED,this.onMediaAttached,this),e.on(O.MEDIA_DETACHING,this.onMediaDetaching,this),e.on(O.MANIFEST_LOADING,this.onManifestLoading,this),e.on(O.LEVEL_UPDATED,this.onLevelUpdated,this),e.on(O.ERROR,this.onError,this),e.on(O.INTERSTITIAL_ASSET_STARTED,this.onAssetStarted,this))},t.unregisterListeners=function(){var e=this.hls;e&&(e.off(O.MEDIA_ATTACHED,this.onMediaAttached,this),e.off(O.MEDIA_DETACHING,this.onMediaDetaching,this),e.off(O.MANIFEST_LOADING,this.onManifestLoading,this),e.off(O.LEVEL_UPDATED,this.onLevelUpdated,this),e.off(O.ERROR,this.onError,this),e.off(O.INTERSTITIAL_ASSET_STARTED,this.onAssetStarted,this))},t.onMediaAttached=function(e,t){this.media=t.media,this.media.addEventListener("timeupdate",this.onTimeupdate)},t.onMediaDetaching=function(){this.media&&(this.media.removeEventListener("timeupdate",this.onTimeupdate),this.media=null)},t.onManifestLoading=function(){this._latency=null,this.stallCount=0},t.onLevelUpdated=function(e,t){var r=t.details;r.advanced&&this.onTimeupdate(),!r.live&&this.media&&this.media.removeEventListener("timeupdate",this.onTimeupdate)},t.onAssetStarted=function(e,t){var r,i=this.hls,a=this.media||t.event.appendInPlace&&(null==i||null==(r=i.interstitialsManager)?void 0:r.playerQueue.reduce((function(e,t){return e||t.media}),null));i&&a&&a.playbackRate>1&&a.playbackRate<=i.config.maxLiveSyncPlaybackRate&&this.changeMediaPlaybackRate(a,1)},t.onError=function(e,t){var r;t.details===w.BUFFER_STALLED_ERROR&&(this.stallCount++,this.hls&&null!=(r=this.levelDetails)&&r.live&&this.hls.logger.warn("[latency-controller]: Stall detected, adjusting target latency"))},t.changeMediaPlaybackRate=function(e,t){var r,i;e.playbackRate!==t&&(null==(r=this.hls)||r.logger.debug("[latency-controller]: latency="+this.latency.toFixed(3)+", targetLatency="+(null==(i=this.targetLatency)?void 0:i.toFixed(3))+", forwardBufferLength="+this.forwardBufferLength.toFixed(3)+": adjusting playback rate from "+e.playbackRate+" to "+t),e.playbackRate=t)},t.estimateLiveEdge=function(){var e=this.levelDetails;return null===e?null:e.edge+e.age},t.computeLatency=function(){var e=this.estimateLiveEdge();return null===e?null:e-this.currentTime},a(e,[{key:"levelDetails",get:function(){var e;return(null==(e=this.hls)?void 0:e.latestLevelDetails)||null}},{key:"latency",get:function(){return this._latency||0}},{key:"maxLatency",get:function(){var e,t=null==(e=this.hls)?void 0:e.config;if(!t)return 0;if(void 0!==t.liveMaxLatencyDuration)return t.liveMaxLatencyDuration;var r=this.levelDetails;return r?t.liveMaxLatencyDurationCount*r.targetduration:0}},{key:"targetLatency",get:function(){var e=this.levelDetails;if(null===e||!this.hls)return null;var t=this.hls.config,r=e.holdBack,i=e.partHoldBack,a=e.targetduration,n=t.liveSyncDuration,s=t.liveSyncDurationCount,o=t.lowLatencyMode,l=this.hls.userConfig,u=o&&i||r;(this._targetLatencyUpdated||l.liveSyncDuration||l.liveSyncDurationCount||0===u)&&(u=void 0!==n?n:s*a);var d=a;return u+Math.min(this.stallCount*t.liveSyncOnStallIncrease,d)},set:function(e){this.hls&&(this.stallCount=0,this.hls.config.liveSyncDuration=e,this._targetLatencyUpdated=!0)}},{key:"liveSyncPosition",get:function(){var e=this.estimateLiveEdge(),t=this.targetLatency;if(null===e||null===t||!this.hls)return null;var r=this.levelDetails;if(null===r)return null;var i=r.edge,a=e-t-this.edgeStalled,n=i-r.totalduration,s=i-(this.hls.config.lowLatencyMode&&r.partTarget||r.targetduration);return Math.min(Math.max(n,a),s)}},{key:"drift",get:function(){var e=this.levelDetails;return null===e?1:e.drift}},{key:"edgeStalled",get:function(){var e=this.levelDetails;if(null===e||!this.hls)return 0;var t=3*(this.hls.config.lowLatencyMode&&e.partTarget||e.targetduration);return Math.max(e.age-t,0)}},{key:"forwardBufferLength",get:function(){var e=this.media,t=this.levelDetails;if(!e||!t)return 0;var r=e.buffered.length;return(r?e.buffered.end(r-1):t.edge)-this.currentTime}}])}();function ra(e,t){return 255===e[t]&&240==(246&e[t+1])}function ia(e,t){return 1&e[t+1]?7:9}function aa(e,t){return(3&e[t+3])<<11|e[t+4]<<3|(224&e[t+5])>>>5}function na(e,t){return t+1<e.length&&ra(e,t)}function sa(e,t){if(na(e,t)){var r=ia(e,t);if(t+r>=e.length)return!1;var i=aa(e,t);if(i<=r)return!1;var a=t+i;return a===e.length||na(e,a)}return!1}function oa(e,t,r,i,a){if(!e.samplerate){var n=function(e,t,r,i){var a=t[r+2],n=a>>2&15;if(!(n>12)){var s,o=1+(a>>6&3),l=t[r+3]>>6&3|(1&a)<<2,u=[96e3,88200,64e3,48e3,44100,32e3,24e3,22050,16e3,12e3,11025,8e3,7350][n],d=n;5!==o&&29!==o||(d-=3);var h=(14&d)>>1,f=(1&d)<<7|l<<3,c=0;if(1===o&&n>=6){var g=n-3;s=[(c=5)<<3|h,f|(14&g)>>1,(1&g)<<7|8,0]}else s=[o<<3|h,f];var v="mp4a.40."+(c||o);return fe.log("manifest codec:"+i+", parsed codec:"+v+", channels:"+l+", rate:"+u+" (ADTS object type:"+o+" sampling index:"+n+" esds config:["+s.join(",")+"])"),{config:s,samplerate:u,channelCount:l,codec:v,parsedCodec:v,manifestCodec:i}}var m=new Error("invalid ADTS sampling index:"+n);e.emit(O.ERROR,O.ERROR,{type:x.MEDIA_ERROR,details:w.FRAG_PARSING_ERROR,fatal:!0,error:m,reason:m.message})}(t,r,i,a);if(!n)return;o(e,n)}}function la(e){return 9216e4/e}function ua(e,t,r,i,a){var n,s=i+a*la(e.samplerate),o=function(e,t){var r=ia(e,t);if(t+r<=e.length){var i=aa(e,t)-r;if(i>0)return{headerLength:r,frameLength:i}}}(t,r);if(o){var l=o.frameLength,u=o.headerLength,d=u+l,h=Math.max(0,r+d-t.length);h?(n=new Uint8Array(d-u)).set(t.subarray(r+u,t.length),0):n=t.subarray(r+u,r+d);var f={unit:n,pts:s};return h||e.samples.push(f),{sample:f,length:d,missing:h}}var c=t.length-r;return(n=new Uint8Array(c)).set(t.subarray(r,t.length),0),{sample:{unit:n,pts:s},length:c,missing:-1}}function da(e,t){return void 0===e&&(e=""),void 0===t&&(t=9e4),{type:e,id:-1,pid:-1,inputTimeScale:t,sequenceNumber:-1,samples:[],dropped:0}}var ha=function(){function e(){this._audioTrack=void 0,this._id3Track=void 0,this.frameIndex=0,this.cachedData=null,this.basePTS=null,this.initPTS=null,this.lastPTS=null}var t=e.prototype;return t.resetInitSegment=function(e,t,r,i){this._id3Track={type:"id3",id:3,pid:-1,inputTimeScale:9e4,sequenceNumber:0,samples:[],dropped:0}},t.resetTimeStamp=function(e){this.initPTS=e,this.resetContiguity()},t.resetContiguity=function(){this.basePTS=null,this.lastPTS=null,this.frameIndex=0},t.canParse=function(e,t){return!1},t.appendFrame=function(e,t,r){},t.demux=function(e,t){this.cachedData&&(e=it(this.cachedData,e),this.cachedData=null);var r,i=Te(e,0),a=i?i.length:0,n=this._audioTrack,s=this._id3Track,o=i?Pe(i):void 0,l=e.length;for((null===this.basePTS||0===this.frameIndex&&_(o))&&(this.basePTS=fa(o,t,this.initPTS),this.lastPTS=this.basePTS),null===this.lastPTS&&(this.lastPTS=this.basePTS),i&&i.length>0&&s.samples.push({pts:this.lastPTS,dts:this.lastPTS,data:i,type:zi.audioId3,duration:Number.POSITIVE_INFINITY});a<l;){if(this.canParse(e,a)){var u=this.appendFrame(n,e,a);u?(this.frameIndex++,this.lastPTS=u.sample.pts,r=a+=u.length):a=l}else ye(e,a)?(i=Te(e,a),s.samples.push({pts:this.lastPTS,dts:this.lastPTS,data:i,type:zi.audioId3,duration:Number.POSITIVE_INFINITY}),r=a+=i.length):a++;if(a===l&&r!==l){var d=e.slice(r);this.cachedData?this.cachedData=it(this.cachedData,d):this.cachedData=d}}return{audioTrack:n,videoTrack:da(),id3Track:s,textTrack:da()}},t.demuxSampleAes=function(e,t,r){return Promise.reject(new Error("["+this+"] This demuxer does not support Sample-AES decryption"))},t.flush=function(e){var t=this.cachedData;return t&&(this.cachedData=null,this.demux(t,0)),{audioTrack:this._audioTrack,videoTrack:da(),id3Track:this._id3Track,textTrack:da()}},t.destroy=function(){this.cachedData=null,this._audioTrack=this._id3Track=void 0},e}(),fa=function(e,t,r){return _(e)?90*e:9e4*t+(r?9e4*r.baseTime/r.timescale:0)},ca=[32,64,96,128,160,192,224,256,288,320,352,384,416,448,32,48,56,64,80,96,112,128,160,192,224,256,320,384,32,40,48,56,64,80,96,112,128,160,192,224,256,320,32,48,56,64,80,96,112,128,144,160,176,192,224,256,8,16,24,32,40,48,56,64,80,96,112,128,144,160],ga=[44100,48e3,32e3,22050,24e3,16e3,11025,12e3,8e3],va=[[0,72,144,12],[0,0,0,0],[0,72,144,12],[0,144,144,12]],ma=[0,1,1,4];function pa(e,t,r,i,a){if(!(r+24>t.length)){var n=ya(t,r);if(n&&r+n.frameLength<=t.length){var s=i+a*(9e4*n.samplesPerFrame/n.sampleRate),o={unit:t.subarray(r,r+n.frameLength),pts:s,dts:s};return e.config=[],e.channelCount=n.channelCount,e.samplerate=n.sampleRate,e.samples.push(o),{sample:o,length:n.frameLength,missing:0}}}}function ya(e,t){var r=e[t+1]>>3&3,i=e[t+1]>>1&3,a=e[t+2]>>4&15,n=e[t+2]>>2&3;if(1!==r&&0!==a&&15!==a&&3!==n){var s=e[t+2]>>1&1,o=e[t+3]>>6,l=1e3*ca[14*(3===r?3-i:3===i?3:4)+a-1],u=ga[3*(3===r?0:2===r?1:2)+n],d=3===o?1:2,h=va[r][i],f=ma[i],c=8*h*f,g=Math.floor(h*l/u+s)*f,v=ct();return!!v&&v<=87&&2===i&&l>=224e3&&0===o&&(e[t+3]=128|e[t+3]),{sampleRate:u,channelCount:d,frameLength:g,samplesPerFrame:c}}}function Ea(e,t){return 255===e[t]&&224==(224&e[t+1])&&0!=(6&e[t+1])}function Ta(e,t){return t+1<e.length&&Ea(e,t)}function Sa(e,t){if(t+1<e.length&&Ea(e,t)){var r=ya(e,t),i=4;null!=r&&r.frameLength&&(i=r.frameLength);var a=t+i;return a===e.length||Ta(e,a)}return!1}var La=function(){function e(e,t,r){this.keyData=void 0,this.decrypter=void 0,this.keyData=r,this.decrypter=new _i(t,!0)}var t=e.prototype;return t.decryptBuffer=function(e){return this.decrypter.decrypt(e,this.keyData.key.buffer,this.keyData.iv.buffer,xr,{start:0,end:e.byteLength})},t.decryptAacSample=function(e,t,r){var i=this,a=e[t].unit;if(!(a.length<=16)){var n=a.subarray(16,a.length-a.length%16),s=n.buffer.slice(n.byteOffset,n.byteOffset+n.length);this.decryptBuffer(s).then((function(n){var s=new Uint8Array(n);a.set(s,16),i.decrypter.isSync()||i.decryptAacSamples(e,t+1,r)})).catch(r)}},t.decryptAacSamples=function(e,t,r){for(;;t++){if(t>=e.length)return void r();if(!(e[t].unit.length<32||(this.decryptAacSample(e,t,r),this.decrypter.isSync())))return}},t.getAvcEncryptedData=function(e){for(var t=16*Math.floor((e.length-48)/160)+16,r=new Int8Array(t),i=0,a=32;a<e.length-16;a+=160,i+=16)r.set(e.subarray(a,a+16),i);return r},t.getAvcDecryptedUnit=function(e,t){for(var r=new Uint8Array(t),i=0,a=32;a<e.length-16;a+=160,i+=16)e.set(r.subarray(i,i+16),a);return e},t.decryptAvcSample=function(e,t,r,i,a){var n=this,s=ot(a.data),o=this.getAvcEncryptedData(s);this.decryptBuffer(o.buffer).then((function(o){a.data=n.getAvcDecryptedUnit(s,o),n.decrypter.isSync()||n.decryptAvcSamples(e,t,r+1,i)})).catch(i)},t.decryptAvcSamples=function(e,t,r,i){if(e instanceof Uint8Array)throw new Error("Cannot decrypt samples of type Uint8Array");for(;;t++,r=0){if(t>=e.length)return void i();for(var a=e[t].units;!(r>=a.length);r++){var n=a[r];if(!(n.data.length<=48||1!==n.type&&5!==n.type||(this.decryptAvcSample(e,t,r,i,n),this.decrypter.isSync())))return}}},e}(),Ra=function(e){function t(t,r){var i;return(i=e.call(this)||this).observer=void 0,i.config=void 0,i.sampleAes=null,i.observer=t,i.config=r,i}u(t,e);var r=t.prototype;return r.resetInitSegment=function(t,r,i,a){e.prototype.resetInitSegment.call(this,t,r,i,a),this._audioTrack={container:"audio/adts",type:"audio",id:2,pid:-1,sequenceNumber:0,segmentCodec:"aac",samples:[],manifestCodec:r,duration:a,inputTimeScale:9e4,dropped:0}},t.probe=function(e,t){if(!e)return!1;var r=Te(e,0),i=(null==r?void 0:r.length)||0;if(Sa(e,i))return!1;for(var a=e.length;i<a;i++)if(sa(e,i))return t.log("ADTS sync word found !"),!0;return!1},r.canParse=function(e,t){return function(e,t){return function(e,t){return t+5<e.length}(e,t)&&ra(e,t)&&aa(e,t)<=e.length-t}(e,t)},r.appendFrame=function(e,t,r){oa(e,this.observer,t,r,e.manifestCodec);var i=ua(e,t,r,this.basePTS,this.frameIndex);if(0===(null==i?void 0:i.missing))return i},r.demuxSampleAes=function(e,t,r){var i=this.demux(e,r),a=this.sampleAes=new La(this.observer,this.config,t);return new Promise((function(e){a.decryptAacSamples(i.audioTrack.samples,0,(function(){e(i)}))}))},t}(ha),Aa=function(e){function t(){return e.apply(this,arguments)||this}u(t,e);var r=t.prototype;return r.resetInitSegment=function(t,r,i,a){e.prototype.resetInitSegment.call(this,t,r,i,a),this._audioTrack={container:"audio/mpeg",type:"audio",id:2,pid:-1,sequenceNumber:0,segmentCodec:"mp3",samples:[],manifestCodec:r,duration:a,inputTimeScale:9e4,dropped:0}},t.probe=function(e){if(!e)return!1;var t=Te(e,0),r=(null==t?void 0:t.length)||0;if(t&&11===e[r]&&119===e[r+1]&&void 0!==Pe(t)&&function(e,t){var r=0,i=5;t+=i;for(var a=new Uint32Array(1),n=new Uint32Array(1),s=new Uint8Array(1);i>0;){s[0]=e[t];var o=Math.min(i,8),l=8-o;n[0]=4278190080>>>24+l<<l,a[0]=(s[0]&n[0])>>l,r=r?r<<o|a[0]:a[0],t+=1,i-=o}return r}(e,r)<=16)return!1;for(var i=e.length;r<i;r++)if(Sa(e,r))return fe.log("MPEG Audio sync word found !"),!0;return!1},r.canParse=function(e,t){return function(e,t){return Ea(e,t)&&4<=e.length-t}(e,t)},r.appendFrame=function(e,t,r){if(null!==this.basePTS)return pa(e,t,r,this.basePTS,this.frameIndex)},t}(ha),ba=/\/emsg[-/]ID3/i,ka=function(){function e(e,t,r,i){void 0===i&&(i=fe),this.remainderData=null,this.timeOffset=0,this.config=void 0,this.videoTrack=void 0,this.audioTrack=void 0,this.id3Track=void 0,this.txtTrack=void 0,this.initData=void 0,this.logger=void 0,this.config=t,this.logger=i}var t=e.prototype;return t.resetTimeStamp=function(){},t.resetInitSegment=function(e,t,r,i){var a=this.videoTrack=da("video",1),n=this.audioTrack=da("audio",1),s=this.txtTrack=da("text",1);if(this.id3Track=da("id3",1),this.initData=void 0,this.timeOffset=0,null!=e&&e.byteLength){var o=this.initData=Xe(e);if(o.video){var l=o.video,u=l.id,d=l.timescale,h=l.codec,f=l.supplemental;a.id=u,a.timescale=s.timescale=d,a.codec=h,a.supplemental=f}if(o.audio){var c=o.audio,g=c.id,v=c.timescale,m=c.codec;n.id=g,n.timescale=v,n.codec=m}s.id=Be.text,a.sampleDuration=0,a.duration=n.duration=i}},t.resetContiguity=function(){this.remainderData=null},e.probe=function(e){return function(e,t){for(var r=e.byteLength,i=0;i<r;){var a=Ge(e,i);if(a>8&&Ge(e,i+4)===Ne[t])return!0;i=a>1?i+a:r}return!1}(e,"moof")},t.demux=function(e,t,r){this.timeOffset=t;var i=e,a=this.videoTrack,n=this.txtTrack;if(this.config.progressive){this.remainderData&&(i=it(this.remainderData,e));var s=function(e){var t={valid:null,remainder:null},r=We(e,["moof"]);if(r.length<2)return t.remainder=e,t;var i=r[r.length-1];return t.valid=e.slice(0,i.byteOffset-8),t.remainder=e.slice(i.byteOffset-8),t}(i);this.remainderData=s.remainder,a.samples=s.valid||new Uint8Array}else a.samples=i;var o=this.extractID3Track(a,t),l=this.parseFragment(a,n,t,r);return{videoTrack:a,audioTrack:this.audioTrack,id3Track:o,textTrack:this.txtTrack,initData:this.initData,sampleData:l}},t.flush=function(e,t){var r=this.timeOffset,i=this.videoTrack,a=this.txtTrack;i.samples=this.remainderData||new Uint8Array,this.remainderData=null;var n=this.extractID3Track(i,this.timeOffset),s=this.parseFragment(i,a,r,t);return{videoTrack:i,audioTrack:da(),id3Track:n,textTrack:da(),initData:this.initData,sampleData:s}},t.parseFragment=function(e,t,r,i){var a=this.initData;if(a&&i){var n=function(e,t,r,i,a){var n=[];return{samples:n,sampleData:{includeSampleDetails:a,tracks:rt(t.samples,r,i,0,{isHEVCFlavor:at(t.codec),samples:n,timeOffset:e,timescale:t.timescale,trackId:t.id})}}}(r,e,a,this.logger,!1),s=n.samples,o=n.sampleData;return t.samples=s,o}t.samples=function(e,t){var r=[],i=t.samples,a=t.timescale,n=t.id,s=!1;return We(i,["moof"]).map((function(o){var l=o.byteOffset-8;We(o,["traf"]).map((function(o){var u=We(o,["tfdt"]).map((function(e){var t=e[0],r=Ge(e,4);return 1===t&&(r*=Math.pow(2,32),r+=Ge(e,8)),r/a}))[0];return void 0!==u&&(e=u),We(o,["tfhd"]).map((function(u){var d=Ge(u,4),h=16777215&Ge(u,0),f=0!=(1&h),c=0,g=0!=(2&h),v=0!=(8&h),m=0,p=0!=(16&h),y=0,E=0!=(32&h),T=!f&&0!=(131072&h),S=8;d===n&&(f?(c=Ge(u,S),S+=4,c*=Math.pow(2,32),c+=Ge(u,S),S+=4):T&&(c=l),g&&(S+=4),v&&(m=Ge(u,S),S+=4),p&&(y=Ge(u,S),S+=4),E&&(S+=4),"video"===t.type&&(s=at(t.codec)),We(o,["trun"]).map((function(n){var o=n[0],l=16777215&Ge(n,0),u=0!=(1&l),d=0,h=0!=(4&l),f=0!=(256&l),g=0,v=0!=(512&l),p=0,E=0!=(1024&l),T=0!=(2048&l),S=0,L=Ge(n,4),R=8;u&&(d=Ge(n,R),R+=4),h&&(R+=4);for(var A=c+d,b=0;b<L;b++){if(f?(g=Ge(n,R),R+=4):g=m,v?(p=Ge(n,R),R+=4):p=y,E&&(R+=4),T&&(S=0===o?Ge(n,R):Ke(n,R),R+=4),t.type===B.VIDEO)for(var k=0;k<p;){var D=Ge(i,A);nt(s,i[A+=4])&&st(i.subarray(A,A+D),s?2:1,e+S/a,r),A+=D,k+=D+4}e+=g/a}})))}))}))})),r}(r,e)},t.extractID3Track=function(e,t){var r=this,i=this.id3Track;if(e.samples.length){var a=We(e.samples,["emsg"]);a&&a.forEach((function(e){var a=function(e){var t,r=e[0],i="",a="",n=0,s=0,o=0,l=0,u=4;if(0===r){var d=He(e,u),h=null!==d?He(e,u+d.length):null;null!==d&&null!==h?(i=d,a=h,n=Ge(e,u+=d.length+h.length),s=Ge(e,u+=4),o=Ge(e,u+=4),l=Ge(e,u+=4),u+=4):(fe.warn("Unterminated "+(null===d?"scheme_id_uri":"value")+" in parsing emsg box: version 0 box ends inside a string, dropping all of its fields"),u=e.length)}else if(1===r){n=Ge(e,u);var f=Ge(e,u+=4),c=Ge(e,u+=4);u+=4,t=Math.pow(2,32)*f+c,C(t)||(t=Number.MAX_SAFE_INTEGER,fe.warn("Presentation time exceeds safe integer limit and wrapped to max safe integer in parsing emsg box")),o=Ge(e,u),l=Ge(e,u+=4);var g=He(e,u+=4),v=null!==g?He(e,u+g.length):null;null!==g&&(i=g,u+=g.length),null!==v?(a=v,u+=v.length):(fe.warn("Unterminated "+(null===g?"scheme_id_uri":"value")+" in parsing emsg box: version 1 box ends inside a string, dropping its "+(null===g?"strings and payload":"value and payload")),u=e.length)}return{schemeIdUri:i,value:a,timeScale:n,presentationTime:t,presentationTimeDelta:s,eventDuration:o,id:l,payload:e.subarray(u,e.byteLength)}}(e);if(ba.test(a.schemeIdUri)){var n=Da(a,t),s=4294967295===a.eventDuration?Number.POSITIVE_INFINITY:a.eventDuration/a.timeScale;s<=.001&&(s=Number.POSITIVE_INFINITY);var o=a.payload;i.samples.push({data:o,len:o.byteLength,dts:n,pts:n,type:zi.emsg,duration:s})}else if(r.config.enableEmsgKLVMetadata){var l=r.config.emsgKLVSchemaUri||zi.misbklv;if(a.schemeIdUri.startsWith(l)){var u=Da(a,t);i.samples.push({data:a.payload,len:a.payload.byteLength,dts:u,pts:u,type:zi.misbklv,duration:Number.POSITIVE_INFINITY})}}}))}return i},t.demuxSampleAes=function(e,t,r){return Promise.reject(new Error("The MP4 demuxer does not support SAMPLE-AES decryption"))},t.destroy=function(){this.config=null,this.remainderData=null,this.videoTrack=this.audioTrack=this.id3Track=this.txtTrack=void 0,this.initData=void 0},e}();function Da(e,t){return _(e.presentationTime)?e.presentationTime/e.timeScale:t+e.presentationTimeDelta/e.timeScale}var Ia=function(){function e(){this.VideoSample=null}var t=e.prototype;return t.createVideoSample=function(e,t,r){return{key:e,frame:!1,pts:t,dts:r,units:[],length:0}},t.getLastNalUnit=function(e){var t,r,i=this.VideoSample;if(i&&0!==i.units.length||(i=e[e.length-1]),null!=(t=i)&&t.units){var a=i.units;r=a[a.length-1]}return r},t.pushAccessUnit=function(e,t){if(e.units.length&&e.frame){if(void 0===e.pts){var r=t.samples,i=r.length;if(!i)return void t.dropped++;var a=r[i-1];e.pts=a.pts,e.dts=a.dts}t.samples.push(e)}},t.parseNALu=function(e,t,r){var i=t.byteLength;if(0===i)return[];var a=e.naluState||0,n=-1===a?0:a,s=[],o=0,l=0,u=-1,d=0;for(-1===a&&(u=0,d=this.getNALuType(t,0),l=1);l<i;){var h=t.indexOf(1,l);if(-1===h)break;l=h+1;for(var f=h;f>0&&0===t[f-1];)f--;if(!(h-f+(0===f?n:0)<2)){if(u>=0)s.push({data:t.subarray(u,f),type:d});else{var c=this.getLastNalUnit(e.samples);c&&(f>0?c.data=it(c.data,t.subarray(0,f)):n>0&&(c.data=c.data.subarray(0,c.data.byteLength-n)),c.state=0)}if(!(l<i)){o=-1,u=-1;break}u=l,d=this.getNALuType(t,l)}}if(-1!==o){for(var g=i;g>0&&0===t[g-1];)g--;o=i-g+(0===g?n:0)}if(u>=0)s.push({data:t.subarray(u),type:d,state:o});else if(0===s.length&&-1!==o){var v=this.getLastNalUnit(e.samples);v&&(v.data=it(v.data,t),v.state=o)}return e.naluState=o,s},e}(),_a=function(){function e(e){this.data=void 0,this.bytesAvailable=void 0,this.word=void 0,this.bitsAvailable=void 0,this.data=e,this.bytesAvailable=e.byteLength,this.word=0,this.bitsAvailable=0}var t=e.prototype;return t.loadWord=function(){var e=this.data,t=this.bytesAvailable,r=e.byteLength-t,i=new Uint8Array(4),a=Math.min(4,t);if(0===a)throw new Error("no bytes available");i.set(e.subarray(r,r+a)),this.word=new DataView(i.buffer).getUint32(0),this.bitsAvailable=8*a,this.bytesAvailable-=a},t.skipBits=function(e){var t;e=Math.min(e,8*this.bytesAvailable+this.bitsAvailable),this.bitsAvailable>e?(this.word<<=e,this.bitsAvailable-=e):(e-=this.bitsAvailable,e-=(t=e>>3)<<3,this.bytesAvailable-=t,this.loadWord(),this.word<<=e,this.bitsAvailable-=e)},t.readBits=function(e){var t=Math.min(this.bitsAvailable,e),r=this.word>>>32-t;if(e>32&&fe.error("Cannot read more than 32 bits at a time"),this.bitsAvailable-=t,this.bitsAvailable>0)this.word<<=t;else{if(!(this.bytesAvailable>0))throw new Error("no bits available");this.loadWord()}return(t=e-t)>0&&this.bitsAvailable?r<<t|this.readBits(t):r},t.skipLZ=function(){var e;for(e=0;e<this.bitsAvailable;++e)if(0!=(this.word&2147483648>>>e))return this.word<<=e,this.bitsAvailable-=e,e;return this.loadWord(),e+this.skipLZ()},t.skipUEG=function(){this.skipBits(1+this.skipLZ())},t.skipEG=function(){this.skipBits(1+this.skipLZ())},t.readUEG=function(){var e=this.skipLZ();return this.readBits(e+1)-1},t.readEG=function(){var e=this.readUEG();return 1&e?1+e>>>1:-1*(e>>>1)},t.readBoolean=function(){return 1===this.readBits(1)},t.readUByte=function(){return this.readBits(8)},e}(),Ca=function(e){function t(){return e.apply(this,arguments)||this}u(t,e);var r=t.prototype;return r.parsePES=function(e,t,r,i,a){var n,s=this,o=a.iframe,l=this.parseNALu(e,r.data,i),u=this.VideoSample,d=!1;r.data=null,u&&l.length&&!e.audFound&&(this.pushAccessUnit(u,e),u=this.VideoSample=this.createVideoSample(!1,r.pts,r.dts)),l.forEach((function(i){var a,l;switch(i.type){case 1:if(o)break;var h=!1;n=!0;var f,c=i.data;if(d&&c.length>4){var g=s.readSliceType(c);2!==g&&4!==g&&7!==g&&9!==g||(h=!0)}h&&null!=(f=u)&&f.frame&&!u.key&&(s.pushAccessUnit(u,e),u=s.VideoSample=null),u||(u=s.VideoSample=s.createVideoSample(!0,r.pts,r.dts)),u.frame=!0,u.key=h;break;case 5:n=!0,null!=(a=u)&&a.frame&&!u.key&&(s.pushAccessUnit(u,e),u=s.VideoSample=null),u||(u=s.VideoSample=s.createVideoSample(!0,r.pts,r.dts)),u.key=!0,u.frame=!0;break;case 6:if(o)break;n=!0,st(i.data,1,r.pts,t.samples);break;case 7:var v,m;n=!0,d=!0;var p=i.data,y=s.readSPS(p);if(!e.sps||e.width!==y.width||e.height!==y.height||(null==(v=e.pixelRatio)?void 0:v[0])!==y.pixelRatio[0]||(null==(m=e.pixelRatio)?void 0:m[1])!==y.pixelRatio[1]){e.width=y.width,e.height=y.height,e.pixelRatio=y.pixelRatio,e.sps=[p];for(var E=p.subarray(1,4),T="avc1.",S=0;S<3;S++){var L=E[S].toString(16);L.length<2&&(L="0"+L),T+=L}e.codec=T}break;case 8:n=!0,e.pps=[i.data];break;case 9:n=!0,e.audFound=!0,null!=(l=u)&&l.frame&&(s.pushAccessUnit(u,e),u=null),u||(u=s.VideoSample=s.createVideoSample(!1,r.pts,r.dts));break;case 12:n=!0;break;default:n=!1}u&&n&&u.units.push(i)})),i&&u&&(this.pushAccessUnit(u,e),this.VideoSample=null)},r.getNALuType=function(e,t){return 31&e[t]},r.readSliceType=function(e){var t=new _a(e);return t.readUByte(),t.readUEG(),t.readUEG()},r.skipScalingList=function(e,t){for(var r=8,i=8,a=0;a<e;a++)0!==i&&(i=(r+t.readEG()+256)%256),r=0===i?r:i},r.readSPS=function(e){var t,r,i,a=new _a(e),n=0,s=0,o=0,l=0,u=a.readUByte.bind(a),d=a.readBits.bind(a),h=a.readUEG.bind(a),f=a.readBoolean.bind(a),c=a.skipBits.bind(a),g=a.skipEG.bind(a),v=a.skipUEG.bind(a),m=this.skipScalingList.bind(this);u();var p=u();if(d(5),c(3),u(),v(),100===p||110===p||122===p||244===p||44===p||83===p||86===p||118===p||128===p){var y=h();if(3===y&&c(1),v(),v(),c(1),f())for(r=3!==y?8:12,i=0;i<r;i++)f()&&m(i<6?16:64,a)}v();var E=h();if(0===E)h();else if(1===E)for(c(1),g(),g(),t=h(),i=0;i<t;i++)g();v(),c(1);var T=h(),S=h(),L=d(1);0===L&&c(1),c(1),f()&&(n=h(),s=h(),o=h(),l=h());var R=[1,1];if(f()&&f())switch(u()){case 1:R=[1,1];break;case 2:R=[12,11];break;case 3:R=[10,11];break;case 4:R=[16,11];break;case 5:R=[40,33];break;case 6:R=[24,11];break;case 7:R=[20,11];break;case 8:R=[32,11];break;case 9:R=[80,33];break;case 10:R=[18,11];break;case 11:R=[15,11];break;case 12:R=[64,33];break;case 13:R=[160,99];break;case 14:R=[4,3];break;case 15:R=[3,2];break;case 16:R=[2,1];break;case 255:R=[u()<<8|u(),u()<<8|u()]}return{width:Math.ceil(16*(T+1)-2*n-2*s),height:(2-L)*(S+1)*16-(L?2:4)*(o+l),pixelRatio:R}},t}(Ia),Pa=188,xa=function(){function e(e,t,r,i){this.logger=void 0,this.observer=void 0,this.config=void 0,this.typeSupported=void 0,this.sampleAes=null,this.pmtParsed=!1,this.audioCodec=void 0,this.videoCodec=void 0,this._pmtId=-1,this._videoTrack=void 0,this._audioTrack=void 0,this._id3Track=void 0,this._txtTrack=void 0,this._klvPid=-1,this.aacOverFlow=null,this.remainderData=null,this.videoParser=void 0,this.videoIntegrityChecker=null,this.observer=e,this.config=t,this.typeSupported=r,this.logger=i,this.videoParser=null}e.probe=function(t,r){var i=e.syncOffset(t);return i>0&&r.warn("MPEG2-TS detected but first sync word found @ offset "+i),-1!==i},e.syncOffset=function(e){for(var t=e.length,r=Math.min(940,t-Pa)+1,i=0;i<r;){for(var a=!1,n=-1,s=0,o=i;o<t;o+=Pa){if(71!==e[o]||t-o!==Pa&&71!==e[o+Pa]){if(s)return-1;break}if(s++,-1===n&&0!==(n=o)&&(r=Math.min(n+18612,e.length-Pa)+1),a||(a=0===wa(e,o)),a&&s>1&&(0===n&&s>2||o+Pa>r))return n}i++}return-1},e.createTrack=function(e,t){return{container:"video"===e||"audio"===e?"video/mp2t":void 0,type:e,id:Be[e],pid:-1,inputTimeScale:9e4,sequenceNumber:0,samples:[],dropped:0,duration:"audio"===e?t:void 0}};var t=e.prototype;return t.resetInitSegment=function(t,r,i,a,n,s){this.pmtParsed=!1,this._pmtId=-1,this._videoTrack=e.createTrack("video"),this._videoTrack.duration=a,this.videoIntegrityChecker="skip"===this.config.handleMpegTsVideoIntegrityErrors?new Ga(this.logger):null,this._audioTrack=e.createTrack("audio",a),this._id3Track=e.createTrack("id3"),this._txtTrack=e.createTrack("text"),this._audioTrack.segmentCodec="aac",this.videoParser=null,this.aacOverFlow=null,this.remainderData=null,this.audioCodec=r,this.videoCodec=i,t&&this.demux(t,0,s,"SAMPLE-AES"===(null==n?void 0:n.method))},t.resetTimeStamp=function(){},t.resetContiguity=function(){var e=this._audioTrack,t=this._videoTrack,r=this._id3Track;e&&(e.pesData=null),t&&(t.pesData=null),r&&(r.pesData=null),this.aacOverFlow=null,this.remainderData=null},t.demux=function(t,r,i,a,n){var s;void 0===a&&(a=!1),void 0===n&&(n=!1),a||(this.sampleAes=null);var o=this._videoTrack,l=this.videoIntegrityChecker,u=this._audioTrack,d=this._id3Track,h=this._txtTrack,f=i.iframe,c=o.pid,g=o.pesData,v=u.pid,m=d.pid,p=this._klvPid,y=u.pesData,E=d.pesData,T=null,S=null,L=this.pmtParsed,R=this._pmtId,A=t.length;if(this.remainderData&&(A=(t=it(this.remainderData,t)).length,this.remainderData=null),A<Pa&&!n)return this.remainderData=t,{audioTrack:u,videoTrack:o,id3Track:d,textTrack:h};var b=Math.max(0,e.syncOffset(t));(A-=(A-b)%Pa)<t.byteLength&&!n&&(this.remainderData=new Uint8Array(t.buffer,A,t.buffer.byteLength-A));for(var k=0,D=b;D<A;D+=Pa)if(71===t[D]){var I=!!(64&t[D+1]),_=wa(t,D),C=void 0;if((48&t[D+3])>>4>1){if((C=D+5+t[D+4])===D+Pa)continue}else C=D+4;switch(_){case c:I&&(!g||null!=l&&l.isCorrupted||!(s=Ba(g,this.logger))||(this.readyVideoParser(o.segmentCodec),null!==this.videoParser&&this.videoParser.parsePES(o,h,s,!1,i)),g={data:[],size:0},null==l||l.reset(c)),null==l||l.handlePacket(t.subarray(D)),g&&(g.data.push(t.subarray(C,D+Pa)),g.size+=D+Pa-C);break;case v:if(f)break;if(I){if(y&&(s=Ba(y,this.logger)))switch(u.segmentCodec){case"aac":this.parseAACPES(u,s,i);break;case"mp3":this.parseMPEGPES(u,s)}y={data:[],size:0}}y&&(y.data.push(t.subarray(C,D+Pa)),y.size+=D+Pa-C);break;case m:if(f)break;I&&(E&&(s=Ba(E,this.logger))&&this.parseID3PES(d,s),E={data:[],size:0}),E&&(E.data.push(t.subarray(C,D+Pa)),E.size+=D+Pa-C);break;case p:if(f)break;I&&(T&&(s=Ba(T,this.logger))&&this.parseKlvPES(d,s),T={data:[],size:0}),T&&(T.data.push(t.subarray(C,D+Pa)),T.size+=D+Pa-C);break;case 0:I&&(C+=t[C]+1),R=this._pmtId=Oa(t,C);break;case R:I&&(C+=t[C]+1);var P=Ma(t,C,this.typeSupported,a,this.observer,this.logger,this.config,i);(c=P.videoPid)>0&&(o.pid=c,o.segmentCodec=P.segmentVideoCodec),(v=P.audioPid)>0&&(u.pid=v,u.segmentCodec=P.segmentAudioCodec),(m=P.id3Pid)>0&&(d.pid=m),(p=P.klvPid)>0&&(this._klvPid=p),null===S||L||(this.logger.warn("MPEG-TS PMT found at "+D+" after unknown PID '"+S+"'. Backtracking to sync byte @"+b+" to parse all TS packets."),S=null,D=b-188),L=this.pmtParsed=!0;break;case 17:case 8191:break;default:S=_}}else k++;k>0&&Fa(this.observer,new Error("Found "+k+" TS packet/s that do not start with 0x47"),i,void 0,this.logger),o.pesData=g,u.pesData=y,d.pesData=E;var x={audioTrack:u,videoTrack:o,id3Track:d,textTrack:h};return n&&this.extractRemainingSamples(x,i),x},t.flush=function(e,t){var r,i=this.remainderData;return this.remainderData=null,r=i?this.demux(i,0,t,!1,!0):{videoTrack:this._videoTrack,audioTrack:this._audioTrack,id3Track:this._id3Track,textTrack:this._txtTrack},this.extractRemainingSamples(r,t),this.sampleAes?this.decrypt(r,this.sampleAes):r},t.extractRemainingSamples=function(e,t){var r,i=e.audioTrack,a=e.videoTrack,n=e.id3Track,s=e.textTrack,o=a.pesData,l=i.pesData,u=n.pesData,d=this.videoIntegrityChecker;if(!o||null!=d&&d.isCorrupted||!(r=Ba(o,this.logger))?a.pesData=o:(this.readyVideoParser(a.segmentCodec),null!==this.videoParser&&(this.videoParser.parsePES(a,s,r,!0,t),a.pesData=null)),l&&(r=Ba(l,this.logger))){switch(i.segmentCodec){case"aac":this.parseAACPES(i,r,t);break;case"mp3":this.parseMPEGPES(i,r)}i.pesData=null}else null!=l&&l.size&&this.logger.log("last AAC PES packet truncated,might overlap between fragments"),i.pesData=l;u&&(r=Ba(u,this.logger))?(this.parseID3PES(n,r),n.pesData=null):n.pesData=u},t.demuxSampleAes=function(e,t,r,i){var a=this.demux(e,r,i,!0,!this.config.progressive),n=this.sampleAes=new La(this.observer,this.config,t);return this.decrypt(a,n)},t.readyVideoParser=function(e){null===this.videoParser&&"avc"===e&&(this.videoParser=new Ca)},t.decrypt=function(e,t){return new Promise((function(r){var i=e.audioTrack,a=e.videoTrack;i.samples&&"aac"===i.segmentCodec?t.decryptAacSamples(i.samples,0,(function(){a.samples?t.decryptAvcSamples(a.samples,0,0,(function(){r(e)})):r(e)})):a.samples&&t.decryptAvcSamples(a.samples,0,0,(function(){r(e)}))}))},t.destroy=function(){this.observer&&this.observer.removeAllListeners(),this.config=this.logger=this.observer=null,this.aacOverFlow=this.videoParser=this.remainderData=this.sampleAes=null,this._videoTrack=this._audioTrack=this._id3Track=this._txtTrack=void 0,this.videoIntegrityChecker=null},t.parseAACPES=function(e,t,r){var i,a,n,s=0,o=this.aacOverFlow,l=t.data;if(o){this.aacOverFlow=null;var u=o.missing,d=o.sample.unit.byteLength;if(-1===u)l=it(o.sample.unit,l);else{var h=d-u;o.sample.unit.set(l.subarray(0,u),h),e.samples.push(o.sample),s=o.missing}}for(i=s,a=l.length;i<a-1&&!na(l,i);i++);if(i!==s){var f,c=i<a-1;if(f=c?"AAC PES did not start with ADTS header,offset:"+i:"No ADTS header found in AAC PES",Fa(this.observer,new Error(f),r,c,this.logger),!c)return}if(oa(e,this.observer,l,i,this.audioCodec),void 0!==t.pts)n=t.pts;else{if(!o)return void this.logger.warn("[tsdemuxer]: AAC PES unknown PTS");var g=la(e.samplerate);n=o.sample.pts+g}for(var v,m=0;i<a;){if(i+=(v=ua(e,l,i,n,m)).length,v.missing){this.aacOverFlow=v;break}for(m++;i<a-1&&!na(l,i);i++);}},t.parseMPEGPES=function(e,t){var r=t.data,i=r.length,a=0,n=0,s=t.pts;if(void 0!==s)for(;n<i;)if(Ta(r,n)){var o=pa(e,r,n,s,a);if(!o)break;n+=o.length,a++}else n++;else this.logger.warn("[tsdemuxer]: MPEG PES unknown PTS")},t.parseAC3PES=function(e,t){},t.parseID3PES=function(e,t){if(void 0!==t.pts){var r=o({},t,{type:this._videoTrack?zi.emsg:zi.audioId3,duration:Number.POSITIVE_INFINITY});e.samples.push(r)}else this.logger.warn("[tsdemuxer]: ID3 PES unknown PTS")},t.parseKlvPES=function(e,t){var r,i=null!=(r=t.pts)?r:t.dts;if(void 0!==i){var a=t.data;if(a.length<16)this.logger.warn("[tsdemuxer]: KLV PES payload too short");else for(var n=0;n<a.length;){var s;if(n+16>a.length)break;var o=n;if((n+=16)>=a.length)break;var l=a[n];n+=1;var u=0;if(128&l){var d=127&l;if(0===d||d>4||n+d>a.length){this.logger.warn("[tsdemuxer]: Invalid KLV length encoding");break}for(var h=0;h<d;h++)u=u<<8|a[n+h];n+=d}else u=l;if(n+u>a.length){this.logger.warn("[tsdemuxer]: KLV value extends beyond PES payload");break}var f=n+u,c=a.subarray(o,f),g={data:c,len:c.byteLength,pts:i,dts:null!=(s=t.dts)?s:i,type:zi.misbklv,duration:Number.POSITIVE_INFINITY};e.samples.push(g),n=f}}else this.logger.warn("[tsdemuxer]: KLV PES unknown PTS and DTS")},e}();function wa(e,t){return((31&e[t+1])<<8)+e[t+2]}function Oa(e,t){return(31&e[t+10])<<8|e[t+11]}function Ma(e,t,r,i,a,n,s,o){var l={audioPid:-1,videoPid:-1,id3Pid:-1,klvPid:-1,segmentVideoCodec:"avc",segmentAudioCodec:"aac"},u=t+3+((15&e[t+1])<<8|e[t+2])-4;for(t+=12+((15&e[t+10])<<8|e[t+11]);t<u;){var d=wa(e,t),h=(15&e[t+3])<<8|e[t+4];switch(e[t]){case 207:if(!i){Na("ADTS AAC",n);break}case 15:-1===l.audioPid&&(l.audioPid=d);break;case 21:-1===l.id3Pid&&(l.id3Pid=d);break;case 219:if(!i){Na("H.264",n);break}case 27:-1===l.videoPid&&(l.videoPid=d);break;case 3:case 4:r.mpeg||r.mp3?-1===l.audioPid&&(l.audioPid=d,l.segmentAudioCodec="mp3"):n.log("MPEG audio found, not supported in this browser");break;case 193:if(!i){Na("AC-3",n);break}case 129:n.warn("AC-3 in M2TS support not included in build");break;case 6:if(h>0)for(var f=t+5,c=h;c>2;){switch(e[f]){case 106:-1===l.audioPid&&n.warn("AC-3 in M2TS support not included in build");break;case 5:-1===l.klvPid&&s.enableEmsgKLVMetadata&&(l.klvPid=d,n.log("KLV metadata PID found: "+d))}var g=e[f+1]+2;f+=g,c-=g}break;case 194:case 135:return Fa(a,new Error("Unsupported EC-3 in M2TS found"),o,void 0,n),l;case 36:return Fa(a,new Error("Unsupported HEVC in M2TS found"),o,void 0,n),l}t+=h+5}return l}function Fa(e,t,r,i,a){a.warn("parsing error: "+t.message),e.emit(O.ERROR,O.ERROR,{type:x.MEDIA_ERROR,details:w.FRAG_PARSING_ERROR,fatal:!1,levelRetry:i,chunkMeta:r,error:t,reason:t.message})}function Na(e,t){t.log(e+" with AES-128-CBC encryption found in unencrypted stream")}function Ba(e,t){var r,i,a,n,s,o=0,l=e.data;if(!e||0===e.size)return null;for(;l[0].length<19&&l.length>1;)l[0]=it(l[0],l[1]),l.splice(1,1);if(1===((r=l[0])[0]<<16)+(r[1]<<8)+r[2]){if((i=(r[4]<<8)+r[5])&&i>e.size-6)return null;var u=r[7];192&u&&(n=536870912*(14&r[9])+4194304*(255&r[10])+16384*(254&r[11])+128*(255&r[12])+(254&r[13])/2,64&u?n-(s=536870912*(14&r[14])+4194304*(255&r[15])+16384*(254&r[16])+128*(255&r[17])+(254&r[18])/2)>54e5&&(t.warn(Math.round((n-s)/9e4)+"s delta between PTS and DTS, align them"),n=s):s=n);var d=(a=r[8])+9;if(e.size<=d)return null;e.size-=d;for(var h=new Uint8Array(e.size),f=0,c=l.length;f<c;f++){var g=(r=l[f]).byteLength;if(d){if(d>g){d-=g;continue}r=r.subarray(d),g-=d,d=0}h.set(r,o),o+=g}return i&&(i-=a+3),{data:h,pts:n,dts:s,len:i}}return null}var Ua,Ga=function(){function e(e){this.logger=void 0,this.pid=0,this.lastContinuityCounter=-1,this.integrityState="ok",this.logger=e}var t=e.prototype;return t.reset=function(e){this.pid=e,this.lastContinuityCounter=-1,this.integrityState="ok"},t.handlePacket=function(e){if(!(e.byteLength<4)){var t=wa(e,0);if(t===this.pid){var r=(48&e[3])>>4;if(0!==r){var i=15&e[3],a=this.lastContinuityCounter;this.lastContinuityCounter=i;var n=0!=(1&r);if(!(0!=(2&r)&&0!=e[4]&&0!=(128&e[5])||a<0)){var s=n?a+1&15:a;return i!==s?(this.logger.warn("MPEG-TS Continuity Counter check failed for PID='"+t+"', CC="+i+", Expected-CC="+s+" Last-CC="+a),void(this.integrityState="cc-failed")):0!=(128&e[1])?(this.logger.warn("MPEG-TS Packet had TEI flag set for PID='"+t+"'"),void(this.integrityState="tei-bit")):void 0}}}else this.logger.debug("Packet PID mismatch, expected "+this.pid+" got "+t)}},a(e,[{key:"isCorrupted",get:function(){return"ok"!==this.integrityState}}])}(),Va=function(){function e(){}return e.getSilentFrame=function(e,t){if("mp4a.40.2"===e){if(1===t)return new Uint8Array([0,200,0,128,35,128]);if(2===t)return new Uint8Array([33,0,73,144,2,25,0,35,128]);if(3===t)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,142]);if(4===t)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,128,44,128,8,2,56]);if(5===t)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,130,48,4,153,0,33,144,2,56]);if(6===t)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,130,48,4,153,0,33,144,2,0,178,0,32,8,224])}else{if(1===t)return new Uint8Array([1,64,34,128,163,78,230,128,186,8,0,0,0,28,6,241,193,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94]);if(2===t)return new Uint8Array([1,64,34,128,163,94,230,128,186,8,0,0,0,0,149,0,6,241,161,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94]);if(3===t)return new Uint8Array([1,64,34,128,163,94,230,128,186,8,0,0,0,0,149,0,6,241,161,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94])}},e}(),Ha={video:new Uint8Array([0,0,0,0,0,0,0,0,118,105,100,101,0,0,0,0,0,0,0,0,0,0,0,0,86,105,100,101,111,72,97,110,100,108,101,114,0]),audio:new Uint8Array([0,0,0,0,0,0,0,0,115,111,117,110,0,0,0,0,0,0,0,0,0,0,0,0,83,111,117,110,100,72,97,110,100,108,101,114,0])},Ka=new Uint8Array([0,0,0,0,0,0,0,0]),Ya=new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0]),Wa=new Uint8Array([0,0,0,1,0,0,0,0,0,0,0,0]),ja=new Uint8Array([0,0,0,0,0,0,0,0]),qa=new Uint8Array([0,0,0,0,0,0,0,1]),Xa=new Uint8Array([105,115,111,109]),za=new Uint8Array([97,118,99,49]),Qa=new Uint8Array([0,0,0,1]),$a=function(){function e(){}return e.box=function(e){for(var t=8,r=arguments.length,i=new Array(r>1?r-1:0),a=1;a<r;a++)i[a-1]=arguments[a];for(var n=i.length,s=n;n--;)t+=i[n].byteLength;var o=new Uint8Array(t);for(Ye(o,0,t),Ye(o,4,e),n=0,t=8;n<s;n++)o.set(i[n],t),t+=i[n].byteLength;return o},e.hdlr=function(t){return e.box(Ne.hdlr,Ha[t])},e.mdat=function(t){return e.box(Ne.mdat,t)},e.mdhd=function(t,r){r*=t;var i=Math.floor(r/(Fe+1)),a=Math.floor(r%(Fe+1));return e.box(Ne.mdhd,new Uint8Array([1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,3,t>>24&255,t>>16&255,t>>8&255,255&t,i>>24,i>>16&255,i>>8&255,255&i,a>>24,a>>16&255,a>>8&255,255&a,85,196,0,0]))},e.mdia=function(t){return e.box(Ne.mdia,e.mdhd(t.timescale||0,t.duration||0),e.hdlr(t.type),e.minf(t))},e.mfhd=function(t){return e.box(Ne.mfhd,new Uint8Array([0,0,0,0,t>>24,t>>16&255,t>>8&255,255&t]))},e.minf=function(t){return"audio"===t.type?e.box(Ne.minf,e.box(Ne.smhd,ja),e.DINF,e.stbl(t)):e.box(Ne.minf,e.box(Ne.vmhd,Wa),e.DINF,e.stbl(t))},e.moof=function(t,r,i){return e.box(Ne.moof,e.mfhd(t),e.traf(i,r))},e.moov=function(t){for(var r=t.length,i=[];r--;)i[r]=e.trak(t[r]);return e.box.apply(null,[Ne.moov,e.mvhd(t[0].timescale||0,t[0].duration||0)].concat(i).concat(e.mvex(t)))},e.mvex=function(t){for(var r=t.length,i=[];r--;)i[r]=e.trex(t[r]);return e.box.apply(null,[Ne.mvex].concat(i))},e.mvhd=function(t,r){r*=t;var i=Math.floor(r/(Fe+1)),a=Math.floor(r%(Fe+1)),n=new Uint8Array([1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,3,t>>24&255,t>>16&255,t>>8&255,255&t,i>>24,i>>16&255,i>>8&255,255&i,a>>24,a>>16&255,a>>8&255,255&a,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255]);return e.box(Ne.mvhd,n)},e.sdtp=function(t){var r,i,a=t.samples||[],n=new Uint8Array(4+a.length);for(r=0;r<a.length;r++)i=a[r].flags,n[r+4]=i.dependsOn<<4|i.isDependedOn<<2|i.hasRedundancy;return e.box(Ne.sdtp,n)},e.stbl=function(t){return e.box(Ne.stbl,e.stsd(t),e.box(Ne.stts,Ka),e.box(Ne.stsc,Ka),e.box(Ne.stsz,Ya),e.box(Ne.stco,Ka))},e.avc1=function(t){var r,i,a,n=[],s=[];for(r=0;r<t.sps.length;r++)a=(i=t.sps[r]).byteLength,n.push(a>>>8&255),n.push(255&a),n=n.concat(Array.prototype.slice.call(i));for(r=0;r<t.pps.length;r++)a=(i=t.pps[r]).byteLength,s.push(a>>>8&255),s.push(255&a),s=s.concat(Array.prototype.slice.call(i));var o=e.box(Ne.avcC,new Uint8Array([1,n[3],n[4],n[5],255,224|t.sps.length].concat(n).concat([t.pps.length]).concat(s))),l=t.width,u=t.height,d=t.pixelRatio[0],h=t.pixelRatio[1];return e.box(Ne.avc1,new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,l>>8&255,255&l,u>>8&255,255&u,0,72,0,0,0,72,0,0,0,0,0,0,0,1,18,100,97,105,108,121,109,111,116,105,111,110,47,104,108,115,46,106,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,17,17]),o,e.box(Ne.btrt,new Uint8Array([0,28,156,128,0,45,198,192,0,45,198,192])),e.box(Ne.pasp,new Uint8Array([d>>24,d>>16&255,d>>8&255,255&d,h>>24,h>>16&255,h>>8&255,255&h])))},e.esds=function(e){var t=e.config,r=t.length;return new Uint8Array([0,0,0,0,3,23+r,0,1,0,4,15+r,64,21,0,0,0,0,0,0,0,0,0,0,0,5,r].concat(t,[6,1,2]))},e.audioStsd=function(e){var t=e.samplerate||0;return new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,e.channelCount||0,0,16,0,0,0,0,t>>8&255,255&t,0,0])},e.mp4a=function(t){return e.box(Ne.mp4a,e.audioStsd(t),e.box(Ne.esds,e.esds(t)))},e.mp3=function(t){return e.box(Ne[".mp3"],e.audioStsd(t))},e.ac3=function(t){return e.box(Ne["ac-3"],e.audioStsd(t),e.box(Ne.dac3,t.config))},e.stsd=function(t){var r=t.segmentCodec;if("audio"===t.type){if("aac"===r)return e.box(Ne.stsd,qa,e.mp4a(t));if("mp3"===r&&"mp3"===t.codec)return e.box(Ne.stsd,qa,e.mp3(t))}else{if(!t.pps||!t.sps)throw new Error("video track missing pps or sps");if("avc"===r)return e.box(Ne.stsd,qa,e.avc1(t))}throw new Error("unsupported "+t.type+" segment codec ("+r+"/"+t.codec+")")},e.tkhd=function(t){var r=t.id,i=(t.duration||0)*(t.timescale||0),a=t.width||0,n=t.height||0,s=Math.floor(i/(Fe+1)),o=Math.floor(i%(Fe+1));return e.box(Ne.tkhd,new Uint8Array([1,0,0,7,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,3,r>>24&255,r>>16&255,r>>8&255,255&r,0,0,0,0,s>>24,s>>16&255,s>>8&255,255&s,o>>24,o>>16&255,o>>8&255,255&o,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,a>>8&255,255&a,0,0,n>>8&255,255&n,0,0]))},e.traf=function(t,r){var i=e.sdtp(t),a=t.id,n=Math.floor(r/(Fe+1)),s=Math.floor(r%(Fe+1));return e.box(Ne.traf,e.box(Ne.tfhd,new Uint8Array([0,0,0,0,a>>24,a>>16&255,a>>8&255,255&a])),e.box(Ne.tfdt,new Uint8Array([1,0,0,0,n>>24,n>>16&255,n>>8&255,255&n,s>>24,s>>16&255,s>>8&255,255&s])),e.trun(t,i.length+16+20+8+16+8+8),i)},e.trak=function(t){return t.duration=t.duration||4294967295,e.box(Ne.trak,e.tkhd(t),e.mdia(t))},e.trex=function(t){var r=t.id;return e.box(Ne.trex,new Uint8Array([0,0,0,0,r>>24,r>>16&255,r>>8&255,255&r,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1]))},e.trun=function(t,r){var i,a,n,s,o,l,u=t.samples||[],d=u.length,h=12+16*d,f=new Uint8Array(h);for(r+=8+h,f.set(["video"===t.type?1:0,0,15,1,d>>>24&255,d>>>16&255,d>>>8&255,255&d,r>>>24&255,r>>>16&255,r>>>8&255,255&r],0),i=0;i<d;i++)n=(a=u[i]).duration,s=a.size,o=a.flags,l=a.cts,f.set([n>>>24&255,n>>>16&255,n>>>8&255,255&n,s>>>24&255,s>>>16&255,s>>>8&255,255&s,o.isLeading<<2|o.dependsOn,o.isDependedOn<<6|o.hasRedundancy<<4|o.paddingValue<<1|o.isNonSync,61440&o.degradPrio,15&o.degradPrio,l>>>24&255,l>>>16&255,l>>>8&255,255&l],12+16*i);return e.box(Ne.trun,f)},e.initSegment=function(t){var r=e.moov(t);return it(e.FTYP,r)},e.hvc1=function(e){return new Uint8Array},e}();function Za(e,t){return function(e,t,r,i){var a=e*t*r;return Math.round(a)}(e,1e3,1/9e4)}function Ja(e){var t=e.baseTime,r=e.timescale;return t/r+" ("+t+"/"+r+") trackId: "+e.trackId}Ua=$a,$a.FTYP=Ua.box(Ne.ftyp,Xa,Qa,Xa,za),$a.DINF=Ua.box(Ne.dinf,Ua.box(Ne.dref,new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,12,117,114,108,32,0,0,0,1])));var en=8589934592;function tn(e,t,r,i){return{duration:t,size:r,cts:i,flags:{isLeading:0,isDependedOn:0,hasRedundancy:0,degradPrio:0,dependsOn:e?2:1,isNonSync:e?0:1,paddingValue:0}}}var rn=function(e){function t(t,r,i,a){var n;return(n=e.call(this,"mp4-remuxer",a)||this).observer=void 0,n.config=void 0,n.typeSupported=void 0,n.ISGenerated=!1,n._initPTS=null,n._initDTS=null,n.nextVideoTs=null,n.nextAudioTs=null,n.videoSampleDuration=null,n.isAudioContiguous=!1,n.isVideoContiguous=!1,n.videoTrackConfig=void 0,n.observer=t,n.config=r,n.typeSupported=i,n.ISGenerated=!1,n}u(t,e);var r=t.prototype;return r.destroy=function(){this.config=this.videoTrackConfig=this._initPTS=this._initDTS=null},r.resetTimeStamp=function(e){var t=this._initPTS;t&&e&&e.trackId===t.trackId&&e.baseTime===t.baseTime&&e.timescale===t.timescale||this.log("Reset initPTS: "+(t?Ja(t):t)+" > "+(e?Ja(e):e)),this._initPTS=this._initDTS=e},r.resetNextTimestamp=function(){this.log("reset next timestamp"),this.isVideoContiguous=!1,this.isAudioContiguous=!1},r.resetInitSegment=function(){this.log("ISGenerated flag reset"),this.ISGenerated=!1,this.videoTrackConfig=void 0},r.getVideoStartPts=function(e){var t=!1,r=e[0].pts,i=e.reduce((function(e,i){var a=i.pts,n=a-e;return n<-4294967296&&(t=!0,n=(a=an(a,r))-e),n>0?e:a}),r);return t&&this.debug("PTS rollover detected"),i},r.remux=function(e,t,r,i,a,n,s,o,l){var u,d,h,f,c,g,v=a,m=a,p=!l.iframe&&e.pid>-1,y=t.pid>-1,E=t.samples.length,T=e.samples.length>0,S=s&&E>0||E>1;if((!p||T)&&(!y||S)||this.ISGenerated||s){if(this.ISGenerated){var L,R,A,b,k=this.videoTrackConfig;(k&&(t.width!==k.width||t.height!==k.height||(null==(L=t.pixelRatio)?void 0:L[0])!==(null==(R=k.pixelRatio)?void 0:R[0])||(null==(A=t.pixelRatio)?void 0:A[1])!==(null==(b=k.pixelRatio)?void 0:b[1]))||!k&&S||null===this.nextAudioTs&&T)&&this.resetInitSegment()}this.ISGenerated||(h=this.generateIS(e,t,a,n));var D,I=this.isVideoContiguous,_=-1;if(S&&(_=function(e){for(var t=0;t<e.length;t++)if(e[t].key)return t;return-1}(t.samples),!I&&this.config.forceKeyFrameOnDiscontinuity))if(g=!0,_>0){this.warn("Dropped "+_+" out of "+E+" video samples due to a missing keyframe");var C=this.getVideoStartPts(t.samples);t.samples=t.samples.slice(_),t.dropped+=_,D=m+=(t.samples[0].pts-C)/t.inputTimeScale}else-1===_&&(this.warn("No keyframe found out of "+E+" video samples"),g=!1);if(this.ISGenerated){if(T&&S&&a){var P=this.getVideoStartPts(t.samples),x=(an(e.samples[0].pts,P)-P)/t.inputTimeScale;v+=Math.max(0,x),m+=Math.max(0,-x)}if(T){if(e.samplerate||(this.warn("regenerate InitSegment as audio detected"),h=this.generateIS(e,t,a,n)),d=this.remuxAudio(e,v,this.isAudioContiguous,n,y||S||o===N.AUDIO?m:void 0,l),S){var w=d?d.endPTS-d.startPTS:0;t.inputTimeScale||(this.warn("regenerate InitSegment as video detected"),h=this.generateIS(e,t,a,n)),u=this.remuxVideo(t,m,I,w,l)}}else S&&(u=this.remuxVideo(t,m,I,0,l));u&&(u.firstKeyFrame=_,u.independent=-1!==_,u.firstKeyFramePTS=D)}}return this.ISGenerated&&this._initPTS&&this._initDTS&&(r.samples.length&&(c=nn(r,a,this._initPTS,this._initDTS)),i.samples.length&&(f=sn(i,a,this._initPTS))),{audio:d,video:u,initSegment:h,independent:g,text:f,id3:c}},r.computeInitPts=function(e,t,r,i){var a=Math.round(r*t),n=an(e,a);if(n<a)for(this.log("Adjusting PTS for rollover in timeline near "+(a-n)/t+" "+i);n<a;)n+=en;return n-a},r.generateIS=function(e,t,r,i){var a,n,s,o=e.samples,l=t.samples,u=this.typeSupported,d={},h=this._initPTS,f=!h||i,c="audio/mp4",g=-1;if(f&&(a=n=1/0),e.config&&o.length){switch(e.timescale=e.samplerate,e.segmentCodec){case"mp3":u.mpeg?(c="audio/mpeg",e.codec=""):u.mp3&&(e.codec="mp3");break;case"ac3":e.codec="ac-3"}if(d.audio={id:"audio",container:c,codec:e.codec,initSegment:"mp3"===e.segmentCodec&&u.mpeg?new Uint8Array(0):$a.initSegment([e]),metadata:{channelCount:e.channelCount}},f){g=e.id,s=e.inputTimeScale;var v=this.computeInitPts(o[0].pts,s,r,"audio");(!h||s!==h.timescale||0===r&&v<h.baseTime)&&(a=n=v)}}if(t.sps&&t.pps&&l.length){if(t.timescale=t.inputTimeScale,d.video={id:"main",container:"video/mp4",codec:t.codec,initSegment:$a.initSegment([t]),metadata:{width:t.width,height:t.height}},f){g=t.id,s=t.inputTimeScale;var m=this.getVideoStartPts(l),p=an(l[0].dts,m),y=this.computeInitPts(p,s,r,"video"),E=this.computeInitPts(m,s,r,"video");(!h||s!==h.timescale||_(a)||0===r&&E<h.baseTime)&&(n=Math.min(n,y),a=Math.min(a,y))}this.videoTrackConfig={width:t.width,height:t.height,pixelRatio:t.pixelRatio}}if(Object.keys(d).length)return this.ISGenerated=!0,f&&_(a)?(h&&this.warn("Timestamps at playlist time: "+(i?"":"~")+r+" "+a/s+" != initPTS: "+h.baseTime/h.timescale+" ("+h.baseTime+"/"+h.timescale+") trackId: "+h.trackId),this.log("Found initPTS at playlist time: "+r+" offset: "+a/s+" ("+a+"/"+s+") trackId: "+g),this._initPTS={baseTime:a,timescale:s,trackId:g},this._initDTS={baseTime:n,timescale:s,trackId:g}):a=s=void 0,{tracks:d,initPTS:a,timescale:s,trackId:g}},r.remuxVideo=function(e,t,r,i,a){var n,s,l=e.inputTimeScale,u=e.samples,d=[],h=u.length,f=this._initPTS,c=f.baseTime*l/f.timescale,g=this.nextVideoTs,v=8,m=this.videoSampleDuration,p=Number.POSITIVE_INFINITY,y=Number.NEGATIVE_INFINITY,E=!1;if(!r||null===g){var T=c+t*l,S=u[0].pts-an(u[0].dts,u[0].pts);ct()&&null!==g&&Math.abs(T-S-(g+c))<15e3?r=!0:g=T-S-c}for(var L=g+c,R=0;R<h;R++){var A=u[R];A.pts=an(A.pts,L),A.dts=an(A.dts,L),A.dts<u[R>0?R-1:R].dts&&(E=!0)}E&&u.sort((function(e,t){var r=e.dts-t.dts,i=e.pts-t.pts;return r||i})),n=u[0].dts;var b=(s=u[u.length-1].dts)-n,k=b?Math.round(b/(h-1)):m||e.inputTimeScale/30;if(r){var D=n-L,I=D>k,_=D<-1;if((I||_)&&(I?this.warn((e.segmentCodec||"").toUpperCase()+": "+Za(D)+" ms ("+D+"dts) hole between fragments detected at "+t.toFixed(3)):this.warn((e.segmentCodec||"").toUpperCase()+": "+Za(-D)+" ms ("+D+"dts) overlapping between fragments detected at "+t.toFixed(3)),!_||L>=u[0].pts||ct())){n=L;var C=u[0].pts-D;if(I)u[0].dts=n,u[0].pts=C;else for(var P=!0,M=0;M<u.length&&!(u[M].dts>C&&P);M++){var F=u[M].pts;if(u[M].dts-=D,u[M].pts-=D,M<u.length-1){var N=u[M+1].pts;P=N<=u[M].pts==N<=F}}this.log("Video: Initial PTS/DTS adjusted: "+Za(C)+"/"+Za(n)+", delta: "+Za(D)+" ms")}}for(var B=0,U=0,G=n=Math.max(0,n),V=0;V<h;V++){for(var H=u[V],K=H.units,Y=K.length,W=0,j=0;j<Y;j++)W+=K[j].data.length;U+=W,B+=Y,H.length=W,H.dts<G?(H.dts=G,G+=k/4|0||1):G=H.dts,p=Math.min(H.pts,p),y=Math.max(H.pts,y)}s=u[h-1].dts;var q,X=U+4*B+8;try{q=new Uint8Array(X)}catch(e){return void this.observer.emit(O.ERROR,O.ERROR,{type:x.MUX_ERROR,details:w.REMUX_ALLOC_ERROR,fatal:!1,chunkMeta:a,error:e,bytes:X,reason:"fail allocating video mdat "+X})}Ye(q,0,X),Ye(q,4,Ne.mdat);for(var z=!1,Q=Number.POSITIVE_INFINITY,$=Number.POSITIVE_INFINITY,Z=Number.NEGATIVE_INFINITY,J=Number.NEGATIVE_INFINITY,ee=0;ee<h;ee++){for(var te=u[ee],re=te.units,ie=0,ae=0,ne=re.length;ae<ne;ae++){var se=re[ae],oe=se.data,le=se.data.byteLength;Ye(q,v,le),v+=4,q.set(oe,v),v+=le,ie+=4+le}var ue=void 0;if(ee<h-1)m=u[ee+1].dts-te.dts,ue=u[ee+1].pts-te.pts;else{var de=this.config,he=ee>0?te.dts-u[ee-1].dts:k;if(ue=ee>0?te.pts-u[ee-1].pts:k,de.stretchShortVideoTrack&&null!==this.nextAudioTs){var fe=Math.floor(de.maxBufferHole*l),ce=(i?p+i*l:this.nextAudioTs+c)-te.pts;ce>fe?((m=ce-he)<0?m=he:z=!0,this.log("It is approximately "+ce/90+" ms to the next segment; using duration "+m/90+" ms for the last video frame.")):m=he}else m=he}var ge=Math.round(te.pts-te.dts);if(Q=Math.min(Q,m),Z=Math.max(Z,m),$=Math.min($,ue),J=Math.max(J,ue),!r&&0===ee&&ge>m){var ve=Math.round(ge/k)*k;ve-ge==1&&(this.log("pad first CTS "+ge+" -> "+ve+" of sn: "+a.sn),ge=ve)}d.push(tn(te.key,m,ie,ge))}if(d.length){var me=ct();if(me){if(me<70){var pe=d[0].flags;pe.dependsOn=2,pe.isNonSync=0}}else if(function(){if(void 0===dt){var e=ht.match(/Safari\/(\d+)/i);dt=e?parseInt(e[1]):0}return dt}()&&J-$<Z-Q&&k/Z<.025&&0===d[0].cts){this.warn("Found irregular gaps in sample duration. Using PTS instead of DTS to determine MP4 sample duration.");for(var ye=n,Ee=0,Te=d.length;Ee<Te;Ee++){var Se=ye+d[Ee].duration,Le=ye+d[Ee].cts;if(Ee<Te-1){var Re=Se+d[Ee+1].cts;d[Ee].duration=Re-Le}else d[Ee].duration=Ee?d[Ee-1].duration:k;d[Ee].cts=0,ye=Se}}}var Ae=s+(m=z||!m?k:m);this.nextVideoTs=g=Ae-c,this.videoSampleDuration=m,this.isVideoContiguous=!0;var be={data1:$a.moof(a.sn,n,o(e,{samples:d})),data2:q,startPTS:(p-c)/l,endPTS:(y+m-c)/l,startDTS:(n-c)/l,endDTS:g/l,type:"video",hasAudio:!1,hasVideo:!0,nb:d.length,dropped:e.dropped};return e.samples=[],e.dropped=0,be},r.getSamplesPerFrame=function(e){switch(e.segmentCodec){case"mp3":return 1152;case"ac3":return 1536;default:return 1024}},r.remuxAudio=function(e,t,r,i,a,n){var s=e.inputTimeScale,l=s/(e.samplerate?e.samplerate:s),u=this.getSamplesPerFrame(e),d=u*l,h=this._initPTS,f="mp3"===e.segmentCodec&&this.typeSupported.mpeg,c=[],g=void 0!==a,v=e.samples,m=f?0:8,p=this.nextAudioTs||-1,y=h.baseTime*s/h.timescale,E=y+t*s;if(this.isAudioContiguous=r=r||v.length&&p>0&&(i&&Math.abs(E-(p+y))<9e3||Math.abs(an(v[0].pts,E)-(p+y))<20*d),v.forEach((function(e){e.pts=an(e.pts,E)})),!r||p<0){var T=v.length;if(v=v.filter((function(e){return e.pts>=0})),T!==v.length&&this.warn("Removed "+(v.length-T)+" of "+T+" samples (initPTS "+y+" / "+s+")"),!v.length)return;p=0===a?0:i&&!g?Math.max(0,E-y):v[0].pts-y}if("aac"===e.segmentCodec)for(var S=this.config.maxAudioFramesDrift,L=0,R=p+y;L<v.length;L++){var A=v[L],b=A.pts,k=b-R,D=Math.abs(1e3*k/s);if(k<=-S*d&&g)0===L&&(this.warn("Audio frame @ "+(b/s).toFixed(3)+"s overlaps marker by "+Math.round(1e3*k/s)+" ms."),this.nextAudioTs=p=b-y,R=b);else if(k>=S*d&&D<1e4&&g){var I=Math.round(k/d);for(R=b-I*d;R<0&&I&&d;)I--,R+=d;0===L&&(this.nextAudioTs=p=R-y),this.warn("Injecting "+I+" audio frames @ "+((R-y)/s).toFixed(3)+"s due to "+Math.round(1e3*k/s)+" ms gap.");for(var _=0;_<I;_++){var C=Va.getSilentFrame(e.parsedCodec||e.manifestCodec||e.codec,e.channelCount);C||(this.log("Unable to get silent frame for given audio codec; duplicating last frame instead."),C=A.unit.subarray()),v.splice(L,0,{unit:C,pts:R}),R+=d,L++}}A.pts=R,R+=d}for(var P,M=null,F=null,N=0,B=v.length;B--;)N+=v[B].unit.byteLength;for(var U=0,G=v.length;U<G;U++){var V=v[U],H=V.unit,K=V.pts;if(null!==F)c[U-1].duration=Math.round((K-F)/l);else{if(r&&"aac"===e.segmentCodec&&(K=p+y),M=K,!(N>0))return;N+=m;try{P=new Uint8Array(N)}catch(e){return void this.observer.emit(O.ERROR,O.ERROR,{type:x.MUX_ERROR,details:w.REMUX_ALLOC_ERROR,fatal:!1,chunkMeta:n,error:e,bytes:N,reason:"fail allocating audio mdat "+N})}f||(Ye(P,0,N),Ye(P,4,Ne.mdat))}P&&P.set(H,m);var Y=H.byteLength;m+=Y,c.push(tn(!0,u,Y,0)),F=K}var W=c.length;if(W){var j=c[c.length-1];p=F-y,this.nextAudioTs=p+l*j.duration;var q=f?new Uint8Array(0):$a.moof(e.sequenceNumber++,M/l,o({},e,{samples:c}));e.samples=[];var X=(M-y)/s,z=this.nextAudioTs/s,Q={data1:q,data2:P,startPTS:X,endPTS:z,startDTS:X,endDTS:z,type:"audio",hasAudio:!0,hasVideo:!1,nb:W};return this.isAudioContiguous=!0,Q}},t}(ie);function an(e,t){var r;if(null===t)return e;for(r=t<e?-en:en;Math.abs(e-t)>4294967296;)e+=r;return e}function nn(e,t,r,i){var a=e.samples.length;if(a){for(var n=e.inputTimeScale,s=0;s<a;s++){var o=e.samples[s];o.pts=an(o.pts-r.baseTime*n/r.timescale,t*n)/n,o.dts=an(o.dts-i.baseTime*n/i.timescale,t*n)/n}var l=e.samples;return e.samples=[],{samples:l}}}function sn(e,t,r){var i=e.samples.length;if(i){for(var a=e.inputTimeScale,n=0;n<i;n++){var s=e.samples[n];s.pts=an(s.pts-r.baseTime*a/r.timescale,t*a)/a}e.samples.sort((function(e,t){return e.pts-t.pts}));var o=e.samples;return e.samples=[],{samples:o}}}var on,ln=function(e){function t(t,r,i,a){var n;return(n=e.call(this,"passthrough-remuxer",a)||this).observer=void 0,n.emitInitSegment=!1,n.audioCodec=void 0,n.videoCodec=void 0,n.initData=void 0,n.initPTS=null,n.initTracks=void 0,n.lastEndTime=null,n.isVideoContiguous=!1,n.videoOnlyRemux=!1,n.decryptdata=null,n.pendingInitSegment=void 0,n.observer=t,n}u(t,e);var r=t.prototype;return r.destroy=function(){this.observer&&this.observer.removeAllListeners(),this.observer=null},r.resetTimeStamp=function(e){this.lastEndTime=null;var t=this.initPTS;t&&e&&t.baseTime===e.baseTime&&t.timescale===e.timescale||(this.initPTS=e)},r.resetNextTimestamp=function(){this.isVideoContiguous=!1,this.lastEndTime=null},r.resetInitSegment=function(e,t,r,i){this.audioCodec=t,this.videoCodec=r,this.decryptdata=i,this.pendingInitSegment=e,this.videoOnlyRemux=!1,this.initTracks=void 0,this.initData=void 0,this.emitInitSegment=!0},r.generateInitSegment=function(e,t,r){this.videoOnlyRemux=!1;var i=this.audioCodec,a=this.videoCodec;if(null==e||!e.byteLength)return this.initTracks=void 0,void(this.initData=void 0);var n=this.initData=r||Xe(e),s=n.audio,o=n.video;if(t)!function(e,t){if(e&&t){var r=t.keyId;16===(null==r?void 0:r.byteLength)&&t.isCommonEncryption&&et(e,(function(e,t){var i=e.subarray(8,24);i.some((function(e){return 0!==e}))||(fe.log("[eme] Patching keyId in 'enc"+(t?"a":"v")+">sinf>>tenc' box: "+xe(i)+" -> "+xe(r)),e.set(r,8))}))}}(e,t);else{var l=s||o;null!=l&&l.encrypted&&this.warn('Init segment with encrypted track with has no key ("'+l.codec+'")!')}s&&(i=dn(s,B.AUDIO,this)),o&&(a=dn(o,B.VIDEO,this));var u={};s&&o?u.audiovideo={container:"video/mp4",codec:i+","+a,supplemental:o.supplemental,encrypted:o.encrypted,initSegment:e,id:"main"}:s?u.audio={container:"audio/mp4",codec:i,encrypted:s.encrypted,initSegment:e,id:"audio"}:o?u.video={container:"video/mp4",codec:a,supplemental:o.supplemental,encrypted:o.encrypted,initSegment:e,id:"main"}:this.warn("initSegment does not contain moov or trak boxes."),this.initTracks=u},r.remux=function(e,t,r,i,a,n,s,o,l,u,d){var h,f,c=this.initPTS,g=this.lastEndTime,v={audio:void 0,video:void 0,text:void 0,id3:r,initSegment:void 0};_(g)||(g=this.lastEndTime=a||0);var m=t.samples;if(!m.length)return v;var p=this.pendingInitSegment;p&&(this.pendingInitSegment=void 0,this.generateInitSegment(p,this.decryptdata,u));var y={initPTS:void 0,timescale:void 0,trackId:void 0},E=this.initData;if(null!=(h=E)&&h.length||(this.generateInitSegment(m),E=this.initData),null==(f=E)||!f.length)return this.warn("Failed to generate initSegment."),v;this.emitInitSegment&&(y.tracks=this.initTracks,v.initSegment=y,this.emitInitSegment=!1);var T=d?d.tracks:function(e,t,r,i,a){return rt(e,t,i)}(m,E,0,this),S=E.audio?T[E.audio.id]:null,L=E.video?T[E.video.id]:null,R=!!E.audio,A=!!E.video,b="";R&&(b+="audio"),A&&(b+="video");var k,D,I=un(L,1/0),C=un(S,1/0),P=un(L,0,!0),x=un(S,0,!0);L&&S&&E.audio&&(C>P||I>x)&&this.warn("audio and video track sample timestamps do not overlap. v: "+I+"-"+P+" a: "+C+"-"+x+"}",L,S);var w=!!S&&(!L||!c&&C<I||!!c&&c.trackId===E.audio.id),O=w?S:L;if(!O)return this.log("No media samples found in "+o+" "+l.level+" "+(-1===l.part?"":"part: "+l.part+" of")+" sn: "+l.sn+" at playlist time: "+a),v;var M=m;D=w?x-C:P-I;var F=O.timescale,N=O.start-a*F,B=w?E.audio.id:E.video.id;if(k=O.start/F,(n||!c)&&(function(e,t,r,i){if(null===e)return!0;var a=Math.max(i,1),n=t-e.baseTime/e.timescale;return Math.abs(n-r)>=a}(c,k,a,D)||F!==c.timescale)){var U=!1,G=w?"audio":"video";if(c){var V=0!==a?k/a:1+k/1;U=k>=0&&Math.abs(1-V)<.001,this.log(G+" timestamps in track "+B+" at playlist time: "+(n?"":"~")+a+" maps to "+k+" with initPTS: "+c.baseTime/c.timescale+" ("+(N/F-c.baseTime/c.timescale)+"s diff) ("+b+") drift estimate: "+V+" "+(U?"(ignoring drift)":"remapping timestamps (initPTS)"))}U||(this.log("Found initPTS in "+G+" track "+B+" at playlist time: "+a+" offset: "+(k-a)+" ("+N+"/"+F+")"),c=null,y.initPTS=N,y.timescale=F,y.trackId=B)}c?(y.initPTS=c.baseTime,y.timescale=c.timescale,y.trackId=c.trackId):(y.timescale&&void 0!==y.trackId&&void 0!==y.initPTS||(this.warn("Could not set initPTS"),y.initPTS=k,y.timescale=1,y.trackId=-1),this.initPTS=c={baseTime:y.initPTS,timescale:y.timescale,trackId:y.trackId});var H=k-c.baseTime/c.timescale,K=H+D,Y=A&&void 0!==(null==O?void 0:O.ptsMin)?O.ptsMin/O.timescale-c.baseTime/c.timescale:H,W=A&&null!=O&&O.ptsMax?O.ptsMax/O.timescale-c.baseTime/c.timescale:K;D>0?this.lastEndTime=K:(this.warn("Duration parsed from mp4 should be greater than zero"),this.resetNextTimestamp());var j={data1:M,data2:void 0,startPTS:Y,startDTS:H,endPTS:W,endDTS:K,type:b,hasAudio:R,hasVideo:A,nb:1,dropped:0,encrypted:!!E.audio&&E.audio.encrypted||!!E.video&&E.video.encrypted};v.audio=R&&!A?j:void 0,v.video=A?j:void 0;var q=this.isVideoContiguous,X=null==L?void 0:L.sampleCount;if(X){var z=L.keyFrameIndex,Q=-1!==z;j.nb=X,j.dropped=0===z||q?0:Q?z:X,j.independent=Q,j.firstKeyFrame=z,Q&&L.keyFrameStart&&(j.firstKeyFramePTS=(L.keyFrameStart-c.baseTime)/c.timescale),q||(v.independent=Q),this.isVideoContiguous||(this.isVideoContiguous=Q),j.dropped&&this.warn("fmp4 does not start with IDR: firstIDR "+z+"/"+X+" dropped: "+j.dropped+" start: "+(j.firstKeyFramePTS||"NA"))}return v.initSegment=y,v.id3=nn(r,a,c,c),i.samples.length&&(v.text=sn(i,a,c)),v},t}(ie);function un(e,t,r){return void 0===r&&(r=!1),void 0!==(null==e?void 0:e.start)?(e.start+(r?e.duration:0))/e.timescale:t}function dn(e,t,r){var i=e.codec;return i&&i.length>4?i:t===B.AUDIO?"ec-3"===i||"ac-3"===i||"alac"===i?i:"fLaC"===i||"Opus"===i?Rt(i,!1):(r.warn('Unhandled audio codec "'+i+'" in mp4 MAP'),i||"mp4a"):"mjpg"===i?i:(r.warn('Unhandled video codec "'+i+'" in mp4 MAP'),i||"avc1")}try{on=self.performance.now.bind(self.performance)}catch(e){on=Date.now}var hn=[{demux:ka,remux:ln},{demux:xa,remux:rn},{demux:Ra,remux:rn},{demux:Aa,remux:rn}],fn=function(){function e(e,t,r,i,a,n){this.asyncResult=!1,this.logger=void 0,this.observer=void 0,this.typeSupported=void 0,this.config=void 0,this.id=void 0,this.demuxer=void 0,this.remuxer=void 0,this.decrypter=void 0,this.probe=void 0,this.decryptionPromise=null,this.transmuxConfig=void 0,this.currentTransmuxState=void 0,this.observer=e,this.typeSupported=t,this.config=r,this.id=a,this.logger=n}var t=e.prototype;return t.configure=function(e){this.transmuxConfig=e,this.decrypter&&this.decrypter.reset()},t.push=function(e,t,r,i){var a=this;if(!this.observer)return cn(r);var n=r.transmuxing;n.executeStart=on();var s=new Uint8Array(e),o=this.currentTransmuxState,l=this.transmuxConfig;i&&(this.currentTransmuxState=i);var u=i||o,d=u.contiguous,h=u.discontinuity,f=u.trackSwitch,c=u.accurateTimeOffset,g=u.timeOffset,v=u.initSegmentChange,m=l.audioCodec,p=l.videoCodec,y=l.defaultInitPts,E=l.duration,T=l.initSegmentData,S=function(e,t){var r=null;return e.byteLength>0&&null!=(null==t?void 0:t.key)&&null!==t.iv&&null!=t.method&&(r=t),r}(s,t);if(S&&Or(S.method)){var L=this.getDecrypter(),R=Mr(S.method);return this.asyncResult=!0,this.decryptionPromise=L.decrypt(s,S.key.buffer,S.iv.buffer,R,r.decryptRange).then((function(e){var t=a.push(e,null,r);return a.decryptionPromise=null,t})),this.decryptionPromise}var A=this.needsProbing(h,f);if(A){var b=r.iframe&&T&&xa.probe(T,this.logger)?T:s,k=this.configureTransmuxer(b);if(k)return this.logger.warn("[transmuxer] "+k.message),this.observer.emit(O.ERROR,O.ERROR,{type:x.MEDIA_ERROR,details:w.FRAG_PARSING_ERROR,fatal:!1,error:k,reason:k.message}),n.executeEnd=on(),cn(r)}(h||f||v||A)&&this.resetInitSegment(T,m,p,E,t,r),(h||v||A)&&this.resetInitialTimestamp(y),d||this.resetContiguity();var D=this.transmux(s,S,g,c,r);this.asyncResult=gn(D);var I=this.currentTransmuxState;return I.contiguous=!0,I.discontinuity=!1,I.trackSwitch=!1,n.executeEnd=on(),D},t.flush=function(e){var t=this,r=e.transmuxing;r.executeStart=on();var i=this.decrypter,a=this.currentTransmuxState,n=this.decryptionPromise;if(n)return this.asyncResult=!0,n.then((function(){return t.flush(e)}));var s=[],o=a.timeOffset;if(i){var l=i.flush();l&&s.push(this.push(l.buffer,null,e))}var u=this.demuxer,d=this.remuxer;if(!u||!d){r.executeEnd=on();var h=[cn(e)];return this.asyncResult?Promise.resolve(h):h}var f=u.flush(o,e);return gn(f)?(this.asyncResult=!0,f.then((function(r){return t.flushRemux(s,r,e),s}))):(this.flushRemux(s,f,e),this.asyncResult?Promise.resolve(s):s)},t.flushRemux=function(e,t,r){if(this.remuxer){var i=t.audioTrack,a=t.videoTrack,n=t.id3Track,s=t.textTrack,o=this.currentTransmuxState,l=o.accurateTimeOffset,u=o.timeOffset;this.logger.log("[transmuxer.ts]: Flushed "+this.id+" sn: "+r.sn+(r.part>-1?" part: "+r.part:"")+" of "+this.id+" playlist "+r.level);var d=this.remuxer.remux(i,a,n,s,u,l,!0,this.id,r,t.initData,t.sampleData);e.push({remuxResult:d,chunkMeta:r}),r.transmuxing.executeEnd=on()}},t.resetInitialTimestamp=function(e){var t=this.demuxer,r=this.remuxer;t&&r&&(t.resetTimeStamp(e),r.resetTimeStamp(e))},t.resetContiguity=function(){var e=this.demuxer,t=this.remuxer;e&&t&&(e.resetContiguity(),t.resetNextTimestamp())},t.resetInitSegment=function(e,t,r,i,a,n){var s=this.demuxer,o=this.remuxer;s&&o&&(s.resetInitSegment(e,t,r,i,a,n),o.resetInitSegment(e,t,r,a))},t.destroy=function(){this.demuxer&&(this.demuxer.destroy(),this.demuxer=void 0),this.remuxer&&(this.remuxer.destroy(),this.remuxer=void 0),this.observer&&this.observer.removeAllListeners(),this.decryptionPromise=null,this.decrypter=this.observer=void 0,this.logger=this.config=this.probe=void 0},t.transmux=function(e,t,r,i,a){return"SAMPLE-AES"===(null==t?void 0:t.method)?this.transmuxSampleAes(e,t,r,i,a):this.transmuxUnencrypted(e,r,i,a)},t.transmuxUnencrypted=function(e,t,r,i){var a=this.demuxer,n=this.remuxer;if(!a||!n)return cn(i);var s=a.demux(e,t,i,!1,!this.config.progressive),o=s.audioTrack,l=s.videoTrack,u=s.id3Track,d=s.textTrack;return{remuxResult:n.remux(o,l,u,d,t,r,!1,this.id,i,s.initData,s.sampleData),chunkMeta:i}},t.transmuxSampleAes=function(e,t,r,i,a){var n=this;return this.demuxer?this.demuxer.demuxSampleAes(e,t,r,a).then((function(e){return{remuxResult:n.remuxer.remux(e.audioTrack,e.videoTrack,e.id3Track,e.textTrack,r,i,!1,n.id,a,e.initData,e.sampleData),chunkMeta:a}})):Promise.reject(new Error("no demuxer"))},t.configureTransmuxer=function(e){var t=this.config,r=this.observer,i=this.typeSupported;if(r){var a;try{for(var n=0,s=hn.length;n<s;n++){var o;if(null!=(o=hn[n].demux)&&o.probe(e,this.logger)){a=hn[n];break}}}catch(e){return e}if(!a)return new Error("Failed to find demuxer by probing fragment data");var l=this.demuxer,u=this.remuxer,d=a.demux,h=a.remux;l&&l instanceof d||(this.logger.log("Using "+d.name),this.demuxer=new d(r,t,i,this.logger),this.probe=d.probe),u&&u instanceof h||(this.logger.log("Using "+h.name),this.remuxer=new h(r,t,i,this.logger))}},t.needsProbing=function(e,t){return!this.demuxer||!this.remuxer||e||t},t.getDecrypter=function(){var e=this.decrypter;return e||(e=this.decrypter=new _i(this.config)),e},e}(),cn=function(e){return{remuxResult:{},chunkMeta:e}};function gn(e){return"then"in e&&e.then instanceof Function}var vn=function(e,t,r,i,a){this.audioCodec=void 0,this.videoCodec=void 0,this.initSegmentData=void 0,this.duration=void 0,this.defaultInitPts=void 0,this.audioCodec=e,this.videoCodec=t,this.initSegmentData=r,this.duration=i,this.defaultInitPts=a||null},mn=function(e,t,r,i,a,n){this.discontinuity=void 0,this.contiguous=void 0,this.accurateTimeOffset=void 0,this.trackSwitch=void 0,this.timeOffset=void 0,this.initSegmentChange=void 0,this.discontinuity=e,this.contiguous=t,this.accurateTimeOffset=r,this.trackSwitch=i,this.timeOffset=a,this.initSegmentChange=n},pn=[];function yn(e,t,r){if(!((i=t.remuxResult).audio||i.video||i.text||i.id3||i.initSegment))return!1;var i,a=[],n=t.remuxResult,s=n.audio,o=n.video;return s&&En(a,s),o&&En(a,o),e.postMessage({event:"transmuxComplete",data:t,instanceNo:r},a),!0}function En(e,t){t.data1&&e.push(t.data1.buffer),t.data2&&e.push(t.data2.buffer)}function Tn(e,t,r,i){t.reduce((function(t,r){return yn(e,r,i)||t}),!1)||e.postMessage({event:"transmuxComplete",data:t[0],instanceNo:i}),e.postMessage({event:"flush",data:r,instanceNo:i})}function Sn(e,t,r){self.postMessage({event:e,data:t,instanceNo:r})}void 0!==t&&t&&self.addEventListener("message",(function(e){var t=e.data,r=t.instanceNo;if(void 0!==r){var i=pn[r];if("reset"===t.cmd&&(delete pn[t.resetNo],i&&i.destroy(),t.cmd="init"),"init"===t.cmd){var a=JSON.parse(t.config),n=new k;n.on(O.FRAG_DECRYPTED,(function(e,t){return Sn(e,t,r)})),n.on(O.ERROR,(function(e,t){return Sn(e,t,r)}));var s=ue(a.debug,t.id);return function(e,t){var r=function(r){e[r]=function(){var e=Array.prototype.join.call(arguments," ");Sn("workerLog",{logType:r,message:e},t)}};for(var i in e)r(i)}(s,r),pn[r]=new fn(n,t.typeSupported,a,"",t.id,s),void Sn("init",null,r)}if(i)switch(t.cmd){case"configure":i.configure(t.config);break;case"demux":var o=i.push(t.data,t.decryptdata,t.chunkMeta,t.state);gn(o)?o.then((function(e){yn(self,e,r)})).catch((function(e){Sn(O.ERROR,{instanceNo:r,type:x.MEDIA_ERROR,details:w.FRAG_PARSING_ERROR,chunkMeta:t.chunkMeta,fatal:!1,error:e,err:e,reason:"transmuxer-worker push error"},r)})):yn(self,o,r);break;case"flush":var l=t.chunkMeta,u=i.flush(l);gn(u)?u.then((function(e){Tn(self,e,l,r)})).catch((function(e){Sn(O.ERROR,{type:x.MEDIA_ERROR,details:w.FRAG_PARSING_ERROR,chunkMeta:t.chunkMeta,fatal:!1,error:e,err:e,reason:"transmuxer-worker flush error"},r)})):Tn(self,u,l,r)}}}));var Ln="1.7.3",Rn={},An=0,bn=function(){function t(t,r,i,a){var n=this;this.error=null,this.hls=void 0,this.id=void 0,this.instanceNo=An++,this.observer=void 0,this.frag=null,this.part=null,this.useWorker=void 0,this.workerContext=null,this.transmuxer=null,this.onTransmuxComplete=void 0,this.onFlush=void 0,this.onWorkerMessage=function(e){var t=e.data,r=n.hls;if(r&&null!=t&&t.event&&t.instanceNo===n.instanceNo)switch(t.event){case"init":var i,a=null==(i=n.workerContext)?void 0:i.objectURL;a&&self.URL.revokeObjectURL(a);break;case"transmuxComplete":n.handleTransmuxComplete(t.data);break;case"flush":n.onFlush(t.data);break;case"workerLog":r.logger[t.data.logType]&&r.logger[t.data.logType](t.data.message);break;default:t.data=t.data||{},t.data.frag=n.frag,t.data.part=n.part,t.data.id=n.id,r.trigger(t.event,t.data)}},this.onWorkerError=function(e){if(n.hls){var t=new Error(e.message+"  ("+e.filename+":"+e.lineno+")");n.hls.config.enableWorker=!1,n.hls.logger.warn('Error in "'+n.id+'" Web Worker, fallback to inline'),n.hls.trigger(O.ERROR,{type:x.OTHER_ERROR,details:w.INTERNAL_EXCEPTION,fatal:!1,event:"demuxerWorker",error:t})}};var s=t.config;this.hls=t,this.id=r,this.useWorker=!!s.enableWorker,this.onTransmuxComplete=i,this.onFlush=a;var o=function(e,t){(t=t||{}).frag=n.frag||void 0,e===O.ERROR&&(t.parent=n.id,t.part=n.part,n.error=t.error),n.hls.trigger(e,t)};this.observer=new k,this.observer.on(O.FRAG_DECRYPTED,o),this.observer.on(O.ERROR,o);var l=kt(s.preferManagedMediaSource);if(this.useWorker&&"undefined"!=typeof Worker){var u=this.hls.logger;s.workerPath;try{s.workerPath?(u.log("loading Web Worker "+s.workerPath+' for "'+r+'"'),this.workerContext=function(e){var t=Rn[e];if(t)return t.clientCount++,t;var r=new self.URL(e,self.location.href).href,i={worker:new self.Worker(r),scriptURL:r,clientCount:1};return Rn[e]=i,i}(s.workerPath)):(u.log('injecting Web Worker for "'+r+'"'),this.workerContext=function(){var t=Rn[Ln];if(t)return t.clientCount++,t;var r=new self.Blob(["var exports={};var module={exports:exports};function define(f){f()};define.amd=true;("+e.toString()+")(true);"],{type:"text/javascript"}),i=self.URL.createObjectURL(r),a={worker:new self.Worker(i),objectURL:i,clientCount:1};return Rn[Ln]=a,a}());var d=this.workerContext.worker;d.addEventListener("message",this.onWorkerMessage),d.addEventListener("error",this.onWorkerError),d.postMessage({instanceNo:this.instanceNo,cmd:"init",typeSupported:l,id:r,config:Bt(s)})}catch(e){u.warn('Error setting up "'+r+'" Web Worker, fallback to inline',e),this.terminateWorker(),this.error=null,this.transmuxer=new fn(this.observer,l,s,"",r,t.logger)}}else this.transmuxer=new fn(this.observer,l,s,"",r,t.logger)}var r=t.prototype;return r.reset=function(){if(this.frag=null,this.part=null,this.workerContext){var e=this.instanceNo;this.instanceNo=An++;var t=this.hls.config,r=kt(t.preferManagedMediaSource);this.workerContext.worker.postMessage({instanceNo:this.instanceNo,cmd:"reset",resetNo:e,typeSupported:r,id:this.id,config:Bt(t)})}},r.terminateWorker=function(){if(this.workerContext){var e=this.workerContext.worker;this.workerContext=null,e.removeEventListener("message",this.onWorkerMessage),e.removeEventListener("error",this.onWorkerError),function(e){var t=Rn[e||Ln];if(t&&1==t.clientCount--){var r=t.worker,i=t.objectURL;delete Rn[e||Ln],i&&self.URL.revokeObjectURL(i),r.terminate()}}(this.hls.config.workerPath)}},r.destroy=function(){if(this.workerContext)this.terminateWorker(),this.onWorkerMessage=this.onWorkerError=null;else{var e=this.transmuxer;e&&(e.destroy(),this.transmuxer=null)}var t=this.observer;t&&t.removeAllListeners(),this.frag=null,this.part=null,this.observer=null,this.hls=null},r.push=function(e,t,r,i,a,n,s,o,l,u){var d,h,f=this;l.transmuxing.start=self.performance.now();var c=this.instanceNo,g=this.transmuxer,v=n?n.start:a.start,m=a.decryptdata,p=this.frag,y=!p||a.cc!==p.cc,E=!p||l.level!==p.level,T=p?l.sn-p.sn:-1,S=this.part?l.part-this.part.index:-1,L=0===T&&l.id>1&&l.id===(null==p?void 0:p.stats.chunkCount),R=!E&&(1===T||0===T&&(1===S||L&&S<=0)),A=self.performance.now();(E||T||0===a.stats.parsing.start)&&(a.stats.parsing.start=A),!n||!S&&R||(n.stats.parsing.start=A);var b=!(p&&(null==(d=a.initSegment)?void 0:d.url)===(null==(h=p.initSegment)?void 0:h.url)),k=new mn(y,R,o,E,v,b);if(!R||y||b){this.hls.logger.log("[transmuxer-interface]: Starting new transmux session for "+a.type+" sn: "+l.sn+(l.part>-1?" part: "+l.part:"")+" "+this.id+" playlist: "+l.level+" id: "+l.id+"\n        discontinuity: "+y+"\n        trackSwitch: "+E+"\n        contiguous: "+R+"\n        accurateTimeOffset: "+o+"\n        timeOffset: "+v+"\n        initSegmentChange: "+b);var D=new vn(r,i,t,s,u);this.configureTransmuxer(D)}if(this.frag=a,this.part=n,this.workerContext)this.workerContext.worker.postMessage({instanceNo:c,cmd:"demux",data:e,decryptdata:m,chunkMeta:l,state:k},e instanceof ArrayBuffer?[e]:[]);else if(g){var I=g.push(e,m,l,k);gn(I)?I.then((function(e){f.handleTransmuxComplete(e)})).catch((function(e){f.transmuxerError(e,l,"transmuxer-interface push error")})):this.handleTransmuxComplete(I)}},r.flush=function(e){var t=this;e.transmuxing.start=self.performance.now();var r=this.instanceNo,i=this.transmuxer;if(this.workerContext)this.workerContext.worker.postMessage({instanceNo:r,cmd:"flush",chunkMeta:e});else if(i){var a=i.flush(e);gn(a)?a.then((function(r){t.handleFlushResult(r,e)})).catch((function(r){t.transmuxerError(r,e,"transmuxer-interface flush error")})):this.handleFlushResult(a,e)}},r.transmuxerError=function(e,t,r){this.hls&&(this.error=e,this.hls.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.FRAG_PARSING_ERROR,chunkMeta:t,frag:this.frag||void 0,part:this.part||void 0,fatal:!1,error:e,err:e,reason:r}))},r.handleFlushResult=function(e,t){var r=this;e.forEach((function(e){r.handleTransmuxComplete(e)})),this.onFlush(t)},r.configureTransmuxer=function(e){var t=this.instanceNo,r=this.transmuxer;this.workerContext?this.workerContext.worker.postMessage({instanceNo:t,cmd:"configure",config:e}):r&&r.configure(e)},r.handleTransmuxComplete=function(e){e.chunkMeta.transmuxing.end=self.performance.now(),this.onTransmuxComplete(e)},t}();function kn(){return self.SourceBuffer||self.WebKitSourceBuffer}function Dn(){if(!ve())return!1;var e=kn();return!e||e.prototype&&"function"==typeof e.prototype.appendBuffer&&"function"==typeof e.prototype.remove}var In=0,_n=1,Cn=2,Pn=function(e){function t(t,r,i){var a;return(a=e.call(this,t,r,i,"stream-controller",N.MAIN)||this).audioCodecSwap=!1,a.level=-1,a._forceStartLoad=!1,a._hasEnoughToStart=!1,a.altAudio=In,a.audioOnly=!1,a._couldBacktrack=!1,a._backtrackFragment=void 0,a.audioCodecSwitch=!1,a.videoBuffer=null,a.onMediaPlaying=function(){a.tick()},a.onMediaSeeked=function(){var e=a.media,t=e?e.currentTime:null;if(null!==t&&_(t)&&(a.log("Media seeked to "+t),a.getBufferedFrag(t))){var r=a.getFwdBufferInfoAtPos(e,t,N.MAIN,0);r&&0!==r.len?a.tick():a.log("Main buffer empty at "+t+' on "seeked" event: '+(r?r.len:r))}},a.registerListeners(),a}u(t,e);var r=t.prototype;return r.registerListeners=function(){e.prototype.registerListeners.call(this);var t=this.hls;t.on(O.MANIFEST_PARSED,this.onManifestParsed,this),t.on(O.LEVEL_LOADING,this.onLevelLoading,this),t.on(O.LEVEL_LOADED,this.onLevelLoaded,this),t.on(O.FRAG_LOAD_EMERGENCY_ABORTED,this.onFragLoadEmergencyAborted,this),t.on(O.AUDIO_TRACK_SWITCHING,this.onAudioTrackSwitching,this),t.on(O.AUDIO_TRACK_SWITCHED,this.onAudioTrackSwitched,this),t.on(O.BUFFER_CREATED,this.onBufferCreated,this),t.on(O.BUFFER_FLUSHED,this.onBufferFlushed,this),t.on(O.LEVELS_UPDATED,this.onLevelsUpdated,this),t.on(O.FRAG_BUFFERED,this.onFragBuffered,this)},r.unregisterListeners=function(){e.prototype.unregisterListeners.call(this);var t=this.hls;t.off(O.MANIFEST_PARSED,this.onManifestParsed,this),t.off(O.LEVEL_LOADED,this.onLevelLoaded,this),t.off(O.FRAG_LOAD_EMERGENCY_ABORTED,this.onFragLoadEmergencyAborted,this),t.off(O.AUDIO_TRACK_SWITCHING,this.onAudioTrackSwitching,this),t.off(O.AUDIO_TRACK_SWITCHED,this.onAudioTrackSwitched,this),t.off(O.BUFFER_CREATED,this.onBufferCreated,this),t.off(O.BUFFER_FLUSHED,this.onBufferFlushed,this),t.off(O.LEVELS_UPDATED,this.onLevelsUpdated,this),t.off(O.FRAG_BUFFERED,this.onFragBuffered,this)},r.onHandlerDestroying=function(){this.onMediaPlaying=this.onMediaSeeked=null,this.unregisterListeners(),e.prototype.onHandlerDestroying.call(this)},r.startLoad=function(e,t){if(this.levels){var r=this.lastCurrentTime,i=this.hls;if(this.stopLoad(),this.setInterval(100),this.level=-1,!this.startFragRequested){var a=i.startLevel;-1===a&&(i.config.testBandwidth&&this.levels.length>1?(a=0,this.bitrateTest=!0):a=i.firstAutoLevel),i.nextLoadLevel=a,this.level=i.loadLevel,this._hasEnoughToStart=!!t}r>0&&-1===e&&!t&&this.initPTS.length&&(this.log("Override startPosition with lastCurrentTime @"+r),e=r),this.state=Hi.IDLE,this.nextLoadPosition=this.lastCurrentTime=e+this.timelineOffset,this.startPosition=t?-1:e,t||this.fragmentTracker.hasFragments(this.playlistType)||(this._hasEnoughToStart=this.startFragRequested=!1),this.tick()}else this._forceStartLoad=!0,this.state=Hi.STOPPED},r.stopLoad=function(){this._forceStartLoad=!1,e.prototype.stopLoad.call(this)},r.doTick=function(){switch(this.state){case Hi.WAITING_LEVEL:var e=this.levels,t=this.level,r=null==e?void 0:e[t],i=null==r?void 0:r.details;if(i&&(!i.live||this.levelLastLoaded===r&&!this.waitForLive(r))){if(this.waitForCdnTuneIn(i))break;this.state=Hi.IDLE;break}if(this.hls.nextLoadLevel!==this.level){this.state=Hi.IDLE;break}break;case Hi.FRAG_LOADING_WAITING_RETRY:this.checkRetryDate()}this.state===Hi.IDLE&&this.doTickIdle(),this.onTickEnd()},r.onTickEnd=function(){var t;e.prototype.onTickEnd.call(this),null!=(t=this.media)&&t.readyState&&!1===this.media.seeking&&(this.lastCurrentTime=this.media.currentTime),this.checkFragmentChanged()},r.doTickIdle=function(){var e=this.hls,t=this.levelLastLoaded,r=this.levels,i=this.media;if(null!==t&&(i||this.primaryPrefetch||!this.startFragRequested&&e.config.startFragPrefetch)&&(!this.altAudio||!this.audioOnly)){var a=this.buffering?e.nextLoadLevel:e.loadLevel;if(null!=r&&r[a]){var n=r[a],s=this.getMainFwdBufferInfo();if(null!==s){var o=this.getLevelDetails();if(o&&this._streamEnded(s,o)){var l={type:this.targetBufferType()};return this.hls.trigger(O.BUFFER_EOS,l),void(this.state=Hi.ENDED)}if(this.buffering){e.loadLevel!==a&&-1===e.manualLevel&&this.log("Adapting to level "+a+" from level "+this.level),this.level=e.nextLoadLevel=a;var u=n.details;if(!u||this.state===Hi.WAITING_LEVEL||this.waitForLive(n))return this.level=a,this.state=Hi.WAITING_LEVEL,void(this.startFragRequested=!1);var d=s.len,h=this.getMaxBufferLength(n.maxBitrate);if(!(d>=h)){this.backtrackFragment&&this.backtrackFragment.start>s.end&&(this.backtrackFragment=void 0);var f=this.backtrackFragment?this.backtrackFragment.start:s.end,c=this.getNextFragment(f,u);if(this.couldBacktrack&&!this.fragPrevious&&c&&G(c)&&this.fragmentTracker.getState(c)!==Si){var g,v=(null!=(g=this.backtrackFragment)?g:c).sn-u.startSN,m=u.fragments[v-1];m&&c.cc===m.cc&&(c=m,this.fragmentTracker.removeFragment(m))}else this.backtrackFragment&&s.len&&(this.backtrackFragment=void 0);if(c&&this.isLoopLoading(c,f)){if(!c.gap){var p=this.audioOnly&&!this.altAudio?B.AUDIO:B.VIDEO,y=(p===B.VIDEO?this.videoBuffer:this.mediaBuffer)||this.media;y&&this.afterBufferFlushed(y,p)}c=this.getNextFragmentLoopLoading(c,u,s,N.MAIN,h)}c&&(this.exceedsMaxBuffer(s,h,c)||this.loadFragment(c,n,f))}}}}}},r.loadFragment=function(t,r,i){var a=this.fragmentTracker.getState(t);a===yi||a===Ti?this.bitrateTest?(this.log("Fragment "+t.sn+" of level "+t.level+" is being downloaded to test bitrate and will not be buffered"),this._loadBitrateTestFrag(t,r)):e.prototype.loadFragment.call(this,t,r,i):this.clearTrackerIfNeeded(t)},r.immediateLevelSwitch=function(){var t;this.abortCurrentFrag(),this.flushMainBuffer(0,Number.POSITIVE_INFINITY),this.altAudio!==In&&((null==(t=this.getLevelDetails())?void 0:t.fragmentStart)||0)>this.lastCurrentTime&&e.prototype.flushMainBuffer.call(this,0,Number.POSITIVE_INFINITY,"audio")},r.getBufferOutput=function(){return this.mediaBuffer&&this.altAudio===Cn?this.mediaBuffer:this.media},r.checkFragmentChanged=function(){var e=this.fragPlaying;if(!this.checkFragPlaying())return!1;var t=this.fragPlaying;if(t){var r=t.level;this.hls.trigger(O.FRAG_CHANGED,{frag:t,previousFrag:e}),(null==e?void 0:e.level)!==r&&this.hls.trigger(O.LEVEL_SWITCHED,{level:r})}return!0},r.abortCurrentFrag=function(){this.backtrackFragment=void 0,e.prototype.abortCurrentFrag.call(this)},r.flushMainBuffer=function(t,r){e.prototype.flushMainBuffer.call(this,t,r,this.targetBufferType())},r.targetBufferType=function(){return this.altAudio!==Cn||this.audioOnly?null:"video"},r.onMediaAttached=function(t,r){e.prototype.onMediaAttached.call(this,t,r);var i=r.media;hr(i,"playing",this.onMediaPlaying),hr(i,"seeked",this.onMediaSeeked)},r.onMediaDetaching=function(t,r){var i=this.media;i&&(fr(i,"playing",this.onMediaPlaying),fr(i,"seeked",this.onMediaSeeked)),this.videoBuffer=null,e.prototype.onMediaDetaching.call(this,t,r),r.transferMedia||(this._hasEnoughToStart=!1)},r.onManifestLoading=function(){e.prototype.onManifestLoading.call(this),this.log("Trigger BUFFER_RESET"),this.hls.trigger(O.BUFFER_RESET,void 0),this.couldBacktrack=!1,this.backtrackFragment=void 0,this.altAudio=In,this.audioOnly=!1},r.onManifestParsed=function(e,t){for(var r,i,a=!1,n=!1,s=0;s<t.levels.length;s++){var o=t.levels[s].audioCodec;o&&(a=a||-1!==o.indexOf("mp4a.40.2"),n=n||-1!==o.indexOf("mp4a.40.5"))}this.audioCodecSwitch=a&&n&&!("function"==typeof(null==(i=kn())||null==(r=i.prototype)?void 0:r.changeType)),this.audioCodecSwitch&&this.log("Both AAC/HE-AAC audio found in levels; declaring level codec as HE-AAC"),this.levels=t.levels,this.startFragRequested=!1},r.onLevelLoading=function(e,t){if(this.levels&&this.state===Hi.IDLE){var r=t.levelInfo;(!r.details||r.details.live&&(this.levelLastLoaded!==r||r.details.expired)||this.waitForCdnTuneIn(r.details))&&(this.state=Hi.WAITING_LEVEL)}},r.onLevelLoaded=function(e,t){var r,i=this,a=this.levels,n=this.startFragRequested,s=t.level,o=t.details,l=o.totalduration;if(a){this.log("Level "+s+" loaded ["+o.startSN+","+o.endSN+"]"+(o.lastPartSn?"[part-"+o.lastPartSn+"-"+o.lastPartIndex+"]":"")+", cc ["+o.startCC+", "+o.endCC+"] duration:"+l);var u=t.levelInfo,d=this.fragCurrent;!d||this.state!==Hi.FRAG_LOADING&&this.state!==Hi.FRAG_LOADING_WAITING_RETRY||d.level!==t.level&&d.loader&&this.abortCurrentFrag();var h=0;if(o.live||null!=(r=u.details)&&r.live){var f;if(this.checkLiveUpdate(o),o.deltaUpdateFailed)return;h=this.alignPlaylists(o,u.details,null==(f=this.levelLastLoaded)?void 0:f.details)}if(u.details=o,this.levelLastLoaded=u,n||this.setStartPosition(o,h),this.hls.trigger(O.LEVEL_UPDATED,{details:o,level:s}),this.state===Hi.WAITING_LEVEL){if(this.waitForCdnTuneIn(o))return;this.state=Hi.IDLE}n&&o.live&&this.synchronizeToLiveEdge(o),this.initPTS.some((function(e,t){if(t>=o.startCC)return!0;delete i.initPTS[t]})),this.tick()}else this.warn("Levels were reset while loading level "+s)},r.synchronizeToLiveEdge=function(e){var t=this.config,r=this.media;if(r){var i=this.hls.liveSyncPosition,a=this.playhead,n=e.fragmentStart,s=e.edge,o=a>=n-t.maxFragLookUpTolerance&&a<=s;if(null!==i&&r.duration>i&&(a<i||!o)){var l=void 0!==t.liveMaxLatencyDuration?t.liveMaxLatencyDuration:t.liveMaxLatencyDurationCount*e.targetduration;if((!o&&r.readyState<4||a<s-l)&&(this._hasEnoughToStart||(this.nextLoadPosition=i),r.readyState))if(this.warn("Playback: "+a+" is located too far from the end of live sliding playlist: "+s+", reset currentTime to : "+i),"buffered"===this.config.liveSyncMode){var u,d=dr.bufferInfo(r,i,0);if(null==(u=d.buffered)||!u.length)return void(r.currentTime=i);if(d.start<=a)return void(r.currentTime=i);var h=dr.bufferedInfo(d.buffered,a,0).nextStart;h&&(r.currentTime=h)}else r.currentTime=i}}},r._handleFragmentLoadProgress=function(e){var t,r=e.frag,i=e.part,a=e.payload,n=this.levels;if(n){var s=n[r.level];if(s){var o=s.details;if(!o)return this.warn("Dropping fragment "+r.sn+" of level "+r.level+" after level details were reset"),void this.fragmentTracker.removeFragment(r);var l=s.videoCodec,u=o.PTSKnown||!o.live,d=null==(t=r.initSegment)?void 0:t.data,h=this._getAudioCodec(s),f=this.transmuxer=this.transmuxer||new bn(this.hls,N.MAIN,this._handleTransmuxComplete.bind(this),this._handleTransmuxerFlush.bind(this)),c=i?i.index:-1,g=-1!==c,v=wi(r,i,this.iframesOnly),m=v.decryptRange,p=v.byteRange,y=new Ni(r.level,r.sn,r.stats.chunkCount,p?p.end-p.start:a.byteLength,c,g,r.duration,this.iframesOnly,m),E=this.initPTS[r.cc];f.push(a,d,h,l,r,i,o.totalduration,u,y,E)}else this.warn("Level "+r.level+" not found on progress")}else this.warn("Levels were reset while fragment load was in progress. Fragment "+r.sn+" of level "+r.level+" will not be buffered")},r.onAudioTrackSwitching=function(e,t){var r=this,i=this.hls,a=this.altAudio!==In;if(Vt(t.url,i))this.altAudio=_n;else{if(this.mediaBuffer!==this.media){this.log("Switching on main audio, use media.buffered to schedule main fragment loading"),this.mediaBuffer=this.media;var n=this.fragCurrent;n&&(this.log("Switching to main audio track, cancel main fragment load"),n.abortRequests(),this.fragmentTracker.removeFragment(n)),this.resetTransmuxer(),this.resetLoadingState()}else this.audioOnly&&this.resetTransmuxer();if(a)return this.altAudio=In,this.fragmentTracker.removeAllFragments(),i.once(O.BUFFER_FLUSHED,(function(){r.hls&&r.hls.trigger(O.AUDIO_TRACK_SWITCHED,t)})),void i.trigger(O.BUFFER_FLUSHING,{startOffset:0,endOffset:Number.POSITIVE_INFINITY,type:null});i.trigger(O.AUDIO_TRACK_SWITCHED,t)}},r.onAudioTrackSwitched=function(e,t){var r=Vt(t.url,this.hls);if(r){var i=this.videoBuffer;i&&this.mediaBuffer!==i&&(this.log("Switching on alternate audio, use video.buffered to schedule main fragment loading"),this.mediaBuffer=i)}this.altAudio=r?Cn:In,this.tick()},r.onBufferCreated=function(e,t){var r,i,a=t.tracks,n=!1;for(var s in a){var o=a[s];if("main"===o.id){if(i=s,r=o,"video"===s){var l=a[s];l&&(this.videoBuffer=l.buffer)}}else n=!0}n&&r?(this.log("Alternate track found, use "+i+".buffered to schedule main fragment loading"),this.mediaBuffer=r.buffer):this.mediaBuffer=this.media},r.onFragBuffered=function(e,t){var r=t.frag,i=t.part,a=r.type===N.MAIN;if(a){if(this.fragContextChanged(r))return this.warn("Fragment "+r.sn+(i?" p: "+i.index:"")+" of level "+r.level+" finished buffering, but was aborted. state: "+this.state),void(this.state===Hi.PARSED&&(this.state=Hi.IDLE));var n=!1;if(G(r)&&(n=!!r.gap&&!r.tagList.some((function(e){return"GAP"===e[0]}))),this.fragBufferedComplete(r,i),n){var s;r.stats.retry++;var o=null==(s=this.levels)?void 0:s[r.level];o&&o.fragmentError++}}var l=this.media;l&&(!this._hasEnoughToStart&&dr.getBuffered(l).length&&(this._hasEnoughToStart=!0,this.seekToStartPos()),a&&this.tick())},r.onError=function(e,t){var r;if(t.fatal)this.state=Hi.ERROR;else switch(t.details){case w.FRAG_GAP:case w.FRAG_PARSING_ERROR:case w.FRAG_DECRYPT_ERROR:case w.FRAG_LOAD_ERROR:case w.FRAG_LOAD_TIMEOUT:case w.KEY_LOAD_ERROR:case w.KEY_LOAD_TIMEOUT:this.onFragmentOrKeyLoadError(N.MAIN,t);break;case w.LEVEL_LOAD_ERROR:case w.LEVEL_LOAD_TIMEOUT:case w.LEVEL_PARSING_ERROR:t.levelRetry||this.state!==Hi.WAITING_LEVEL||(null==(r=t.context)?void 0:r.type)!==F.LEVEL||(this.state=Hi.IDLE);break;case w.BUFFER_APPEND_NO_PROGRESS:if("main"!==t.parent)return;t.frag&&(t.appendsWithoutProgress||0)>=this.config.appendErrorMaxRetry&&(this.warn("Marking fragment "+t.frag.sn+" of level "+t.frag.level+" as a gap after "+t.appendsWithoutProgress+" appends without buffered range growth, to prevent loop loading"),this.fragmentTracker.addAsGap(t.frag));break;case w.BUFFER_ADD_CODEC_ERROR:case w.BUFFER_APPEND_ERROR:if("main"!==t.parent)return;this.reduceLengthAndFlushBuffer(t)&&this.resetLoadingState();break;case w.BUFFER_FULL_ERROR:if("main"!==t.parent)return;this.reduceLengthAndFlushBuffer(t)&&(!this.config.interstitialsController&&this.config.assetPlayerId?this._hasEnoughToStart=!0:this.flushMainBuffer(0,Number.POSITIVE_INFINITY));break;case w.INTERNAL_EXCEPTION:this.recoverWorkerError(t)}},r.onFragLoadEmergencyAborted=function(){this.state=Hi.IDLE,this._hasEnoughToStart||(this.startFragRequested=!1,this.nextLoadPosition=this.lastCurrentTime),this.tickImmediate()},r.onBufferFlushed=function(e,t){var r=t.type;if(r!==B.AUDIO||!this.altAudio){var i=(r===B.VIDEO?this.videoBuffer:this.mediaBuffer)||this.media;i&&(this.afterBufferFlushed(i,r),this.tick())}},r.onLevelsUpdated=function(e,t){this.level>-1&&this.fragCurrent&&(this.level=this.fragCurrent.level,-1===this.level&&this.resetWhenMissingContext(this.fragCurrent)),this.levels=t.levels},r.swapAudioCodec=function(){this.audioCodecSwap=!this.audioCodecSwap},r.seekToStartPos=function(){var e=this.media;if(e){var t=e.currentTime,r=this.startPosition;if(r>=0&&t<r){if(e.seeking)return void this.log("could not seek to "+r+", already seeking at "+t);var i=this.timelineOffset;i&&r&&(r+=i);var a=this.getLevelDetails(),n=dr.getBuffered(e),s=n.length?n.start(0):0,o=s-r,l=Math.max(this.config.maxBufferHole,this.config.maxFragLookUpTolerance);(this.config.startOnSegmentBoundary||o>0&&(o<l||this.loadingParts&&o<2*((null==a?void 0:a.partTarget)||0)))&&(this.log("adjusting start position by "+o+" to match buffer start"),r+=o,this.startPosition=r),t<r&&(this.log("seek to target start position "+r+" from current time "+t+" buffer start "+s),e.currentTime=r)}}},r._getAudioCodec=function(e){var t=this.config.defaultAudioCodec||e.audioCodec;return this.audioCodecSwap&&t&&(this.log("Swapping audio codec"),t=-1!==t.indexOf("mp4a.40.5")?"mp4a.40.2":"mp4a.40.5"),t},r._loadBitrateTestFrag=function(e,t){var r=this;e.bitrateTest=!0,this._doFragLoad(e,t).then((function(e){var i=r.hls,a=null==e?void 0:e.frag;if(a&&!r.fragContextChanged(a)){t.fragmentError=0,r.state=Hi.IDLE,r.startFragRequested=!1,r.bitrateTest=!1;var n=a.stats;n.parsing.start=n.parsing.end=n.buffering.start=n.buffering.end=self.performance.now(),i.trigger(O.FRAG_LOADED,e),a.bitrateTest=!1}})).catch((function(t){r.state!==Hi.STOPPED&&r.state!==Hi.ERROR&&(r.warn(t),r.resetFragmentLoading(e))}))},r._handleTransmuxComplete=function(e){var t=this.playlistType,r=this.hls,i=e.remuxResult,a=e.chunkMeta,n=this.getCurrentContext(a);if(n){var s=n.frag,o=n.part,l=n.level,u=i.video,d=i.text,h=i.id3,f=i.initSegment,c=l.details,g=this.altAudio?void 0:i.audio;if(this.fragContextChanged(s))this.fragmentTracker.removeFragment(s);else{if(this.state=Hi.PARSING,f){var v=f.tracks;if(v){var m=s.initSegment||s;if(this.unhandledEncryptionError(f,s))return;this._bufferInitSegment(l,v,m,a),r.trigger(O.FRAG_PARSING_INIT_SEGMENT,{frag:m,id:t,tracks:v})}var p=f.initPTS,y=f.timescale,E=this.initPTS[s.cc];if(_(p)&&(!E||E.baseTime!==p||E.timescale!==y)){var T=f.trackId;this.initPTS[s.cc]={baseTime:p,timescale:y,trackId:T};var S=this.initPTS.slice(0);r.trigger(O.INIT_PTS_FOUND,{timestampOffsets:S,frag:s,id:t,initPTS:p,timescale:y,trackId:T})}}if(u&&c){g&&"audiovideo"===u.type&&this.logMuxedErr(s);var L=c.fragments[s.sn-1-c.startSN],R=s.sn===c.startSN,A=!L||s.cc>L.cc;if(!1!==i.independent){var b=u.startPTS,k=u.endPTS,D=u.startDTS,I=u.endDTS;if(o)o.elementaryStreams[u.type]={startPTS:b,endPTS:k,startDTS:D,endDTS:I};else if(u.firstKeyFrame&&u.independent&&1===a.id&&!A&&(this.couldBacktrack=!0),u.dropped&&u.independent){var C=this.getMainFwdBufferInfo(),P=(C?C.end:this.getLoadPosition())+this.config.maxBufferHole,x=u.firstKeyFramePTS?u.firstKeyFramePTS:b;if(!R&&P<x-this.config.maxBufferHole&&!A)return void this.backtrack(s);A&&(s.gap=!0),s.setElementaryStreamInfo(u.type,s.start,k,s.start,I,!0)}else R&&b-(c.appliedTimelineOffset||0)>2&&(s.gap=!0);s.setElementaryStreamInfo(u.type,b,k,D,I),this.backtrackFragment&&(this.backtrackFragment=s),this.bufferFragmentData(u,s,o,a,R||A)}else{if(!R&&!A)return void this.backtrack(s);s.gap=!0}}if(g){var w=g.startPTS,M=g.endPTS,F=g.startDTS,N=g.endDTS;o&&(o.elementaryStreams[B.AUDIO]={startPTS:w,endPTS:M,startDTS:F,endDTS:N}),s.setElementaryStreamInfo(B.AUDIO,w,M,F,N),this.bufferFragmentData(g,s,o,a)}if(c&&null!=h&&h.samples.length){var U={id:t,frag:s,details:c,samples:h.samples};r.trigger(O.FRAG_PARSING_METADATA,U)}if(c&&d){var G={id:t,frag:s,details:c,samples:d.samples};r.trigger(O.FRAG_PARSING_USERDATA,G)}}}else this.resetWhenMissingContext(a)},r.logMuxedErr=function(e){this.warn((G(e)?"Media":"Init")+" segment with muxed audiovideo where only video expected: "+e.url)},r._bufferInitSegment=function(e,t,r,i){var a=this;if(this.state===Hi.PARSING){this.audioOnly=!!t.audio&&!t.video,this.altAudio&&!this.audioOnly&&(delete t.audio,t.audiovideo&&this.logMuxedErr(r));var n=t.audio,s=t.video,o=t.audiovideo;if(n){var l=e.audioCodec,u=At(n.codec,l);if("mp4a"===u&&(u="mp4a.40.5"),this.audioCodecSwitch){u&&(u=-1!==u.indexOf("mp4a.40.5")?"mp4a.40.2":"mp4a.40.5");var d=n.metadata;d&&"channelCount"in d&&1!==(d.channelCount||1)&&!function(){if(void 0===ut){var e=ht.match(/Firefox\/(\d+)/i);ut=e?parseInt(e[1]):0}return ut}()&&(u="mp4a.40.5")}u&&-1!==u.indexOf("mp4a.40.5")&&/Android/.test(ht)&&"audio/mpeg"!==n.container&&(u="mp4a.40.2",this.log("Android: force audio codec to "+u)),l&&l!==u&&this.log('Swapping manifest audio codec "'+l+'" for "'+u+'"'),n.levelCodec=u,n.id=N.MAIN,this.log("Init audio buffer, container:"+n.container+", codecs[selected/level/parsed]=["+(u||"")+"/"+(l||"")+"/"+n.codec+"]"),delete t.audiovideo}if(s){s.levelCodec=e.videoCodec,s.id=N.MAIN;var h=s.codec;if(4===(null==h?void 0:h.length))switch(h){case"hvc1":case"hev1":s.codec="hvc1.1.6.L120.90";break;case"av01":s.codec="av01.0.04M.08";break;case"avc1":s.codec="avc1.42e01e"}this.log("Init video buffer, container:"+s.container+", codecs[level/parsed]=["+(e.videoCodec||"")+"/"+h+"]"+(s.codec!==h?" parsed-corrected="+s.codec:"")+(s.supplemental?" supplemental="+s.supplemental:"")),delete t.audiovideo}o&&(this.iframesOnly&&this.logMuxedErr(r),this.log("Init audiovideo buffer, container:"+o.container+", codecs[level/parsed]=["+e.codecs+"/"+o.codec+"]"),delete t.video,delete t.audio);var f=Object.keys(t);if(f.length){if(this.hls.trigger(O.BUFFER_CODECS,t),!this.hls)return;f.forEach((function(e){var n=t[e].initSegment;null!=n&&n.byteLength&&a.hls.trigger(O.BUFFER_APPENDING,{type:e,data:n,frag:r,part:null,chunkMeta:i,parent:r.type})}))}this.tickImmediate()}},r.getMainFwdBufferInfo=function(){var e=this.getBufferOutput();return this.getFwdBufferInfo(e,N.MAIN)},r.backtrack=function(e){this.couldBacktrack=!0,this.backtrackFragment=e,this.resetTransmuxer(),this.flushBufferGap(e),this.fragmentTracker.removeFragment(e),this.fragPrevious=null,this.nextLoadPosition=e.start,this.state=Hi.IDLE},a(t,[{key:"backtrackFragment",get:function(){return this._backtrackFragment},set:function(e){this._backtrackFragment=e}},{key:"couldBacktrack",get:function(){return this._couldBacktrack},set:function(e){this._couldBacktrack=e}},{key:"hasEnoughToStart",get:function(){return this._hasEnoughToStart}},{key:"maxBufferLength",get:function(){var e=this.levels,t=this.level,r=null==e?void 0:e[t];return r?this.getMaxBufferLength(r.maxBitrate):this.config.maxBufferLength}},{key:"nextLevel",get:function(){var e=this.nextBufferedFrag;return e?e.level:-1}},{key:"currentFrag",get:function(){var e;if(this.fragPlaying)return this.fragPlaying;var t=(null==(e=this.media)?void 0:e.currentTime)||this.lastCurrentTime;return _(t)?this.getAppendedFrag(t):null}},{key:"currentProgramDateTime",get:function(){var e,t=(null==(e=this.media)?void 0:e.currentTime)||this.lastCurrentTime;if(_(t)){var r=this.getLevelDetails(),i=this.currentFrag||(r?Wt(null,r.fragments,t):null);if(i){var a=i.programDateTime;if(null!==a){var n=a+1e3*(t-i.start);return new Date(n)}}}return null}},{key:"currentLevel",get:function(){var e=this.currentFrag;return e?e.level:-1}},{key:"nextBufferedFrag",get:function(){var e=this.currentFrag;return e?this.followingBufferedFrag(e):null}},{key:"forceStartLoad",get:function(){return this._forceStartLoad}}])}(Ki),xn=function(){function e(){this.requestTimeout=void 0,this.retryTimeout=void 0,this.retryDelay=0,this.config=null,this.callbacks=null,this.context=null,this.stats=new M}var t=e.prototype;return t.destroy=function(){this.callbacks=this.context=this.config=null,this.abortInternal(),this.stats=null},t.load=function(e,t,r){var i=this.stats;if(i.loading.start)throw new Error("Loader can only be used once.");i.loading.start=self.performance.now(),this.context=e,this.config=t,this.callbacks=r,this.loadInternal()},t.abort=function(){var e;this.abortInternal(),null!=(e=this.callbacks)&&e.onAbort&&this.callbacks.onAbort(this.stats,this.context,this.getNetworkDetails())},t.loadtimeout=function(){if(this.config){var e=this.config.loadPolicy.timeoutRetry;if(Z(e,this.stats.retry,!0))this.retry(e);else{var t;fe.warn("timeout while loading "+(null==(t=this.context)?void 0:t.url));var r=this.callbacks;r&&(this.abortInternal(),r.onTimeout(this.stats,this.context,this.getNetworkDetails()))}}},t.retry=function(e){var t=this,r=this.context,i=this.stats;this.retryDelay=Q(e,i.retry),i.retry++,fe.warn((status?"HTTP Status "+status:"Timeout")+" while loading "+(null==r?void 0:r.url)+", retrying "+i.retry+"/"+e.maxNumRetry+" in "+this.retryDelay+"ms"),this.abortInternal(),this.resetInternalLoader(),self.clearTimeout(this.retryTimeout),this.retryTimeout=self.setTimeout((function(){return t.loadInternal()}),this.retryDelay)},e}(),wn=function(){function e(){this.chunks=[],this.dataLength=0}var t=e.prototype;return t.push=function(e){this.chunks.push(e),this.dataLength+=e.length},t.flush=function(){var e,t=this.chunks,r=this.dataLength;return t.length?(e=1===t.length?t[0]:function(e,t){for(var r=new Uint8Array(t),i=0,a=0;a<e.length;a++){var n=e[a];r.set(n,i),i+=n.length}return r}(t,r),this.reset(),e):new Uint8Array(0)},t.reset=function(){this.chunks.length=0,this.dataLength=0},e}(),On=/(\d+)-(\d+)\/(\d+)/,Mn=function(e){function t(t){var r;return(r=e.call(this)||this).fetchSetup=void 0,r.request=null,r.response=null,r.controller=null,r.fetchSetup=t.fetchSetup||Fn,r}u(t,e);var r=t.prototype;return r.destroy=function(){this.request=null,e.prototype.destroy.call(this),this.response=null,this.controller=null,this.fetchSetup=null},r.abortInternal=function(){self.clearTimeout(this.retryTimeout),this.controller&&!this.stats.loading.end&&(this.stats.aborted=!0,this.controller.abort())},r.getNetworkDetails=function(){return this.response},r.resetInternalLoader=function(){this.response=null},r.loadInternal=function(){var e=this,t=this.config,r=this.context,i=this.stats;if(t&&r){i.loading.first=0,i.loaded=0,i.aborted=!1,this.controller=new self.AbortController;var a=function(e,t){var r={method:"GET",mode:"cors",credentials:"same-origin",signal:t,headers:new self.Headers(o({},e.headers))};return e.rangeEnd&&r.headers.set("Range","bytes="+e.rangeStart+"-"+String(e.rangeEnd-1)),r}(r,this.controller.signal),n="arraybuffer"===r.responseType,s=n?"byteLength":"length",l=t.loadPolicy,u=l.maxTimeToFirstByteMs,d=l.maxLoadTimeMs;this.request=this.fetchSetup(r,a),self.clearTimeout(this.requestTimeout),t.timeout=u&&_(u)?u:d,this.requestTimeout=self.setTimeout((function(){e.loadtimeout()}),t.timeout),(gn(this.request)?this.request.then(self.fetch):self.fetch(this.request)).then((function(a){var s;e.response=a;var o=Math.max(self.performance.now(),i.loading.start);if(self.clearTimeout(e.requestTimeout),t.timeout=d,e.requestTimeout=self.setTimeout((function(){e.loadtimeout()}),d-(o-i.loading.start)),!a.ok){var l=a.status,u=a.statusText;throw new Nn(u||"fetch, bad network response",l,a)}i.loading.first=o,i.total=function(e){var t=e.get("Content-Range");if(t){var r=function(e){var t=On.exec(e);if(t)return parseInt(t[2])-parseInt(t[1])+1}(t);if(_(r))return r}var i=e.get("Content-Length");if(i)return parseInt(i)}(a.headers)||i.total;var h=null==(s=e.callbacks)?void 0:s.onProgress;return h&&_(t.highWaterMark)?e.loadProgressively(a,i,r,t.highWaterMark,h):n?a.arrayBuffer():"json"===r.responseType?a.json():a.text()})).then((function(a){var n,o,l=e.response;if(!l)throw new Error("loader destroyed");self.clearTimeout(e.requestTimeout),i.loading.end=Math.max(self.performance.now(),i.loading.first);var u=a[s];u&&(i.loaded=i.total=u);var d={url:l.url,data:a,code:l.status},h=null==(n=e.callbacks)?void 0:n.onProgress;h&&!_(t.highWaterMark)&&h(i,r,a,l),null==(o=e.callbacks)||o.onSuccess(d,i,r,l)})).catch((function(a){if(self.clearTimeout(e.requestTimeout),!i.aborted){var n,s=a&&a.code||0,o=a?a.message:null,l=t.loadPolicy.errorRetry;Z(l,i.retry,!1,{url:r.url,data:void 0,code:s})?e.retry(l):(fe.error(s+" while loading "+r.url),null==(n=e.callbacks)||n.onError({code:s,text:o},r,a?a.details:null,i))}}))}},r.getCacheAge=function(){var e=null;if(this.response){var t=this.response.headers.get("age");e=t?parseFloat(t):null}return e},r.getResponseHeader=function(e){return this.response?this.response.headers.get(e):null},r.loadProgressively=function(e,t,r,i,a){void 0===i&&(i=0);var n=new wn,s=e.body.getReader(),o=function(){return s.read().then((function(s){if(s.done)return n.dataLength&&a(t,r,n.flush().buffer,e),Promise.resolve(new ArrayBuffer(0));var l=s.value,u=l.length;return t.loaded+=u,u<i||n.dataLength?(n.push(l),n.dataLength>=i&&a(t,r,n.flush().buffer,e)):a(t,r,l.buffer,e),o()})).catch((function(){return Promise.reject()}))};return o()},t}(xn);function Fn(e,t){return new self.Request(e.url,t)}var Nn=function(e){function t(t,r,i){var a;return(a=e.call(this,t)||this).code=void 0,a.details=void 0,a.code=r,a.details=i,a}return u(t,e),t}(v(Error)),Bn=/^age:\s*[\d.]+\s*$/im,Un=function(e){function t(t){var r;return(r=e.call(this)||this).xhrSetup=void 0,r.loader=null,r.xhrSetup=t.xhrSetup||null,r}u(t,e);var r=t.prototype;return r.destroy=function(){e.prototype.destroy.call(this),this.loader=null,this.xhrSetup=null},r.abortInternal=function(){var e=this.loader;self.clearTimeout(this.requestTimeout),self.clearTimeout(this.retryTimeout),e&&(e.onreadystatechange=null,e.onprogress=null,4!==e.readyState&&(this.stats.aborted=!0,e.abort()))},r.getNetworkDetails=function(){return this.loader},r.resetInternalLoader=function(){this.loader=null},r.loadInternal=function(){var e=this,t=this.config,r=this.context;if(t&&r){var i=this.loader=new self.XMLHttpRequest,a=this.stats;a.loading.first=0,a.loaded=0,a.aborted=!1;var n=this.xhrSetup;n?Promise.resolve().then((function(){if(e.loader===i&&!e.stats.aborted)return n.call(e,i,r.url,r)})).catch((function(t){if(e.loader===i&&!e.stats.aborted)return i.open("GET",r.url,!0),n.call(e,i,r.url,r)})).then((function(){e.loader!==i||e.stats.aborted||e.openAndSendXhr(i,r,t)})).catch((function(t){var n;null==(n=e.callbacks)||n.onError({code:i.status,text:t.message},r,i,a)})):this.openAndSendXhr(i,r,t)}},r.openAndSendXhr=function(e,t,r){e.readyState||e.open("GET",t.url,!0);var i=t.headers,a=r.loadPolicy,n=a.maxTimeToFirstByteMs,s=a.maxLoadTimeMs;if(i)for(var o in i)e.setRequestHeader(o,i[o]);t.rangeEnd&&e.setRequestHeader("Range","bytes="+t.rangeStart+"-"+(t.rangeEnd-1)),e.onreadystatechange=this.readystatechange.bind(this),e.onprogress=this.loadprogress.bind(this),e.responseType=t.responseType,self.clearTimeout(this.requestTimeout),r.timeout=n&&_(n)?n:s,this.requestTimeout=self.setTimeout(this.loadtimeout.bind(this),r.timeout),e.send()},r.readystatechange=function(){var e=this.context,t=this.loader,r=this.stats;if(e&&t){var i=t.readyState,a=this.config;if(!r.aborted&&i>=2&&(0===r.loading.first&&(r.loading.first=Math.max(self.performance.now(),r.loading.start),a.timeout!==a.loadPolicy.maxLoadTimeMs&&(self.clearTimeout(this.requestTimeout),a.timeout=a.loadPolicy.maxLoadTimeMs,this.requestTimeout=self.setTimeout(this.loadtimeout.bind(this),a.loadPolicy.maxLoadTimeMs-(r.loading.first-r.loading.start)))),4===i)){self.clearTimeout(this.requestTimeout),t.onreadystatechange=null,t.onprogress=null;var n=t.status,s="text"===t.responseType?t.responseText:null;if(n>=200&&n<300){var o=null!=s?s:t.response;if(null!=o){var l,u;r.loading.end=Math.max(self.performance.now(),r.loading.first);var d="arraybuffer"===t.responseType?o.byteLength:o.length;r.loaded=r.total=d,r.bwEstimate=8e3*r.total/(r.loading.end-r.loading.first);var h=null==(l=this.callbacks)?void 0:l.onProgress;h&&h(r,e,o,t);var f={url:t.responseURL,data:o,code:n};return e.rangeEnd&&d!==e.rangeEnd-e.rangeStart&&fe.warn("Payload length "+d+" does not match requested Range: bytes="+e.rangeStart+"-"+(e.rangeEnd-1)),void(null==(u=this.callbacks)||u.onSuccess(f,r,e,t))}}var c,g=a.loadPolicy.errorRetry;Z(g,r.retry,!1,{url:e.url,data:void 0,code:n})?this.retry(g):(fe.error(n+" while loading "+e.url),null==(c=this.callbacks)||c.onError({code:n,text:t.statusText},e,t,r))}}},r.loadprogress=function(e){var t=this.stats;t.loaded=e.loaded,e.lengthComputable&&(t.total=e.total)},r.getCacheAge=function(){var e=null;if(this.loader&&Bn.test(this.loader.getAllResponseHeaders())){var t=this.loader.getResponseHeader("age");e=t?parseFloat(t):null}return e},r.getResponseHeader=function(e){return this.loader&&new RegExp("^"+e+":\\s*[\\d.]+\\s*$","im").test(this.loader.getAllResponseHeaders())?this.loader.getResponseHeader(e):null},t}(xn),Gn={maxTimeToFirstByteMs:8e3,maxLoadTimeMs:2e4,timeoutRetry:null,errorRetry:null},Vn=f(f({autoStartLoad:!0,startPosition:-1,defaultAudioCodec:void 0,debug:!1,capLevelOnFPSDrop:!1,capLevelToPlayerSize:!1,ignoreDevicePixelRatio:!1,maxDevicePixelRatio:Number.POSITIVE_INFINITY,preferManagedMediaSource:!1,initialLiveManifestSize:1,maxBufferLength:30,backBufferLength:1/0,frontBufferFlushThreshold:1/0,loopBackBufferFlush:void 0,startOnSegmentBoundary:!1,nextAudioTrackBufferFlushForwardOffset:.25,maxBufferSize:6e7,maxFragLookUpTolerance:.25,maxBufferHole:.1,detectStallWithCurrentTimeMs:1250,highBufferWatchdogPeriod:2,nudgeOffset:.1,nudgeMaxRetry:3,nudgeOnVideoHole:!0,skipBufferHolePadding:.1,liveSyncMode:"edge",liveSyncDurationCount:3,liveSyncOnStallIncrease:1,liveMaxLatencyDurationCount:1/0,liveMaxUnchangedPlaylistRefresh:1/0,liveSyncDuration:void 0,liveMaxLatencyDuration:void 0,maxLiveSyncPlaybackRate:1,liveDurationInfinity:!1,liveBackBufferLength:null,maxMaxBufferLength:600,enableWorker:!0,workerPath:null,enableSoftwareAES:!0,startLevel:void 0,startFragPrefetch:!1,fpsDroppedMonitoringPeriod:5e3,fpsDroppedMonitoringThreshold:.2,appendErrorMaxRetry:3,appendTimeout:1/0,ignorePlaylistParsingErrors:!1,loader:Un,fLoader:void 0,pLoader:void 0,xhrSetup:void 0,licenseXhrSetup:void 0,licenseResponseCallback:void 0,stretchShortVideoTrack:!1,maxAudioFramesDrift:1,forceKeyFrameOnDiscontinuity:!0,handleMpegTsVideoIntegrityErrors:"process",abrEwmaFastLive:3,abrEwmaSlowLive:9,abrEwmaFastVoD:3,abrEwmaSlowVoD:9,abrEwmaDefaultEstimate:5e5,abrEwmaDefaultEstimateMax:5e6,abrBandWidthFactor:.95,abrBandWidthUpFactor:.7,abrMaxWithRealBitrate:!1,abrSwitchInterval:0,maxStarvationDelay:4,maxLoadingDelay:4,minAutoBitrate:0,emeEnabled:!1,widevineLicenseUrl:void 0,drmSystems:{},drmSystemOptions:{},requestMediaKeySystemAccessFunc:null,requireKeySystemAccessOnStart:!1,testBandwidth:!0,progressive:!1,lowLatencyMode:!0,cmcd:void 0,enableDateRangeMetadataCues:!0,enableEmsgMetadataCues:!0,enableEmsgKLVMetadata:!1,enableID3MetadataCues:!0,emsgKLVSchemaUri:void 0,enableInterstitialPlayback:!1,interstitialAppendInPlace:!0,interstitialLiveLookAhead:10,iframeCacheLimit:2097152,useMediaCapabilities:!1,preserveManualLevelOnError:!1,errorPenaltyExpireMs:0,certLoadPolicy:{default:Gn},keyLoadPolicy:{default:{maxTimeToFirstByteMs:8e3,maxLoadTimeMs:2e4,timeoutRetry:{maxNumRetry:1,retryDelayMs:1e3,maxRetryDelayMs:2e4,backoff:"linear"},errorRetry:{maxNumRetry:8,retryDelayMs:1e3,maxRetryDelayMs:2e4,backoff:"linear"}}},manifestLoadPolicy:{default:{maxTimeToFirstByteMs:1/0,maxLoadTimeMs:2e4,timeoutRetry:{maxNumRetry:2,retryDelayMs:0,maxRetryDelayMs:0},errorRetry:{maxNumRetry:1,retryDelayMs:1e3,maxRetryDelayMs:8e3}}},playlistLoadPolicy:{default:{maxTimeToFirstByteMs:1e4,maxLoadTimeMs:2e4,timeoutRetry:{maxNumRetry:2,retryDelayMs:0,maxRetryDelayMs:0},errorRetry:{maxNumRetry:2,retryDelayMs:1e3,maxRetryDelayMs:8e3}}},fragLoadPolicy:{default:{maxTimeToFirstByteMs:1e4,maxLoadTimeMs:12e4,timeoutRetry:{maxNumRetry:4,retryDelayMs:0,maxRetryDelayMs:0},errorRetry:{maxNumRetry:6,retryDelayMs:1e3,maxRetryDelayMs:8e3}}},steeringManifestLoadPolicy:{default:{maxTimeToFirstByteMs:1e4,maxLoadTimeMs:2e4,timeoutRetry:{maxNumRetry:2,retryDelayMs:0,maxRetryDelayMs:0},errorRetry:{maxNumRetry:1,retryDelayMs:1e3,maxRetryDelayMs:8e3}}},interstitialAssetListLoadPolicy:{default:Gn},manifestLoadingTimeOut:1e4,manifestLoadingMaxRetry:1,manifestLoadingRetryDelay:1e3,manifestLoadingMaxRetryTimeout:64e3,levelLoadingTimeOut:1e4,levelLoadingMaxRetry:4,levelLoadingRetryDelay:1e3,levelLoadingMaxRetryTimeout:64e3,fragLoadingTimeOut:2e4,fragLoadingMaxRetry:6,fragLoadingRetryDelay:1e3,fragLoadingMaxRetryTimeout:64e3,streamController:Pn,abrController:Ht,bufferController:pr,capLevelController:Ar,errorController:ar,fpsController:pi,id3TrackController:ea,gapController:Yi,latencyController:ta},{cueHandler:ge,enableWebVTT:!1,enableIMSC1:!1,enableCEA708Captions:!1,captionsTextTrack1Label:"English",captionsTextTrack1LanguageCode:"en",captionsTextTrack2Label:"Spanish",captionsTextTrack2LanguageCode:"es",captionsTextTrack3Label:"Unknown CC",captionsTextTrack3LanguageCode:"",captionsTextTrack4Label:"Unknown CC",captionsTextTrack4LanguageCode:"",renderTextTracksNatively:!0}),{},{subtitleStreamController:void 0,subtitleTrackController:void 0,timelineController:void 0,audioStreamController:void 0,audioTrackController:void 0,emeController:void 0,cmcdController:void 0,contentSteeringController:gi,iframeController:void 0,interstitialsController:void 0});function Hn(e,t,r){if((t.liveSyncDurationCount||t.liveMaxLatencyDurationCount)&&(t.liveSyncDuration||t.liveMaxLatencyDuration))throw new Error("Illegal hls.js config: don't mix up liveSyncDurationCount/liveMaxLatencyDurationCount and liveSyncDuration/liveMaxLatencyDuration");if(void 0!==t.liveMaxLatencyDurationCount&&(void 0===t.liveSyncDurationCount||t.liveMaxLatencyDurationCount<=t.liveSyncDurationCount))throw new Error('Illegal hls.js config: "liveMaxLatencyDurationCount" must be greater than "liveSyncDurationCount"');if(void 0!==t.liveMaxLatencyDuration&&(void 0===t.liveSyncDuration||t.liveMaxLatencyDuration<=t.liveSyncDuration))throw new Error('Illegal hls.js config: "liveMaxLatencyDuration" must be greater than "liveSyncDuration"');if(void 0!==t.liveMaxUnchangedPlaylistRefresh){var i=t.liveMaxUnchangedPlaylistRefresh,a=(n=i,s=2,o=1/0,Math.max(s,Math.min(n,o)));a!==i&&r.warn('hls.js config: "liveMaxUnchangedPlaylistRefresh" clamped from '+i+" to "+a+"."),t.liveMaxUnchangedPlaylistRefresh=a}var n,s,o,l=Kn(e),u=["TimeOut","MaxRetry","RetryDelay","MaxRetryTimeout"];return["manifest","level","frag"].forEach((function(e){var i=("level"===e?"playlist":e)+"LoadPolicy",a=void 0===t[i],n=[];u.forEach((function(r){var s=e+"Loading"+r,o=t[s];if(void 0!==o&&a){n.push(s);var u=l[i].default;switch(t[i]={default:u},r){case"TimeOut":u.maxLoadTimeMs=o,u.maxTimeToFirstByteMs=o;break;case"MaxRetry":u.errorRetry.maxNumRetry=o,u.timeoutRetry.maxNumRetry=o;break;case"RetryDelay":u.errorRetry.retryDelayMs=o,u.timeoutRetry.retryDelayMs=o;break;case"MaxRetryTimeout":u.errorRetry.maxRetryDelayMs=o,u.timeoutRetry.maxRetryDelayMs=o}}})),n.length&&r.warn('hls.js config: "'+n.join('", "')+'" setting(s) are deprecated, use "'+i+'": '+Bt(t[i]))})),f(f({},l),t)}function Kn(e){return e&&"object"==typeof e?Array.isArray(e)?e.map(Kn):Object.keys(e).reduce((function(t,r){return t[r]=Kn(e[r]),t}),{}):e}function Yn(e,t){var r=e.loader;r!==Mn&&r!==Un?(t.log("[config]: Custom loader detected, cannot enable progressive streaming"),e.progressive=!1):function(){if(self.fetch&&self.AbortController&&self.ReadableStream&&self.Request)try{return new self.ReadableStream({}),!0}catch(e){}return!1}()&&(e.loader=Mn,e.progressive=!0,e.enableSoftwareAES=!0,t.log("[config]: Progressive streaming enabled, using FetchLoader"))}var Wn=function(e){function t(t,r){var i;return(i=e.call(this,r,t.logger)||this).hls=void 0,i.canLoad=!1,i.timer=-1,i.loadingSync=!1,i.hls=t,i}u(t,e);var r=t.prototype;return r.destroy=function(){this.clearTimer(),this.hls=null},r.clearTimer=function(){-1!==this.timer&&(self.clearTimeout(this.timer),this.timer=-1)},r.startLoad=function(){this.canLoad=!0,this.loadPlaylist()},r.stopLoad=function(){this.canLoad=!1,this.clearTimer()},r.switchParams=function(e,t,r){var i=null==t?void 0:t.renditionReports;if(i){for(var a=-1,n=0;n<i.length;n++){var s=i[n],o=void 0;try{o=new self.URL(s.URI,t.url).href}catch(e){this.warn("Could not construct new URL for Rendition Report: "+e),o=s.URI||""}if(o===e){a=n;break}o===e.substring(0,o.length)&&(a=n)}if(-1!==a){var l=i[a],u=parseInt(l["LAST-MSN"])||t.lastPartSn,d=parseInt(l["LAST-PART"])||t.lastPartIndex;if(this.hls.config.lowLatencyMode){var h=Math.min(t.age-t.partTarget,t.targetduration);d>=0&&h>t.partTarget&&(d+=1)}var f=r&&wt(r);return new Ot(u,d>=0?d:void 0,f)}}},r.loadPlaylist=function(e){this.clearTimer()},r.loadingPlaylist=function(e,t){this.clearTimer()},r.shouldLoadPlaylist=function(e){return this.canLoad&&!!e&&!!e.url&&(!e.details||e.details.live)},r.getUrlWithDirectives=function(e,t){if(t)try{return t.addDirectives(e)}catch(e){this.warn("Could not construct new URL with HLS Delivery Directives: "+e)}return e},r.playlistLoaded=function(e,t,r){var i=t.details,a=t.stats,n=i.fragments,s=self.performance.now(),o=a.loading.first?Math.max(0,Math.floor(s-a.loading.first)):0;i.advancedDateTime=Date.now()-o;var l=this.hls.config.timelineOffset;if(l!==i.appliedTimelineOffset){var u=Math.max(l||0,0);i.appliedTimelineOffset=u,n.forEach((function(e){null==e||e.setStart(e.playlistOffset+u)}))}if(i.live||null!=r&&r.live){var d,h="levelInfo"in t?t.levelInfo:t.track;i.reloaded(r);var f=null==(d=n[n.length-1])?void 0:d.type;if(i.misses>=this.hls.config.liveMaxUnchangedPlaylistRefresh){var c=new Error(f+" playlist "+h.id+" hit max allowed unchanged reloads.");this.warn(c);var g=t.networkDetails,v=t.context;return void this.hls.trigger(O.ERROR,{type:x.NETWORK_ERROR,details:w.PLAYLIST_UNCHANGED_ERROR,fatal:!1,url:i.url,error:c,reason:c.message,level:t.level,parent:f,context:v,networkDetails:g,stats:a})}if(r){ai(r,i,this);var m=i.playlistParsingError;if(m){this.warn(m);var p=this.hls;if(!p.config.ignorePlaylistParsingErrors){var y=t.networkDetails;return void p.trigger(O.ERROR,{type:x.NETWORK_ERROR,details:w.LEVEL_PARSING_ERROR,fatal:!1,url:i.url,error:m,reason:m.message,level:t.level,parent:f,networkDetails:y,stats:a})}i.playlistParsingError=null}}-1===i.requestScheduled&&(i.requestScheduled=a.loading.start);var E=this.hls.mainForwardBufferInfo,T=E?E.end-E.len:0,S=oi(i,1e3*(i.edge-T));i.requestScheduled+S<s?i.requestScheduled=s:i.requestScheduled<=s&&(i.requestScheduled+=S);var L,R=t.deliveryDirectives;if(this.log("live playlist "+e+" "+(i.advanced?"REFRESHED "+i.lastPartSn+" - "+i.lastPartIndex:i.updated?"UPDATED":"MISSED (received "+i.lastPartSn+" - "+i.lastPartIndex+(R?" | requested "+R.msn+" - "+R.part:"")+")")),!this.canLoad||!i.live)return;var A=void 0,b=void 0;if(i.canBlockReload&&i.advanced){var k=this.hls.config.lowLatencyMode,D=i.lastPartSn,I=i.endSN,_=i.lastPartIndex,C=D===I;-1!==_?C?(A=I+1,b=k?0:_):(A=D,b=k?_+1:i.maxPartIndex):A=I+1;var P=i.age,M=P+i.ageHeader,F=Math.min(M-i.partTarget,1.5*i.targetduration);if(F>0){if(M>3*i.targetduration)this.log("Playlist last advanced "+P.toFixed(2)+"s ago. Omitting segment and part directives."),A=void 0,b=void 0;else if(null!=r&&r.tuneInGoal&&M-i.partTarget>r.tuneInGoal)this.warn("CDN Tune-in goal increased from: "+r.tuneInGoal+" to: "+F+" with playlist age: "+i.age),F=0;else{var N=Math.floor(F/i.targetduration);A+=N,void 0!==b&&(b+=Math.round(F%i.targetduration/i.partTarget)),this.log("CDN Tune-in age: "+i.ageHeader+"s last advanced "+P.toFixed(2)+"s goal: "+F+" skip sn "+N+" to part "+b)}i.tuneInGoal=F}if(L=this.getDeliveryDirectives(i,t.deliveryDirectives,A,b),k||!C)return i.requestScheduled=s,void this.loadingPlaylist(h,L)}else(i.canBlockReload||i.canSkipUntil)&&(L=this.getDeliveryDirectives(i,t.deliveryDirectives,A,b));L&&void 0!==A&&i.canBlockReload&&(i.requestScheduled=a.loading.first+Math.max(S-2*o,S/2)),this.scheduleLoading(h,L,i)}else this.clearTimer()},r.scheduleLoading=function(e,t,r){var i=this,a=r||e.details;if(a){var n=self.performance.now(),s=a.requestScheduled;if(n>=s&&!this.loadingSync)return this.loadingSync=!0,this.loadingPlaylist(e,t),void(this.loadingSync=!1);var o=Math.max(s-n,0);this.log("reload live playlist "+(e.name||e.bitrate+"bps")+" in "+Math.round(o)+" ms"),this.clearTimer(),this.timer=self.setTimeout((function(){return i.loadingPlaylist(e,t)}),o)}else this.loadingPlaylist(e,t)},r.getDeliveryDirectives=function(e,t,r,i){var a=wt(e);return null!=t&&t.skip&&e.deltaUpdateFailed&&(r=t.msn,i=t.part,a=Ct),new Ot(r,i,a)},r.checkRetry=function(e){var t=this,r=e.details,i=j(e),a=e.errorAction,n=a||{},s=n.action,o=n.retryCount,l=void 0===o?0:o,u=n.retryConfig,d=!!a&&!!u&&(s===$t||!a.resolved&&s===zt);if(d){var h;if(l>=u.maxNumRetry)return!1;if(i&&null!=(h=e.context)&&h.deliveryDirectives)this.warn("Retrying playlist loading "+(l+1)+"/"+u.maxNumRetry+' after "'+r+'" without delivery-directives'),this.loadPlaylist();else{var f,c=J(null==(f=e.response)?void 0:f.code);if(this.clearTimer(),c)this.log("Waiting for connection (offline)"),e.reason="offline",this.timer=self.setTimeout((function(){return t.checkOfflineStatus()}),1e3);else{var g=Q(u,l);this.warn("Retrying playlist loading "+(l+1)+"/"+u.maxNumRetry+' after "'+r+'" in '+g+"ms"),this.timer=self.setTimeout((function(){return t.loadPlaylist()}),g)}}e.levelRetry=!0,a.resolved=!0}return d},r.checkOfflineStatus=function(){var e=this;this.clearTimer(),J(0)?this.timer=self.setTimeout((function(){return e.checkOfflineStatus()}),1e3):(this.log("Connection restored (online)"),this.loadPlaylist())},t}(ie),jn=function(e){function t(t,r){var i;return(i=e.call(this,t,"level-controller")||this)._levels=[],i._firstLevel=-1,i._maxAutoLevel=-1,i._startLevel=void 0,i.currentLevel=null,i.currentLevelIndex=-1,i.manualLevelIndex=-1,i.steering=void 0,i.lastABRSwitchTime=-1,i._iframeVariants=[],i.onParsedComplete=void 0,i.steering=r,i._registerListeners(),i}u(t,e);var r=t.prototype;return r._registerListeners=function(){var e=this.hls;e.on(O.MANIFEST_LOADING,this.onManifestLoading,this),e.on(O.MANIFEST_LOADED,this.onManifestLoaded,this),e.on(O.LEVEL_LOADED,this.onLevelLoaded,this),e.on(O.LEVELS_UPDATED,this.onLevelsUpdated,this),e.on(O.FRAG_BUFFERED,this.onFragBuffered,this),e.on(O.ERROR,this.onError,this)},r._unregisterListeners=function(){var e=this.hls;e.off(O.MANIFEST_LOADING,this.onManifestLoading,this),e.off(O.MANIFEST_LOADED,this.onManifestLoaded,this),e.off(O.LEVEL_LOADED,this.onLevelLoaded,this),e.off(O.LEVELS_UPDATED,this.onLevelsUpdated,this),e.off(O.FRAG_BUFFERED,this.onFragBuffered,this),e.off(O.ERROR,this.onError,this)},r.destroy=function(){this._unregisterListeners(),this.steering=null,this.resetLevels(),e.prototype.destroy.call(this)},r.stopLoad=function(){this._levels.forEach((function(e){e.loadError=0,e.fragmentError=0})),e.prototype.stopLoad.call(this)},r.resetLevels=function(){this._startLevel=void 0,this.manualLevelIndex=-1,this.currentLevelIndex=-1,this.currentLevel=null,this._levels=[],this._maxAutoLevel=-1,this._iframeVariants=[]},r.onManifestLoading=function(e,t){this.resetLevels()},r.onManifestLoaded=function(e,t){var r=this,i=this.hls.config.preferManagedMediaSource,a=[],n={},s={},o=!1,l=!1,u=!1,d=!1;t.levels.forEach((function(e){var t=e.attrs,h=zn(e,i),f=e.audioCodec,c=e.videoCodec,g=e.imageCodec,v=e.width,m=e.height;if(h){o||(o=!(!v||!m)),l||(l=!!c),u||(u=!!f),d||(d=!!g);var p=t.CODECS,y=t["FRAME-RATE"],E=t["HDCP-LEVEL"],T=t["PATHWAY-ID"],S=t.RESOLUTION,L=t["VIDEO-RANGE"],R=(T||".")+"-"+e.bitrate+"-"+S+"-"+y+"-"+p+"-"+L+"-"+E;if(n[R])if(n[R].uri===e.url||e.attrs["PATHWAY-ID"])e.iframes||(n[R].addGroupId("audio",t.AUDIO),n[R].addGroupId("text",t.SUBTITLES));else{var A=s[R]+=1;e.attrs["PATHWAY-ID"]=new Array(A+1).join(".");var b=r.createLevel(e);n[R]=b,a.push(b)}else{var k=r.createLevel(e);n[R]=k,s[R]=1,a.push(k)}}else r.log('Some or all CODECS not supported "'+t.CODECS+'"')})),this.filterAndSortMediaOptions(a,t,o,l,u,d)},r.createLevel=function(e){var t=new Mt(e),r=e.supplemental;if(null!=r&&r.videoCodec&&!Xn(r.videoCodec,this.hls.config.preferManagedMediaSource)){var i=new Error('SUPPLEMENTAL-CODECS not supported "'+r.videoCodec+'"');this.log(i.message),t.supportedResult=ce.getUnsupportedResult(i,[])}return t},r.filterAndSortMediaOptions=function(e,t,r,i,a,n){var s,o=this,l=[],u=[],d=e,h=(null==(s=t.stats)?void 0:s.parsing)||{},f=this.hls.config.preferManagedMediaSource;if((r||i)&&a&&(d=d.filter((function(e){var t,r=e.videoCodec,i=e.videoRange,a=e.width,n=e.height;return(!!r||!(!a||!n))&&!!(t=i)&&_t.indexOf(t)>-1}))),i&&n&&(d=d.filter((function(e){return!e.imageCodec}))),0===d.length)return Promise.resolve().then((function(){if(o.hls){var e="no level with compatible codecs found in manifest",r=e;t.levels.length&&(r="one or more CODECS in variant not supported: "+Bt(t.levels.map((function(e){return e.attrs.CODECS})).filter((function(e,t,r){return r.indexOf(e)===t}))),o.warn(r),e+=" ("+r+")");var i=new Error(e);o.hls.trigger(O.ERROR,{type:x.MEDIA_ERROR,details:w.MANIFEST_INCOMPATIBLE_CODECS_ERROR,fatal:!0,url:t.url,error:i,reason:r})}})),void(h.end=performance.now());t.audioTracks&&Qn(l=t.audioTracks.filter((function(e){return!e.audioCodec||qn(e.audioCodec,f)}))),t.subtitles&&Qn(u=t.subtitles);var c=d.slice(0);d.sort((function(e,t){if(e.attrs["HDCP-LEVEL"]!==t.attrs["HDCP-LEVEL"])return(e.attrs["HDCP-LEVEL"]||"")>(t.attrs["HDCP-LEVEL"]||"")?1:-1;if(r&&e.height!==t.height)return e.height-t.height;if(e.frameRate!==t.frameRate)return e.frameRate-t.frameRate;if(e.videoRange!==t.videoRange)return _t.indexOf(e.videoRange)-_t.indexOf(t.videoRange);if(e.videoCodec!==t.videoCodec){var i=Et(e.videoCodec),a=Et(t.videoCodec);if(i!==a)return a-i}if(e.uri===t.uri&&e.codecSet!==t.codecSet){var n=Tt(e.codecSet),s=Tt(t.codecSet);if(n!==s)return s-n}return e.averageBitrate!==t.averageBitrate?e.averageBitrate-t.averageBitrate:0}));var g=c[0];if(this.steering&&(d=this.steering.filterParsedLevels(d)).length!==c.length)for(var v=0;v<c.length;v++)if(c[v].pathwayId===d[0].pathwayId){g=c[v];break}this._levels=d;for(var m=0;m<d.length;m++)if(d[m]===g){var p;this._firstLevel=m;var y=g.bitrate,E=this.hls.bandwidthEstimate;if(this.log("manifest loaded, "+d.length+" level(s) found, first bitrate: "+y),void 0===(null==(p=this.hls.userConfig)?void 0:p.abrEwmaDefaultEstimate)){var T=Math.min(y,this.hls.config.abrEwmaDefaultEstimateMax);T>E&&E===this.hls.abrEwmaDefaultEstimate&&(this.hls.bandwidthEstimate=T)}break}var S=t.iframeVariants.filter((function(e){return zn(e,f)}));this._iframeVariants=S;var L=a&&!i,R=this.hls.config,A=!(!R.audioStreamController||!R.audioTrackController),b={levels:d,audioTracks:l,subtitleTracks:u,iframeVariants:S,sessionData:t.sessionData,sessionKeys:t.sessionKeys,firstLevel:this._firstLevel,stats:t.stats,audio:a,video:i,altAudio:A&&!L&&l.some((function(e){return!!e.url}))};h.end=performance.now(),this.hls.trigger(O.MANIFEST_PARSED,b)},r.onError=function(e,t){!t.fatal&&t.context&&t.context.type===F.LEVEL&&t.context.level===this.level&&this.checkRetry(t)},r.onFragBuffered=function(e,t){var r=t.frag;if(r.type===N.MAIN){var i=r.elementaryStreams;if(!Object.keys(i).some((function(e){return!!i[e]})))return;var a=this._levels[r.level];null!=a&&a.loadError&&(this.log("Resetting level error count of "+a.loadError+" on frag buffered"),a.loadError=0)}},r.onLevelLoaded=function(e,t){var r,i,a=t.level,n=t.details,s=t.levelInfo;if(!s)return this.warn("Invalid level index "+a),void(null!=(i=t.deliveryDirectives)&&i.skip&&(n.deltaUpdateFailed=!0));if(s===this.currentLevel||t.withoutMultiVariant){0===s.fragmentError&&(s.loadError=0);var o=s.details;o===t.details&&o.advanced&&(o=void 0),this.playlistLoaded(a,t,o)}else null!=(r=t.deliveryDirectives)&&r.skip&&(n.deltaUpdateFailed=!0)},r.loadPlaylist=function(t){e.prototype.loadPlaylist.call(this),this.shouldLoadPlaylist(this.currentLevel)&&this.scheduleLoading(this.currentLevel,t)},r.loadingPlaylist=function(t,r){e.prototype.loadingPlaylist.call(this,t,r);var i=this.getUrlWithDirectives(t.uri,r),a=this.currentLevelIndex,n=t.attrs["PATHWAY-ID"],s=t.details,o=null==s?void 0:s.age;this.log("Loading level index "+a+(void 0!==(null==r?void 0:r.msn)?" at sn "+r.msn+" part "+r.part:"")+(n?" Pathway "+n:"")+(o&&s.live?" age "+o.toFixed(1)+(s.type&&" "+s.type||""):"")+" "+i),this.hls.trigger(O.LEVEL_LOADING,{url:i,level:a,levelInfo:t,pathwayId:t.attrs["PATHWAY-ID"],id:0,deliveryDirectives:r||null})},r.removeLevel=function(e){var t,r=this;if(1!==this._levels.length){var i=this._levels.filter((function(t,i){return i!==e||(r.steering&&r.steering.removeLevel(t),t===r.currentLevel&&(r.currentLevel=null,r.currentLevelIndex=-1,t.details&&t.details.fragments.forEach((function(e){return e.level=-1}))),!1)}));hi(i),this._levels=i,this.currentLevelIndex>-1&&null!=(t=this.currentLevel)&&t.details&&(this.currentLevelIndex=this.currentLevel.details.fragments[0].level),this.manualLevelIndex>-1&&(this.manualLevelIndex=this.currentLevelIndex);var a=i.length-1;this._firstLevel=Math.min(this._firstLevel,a),this._startLevel&&(this._startLevel=Math.min(this._startLevel,a)),this.hls.trigger(O.LEVELS_UPDATED,{levels:i})}},r.onLevelsUpdated=function(e,t){var r=t.levels;this._levels=r},r.checkMaxAutoUpdated=function(){var e=this.hls,t=e.autoLevelCapping,r=e.maxAutoLevel,i=e.maxHdcpLevel;this._maxAutoLevel!==r&&(this._maxAutoLevel=r,this.hls.trigger(O.MAX_AUTO_LEVEL_UPDATED,{autoLevelCapping:t,levels:this.levels,maxAutoLevel:r,minAutoLevel:this.hls.minAutoLevel,maxHdcpLevel:i}))},a(t,[{key:"iframeVariants",get:function(){return 0===this._iframeVariants.length?null:this._iframeVariants}},{key:"levels",get:function(){return 0===this._levels.length?null:this._levels}},{key:"loadLevelObj",get:function(){return this.currentLevel}},{key:"level",get:function(){return this.currentLevelIndex},set:function(e){var t=this._levels;if(0!==t.length){if(e<0||e>=t.length){var r=new Error("invalid level idx"),i=e<0;if(this.hls.trigger(O.ERROR,{type:x.OTHER_ERROR,details:w.LEVEL_SWITCH_ERROR,level:e,fatal:i,error:r,reason:r.message}),i)return;e=Math.min(e,t.length-1)}var a=this.currentLevelIndex,n=this.currentLevel,s=n?n.attrs["PATHWAY-ID"]:void 0,o=t[e],l=o.attrs["PATHWAY-ID"];if(this.currentLevelIndex=e,this.currentLevel=o,a!==e||!n||s!==l){this.log("Switching to level "+e+" ("+(o.height?o.height+"p ":"")+(o.videoRange?o.videoRange+" ":"")+(o.codecSet?o.codecSet+" ":"")+"@"+o.bitrate+")"+(l?" with Pathway "+l:"")+" from level "+a+(s?" with Pathway "+s:""));var u={level:e,attrs:o.attrs,details:o.details,bitrate:o.bitrate,averageBitrate:o.averageBitrate,maxBitrate:o.maxBitrate,realBitrate:o.realBitrate,width:o.width,height:o.height,codecSet:o.codecSet,audioCodec:o.audioCodec,videoCodec:o.videoCodec,audioGroups:o.audioGroups,subtitleGroups:o.subtitleGroups,loaded:o.loaded,loadError:o.loadError,fragmentError:o.fragmentError,name:o.name,id:o.id,uri:o.uri,url:o.url,urlId:0,audioGroupIds:o.audioGroupIds,textGroupIds:o.textGroupIds};this.hls.trigger(O.LEVEL_SWITCHING,u);var d=o.details;if(!d||d.live){var h=this.switchParams(o.uri,null==n?void 0:n.details,d);this.loadPlaylist(h)}}}}},{key:"manualLevel",get:function(){return this.manualLevelIndex},set:function(e){this.manualLevelIndex=e,void 0===this._startLevel&&(this._startLevel=e),-1!==e&&(this.level=e)}},{key:"firstLevel",get:function(){return this._firstLevel},set:function(e){this._firstLevel=e}},{key:"startLevel",get:function(){if(void 0===this._startLevel){var e=this.hls.config.startLevel;return void 0!==e?e:this.hls.firstAutoLevel}return this._startLevel},set:function(e){this._startLevel=e}},{key:"pathways",get:function(){return this.steering?this.steering.pathways():[]}},{key:"pathwayPriority",get:function(){return this.steering?this.steering.pathwayPriority:null},set:function(e){if(this.steering){var t=this.steering.pathways(),r=e.filter((function(e){return-1!==t.indexOf(e)}));if(e.length<1)return void this.warn("pathwayPriority "+e+" should contain at least one pathway from list: "+t);this.steering.pathwayPriority=r}}},{key:"nextLoadLevel",get:function(){return-1!==this.manualLevelIndex?this.manualLevelIndex:this.hls.nextAutoLevel},set:function(e){var t=this.currentLevelIndex;if(-1===this.manualLevelIndex&&e!==t&&-1!==e){var r=this.hls.config.abrSwitchInterval;if(r>0){var i=performance.now(),a=i-this.lastABRSwitchTime,n=1e3*r;if(this.lastABRSwitchTime>-1&&a<n)return void this.warn("Preventing ABR level switch: "+t+" -> "+e+" ("+Math.round(a)+"ms < "+n+"ms / "+r+"s)");this.lastABRSwitchTime=i,this.log("Allowing ABR level switch: "+t+" -> "+e+" ("+Math.round(a)+"ms >= "+n+"ms / "+r+"s)")}}this.level=e,-1===this.manualLevelIndex&&(this.hls.nextAutoLevel=e)}}])}(Wn);function qn(e,t){return mt(e,"audio",t)}function Xn(e,t){return mt(e,"video",t)}function zn(e,t){var r=e.audioCodec,i=e.videoCodec;r&&(e.audioCodec=r=Rt(r,t)||void 0),i&&(i=e.videoCodec=function(e){for(var t=e.split(","),r=0;r<t.length;r++){var i=t[r].split(".");i.length>2&&"avc1"===i[0]&&(t[r]="avc1."+parseInt(i[1]).toString(16)+("000"+parseInt(i[2]).toString(16)).slice(-4))}return t.join(",")}(i));var a=e.unknownCodecs;return!((null==a?void 0:a.length)||r&&!qn(r,t)||i&&!Xn(i,t))}function Qn(e){var t={};e.forEach((function(e){var r=e.groupId||"";e.id=t[r]=t[r]||0,t[r]++}))}var $n=function(e){function t(t,r){var i;return(i=e.call(this,"key-loader",r)||this).config=void 0,i.keyLoaderInfo={},i.emeController=null,i.config=t,i}u(t,e);var r=t.prototype;return r.abort=function(e){for(var t in this.keyLoaderInfo){var r=this.keyLoaderInfo[t].loader;if(r){var i;if(e&&e!==(null==(i=r.context)?void 0:i.frag.type))return;r.abort()}}},r.destroy=function(){for(var e in this.keyLoaderInfo){var t=this.keyLoaderInfo[e].loader;t&&t.destroy()}this.emeController=null,this.keyLoaderInfo={}},r.loadClear=function(e,t,r){return this.emeController?this.emeController.loadClear(e,t,r):null},r.load=function(e,t){var r=this;return!e.decryptdata&&e.encrypted&&this.emeController&&this.config.emeEnabled?this.emeController.selectKeySystemFormat(e).then((function(i){return r.loadInternal(e,t,i)})):this.loadInternal(e,t)},r.loadInternal=function(e,t,r){var i=this,a=e.decryptdata;if(!a){var n=new Error(r?"Expected frag.decryptdata to be defined after setting format "+r:"Missing decryption data on fragment in onKeyLoading (emeEnabled with controller: "+(this.emeController&&this.config.emeEnabled)+")");return Promise.reject(Zn(e,w.KEY_LOAD_ERROR,n))}var s=e;switch(a.method){case"SAMPLE-AES":case"SAMPLE-AES-CENC":case"SAMPLE-AES-CTR":return"identity"===a.keyFormat?this.loadKeyHTTP(s):t?t.then((function(){return i.loadKeyEME(s)})):this.loadKeyEME(s);case"AES-128":case"AES-256":case"AES-256-CTR":return this.loadKeyHTTP(s);default:return Promise.reject(Zn(e,w.KEY_LOAD_ERROR,new Error('Key supplied with unsupported METHOD: "'+a.method+'"')))}},r.loadKeyEME=function(e){if(this.emeController&&this.config.emeEnabled){var t;if(!e.decryptdata.keyId&&null!=(t=e.initSegment)&&t.data){var r=function(e){var t=[];return et(e,(function(e){return t.push(e.subarray(8,24))})),t}(e.initSegment.data);if(r.length){var i=r[0],a=e.decryptdata.uri;if(i.some((function(e){return 0!==e})))this.log("Using keyId found in init segment "+xe(i)+" keyUri: "+a),Nr.setKeyIdForUri(a,i);else{var n=Nr.addKeyIdForUri(a);this.log("Patching empty keyId with "+xe(n)+" keyUri: "+a),i=n}e.decryptdata.keyId=i}}return this.emeController.loadKey(e).then((function(){return{frag:e,keyInfo:{decryptdata:e.decryptdata}}}))}return Promise.reject(Zn(e,w.KEY_LOAD_ERROR,new Error("emeEnabled with controller: "+(this.emeController&&this.config.emeEnabled)+")")))},r.loadKeyHTTP=function(e){var t=this,r=e.decryptdata,i=r.uri;if(!i)return Promise.reject(Zn(e,w.KEY_LOAD_ERROR,new Error('Invalid key URI: "'+i+'"')));var a=this.keyLoaderInfo[i];if(a){if(a.decryptdata.key)return r.key=a.decryptdata.key,a.keyLoadPromise=null,Promise.resolve({frag:e,keyInfo:a});if(a.keyLoadPromise)return a.keyLoadPromise.then((function(t){return r.key=a.decryptdata.key,f(f({},t),{},{frag:e})}))}this.log("Loading"+(r.keyId?" keyId: "+xe(r.keyId):"")+" URI: "+r.uri+" from "+e.type+" "+e.level);var n=this.config,s=new(0,n.loader)(n);e.keyLoader=s;var o=this.keyLoaderInfo[i]={decryptdata:r,keyLoadPromise:null,loader:s};return o.keyLoadPromise=new Promise((function(r,a){var l={type:F.KEY,keyInfo:o,frag:e,responseType:"arraybuffer",url:i},u=n.keyLoadPolicy.default,d={loadPolicy:u,timeout:u.maxLoadTimeMs,maxRetry:0,retryDelay:0,maxRetryDelay:0},h={onSuccess:function(e,i,n,s){var o=n.frag,l=n.keyInfo,u=n.url;if(!o.decryptdata||l!==t.keyLoaderInfo[u])return a(Zn(o,w.KEY_LOAD_ERROR,new Error("after key load, decryptdata unset or changed"),s));l.decryptdata.key=o.decryptdata.key=new Uint8Array(e.data),o.keyLoader=l.loader=l.keyLoadPromise=null,r({frag:o,keyInfo:l})},onError:function(r,n,s,o){t.resetLoader(n),a(Zn(e,w.KEY_LOAD_ERROR,new Error("HTTP Error "+r.code+" loading key "+r.text),s,f({url:i,data:void 0},r)))},onTimeout:function(r,i,n){t.resetLoader(i),a(Zn(e,w.KEY_LOAD_TIMEOUT,new Error("key loading timed out"),n))},onAbort:function(r,i,n){t.resetLoader(i),a(Zn(e,w.INTERNAL_ABORTED,new Error("key loading aborted"),n))}};s.load(l,d,h)}))},r.resetLoader=function(e){var t=e.frag,r=e.keyInfo,i=e.url,a=r.loader;t.keyLoader===a&&(t.keyLoader=r.loader=r.keyLoadPromise=null),delete this.keyLoaderInfo[i],a&&a.destroy()},t}(ie);function Zn(e,t,r,i,a){return void 0===t&&(t=w.KEY_LOAD_ERROR),new Mi({type:x.NETWORK_ERROR,details:t,fatal:!1,frag:e,response:a,error:r,networkDetails:i||null})}function Jn(e){switch(e.type){case F.AUDIO_TRACK:return N.AUDIO;case F.SUBTITLE_TRACK:return N.SUBTITLE;default:return N.MAIN}}function es(e,t){var r=e.url;return void 0!==r&&0!==r.indexOf("data:")||(r=t.url),r}var ts=function(){function e(e){this.hls=void 0,this.loaders=Object.create(null),this.variableList=null,this.onManifestLoaded=this.checkAutostartLoad,this.hls=e,this.registerListeners()}var t=e.prototype;return t.startLoad=function(e){},t.stopLoad=function(){this.destroyInternalLoaders()},t.registerListeners=function(){var e=this.hls;e.on(O.MANIFEST_LOADING,this.onManifestLoading,this),e.on(O.LEVEL_LOADING,this.onLevelLoading,this),e.on(O.AUDIO_TRACK_LOADING,this.onAudioTrackLoading,this),e.on(O.SUBTITLE_TRACK_LOADING,this.onSubtitleTrackLoading,this),e.on(O.LEVELS_UPDATED,this.onLevelsUpdated,this)},t.unregisterListeners=function(){var e=this.hls;e.off(O.MANIFEST_LOADING,this.onManifestLoading,this),e.off(O.LEVEL_LOADING,this.onLevelLoading,this),e.off(O.AUDIO_TRACK_LOADING,this.onAudioTrackLoading,this),e.off(O.SUBTITLE_TRACK_LOADING,this.onSubtitleTrackLoading,this),e.off(O.LEVELS_UPDATED,this.onLevelsUpdated,this)},t.createInternalLoader=function(e){var t=this.hls.config,r=t.pLoader,i=t.loader,a=new(r||i)(t);return this.loaders[e.type]=a,a},t.getInternalLoader=function(e){return this.loaders[e.type]},t.resetInternalLoader=function(e){this.loaders[e]&&delete this.loaders[e]},t.destroyInternalLoaders=function(){for(var e in this.loaders){var t=this.loaders[e];t&&t.destroy(),this.resetInternalLoader(e)}},t.destroy=function(){this.variableList=null,this.unregisterListeners(),this.destroyInternalLoaders()},t.onManifestLoading=function(e,t){var r=t.url;this.variableList=null,this.load({id:null,level:0,responseType:"text",type:F.MANIFEST,url:r,deliveryDirectives:null,levelOrTrack:null})},t.onLevelLoading=function(e,t){var r=t.id,i=t.level,a=t.pathwayId,n=t.url,s=t.deliveryDirectives,o=t.levelInfo;this.load({id:r,level:i,pathwayId:a,responseType:"text",type:F.LEVEL,url:n,deliveryDirectives:s,levelOrTrack:o})},t.onAudioTrackLoading=function(e,t){var r=t.id,i=t.groupId,a=t.url,n=t.deliveryDirectives,s=t.track;this.load({id:r,groupId:i,level:null,responseType:"text",type:F.AUDIO_TRACK,url:a,deliveryDirectives:n,levelOrTrack:s})},t.onSubtitleTrackLoading=function(e,t){var r=t.id,i=t.groupId,a=t.url,n=t.deliveryDirectives,s=t.track;this.load({id:r,groupId:i,level:null,responseType:"text",type:F.SUBTITLE_TRACK,url:a,deliveryDirectives:n,levelOrTrack:s})},t.onLevelsUpdated=function(e,t){var r=this.loaders[F.LEVEL];if(r){var i=r.context;i&&!t.levels.some((function(e){return e===i.levelOrTrack}))&&(r.abort(),delete this.loaders[F.LEVEL])}},t.load=function(e){var t,r,i,a=this,n=this.hls.config,s=this.getInternalLoader(e);if(s){var l=this.hls.logger,u=s.context;if((null==u?void 0:u.levelOrTrack)===e.levelOrTrack&&(u.url===e.url||u.deliveryDirectives&&!e.deliveryDirectives))return void(u.url===e.url?l.log("[playlist-loader]: ignore "+e.url+" ongoing request"):l.log("[playlist-loader]: ignore "+e.url+" in favor of "+u.url));l.log("[playlist-loader]: aborting previous loader for type: "+e.type),s.abort()}if(r=e.type===F.MANIFEST?n.manifestLoadPolicy.default:o({},n.playlistLoadPolicy.default,{timeoutRetry:null,errorRetry:null}),s=this.createInternalLoader(e),_(null==(t=e.deliveryDirectives)?void 0:t.part)&&(e.type===F.LEVEL&&null!==e.level?i=this.hls.levels[e.level].details:e.type===F.AUDIO_TRACK&&null!==e.id?i=this.hls.audioTracks[e.id].details:e.type===F.SUBTITLE_TRACK&&null!==e.id&&(i=this.hls.subtitleTracks[e.id].details),i)){var d=i.partTarget,h=i.targetduration;if(d&&h){var f=1e3*Math.max(3*d,.8*h);r=o({},r,{maxTimeToFirstByteMs:Math.min(f,r.maxTimeToFirstByteMs),maxLoadTimeMs:Math.min(f,r.maxTimeToFirstByteMs)})}}var c=r.errorRetry||r.timeoutRetry||{},g={loadPolicy:r,timeout:r.maxLoadTimeMs,maxRetry:c.maxNumRetry||0,retryDelay:c.retryDelayMs||0,maxRetryDelay:c.maxRetryDelayMs||0},v={onSuccess:function(e,t,r,i){var n=a.getInternalLoader(r);a.resetInternalLoader(r.type);var s=e.data;t.parsing.start=performance.now(),Kr.isMediaPlaylist(s)||r.type!==F.MANIFEST?a.handleTrackOrLevelPlaylist(e,t,r,i||null,n):a.handleMasterPlaylist(e,t,r,i)},onError:function(e,t,r,i){a.handleNetworkError(t,r,!1,e,i)},onTimeout:function(e,t,r){a.handleNetworkError(t,r,!0,void 0,e)}};s.load(e,g,v)},t.checkAutostartLoad=function(){if(this.hls){var e=this.hls,t=e.config,r=t.autoStartLoad,i=t.startPosition,a=e.forceStartLoad;(r||a)&&(this.hls.logger.log((r?"auto":"force")+" startLoad with configured startPosition "+i),this.hls.startLoad(i))}},t.handleMasterPlaylist=function(e,t,r,i){var a=this,n=this.hls,s=e.data,o=es(e,r),l=Kr.parseMasterPlaylist(s,o);if(l.playlistParsingError)return t.parsing.end=performance.now(),void this.handleManifestParsingError(e,r,l.playlistParsingError,i,t);var u=l.contentSteering,d=l.levels,h=l.iframeVariants,f=l.sessionData,c=l.sessionKeys,g=l.startTimeOffset,v=l.variableList;this.variableList=v,d.forEach((function(e){var t=e.unknownCodecs;if(t)for(var r=a.hls.config.preferManagedMediaSource,i=e.audioCodec,n=e.videoCodec,s=t.length;s--;){var o=t[s];mt(o,"audio",r)?(e.audioCodec=i=i?i+","+o:o,gt.audio[i.substring(0,4)]=2,t.splice(s,1)):mt(o,"video",r)&&(e.videoCodec=n=n?n+","+o:o,gt.video[n.substring(0,4)]=2,t.splice(s,1))}}));var m=Kr.parseMasterPlaylistMedia(s,o,l),p=m.AUDIO,y=void 0===p?[]:p,E=m.SUBTITLES,T=m["CLOSED-CAPTIONS"];y.length&&(y.some((function(e){return!e.url}))||!d[0].audioCodec||d[0].attrs.AUDIO||(this.hls.logger.log("[playlist-loader]: audio codec signaled in quality level, but no embedded audio track signaled, create one"),y.unshift({type:"main",name:"main",groupId:"main",default:!1,autoselect:!1,forced:!1,id:-1,attrs:new Dr({}),bitrate:0,url:""}))),n.trigger(O.MANIFEST_LOADED,{levels:d,audioTracks:y,subtitles:E,iframeVariants:h,captions:T,contentSteering:u,url:o,stats:t,networkDetails:i,sessionData:f,sessionKeys:c,startTimeOffset:g,variableList:v})},t.handleTrackOrLevelPlaylist=function(e,t,r,i,a){var n=this.hls,s=r.id,o=r.level,l=r.type,u=es(e,r),d=_(o)?o:_(s)?s:0,h=Jn(r),f=Kr.parseLevelPlaylist(e.data,u,d,h,0,this.variableList);if(l===F.MANIFEST){var c={attrs:new Dr({}),bitrate:0,details:f,name:"",url:u};f.requestScheduled=t.loading.start+oi(f,0),n.trigger(O.MANIFEST_LOADED,{levels:[c],audioTracks:[],iframeVariants:[],url:u,stats:t,networkDetails:i,sessionData:null,sessionKeys:null,contentSteering:null,startTimeOffset:null,variableList:null})}t.parsing.end=performance.now(),r.levelDetails=f,this.handlePlaylistLoaded(f,e,t,r,i,a)},t.handleManifestParsingError=function(e,t,r,i,a){this.hls.trigger(O.ERROR,{type:x.NETWORK_ERROR,details:w.MANIFEST_PARSING_ERROR,fatal:t.type===F.MANIFEST,url:e.url,err:r,error:r,reason:r.message,response:e,context:t,networkDetails:i,stats:a})},t.handleNetworkError=function(e,t,r,i,a){void 0===r&&(r=!1);var n="A network "+(r?"timeout":"error"+(i?" (status "+i.code+")":""))+" occurred while loading "+e.type;e.type===F.LEVEL?n+=": "+e.level+" id: "+e.id:e.type!==F.AUDIO_TRACK&&e.type!==F.SUBTITLE_TRACK||(n+=" id: "+e.id+' group-id: "'+e.groupId+'"');var s=new Error(n);this.hls.logger.warn("[playlist-loader]: "+n);var o=w.UNKNOWN,l=!1,u=this.getInternalLoader(e);switch(e.type){case F.MANIFEST:o=r?w.MANIFEST_LOAD_TIMEOUT:w.MANIFEST_LOAD_ERROR,l=!0;break;case F.LEVEL:o=r?w.LEVEL_LOAD_TIMEOUT:w.LEVEL_LOAD_ERROR,l=!1;break;case F.AUDIO_TRACK:o=r?w.AUDIO_TRACK_LOAD_TIMEOUT:w.AUDIO_TRACK_LOAD_ERROR,l=!1;break;case F.SUBTITLE_TRACK:o=r?w.SUBTITLE_TRACK_LOAD_TIMEOUT:w.SUBTITLE_LOAD_ERROR,l=!1}u&&this.resetInternalLoader(e.type);var d={type:x.NETWORK_ERROR,details:o,fatal:l,url:e.url,loader:u,context:e,error:s,networkDetails:t,stats:a};if(i){var h=e.url;t&&"url"in t&&(h=t.url),d.response=f({url:h,data:void 0},i)}this.hls.trigger(O.ERROR,d)},t.handlePlaylistLoaded=function(e,t,r,i,a,n){var s=this.hls,o=i.type,l=i.level,u=i.levelOrTrack,d=i.id,h=i.groupId,f=i.deliveryDirectives,c=es(t,i),g=Jn(i),v="number"==typeof i.level&&g===N.MAIN?l:void 0,m=e.playlistParsingError;if(m){if(this.hls.logger.warn(m+" "+e.url),!s.config.ignorePlaylistParsingErrors)return void s.trigger(O.ERROR,{type:x.NETWORK_ERROR,details:w.LEVEL_PARSING_ERROR,fatal:!1,url:c,error:m,reason:m.message,response:t,context:i,level:v,parent:g,networkDetails:a,stats:r});e.playlistParsingError=null}if(e.fragments.length)switch(e.live&&n&&(n.getCacheAge&&(e.ageHeader=n.getCacheAge()||0),n.getCacheAge&&!isNaN(e.ageHeader)||(e.ageHeader=0)),o){case F.MANIFEST:case F.LEVEL:if(v)if(u){if(u!==s.levels[v]){var p=s.levels.indexOf(u);p>-1&&(v=p)}}else v=0;s.trigger(O.LEVEL_LOADED,{details:e,levelInfo:u||s.levels[0],level:v||0,id:d||0,stats:r,networkDetails:a,deliveryDirectives:f,withoutMultiVariant:o===F.MANIFEST,context:i});break;case F.AUDIO_TRACK:s.trigger(O.AUDIO_TRACK_LOADED,{details:e,track:u,id:d||0,groupId:h||"",stats:r,networkDetails:a,deliveryDirectives:f,context:i});break;case F.SUBTITLE_TRACK:s.trigger(O.SUBTITLE_TRACK_LOADED,{details:e,track:u,id:d||0,groupId:h||"",stats:r,networkDetails:a,deliveryDirectives:f,context:i})}else{var y=e.playlistParsingError=new Error("No Segments found in Playlist");s.trigger(O.ERROR,{type:x.NETWORK_ERROR,details:w.LEVEL_EMPTY_ERROR,fatal:!1,url:c,error:y,reason:y.message,response:t,context:i,level:v,parent:g,networkDetails:a,stats:r})}},e}(),rs=function(){function e(t){void 0===t&&(t={}),this.config=void 0,this.userConfig=void 0,this.logger=void 0,this._url=null,this.streamController=void 0,this.coreComponents=void 0,this.networkControllers=void 0,this._emitter=new k,this._autoLevelCapping=-1,this._maxHdcpLevel=null,this.abrController=void 0,this.bufferController=void 0,this.capLevelController=void 0,this.latencyController=void 0,this.levelController=void 0,this.audioStreamController=void 0,this.subtititleStreamController=void 0,this.audioTrackController=void 0,this.subtitleTrackController=void 0,this.interstitialsController=void 0,this.iframeController=void 0,this.gapController=void 0,this.emeController=void 0,this.cmcdController=void 0,this._media=null,this._sessionId=void 0,this.triggeringException=void 0,this.started=!1;var r=this.logger=ue(t.debug||!1,"Hls instance",t.loggerId||t.assetPlayerId),i=this.config=Hn(e.DefaultConfig,t,r);this.userConfig=t,i.progressive&&Yn(i,r);var a=i.streamController,n=i.abrController,s=i.bufferController,o=i.capLevelController,l=i.errorController,u=i.fpsController,d=i.id3TrackController,h=i.iframeController,f=i.gapController,c=new l(this),g=this.abrController=new n(this),v=new Li(this),m=i.interstitialsController,p=m?this.interstitialsController=new m(this,e):null,y=s?this.bufferController=new s(this,v):null,E=o?this.capLevelController=new o(this):null,T=u?new u(this):null,S=i.cmcdController,L=S?this.cmcdController=new S(this):null,R=new ts(this),A=i.contentSteeringController,b=A?new A(this):null,D=this.levelController=new jn(this,b),I=d?new d(this):void 0,_=new $n(this.config,this.logger),C=this.streamController=new a(this,v,_),P=this.gapController=f?new f(this,v):void 0;E&&E.setStreamController(C);var x=[R,D,C];p&&x.splice(1,0,p),b&&x.splice(1,0,b),this.networkControllers=x;var w=[g];y&&w.push(y),P&&w.push(P),E&&w.push(E),T&&(T.setStreamController(C),w.push(T)),I&&w.push(I),w.push(v),this.audioTrackController=this.createController(i.audioTrackController,x);var M=i.audioStreamController;M&&x.push(this.audioStreamController=new M(this,v,_)),this.subtitleTrackController=this.createController(i.subtitleTrackController,x);var F=i.subtitleStreamController;F&&x.push(this.subtititleStreamController=new F(this,v,_)),this.createController(i.timelineController,w),_.emeController=this.emeController=this.createController(i.emeController,w),L&&w.push(L),this.latencyController=this.createController(i.latencyController,w),this.coreComponents=w,this.iframeController=h?new h(this,e):void 0,x.push(c);var N=c.onErrorOut;"function"==typeof N&&this.on(O.ERROR,N,c),this.on(O.MANIFEST_LOADED,R.onManifestLoaded,R)}e.isMSESupported=function(){return Dn()},e.isSupported=function(){return function(){if(!Dn())return!1;var e=ve();return"function"==typeof(null==e?void 0:e.isTypeSupported)&&(["avc1.42E01E,mp4a.40.2","av01.0.01M.08","vp09.00.50.08"].some((function(t){return e.isTypeSupported(yt(t,"video"))}))||["mp4a.40.2","fLaC"].some((function(t){return e.isTypeSupported(yt(t,"audio"))})))}()},e.getMediaSource=function(){return ve()};var t=e.prototype;return t.createController=function(e,t){if(e){var r=new e(this);return t&&t.push(r),r}return null},t.on=function(e,t,r){void 0===r&&(r=this),this._emitter.on(e,t,r)},t.once=function(e,t,r){void 0===r&&(r=this),this._emitter.once(e,t,r)},t.removeAllListeners=function(e){this._emitter.removeAllListeners(e)},t.off=function(e,t,r,i){void 0===r&&(r=this),this._emitter.off(e,t,r,i)},t.listeners=function(e){return this._emitter.listeners(e)},t.emit=function(e,t,r){return this._emitter.emit(e,t,r)},t.trigger=function(e,t){if(this.config.debug)return this.emit(e,e,t);try{return this.emit(e,e,t)}catch(t){if(this.logger.error("An internal error happened while handling event "+e+'. Error message: "'+t.message+'". Here is a stacktrace:',t),!this.triggeringException){this.triggeringException=!0;var r=e===O.ERROR;this.trigger(O.ERROR,{type:x.OTHER_ERROR,details:w.INTERNAL_EXCEPTION,fatal:r,event:e,error:t}),this.triggeringException=!1}}return!1},t.listenerCount=function(e){return this._emitter.listenerCount(e)},t.destroy=function(){this.logger.log("destroy"),this.trigger(O.DESTROYING,void 0),this.detachMedia(),this.removeAllListeners(),this._autoLevelCapping=-1,this._url=null,this.networkControllers.forEach((function(e){return e.destroy()})),this.networkControllers.length=0,this.coreComponents.forEach((function(e){return e.destroy()})),this.coreComponents.length=0,this.iframeController=void 0;var e=this.config;e.xhrSetup=e.fetchSetup=void 0,this.userConfig=null},t.attachMedia=function(e){if(!e||"media"in e&&!e.media){var t=new Error("attachMedia failed: invalid argument ("+e+")");this.trigger(O.ERROR,{type:x.OTHER_ERROR,details:w.ATTACH_MEDIA_ERROR,fatal:!0,error:t})}else{this.logger.log("attachMedia"),this._media&&(this.logger.warn("media must be detached before attaching"),this.detachMedia());var r="media"in e,i=r?e.media:e,a=r?e:{media:i};this._media=i,this.trigger(O.MEDIA_ATTACHING,a)}},t.detachMedia=function(){this.logger.log("detachMedia");var e={};this.trigger(O.MEDIA_DETACHING,e),this._media=null,this.trigger(O.MEDIA_DETACHED,e)},t.transferMedia=function(){var e;this._media=null;var t=(null==(e=this.bufferController)?void 0:e.transferMedia())||null,r={transferMedia:t};return this.trigger(O.MEDIA_DETACHING,r),this.trigger(O.MEDIA_DETACHED,r),t},t.loadSource=function(e){var t;this.stopLoad();var r=this.media,i=this._url,a=this._url=I.buildAbsoluteURL(self.location.href,e,{alwaysNormalize:!0});this._autoLevelCapping=-1,this._maxHdcpLevel=null,this.logger.log("loadSource:"+a),r&&i&&(i!==a||null!=(t=this.bufferController)&&t.hasSourceTypes())&&(this.detachMedia(),this.attachMedia(r)),this.trigger(O.MANIFEST_LOADING,{url:e})},t.startLoad=function(e,t){void 0===e&&(e=-1),this.logger.log("startLoad("+e+(t?", <skip seek to start>":"")+")"),this.started=!0,this.resumeBuffering();for(var r=0;r<this.networkControllers.length&&(this.networkControllers[r].startLoad(e,t),this.started&&this.networkControllers);r++);},t.stopLoad=function(){this.logger.log("stopLoad"),this.started=!1;for(var e=0;e<this.networkControllers.length&&(this.networkControllers[e].stopLoad(),!this.started&&this.networkControllers);e++);},t.resumeBuffering=function(){this.bufferingEnabled||(this.logger.log("resume buffering"),this.networkControllers.forEach((function(e){e.resumeBuffering&&e.resumeBuffering()})))},t.pauseBuffering=function(){this.bufferingEnabled&&(this.logger.log("pause buffering"),this.networkControllers.forEach((function(e){e.pauseBuffering&&e.pauseBuffering()})))},t.swapAudioCodec=function(){this.logger.log("swapAudioCodec"),this.streamController.swapAudioCodec()},t.recoverMediaError=function(){this.logger.log("recoverMediaError");var e=this._media,t=this.started,r=null==e?void 0:e.currentTime;this.detachMedia(),e&&(this.attachMedia(e),t&&(r?this.startLoad(r):this.config.autoStartLoad||this.startLoad()))},t.removeLevel=function(e){this.levelController.removeLevel(e)},t.setAudioOption=function(e){var t;return(null==(t=this.audioTrackController)?void 0:t.setAudioOption(e))||null},t.setSubtitleOption=function(e){var t;return(null==(t=this.subtitleTrackController)?void 0:t.setSubtitleOption(e))||null},t.createIFramePlayer=function(e){return null},t.createImageIFramePlayer=function(e){return null},t.getMediaDecodingInfo=function(e,t){void 0===t&&(t=this.allAudioTracks);var r=Gt(t);return ce.getMediaDecodingInfoPromise(e,r,navigator.mediaCapabilities)},a(e,[{key:"url",get:function(){return this._url}},{key:"hasEnoughToStart",get:function(){return this.streamController.hasEnoughToStart}},{key:"startPosition",get:function(){return this.streamController.startPositionValue}},{key:"loadingEnabled",get:function(){return this.started&&this.streamController.state!==Hi.STOPPED}},{key:"bufferingEnabled",get:function(){return this.streamController.bufferingEnabled}},{key:"inFlightFragments",get:function(){var e,t=((e={})[N.MAIN]=this.streamController.inFlightFrag,e);return this.audioStreamController&&(t[N.AUDIO]=this.audioStreamController.inFlightFrag),this.subtititleStreamController&&(t[N.SUBTITLE]=this.subtititleStreamController.inFlightFrag),t}},{key:"sessionId",get:function(){var e=this._sessionId;return e||(e=this._sessionId=function(){try{return crypto.randomUUID()}catch(i){try{var e=URL.createObjectURL(new Blob),t=e.toString();return URL.revokeObjectURL(e),t.slice(t.lastIndexOf("/")+1)}catch(e){var r=(new Date).getTime();return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(function(e){var t=(r+16*Math.random())%16|0;return r=Math.floor(r/16),("x"==e?t:3&t|8).toString(16)}))}}}()),e}},{key:"levels",get:function(){var e=this.levelController.levels;return e||[]}},{key:"latestLevelDetails",get:function(){return this.streamController.getLevelDetails()||null}},{key:"loadLevelObj",get:function(){return this.levelController.loadLevelObj}},{key:"currentLevel",get:function(){return this.streamController.currentLevel},set:function(e){this.logger.log("set currentLevel:"+e),this.levelController.manualLevel=e,this.streamController.immediateLevelSwitch()}},{key:"nextLevel",get:function(){return this.streamController.nextLevel},set:function(e){this.logger.log("set nextLevel:"+e),this.levelController.manualLevel=e,this.streamController.nextLevelSwitch()}},{key:"loadLevel",get:function(){return this.levelController.level},set:function(e){this.logger.log("set loadLevel:"+e),this.levelController.manualLevel=e}},{key:"nextLoadLevel",get:function(){return this.levelController.nextLoadLevel},set:function(e){this.levelController.nextLoadLevel=e}},{key:"firstLevel",get:function(){return Math.max(this.levelController.firstLevel,this.minAutoLevel)},set:function(e){this.logger.log("set firstLevel:"+e),this.levelController.firstLevel=e}},{key:"startLevel",get:function(){var e=this.levelController.startLevel;return-1===e&&this.abrController.forcedAutoLevel>-1?this.abrController.forcedAutoLevel:e},set:function(e){this.logger.log("set startLevel:"+e),-1!==e&&(e=Math.max(e,this.minAutoLevel)),this.levelController.startLevel=e}},{key:"capLevelToPlayerSize",get:function(){return this.config.capLevelToPlayerSize},set:function(e){var t=this.capLevelController,r=!!e;t&&r!==this.config.capLevelToPlayerSize&&(r?t.startCapping():(t.stopCapping(),this.autoLevelCapping=-1,this.streamController.nextLevelSwitch()),this.config.capLevelToPlayerSize=r)}},{key:"autoLevelCapping",get:function(){return this._autoLevelCapping},set:function(e){this._autoLevelCapping!==e&&(this.logger.log("set autoLevelCapping:"+e),this._autoLevelCapping=e,this.levelController.checkMaxAutoUpdated())}},{key:"bandwidthEstimate",get:function(){var e=this.abrController.bwEstimator;return e?e.getEstimate():NaN},set:function(e){this.abrController.resetEstimator(e)}},{key:"abrEwmaDefaultEstimate",get:function(){var e=this.abrController.bwEstimator;return e?e.defaultEstimate:NaN}},{key:"ttfbEstimate",get:function(){var e=this.abrController.bwEstimator;return e?e.getEstimateTTFB():NaN}},{key:"maxHdcpLevel",get:function(){return this._maxHdcpLevel},set:function(e){(function(e){return It.indexOf(e)>-1})(e)&&this._maxHdcpLevel!==e&&(this._maxHdcpLevel=e,this.levelController.checkMaxAutoUpdated())}},{key:"autoLevelEnabled",get:function(){return-1===this.levelController.manualLevel}},{key:"manualLevel",get:function(){return this.levelController.manualLevel}},{key:"minAutoLevel",get:function(){var e=this.levels,t=this.config.minAutoBitrate;if(!e)return 0;for(var r=e.length,i=0;i<r;i++)if(e[i].maxBitrate>=t)return i;return 0}},{key:"maxAutoLevel",get:function(){var e,t=this.levels,r=this.autoLevelCapping,i=this.maxHdcpLevel;if(e=-1===r&&null!=t&&t.length?t.length-1:r,i)for(var a=e;a--;){var n=t[a].attrs["HDCP-LEVEL"];if(n&&n<=i)return a}return e}},{key:"firstAutoLevel",get:function(){return this.abrController.firstAutoLevel}},{key:"nextAutoLevel",get:function(){return this.abrController.nextAutoLevel},set:function(e){this.abrController.nextAutoLevel=e}},{key:"playingDate",get:function(){return this.streamController.currentProgramDateTime}},{key:"mainForwardBufferInfo",get:function(){return this.streamController.getMainFwdBufferInfo()}},{key:"audioForwardBufferInfo",get:function(){var e;return(null==(e=this.audioStreamController)?void 0:e.getFwdBufferInfo())||null}},{key:"maxBufferLength",get:function(){return this.streamController.maxBufferLength}},{key:"allAudioTracks",get:function(){var e=this.audioTrackController;return e?e.allAudioTracks:[]}},{key:"audioTracks",get:function(){var e=this.audioTrackController;return e?e.audioTracks:[]}},{key:"audioTrack",get:function(){var e=this.audioTrackController;return e?e.audioTrack:-1},set:function(e){var t=this.audioTrackController;t&&(t.audioTrack=e)}},{key:"nextAudioTrack",get:function(){var e,t;return null!=(e=null==(t=this.audioStreamController)?void 0:t.nextAudioTrack)?e:-1},set:function(e){var t=this.audioTrackController;t&&(t.nextAudioTrack=e)}},{key:"allSubtitleTracks",get:function(){var e=this.subtitleTrackController;return e?e.allSubtitleTracks:[]}},{key:"subtitleTracks",get:function(){var e=this.subtitleTrackController;return e?e.subtitleTracks:[]}},{key:"subtitleTrack",get:function(){var e=this.subtitleTrackController;return e?e.subtitleTrack:-1},set:function(e){var t=this.subtitleTrackController;t&&(t.subtitleTrack=e)}},{key:"media",get:function(){return this._media}},{key:"subtitleDisplay",get:function(){var e=this.subtitleTrackController;return!!e&&e.subtitleDisplay},set:function(e){var t=this.subtitleTrackController;t&&(t.subtitleDisplay=e)}},{key:"lowLatencyMode",get:function(){return this.config.lowLatencyMode},set:function(e){this.config.lowLatencyMode=e}},{key:"liveSyncPosition",get:function(){var e,t;return null!=(e=null==(t=this.latencyController)?void 0:t.liveSyncPosition)?e:null}},{key:"latency",get:function(){var e;return(null==(e=this.latencyController)?void 0:e.latency)||0}},{key:"maxLatency",get:function(){var e;return(null==(e=this.latencyController)?void 0:e.maxLatency)||0}},{key:"targetLatency",get:function(){var e;return(null==(e=this.latencyController)?void 0:e.targetLatency)||null},set:function(e){this.latencyController&&(this.latencyController.targetLatency=e)}},{key:"drift",get:function(){var e;return(null==(e=this.latencyController)?void 0:e.drift)||null}},{key:"forceStartLoad",get:function(){return this.streamController.forceStartLoad}},{key:"pathways",get:function(){return this.levelController.pathways}},{key:"pathwayPriority",get:function(){return this.levelController.pathwayPriority},set:function(e){this.levelController.pathwayPriority=e}},{key:"bufferedToEnd",get:function(){var e;return!(null==(e=this.bufferController)||!e.bufferedToEnd)}},{key:"interstitialsManager",get:function(){return null}},{key:"iframeVariants",get:function(){var e=this.levelController.iframeVariants;return e||[]}}],[{key:"version",get:function(){return Ln}},{key:"Events",get:function(){return O}},{key:"MetadataSchema",get:function(){return zi}},{key:"ErrorTypes",get:function(){return x}},{key:"ErrorDetails",get:function(){return w}},{key:"DefaultConfig",get:function(){return e.defaultConfig?e.defaultConfig:Vn},set:function(t){e.defaultConfig=t}}])}();return rs.defaultConfig=void 0,rs},"object"==typeof exports&&"undefined"!=typeof module?module.exports=i():"function"==typeof define&&define.amd?define(i):(r="undefined"!=typeof globalThis?globalThis:r||self).Hls=i()}(!1);
//# sourceMappingURL=hls.light.min.js.map
}catch(e){}})();
try{ if (window.Hls) window.__vvHlsCtor = window.Hls; }catch(e){}
var VV_MARK = '__VIA_VIDEO_PLAYER__';
var VV_STORE = 'via.vp.';

if (window[VV_MARK]) {
    throw new Error('via-vp: already loaded');
}
window[VV_MARK] = true;

var VV_ERR_CAPTURE = null;
try {
    window.addEventListener('error', function (e) {
        if (VV_ERR_CAPTURE) return;
        var m = e && (e.message || (e.error && e.error.message));
        if (!m) return;
        if (VV_ERR_CAPTURE === null && typeof VV === 'undefined') VV_ERR_CAPTURE = { msg: String(m) };
        else if (typeof VV !== 'undefined' && !VV.err) VV.err = { msg: String(m) };
    }, true);
} catch (eEr) {}

var VV_TYPE_CN = { HLS: 'm3u8', MP4: 'mp4', M4V: 'm4v', WEBM: 'webm', MKV: 'mkv', FLV: 'flv', MOV: 'mov', AVI: 'avi', WMV: 'wmv', AUDIO: '音频', BLOB: '原生流' };

var VV_EXT_TYPE = {
    m3u8: 'HLS', mp4: 'MP4', m4v: 'M4V', webm: 'WEBM', mkv: 'MKV', flv: 'FLV', f4v: 'FLV',
    mov: 'MOV', avi: 'AVI', wmv: 'WMV', '3gp': 'AVI',
    mp3: 'AUDIO', m4a: 'AUDIO', aac: 'AUDIO', ogg: 'AUDIO', oga: 'AUDIO', opus: 'AUDIO', wav: 'AUDIO', flac: 'AUDIO'
};

var VV_CT_TYPE = {
    'application/vnd.apple.mpegurl': 'HLS', 'application/x-mpegurl': 'HLS', 'application/mpegurl': 'HLS',
    'audio/mpegurl': 'HLS', 'audio/x-mpegurl': 'HLS', 'video/mp4': 'MP4', 'video/x-m4v': 'M4V',
    'video/quicktime': 'MOV', 'video/webm': 'WEBM', 'video/x-matroska': 'MKV', 'video/x-flv': 'FLV',
    'video/avi': 'AVI', 'video/msvideo': 'AVI', 'video/x-ms-wmv': 'WMV', 'video/3gpp': 'AVI',
    'audio/mpeg': 'AUDIO', 'audio/mp4': 'AUDIO', 'audio/aac': 'AUDIO', 'audio/ogg': 'AUDIO',
    'audio/x-ogg': 'AUDIO', 'audio/wav': 'AUDIO', 'audio/x-wav': 'AUDIO', 'audio/x-flac': 'AUDIO'
};

var VV_SCAN_RX = /(?:https?:)?\/\/[^\s"'`<>\\)\]{}]{4,600}?\.(?:m3u8|mp4|m4v|webm|mkv|flv|f4v)(?:\?[^\s"'`<>\)\]{}]{0,300})?/gi;

var VV = {
    // 构建时由 build.mjs 注入（VV_VERSION 会随改动自动 +1）。
    // 写死版本号是之前"改了还是没生效"的根源：Via 按 @version 判断要不要更新，
    // 版本号不动，装进去的就永远是旧脚本。
    version: (typeof VV_VERSION !== 'undefined' ? VV_VERSION : '0.1.3'),
    build: (typeof VV_BUILD !== 'undefined' ? VV_BUILD : ''),
    items: [],
    seen: {},
    hlsMasters: {},
    hlsVariants: {},
    hlsRoots: {},
    hlsMasterRoots: {},
    badge: null,
    playerActive: false,
    _panelOpen: false,
    uiBuilt: false,
    cfg: {
        enabled: vvGet('enabled', true),
        speed: vvGet('speed', '1.0'),
        // 控制栏自动收起延时。3 秒在手机上偏短：刚要伸手点画质/倍速，栏已经没了。
        // 菜单（底部 sheet）打开期间不计时，见 vvShowCS()。
        autoHide: 4500,
        autoplayNext: vvGet('autoplayNext', false),
        // auto = 有 MSE 用 hls.js；native = 优先系统 HLS；hlsjs = 强制 hls.js
        hlsEngine: vvGet('hlsEngine', 'auto'),
        // 多页并行播放：开启后多个页面可同时播（只压缩缓冲/内存，不压画质），关闭则只允许一个
        multiPlay: vvGet('multiPlay', false),
        // 标签页休眠：页面切到后台时摘掉原生 <video> 的 src，真正释放 MediaCodec
        hibernate: vvGet('hibernate', true),
        // 选集：从播放器里点某一集跳到该页后，自动接着播这一集的视频
        epAutoPlay: vvGet('epAutoPlay', true),
        // 播放态低特效：关掉菜单/加载框的大面积 backdrop-filter。真机实测半屏 blur(20px)
        // 会把平均帧间隔从 16.7ms 拉到 22.3ms、长帧率从 0.2% 拉到 29.9%，默认开（省电）。
        lowFx: vvGet('lowFx', true),
        // 网页原生视频自动播放：默认关（拦截站点自动起播）。站点一进页面就起播会在
        // WebView 里直接占住一条硬件解码器并开始拉流，既费流量，又让内置播放器抢不到解码。
        // 语义：true = 允许网页自动播放；false = 等用户点播放。
        pageAutoplay: vvGet('pageAutoplay', false)
    }
};

try { window.__VV_DEBUG__ = VV; } catch (eVV) {}

function vvGet(key, def) {
    try {
        if (typeof GM_getValue === 'function') {
            var v = GM_getValue(key, undefined);
            if (v !== undefined && v !== null) return v;
        }
    } catch (e) {}
    try {
        var s = localStorage.getItem(VV_STORE + key);
        if (s !== null) return JSON.parse(s);
    } catch (e2) {}
    return def;
}

function vvSet(key, val) {
    try {
        if (typeof GM_setValue === 'function') {
            GM_setValue(key, val);
            return;
        }
    } catch (e) {}
    try {
        localStorage.setItem(VV_STORE + key, JSON.stringify(val));
    } catch (e2) {}
}

function vvDel(key) {
    try {
        if (typeof GM_deleteValue === 'function') GM_deleteValue(key);
    } catch (e) {}
    try { localStorage.removeItem(VV_STORE + key); } catch (e2) {}
}

// ---- 跨页签协调专用存储 ----
// 必须走 localStorage，不能走 GM 存储。
// GM_setValue 是脚本级的持久化接口，Via 这类壳里各标签页各自持有一份缓存，
// 别的页签写进去的值本页不一定能立刻读到，更没有 storage 事件；
// 用它做"谁在播 / 请让出解码器"的协调，等于各说各话——多开几个页签就失效。
// localStorage 是同一源共享的存储区，写入立刻对其它页签可见，还能触发 storage 事件。
var VV_SHARED_PREFIX = 'vvs:';

function vvSharedSet(key, val) {
    try {
        localStorage.setItem(VV_SHARED_PREFIX + key, JSON.stringify(val));
        return true;
    } catch (e) { return false; }
}

function vvSharedGet(key, def) {
    try {
        var s = localStorage.getItem(VV_SHARED_PREFIX + key);
        if (s !== null) return JSON.parse(s);
    } catch (e) {}
    return def;
}

// 高频手势（亮度/音量）不要每一帧都写 GM 存储，停下来 500ms 再落盘
function vvSetLazy(key, val) {
    try {
        VV._lazyTimers = VV._lazyTimers || {};
        VV._lazyVals = VV._lazyVals || {};
        VV._lazyVals[key] = val;
        clearTimeout(VV._lazyTimers[key]);
        VV._lazyTimers[key] = setTimeout(function () {
            VV._lazyTimers[key] = null;
            var v = VV._lazyVals[key];
            delete VV._lazyVals[key];
            vvSet(key, v);
        }, 500);
    } catch (e) {}
}

// 关闭播放器/页面隐藏时，把还没落盘的延迟写入立即刷掉
function vvFlushLazy() {
    try {
        var t = VV._lazyTimers || {};
        var vals = VV._lazyVals || {};
        for (var k in t) {
            if (!t[k]) continue;
            clearTimeout(t[k]);
            t[k] = null;
            if (Object.prototype.hasOwnProperty.call(vals, k)) {
                vvSet(k, vals[k]);
                delete vals[k];
            }
        }
    } catch (e) {}
}

function vvGetProgressMap() {
    // 缓存进度表，避免播放中每 10 秒都同步读一次 GM 存储
    if (VV._pmap && typeof VV._pmap === 'object') return VV._pmap;
    var m = vvGet('progress', {});
    if (!m || typeof m !== 'object') m = {};
    VV._pmap = m;
    return m;
}

function vvSaveProgressMap(map) {
    var keys = Object.keys(map);
    if (keys.length > 300) {
        keys.sort(function (a, b) { return (map[a].u || 0) - (map[b].u || 0); });
        var drop = keys.length - 300;
        for (var i = 0; i < drop; i++) delete map[keys[i]];
    }
    VV._pmap = map;
    vvSet('progress', map);
}

function vvEl(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined && html !== null) d.innerHTML = html;
    return d;
}

// 统一图标语言：24x24 viewBox、currentColor、stroke 1.8。
// 以前播放器混着四种图标来源（黄色 emoji 🔒、文字字形 ⏸⧉⋯⭳、两枚内联 SVG），
// 字重与光学尺寸都不一致，看起来像四个不同时代的控件拼在一起。
// 改成单表 + 单函数，所有按钮共用一套描边；需要实心的才进 VV_ICON_FILL。
var VV_ICONS = {
    back: 'M15 5l-7 7 7 7',
    close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
    play: 'M9 5.6v12.8L19 12z',
    pause: 'M9.5 5h2.2v14H9.5zM14.3 5h2.2v14h-2.2z',
    next: 'M6 5.5l8.5 6.5L6 18.5M18 5.5v13',
    pip: 'M3 5.5h18v13H3zM12.5 12h6v4.5h-6z',
    fs: 'M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5',
    fsExit: 'M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5',
    // 网页铺满：屏幕外框 + 上下两条短横线，表示上下都在、只是把站点播放器放大
    webfs: 'M3.5 5h17v14h-17zM6 7.5h12M6 16.5h12',
    dl: 'M12 4v11M7.5 10.5L12 15l4.5-4.5M4.5 19.5h15',
    lock: 'M6.5 10.5h11v9h-11zM9 10.5V7.5a3 3 0 016 0v3',
    unlock: 'M6.5 10.5h11v9h-11zM9 10.5V7.5a3 3 0 015.7-1.4',
    link: 'M10.5 13.5a3.5 3.5 0 005 0l2.5-2.5a3.5 3.5 0 00-5-5l-1 1M13.5 10.5a3.5 3.5 0 00-5 0L6 13a3.5 3.5 0 005 5l1-1',
    more: 'M5.2 12h1.6M11.2 12h1.6M17.2 12h1.6',
    gear: 'M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4zM12 3v2.2M12 18.8V21M4.6 7.9l1.9 1.1M17.5 15l1.9 1.1M4.6 16.1l1.9-1.1M17.5 9l1.9-1.1',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    // 选集：左侧三枚小方块 + 右侧三行，和「更多」的三点区分开
    list: 'M4 5.5h2.5v2.5H4zM4 10.8h2.5v2.5H4zM4 16h2.5v2.5H4zM9 6.8h11M9 12h11M9 17.3h11'
};
// play / pause 用实心：描边三角形在 20px 下会显得细弱，也和其余线性图标分不开层级
var VV_ICON_FILL = { play: 1, pause: 1 };

function vvIcon(n, sz) {
    var d = VV_ICONS[n];
    if (!d) return '';
    var s = sz || 20;
    return '<svg class="vv-ico" viewBox="0 0 24 24" width="' + s + '" height="' + s + '"' +
        ' aria-hidden="true" focusable="false" fill="' + (VV_ICON_FILL[n] ? 'currentColor' : 'none') + '"' +
        ' stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="' + d + '"/></svg>';
}

// 把界面移到 <html> 末尾：同 z-index 时后插入的元素在上，可压过页面广告浮层
// 优先 moveBefore（原子移动，不触发媒体重载/动画重播），旧 WebView 回退 appendChild
function vvBringToFront(el) {
    try {
        var p = document.documentElement;
        if (!el || !p || p.lastElementChild === el) return;
        if (typeof p.moveBefore === 'function') {
            try { p.moveBefore(el, null); return; } catch (eM) {}
        }
        p.appendChild(el);
    } catch (e) {}
}

// 用几个采样点判断浮层是否被页面广告盖住；只在实际被盖住时才重排，避免动画反复重播
function vvIsOccluded(el) {
    try {
        if (!el || !el.getBoundingClientRect || !el.parentNode) return false;
        var r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        var ix = Math.min(12, r.width / 2);
        var iy = Math.min(12, r.height / 2);
        var pts = [
            [r.left + r.width / 2, r.top + r.height / 2],
            [r.left + ix, r.top + iy],
            [r.right - ix, r.top + iy],
            [r.left + ix, r.bottom - iy],
            [r.right - ix, r.bottom - iy]
        ];
        for (var i = 0; i < pts.length; i++) {
            var t = document.elementFromPoint(pts[i][0], pts[i][1]);
            if (!t) continue;
            if (el === t || el.contains(t)) continue;
            // 插件自己的 toast / 续播提示压在播放器上不算遮挡
            if (t.closest && t.closest('.vv-toast, .vv-save-seek')) continue;
            return true;
        }
    } catch (e) {}
    return false;
}

function vvEscape(s) {
    return String(s === undefined || s === null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function vvFmtTime(sec) {
    // 直播流没有有限时长（duration = Infinity），别让 NaN 漏到界面上；NaN（还没加载完）仍按 0 处理
    if (sec === Infinity || sec === -Infinity) return '直播';
    sec = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var mm = (m < 10 ? '0' : '') + m;
    var ss = (s < 10 ? '0' : '') + s;
    if (h > 0) return h + ':' + mm + ':' + ss;
    return mm + ':' + ss;
}

function vvFmtBytes(b) {
    b = Number(b) || 0;
    if (b <= 0) return '0 B';
    if (b < 1024) return Math.round(b) + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
    return (b / 1073741824).toFixed(2) + ' GB';
}

function vvFmtSpeed(kbps) {
    kbps = Number(kbps) || 0;
    if (kbps <= 0) return '';
    if (kbps < 1024) return Math.round(kbps) + ' KB/s';
    return (kbps / 1024).toFixed(1) + ' MB/s';
}

// m3u8/mp4 的通用文件名没有任何信息量：
// 有的站点所有清单都叫 main.m3u8，直接显示标题栏就是一堆 "main"，用户完全看不出在播什么。
var VV_GENERIC_NAME = /^(?:main|index|master|manifest|playlist|media|video|movie|stream|chunklist|prog_index|out|output|hls|live|default|source|file|test|\d{1,4})$/i;

function vvPageTitle() {
    try {
        var t = (document.title || '').replace(/\s+/g, ' ').trim();
        if (t) return t.slice(0, 60);
    } catch (e) {}
    return '';
}

function vvShortName(item, idx) {
    var nm = item.name || '';
    if (nm && !VV_GENERIC_NAME.test(nm)) return vvEscape(nm);
    // 通用文件名 → 退回页面标题，信息量远大于文件名
    var pt = vvPageTitle();
    if (pt) return vvEscape(pt) + (idx > 0 ? ' #' + (idx + 1) : '');
    var host = '';
    try { host = new URL(item.url).hostname.replace(/^www\./, ''); } catch (e) { host = ''; }
    if (!host) host = '页面流';
    return '【' + (VV_TYPE_CN[item.type] || '视频') + '】' + (idx + 1) + ' · ' + host;
}

function vvAbsUrl(u, base) {
    try { return new URL(u, base || location.href).href; } catch (e) { return u; }
}

function vvHlsRoot(u) {
    try {
        var x = new URL(u);
        var p = x.pathname || '';
        var i = p.lastIndexOf('/');
        return x.origin + p.slice(0, i + 1);
    } catch (e) { return ''; }
}

// HLS 的 fMP4 分片常叫 main.mp4 / init.mp4 / seg-1.mp4 / 0001.mp4。
// 只看扩展名会把它们当成独立 mp4 视频，必须结合已知的 m3u8 目录过滤。
function vvIsHlsSegmentUrl(u) {
    try {
        var x = new URL(u);
        var p = x.pathname || '';
        var file = p.slice(p.lastIndexOf('/') + 1).toLowerCase();
        if (!/\.(?:mp4|m4s|m4a|aac|ts)$/.test(file)) return false;
        var named = /^(?:init|main|seg|segment|chunk|frag|fragment|part|index|video|audio|media|file|out)[-_]?\d*\.(?:mp4|m4s|m4a|aac|ts)$/.test(file);
        if (!named && !/^\d+\.(?:mp4|m4s|m4a|aac|ts)$/.test(file)) return false;
        var roots = VV.hlsRoots || {};
        var originRoot = x.origin + '/';
        for (var root in roots) {
            if (!root || u.indexOf(root) !== 0) continue;
            // 根目录只过滤子目录里的分片；同目录的 main.mp4 可能是普通视频
            if (root === originRoot && u.slice(root.length).indexOf('/') < 0) continue;
            return true;
        }
    } catch (e) {}
    return false;
}

// 媒体清单（#EXTINF）如果位于已知主清单目录的子目录，或名字像变体清单，就不再单独展示
function vvLooksLikeHlsVariant(item) {
    try {
        var u = item && item.url;
        if (!u) return false;
        var roots = VV.hlsRoots || {};
        for (var root in roots) {
            if (!root || u.indexOf(root) !== 0) continue;
            var rest = u.slice(root.length);
            var file = rest.slice(rest.lastIndexOf('/') + 1).toLowerCase();
            if (rest.indexOf('/') >= 0) return true;
            if (/^(?:index|prog_index|playlist|media|main|video|audio|stream|chunklist|\d{3,4}p(?:\d+)?)[-_]?\d*\.m3u8$/.test(file)) return true;
        }
    } catch (e) {}
    return false;
}

function vvDropItemsUnderMaster(root) {
    if (!root) return;
    var changed = false;
    for (var i = VV.items.length - 1; i >= 0; i--) {
        var it = VV.items[i];
        if (!it || !it.url || it.url.indexOf(root) !== 0) continue;
        var drop = it.type === 'HLS' ? vvIsHlsVariantUnderMaster(it) : vvIsHlsSegmentUrl(it.url);
        if (drop) {
            VV.items.splice(i, 1);
            delete VV.seen[it.url];
            changed = true;
        }
    }
    if (changed) {
        try { if (vvUI && vvUI.panel && VV._panelOpen) vvRenderPanel(vvUI.panel); } catch (e0) {}
        try { if (VV.items.length) vvShowBadgeNew(); } catch (e1) {}
    }
}

// 已知主清单目录下的子目录清单，或同目录的 720p/index 等，视为变体
function vvIsHlsVariantUnderMaster(item) {
    try {
        var u = item && item.url;
        if (!u) return false;
        var own = vvHlsRoot(u);
        var file = u.split('?')[0].split('#')[0];
        file = file.slice(file.lastIndexOf('/') + 1).toLowerCase();
        // 另一个主清单不要误杀
        if (/^(?:master|manifest|playlist)\.m3u8$/.test(file)) return false;
        var masters = VV.hlsMasterRoots || {};
        for (var root in masters) {
            if (!root || u.indexOf(root) !== 0) continue;
            if (root !== own) return true;
        }
        if (masters[own]) {
            if (/^(?:index|prog_index|playlist|media|main|video|audio|stream|chunklist|\d{3,4}p(?:\d+)?)[-_]?\d*\.m3u8$/.test(file)) return true;
        }
    } catch (e) {}
    return false;
}

// 解析 master m3u8，记录各码率子清单，避免播放列表里出现一堆同名变体
function vvNoteHlsBody(item, text, base) {
    if (!item || item.type !== 'HLS' || !text || text.length > 600000) return;
    var t = String(text);
    if (t.indexOf('#EXT-X-STREAM-INF') >= 0) {
        VV.hlsMasters[item.url] = true;
        var mroot = vvHlsRoot(item.url);
        if (mroot) {
            VV.hlsMasterRoots = VV.hlsMasterRoots || {};
            VV.hlsMasterRoots[mroot] = 1;
            vvDropItemsUnderMaster(mroot);
        }
        var lines = t.split(/\r?\n/);
        var expect = false;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            // 音轨/字幕/iframe 清单也属于主清单，不单独展示
            if (line.indexOf('#EXT-X-MEDIA:') === 0 || line.indexOf('#EXT-X-I-FRAME-STREAM-INF:') === 0) {
                var um = /URI="([^"]+)"/i.exec(line);
                if (um) {
                    var mu = vvAbsUrl(um[1], base || item.url);
                    VV.hlsVariants[mu] = item.url;
                    vvDropItemByUrl(mu);
                }
                continue;
            }
            if (line.indexOf('#EXT-X-STREAM-INF') === 0) { expect = true; continue; }
            if (line.charAt(0) === '#') continue;
            if (expect) {
                expect = false;
                var abs = vvAbsUrl(line, base || item.url);
                if (/\.m3u8(?:[?#]|$)/i.test(abs)) {
                    VV.hlsVariants[abs] = item.url;
                    vvDropItemByUrl(abs);
                }
            }
        }
        return;
    }
    // 媒体清单：hls.js 会加载 prog_index / chunklist 等子清单，
    // 若它位于已知主清单目录下，标记为变体并移除，避免列表刷屏
    if (t.indexOf('#EXTINF') >= 0 && vvLooksLikeHlsVariant(item)) {
        VV.hlsVariants[item.url] = true;
        vvDropItemByUrl(item.url);
        return;
    }
    if (VV.hlsVariants[item.url]) return;
}

function vvDropItemByUrl(url) {
    var changed = false;
    for (var i = VV.items.length - 1; i >= 0; i--) {
        if (VV.items[i].url === url) {
            VV.items.splice(i, 1);
            delete VV.seen[url];
            changed = true;
        }
    }
    if (changed) {
        try { if (vvUI && vvUI.panel && VV._panelOpen) vvRenderPanel(vvUI.panel); } catch (e0) {}
        try { if (VV.items.length) vvShowBadgeNew(); } catch (e1) {}
    }
}

function vvResolve(rawUrl, contentType) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    var u = rawUrl.trim();
    if (!u || u.length > 2048) return null;
    if (u.indexOf('data:') === 0 || u.indexOf('javascript:') === 0 || u.indexOf('about:') === 0) return null;
    if (u.indexOf('blob:') === 0) {
        return { url: u, type: 'BLOB', name: '' };
    }
    if (u.indexOf('//') === 0) u = location.protocol + u;
    var lo = u.toLowerCase();
    if (lo.indexOf('http://') !== 0 && lo.indexOf('https://') !== 0) {
        // 站内相对地址（<video src="/v/1.mp4">）按当前页面补全
        try {
            var abs = new URL(u, location.href);
            if (abs.protocol === 'http:' || abs.protocol === 'https:') u = abs.href;
        } catch (eAbs) {}
        lo = u.toLowerCase();
    }
    if (lo.indexOf('http://') !== 0 && lo.indexOf('https://') !== 0) return null;

    var type = null;
    var ct = (contentType || '').split(';')[0].trim().toLowerCase();
    if (ct) type = VV_CT_TYPE[ct] || null;

    var qMark = u.indexOf('#');
    var path = qMark >= 0 ? u.slice(0, qMark) : u;
    var qPos = path.indexOf('?');
    var pathOnly = qPos >= 0 ? path.slice(0, qPos) : path;
    var segIdx = pathOnly.lastIndexOf('/');
    var file = pathOnly.slice(segIdx + 1);
    var dotIdx = file.lastIndexOf('.');
    var ext = dotIdx > 0 ? file.slice(dotIdx + 1).toLowerCase() : '';
    var stem = dotIdx > 0 ? file.slice(0, dotIdx) : '';
    var name = '';
    try { name = stem ? decodeURIComponent(stem) : ''; } catch (e3) { name = stem; }
    // 有些 HLS 地址以 /.m3u8 结尾（如 Unified Streaming），用上级目录名当标题
    if (!name && segIdx > 0) {
        var parent = pathOnly.slice(0, segIdx).split('/').pop() || '';
        try { parent = decodeURIComponent(parent); } catch (eP) {}
        name = parent.replace(/\.(?:ism|mpd|m3u8)$/i, '');
    }

    if (!type && ext) type = VV_EXT_TYPE[ext] || null;
    if (!type && qPos >= 0) {
        var parts = path.slice(qPos + 1);
        var dec = parts;
        try { dec = decodeURIComponent(parts); } catch (e4) {}
        var mm = /(?:https?|%68%74%74%70)[^\s&"']{8,}?\.m3u8[^\s&"']{0,200}/i.exec(dec);
        if (mm) {
            var mu = mm[0].replace(/\\u002f/gi, '/').replace(/\\u0026/gi, '&');
            return vvResolve(mu, null);
        }
    }
    if (!type) return null;
    if (ext === 'ts' || ext === 'm4s' || ext === 'key') return null;

    var host = '';
    try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (e5) { host = u.slice(0, 30); }
    if (!name) name = host;

    return { url: u, type: type, name: name.slice(-60), host: host };
}

// 是否是"纯音频"的 HLS 清单（只有声音没有画面）。
// 有的站点会同时吐出 /asp/hls/…（视频）、/asp/hlsaudio/…（音轨）、
// /asp/audio/…/mp3/…（音频）多个主清单，点错就变黑屏，必须在列表里降权。
function vvLooksLikeAudioHls(url) {
    var p = String(url || '').toLowerCase();
    if (p.indexOf('.m3u8') < 0) return false;
    var path = p.split('?')[0];
    var segs = path.split('/');
    for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        if (!s || s === 'main.m3u8' || s === 'index.m3u8' || s === 'playlist.m3u8') continue;
        if (/(?:^|[-_.])(?:audio|mp3|aac|audioonly)(?:$|[-_.])/.test(s)) return true;
        if (/^(?:hlsaudio|audioonly|audio_stream|audio-stream|audiom3u8)$/.test(s)) return true;
    }
    return false;
}

// 列表排序权重：越小越可信、越靠前。
// 嗅探是异步的，条目到达顺序随机；不能靠到达先后决定谁在第一位，
// 否则用户默认点到的可能是音轨清单或 blob 死链。
function vvItemRank(item) {
    if (!item) return 9;
    if (item.type === 'BLOB') return 9;
    if (item.type === 'AUDIO') return 4;
    if (item.type === 'HLS') return vvLooksLikeAudioHls(item.url) ? 3 : 1;
    // mp4 / webm / mkv 等直链最可信
    return 0;
}

function vvPushItem(item) {
    if (!item || !item.url || VV.seen[item.url]) return false;
    if (!VV.cfg.enabled || VV.cfg.siteOff) return false;
    if (item.type === 'HLS') {
        var hroot = vvHlsRoot(item.url);
        if (hroot) {
            VV.hlsRoots = VV.hlsRoots || {};
            VV.hlsRoots[hroot] = 1;
        }
        if (VV.hlsVariants[item.url]) return false;
        // 主清单 body 读不到时（CORS/代理），靠主清单文件名登记目录，
        // 后续同目录子目录里的 prog_index / chunklist 就不会刷屏
        var hfile = item.url.split('?')[0].split('#')[0];
        hfile = hfile.slice(hfile.lastIndexOf('/') + 1).toLowerCase();
        if (/^(?:master|manifest|playlist)\.m3u8$/.test(hfile) && hroot) {
            VV.hlsMasterRoots = VV.hlsMasterRoots || {};
            VV.hlsMasterRoots[hroot] = 1;
            vvDropItemsUnderMaster(hroot);
        }
        if (vvIsHlsVariantUnderMaster(item)) return false;
    } else if (vvIsHlsSegmentUrl(item.url)) {
        return false;
    }
    if (item.type === 'BLOB') {
        // 原生流只保留最新一条，避免 MSE 反复建流刷屏
        for (var bi = VV.items.length - 1; bi >= 0; bi--) {
            if (VV.items[bi].type === 'BLOB') {
                delete VV.seen[VV.items[bi].url];
                VV.items.splice(bi, 1);
            }
        }
    }
    VV.seen[item.url] = true;
    item.foundAt = Date.now();
    item.uid = 'vv' + (Date.now().toString(36)) + (Math.random() * 1e6 | 0).toString(36);
    // 按"可信度"插入，而不是永远插到最前：
    // 嗅探到达顺序是随机的（同一页面两次加载，首条可能在 enc / hlsaudio 之间跳），
    // 若按到达顺序排，用户点第一条就可能点到纯音频清单（黑屏）或 blob 死链。
    // 规则：rank 小的靠前；同 rank 内新的在前（保持原有的"最近发现"直觉）。
    var myRank = vvItemRank(item);
    var at = VV.items.length;
    for (var bj = 0; bj < VV.items.length; bj++) {
        if (vvItemRank(VV.items[bj]) > myRank) { at = bj; break; }
    }
    VV.items.splice(at, 0, item);
    if (VV.items.length > 60) {
        var old = VV.items.pop();
        delete VV.seen[old.url];
    }
    try { if (vvUI && vvUI.panel && VV._panelOpen) vvRenderPanel(vvUI.panel); } catch (eR) {}
    vvShowBadgeNew();
    return true;
}

function vvScanText(text, source) {
    if (!text || text.length > 600000) return;
    // 先做低成本预检，绝大多数 API 文本不含视频扩展名，直接跳过昂贵的正则
    if (text.indexOf('.m3u8') < 0 && text.indexOf('.mp4') < 0 && text.indexOf('.m4v') < 0 &&
        text.indexOf('.webm') < 0 && text.indexOf('.mkv') < 0 && text.indexOf('.flv') < 0 &&
        text.indexOf('.f4v') < 0) return;
    var hits = 0;
    var m;
    VV_SCAN_RX.lastIndex = 0;
    while ((m = VV_SCAN_RX.exec(text)) !== null) {
        var r = vvResolve(m[0].replace(/\\u002f/gi, '/').replace(/\\u0026/gi, '&'), null);
        if (r) {
            if (source && r.name.length < 3) r.name += ' (' + source + ')';
            vvPushItem(r);
            hits++;
        }
        if (hits >= 5) break;
    }
    if (hits >= 5) VV_SCAN_RX.lastIndex = 0;
}

function vvToast(msg, long) {
    try {
        var t = document.getElementById('vv-toast');
        if (!t) {
            t = vvEl('div', '', '');
            t.id = 'vv-toast';
            document.documentElement.appendChild(t);
        }
        t.innerHTML = vvEscape(msg);
        t.className = 'vv-toast' + (long ? ' show-long' : '') + ' show';
        vvBringToFront(t);
        clearTimeout(t._tm);
        t._tm = setTimeout(function () {
            t.className = 'vv-toast';
        }, long ? 4200 : 2200);
    } catch (e) {}
}
if (window.top !== window.self) { throw new Error('via-vp: iframe skip'); }

var VV_PROTO = location.protocol;
if (VV_PROTO !== 'http:' && VV_PROTO !== 'https:') { throw new Error('via-vp: scheme skip'); }

var vvSiteKey = 'offsite:' + location.hostname;
var vvSiteOff = vvGet(vvSiteKey, false);
VV.cfg.siteOff = vvSiteOff;

// ---- 响应体取值闸门 ----
//
// 以前是"只要 ct 以 text 开头就读一遍 body"，覆盖面看着广，代价却极高：
// fetch 分支要 resp.clone().text()，等于把整个响应体再复制一份字符串。
// 一个装了二三十个脚本的资讯/视频站，光 JS bundle 就有几十 MB，
// 首屏阶段我们要白白复制几十 MB、再对每份跑一遍正则预检。
// 低端机（2~4GB 内存、单核大核）上表现为首屏卡顿、掉帧，严重时 WebView 直接 OOM 白屏。
// 这也解释了"有的站开十几个没事、有的站开一个就卡"——差别在站点的响应体规模，不在页签数。
//
// 现在的判据：
//   1) 只放行"可能是接口数据"的类型（json / plain / 表单 / m3u8 清单）；
//   2) js、css、html、xml、svg、event-stream 一律不碰；
//   3) 超过 256KB 的一律不碰（真清单和真接口都远小于这个量级）。
var VV_BODY_CT = {
    'application/json': 1,
    'application/x-json': 1,
    'text/json': 1,
    'text/plain': 1,
    'application/x-www-form-urlencoded': 1,
    'application/vnd.apple.mpegurl': 1,
    'application/x-mpegurl': 1,
    'audio/mpegurl': 1,
    'audio/x-mpegurl': 1
};
var VV_BODY_MAX = 262144;
// 空 ct 的响应不放行：那多半是流式资源或二进制，读它风险大于收益。
// 例外是"小且不是静态资源"的响应——部分老接口不发 ct，漏了就是真的搜不到。
var VV_STATIC_EXT = /\.(?:js|mjs|css|html?|xml|svg|png|jpe?g|gif|webp|woff2?|ttf|otf|ico)(?:[?#]|$)/i;

function vvWantBody(ct, len, url) {
    var yes = vvWantBodyRaw(ct, len, url);
    // 记一笔账：卡死/卡顿类问题没法靠"感觉"定位，
    // 得能直接说出"这次页面加载我们省掉了多少次读取、多少字节"。
    try {
        if (yes) VV._bodyRead = (VV._bodyRead || 0) + 1;
        else {
            VV._bodySkip = (VV._bodySkip || 0) + 1;
            if (len) VV._bodySkipKb = (VV._bodySkipKb || 0) + Math.round(len / 1024);
        }
    } catch (eB) {}
    return yes;
}

function vvWantBodyRaw(ct, len, url) {
    if (len > VV_BODY_MAX) return false;
    var c = ct ? String(ct).split(';')[0].trim().toLowerCase() : '';
    if (c) {
        if (VV_BODY_CT[c]) return true;
        return /\+json$/.test(c);   // application/vnd.api+json 之类
    }
    return len > 0 && len <= 65536 && !VV_STATIC_EXT.test(url || '');
}

var VvOfOpen = XMLHttpRequest.prototype.open;
var VvOfSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (method, url) {
    var self = this;
    self._vvUrl = url;
    self._vvMethod = method;
    return VvOfOpen.apply(self, arguments);
};

XMLHttpRequest.prototype.send = function () {
    var self = this;
    if (!self._vvHooked) {
        self._vvHooked = true;
        try { self.addEventListener('load', function () { vvOnXhr(self); }); } catch (e) {}
    }
    return VvOfSend.apply(self, arguments);
};

function vvOnXhr(xhr) {
    try {
        var rt = xhr.responseType;
        if (rt && rt !== 'text' && rt !== 'json' && rt !== '') return;
        var ct = '';
        var len = 0;
        try { ct = (xhr.getResponseHeader && xhr.getResponseHeader('Content-Type')) || ''; } catch (eC) {}
        try { len = Number(xhr.getResponseHeader && xhr.getResponseHeader('Content-Length')) || 0; } catch (eL) {}
        var r = vvResolve(xhr._vvUrl || '', ct);
        if (r) {
            // URL 本身就认出来了：只有 HLS 清单需要读 body（要挑码率），其余不必读。
            if (r.type === 'HLS') {
                try { vvNoteHlsBody(r, xhr.responseText || '', xhr.responseURL || xhr._vvUrl); } catch (eH) {}
            }
            vvPushItem(r);
            return;
        }
        // 没认出来，才需要读 body 找线索。但先过闸门：
        // JS/CSS/HTML 这类大响应读了纯属浪费（见 vvWantBody 注释）。
        if (rt === 'json') {
            if (xhr.response && vvWantBody(ct || 'application/json', len, xhr._vvUrl)) {
                vvScanText(JSON.stringify(xhr.response), 'api');
            }
            return;
        }
        if (!vvWantBody(ct, len, xhr._vvUrl)) return;
        var txt = xhr.responseText;
        if (txt && txt.length < 600000) vvScanText(txt, null);
    } catch (e) {}
}

var VvOfFetch = window.fetch;
if (typeof VvOfFetch === 'function') {
    window.fetch = function () {
        var args = arguments;
        var inputUrl = '';
        try {
            var inp = args[0];
            if (typeof inp === 'string') inputUrl = inp;
            else if (inp && inp.url) inputUrl = inp.url;
        } catch (e) {}
        var p = VvOfFetch.apply(window, args);
        if (inputUrl) {
            p.then(function (resp) {
                try {
                    var ct = '';
                    try { ct = resp.headers.get('Content-Type') || ''; } catch (e2) {}
                    var len = 0;
                    try { len = Number(resp.headers.get('Content-Length')) || 0; } catch (e3) {}
                    var url = (resp && resp.url) || inputUrl;
                    var r = vvResolve(url, ct);
                    if (r) {
                        // 清单要读 body 才能挑码率；其余类型 URL 已经说明一切，不必读。
                        if (r.type === 'HLS') {
                            try {
                                resp.clone().text().then(function (t) {
                                    try { vvNoteHlsBody(r, t, url); } catch (eH) {}
                                }).catch(function () {});
                            } catch (eH2) {}
                        }
                        vvPushItem(r);
                        return;
                    }
                    if (ct && (ct.indexOf('video') === 0 || ct.indexOf('m3u8') >= 0 || ct.indexOf('mpegurl') >= 0)) {
                        var r2 = vvResolve(inputUrl, ct);
                        if (r2) vvPushItem(r2);
                        return;
                    }
                    // 闸门必须在 clone 之前：clone() 本身就是一次流复制 + 全量缓冲，
                    // "先读了再看有没有用"等于把代价付完了才决定不读。
                    if (!vvWantBody(ct, len, url)) return;
                    resp.clone().text().then(function (t) {
                        if (t && t.length < 600000) vvScanText(t, null);
                    }).catch(function () {});
                } catch (e1) {}
            }, function () {});
        }
        return p;
    };
}

var VvWeak = {};
var VvObserved = false;

function vvScanNode(node) {
    if (!node) return;
    if (node.nodeType === 1) {
        vvCheckMediaNode(node);
        // 只在"确实是容器"时才做子树查询。叶子节点（<img>、<span>、<br>、文本包装）
        // 占新增节点的绝大多数，对它们调 querySelectorAll 纯属白跑。
        if (node.childElementCount && node.querySelectorAll) {
            try {
                var vids = node.querySelectorAll('video,source');
                for (var i = 0; i < vids.length; i++) vvCheckMediaNode(vids[i]);
            } catch (e3) {}
        }
    }
}

function vvCheckMediaNode(n) {
    try {
        // 用 nodeName 而不是 tagName.toLowerCase()：这个函数会被 MutationObserver
        // 按属性变更频率调用（懒加载图片每张都会改 src），每次少分配一个字符串，
        // 在图片瀑布流页面上差的是每秒几百次分配。
        var nm = n.nodeName;
        var tag = '';
        if (nm === 'VIDEO' || nm === 'SOURCE') tag = 'video';
        else if (nm === 'A') tag = 'a';
        else return;
        var u = '';
        if (tag === 'video') u = n.getAttribute('src') || n.src || '';
        else u = n.getAttribute('href') || '';
        if (!u) return;
        var r = vvResolve(u, '');
        if (r && vvPushItem(r) && tag === 'video' && n.currentSrc && n.currentSrc.indexOf('blob:') === 0) {
            vvPushItem(vvResolve(n.currentSrc, ''));
        }
        if (tag === 'video') vvWatchVideoEl(n);
        // 顺手把页面视频的 preload="auto" 降级，避免没起播也整段预载（见 12-autoplay.js）
        if (tag === 'video') { try { vvApTamePreload(n); } catch (eA) {} }
    } catch (e) {}
}

function vvWatchVideoEl(videoEl) {
    if (!videoEl || videoEl._vvWatched) return;
    videoEl._vvWatched = true;
    var onMeta = function () {
        try {
            var cs = videoEl.currentSrc || videoEl.src || '';
            if (cs && cs.indexOf('blob:') === 0) vvPushItem(vvResolve(cs, ''));
        } catch (e) {}
    };
    videoEl.addEventListener('loadedmetadata', onMeta, true);
    videoEl.addEventListener('loadeddata', onMeta, true);
}

function vvScanDOM() {
    try {
        if (!document.body) return;
        vvScanNode(document.body);
    } catch (e) {}
}

var vvMoQueue = [];
// 队列上限。这个数字不是随便定的：它要能装下"一屏懒加载 + 一次无限滚动"的量，
// 又不能装到让 drain 追不上。以前没有上限，在弹幕/瀑布流/自动轮播这类
// "每秒新增几百个节点"的页面上，生产速度长期高于消费速度，队列会一路涨到几十万，
// 内存翻倍、主线程被自己的扫描任务占满——表现出来就是"页面越来越卡，最后卡死"。
// 这和站点是否在播视频无关，所以"有的站开十几个都没事，有的站开一个就卡"。
var VV_MO_MAX = 320;
var VV_MO_BUDGET = 8;      // 每批最多占用主线程 8ms，超了就排下一批

function vvDrainMoQueue() {
    VV._moTimer = null;
    // 播放中不再扫描新增节点，把 CPU 让给视频解码；关闭播放器时会全页补扫一次
    if (VV.playerActive) { vvMoQueue = []; return; }
    var q = vvMoQueue;
    vvMoQueue = [];
    var n = Math.min(q.length, 120);
    var t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    var i = 0;
    for (; i < n; i++) {
        try { vvScanNode(q[i]); } catch (eS) {}
        // 时间预算：单个节点可能是几千节点的子树根（一次渲染整块列表），
        // 固定"120 个"这种按数量分批挡不住它。按毫秒切才真的不会卡帧。
        if (t0 && i > 0 && (i & 7) === 0 && performance.now() - t0 > VV_MO_BUDGET) { i++; break; }
    }
    VV._moNodes = (VV._moNodes || 0) + i;
    if (i < q.length) {
        // 广告/瀑布流页面一次可能新增大量节点，分批处理，避免单帧长时间占用主线程
        vvMoQueue = q.slice(i).concat(vvMoQueue);
        VV._moTimer = setTimeout(vvDrainMoQueue, 120);
    }
}

if (window.MutationObserver) {
    var vvMO = new MutationObserver(function (muts) {
        if (VV.playerActive) return; // 播放中挂起节点嗅探
        for (var i = 0; i < muts.length; i++) {
            var m = muts[i];
            if (m.type === 'attributes') {
                // 先按 nodeName 粗筛，别把懒加载图片的 src 变更也送进 vvResolve。
                // 大图站每屏几十次属性变更，全送进去就是每秒几百次 URL 解析。
                var tn = m.target && m.target.nodeName;
                if (tn === 'VIDEO' || tn === 'SOURCE' || tn === 'A' || tn === 'IFRAME') vvCheckMediaNode(m.target);
                continue;
            }
            var an = m.addedNodes;
            for (var j = 0; j < an.length; j++) {
                var node = an[j];
                if (node && node.nodeType === 1) vvMoQueue.push(node);
            }
        }
        if (vvMoQueue.length > VV_MO_MAX) {
            // 丢最旧的：新节点更可能是当前这一屏的播放器
            VV._moDropped = (VV._moDropped || 0) + (vvMoQueue.length - VV_MO_MAX);
            vvMoQueue = vvMoQueue.slice(vvMoQueue.length - VV_MO_MAX);
        }
        // 只处理新增节点，不再每次 DOM 变动都全量扫描整页
        if (vvMoQueue.length && !VV._moTimer) {
            VV._moTimer = setTimeout(vvDrainMoQueue, 150);
        }
    });
    VvObserved = true;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        vvStartDomScan();
    }, false);
} else {
    vvStartDomScan();
}

function vvStartDomScan() {
    if (VV._domScanned) return;
    VV._domScanned = true;
    if (VvObserved) {
        try { vvMO.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href'] }); } catch (e) {}
    }
    document.addEventListener('loadedmetadata', function (evt) {
        vvWatchVideoEl(evt.target);
        vvCheckMediaNode(evt.target);
    }, true);
    vvStartPerfScan();
    setTimeout(vvScanDOM, 10);
    setTimeout(vvScanDOM, 400);
    setTimeout(vvScanDOM, 1600);
}

// 资源计时嗅探：油猴没有 chrome.webRequest，但 PerformanceObserver / performance
// 资源条目能看到页面自身（包括脚本注入前）请求过的媒体 URL，弥补 XHR/fetch/DOM 盲区。
var vvPerfCursor = 0;
var vvPerfSeen = {};
var vvPerfTimer = null;

function vvScanPerf(limit) {
    try {
        if (VV.cfg.siteOff || !VV.cfg.enabled) return 0;
        if (VV.playerActive) return 0; // 播放中挂起资源计时扫描
        var perf = window.performance || (typeof performance !== 'undefined' ? performance : null);
        if (!perf || typeof perf.getEntriesByType !== 'function') return 0;
        var entries = perf.getEntriesByType('resource');
        if (!entries || !entries.length) return 0;
        // 资源条目是累积列表；用游标分批处理，避免广告页几千条资源卡住主线程
        if (vvPerfCursor > entries.length) vvPerfCursor = 0;
        var end = Math.min(entries.length, vvPerfCursor + (limit || 400));
        var added = 0;
        for (var i = vvPerfCursor; i < end; i++) {
            var e = entries[i];
            var u = e && (e.name || e.url);
            if (!u || vvPerfSeen[u]) continue;
            vvPerfSeen[u] = 1;
            var r = vvResolve(u, '');
            if (r && vvPushItem(r)) added++;
        }
        vvPerfCursor = end;
        if (end < entries.length) vvSchedulePerf(120);
        return added;
    } catch (e) { return 0; }
}

function vvSchedulePerf(delay) {
    try {
        if (vvPerfTimer) return;
        vvPerfTimer = setTimeout(function () {
            vvPerfTimer = null;
            vvScanPerf();
        }, delay || 300);
    } catch (e) {}
}

function vvStartPerfScan() {
    if (VV._perfStarted) return;
    VV._perfStarted = true;
    vvScanPerf();
    try {
        if (window.PerformanceObserver) {
            var po = new PerformanceObserver(function () { vvSchedulePerf(250); });
            po.observe({ entryTypes: ['resource'] });
            VV._perfObs = po;
        }
    } catch (e) {}
    // 兼容不支持 PerformanceObserver 的旧 WebView；覆盖首屏和懒加载资源
    [400, 1600, 4000, 8000].forEach(function (ms) {
        setTimeout(vvScanPerf, ms);
    });
}
var VV_CSS = `
/* ============================================================
   设计令牌
   all: initial 不会重置自定义属性，所以令牌可以直接挂在浮层根节点上。
   ============================================================ */
.vv-badge, .vv-panel-wrap, .vv-player-root, .vv-toast, .vv-save-seek, .vv-share-wrap { all: initial; }
.vv-player-root, .vv-panel-wrap, .vv-badge, .vv-share-wrap, .vv-toast, .vv-save-seek {
  --vv-accent: #4d8dff;
  --vv-accent-2: #7fb2ff;
  --vv-accent-weak: rgba(77,141,255,.16);
  --vv-accent-line: rgba(77,141,255,.42);
  --vv-glass: rgba(19,20,27,.80);
  --vv-glass-2: rgba(18,19,26,.90);
  --vv-line: rgba(255,255,255,.10);
  --vv-line-2: rgba(255,255,255,.18);
  --vv-t1: #fff;
  --vv-t2: rgba(255,255,255,.66);
  --vv-t3: rgba(255,255,255,.42);
  --vv-r-lg: 22px;
  --vv-r-md: 14px;
  --vv-r-sm: 10px;
  --vv-ease: cubic-bezier(.32,.72,0,1);
  --vv-blur: 18px;
}
/* all: initial 把 box-sizing 打回 content-box，这里统一收口。
   max-width/max-height 必须一起清掉：站点几乎都会写 video{max-height:…}，
   而 max-* 不在我们显式声明的属性里，会原样漏进播放器（实测 max-height:38vh
   会把 360x520 的播放器视频压成 198px 高，下面留一大块黑）。 */
.vv-player-root *, .vv-panel-wrap *, .vv-badge *, .vv-share-wrap *,
.vv-toast *, .vv-save-seek * { box-sizing: border-box; max-width: none; max-height: none; }

/* ============================================================
   外部播放器浮层（.vv-share-*）
   ============================================================ */
.vv-share-wrap { position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 2147483647; background: rgba(8,8,12,.78); display: flex; align-items: flex-end; font-family: system-ui, -apple-system, sans-serif; }
.vv-share { width: 100%; max-height: 86%; overflow-y: auto; overscroll-behavior: contain; background: var(--vv-glass-2); border-top: 1px solid var(--vv-line-2); border-radius: var(--vv-r-lg) var(--vv-r-lg) 0 0; color: #e9eaee; padding: 18px 18px calc(env(safe-area-inset-bottom, 0px) + 18px); box-shadow: 0 -20px 48px rgba(0,0,0,.5); animation: vvSlideUp .22s var(--vv-ease); }
.vv-share-head { display: flex; align-items: center; margin-bottom: 10px; }
.vv-share-title { flex: 1; font-size: 17px; font-weight: 700; color: #fff; letter-spacing: .01em; }
.vv-share-x { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid var(--vv-line); border-radius: 50%; background: rgba(255,255,255,.08); color: #cfd2dc; font-size: 13px; line-height: 1; transition: background .16s var(--vv-ease); }
.vv-share-x:active { background: rgba(255,255,255,.16); }
.vv-share-sub { font-size: 12px; line-height: 1.65; color: var(--vv-t2); margin-bottom: 12px; }
.vv-share-url { font-size: 11px; line-height: 1.55; color: rgba(255,255,255,.52); background: rgba(0,0,0,.30); border: 1px solid var(--vv-line); border-radius: var(--vv-r-md); padding: 10px 12px; word-break: break-all; margin-bottom: 12px; font-family: ui-monospace, Menlo, monospace; }
.vv-share-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.vv-share-btn { flex: 1 1 46%; min-height: 44px; border: 1px solid var(--vv-line); border-radius: var(--vv-r-md); background: rgba(255,255,255,.07); color: #e9eaee; font-size: 13px; padding: 0 10px; transition: background .16s var(--vv-ease), transform .12s var(--vv-ease); }
.vv-share-btn:active { background: rgba(255,255,255,.13); transform: scale(.985); }
.vv-share-btn.primary { background: var(--vv-accent); border-color: transparent; font-weight: 600; box-shadow: 0 6px 18px rgba(77,141,255,.32); }
.vv-share-btn[disabled] { opacity: .5; }
.vv-share-log { font-size: 12px; line-height: 1.75; color: rgba(255,255,255,.58); background: rgba(0,0,0,.30); border: 1px solid var(--vv-line); border-radius: var(--vv-r-md); padding: 11px 12px; word-break: break-all; font-family: ui-monospace, Menlo, monospace; }
.vv-share-line { margin-bottom: 2px; }
.vv-share-verdict { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--vv-line); color: var(--vv-accent-2); font-weight: 600; font-family: system-ui, sans-serif; }

/* ============================================================
   悬浮角标
   ============================================================ */
.vv-badge { position: fixed; z-index: 2147483647; width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(160deg, rgba(77,141,255,.96), rgba(96,68,230,.96)); border: 1px solid rgba(255,255,255,.20); box-shadow: 0 6px 18px rgba(61,125,255,.38), 0 2px 6px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.22); display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transform: translateY(16px); transition: opacity .25s var(--vv-ease), transform .25s var(--vv-ease); touch-action: none; user-select: none; -webkit-user-select: none; }
.vv-badge.show { opacity: 1; transform: translateY(0); }
.vv-badge-num { position: absolute; top: -4px; right: -6px; min-width: 18px; height: 18px; line-height: 18px; text-align: center; border-radius: 9px; background: #ff4d4f; color: #fff; font-size: 11px; font-weight: 700; padding: 0 4px; box-sizing: content-box; font-family: system-ui, sans-serif; box-shadow: 0 1px 4px rgba(0,0,0,.35); }
.vv-badge-play { width: 0; height: 0; border-style: solid; border-width: 9px 0 9px 15px; border-color: transparent transparent transparent #fff; margin-left: 4px; }

/* ============================================================
   嗅探列表面板
   ============================================================ */
.vv-panel-wrap { position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 2147483647; background: rgba(8,9,13,.66); display: none; font-family: system-ui, -apple-system, sans-serif; }
.vv-panel-wrap.open { display: flex; flex-direction: column; justify-content: flex-end; }
.vv-panel { background: var(--vv-glass-2); border-top: 1px solid var(--vv-line-2); border-radius: var(--vv-r-lg) var(--vv-r-lg) 0 0; max-height: 72%; display: flex; flex-direction: column; color: #e9eaee; padding-bottom: env(safe-area-inset-bottom, 0px); box-shadow: 0 -20px 48px rgba(0,0,0,.5); animation: vvSlideUp .22s var(--vv-ease); }
@keyframes vvSlideUp { from { transform: translateY(40%); opacity: .4; } to { transform: translateY(0); opacity: 1; } }
.vv-head { display: flex; align-items: center; padding: 18px 16px 10px 20px; }
.vv-head-title { font-size: 17px; font-weight: 700; color: #fff; flex: 1; letter-spacing: .01em; }
.vv-head-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 30px; background: rgba(255,255,255,.08); border: 1px solid var(--vv-line); color: var(--vv-t2); font-size: 12px; padding: 5px 12px; border-radius: 15px; margin-left: 8px; font-family: inherit; transition: background .16s var(--vv-ease); }
.vv-head-btn:active { background: rgba(255,255,255,.16); }
.vv-list { overflow-y: auto; overscroll-behavior: contain; padding: 4px 12px 14px 12px; -webkit-overflow-scrolling: touch; }
.vv-row { display: flex; align-items: center; background: rgba(255,255,255,.05); border: 1px solid var(--vv-line); border-radius: var(--vv-r-md); padding: 12px; margin-bottom: 8px; transition: background .16s var(--vv-ease), transform .12s var(--vv-ease); }
.vv-row:active { background: rgba(255,255,255,.08); }
.vv-row-info { flex: 1; min-width: 0; }
.vv-row-name { font-size: 13.5px; color: #fff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vv-row-sub { font-size: 11px; color: var(--vv-t3); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vv-row-tags { margin-top: 6px; display: flex; align-items: center; }
/* 标签改成"淡色底 + 亮色字"：饱和实底在深色面板里亮度太高，一行三个会把视线全抢走 */
.vv-tag { font-size: 10px; font-weight: 700; color: #fff; border-radius: 6px; padding: 2px 7px; margin-right: 6px; font-family: system-ui, sans-serif; letter-spacing: .02em; }
.vv-tag.HLS { background: rgba(255,125,41,.18); color: #ffab6b; }
.vv-tag.MP4, .vv-tag.M4V, .vv-tag.MOV { background: rgba(77,141,255,.18); color: #9cc2ff; }
.vv-tag.WEBM, .vv-tag.MKV, .vv-tag.FLV, .vv-tag.AVI, .vv-tag.WMV { background: rgba(18,183,106,.18); color: #5ddc9b; }
.vv-tag.AUDIO { background: rgba(180,84,255,.18); color: #c69bff; }
.vv-tag.BLOB { background: rgba(255,255,255,.10); color: var(--vv-t2); }
.vv-row-acts { display: flex; align-items: center; margin-left: 10px; }
.vv-btn-play { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--vv-accent); color: #fff; font-size: 15px; margin-left: 6px; font-family: inherit; box-shadow: 0 6px 16px rgba(77,141,255,.34); transition: transform .12s var(--vv-ease), background .16s var(--vv-ease); }
.vv-btn-play:active { transform: scale(.92); background: #3f7ef0; }
.vv-btn-mini { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--vv-line); background: rgba(255,255,255,.07); color: var(--vv-t2); font-size: 13px; margin-left: 6px; font-family: inherit; transition: background .16s var(--vv-ease), transform .12s var(--vv-ease); }
.vv-btn-mini:active { background: rgba(255,255,255,.14); transform: scale(.92); }
.vv-empty { text-align: center; color: var(--vv-t3); padding: 46px 20px; font-size: 13px; }
.vv-prefix-note { padding: 8px 20px 6px; font-size: 11px; color: var(--vv-t3); }

/* ============================================================
   轻提示
   ============================================================ */
.vv-toast { position: fixed; left: 50%; bottom: 14%; transform: translateX(-50%); background: rgba(24,25,32,.94); border: 1px solid var(--vv-line); color: #fff; padding: 11px 18px; border-radius: 22px; font-size: 13px; z-index: 2147483647; opacity: 0; transition: opacity .25s var(--vv-ease); pointer-events: none; max-width: 82vw; font-family: system-ui, sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,.42); }
.vv-toast.show { opacity: 1; }
.vv-save-seek { position: fixed; left: 50%; bottom: 8%; transform: translateX(-50%); background: rgba(24,25,32,.95); color: #fff; padding: 10px 14px; border-radius: 14px; font-size: 13px; z-index: 2147483647; display: flex; align-items: center; font-family: system-ui, sans-serif; box-shadow: 0 4px 18px rgba(0,0,0,.4); }
.vv-save-seek button { margin-left: 12px; border: none; background: rgba(255,255,255,.14); color: #fff; padding: 7px 12px; border-radius: 12px; font-size: 12px; font-family: inherit; }
.vv-save-seek button.primary { background: var(--vv-accent); }

/* ============================================================
   播放器外壳
   ============================================================ */
.vv-player-root { position: fixed; left: 0; top: 0; width: 100%; height: 100vh; height: 100dvh; z-index: 2147483647; background: #000; color: #fff; font-family: system-ui, -apple-system, sans-serif; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
/* all: initial：连站点的 video{display/position/filter/transform} 一起清掉，
   否则站点给 video 加的圆角、滤镜、内边距都会渗进来 */
.vv-player-video { all: initial; display: block; width: 100%; height: 100%; max-width: none; max-height: none; object-fit: contain; background: #000; }
.vv-bright { position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; z-index: 140; }

/* ---- 页内悬浮小窗：系统画中画不可用时的降级 ----
   Via 这类 WebView 里 document.pictureInPictureEnabled 为 false，
   requestPictureInPicture() 只会抛 NotSupportedError。与其点了没反应，
   不如把播放器自己缩成一枚可拖动的 fixed 小窗：视频继续播，页面露出来还能点。 */
.vv-player-root.mini { left: auto; top: auto; width: 46vw; max-width: 240px;
  height: 25.9vw; max-height: 135px; border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.22); box-shadow: 0 10px 30px rgba(0,0,0,.55); }
/* 小窗里只留画面和一条操作条：全屏那套控制栏在 240px 宽下会挤成一团 */
.vv-player-root.mini .vv-cs-top,
.vv-player-root.mini .vv-cs-bottom,
.vv-player-root.mini .vv-center-play,
.vv-player-root.mini .vv-lockmark,
.vv-player-root.mini .vv-seek-tip,
.vv-player-root.mini .vv-ges-tip,
.vv-player-root.mini .vv-loadbar,
.vv-player-root.mini .vv-sheet,
.vv-player-root.mini .vv-err,
.vv-player-root.mini .vv-loading { display: none !important; }
.vv-mini-bar { position: absolute; left: 0; top: 0; right: 0; height: 30px; z-index: 260;
  display: none; align-items: center; justify-content: space-between; padding: 0 4px 0 9px;
  background: linear-gradient(180deg, rgba(0,0,0,.78), rgba(0,0,0,0));
  color: #fff; font: 11px system-ui, sans-serif; }
.vv-player-root.mini .vv-mini-bar { display: flex; }
.vv-mini-grip { opacity: .72; letter-spacing: .04em; pointer-events: none; }
.vv-mini-acts { display: flex; align-items: center; }
.vv-mini-btn { display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border: none; border-radius: 8px; padding: 0;
  background: rgba(255,255,255,.16); color: #fff; margin-left: 4px; }
.vv-mini-btn:active { background: rgba(255,255,255,.32); }

/* ---- 控制栏 ---- */
.vv-cs-top { position: absolute; left: 0; top: 0; width: 100%; z-index: 200; display: flex; align-items: center; gap: 4px;
  padding: calc(env(safe-area-inset-top, 0px) + 6px) calc(env(safe-area-inset-right, 0px) + 8px) 34px calc(env(safe-area-inset-left, 0px) + 8px);
  opacity: 0; pointer-events: none; transition: opacity .22s var(--vv-ease);
  background: linear-gradient(180deg, rgba(0,0,0,.68), rgba(0,0,0,.28) 58%, transparent); }
.vv-cs-bottom { position: absolute; left: 0; bottom: 0; width: 100%; z-index: 200;
  padding: 30px calc(env(safe-area-inset-right, 0px) + 10px) calc(env(safe-area-inset-bottom, 0px) + 6px) calc(env(safe-area-inset-left, 0px) + 10px);
  opacity: 0; pointer-events: none; transition: opacity .22s var(--vv-ease);
  background: linear-gradient(0deg, rgba(0,0,0,.78), rgba(0,0,0,.30) 56%, transparent); }
.vv-player-root.cs-on .vv-cs-top,
.vv-player-root.cs-on .vv-cs-bottom,
.vv-player-root.cs-on .vv-center-play { opacity: 1; pointer-events: auto; }

/* 顶栏右侧四个次要操作收进一枚玻璃胶囊：既归组，又不和标题抢注意力。
   其中两枚是全屏：fs（系统沉浸全屏）/ webfs（网页铺满，仅放大站点播放器）。 */
.vv-top-acts { display: flex; align-items: center; gap: 2px; height: 36px; padding: 0 4px; border-radius: 999px; background: rgba(255,255,255,.08); border: 1px solid var(--vv-line); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.vv-top-acts .vv-csbtn { min-width: 34px; height: 32px; padding: 0 4px; border-radius: 999px; }
/* 「网页铺满」开着时点亮这一枚；和旁边 fs 的图标切换区分开，一眼看出当前是哪种全屏 */
.vv-top-acts .vv-csbtn.on { color: var(--vv-accent); background: var(--vv-accent-weak); }

.vv-title { color: #fff; font-size: 15px; font-weight: 600; letter-spacing: .01em; line-height: 1.3; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 6px; text-shadow: 0 1px 6px rgba(0,0,0,.5); }

/* ---- 通用图标按钮 ---- */
.vv-csbtn { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; height: 40px; padding: 0 6px; border: none; border-radius: 12px; background: transparent; color: #fff; font: inherit; font-size: 12.5px; line-height: 1; -webkit-tap-highlight-color: transparent; transition: background .16s var(--vv-ease), transform .16s var(--vv-ease), opacity .16s; }
.vv-csbtn:active { background: rgba(255,255,255,.12); transform: scale(.94); }
.vv-csbtn:focus-visible { outline: 2px solid var(--vv-accent); outline-offset: 2px; }
.vv-ico { display: block; flex: 0 0 auto; }

/* ---- 底部动作行 ---- */
.vv-act-row { display: flex; align-items: center; margin-top: 2px; gap: 4px; }
.vv-spacer { flex: 1; }
#vv-play-btn { width: 44px; height: 44px; border-radius: 14px; }
.vv-next-btn { gap: 4px; color: #fff; }
.vv-next-t { margin-left: 2px; font-size: 12px; white-space: nowrap; }

/* 胶囊 chip：只表达一件事，非默认值才变蓝 */
.vv-chip { display: inline-flex; align-items: center; justify-content: center; min-width: 52px; height: 30px; padding: 0 12px; border-radius: 999px;
  border: 1px solid var(--vv-line); background: rgba(255,255,255,.08); color: var(--vv-t1); font-size: 12px; font-weight: 600; letter-spacing: .01em;
  transition: background .18s var(--vv-ease), border-color .18s var(--vv-ease), color .18s var(--vv-ease); }
.vv-chip.on { background: var(--vv-accent-weak); border-color: var(--vv-accent-line); color: var(--vv-accent-2); }
/* 顺序很重要：同特异性，靠后覆盖 */
.vv-chip--q { display: none; }
.vv-chip--q.show { display: inline-flex; }

/* ---- 进度条 ---- */
.vv-prog-row { display: flex; align-items: center; }
.vv-time { color: var(--vv-t2); font-size: 11.5px; min-width: 38px; font-variant-numeric: tabular-nums; white-space: nowrap; letter-spacing: .01em; }
#vv-cur { text-align: left; }
#vv-dur { text-align: right; }
.vv-prog { position: relative; flex: 1; height: 34px; margin: 0 8px; touch-action: none; }
.vv-prog-track, .vv-prog-buf, .vv-prog-cur { position: absolute; left: 0; top: 50%; height: 3px; margin-top: -1.5px; border-radius: 3px; transition: height .14s var(--vv-ease), margin-top .14s var(--vv-ease); }
.vv-prog-track { right: 0; background: rgba(255,255,255,.18); }
.vv-prog-buf { width: 0; background: rgba(255,255,255,.26); }
/* 已播放段用纯白而不是品牌蓝：任何一段视频背景下都能读，蓝色留给"激活态" */
.vv-prog-cur { width: 0; background: #fff; }
.vv-prog-dot { position: absolute; top: 50%; left: 0; width: 13px; height: 13px; margin: -6.5px 0 0 -6.5px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.16), 0 2px 8px rgba(0,0,0,.55); transition: width .14s var(--vv-ease), height .14s var(--vv-ease), margin .14s var(--vv-ease); }
.vv-prog.dragging .vv-prog-track,
.vv-prog.dragging .vv-prog-buf,
.vv-prog.dragging .vv-prog-cur { height: 5px; margin-top: -2.5px; }
.vv-prog.dragging .vv-prog-dot { width: 15px; height: 15px; margin: -7.5px 0 0 -7.5px; }

/* ---- 手势/拖动提示 ---- */
.vv-seek-tip { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 220; opacity: 0; pointer-events: none;
  padding: 7px 13px; border-radius: var(--vv-r-sm); background: rgba(16,17,23,.82); border: 1px solid var(--vv-line); color: #fff;
  font-size: 12.5px; font-variant-numeric: tabular-nums; white-space: nowrap; transition: opacity .14s var(--vv-ease); }
/* 拖进度条时吸附在拇指上方，而不是浮在画面中央 */
.vv-seek-tip.scrub { top: auto; bottom: calc(env(safe-area-inset-bottom, 0px) + 96px); transform: translateX(-50%); padding: 6px 11px; font-size: 12px; font-weight: 600; box-shadow: 0 8px 22px rgba(0,0,0,.45); }
.vv-seek-tip.scrub::after { content: ''; position: absolute; left: 50%; bottom: -3.5px; width: 7px; height: 7px; margin-left: -3.5px; transform: rotate(45deg); background: inherit; border-right: 1px solid var(--vv-line); border-bottom: 1px solid var(--vv-line); }
.vv-seek-tip.on, .vv-ges-tip.on { opacity: 1; }
.vv-ges-tip { position: absolute; top: 10%; left: 50%; transform: translateX(-50%); z-index: 220; opacity: 0; pointer-events: none;
  padding: 7px 14px; border-radius: 999px; background: rgba(16,17,23,.74); border: 1px solid var(--vv-line); color: #fff;
  font-size: 12.5px; font-variant-numeric: tabular-nums; transition: opacity .16s var(--vv-ease); }

/* ---- 中央播放键：不用 backdrop-filter，72px 的模糊圆会把画面正中抹成一团脏斑 ---- */
.vv-center-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center;
  width: 72px; height: 72px; padding: 0; border-radius: 50%; border: 1px solid rgba(255,255,255,.16); background: rgba(0,0,0,.42); color: #fff;
  z-index: 180; opacity: 0; pointer-events: none;
  box-shadow: 0 10px 30px rgba(0,0,0,.4);
  transition: opacity .22s var(--vv-ease), transform .12s var(--vv-ease), background .16s var(--vv-ease); }
.vv-center-play:active { transform: translate(-50%, -50%) scale(.94); }
.vv-center-play svg { margin-left: 2px; }
/* 播放中的暂停态不需要那个光学偏移 */
.vv-center-play.pause svg { margin-left: 0; }

/* ============================================================
   加载
   ============================================================ */
.vv-loading { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; flex-direction: column; align-items: center; gap: 9px;
  z-index: 185; pointer-events: none; min-width: 148px; max-width: 78vw; padding: 20px 24px 18px; border-radius: var(--vv-r-lg);
  background: var(--vv-glass); border: 1px solid var(--vv-line); color: #fff;
  box-shadow: 0 18px 44px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter: blur(var(--vv-blur)); -webkit-backdrop-filter: blur(var(--vv-blur)); }
.vv-loading.on { display: flex; }
.vv-loading.indet .vv-lr-svg { opacity: .9; }
/* 这个类以前完全没有样式，导致"缓冲中…"和明细行挤在一起没有层级 */
.vv-load-text { font-size: 12.5px; font-weight: 600; letter-spacing: .01em; color: #fff; }
.vv-load-detail { font-size: 11.5px; color: rgba(255,255,255,.5); line-height: 1.45; max-width: 190px; text-align: center; font-variant-numeric: tabular-nums; }
.vv-load-detail:empty { display: none; }
/* 环形几何（viewBox 58 / r=19 / 周长 119.4）属于契约，一律不改；
   这里只把渲染尺寸放大到 64px —— 58px 时内径只有 35px，"46%" 这种三位数会贴到描边上。
   放大用外框尺寸实现，SVG 内部坐标与 dasharray 都不受影响。 */
.vv-lr { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; }
.vv-lr-svg { width: 64px; height: 64px; transform: rotate(-90deg); }
.vv-lr-bg { fill: none; stroke: rgba(255,255,255,.16); stroke-width: 3; }
.vv-lr-fg { fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-dasharray: 119.4; stroke-dashoffset: 119.4; transition: stroke-dashoffset .25s linear; }
.vv-lr-num { position: absolute; font-size: 12px; font-weight: 700; letter-spacing: -.02em; font-variant-numeric: tabular-nums; font-family: system-ui, sans-serif; }
.vv-loading.indet .vv-lr-fg { stroke-dasharray: 26 119.4; animation: vv-lr-spin 1.05s linear infinite; transition: none; transform-box: view-box; transform-origin: 50% 50%; }
@keyframes vv-lr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ---- 顶部细进度条 ---- */
.vv-loadbar { position: absolute; left: 0; right: 0; top: 0; height: 2px; background: rgba(255,255,255,.10); opacity: 0; transition: opacity .2s; z-index: 205; pointer-events: none; overflow: hidden; }
.vv-loadbar.on { opacity: 1; }
.vv-loadbar-fill { height: 100%; width: 0; background: linear-gradient(90deg, var(--vv-accent), var(--vv-accent-2)); transition: width .25s linear; }
.vv-loadbar.indet .vv-loadbar-fill { width: 38%; animation: vv-lb-slide 1.05s ease-in-out infinite; }
@keyframes vv-lb-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }

/* ============================================================
   起播失败卡片
   ============================================================ */
.vv-err { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; flex-direction: column; align-items: center; gap: 9px;
  color: #fff; font-size: 13px; z-index: 190; width: 78vw; max-width: 300px; padding: 22px 20px 16px; border-radius: var(--vv-r-lg);
  background: var(--vv-glass-2); border: 1px solid var(--vv-line); text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter: blur(var(--vv-blur)); -webkit-backdrop-filter: blur(var(--vv-blur)); }
.vv-err.on { display: flex; }
.vv-err-ico { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-bottom: 2px; border-radius: 50%; border: 1px solid rgba(255,90,90,.28); background: rgba(255,90,90,.14); color: #ff8a8a; font-size: 20px; font-weight: 700; }
.vv-err-t { font-size: 15px; font-weight: 600; letter-spacing: .01em; }
.vv-err-m { font-size: 12.5px; color: var(--vv-t2); line-height: 1.6; word-break: break-word; }
.vv-err-btns { display: flex; gap: 8px; margin-top: 10px; flex-wrap: nowrap; justify-content: center; }
.vv-err-btn { height: 36px; padding: 0 14px; border: 1px solid var(--vv-line); border-radius: 999px; background: rgba(255,255,255,.09); color: #fff; font-size: 12.5px; font-weight: 600; font-family: inherit; white-space: nowrap; flex: 0 0 auto; transition: background .16s var(--vv-ease), transform .12s var(--vv-ease); }
.vv-err-btn:active { background: rgba(255,255,255,.16); transform: scale(.96); }
.vv-err-btn.primary { background: var(--vv-accent); border-color: transparent; box-shadow: 0 6px 18px rgba(77,141,255,.32); }
/* 加载中隐藏中央播放按钮，否则会压在环形进度圈上 */
.vv-player-root.vv-loading-on .vv-center-play { opacity: 0; pointer-events: none; }

/* ============================================================
   底部菜单
   ============================================================ */
.vv-sheet { position: absolute; left: 0; bottom: 0; width: 100%; z-index: 320; display: none;
  max-height: 62vh; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
  padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + 10px);
  border-radius: var(--vv-r-lg) var(--vv-r-lg) 0 0; border-top: 1px solid var(--vv-line-2);
  background: var(--vv-glass-2); color: #e9eaee; font-size: 14px;
  box-shadow: 0 -20px 48px rgba(0,0,0,.48);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
.vv-sheet.open { display: block; animation: vvSheetIn .24s var(--vv-ease); }
@keyframes vvSheetIn { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }
/* 拖拽把手 */
.vv-sheet::before { content: ''; display: block; width: 36px; height: 4px; margin: 8px auto 2px; border-radius: 2px; background: rgba(255,255,255,.22); }
.vv-sheet-group { padding: 14px 20px 6px; font-size: 11px; font-weight: 600; letter-spacing: .08em; color: var(--vv-t3); }
.vv-sheet-item { display: flex; align-items: center; gap: 12px; min-height: 50px; padding: 10px 18px; margin: 0 6px; border-radius: var(--vv-r-md); transition: background .16s var(--vv-ease); }
.vv-sheet-item:active { background: rgba(255,255,255,.07); }
.vv-sheet-item.on { color: var(--vv-accent-2); font-weight: 600; }
.vv-sheet-item.off { opacity: .42; pointer-events: none; }
.vv-sheet-ico { display: flex; flex: 0 0 18px; width: 18px; justify-content: center; color: var(--vv-t2); }
.vv-sheet-item.on .vv-sheet-ico { color: var(--vv-accent); }
.vv-sheet-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.vv-sheet-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vv-sheet-sub { margin-top: 3px; font-size: 11px; font-weight: 400; color: var(--vv-t3); }
.vv-sheet-check { display: flex; flex: 0 0 auto; color: var(--vv-accent); }

/* ---- 播放态低特效（默认开，见 vvSyncLowFx / vvToggleLowFx）----
   真机 MuMu + Via 7.3.3 / WebView 110 实测：视频在播时展开更多菜单，
   半屏 .vv-sheet 的 blur(20px) 要跟着每帧重采样，平均帧间隔 16.7 → 22.34ms、
   P95 16.67 → 41.66ms、>25ms 长帧率 0.21% → 29.87%。关掉模糊后回到稳定 60fps。
   所以播放层默认改用更实的背景代替毛玻璃；顶栏那枚 8px 小胶囊面积太小，保留。
   想恢复毛玻璃：更多 → 设置 →「界面毛玻璃」，或脚本菜单里的同类开关。 */
.vv-player-root.vv-lowfx .vv-sheet,
.vv-player-root.vv-lowfx .vv-loading,
.vv-player-root.vv-lowfx .vv-err {
  backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
}
.vv-player-root.vv-lowfx .vv-sheet { background: rgba(18,19,26,.96); }
.vv-player-root.vv-lowfx .vv-loading,
.vv-player-root.vv-lowfx .vv-err { background: rgba(18,19,26,.94); }
.vv-switch { position: relative; flex: 0 0 auto; width: 38px; height: 22px; border-radius: 11px; background: rgba(255,255,255,.16); transition: background .18s var(--vv-ease); }
.vv-switch::after { content: ''; position: absolute; left: 2px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .18s var(--vv-ease); }
.vv-sheet-item.on .vv-switch { background: var(--vv-accent); }
.vv-sheet-item.on .vv-switch::after { transform: translateX(16px); }

/* ============================================================
   选集浮层
   独立于播放器的 fixed 层：锁屏时、控制栏自动收起后也要能打开，
   所以不塞进 .vv-sheet（那层归控制栏状态管）。
   ============================================================ */
.vv-ep-wrap { position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 2147483647;
  background: rgba(8,9,13,.72); display: none; flex-direction: column; justify-content: flex-end;
  font-family: system-ui, -apple-system, sans-serif; }
.vv-ep-wrap.open { display: flex; }
.vv-ep-wrap * { box-sizing: border-box; }
.vv-ep { width: 100%; max-height: 76vh; display: flex; flex-direction: column;
  background: var(--vv-glass-2); border-top: 1px solid var(--vv-line-2);
  border-radius: var(--vv-r-lg) var(--vv-r-lg) 0 0; color: #e9eaee;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 14px);
  box-shadow: 0 -20px 48px rgba(0,0,0,.5);
  animation: vvSlideUp .22s var(--vv-ease); }
.vv-ep-head { display: flex; align-items: center; padding: 16px 16px 8px 20px; }
.vv-ep-title { flex: 1; min-width: 0; font-size: 17px; font-weight: 700; color: #fff; letter-spacing: .01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vv-ep-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; min-height: 30px;
  margin-left: 8px; padding: 4px 12px; border-radius: 15px; border: 1px solid var(--vv-line);
  background: rgba(255,255,255,.08); color: var(--vv-t2); font: inherit; font-size: 12px; }
.vv-ep-btn:active { background: rgba(255,255,255,.16); }
.vv-ep-note { padding: 0 20px 12px; font-size: 11.5px; line-height: 1.5; color: var(--vv-t3); }
.vv-ep-grid { overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 0 16px 6px; }
.vv-ep-sec { padding: 12px 4px 8px; font-size: 11px; font-weight: 600; letter-spacing: .06em; color: var(--vv-t3); }
.vv-ep-cells { display: grid; grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)); gap: 8px; margin-bottom: 8px; }
.vv-ep-cell { display: flex; align-items: center; justify-content: center; min-height: 42px; padding: 0 4px;
  border: 1px solid var(--vv-line); border-radius: var(--vv-r-sm);
  background: rgba(255,255,255,.06); color: var(--vv-t1); font-size: 13.5px; font-weight: 600;
  font-variant-numeric: tabular-nums; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background .16s var(--vv-ease), transform .12s var(--vv-ease); }
.vv-ep-cell:active { background: rgba(255,255,255,.16); transform: scale(.94); }
.vv-ep-cell.on { background: var(--vv-accent); border-color: transparent; color: #fff;
  box-shadow: 0 4px 14px rgba(77,141,255,.34); }
.vv-ep-foot { padding: 8px 20px 0; font-size: 11px; line-height: 1.5; color: var(--vv-t3); }

/* ============================================================
   锁屏
   ============================================================ */
.vv-lockmark { position: absolute; right: 12px; top: 14%; display: none; align-items: center; justify-content: center;
  width: 40px; height: 40px; padding: 0; border-radius: 50%; border: 1px solid var(--vv-line-2); background: rgba(0,0,0,.42); color: #fff;
  z-index: 210; font-size: 17px; opacity: 0; pointer-events: none; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  transition: opacity .2s var(--vv-ease), background .16s var(--vv-ease); }
/* 控制栏可见时不再额外浮一枚锁：底栏已经有锁按钮，两个锁只会让人分不清点哪个。
   锁定后控制栏整体隐藏，这枚浮动锁是唯一的解锁入口，所以 locked 态必须保留 display:flex。 */
.vv-player-root.locked .vv-lockmark { display: flex; opacity: .92; pointer-events: auto; }
.vv-player-root.locked .vv-cs-top,
.vv-player-root.locked .vv-cs-bottom,
.vv-player-root.locked .vv-center-play { opacity: 0 !important; pointer-events: none !important; }

/* ============================================================
   短屏 / 横屏适配
   ============================================================ */
@media (max-height: 480px) {
  .vv-cs-top { padding-bottom: 20px; }
  .vv-cs-bottom { padding-top: 18px; }
  .vv-csbtn { min-width: 36px; height: 36px; border-radius: 10px; }
  #vv-play-btn { width: 38px; height: 38px; border-radius: 12px; }
  .vv-prog { height: 28px; }
  .vv-center-play { width: 60px; height: 60px; }
  .vv-loading { padding: 16px 20px 14px; gap: 7px; }
  .vv-sheet { max-height: 80vh; }
  .vv-ep { max-height: 84vh; }
  .vv-ep-cell { min-height: 38px; }
  .vv-sheet-item { min-height: 44px; padding: 8px 16px; font-size: 13.5px; }
  .vv-seek-tip.scrub { bottom: calc(env(safe-area-inset-bottom, 0px) + 74px); }
}
@media (orientation: landscape) and (max-height: 480px) {
  .vv-cs-bottom { padding-left: calc(env(safe-area-inset-left, 0px) + 20px); padding-right: calc(env(safe-area-inset-right, 0px) + 20px); }
}
@media (prefers-reduced-motion: reduce) {
  /* 只关装饰动画；vv-lr-spin / vv-lb-slide 承载"还在动"的信息，不能停 */
  .vv-sheet.open, .vv-panel, .vv-share, .vv-ep { animation: none; }
  .vv-csbtn, .vv-chip, .vv-sheet-item, .vv-prog-dot,
  .vv-prog-track, .vv-prog-buf, .vv-prog-cur, .vv-center-play { transition-duration: .001ms; }
}

/* ============================================================
   网页铺满（原名「页面全屏」）
   只在网页内部铺满 WebView 视口，不调用 requestFullscreen()。
   浏览器栏是 WebView 之外的系统 UI，本样式一概不碰；栏显示与否由
   Via 自己的「下滑隐藏 / 上滑显示」决定，所以我们也不锁页面滚动。
   与播放器顶栏那枚「沉浸全屏」（系统全屏）是两套独立模式。
   层级：遮罩 2147483000 < 铺满画面 2147483001 < 脚本 UI 2147483647，
   角标 / 嗅探面板 / 退出按钮在铺满时依然可点。
   ============================================================ */
.vv-pagefs-shade, .vv-pagefs-exit { all: initial; }
.vv-pagefs-shade { display: none !important; position: fixed !important; left: 0 !important; top: 0 !important;
  width: 100vw !important; height: 100vh !important; height: 100dvh !important;
  margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important;
  background: #000 !important; opacity: 1 !important; transform: none !important;
  pointer-events: none !important; z-index: 2147483000 !important; }
.vv-pagefs-shade.on { display: block !important; }
/* 只给目标 video 挂 class，不写 inline style、不搬 DOM：
   MSE/blob 流一旦脱离原节点就会黑屏，退出时摘 class 即可零残留。 */
html.vv-pagefs-on .vv-pagefs-video { position: fixed !important; left: 0 !important; top: 0 !important;
  width: 100vw !important; height: 100vh !important; height: 100dvh !important;
  max-width: none !important; max-height: none !important; min-width: 0 !important; min-height: 0 !important;
  margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important;
  object-fit: contain !important; background: #000 !important; transform: none !important;
  z-index: 2147483001 !important; }
/* position:fixed 会被祖先的 transform/filter 变成相对该祖先定位，
   这是「全屏后视频还缩在原来那一小块」的元凶；只清非默认值的祖先。 */
html.vv-pagefs-on .vv-pagefs-anc { transform: none !important; -webkit-transform: none !important;
  filter: none !important; -webkit-filter: none !important; perspective: none !important;
  will-change: auto !important; contain: none !important;
  backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
/* 放在右上：Via 的底部状态栏/工具栏在网页之外，右上角永远不会被它压住。 */
.vv-pagefs-exit { display: flex !important; align-items: center !important; justify-content: center !important;
  position: fixed !important; right: 12px !important; top: calc(env(safe-area-inset-top, 0px) + 12px) !important;
  box-sizing: border-box !important; height: 34px !important; padding: 0 11px !important; gap: 6px !important;
  border: 1px solid rgba(255,255,255,.20) !important; border-radius: 17px !important;
  background: rgba(18,19,26,.72) !important; color: #e9eaee !important;
  font: 12px/1 system-ui, -apple-system, sans-serif !important; white-space: nowrap !important;
  appearance: none !important; -webkit-appearance: none !important; cursor: pointer !important;
  backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important;
  box-shadow: 0 4px 18px rgba(0,0,0,.42) !important; z-index: 2147483647 !important;
  -webkit-tap-highlight-color: transparent !important; }
.vv-pagefs-exit:active { background: rgba(48,50,62,.90) !important; }
/* 内置播放器顶栏已有同一枚按钮时，网页层不必再叠一个出口 */
.vv-pagefs-exit.hide { display: none !important; }
.vv-pagefs-exit svg { width: 15px !important; height: 15px !important; flex: none !important; }
`;
// ---- 网页原生视频自动播放拦截 ----
//
// 很多站点一进页面就自动起播。在 Android WebView 里这会立刻占住一条硬件解码器
// （MediaCodec）并开始拉流：用户其实还没打算看，既白费流量，又会让随后打开的内置
// 播放器抢不到解码器（表现是"分片能下、就是不出画"）。
//
// 这里只治「页面自己的 <video>」，不动内置播放器（VID 在 ROOT 里），也不碰音频播放器：
//   1) 在 document-start 包住 HTMLMediaElement.prototype.play：没有真实用户手势时，
//      对页面 video 直接返回 NotAllowedError —— 和浏览器自动播放策略表现一致，
//      站点播放器会像被浏览器拦下一样退回收起 / 待点播状态；
//   2) 兜住 autoplay 属性起播（这类不走 play()）：监听 play 事件，非手势起播就暂停，
//      并摘掉 autoplay，避免它反复重试；
//   3) 把页面 video 的 preload="auto" 降到 metadata：拿得到时长/首帧，又不至于整段预载。
//
// 「用户点过页面」的判定用 transient activation（navigator.userActivation.isActive）
// 加上 1.2s 内有过 pointerdown/touchstart/click/keydown 的兜底窗口：站点自己的播放、
// 续播、以及我们恢复页面媒体的链路都不受影响（后者还会用 vvApAllowNext 显式放行）。
//
// 开关：更多菜单「网页视频自动播放」，配置项 pageAutoplay，默认 false = 拦截。

var VV_AP = {
    origPlay: null,
    lastGesture: 0,
    blocked: 0,
    hooked: false
};

function vvApCfgOn() {
    // 语义：cfg.pageAutoplay = true 表示「允许网页自动播放」
    try { return !!(VV && VV.cfg && VV.cfg.pageAutoplay); } catch (e) { return false; }
}

function vvApIsOurs(el) {
    try { return !!(ROOT && el && ROOT.contains(el)); } catch (e) { return false; }
}

function vvApIsVideo(el) {
    try { return !!(el && el.nodeName === 'VIDEO'); } catch (e) { return false; }
}

// 用户是不是刚和页面交互过。transient activation 只在手势的同一任务（及很短时间内）为真，
// 站点播放器通常在 click 处理里同步调 play()，这一条就够；异步再起播的用时间窗兜。
function vvApActivated() {
    try {
        if (typeof navigator !== 'undefined' && navigator.userActivation &&
            navigator.userActivation.isActive) return true;
    } catch (e0) {}
    return (Date.now() - VV_AP.lastGesture) < 1200;
}

function vvApShouldBlock(el) {
    if (!el) return false;
    if (vvApCfgOn()) return false;          // 配置里放开了自动播放
    if (!vvApIsVideo(el)) return false;     // 只治视频，不碰音频播放器
    if (vvApIsOurs(el)) return false;       // 内置播放器自己
    if (el.__vvApAllow) return false;       // 我们恢复页面媒体时的一次性放行
    if (vvApActivated()) return false;      // 用户已经点过页面
    return true;
}

function vvApNotAllowed() {
    try { return new DOMException('play() rejected: page autoplay blocked', 'NotAllowedError'); }
    catch (e) {
        var err = new Error('play() rejected: page autoplay blocked');
        err.name = 'NotAllowedError';
        return err;
    }
}

// 我们自己的恢复链路（vvAttachMedia / vvResumePageMediaNow）调用前打个标记，
// 让紧接着的那一次 play() 放行。play() 的判定是同步的，10ms 后清掉即可。
function vvApAllowNext(el) {
    if (!el) return;
    try { el.__vvApAllow = true; } catch (e) {}
    setTimeout(function () { try { el.__vvApAllow = false; } catch (e) {} }, 10);
}

// 只降级显式的 preload="auto"。留 metadata 给站点拿时长和首帧，不整段预载。
function vvApTamePreload(el) {
    try {
        if (!vvApIsVideo(el) || vvApIsOurs(el)) return;
        if (vvApCfgOn() || vvApActivated()) return;
        if (el.getAttribute('preload') === 'auto') {
            if (!el.__vvApPre) el.__vvApPre = 'auto';
            el.setAttribute('preload', 'metadata');
        }
    } catch (e) {}
}

// force=true 用于关闭内置播放器时强制还原。
// 播放器开着的时候不还原：那是"我们正在播"的时段，页面预载会跟播放器抢带宽
// （30-player 的 vvStopPagePreload 会把它按成 none）。
function vvApRestorePreload(force) {
    try {
        if (!force && VV && VV.playerActive) return;
        var els = document.querySelectorAll('video');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el.__vvApPre) continue;
            try { el.setAttribute('preload', el.__vvApPre); } catch (e0) {}
            try { el.__vvApPre = ''; } catch (e1) {}
        }
    } catch (e) {}
}

function vvApInstall() {
    if (VV_AP.hooked) return;
    VV_AP.hooked = true;

    // 1) 包 play()：JS 主动起播（含站点播放器初始化时的那一次）
    try {
        var proto = (typeof HTMLMediaElement !== 'undefined') ? HTMLMediaElement.prototype : null;
        if (proto && typeof proto.play === 'function' && !proto.__vvApHooked) {
            VV_AP.origPlay = proto.play;
            proto.__vvApHooked = true;
            proto.play = function () {
                try {
                    if (vvApShouldBlock(this)) {
                        VV_AP.blocked++;
                        try { this.autoplay = false; this.removeAttribute('autoplay'); } catch (eA) {}
                        try { this.pause(); } catch (eP) {}
                        return Promise.reject(vvApNotAllowed());
                    }
                } catch (eC) {}
                return VV_AP.origPlay.apply(this, arguments);
            };
        }
    } catch (eInst) {}

    // 2) 兜住 autoplay 属性：浏览器自己起播时不经过 play()，只能从事件上拦
    try {
        document.addEventListener('play', function (e) {
            var el = e && e.target;
            if (!vvApShouldBlock(el)) return;
            VV_AP.blocked++;
            try { el.autoplay = false; el.removeAttribute('autoplay'); } catch (eA) {}
            try { el.pause(); } catch (eP) {}
        }, true);
    } catch (eEv) {}

    // 3) 手势：记时间点，并把之前降级的 preload 还回去
    var mark = function () {
        VV_AP.lastGesture = Date.now();
        vvApRestorePreload();
    };
    var types = ['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown'];
    for (var i = 0; i < types.length; i++) {
        try { window.addEventListener(types[i], mark, true); } catch (eW) {}
    }
}

vvApInstall();
var vvUI = { badge: null, panel: null };

// 分享 / 选集浮层与页内小窗都和面板同级（z-index 都是 2147483647），
// 谁在 DOM 末尾谁就盖住谁。面板的定时置顶巡检不能在有这些层时抢顶，
// 否则从面板点「导出」打开的浮层会在 2 秒后被整块盖住，看着像界面自己关了。
function vvHasPriorityOverlay() {
    try {
        if (document.getElementById('vv-share-wrap')) return true;
        var ep = document.getElementById('vv-ep-wrap');
        if (ep && ep.classList.contains('open')) return true;
        if (VV._mini) return true;
    } catch (e) {}
    return false;
}

function vvAddCss(css) {
    try {
        if (typeof GM_addStyle === 'function') { GM_addStyle(css); return; }
    } catch (e) {}
    try {
        var st = document.createElement('style');
        st.innerHTML = css;
        document.documentElement.appendChild(st);
    } catch (e2) {}
}

function vvEnsureStyle() {
    if (VV._cssDone) return;
    if (!document.documentElement) return;
    vvAddCss(VV_CSS);
    VV._cssDone = true;
}

function vvBadge() {
    vvEnsureStyle();
    if (!vvUI.badge) {
        var b = vvEl('div', 'vv-badge');
        b.id = 'vv-badge';
        b.innerHTML = '<div class="vv-badge-play"></div><div class="vv-badge-num"></div>';
        b.addEventListener('touchstart', function (e) {
            var t = e.touches[0];
            b._touching = true;
            b._sx = t.clientX; b._sy = t.clientY; b._moved = false;
            b._longPressed = false;
            // 长按 0.7 秒打开资源自检。Via 不一定注册 GM 菜单，
            // 所以这里留一条不依赖任何 GM API 的入口。
            try { clearTimeout(b._lpTimer); } catch (eLP) {}
            b._lpTimer = setTimeout(function () {
                if (b._touching && !b._moved) {
                    b._longPressed = true;
                    b._touching = false;
                    try { vvReleaseAudit(); } catch (eA) {}
                }
            }, 700);
        }, { passive: true });
        b.addEventListener('touchmove', function (e) {
            var t = e.touches[0];
            if (Math.abs(t.clientX - b._sx) > 6 || Math.abs(t.clientY - b._sy) > 6) b._moved = true;
            if (b._moved) {
                var x = Math.max(4, Math.min(window.innerWidth - 50, t.clientX - 23));
                var y = Math.max(4, Math.min(window.innerHeight - 60, t.clientY - 23));
                b.style.left = x + 'px';
                b.style.top = y + 'px';
                b.style.right = 'auto';
                b.style.bottom = 'auto';
            }
        }, { passive: true });
        b.addEventListener('touchend', function () {
            b._touching = false;
            try { clearTimeout(b._lpTimer); } catch (eLP2) {}
            if (b._longPressed) return;
            if (b._moved) {
                var x = parseFloat(b.style.left || 0);
                b._dragged = true;
                b.style.left = '';
                b.style.top = '';
                b.style.right = '';
                b.style.bottom = '';
                b.setAttribute('data-pos', x > window.innerWidth / 2 ? 'r' : 'l');
                vvBadgePos(b);
            }
        });
        b.addEventListener('click', function () {
            if (b._dragged) { b._dragged = false; return; }
            // 长按刚弹过自检，松手带来的这次 click 要吞掉
            if (b._longPressed) { b._longPressed = false; return; }
            vvOpenPanel();
        });
        document.documentElement.appendChild(b);
        vvUI.badge = b;
        vvBadgePos(b);
    }
    return vvUI.badge;
}

function vvBadgePos(b) {
    var pos = b.getAttribute('data-pos') || vvGet('badgePos', 'r');
    if (pos === 'l') { b.style.left = '10px'; b.style.bottom = '30%'; b.style.right = 'auto'; }
    else { b.style.right = '10px'; b.style.bottom = '30%'; b.style.left = 'auto'; }
}

function vvKeepBadgeTop(b) {
    if (VV._badgeTopTimer) return;
    VV._badgeTopTimer = setInterval(function () {
        try {
            if (VV.playerActive || !VV.items.length || !b.classList.contains('show') || !b.parentNode) {
                clearInterval(VV._badgeTopTimer);
                VV._badgeTopTimer = null;
                return;
            }
            // 页面可能在播放中不断插入广告浮层，被盖住时才把角标重新压到最上层
            if (vvHasPriorityOverlay()) return;
            if (!b._touching && vvIsOccluded(b)) vvBringToFront(b);
        } catch (e) {
            clearInterval(VV._badgeTopTimer);
            VV._badgeTopTimer = null;
        }
    }, 2500);
}

function vvStopBadgeTop() {
    try {
        if (VV._badgeTopTimer) { clearInterval(VV._badgeTopTimer); VV._badgeTopTimer = null; }
    } catch (e) {}
}

function vvKeepPanelTop(w) {
    if (VV._panelTopTimer) return;
    VV._panelTopTimer = setInterval(function () {
        try {
            if (!w.classList.contains('open') || !w.parentNode) {
                clearInterval(VV._panelTopTimer);
                VV._panelTopTimer = null;
                return;
            }
            if (vvHasPriorityOverlay()) return;
            if (!w._touching && vvIsOccluded(w)) vvBringToFront(w);
        } catch (e) {
            clearInterval(VV._panelTopTimer);
            VV._panelTopTimer = null;
        }
    }, 2500);
}

function vvStopPanelTop() {
    try {
        if (VV._panelTopTimer) { clearInterval(VV._panelTopTimer); VV._panelTopTimer = null; }
    } catch (e) {}
}

function vvShowBadgeNew() {
    // 分享 / 选集浮层开着时别把角标放出来：它同样挂在 <html> 末尾且 z-index 同级
    if (VV.items.length === 0 || VV.playerActive || VV._panelOpen || vvHasPriorityOverlay()) return;
    try {
        var b = vvBadge();
        var num = b.querySelector('.vv-badge-num');
        if (num) num.innerHTML = String(VV.items.length);
        vvBringToFront(b);
        b.classList.add('show');
        vvKeepBadgeTop(b);
    } catch (e) {}
}

function vvToggleBadge(show) {
    try {
        var b = vvBadge();
        if (show) {
            if (vvHasPriorityOverlay()) return;
            vvBringToFront(b);
            b.classList.add('show');
            vvKeepBadgeTop(b);
        } else {
            b.classList.remove('show');
            vvStopBadgeTop();
        }
    } catch (e) {}
}

function vvOpenPanel() {
    // 打开面板时补扫一次资源计时，能看到脚本注入前/页面自行加载的媒体
    try { vvScanPerf(); } catch (eP) {}
    if (!VV.items.length) { vvToast('暂无嗅探结果，先播放一下视频'); return; }
    try { vvEnsurePanel().open(); } catch (e) {}
}

function vvEnsurePanel() {
    vvEnsureStyle();
    if (vvUI.panel) return vvUI.panel;
    var wrap = vvEl('div', 'vv-panel-wrap');
    wrap.id = 'vv-panel-wrap';
    var panel = vvEl('div', 'vv-panel');
    var head = vvEl('div', 'vv-head');
    var title = vvEl('div', 'vv-head-title', '视频嗅探');
    var btnEp = vvEl('button', 'vv-head-btn', '选集');
    var btnScan = vvEl('button', 'vv-head-btn', '刷新');
    var btnClear = vvEl('button', 'vv-head-btn', '清空');
    var btnClose = vvEl('button', 'vv-head-btn');
    btnClose.innerHTML = vvIcon('close', 14);
    btnClose.setAttribute('aria-label', '关闭');
    btnClose.title = '关闭';
    head.appendChild(title);
    head.appendChild(btnEp);
    head.appendChild(btnScan);
    head.appendChild(btnClear);
    head.appendChild(btnClose);
    var note = vvEl('div', 'vv-prefix-note', '播放进内置播放器 · 下载 · 导出给外部播放器');
    var list = vvEl('div', 'vv-list');
    panel.appendChild(head);
    panel.appendChild(note);
    panel.appendChild(list);
    wrap.appendChild(panel);
    document.documentElement.appendChild(wrap);
    wrap.addEventListener('touchstart', function () { wrap._touching = true; }, { passive: true });
    wrap.addEventListener('touchend', function () { wrap._touching = false; }, { passive: true });
    wrap.addEventListener('touchcancel', function () { wrap._touching = false; }, { passive: true });

    var api = {
        wrap: wrap,
        list: list,
        title: title,
        open: function () {
            try {
                if (!document.getElementById('vv-panel-wrap')) document.documentElement.appendChild(wrap);
                vvRenderPanel(api);
                vvBringToFront(wrap);
                wrap.classList.add('open');
                vvKeepPanelTop(wrap);
                vvToggleBadge(false);
                VV._panelOpen = true;
            } catch (e) {}
        },
        close: function () {
            wrap.classList.remove('open');
            vvStopPanelTop();
            VV._panelOpen = false;
            if (VV.items.length && !VV.playerActive) vvToggleBadge(true);
        },
        refresh: function () {
            vvToast('正在重新扫描页面...');
            vvScanDOM();
            try { vvScanPerf(); } catch (eP) {}
            setTimeout(function () { vvShowBadgeNew(); vvRenderPanel(api); }, 700);
        },
        clear: function () {
            VV.items.length = 0;
            VV.seen = {};
            vvRenderPanel(api);
            vvToast('已清空');
        }
    };
    btnEp.addEventListener('click', function () { vvEpisodesOpen(); });
    btnScan.addEventListener('click', api.refresh);
    btnClear.addEventListener('click', api.clear);
    btnClose.addEventListener('click', api.close);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) api.close(); });
    vvUI.panel = api;
    return api;
}

function vvRenderPanel(api) {
    var count = VV.items.length;
    api.title.innerHTML = '视频嗅探（' + count + '）';
    api.list.innerHTML = '';
    if (!count) {
        api.list.innerHTML = '<div class="vv-empty">暂未嗅探到视频<br>播放一下网页里的视频再试试</div>';
        return;
    }
    var frag = document.createDocumentFragment();
    VV.items.forEach(function (item, idx) {
        var row = vvEl('div', 'vv-row');
        try { row.setAttribute('data-url', item.url || ''); } catch (eU) {}
        try { row.setAttribute('data-type', item.type || ''); } catch (eT) {}
        var info = vvEl('div', 'vv-row-info');
        var sub = '';
        try { if (item.url) sub = new URL(item.url).hostname.replace(/^www\./, ''); } catch (e) { sub = ''; }
        // 音轨清单要显式标出来，否则用户分不清为什么点开只有声音
        var tagText = VV_TYPE_CN[item.type] || '视频';
        if (item.type === 'HLS' && vvLooksLikeAudioHls(item.url)) tagText = 'm3u8·音轨';
        info.innerHTML =
            '<div class="vv-row-name">' + vvShortName(item, idx) + '</div>' +
            '<div class="vv-row-tags"><span class="vv-tag ' + item.type + '">' + tagText + '</span></div>' +
            '<div class="vv-row-sub">' + vvEscape(sub) + '</div>';
        var acts = vvEl('div', 'vv-row-acts');
        var btnDl = vvEl('button', 'vv-btn-mini');
        var btnCopy = vvEl('button', 'vv-btn-mini');
        var btnPlay = vvEl('button', 'vv-btn-play');
        btnDl.innerHTML = vvIcon('dl', 15);
        btnCopy.innerHTML = vvIcon('link', 15);
        btnPlay.innerHTML = vvIcon('play', 16);
        btnDl.title = '下载';
        btnCopy.title = '导出';
        // title 是诊断脚本找播放键的兜底路径（它们用 textContent + title 做正则）；
        // 换成纯 SVG 后 textContent 为空，这里必须补上。
        btnPlay.title = '播放';
        btnDl.setAttribute('aria-label', '下载');
        btnCopy.setAttribute('aria-label', '导出给外部播放器');
        btnPlay.setAttribute('aria-label', '播放');
        btnPlay.addEventListener('click', function () {
            api.close();
            setTimeout(function () { openPlayer(item); }, 180);
        });
        btnDl.addEventListener('click', function () { vvDownloadItem(item); });
        btnCopy.addEventListener('click', function () { vvShareOpen(item); });
        acts.appendChild(btnDl);
        acts.appendChild(btnCopy);
        acts.appendChild(btnPlay);
        row.appendChild(info);
        row.appendChild(acts);
        frag.appendChild(row);
    });
    api.list.appendChild(frag);
}

function vvCopy(text) {
    try {
        if (typeof GM_setClipboard === 'function') { GM_setClipboard(text); return; }
    } catch (e) {}
    try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-999px;top:0';
        document.documentElement.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.documentElement.removeChild(ta);
    } catch (e2) {}
}

function vvDownloadItem(item) {
    if (item.type === 'BLOB') { vvToast('这类原生流暂不支持下载，可录屏保存', true); return; }
    if (item.type === 'HLS') {
        vvShareOpen(item);
        vvToast('m3u8 无法直接下载，请导出 .m3u 或用 curl 拉取', true);
        return;
    }
    if (typeof GM_download === 'function') {
        try {
            var fname = vvSafeName(item.name || ('via-video-' + Date.now()));
            if (fname.indexOf('.') < 0) fname += '.mp4';
            GM_download({
                url: item.url,
                name: fname,
                headers: { Referer: location.href },
                onload: function () { vvToast('已交给 Via 下载'); },
                onerror: function (err) { vvToast('下载失败：' + ((err && err.error) || '未知'), true); }
            });
            vvToast('已交给 Via 下载');
            return;
        } catch (e) {}
    }
    try {
        var a = document.createElement('a');
        a.href = item.url;
        a.download = vvSafeName(item.name || 'video');
        a.target = '_blank';
        a.rel = 'noopener';
        document.documentElement.appendChild(a);
        a.click();
        setTimeout(function () { try { document.documentElement.removeChild(a); } catch (eX) {} }, 200);
        vvToast('已触发浏览器下载');
    } catch (e2) {
        vvCopy(item.url);
        vvToast('下载失败，链接已复制', true);
    }
}

function vvSafeName(name) {
    var s = String(name || '').replace(/[\\\/:*?"<>|]/g, '_').trim();
    if (s.length > 60) s = s.slice(0, 60);
    return s || ('video_' + Date.now());
}
function openPlayer(item) {
    if (!item || !item.url) { vvToast('无效视频'); return; }
    vvEnsureStyle();
    // 释放自检用的计数：真机上反复开关时，靠这对数字判断有没有越开越多
    VV._openCount = (VV._openCount || 0) + 1;
    var root = vvEnsurePlayerRoot();
    vvBringToFront(root);
    VV.playerActive = true;
    // 内置播放器自己铺满视口：若开着「网页铺满」先挂起网页那层，避免两层 fixed 打架
    try { vvPageFsSync(); } catch (ePF) {}
    vvKeepPlayerTop();
    vvToggleBadge(false);
    vvSetPageFreeze(true);
    vvPausePageMedia();
    // 暂停只停解码，preload 还会继续拉流；这里把页面媒体的预载一起按住，
    // 否则弱网下它在后台跟我们的首片抢带宽（真机上表现为"插件比网页慢/卡"）
    vvStopPagePreload();
    vvStartPreloadGuard();
    // 先把话放出去：别的页签收到就交还解码器。Android 的硬件解码器是设备级的，
    // 不打招呼的话，多开几个视频页就会轮到"分片能下、就是不出画"。
    try { vvRequestPeerRelease(); } catch (ePR) {}
    VV.active = {
        item: item,
        url: item.url,
        key: vvVideoKey(item.url),
        hls: null,
        speed: parseFloat(VV.cfg.speed) || 1,
        // 老数据里可能是 0（旧版手势滑到底直接存 0），当成正常的 1 处理
        vol: (function () { var v = vvGet('vol', 1); return (typeof v === 'number' && v > 0) ? v : 1; })(),
        bright: vvGet('bright', 1),
        locked: false,
        levels: [],
        audioTracks: [],
        audioIndex: 0,
        qAutoHeight: 0,
        nextItem: null,
        nextPage: null,
        resumeInfo: null,
        skipS: 0,
        skipE: 0,
        lastSave: 0,
        _lastGoodT: 0,
        _fragLoadingSince: 0,
        _buffering: false,
        _loaded: 0,
        _total: 0,
        _spd: 0,
        _spdT: 0,
        _spdB: 0
    };
    var p = vvProgGet(vvGetProgressMap(), VV.active.url || '');
    if (p) {
        VV.active.skipS = p.s || 0;
        VV.active.skipE = p.e || 0;
        VV.active.resumeInfo = p;
    }
    vvApplyBrightness(VV.active.bright);
    // 音量/静音分开存：
    //   vol  只存"非零音量"（用户最后一次听到的音量）
    //   mute 单独记"是不是静音"
    // 老版本只存 vol，一次手势滑到底（vol=0）之后就永久静音，界面上还没有任何
    // 按钮能看出来，用户感知就是"视频播着但没声音"。这里顺手把这种情况修好：
    // 读到的 vol 是 0 就当作 1，静音状态只看 mute。
    var _sv = VV.active.vol;
    var _sm = vvGet('mute', 0);
    try {
        VID.volume = (typeof _sv === 'number' && _sv > 0) ? _sv : 1;
        VID.muted = (_sm === 1 || _sm === true);
        // 记住"这是用户自己的选择"：巡检里的声音自愈不能把它当成我们压下去的静音
        VV._userMuted = !!VID.muted;
    } catch (e) {}
    try { VID.playbackRate = VV.active.speed; } catch (eS) {}
    // 抢占播放权：同一时间只允许一个页面拉流，避免多个 m3u8 页面把解码器吃光
    vvLeaseStart();
    vvSetTitle(vvShortName(item, 0));
    try { vvUpdateSpeedChip(); } catch (eChip) {}
    vvHideSheet();
    VV._endHandled = false;
    vvShowLoading(item.type === 'HLS' ? 'm3u8 加载中…' : '加载视频…');
    vvLoadMedia(item);
    vvArmFrameWatch();
    vvStartWatchdog();
    setTimeout(function () { vvFindNext(); }, 1400);
    vvShowCS();
}

// 播放器打开后广告仍可能继续插入 <html>；只在被遮挡时原子重排，避免影响播放
function vvKeepPlayerTop() {
    vvStopPlayerTop();
    VV._playerTopTimer = setInterval(function () {
        try {
            if (!VV.playerActive || !ROOT || !ROOT.parentNode) { vvStopPlayerTop(); return; }
            if (ROOT.style.display === 'none' || VV._mini) return; // 系统画中画 / 页内小窗
            // 分享 / 选集浮层是挂在 <html> 上的同级层，播放器被它们盖住是**故意的**。
            // 这里和面板巡检一样必须避让：否则 2.5 秒后播放器被挪回末尾，
            // 浮层整块消失，真机上看着就是「界面自己关了」。
            if (vvHasPriorityOverlay()) return;
            // 手指在播放器上时不要重排 DOM，否则可能触发 touchcancel，导致进度条拖了不跳
            if (VV._touchDown || (typeof vvG !== 'undefined' && vvG.progDrag)) return;
            if (vvIsOccluded(ROOT)) vvBringPlayerToFront();
        } catch (e) {
            vvStopPlayerTop();
        }
    }, 2500);
}

// 某些旧 WebView 在 appendChild 移动节点后会重置播放位置/暂停状态，这里做兜底恢复
function vvBringPlayerToFront() {
    var t = 0, paused = true, rate = 1, seeking = false;
    try {
        if (VID) {
            t = VID.currentTime;
            paused = VID.paused;
            rate = VID.playbackRate;
            seeking = VID.seeking;
        }
    } catch (e) {}
    vvBringToFront(ROOT);
    try {
        if (VID && !seeking && t > 0.2 && Math.abs(VID.currentTime - t) > 0.8) VID.currentTime = t;
        if (VID && rate && VID.playbackRate !== rate) VID.playbackRate = rate;
        if (VID && !paused && VID.paused) VID.play().catch(function () {});
    } catch (e2) {}
}

function vvStopPlayerTop() {
    try {
        if (VV._playerTopTimer) { clearInterval(VV._playerTopTimer); VV._playerTopTimer = null; }
    } catch (e) {}
}

function vvVideoKey(url) {
    // 进度记忆的 key。这里刻意【不用】媒体域名：
    // 多 CDN 的站点同一个视频每次刷新会换 CDN 域名
    // （同一份清单在几个不同的 CDN 主机名下轮换），
    // 用 host+path 做 key 会让同一个视频每次都被当成新视频，进度永远记不住。
    try {
        var u = new URL(url);
        var path = u.pathname || '';
        // 1) 路径里带视频 ID（32 位 hex 或 UUID，如某些站的 guid、多数站的 vid）：
        //    直接用它做 key。同一个视频往往有多个清单变体
        //    （/asp/enc/hls/…、/asp/hls/…、/asp/hlsaudio/…），它们路径不同但 guid 相同，
        //    用 guid 才能让这些变体共享同一份进度。
        var m = /[0-9a-f]{32}/i.exec(path)
            || /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(path);
        if (m) return 'id:' + m[0].toLowerCase();
        // 2) 路径太短太通用（/v.mp4、/video/1.mp4 这种）时补上域名，避免不同站点互相串进度
        if (path.length < 24) return u.hostname.replace(/^www\./, '') + path;
        // 3) 其余用 pathname —— 跨 CDN 稳定
        return path;
    } catch (e) {
        return String(url).slice(0, 180);
    }
}

// 兼容旧格式（host+path）的历史进度记录，避免升级后用户记录全丢
function vvProgGet(map, url) {
    var k = vvVideoKey(url);
    if (map[k]) return map[k];
    try {
        var u = new URL(url);
        var oldK = u.hostname.replace(/^www\./, '') + u.pathname;
        if (map[oldK]) return map[oldK];
    } catch (e) {}
    return null;
}

function vvSetPageFreeze(on) {
    try {
        document.documentElement.style.overflow = on ? 'hidden' : '';
        document.body.style.overflow = on ? 'hidden' : '';
    } catch (e) {}
}

// 播放器打开时，把页面里其它 media 的**解码器**收回来。
// 只 pause 不释放是无效的：<video> 仍然握着一条完整的解码管线，
// 同一页两路（站点原生 + 我们的）在 1080p 下就可能把硬件解码器顶满。
function vvPausePageMedia() {
    if (!VV._pageMedia) VV._pageMedia = [];
    try {
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el || (ROOT && ROOT.contains(el))) continue;
            if (el.mediaKeys) continue;
            var src = el.currentSrc || el.getAttribute('src') || '';
            if (!src) continue;
            // 只处理"确实在播"的那几路：暂停的元素本身不产生解码负载，
            // 盲目拆掉会破坏站点播放器的状态（视频黑掉、之后 play() 一直不 resolve）。
            // 在播的才是真占着 MediaCodec 的。
            var playing = false;
            try { playing = !el.paused && !el.ended && el.readyState > 0; } catch (eP) {}
            if (!playing) continue;
            var dup = false;
            for (var j = 0; j < VV._pageMedia.length; j++) {
                if (VV._pageMedia[j] && VV._pageMedia[j].el === el) { dup = true; break; }
            }
            if (dup) continue;
            VV._pageMedia.push({
                el: el, src: src, blob: src.indexOf('blob:') === 0,
                t: el.currentTime || 0, paused: !!el.paused,
                // 用“用户原本的静音状态”，别用此刻的 el.muted：
                // 上一轮让出解码器可能刚把它临时静音，拿当前值记下来就永远静音了。
                muted: (el.__vvMuted !== undefined ? el.__vvMuted : !!el.muted)
            });
            vvDetachMedia(el);
        }
    } catch (e) {}
}

// 播放器打开期间，页面自己的播放器光「暂停」是不够的。
//
// <video> 暂停后 preload 仍然有效：站点播放器普遍 preload="auto"，暂停只是停了解码，
// 分片还在继续下载，弱网/移动数据下等于跟我们的首片抢带宽——用户看到的是
// 「网页播放器很顺，插件播放器又慢又卡」。实测只把 preload 压成 none 不够：属性改完
// 浏览器仍会重新发起一次元数据请求，缓冲还在长；只有摘掉 src 才真的把网络停掉。
//
// 所以对**非 blob**、且当前没在播的页面媒体整条收起来（`vvDetachMedia`）。
// 注意这条链路【不复用】`VV._pageMedia`：那份清单的语义是「我正在播、关掉播放器后要
// 自动续播」，混进来会把续播逻辑搞乱（曾经把同一元素记两遍，导致播放器打开时页面视频
// 根本没被暂停）。这里用独立的 `VV_PRELOAD_HELD`，关闭时只装回 src、不自动起播。
//
// blob/MSE（currentSrc 以 blob: 开头）不能摘：摘了站点那条 MediaSource 就 closed，
// 关掉播放器也装不回来。这类只把 preload 按成 none，尽量少拉。
// 正在播的那些由 `vvPausePageMedia` 负责（它会连解码器一起收），这里跳过。
function vvStopPagePreload() {
    var els;
    try { els = document.querySelectorAll('video,audio'); } catch (e) { return; }
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        try {
            if (!el) continue;
            if (ROOT && ROOT.contains(el)) continue;      // 我们自己的播放器
            if (el.mediaKeys) continue;                    // DRM 的别碰
            var src = '';
            try { src = el.currentSrc || el.getAttribute('src') || ''; } catch (eS) {}
            if (!src) continue;
            // 正在播的归 vvPausePageMedia 管（它要连解码器一起收，并且要在关闭时续播）
            var playing = false;
            // 只有明确 paused===false 才算在播：某些壳里 paused 可能是 undefined，
            // 用 !el.paused 会把"没在播"误判成在播而整条跳过
            try { playing = el.paused === false && !el.ended; } catch (eP0) {}
            if (playing) continue;
            // 已经在某个清单里：上一轮收过了，别重复记账
            if (vvPreHeldIndexOf(el) >= 0) continue;
            if (src.indexOf('blob:') === 0) {
                // MSE：只能尽量让它别预载
                if (!el.__vvPreSaved) {
                    el.__vvPreSaved = true;
                    el.__vvPreAttr = el.getAttribute('preload');
                    VV._pagePreload = VV._pagePreload || [];
                    VV._pagePreload.push(el);
                }
                if (el.getAttribute('preload') !== 'none') el.setAttribute('preload', 'none');
                continue;
            }
            var t = 0, muted = false, pre = null;
            try { t = el.currentTime || 0; } catch (eT) {}
            try { muted = (el.__vvMuted !== undefined ? el.__vvMuted : !!el.muted); } catch (eM) {}
            try { pre = el.getAttribute('preload'); } catch (ePr) {}
            VV_PRELOAD_HELD.push({ el: el, src: src, t: t, muted: muted, pre: pre });
            VV._preloadAbort = (VV._preloadAbort || 0) + 1;
            vvDetachMedia(el);
        } catch (e1) {}
    }
}

function vvPreHeldIndexOf(el) {
    for (var i = 0; i < VV_PRELOAD_HELD.length; i++) {
        if (VV_PRELOAD_HELD[i] && VV_PRELOAD_HELD[i].el === el) return i;
    }
    return -1;
}

// 关播放器时把页面媒体装回去。
// 不自动起播：这些元素进播放器前就是暂停的，用户没点播放就不该自己动。
// preload 属性按原样还回去，站点自己的播放/暂停逻辑决定什么时候重新拉流。
function vvRestorePagePreload() {
    var list = VV._pagePreload || [];
    VV._pagePreload = [];
    for (var i = 0; i < list.length; i++) {
        var el = list[i];
        try {
            if (!el || !el.__vvPreSaved) continue;
            if (el.__vvPreAttr) el.setAttribute('preload', el.__vvPreAttr);
            else el.removeAttribute('preload');
            el.__vvPreSaved = false;
            el.__vvPreAttr = null;
        } catch (e) {}
    }
    var held = VV_PRELOAD_HELD;
    VV_PRELOAD_HELD = [];
    for (var k = 0; k < held.length; k++) {
        (function (rec) {
            var v = rec && rec.el;
            if (!v) return;
            try {
                if (rec.pre) v.setAttribute('preload', rec.pre);
                else v.removeAttribute('preload');
            } catch (e0) {}
            // 已经被站点/我们的其它链路装回去了：只把静音状态还回去
            if (vvHasSrc(v)) {
                try { v.muted = !!rec.muted; } catch (e1) {}
                try { delete v.__vvUsMuted; delete v.__vvMuted; delete v.__vvVol; } catch (e2) {}
                return;
            }
            try {
                // 用属性写回（和站点自己写 src 的方式一致，也让测试桩能观察到）
                v.setAttribute('src', rec.src);
                if (rec.t > 0.5) {
                    var once = function () {
                        try { v.removeEventListener('loadedmetadata', once); } catch (e3) {}
                        try { if (!v.__vvUserPlayed) v.currentTime = rec.t; } catch (e4) {}
                    };
                    v.addEventListener('loadedmetadata', once);
                }
                v.muted = !!rec.muted;
                delete v.__vvUsMuted; delete v.__vvMuted; delete v.__vvVol;
                v.load();
            } catch (e5) {}
        })(held[k]);
    }
}

// 播放中定时补扫：站点会在播放期间自己建新的播放器/预载下一集，
// 只靠打开那一刻扫一遍会漏（广告位、下一集预载都是后建的）
function vvStartPreloadGuard() {
    vvStopPreloadGuard();
    VV._preloadTimer = setInterval(function () {
        try {
            if (!VV.playerActive) { vvStopPreloadGuard(); return; }
            vvStopPagePreload();
        } catch (e) { vvStopPreloadGuard(); }
    }, 3000);
}

function vvStopPreloadGuard() {
    try {
        if (VV._preloadTimer) { clearInterval(VV._preloadTimer); VV._preloadTimer = 0; }
    } catch (e) {}
}

function vvResumePageMedia() {
    var list = VV._pageMedia || [];
    VV._pageMedia = [];
    if (!list.length) return;
    // 后台页签里绝对不能重新起播：一起播就等于又占一个硬件解码器，
    // 而用户根本看不见它——这正是"开几个页签后新页签播不动"的来源之一。
    // 所以这里只在可见时恢复；不可见就先把清单存着，等回到前台再恢复。
    if (typeof vvTabHidden === 'function' && vvTabHidden()) {
        VV._pageMediaDeferred = (VV._pageMediaDeferred || []).concat(list);
        return;
    }
    vvResumePageMediaNow(list);
}

function vvResumePageMediaNow(list) {
    if (!list || !list.length) return;
    if (typeof vvTabHidden === 'function' && vvTabHidden()) {
        VV._pageMediaDeferred = (VV._pageMediaDeferred || []).concat(list);
        return;
    }
    // 延迟恢复：退出播放器时刚 destroy 掉 MSE，Android WebView 回收 MediaCodec 需要一点时间，
    // 立刻 play() 会撞上"解码器忙"，表现就是页面视频黑着不动，要等一阵或干脆关页签。
    // 首次 700ms（给我们的硬释放让路），被拒的话再补一次，多数机型第二次就能起来。
    setTimeout(function () {
        if (typeof vvTabHidden === 'function' && vvTabHidden()) {
            VV._pageMediaDeferred = (VV._pageMediaDeferred || []).concat(list);
            return;
        }
        for (var i = 0; i < list.length; i++) {
            (function (rec) {
                // 兼容旧格式（纯元素）
                var el = (rec && rec.el) ? rec.el : rec;
                if (!el) return;
                // 没被摘过 src 的（保守模式 / 后来自己恢复了）：直接接着播
                var hasSrc = vvHasSrc(el);
                if (hasSrc) {
                    try { vvApAllowNext(el); } catch (eA) {}
                    try { el.play().catch(function () {}); } catch (e1) {}
                    return;
                }
                if (!rec || !rec.src) return;
                // 被摘过的：装回去再播。直链基本都能成功；
                // blob 只有在页面还没 revoke、MediaSource 还没 closed 时才有机会。
                vvAttachMedia(el, rec.src, rec.t, rec.paused === false, function () {
                    if (rec.blob) vvMediaLost(el);
                }, rec.muted);
            })(list[i]);
        }
    }, 700);
}

var ROOT = null, VID = null, BRIGHT = null, TOPBAR = null, BOTBAR = null, CBTN = null,
    CSPLAY = null, CSTIME = null, CSPROG = null, CSBUF = null, CSCUR = null,
    CSPROGDOT = null, LOCKMARK = null, SEEKTIP = null, GESTIP = null,
    LOADING = null, LOADBAR = null, LOADFILL = null, ERRBOX = null,
    MINIBAR = null, MINIDRAG = null,
    // 时长元素与当前秒文案缓存：timeupdate 约 4Hz，原来每次都 getElementById('vv-dur')
    // 并用 innerHTML 重建文本节点；文案按秒变化，缓存后绝大多数回调可以直接跳过。
    DUREL = null, LAST_CUR_TXT = '';

// 播放器打开期间被「整条收起来」的页面媒体（不是 VV._pageMedia：那份是"要续播"的语义）。
// 关闭播放器时只装回 src 与静音状态，不自动起播。
var VV_PRELOAD_HELD = [];

// 播放态低特效：开关只落在播放器根层的 class 上，CSS 一律按这个 class 匹配。
// 换源/重建 ROOT 时会在 vvEnsurePlayerRoot 里重新同步，避免改了设置却不生效。
function vvSyncLowFx() {
    try {
        if (!ROOT) return;
        if (VV.cfg.lowFx) ROOT.classList.add('vv-lowfx');
        else ROOT.classList.remove('vv-lowfx');
    } catch (e) {}
}

function vvSetCurTime(cur) {
    if (!CSTIME) return;
    var s = vvFmtTime(cur === undefined ? (VID ? VID.currentTime : 0) : cur);
    if (s === LAST_CUR_TXT) return;
    LAST_CUR_TXT = s;
    CSTIME.textContent = s;
}

// 百分比量化到 0.1%：360px 屏上一步不到 0.5px，肉眼无差，但长视频里能省掉
// 绝大多数无意义的 style 写入。比较的是 inline 值而不是内存缓存，所以拖动预览、
// seek 等别处直接写的 width 不会和这里的缓存打架。
function vvSetBarPct(el, prop, pct) {
    if (!el) return;
    var s = (Math.round(pct * 10) / 10) + '%';
    if (el.style[prop] !== s) el.style[prop] = s;
}


// 环形进度周长（r=19 → 2πr ≈ 119.38）
var VV_LOAD_CIRC = 119.4;
// HLS 显示百分比时认为"缓冲到位"的目标秒数（够播就算 100%）
var VV_LOAD_TARGET_S = 15;

// 控制栏按钮的统一工厂：图标 + data-act + 可访问名。
// title 不只是提示——几个诊断脚本用 textContent + title 找"播放/关闭"按钮，
// 换成纯 SVG 后 textContent 为空，title 是它们的兜底路径。
function vvCsBtn(act, icon, size, label, cls) {
    var b = vvEl('button', 'vv-csbtn' + (cls ? ' ' + cls : ''));
    b.setAttribute('data-act', act);
    b.setAttribute('aria-label', label);
    b.title = label;
    b.innerHTML = vvIcon(icon, size);
    return b;
}

function vvEnsurePlayerRoot() {
    if (ROOT) {
        try { document.documentElement.appendChild(ROOT); } catch (e) {}
        vvSyncLowFx();
        return ROOT;
    }
    vvEnsureStyle();
    ROOT = vvEl('div', 'vv-player-root');
    ROOT.id = 'vv-player-root';
    vvSyncLowFx();
    VID = vvEl('video', 'vv-player-video');
    VID.setAttribute('playsinline', '');
    VID.setAttribute('webkit-playsinline', '');
    VID.setAttribute('x5-playsinline', '');
    VID.setAttribute('preload', 'auto');
    VID.controls = false;
    // 系统画中画真正可用时（桌面 Chrome / Chrome for Android），进小窗要把整层播放器藏掉，
    // 但退出时必须把 display 还回来 —— 原来只藏不还原，从小窗返回就是一片黑。
    VID.addEventListener('enterpictureinpicture', function () {
        try { if (VV._mini) vvMiniWindow(false); } catch (eM) {}
        if (ROOT) ROOT.style.display = 'none';
        vvSetPageFreeze(false);
    });
    VID.addEventListener('leavepictureinpicture', function () {
        if (!ROOT) return;
        // 已经切到页内小窗了就别把页面重新冻上
        if (VV._mini) { vvSetPageFreeze(false); return; }
        ROOT.style.display = '';
        vvSetPageFreeze(true);
        vvBringToFront(ROOT);
        try { vvShowCS(); } catch (eS) {}
    });
    BRIGHT = vvEl('div', 'vv-bright');
    LOADING = vvEl('div', 'vv-loading');
    LOADING.innerHTML =
        '<div class="vv-lr">' +
        '<svg class="vv-lr-svg" viewBox="0 0 58 58">' +
        '<circle class="vv-lr-bg" cx="29" cy="29" r="19"></circle>' +
        '<circle class="vv-lr-fg" cx="29" cy="29" r="19"></circle>' +
        '</svg>' +
        '<div class="vv-lr-num">0%</div>' +
        '</div>' +
        '<div class="vv-load-text">加载中…</div>' +
        '<div class="vv-load-detail"></div>';
    // 顶部细进度条：缓冲时给出"还在走"的直观反馈（不确定进度）
    LOADBAR = vvEl('div', 'vv-loadbar');
    LOADBAR.innerHTML = '<div class="vv-loadbar-fill"></div>';
    LOADFILL = LOADBAR.querySelector('.vv-loadbar-fill');

    // 起播失败卡片。很多站（一次性 token 鉴权、纯 blob 流）在第三方播放器里
    // 必然拉不到流；原来只弹一条 toast 就消失，用户看到的是"黑屏 + 一直转圈"。
    // 这里给一个持久卡片，写清原因并给出退路（重试 / 外部播放器 / 返回）。
    ERRBOX = vvEl('div', 'vv-err');
    ERRBOX.innerHTML =
        '<div class="vv-err-ico">!</div>' +
        '<div class="vv-err-t">无法播放</div>' +
        '<div class="vv-err-m"></div>' +
        '<div class="vv-err-btns">' +
        '<button class="vv-err-btn primary" data-a="retry">重试</button>' +
        '<button class="vv-err-btn" data-a="ext">外部播放器</button>' +
        '<button class="vv-err-btn" data-a="close">返回</button>' +
        '</div>';
    ERRBOX.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('.vv-err-btn') : null;
        if (!b) return;
        e.stopPropagation();
        var a = b.getAttribute('data-a');
        if (a === 'retry') {
            vvHideErr();
            try {
                if (VV.active && VV.active.item) openPlayer(VV.active.item);
            } catch (eR) {}
        } else if (a === 'ext') {
            try { if (VV.active) vvOpenExternal(VV.active.item, VV.active.hls); } catch (eE) {}
        } else {
            try { closePlayer(); } catch (eC) {}
        }
    }, true);

    TOPBAR = vvEl('div', 'vv-cs-top');
    var backBtn = vvCsBtn('back', 'back', 22, '关闭');
    backBtn.id = 'vv-back';
    var title = vvEl('div', 'vv-title', '');
    title.id = 'vv-title';
    // 右侧次要操作收进一枚玻璃胶囊：和标题分开归组，也让它们有统一的 32px 命中框。
    // 选集放最左：看剧时切集比画中画/下载频繁，不该埋在「更多」两级菜单里。
    var topActs = vvEl('div', 'vv-top-acts');
    var epBtn = vvCsBtn('episodes', 'list', 20, '选集（剧集列表）');
    epBtn.id = 'vv-ep-btn';
    var pipBtn = vvCsBtn('pip', 'pip', 20, '画中画');
    // 两枚全屏按钮并列：fs 是系统沉浸全屏（栏会被隐藏），
    // webfs 是网页铺满（只把站点播放器放大到可视区，不碰浏览器栏）。
    // 互斥见 vvTryFs / vvPageFsSet。
    var fsBtn = vvCsBtn('fs', 'fs', 20, '沉浸全屏（隐藏状态栏）');
    fsBtn.id = 'vv-fs';
    var webFsBtn = vvCsBtn('webfs', 'webfs', 20, '网页铺满（放大到可视区）');
    webFsBtn.id = 'vv-pagefs-btn';
    var dlTop = vvCsBtn('download', 'dl', 20, '下载');
    dlTop.addEventListener('click', function () { if (VV.active) vvDownloadItem(VV.active.item); });
    topActs.appendChild(epBtn);
    topActs.appendChild(pipBtn);
    topActs.appendChild(fsBtn);
    topActs.appendChild(webFsBtn);
    topActs.appendChild(dlTop);
    TOPBAR.appendChild(backBtn);
    TOPBAR.appendChild(title);
    TOPBAR.appendChild(topActs);

    BOTBAR = vvEl('div', 'vv-cs-bottom');
    var progRow = vvEl('div', 'vv-prog-row');
    CSTIME = vvEl('div', 'vv-time', '00:00');
    CSTIME.id = 'vv-cur';
    CSPROG = vvEl('div', 'vv-prog');
    CSPROG.innerHTML = '<div class="vv-prog-track"></div><div class="vv-prog-buf"></div><div class="vv-prog-cur"></div><div class="vv-prog-dot"></div>';
    CSBUF = CSPROG.querySelector('.vv-prog-buf');
    CSCUR = CSPROG.querySelector('.vv-prog-cur');
    CSPROGDOT = CSPROG.querySelector('.vv-prog-dot');
    var durEl = vvEl('div', 'vv-time', '00:00');
    durEl.id = 'vv-dur';
    DUREL = durEl;
    progRow.appendChild(CSTIME);
    progRow.appendChild(CSPROG);
    progRow.appendChild(durEl);

    // 动作行：[播放][下一集] …… [清晰度][倍速][锁][更多]
    // 复制链接原来占着底栏一格，但它和"外部播放器 / 复制链接"完全重叠，
    // 收进「更多」菜单后右侧四件才有足够间距（360px 屏上不再挤成一团）。
    var actRow = vvEl('div', 'vv-act-row');
    CSPLAY = vvCsBtn('play', 'play', 22, '播放');
    CSPLAY.id = 'vv-play-btn';

    var nextBtn = vvEl('button', 'vv-csbtn vv-next-btn');
    nextBtn.id = 'vv-next-btn';
    nextBtn.setAttribute('data-act', 'next');
    nextBtn.setAttribute('aria-label', '下一集');
    nextBtn.title = '下一集';
    nextBtn.innerHTML = vvIcon('next', 16) + '<span class="vv-next-t">下一集</span>';
    nextBtn.style.display = 'none';

    var spacer = vvEl('div', 'vv-spacer');

    // 清晰度常驻按钮：只在多码率 HLS 时出现。原来它埋在「更多 → 画质」两级深处，
    // 而切码率是观看中最常用的操作之一，值得一个一级入口。
    var qualityChip = vvEl('button', 'vv-csbtn vv-chip vv-chip--q');
    qualityChip.id = 'vv-quality-chip';
    qualityChip.setAttribute('data-act', 'quality');
    qualityChip.setAttribute('aria-label', '清晰度');
    qualityChip.title = '清晰度';

    var speedChip = vvEl('button', 'vv-csbtn vv-chip');
    speedChip.id = 'vv-speed-chip';
    speedChip.setAttribute('data-act', 'speed');
    speedChip.setAttribute('aria-label', '播放速度');
    speedChip.title = '播放速度';

    var lockBtn = vvCsBtn('lock', 'unlock', 20, '锁定');
    lockBtn.id = 'vv-lock-btn';
    var moreBtn = vvCsBtn('more', 'more', 20, '更多');

    actRow.appendChild(CSPLAY);
    actRow.appendChild(nextBtn);
    actRow.appendChild(spacer);
    actRow.appendChild(qualityChip);
    actRow.appendChild(speedChip);
    actRow.appendChild(lockBtn);
    actRow.appendChild(moreBtn);

    BOTBAR.appendChild(progRow);
    BOTBAR.appendChild(actRow);

    CBTN = vvEl('button', 'vv-center-play');
    CBTN.innerHTML = vvIcon('play', 30);
    CBTN.setAttribute('aria-label', '播放');
    LOCKMARK = vvEl('button', 'vv-lockmark');
    LOCKMARK.innerHTML = vvIcon('lock', 18);
    LOCKMARK.setAttribute('aria-label', '锁定');
    SEEKTIP = vvEl('div', 'vv-seek-tip', '');
    GESTIP = vvEl('div', 'vv-ges-tip', '');

    // 页内小窗的操作条：常驻但不显示，只有 .mini 时才露出来。
    // 放在 ROOT 里而不是另起一层，closePlayer 回收 ROOT 时一起带走。
    MINIBAR = vvEl('div', 'vv-mini-bar');
    MINIBAR.id = 'vv-mini-bar';
    MINIBAR.innerHTML = '<span class="vv-mini-grip">小窗 · 可拖动</span>' +
        '<span class="vv-mini-acts">' +
        '<button class="vv-mini-btn" data-mini="restore" aria-label="还原全屏" title="还原全屏">' + vvIcon('fs', 14) + '</button>' +
        '<button class="vv-mini-btn" data-mini="close" aria-label="关闭" title="关闭">' + vvIcon('close', 14) + '</button>' +
        '</span>';
    MINIBAR.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('.vv-mini-btn') : null;
        if (!b) return;
        e.stopPropagation();
        if (b.getAttribute('data-mini') === 'close') { try { closePlayer(); } catch (eC) {} }
        else vvMiniWindow(false);
    }, true);

    var sheet = vvEl('div', 'vv-sheet');
    sheet.id = 'vv-sheet';

    ROOT.appendChild(VID);
    ROOT.appendChild(BRIGHT);
    ROOT.appendChild(LOADBAR);
    ROOT.appendChild(LOADING);
    ROOT.appendChild(ERRBOX);
    ROOT.appendChild(TOPBAR);
    ROOT.appendChild(BOTBAR);
    ROOT.appendChild(CBTN);
    ROOT.appendChild(LOCKMARK);
    ROOT.appendChild(SEEKTIP);
    ROOT.appendChild(GESTIP);
    ROOT.appendChild(MINIBAR);
    ROOT.appendChild(sheet);
    document.documentElement.appendChild(ROOT);

    // 小窗拖动绑在 ROOT 上；全屏手势在 vvGesStart/Move/End 里遇到 VV._mini 会让位
    ROOT.addEventListener('touchstart', vvMiniDragStart, { passive: false });
    ROOT.addEventListener('touchmove', vvMiniDragMove, { passive: false });
    ROOT.addEventListener('touchend', vvMiniDragEnd, { passive: false });
    ROOT.addEventListener('touchcancel', vvMiniDragEnd, { passive: false });

    backBtn.addEventListener('click', function () { closePlayer(); });
    epBtn.addEventListener('click', function () { vvEpisodesOpen(); });
    pipBtn.addEventListener('click', vvTryPip);
    fsBtn.addEventListener('click', vvTryFs);
    webFsBtn.addEventListener('click', vvTogglePageFullscreen);
    CSPLAY.addEventListener('click', vvTogglePlay);
    CBTN.addEventListener('click', vvTogglePlay);
    speedChip.addEventListener('click', function (e) { e.stopPropagation(); vvSpeedMenu(); });
    qualityChip.addEventListener('click', function (e) { e.stopPropagation(); vvQualityMenu(); });
    lockBtn.addEventListener('click', function (e) { e.stopPropagation(); vvToggleLock(); });
    LOCKMARK.addEventListener('click', function (e) { e.stopPropagation(); vvToggleLock(); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); vvGoNext(); });
    moreBtn.addEventListener('click', function (e) { e.stopPropagation(); vvMenuSheet(); });

    // 全屏图标随状态切换。document 级只绑一次，避免反复开关播放器叠加监听。
    if (!VV._fsBound) {
        VV._fsBound = true;
        document.addEventListener('fullscreenchange', function () {
            try {
                var b = document.querySelector('.vv-cs-top [data-act="fs"]');
                if (b) b.innerHTML = vvIcon(document.fullscreenElement ? 'fsExit' : 'fs', 20);
            } catch (eF) {}
        });
    }

    // 播放器 root 每次打开都重建：按钮的高亮要跟着「网页铺满」当前状态走，
    // 否则从菜单开着网页铺满再打开播放器，新按钮会显示成未激活。
    try { vvPageFsSyncBtn(); } catch (ePF) {}
    vvBindGestures();
    vvBindVideo();
    vvBindProgress();
    return ROOT;
}

function vvSetTitle(s) {
    try { document.getElementById('vv-title').innerHTML = vvEscape(s); } catch (e) {}
}

function vvShowLoading(text) {
    try {
        if (!LOADING) return;
        var tx = LOADING.querySelector('.vv-load-text');
        if (tx) tx.innerHTML = vvEscape(text || '加载中…');
        LOADING.classList.add('on');
        if (ROOT) ROOT.classList.add('vv-loading-on');
        vvSetLoadPct(null, true);
        vvShowLoadBar(true);
        vvStartLoadTick();
    } catch (e) {}
}

// 加载中的进度刷新定时器：HLS 的缓冲深度变化没有 progress 事件，需要轮询
function vvStartLoadTick() {
    try {
        if (VV._loadTick) return;
        VV._loadTick = setInterval(function () {
            try {
                if (!LOADING || !LOADING.classList.contains('on')) { vvStopLoadTick(); return; }
                vvUpdateLoadProgress();
            } catch (e) {}
        }, 300);
    } catch (e) {}
}

function vvStopLoadTick() {
    try {
        if (VV._loadTick) { clearInterval(VV._loadTick); VV._loadTick = null; }
    } catch (e) {}
}

function vvHideLoading() {
    try {
        if (LOADING) {
            LOADING.classList.remove('on');
            LOADING.classList.remove('indet');
        }
        if (ROOT) ROOT.classList.remove('vv-loading-on');
    } catch (e) {}
    vvShowLoadBar(false);
    vvStopLoadTick();
}

// 顶部细进度条：只在"确实在等数据"时出现
function vvShowLoadBar(on) {
    try {
        if (!LOADBAR) return;
        LOADBAR.classList.toggle('on', !!on);
        if (!on) {
            LOADBAR.classList.remove('indet');
            if (LOADFILL) LOADFILL.style.width = '0';
        }
    } catch (e) {}
}

// ---- 起播失败卡片 ----
// 为什么需要它：不少站点的视频源在第三方播放器里根本拉不到
//   · 一次性 token 鉴权：m3u8 里的 token 被页面播放器消费后，第三方再请求必 403
//   · 纯 blob:（MSE 会话句柄）：离开原页面上下文就失效
// 原来只弹一条 toast，2 秒后消失，用户看到的是黑屏 + 无限转圈，不知道该干什么。
function vvShowErr(msg, title) {
    try {
        if (!ERRBOX) return;
        var t = ERRBOX.querySelector('.vv-err-t');
        var m = ERRBOX.querySelector('.vv-err-m');
        if (t) t.textContent = title || '无法播放';
        if (m) m.textContent = msg || '';
        ERRBOX.classList.add('on');
        vvHideLoading();
    } catch (e) {}
}

function vvHideErr() {
    try { if (ERRBOX) ERRBOX.classList.remove('on'); } catch (e) {}
}

// 起播预算：先等 12s 才第一次判断，之后每次续命 5~6s，总上限 120s。
// 为什么不是"等 12s 要么播要么报错"：1080P 的一片常见 2~6MB，弱网（2G/限速 WiFi/跨境线路）
// 下 12s 连元数据都拿不到是常态，而错误卡片会把加载进度环顶掉，用户看到的是"播不了"，
// 十几秒后视频又自己播起来——最典型的 CDN 抖动（TCP 不死不断、停 20 秒）就能稳定复现。
var VV_WDOG_FIRST_MS = 12000;
var VV_WDOG_STEP_MS = 6000;
// 只有「弱证据」（连接还开着、请求还在飞、但一个字节都没来）时最多等这么久，
// 超过就认定流真的死了；有字节持续增长的「强证据」可以一路等到总上限。
var VV_WDOG_WEAK_S = 45;
// 但"一个字节都没来过"和"来过字节、只是慢"要分开算：4KB/s 的线路拉 1MB mp4，
// 一次 progress 事件都不发、元数据 40 秒才到也照样能播（实测）。已经确认链路通了的，
// 就按总上限等，别在它马上要出画的时候弹卡片。
var VV_WDOG_NET_S = 100;
var VV_WDOG_MAX_S = 120;

// "数据还在往下走"的证据等级：0 = 一点动静都没有，1 = 请求还在飞（弱），2 = 确实有字节进来（强）。
// 这份判据必须覆盖直连 mp4 —— hls 的 _fragLoadingSince/_fragLoadedAt 只有 hls.js 的事件会写，
// 直连 mp4 永远没有这两个标记，旧版看门狗等于对 mp4 完全瞎掉，慢一点就判死。
function vvNetFlow(act, nowMs) {
    try {
        if (!act) return 0;
        var now = nowMs || Date.now();
        if (VID && VID.error) return 0;
        // 强证据：最近 6s 内有字节到账（分片下载完成 / 清单下载完成 / mp4 的 progress 增长）
        if (act._netAt && now - act._netAt < 6000) return 2;
        // 弱证据：请求在飞。hls 的分片有 45s 宽限（超过就该由 hls 自己 abort 重试），
        // 清单/子清单 30s（弱网下第一个 m3u8 跳两级子清单很常见）。
        if (act._fragLoadingSince && now - act._fragLoadingSince < 45000) return 1;
        if (act._manifLoadingSince && now - act._manifLoadingSince < 30000) return 1;
        // 直连 mp4 / 原生 HLS：networkState=2 就是"浏览器还在向网络要数据"，
        // 没有 error 说明连接没被判死，值得再等（但只算弱证据，有总上限兜着）。
        if (VID && VID.networkState === 2) return 1;
        return 0;
    } catch (e) {
        return 0;
    }
}

// 续命期间把加载环留住并改文案：这时候"还在下"本身就是最重要的反馈，
// 把进度环换成错误卡片（旧行为）等于对着一个还在下载的视频说播不了。
function vvMarkLoadingSlow() {
    try {
        if (!LOADING) return;
        var on = LOADING.classList.contains('on');
        if (!on) vvShowLoading('网络较慢，仍在加载…');
        var tx = LOADING.querySelector('.vv-load-text');
        if (tx && tx.textContent !== '网络较慢，仍在加载…') tx.textContent = '网络较慢，仍在加载…';
        vvShowLoadBar(true);
        vvStartLoadTick();
        vvUpdateLoadProgress();
        // 没有总长度时（moov 都还没到 / HLS 还没缓冲）detail 是空的，
        // 这时给出已下载字节，用户至少能看到数字在涨、不是死在这里。
        var det = LOADING.querySelector('.vv-load-detail');
        if (det && !det.textContent) {
            var gotB = (VV.active && VV.active._loaded) || 0;
            if (gotB > 0) det.textContent = '已下载 ' + vvFmtBytes(gotB);
        }
    } catch (e) {}
}

// 起播看门狗：打开后一段时间仍没有画面数据 → 给错误卡片，而不是让用户对着黑屏
// 但"没画面"分三种：还在下（续命）、解码器抢不到（自救）、流真死了（报错）。
// delay 只给测试用（smoke 里跑 10ms 的假预算）。
function vvArmStartWatchdog(delay) {
    try {
        if (VV._startWdog) { clearTimeout(VV._startWdog); VV._startWdog = null; }
        var armAct = VV.active;
        if (armAct && !armAct._wdogT0) armAct._wdogT0 = Date.now();
        VV._startWdog = setTimeout(function () {
            VV._startWdog = null;
            try {
                if (!VV.playerActive || !VID) return;
                if (VID.readyState >= 2 || (VV.active && VV.active._sawFrame)) return;
                var act = VV.active || {};
                var netFail = act._netFail || 0;
                var code = act._lastHttpCode || 0;
                var nowMs = Date.now();
                var t0 = act._wdogT0 || nowMs;
                var elapsed = (nowMs - t0) / 1000;
                // 源站明说不行（4xx / 连续多次连不上）就不等了：那不是"慢"，是拒绝。
                var dead = code >= 400 || netFail >= 3;
                var flow = dead ? 0 : vvNetFlow(act, nowMs);
                var strong = flow >= 2;
                // 有没有确认过"链路是通的"：收到过字节、或元数据已经解析出来。
                // 通了的按 VV_WDOG_NET_S 等，完全没动静的按 VV_WDOG_WEAK_S 判死。
                var gotAny = !!act._netAt || (act._loaded || 0) > 0 || (VID.readyState >= 1);
                var weakCap = gotAny ? VV_WDOG_NET_S : VV_WDOG_WEAK_S;
                var keep = !dead && elapsed < VV_WDOG_MAX_S && (strong || (flow === 1 && elapsed < weakCap));
                if (keep) {
                    act._wdogExtend = (act._wdogExtend || 0) + 1;
                    VV._startWdogExtend = (VV._startWdogExtend || 0) + 1;
                    vvMarkLoadingSlow();
                    vvArmStartWatchdog(strong ? VV_WDOG_STEP_MS : VV_WDOG_STEP_MS - 1000);
                    return;
                }
                // 数据确实不流了，却已经拿到元数据：这时才按"解码器抢不到"自救。
                // 数据还在走的慢资源不会走到这里，所以不会再把"慢"当解码器故障、
                // 销毁 hls 从零重下（旧行为在弱网下等于每 12s 自毁一次）。
                if (flow === 0 && !dead && VID.readyState >= 1 && !act._blobOnly && !act._nativeTried) {
                    if (vvCodecRescue('watchdog')) return;
                    vvShowErr('设备的硬件解码器被占满了：同时打开的视频页签太多，系统没有空闲解码器给这一页。\n关掉 2～3 个视频页签后再点播放即可。', '解码器不够用');
                    return;
                }
                var why;
                if (code === 403 || netFail >= 3) {
                    why = '源站拒绝了请求（' + (code ? 'HTTP ' + code : '多次连接失败') + '）。不少站点的播放地址是一次性鉴权的，被页面播放器用过之后第三方就无法复用。';
                } else if (act._blobOnly) {
                    why = '该页面只用浏览器内部的视频流（blob），离开页面上下文就无法播放。';
                } else {
                    why = '长时间没有拿到画面数据。可能是防盗链、需要登录，或线路暂时不可用。'
                        + (elapsed >= VV_WDOG_MAX_S ? '（已等待 ' + Math.round(elapsed) + ' 秒）' : '');
                }
                vvShowErr(why, '这个视频源播不了');
            } catch (eW) {}
        }, delay || VV_WDOG_FIRST_MS);
    } catch (e) {}
}

function vvDisarmStartWatchdog() {
    try { if (VV._startWdog) { clearTimeout(VV._startWdog); VV._startWdog = null; } } catch (e) {}
}

// ---- 解码器抢不到时的自救 ----
//
// 现象：播放器"能加载"（hls 拉到分片、进度条也在动），但画面一直是黑的，
//       currentTime 卡在 0 不走；关掉几个其它视频页签后又正常。
// 这不是网络问题，是设备级的硬件解码器被占满了（Android 的 MediaCodec 实例数是硬上限，
// 一个后台页签里的 <video> 也会占一个）。JS 没有办法"跨页签释放"，
// 能做的是三件事：本页全交出来 → 广播让别的页签也交 → 降到最低码率重来一次。
function vvArmFrameWatch() {
    vvDisarmFrameWatch();
    var act = VV.active;
    if (!act) return;
    var t0 = Date.now();
    VV._frameWatch = setInterval(function () {
        try {
            if (!VV.playerActive || !VID || VV.active !== act) { vvDisarmFrameWatch(); return; }
            var el = Date.now() - t0;
            if (el > 7000) { vvDisarmFrameWatch(); return; }
            if (VID.error) { vvDisarmFrameWatch(); return; }
            // 有画面在走：正常
            if (!VID.paused && VID.currentTime > 0.08) { vvDisarmFrameWatch(); return; }
            // 数据已经够了（HAVE_FUTURE_DATA 以上）却一帧都不出 → 解码器没拿到。
            // 判据要卡在"真的一帧都没解出来"：readyState 只到 2（HAVE_CURRENT_DATA）时
            // 解码器可能还在初始化，这时候重建只会把刚拿到的分片丢掉、从头再来。
            if (el > 4200 && !VID.paused && VID.readyState >= 3) {
                var q = null;
                try { q = VID.getVideoPlaybackQuality ? VID.getVideoPlaybackQuality() : null; } catch (eq) {}
                var frames = q && typeof q.totalVideoFrames === 'number' ? q.totalVideoFrames : -1;
                // frames 已经在涨：解码器是通的，只是 currentTime 还没跨过阈值，别重建
                if (frames === 0 || frames === -1) {
                    vvDisarmFrameWatch();
                    vvCodecRescue('no-frame');
                }
            }
        } catch (e) { vvDisarmFrameWatch(); }
    }, 600);
}

function vvDisarmFrameWatch() {
    try { if (VV._frameWatch) { clearInterval(VV._frameWatch); VV._frameWatch = 0; } } catch (e) {}
}

function vvCodecRescue(why) {
    try {
        var act = VV.active;
        if (!act || !act.item) return false;
        act._rescue = act._rescue || 0;
        // 三次：0.9s / 2.5s / 5s。
        // 一次不够——别的页签从"发现自己失去焦点"到真正把 MediaCodec 交出来
        // 要几秒（本页 4 秒的失焦确认阈值 + 释放耗时），只试一次就判死等于
        // 让用户以为这页废了，其实再等几秒解码器就空出来了。
        if (act._rescue >= 3) return false;
        act._rescue++;
        var wait = act._rescue === 1 ? 900 : act._rescue === 2 ? 2500 : 5000;
        var pos = 0;
        try { pos = (VID && isFinite(VID.currentTime) && VID.currentTime > 0) ? VID.currentTime : 0; } catch (eP) {}
        if (!pos) pos = act._suspendT || 0;
        act._suspendT = pos;
        // 只作诊断标记（诊断面板显示重试次数），不再据此把 ABR 钉在最低档
        act._forceLow = true;
        VV._lastRescue = { ts: Date.now(), why: why || '', n: act._rescue };
        vvToast(act._rescue === 1 ? '没能拿到硬件解码器，正在让出资源并重建…'
            : act._rescue === 2 ? '再试一次（其它页面正在归还解码器）…'
                : '最后一次尝试（画质保持不变）…', true);
        // 1) 广播：请其它页签把解码器交出来
        try { vvRequestPeerRelease(); } catch (e0) {}
        // 2) 本页全交：hls / 播放器 <video> / 站点自带的 MSE 播放器
        try { vvKillMedia(); } catch (e1) {}
        try { vvKillAllHls(); } catch (e2) {}
        try { vvDeepHibernateBlob(); } catch (e3) {}
        // 3) 给 media 进程一点时间真正 release，再重建
        setTimeout(function () {
            try {
                if (!VV.playerActive || VV.active !== act) return;
                act._mediaReleased = false;
                vvRebuildMedia();
            } catch (e4) {}
        }, wait);
        return true;
    } catch (e) { return false; }
}

// 设置加载进度：pct 为 null/NaN 时进入"不确定态"（只显示动画，不显示百分比）
function vvSetLoadPct(pct, indet, detail) {
    try {
        if (!LOADING) return;
        var ring = LOADING.querySelector('.vv-lr-fg');
        var num = LOADING.querySelector('.vv-lr-num');
        var det = LOADING.querySelector('.vv-load-detail');
        var C = 119.4; // r=19 的周长
        if (indet || pct === null || pct === undefined || isNaN(pct)) {
            LOADING.classList.add('indet');
            if (ring) ring.style.strokeDashoffset = '0';
            if (num) num.textContent = '';
            if (LOADBAR) {
                LOADBAR.classList.add('indet');
                if (LOADFILL) LOADFILL.style.width = '';
            }
        } else {
            var p = Math.max(0, Math.min(100, pct));
            LOADING.classList.remove('indet');
            if (ring) ring.style.strokeDashoffset = String(C * (1 - p / 100));
            if (num) num.textContent = Math.round(p) + '%';
            if (LOADBAR) {
                LOADBAR.classList.remove('indet');
                if (LOADFILL) LOADFILL.style.width = p + '%';
            }
        }
        if (det) det.textContent = detail || '';
    } catch (e) {}
}

// 统计下载速度（KB/s）：用 video 元素的 progress 事件增量
function vvTrackSpeed(bytes) {
    try {
        var act = VV.active;
        if (!act) return;
        var now = Date.now();
        if (act._spdT) {
            var dt = (now - act._spdT) / 1000;
            if (dt > 0.35) {
                var delta = bytes - (act._spdB || 0);
                if (delta > 0) {
                    var kbps = delta / dt / 1024;
                    // 指数平滑，避免速度数字剧烈跳动
                    act._spd = act._spd ? (act._spd * 0.6 + kbps * 0.4) : kbps;
                }
                act._spdT = now;
                act._spdB = bytes;
            }
        } else {
            act._spdT = now;
            act._spdB = bytes;
        }
    } catch (e) {}
}

// HLS 模式：没有"总大小"概念，用"已缓冲时长 / 目标缓冲时长"当进度
function vvHlsLoadPct() {
    try {
        if (!VID || !VID.buffered || VID.buffered.length === 0) return null;
        var cur = VID.currentTime || 0;
        var end = 0;
        for (var i = 0; i < VID.buffered.length; i++) {
            if (cur >= VID.buffered.start(i) - 0.5 && cur <= VID.buffered.end(i) + 0.5) {
                end = VID.buffered.end(i);
                break;
            }
        }
        if (!end) end = VID.buffered.end(VID.buffered.length - 1);
        var ahead = Math.max(0, end - cur);
        if (ahead <= 0) return null;
        return Math.min(100, (ahead / VV_LOAD_TARGET_S) * 100);
    } catch (e) {
        return null;
    }
}

// 统一的进度刷新：
// - 直链 mp4：能拿到总长度就用真实下载百分比，否则退回"缓冲时长比"
// - HLS：没有"总大小"概念，用"已缓冲时长 / 目标缓冲时长"当进度
// 大转圈只在"正在等数据"时出现；mp4 播放起来之后，细进度条继续显示下载进度直到完成
function vvUpdateLoadProgress() {
    try {
        if (!LOADING) return;
        var act = VV.active;
        if (!act) return;
        var isHls = act.item && act.item.type === 'HLS';
        var pct = null, detail = '';
        var ahead = 0;
        try {
            if (VID && VID.buffered && VID.buffered.length) {
                ahead = Math.max(0, VID.buffered.end(VID.buffered.length - 1) - (VID.currentTime || 0));
            }
        } catch (eA) {}
        if (isHls) {
            var sp = act._fragMsSum > 0 ? (act._fragBytesSum / act._fragMsSum) * 1000 / 1024 : (act._spd || 0);
            if (ahead > 0) pct = Math.min(100, (ahead / VV_LOAD_TARGET_S) * 100);
            if (sp > 0) detail = vvFmtSpeed(sp);
            if (ahead > 0) detail = (detail ? detail + ' · ' : '') + '已缓冲 ' + ahead.toFixed(1) + 's';
        } else {
            var total = act._total || 0, loaded = act._loaded || 0;
            if (total > 0) {
                pct = Math.min(100, (loaded / total) * 100);
                detail = vvFmtBytes(loaded) + ' / ' + vvFmtBytes(total);
                if (act._spd > 0) detail += ' · ' + vvFmtSpeed(act._spd);
            } else if (ahead > 0) {
                pct = Math.min(100, (ahead / VV_LOAD_TARGET_S) * 100);
                detail = '已缓冲 ' + ahead.toFixed(1) + 's';
                if (act._spd > 0) detail += ' · ' + vvFmtSpeed(act._spd);
            }
        }
        var spinnerOn = LOADING.classList.contains('on');
        if (spinnerOn) {
            // 只有"播放中卡顿"才强制不确定态：
            // 缓冲深的时候 ahead 可能已经远超目标（seek 后预读 80s），
            // 照"已缓冲/目标"算就是 100%，会出现「满环 + 写着缓冲中」的矛盾画面。
            // 但起播首屏加载不能这么处理 —— 那时 _lastGoodT 还是 0（还没成功播过一帧），
            // 必须照常显示百分比，否则用户首屏永远看不到进度。
            var playedBefore = (act._lastGoodT || 0) > 0.5;
            var indetNow = (pct === null) || (!!act._buffering && playedBefore);
            vvSetLoadPct(indetNow ? null : pct, indetNow, detail);
        } else {
            // 不在加载：只有直链还没下完时，才让顶部细条继续显示下载进度
            if (!isHls && total > 0 && loaded < total) {
                vvShowLoadBar(true);
                if (LOADBAR) {
                    LOADBAR.classList.remove('indet');
                    if (LOADFILL) LOADFILL.style.width = pct + '%';
                }
            } else {
                vvShowLoadBar(false);
            }
        }
    } catch (e) {}
}

// 分片首字节超时：正常播放要短（慢分片尽快失败 → ABR 降档重试），
// seek 时放宽（慢 CDN 也别被中途放弃，否则跳转永远失败）。
var VV_FRAG_TTF = 10000;
var VV_FRAG_MAX_LOAD = 60000;
var VV_FRAG_TTF_SEEK = 45000;
var VV_FRAG_MAX_LOAD_SEEK = 180000;

// —— MSE codec 约束位兜底 ——
// 很多直播/点播码流的 H.264 SPS 带 constraint_set 标志，hls.js 据此拼出的 MIME 形如
// avc1.640128；而 Chromium 系（含 Android WebView）的 mp4 demuxer 只认约束字节为 00 的
// 等价写法 avc1.640028，addSourceBuffer 直接抛 NotSupportedError。外部表现就是
// "加载圈转到 100% 然后黑屏"或者一直转圈，错误卡只说无法播放，完全看不出是编码标号问题。
// 这里在创建 SourceBuffer 前做一次等价改写：profile 与 level 原样保留，只把约束位归零，
// 且必须 isTypeSupported 为 true 才换，避免把本来就播不了的流硬塞进去。
var VV_MS_PATCHED = false;

function vvFixMimeCodec(mime) {
    try {
        if (!mime || typeof mime !== 'string' || mime.indexOf('avc') < 0) return mime;
        var MS = window.MediaSource;
        if (!MS || typeof MS.isTypeSupported !== 'function') return mime;
        if (MS.isTypeSupported(mime)) return mime;
        var out = mime.replace(/avc([13])\.([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/g, function (all, ver, prof, cons, lev) {
            if (cons === '00') return all;
            return 'avc' + ver + '.' + prof + '00' + lev;
        });
        if (out !== mime && MS.isTypeSupported(out)) return out;
    } catch (e) {}
    return mime;
}

function vvPatchMseCodec() {
    if (VV_MS_PATCHED) return;
    VV_MS_PATCHED = true;
    try {
        var MS = window.MediaSource;
        if (!MS || !MS.prototype || typeof MS.prototype.addSourceBuffer !== 'function') return;
        var orig = MS.prototype.addSourceBuffer;
        MS.prototype.addSourceBuffer = function (mime) {
            var m = mime;
            try { m = vvFixMimeCodec(mime); } catch (e) {}
            try {
                return orig.call(this, m);
            } catch (e2) {
                // 改写后仍失败：退回原写法，让 hls.js 走自己的错误分支（别把原始错误吞掉）
                if (m !== mime) return orig.call(this, mime);
                throw e2;
            }
        };
    } catch (e) {}
}

// hls.js 每次拉分片都会重新读 config.fragLoadPolicy.default，
// 所以运行时改这两个字段，对下一片立即生效。
function vvHlsSetSeekMode(inst, on) {
    try {
        if (!inst || !inst.config || !inst.config.fragLoadPolicy) return;
        var d = inst.config.fragLoadPolicy.default;
        if (!d) return;
        d.maxTimeToFirstByteMs = on ? VV_FRAG_TTF_SEEK : VV_FRAG_TTF;
        d.maxLoadTimeMs = on ? VV_FRAG_MAX_LOAD_SEEK : VV_FRAG_MAX_LOAD;
    } catch (e) {}
}

// hls.js 移动端参数：参考官方 API 的 loadPolicy / gap controller 建议。
// 目标：弱网起播快、seek 遇到小缓冲空洞不卡死、断流后从当前位置恢复。
// 画质红线：不做任何自动降档。掉帧 / 小窗 / 并行 / 解码器重试都只能改缓冲与 UI，
// 不能改码率档位；要降画质只能由用户在「画质」菜单里手动选。
function vvHlsConfig() {
    return {
        enableWorker: true,
        lowLatencyMode: false,
        // 不按播放器 DOM 尺寸封顶：手机 WebView 里播放器常被 CSS 缩到 360×203，
        // 按它封顶会把 720P/1080P 档直接排除，且网页铺满 / 系统全屏后尺寸还会变。
        capLevelToPlayerSize: false,
        // 不因掉帧降档：UI 毛玻璃引起的合成掉帧跟视频解码无关，
        // 以前这会让画面在打开菜单时悄悄变糊；掉帧改由 lowFx 在 UI 层解决。
        capLevelOnFPSDrop: false,
        // -1 = 交给 ABR 自动选档（配合 2Mbps 起估），不再硬钉最低档起播。
        startLevel: -1,
        startFragPrefetch: true,
        testBandwidth: false,
        abrBandWidthUpFactor: 0.6,
        // 点播不是直播，缓冲越深越抗抖：36s 目标（6s 分片约 6 片余量），
        // 回看缓冲压到 20s，把内存让给前向缓冲。
        backBufferLength: 20,
        maxBufferLength: 36,
        maxMaxBufferLength: 72,
        maxBufferSize: 50 * 1000 * 1000,
        maxBufferHole: 0.5,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 6,
        highBufferWatchdogPeriod: 2,
        maxFragLookUpTolerance: 0.5,
        // 2Mbps 起估：原来 500k 会让前 30 秒一直在最低档爬坡，每次升档都吃空缓冲
        abrEwmaDefaultEstimate: 2000000,
        manifestLoadPolicy: {
            default: {
                maxTimeToFirstByteMs: 12000,
                maxLoadTimeMs: 30000,
                timeoutRetry: { maxNumRetry: 2, retryDelayMs: 0, maxRetryDelayMs: 0 },
                errorRetry: { maxNumRetry: 3, retryDelayMs: 800, maxRetryDelayMs: 8000 }
            }
        },
        playlistLoadPolicy: {
            default: {
                maxTimeToFirstByteMs: 12000,
                maxLoadTimeMs: 30000,
                timeoutRetry: { maxNumRetry: 2, retryDelayMs: 0, maxRetryDelayMs: 0 },
                errorRetry: { maxNumRetry: 3, retryDelayMs: 800, maxRetryDelayMs: 8000 }
            }
        },
        fragLoadPolicy: {
            default: {
                // 默认走快速失败；seek 期间由 vvHlsSetSeekMode 放宽
                maxTimeToFirstByteMs: VV_FRAG_TTF,
                maxLoadTimeMs: VV_FRAG_MAX_LOAD,
                timeoutRetry: { maxNumRetry: 2, retryDelayMs: 0, maxRetryDelayMs: 0 },
                errorRetry: { maxNumRetry: 4, retryDelayMs: 1000, maxRetryDelayMs: 10000 }
            }
        }
    };
}

function vvCanNativeHls() {
    try { return !!(VID && VID.canPlayType && VID.canPlayType('application/vnd.apple.mpegurl')); } catch (e) { return false; }
}

// 优先用构建时内联的标准版 hls.js：很多站点会往页面里注入自家魔改版并覆盖 window.Hls
// （页面注入的是定制版），第三方再拿它 new 实例时行为完全不可控，常见表现就是
// 主清单能解析、分片却永远进不了 SourceBuffer，最后只剩黑屏。
function vvPickHlsCtor() {
    try {
        var own = window.__vvHlsCtor;
        if (own && typeof own.isSupported === 'function' && own.isSupported()) return own;
    } catch (e1) {}
    try {
        var g = window.Hls;
        if (g && typeof g.isSupported === 'function' && g.isSupported()) return g;
    } catch (e2) {}
    return null;
}

function vvHasMseHls() {
    return !!vvPickHlsCtor();
}

function vvLoadMedia(item) {
    vvKillMedia();
    // vvKillMedia → vvHardReleaseVideo 会把音量压成 0、静音打开（为了立刻止住残余音频）。
    // 重建时第一件事就是把用户原来的音量/静音还回去，否则整条重建之后画面在动、
    // 声音一直是 0——用户感知就是"播放没声音"，而且每次从后台切回来都要中一次。
    try { vvRestoreAudio(VID); } catch (eVA) {}
    if (VV.active) {
        VV.active._waitCount = 0;
        VV.active._waitMs = 0;
        VV.active._waitStart = 0;
        VV.active._fragLoads = [];
        VV.active._fragMs = 0;
        VV.active._fragBytes = 0;
        VV.active._fragMsSum = 0;
        VV.active._fragBytesSum = 0;
        VV.active._fragLoadingSince = 0;
        VV.active._fragLoadedAt = 0;
        // 起播看门狗的判据全部重置：换源/重建是一次全新的起播，不能带着上一轮的
        // "刚下到过数据"记录，否则新地址明明没动静也会被续命拖到总上限。
        VV.active._netAt = 0;
        VV.active._manifLoadingSince = 0;
        VV.active._wdogT0 = 0;
        VV.active._wdogExtend = 0;
        VV.active._loaded = 0;
        VV.active._total = 0;
        VV.active._spd = 0;
        VV.active._spdT = 0;
        VV.active._spdB = 0;
        VV.active._buffering = false;
        VV.active._sawFrame = false;
        VV.active._lastHttpCode = 0;
        VV.active._blobOnly = false;
        VV.active._netFail = 0;
        try { clearTimeout(VV.active._seekModeTimer); } catch (eSM) {}
        VV.active._seekModeTimer = 0;
    }
    var url = item.url;
    // 起播看门狗：打开后 12s 还没有画面就给错误卡片（不同站点策略差异很大，不能只靠 toast）
    vvHideErr();
    vvArmStartWatchdog();
    if (item.type === 'BLOB') {
        // blob: 是页面自己 MSE 会话的句柄，换到独立播放器必然拿不到数据
        if (VV.active) VV.active._blobOnly = true;
        vvAttachDirect(url, true);
        return;
    }
    if (item.type === 'HLS') {
        // 先把 codec 约束位的兜底补丁装上，hls.js 建 SourceBuffer 时才能被接住
        vvPatchMseCodec();
        var engine = VV.cfg.hlsEngine || 'auto';
        // 系统原生 HLS 通常更省电/更流畅，也不受 CORS 限制；但部分 WebView 不支持
        if (engine === 'native') {
            if (vvCanNativeHls()) {
                if (VV.active) VV.active._nativeTried = true;
                vvAttachDirect(url, false);
                vvToast('使用系统 HLS 播放');
                return;
            }
            vvToast('系统不支持原生 HLS，改用 hls.js', true);
        }
        // 系统 WebView 支持原生 HLS 且没有 MSE 能力时直接走原生，省去 CDN 等待
        if (!vvHasMseHls() && vvCanNativeHls()) {
            if (VV.active) VV.active._nativeTried = true;
            vvAttachDirect(url, false);
            vvToast('使用系统 HLS 播放');
            return;
        }
        vvLoadHls(function (ok, hlsCtor) {
            if (!ok) {
                vvAttachDirect(url, false);
                vvToast('无法加载 hls.js，尝试原生播放 m3u8', true);
                return;
            }
            try {
                // hls.js 的 Events/ErrorTypes 是构造函数上的静态成员，实例上没有
                var hlsEv = hlsCtor.Events || {};
                var hlsErr = hlsCtor.ErrorTypes || {};
                var inst = vvTrackHls(new hlsCtor(vvHlsConfig()));
                VV.active.hls = inst;
                // 清单/子清单阶段也是"请求在飞"：弱网下主清单跳两级子清单能磨十几秒，
                // 这段时间 fMP4/TS 一个分片都还没开始下，只有 FRAG_* 事件时看门狗等于瞎的。
                // 这里补上 MANIFEST_* / LEVEL_* 的在飞标记，并算作"有数据到账"。
                var manifBusy = ['MANIFEST_LOADING', 'LEVEL_LOADING', 'AUDIO_TRACK_LOADING'];
                var manifDone = ['MANIFEST_LOADED', 'LEVEL_LOADED', 'AUDIO_TRACK_LOADED'];
                manifBusy.forEach(function (en) {
                    if (!hlsEv[en]) return;
                    inst.on(hlsEv[en], function () {
                        try { if (VV.active) VV.active._manifLoadingSince = Date.now(); } catch (eMn0) {}
                    });
                });
                manifDone.forEach(function (en) {
                    if (!hlsEv[en]) return;
                    inst.on(hlsEv[en], function () {
                        try {
                            if (VV.active) {
                                VV.active._manifLoadingSince = 0;
                                VV.active._netAt = Date.now();
                            }
                        } catch (eMn1) {}
                    });
                });
                ['MANIFEST_LOAD_ERROR', 'MANIFEST_LOAD_TIMEOUT', 'LEVEL_LOAD_ERROR', 'LEVEL_LOAD_TIMEOUT'].forEach(function (en) {
                    if (!hlsEv[en]) return;
                    inst.on(hlsEv[en], function () {
                        try { if (VV.active) VV.active._manifLoadingSince = 0; } catch (eMn2) {}
                    });
                });
                if (hlsEv.MANIFEST_PARSED) inst.on(hlsEv.MANIFEST_PARSED, function () {
                    try {
                        VV.active._netFail = 0;
                        VV.active._hlsRetried = false;
                        var ls = inst.levels || [];
                        if (ls.length > 1) vvBuildQualityMenu(ls, inst);
                        // 画质红线：解码器重试过也不设 autoLevelCapping，
                        // 让 ABR 按带宽自己选档；要降档由用户在画质菜单手动选。
                        var ats = inst.audioTracks || [];
                        VV.active.hlsInst = inst;
                        VV.active.audioTracks = ats;
                        if (ats.length > 1) {
                            VV.active.audioIndex = typeof inst.audioTrack === 'number' ? inst.audioTrack : 0;
                            vvUpdateSpeedChip();
                        }
                    } catch (eQ) {}
                });
                if (hlsEv.LEVEL_SWITCHED) inst.on(hlsEv.LEVEL_SWITCHED, function (eL, dataL) {
                    try {
                        var lv = inst.levels && inst.levels[dataL.level];
                        if (lv && lv.height) {
                            VV.active.qAutoHeight = lv.height;
                            vvUpdateSpeedChip();
                        }
                    } catch (eLS) {}
                });
                if (hlsEv.FRAG_LOADING) inst.on(hlsEv.FRAG_LOADING, function () {
                    try { if (VV.active) VV.active._fragLoadingSince = Date.now(); } catch (eFL0) {}
                });
                if (hlsEv.FRAG_LOADED) inst.on(hlsEv.FRAG_LOADED, function (eF, dataF) {
                    try {
                        if (VV.active) {
                            VV.active._fragLoadingSince = 0;
                            // 记录"最近一次真的拿到分片"的时刻：起播看门狗用它区分
                            // 「网络慢但数据在走」和「流根本没动静」
                            VV.active._fragLoadedAt = Date.now();
                            VV.active._netAt = Date.now();
                            VV.active._netFail = 0;
                            VV.active._mediaFail = 0;
                            VV.active._hlsRetried = false;
                            var st = dataF && dataF.frag && dataF.frag.stats;
                            if (st && st.loading && st.loading.start && st.loading.end) {
                                VV.active._fragMs = Math.max(0, Math.round(st.loading.end - st.loading.start));
                                VV.active._fragBytes = st.loaded || (st.loading && st.loading.bytes) || 0;
                                VV.active._fragMsSum = (VV.active._fragMsSum || 0) + VV.active._fragMs;
                                VV.active._fragBytesSum = (VV.active._fragBytesSum || 0) + VV.active._fragBytes;
                                VV.active._fragLoads = VV.active._fragLoads || [];
                                VV.active._fragLoads.push(VV.active._fragMs);
                                if (VV.active._fragLoads.length > 8) VV.active._fragLoads.shift();
                            }
                            vvUpdateLoadProgress();
                        }
                    } catch (eFL) {}
                });
                // 分片失败/超时后要清掉“正在加载”标记，watchdog 才能重试
                ['FRAG_LOAD_ERROR', 'FRAG_LOAD_TIMEOUT', 'FRAG_LOAD_EMERGENCY_ABORTED'].forEach(function (en) {
                    if (hlsEv[en]) inst.on(hlsEv[en], function () {
                        try { if (VV.active) VV.active._fragLoadingSince = 0; } catch (eFL2) {}
                    });
                });
                if (hlsEv.ERROR) inst.on(hlsEv.ERROR, function (eType, data) {
                    if (!data) return;
                    // 留一份现场：真机上"能加载但播不了"到底是网络、鉴权还是解码器，
                    // 只看界面是分不出来的，自检面板要靠这条判断。
                    try {
                        VV._lastHlsErr = {
                            type: data.type || '', details: data.details || '',
                            fatal: !!data.fatal,
                            code: (data.response && data.response.code) || 0,
                            at: Date.now()
                        };
                    } catch (eLE) {}
                    try {
                        if (!data.fatal) {
                            // 记录最近一次 HTTP 状态，供失败卡片判断"是 403 还是网络问题"
                            try {
                                if (data.response && data.response.code && VV.active) {
                                    VV.active._lastHttpCode = data.response.code;
                                }
                            } catch (eC0) {}
                            // 只在完全没有画面数据时轻推一下；seek 过程中不要反复 startLoad 打断分片加载
                            if (data.details === 'bufferStalledError' && VID && VID.readyState < 2) vvHlsNudge(inst);
                            return;
                        }
                        // 403 基本等于"这个地址不给第三方便用"（一次性 token / 防盗链），
                        // 重试再多次也不会好，直接给失败卡片，别让用户对着黑屏等
                        var hc = 0;
                        try { hc = (data.response && data.response.code) || 0; } catch (eC1) {}
                        if (hc === 403 || hc === 401) {
                            try { if (VV.active) VV.active._lastHttpCode = hc; } catch (eC2) {}
                            vvShowErr('源站返回 HTTP ' + hc + '，拒绝第三方播放。这类站点的播放地址常是一次性鉴权的，被页面播放器用掉后无法复用。可以点「外部播放器」试试，或直接在页面里播放。', '这个视频源播不了');
                            try { inst.stopLoad(); } catch (eC3) {}
                            return;
                        }
                        var pos = Math.max(0, (VID && VID.currentTime) || 0);
                        if (data.type === hlsErr.NETWORK_ERROR) {
                            VV.active._netFail = (VV.active._netFail || 0) + 1;
                            // 自动模式下 hls.js 连续拉流失败（常见于 CORS/防盗链）时尝试系统原生 HLS
                            if (VV.cfg.hlsEngine === 'auto' && VV.active._netFail >= 3 && !VV.active._nativeTried && vvCanNativeHls()) {
                                VV.active._nativeTried = true;
                                try { inst.destroy(); } catch (eND) {}
                                VV.active.hls = null;
                                VV.active._inst = null;
                                vvToast('hls.js 拉流失败，改用系统 HLS', true);
                                var natT = pos;
                                vvAttachDirect(url, false);
                                var onNatMeta = function () {
                                    try { VID.removeEventListener('loadedmetadata', onNatMeta); } catch (eNM) {}
                                    try { if (natT > 0.5) VID.currentTime = natT; } catch (eNS) {}
                                };
                                try { VID.addEventListener('loadedmetadata', onNatMeta); } catch (eNA) {}
                                return;
                            }
                            if (VV.active._netFail <= 6) {
                                vvToast('m3u8 网络断流，第 ' + VV.active._netFail + ' 次重连…');
                                setTimeout(function () {
                                    try {
                                        // 主清单/子清单失败时只 startLoad 往往无效，需要重新 loadSource
                                        var needManifest = /manifest|level/i.test(data.details || '') || !inst.levels || !inst.levels.length;
                                        if (needManifest) inst.loadSource(url);
                                        inst.startLoad(pos);
                                    } catch (eN) {}
                                }, 1000 * Math.min(4, VV.active._netFail));
                            } else {
                                vvHideLoading();
                                vvToast('m3u8 多次重连失败，试试下载或换线路', true);
                            }
                        } else if (data.type === hlsErr.MEDIA_ERROR) {
                            VV.active._mediaFail = (VV.active._mediaFail || 0) + 1;
                            // "分片下载正常、就是不出画"在 hls.js 里几乎都落到这里：
                            // addSourceBuffer / appendBuffer 拿不到解码器。
                            // 原地 recoverMediaError 救不了这种情况，第二次就直接让位 + 重建。
                            if (VV.active._mediaFail >= 2 && vvCodecRescue('media')) return;
                            if (VV.active._mediaFail <= 3) {
                                vvToast('解码异常，正在恢复…');
                                setTimeout(function () {
                                    try {
                                        if (VV.active._mediaFail === 2 && inst.swapAudioCodec) inst.swapAudioCodec();
                                        inst.recoverMediaError();
                                    } catch (eM) {}
                                }, 400);
                            } else {
                                vvToast('解码持续失败：可能同时打开的 m3u8 页面太多，关掉其他页面后用「重建播放实例」', true);
                            }
                        } else {
                            if (!VV.active._hlsRetried) {
                                VV.active._hlsRetried = true;
                                vvToast('m3u8 加载失败，重新拉流中…');
                                setTimeout(function () {
                                    try {
                                        inst.loadSource(url);
                                        inst.startLoad(pos);
                                    } catch (eR) {}
                                }, 1000);
                            } else {
                                vvHideLoading();
                                vvToast('m3u8 无法播放，可复制链接换播放器', true);
                            }
                        }
                    } catch (eErr) {}
                });
                inst.attachMedia(VID);
                inst.loadSource(url);
                VV.active._inst = inst;
                // 立即在用户手势内调用 play，避免 hls.js 等待播放才拉流、以及自动播放被拦截
                VID.play().catch(function () {
                    try { inst.startLoad(); } catch (eP2) {}
                });
            } catch (e2) {
                vvAttachDirect(url, false);
                vvToast('m3u8 初始化失败，尝试原生播放', true);
            }
        });
        return;
    }
    vvAttachDirect(url, item.type === 'BLOB');
}

function vvAttachDirect(url, isBlob) {
    try {
        VID.src = url;
        VID.load();
        VID.play().catch(function () {
            if (isBlob) vvToast('原生流可能已失效，建议退回网页内播放', true);
        });
    } catch (e1) {
        vvToast('播放失败');
    }
}

// —— hls 实例池 ——
// 每个 new 出来的 Hls 都登记在这里，destroy 时自动出池。关闭播放器时再统一清一次池，
// 这样无论哪条分支（换源、失败重试、连续起播）漏掉了 destroy，都不会把实例和它背后的
// Worker / SourceBuffer / MediaCodec 留在页面里——Android WebView 上这类残留正是
// "退出播放器后要过一会、甚至关了页签才恢复正常"的元凶。
function vvTrackHls(inst) {
    try {
        if (!inst) return inst;
        if (!VV._hlsPool) VV._hlsPool = [];
        VV._hlsPool.push(inst);
        var rawDestroy = inst.destroy;
        inst.destroy = function () {
            try {
                var arr = VV._hlsPool || [];
                var i = arr.indexOf(inst);
                if (i >= 0) arr.splice(i, 1);
                VV._killCount = (VV._killCount || 0) + 1;
            } catch (e0) {}
            try { if (typeof rawDestroy === 'function') return rawDestroy.call(inst); } catch (e1) {}
        };
    } catch (e) {}
    return inst;
}

function vvKillAllHls() {
    var pool = (VV._hlsPool || []).slice();
    VV._hlsPool = [];
    for (var i = 0; i < pool.length; i++) {
        var inst = pool[i];
        try { if (inst && typeof inst.stopLoad === 'function') inst.stopLoad(); } catch (e1) {}
        try { if (inst && typeof inst.detachMedia === 'function') inst.detachMedia(); } catch (e2) {}
        try { if (inst && typeof inst.destroy === 'function') inst.destroy(); } catch (e3) {}
    }
}

// 硬释放一个 video 元素占着的解码器。
//
// Android WebView 上 pause() 只是停播，MediaCodec 仍然被 media 进程持有；
// 真正让它 release 的只有「把元素回退到没有资源的状态」这一条路径：
//   pause → 断 srcObject → 摘 src → 清 <source> → load()
// 顺序不能换：先 load() 再摘 src 等于让 WebView 重新挂一次空资源。
// 而且这一步必须在元素还留在文档里时做，元素脱离 DOM 之后再 load() 多半是空操作。
function vvHardReleaseVideo(v) {
    if (!v) return;
    var wasSrc = '';
    try { wasSrc = v.currentSrc || v.src || ''; } catch (e0) {}
    // 先把用户原本的音量/静音记下来，再往里写"静音 + 音量 0"。
    // 释放时静音是必要的（pause 在某些机型上有延迟，残余音频会漏出来），
    // 但这是**临时状态**：重建播放实例时必须还原，否则画面在播、一点声音没有。
    // 只记一次：重建过程中可能连着释放好几轮，第一轮记的才是用户真正设的值。
    try { if (v.__vvMuted === undefined) v.__vvMuted = (v.muted === true); } catch (eM0) {}
    try { if (v.__vvVol === undefined) v.__vvVol = (typeof v.volume === 'number' ? v.volume : 1); } catch (eV0) {}
    try { v.pause(); } catch (e1) {}
    // 释放后万一还有残余音频，静音能立刻止住（pause 在某些机型上有延迟）
    try {
        v.__vvUsMuted = true;
        v.muted = true;
        VV._muteBy = 'hard';
        VV._muteCount = (VV._muteCount || 0) + 1;
    } catch (e2) {}
    try { v.volume = 0; } catch (e3) {}
    try { v.srcObject = null; } catch (e4) {}
    try { v.removeAttribute('src'); } catch (e5) {}
    try { while (v.firstChild) v.removeChild(v.firstChild); } catch (e6) {}
    // load() 走一遍"空资源"加载算法，WebView 在这里 teardown 解码器
    try { v.load(); } catch (e7) {}
    // 兜底 revoke：hls.js 正常会自己撤销它创建的 blob，但 detachMedia 与 destroy
    // 的先后顺序一变就可能漏掉，漏掉的 blob 会连带 MediaSource 一起挂在内存里
    try {
        if (wasSrc && wasSrc.indexOf('blob:') === 0) URL.revokeObjectURL(wasSrc);
    } catch (e8) {}
}

// 把 vvHardReleaseVideo / vvDetachMedia 为省资源临时压掉的音量还原回去。
// 没有这一步，用户看到的现象就是"视频在播但没声音"——而且每次从后台切回来都会中一次。
function vvRestoreAudio(v) {
    if (!v) return false;
    if (v.__vvMuted === undefined) return false;
    try { VV._muteBy = 'restore'; VV._restoreCount = (VV._restoreCount || 0) + 1; } catch (eMk) {}
    try {
        // 静音照原样还原：用户本来就是静音看的，不能擅自开声音
        v.muted = (v.__vvMuted === true);
        try { VV._userMuted = (v.__vvMuted === true); } catch (eUM) {}
        // 音量无条件还原：硬释放会把它压成 0，而"静音 + 音量 0"是两个开关，
        // 只还原静音的话，用户后面一取消静音仍然是 0，看起来还是没声音。
        var vol = (typeof v.__vvVol === 'number' && v.__vvVol > 0) ? v.__vvVol : 1;
        if (!v.volume) v.volume = vol;
    } catch (e0) {}
    try { delete v.__vvMuted; delete v.__vvVol; } catch (e1) {}
    return true;
}

function vvKillMedia() {
    vvDisarmStartWatchdog();
    try { vvDisarmFrameWatch(); } catch (eFW) {}
    var act = VV.active;
    var inst = act && act.hls;
    // 先把引用断掉：destroy 抛错时也不会留下一个"看起来还在"的悬挂实例，
    // 下次 openPlayer 就不会误判成"已有实例可复用"。
    if (act) {
        act.hls = null;
        act._inst = null;
        try { clearTimeout(act._seekModeTimer); } catch (eSM2) {}
        act._seekModeTimer = 0;
    }
    if (inst) {
        // stopLoad 先停掉还在飞的分片请求，detachMedia 断开 MSE，最后 destroy 释放 Worker。
        // 三步都是同步返回，但 destroy 内部的 transmuxer 清理是排到微任务之后的，
        // 所以后面给 video 的硬释放要留出一点时间，不能同一个 tick 全干完。
        try { if (typeof inst.stopLoad === 'function') inst.stopLoad(); } catch (e0) {}
        try { if (typeof inst.detachMedia === 'function') inst.detachMedia(); } catch (e1) {}
        try { inst.destroy(); } catch (e2) {}
    }
    vvHardReleaseVideo(VID);
}

function vvLoadHls(cb) {
    var own = vvPickHlsCtor();
    if (own) {
        cb(true, own);
        return;
    }
    var urls = VV_HLS_URLS;
    var idx = 0;
    function tryNext() {
        if (idx < urls.length) {
            var s = document.createElement('script');
            s.src = urls[idx++];
            s.onload = function () {
                var got = vvPickHlsCtor();
                if (got) {
                    try { window.__vvHlsCtor = got; } catch (eS) {}
                    cb(true, got);
                } else {
                    tryNext();
                }
            };
            s.onerror = function () { try { s.parentNode.removeChild(s); } catch (e) {} tryNext(); };
            try { document.documentElement.appendChild(s); } catch (e) { cb(false); }
            return;
        }
        if (typeof GM_xmlhttpRequest === 'function') {
            try {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: urls[0],
                    onload: function (r) {
                        try {
                            if (r && r.status >= 200 && r.status < 400 && r.responseText && r.responseText.length > 1000) {
                                (0, eval)(r.responseText);
                                var got = vvPickHlsCtor();
                                if (got) {
                                    try { window.__vvHlsCtor = got; } catch (eS2) {}
                                    cb(true, got);
                                    return;
                                }
                                cb(false);
                            } else cb(false);
                        } catch (e) { cb(false); }
                    },
                    onerror: function () { cb(false); },
                    ontimeout: function () { cb(false); },
                    timeout: 15000
                });
                return;
            } catch (eG) {}
        }
        cb(false);
    }
    tryNext();
}

// 该不该续播、续到哪儿。
// 关键一条：上次已经看到结尾附近就不要再跳过去——跳过去会立刻 ended，1.6s 后播放器
// 自己关掉，用户看到的是「点开闪一下就没」，很容易被当成播放器坏了。
// 短片（<60s）按剩余 10%（至少 3s）判，长片固定留 15s。
function vvResumeTarget(d, duration) {
    var dur = (duration && isFinite(duration)) ? duration : 0;
    var maxT = dur ? Math.max(0, dur - 0.1) : 0;
    var t = (d && d.t > 5) ? (maxT ? Math.min(d.t, maxT) : d.t) : 0;
    if (t && dur) {
        var tail = dur < 60 ? Math.max(3, dur * 0.1) : 15;
        if (dur - t <= tail) t = 0;
    }
    return t;
}

function vvBindVideo() {
    VID.addEventListener('loadedmetadata', function () {
        try {
            if (VV.active) VV.active._netAt = Date.now();
            var d = VV.active && VV.active.resumeInfo;
            var dur = (VID.duration && isFinite(VID.duration)) ? VID.duration : 0;
            var maxT = dur ? Math.max(0, dur - 0.1) : 0;
            var resumeT = vvResumeTarget(d, dur);
            if (resumeT > 5 && Math.abs(VID.currentTime - resumeT) > 3) {
                VID.currentTime = resumeT;
                // HLS 续播时让 hls.js 直接从目标位置拉流，避免只 seek 不加载而卡住
                try { if (VV.active.hls) VV.active.hls.startLoad(resumeT); } catch (eH) {}
                vvToast('已回到上次位置 ' + vvFmtTime(resumeT));
            }
            if (VV.active.skipS > 2 && VID.currentTime < VV.active.skipS) {
                var skipT = maxT ? Math.min(VV.active.skipS, maxT) : VV.active.skipS;
                VID.currentTime = skipT;
                try { if (VV.active.hls) VV.active.hls.startLoad(skipT); } catch (eS) {}
                vvToast('已跳过片头');
            }
            try { if (DUREL) DUREL.textContent = vvFmtTime(VID.duration); } catch (eD) {}
            try { VID.playbackRate = VV.active.speed || 1; } catch (eR) {}
            VID.play().catch(function () {});
        } catch (e) {}
    });
    VID.addEventListener('timeupdate', vvOnTime);
    // mp4/直链：progress 事件给出已下载字节与总字节 → 真实百分比 + 下载速度
    VID.addEventListener('progress', function (e) {
        try {
            if (!VV.active) return;
            var prevLoaded = VV.active._loaded || 0;
            if (e && e.lengthComputable && e.total > 0) {
                VV.active._total = e.total;
                VV.active._loaded = e.loaded;
                vvTrackSpeed(e.loaded);
            } else if (e && e.loaded > 0) {
                VV.active._loaded = e.loaded;
                vvTrackSpeed(e.loaded);
            }
            // 字节在涨 = 强证据：起播看门狗据此续命。
            // 直连 mp4 没有 hls 的分片事件，这个标记是它唯一的"还在下"信号。
            if ((VV.active._loaded || 0) > prevLoaded) VV.active._netAt = Date.now();
            vvUpdateLoadProgress();
        } catch (eP) {}
    });
    // 缓冲/下载中定时刷新进度（HLS 缓冲深度变化没有 progress 事件）
    VID.addEventListener('durationchange', function () { try { vvUpdateLoadProgress(); } catch (eD2) {} });
    VID.addEventListener('seeking', function () {
        if (!VV.active) return;
        VV.active._seekSince = Date.now();
        VV.active._seekFallback = 0;
        // 跳转期间放宽分片超时：慢 CDN 的首字节可能要 20s+，
        // 用 10s 会在中途 abort，跳转永远成功不了。
        vvHlsSetSeekMode(VV.active.hls, true);
        try { clearTimeout(VV.active._seekModeTimer); } catch (eS0) {}
        // 兜底：万一 playing 一直没触发，90s 后回到快速失败模式，避免长期挂在慢分片上
        VV.active._seekModeTimer = setTimeout(function () {
            VV.active._seekModeTimer = 0;
            vvHlsSetSeekMode(VV.active && VV.active.hls, false);
        }, 90000);
    });
    VID.addEventListener('seeked', function () {
        if (!VV.active) return;
        VV.active._seekSince = 0;
        VV.active._seekFallback = 0;
    });
    VID.addEventListener('pause', function () { vvUpdatePlayUI(); vvSaveNow(); });
    VID.addEventListener('play', function () { vvUpdatePlayUI(); });
    VID.addEventListener('playing', function () {
        if (VV.active && VV.active._waitStart) {
            VV.active._waitMs = (VV.active._waitMs || 0) + (Date.now() - VV.active._waitStart);
            VV.active._waitStart = 0;
        }
        // 已经有画面了：起播看门狗收工，错误卡片也收起
        if (VV.active) VV.active._sawFrame = true;
        vvDisarmStartWatchdog();
        vvHideErr();
        // 缓冲已经接上，恢复正常播放的短超时，让后续慢分片能触发降档
        try { clearTimeout(VV.active && VV.active._seekModeTimer); } catch (eS1) {}
        if (VV.active) VV.active._seekModeTimer = 0;
        vvHlsSetSeekMode(VV.active && VV.active.hls, false);
        if (VV.active) VV.active._buffering = false;
        vvHideLoading();
    });
    VID.addEventListener('canplay', function () {
        try {
            // 明确在缓冲中时不要被 canplay 提前收掉（canplay 在起播瞬间就会触发）
            if (VV.active && VV.active._buffering) return;
            vvHideLoading();
        } catch (e) {}
    });
    VID.addEventListener('waiting', function () {
        if (VV.active) {
            VV.active._waitCount = (VV.active._waitCount || 0) + 1;
            if (!VV.active._waitStart) VV.active._waitStart = Date.now();
            VV.active._buffering = true;
            vvShowLoading('缓冲中…');
        }
    });
    VID.addEventListener('ended', vvOnEnded);
    VID.addEventListener('error', function () {
        vvHideLoading();
        if (!VID) return;
        var act = VV.active;
        // 系统原生 HLS 失败时回退 hls.js（只尝试一次，避免来回切换）
        if (act && act.item && act.item.type === 'HLS' && act._nativeTried && !act.hls && !act._nativeFailed && vvHasMseHls()) {
            act._nativeFailed = true;
            vvToast('系统 HLS 播放失败，改用 hls.js', true);
            vvLoadMedia(act.item);
            return;
        }
        if (VID.src && VID.src.indexOf('m3u8') < 0) {
            var code = VID.error && VID.error.code;
            var msg = (VID.error && VID.error.message) || '';
            // 用 _blobOnly 判断"这是页面自己的 MSE 句柄"，不能看 src 是不是 blob：
            // 我们自己的 hls.js 也是走 blob 的，按 src 判会把正常播放误报成"页面私有流"。
            if (act && act._blobOnly) {
                vvShowErr('这条是页面自己 MSE 会话的句柄（blob），只能留在原页面播放器里用，独立播放器拿不到数据。', '这个视频源播不了');
            } else if (code === 3 || (code === 4 && act && act.hls)) {
                // MSE 管线已经建起来却解码失败：这是"拿不到解码器"，不是地址问题。
                // 先说清原因，再自救一次（降到最低档 + 让别的页签让出解码器）。
                if (vvCodecRescue('media-error')) return;
                vvShowErr('解码失败：设备没有空闲的硬件解码器（同时打开的视频页签太多），或这个编码本机不支持。\n关掉几个视频页签后再点播放。', '解码器不够用');
            } else if (code === 4) {
                vvShowErr('地址打不开（可能已过期、需要 Referer/Cookie，或是防盗链限制）。可以点「外部播放器」再试，或用页面自带的播放器。', '这个视频源播不了');
            } else {
                vvToast('视频加载失败' + (msg ? '：' + msg.slice(0, 40) : '，可能需要防盗链或已失效'), true);
            }
        }
    });
    // 只挂一次：这段在每次 openPlayer 都会执行（ROOT 每次关闭都会被回收），
    // 不加保护就会每开一次播放器多一个 document 级监听，久用之后回调越堆越多。
    if (!VV._visBound) {
        VV._visBound = true;
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                vvFlushLazy();
                vvSaveNow();
            }
        });
    }
}

// 直播判定：不能只看 duration。hls.js 对直播给出的 duration 是"当前窗口长度"（十几秒到几分钟），
// 是有限值，按 isFinite 判会当点播；真正可靠的是它解析出的 level details.live。
// 原生 HLS（Android WebView 常见）没有 details，只能靠 duration === Infinity 兜底。
function vvIsLive() {
    try {
        if (!VID) return false;
        var inst = VV.active && VV.active.hls;
        if (inst && inst.levels && inst.levels.length) {
            var anyKnown = false;
            for (var i = 0; i < inst.levels.length; i++) {
                var dt = inst.levels[i] && inst.levels[i].details;
                if (dt && typeof dt.live === 'boolean') {
                    anyKnown = true;
                    if (dt.live) return true;
                }
            }
            if (anyKnown) return false;
        }
        return VID.duration === Infinity;
    } catch (e) {
        return false;
    }
}

function vvOnTime() {
    if (!VV.active) return;
    try {
        var cur = VID.currentTime;
        var dur = VID.duration || 0;
        // 直播：没有总长概念，进度条按比例算会一直是 0% 或 100% 乱跳，
        // 直接把进度条整条点亮 + 时长位写「直播」，并且禁掉拖动/横滑快进（见 31-player-x.js）。
        var live = vvIsLive();
        // 文案按秒变化，缓存后同秒内的重复 timeupdate 不再重建文本节点
        vvSetCurTime(cur);
        if (live) {
            // 仍要每次校正：hls.js 拿到直播窗口后会把 duration 从 Infinity 变成有限值，
            // 那次 durationchange 会带着 loadedmetadata 再写一遍时长位，只写一次会被覆盖回去。
            // 但只在文案真的不同时才动 DOM，元素引用也不再每轮查一次。
            try { if (DUREL && DUREL.textContent !== '直播') DUREL.textContent = '直播'; } catch (eDL) {}
            if (VV.active._durTxt !== '直播') {
                VV.active._durTxt = '直播';
                // 直播没有"下一集"，把连播按钮收起来（页面里常能嗅到一堆频道链接，会被误判成剧集）
                try {
                    var nb = document.getElementById('vv-next-btn');
                    if (nb) nb.style.display = 'none';
                } catch (eNB1) {}
            }
            vvSetBarPct(CSCUR, 'width', 100);
            vvSetBarPct(CSPROGDOT, 'left', 100);
            vvSetBarPct(CSBUF, 'width', 100);
        } else if (dur > 0 && CSCUR && !(typeof vvG === 'object' && vvG && vvG.progDrag)) {
            var pct = Math.min(100, (cur / dur) * 100);
            vvSetBarPct(CSCUR, 'width', pct);
            vvSetBarPct(CSPROGDOT, 'left', pct);
        }
        try {
            if (VID.buffered && VID.buffered.length > 0 && dur > 0 && !live) {
                var bEnd = VID.buffered.end(VID.buffered.length - 1);
                vvSetBarPct(CSBUF, 'width', Math.min(100, (bEnd / dur) * 100));
            }
        } catch (eB) {}
        var now = Date.now();
        if (VV.active._lastT !== cur) {
            VV.active._lastT = cur;
            VV.active._lastAdv = now;
            // 记录最近一个已经正常播放的位置，seek 失败时回到这里而不是粗暴地回到 0
            if (VID.readyState >= 2 && !VID.seeking) {
                VV.active._lastGoodT = cur;
                // 时间在走 = 已经有画面，起播看门狗可以收工
                if (!VV.active._sawFrame) {
                    VV.active._sawFrame = true;
                    vvDisarmStartWatchdog();
                    vvHideErr();
                }
            }
        }
        if (now - VV.active.lastSave > 10000 && (VID.paused === false)) {
            vvSaveNow();
        }
        // 断流恢复/续播跳转后，只要画面已经能正常推进，就收起"缓冲中"提示。
        // 判定用 readyState >= 3（HAVE_FUTURE_DATA）：只有 >= 2 时数据可能马上又断，
        // 会导致加载提示一闪一闪。
        // 如果明确处于 buffering 状态（waiting 触发），至少要撑过 1.5s，
        // 否则真实播放流里紧随其后的 playing/seeked 会把提示秒关掉，看不到进度。
        if (LOADING && LOADING.classList.contains('on')) {
            var buffering = !!(VV.active && VV.active._buffering);
            if (buffering) {
                var waited = VV.active._waitStart ? (now - VV.active._waitStart) : 0;
                // 兜底：waiting 之后数据其实已经就绪（部分设备不发 playing）→ 视为已恢复
                if (waited > 1500 && VID.readyState >= 3 && !VID.seeking) {
                    VV.active._buffering = false;
                    buffering = false;
                }
            }
            if (!buffering && VID.readyState >= 3 && !VID.seeking) vvHideLoading();
        }
        if (VV.active.skipE > 2 && dur > 0 && cur >= dur - VV.active.skipE && !VID.ended) {
            vvOnEnded();
        }
    } catch (e) {}
}

function vvSaveNow() {
    if (!VV.active || !VID) return;
    try {
        var t = VID.currentTime;
        var d = VID.duration || 0;
        if (!t || t < 4) return;
        // 已经播完的不记位置：ended 时 vvOnEnded 把记录清零了，但紧接着的 pause/close
        // 又会把结尾位置写回去，下次打开就变成「跳结尾 → 立刻结束 → 自己关掉」。
        try { if (VID.ended) return; } catch (eE) {}
        // 直播没有可续播的位置，记下来只会让下次进同一频道时莫名其妙跳到某处
        if (!isFinite(d) || vvIsLive()) return;
        var m = vvGetProgressMap();
        m[VV.active.key] = { t: t, d: d, s: VV.active.skipS, e: VV.active.skipE, u: Date.now() };
        vvSaveProgressMap(m);
        VV.active.lastSave = Date.now();
    } catch (e) {}
}

function vvUpdatePlayUI() {
    var paused = true;
    try { paused = VID.paused; } catch (e) {}
    try {
        var label = paused ? '播放' : '暂停';
        CSPLAY.innerHTML = vvIcon(paused ? 'play' : 'pause', 22);
        CBTN.innerHTML = vvIcon(paused ? 'play' : 'pause', 30);
        CSPLAY.setAttribute('aria-label', label);
        CBTN.setAttribute('aria-label', label);
        // 播放三角在圆里视觉上偏右，暂停双竖条则不需要偏移
        if (paused) CBTN.classList.remove('pause'); else CBTN.classList.add('pause');
    } catch (e2) {}
}

function vvTogglePlay() {
    try {
        if (VID.paused) VID.play().catch(function () {}); else VID.pause();
    } catch (e) {}
    vvShowCS();
}

function vvShowCS() {
    try {
        // 小窗里控制栏整组隐藏，别再给它挂自动收起计时
        if (VV._mini) return;
        ROOT.classList.add('cs-on');
        clearTimeout(ROOT._csTimer);
        ROOT._csTimer = 0;
        // 底部菜单 / 选集浮层开着时不启动自动收起：用户正在菜单里挑选项，
        // 3 秒后把顶/底栏抽走会让人以为"菜单自己没了"，还得再点一次才回来。
        var sht = document.getElementById('vv-sheet');
        if (sht && sht.classList.contains('open')) return;
        if (ROOT.classList.contains('ep-open')) return;
        ROOT._csTimer = setTimeout(function () {
            // 播放器可能已经关闭（ROOT / VID 被置空），延迟回调不能再碰它们
            try { if (ROOT && VID && !VID.paused) ROOT.classList.remove('cs-on'); } catch (e) {}
        }, VV.cfg.autoHide);
    } catch (e) {}
}

function vvHideCS() {
    try { ROOT.classList.remove('cs-on'); } catch (e) {}
}

function closePlayer() {
    // 每一步独立 try：任何一步抛错都不能影响后面的清理，
    // 否则页面会被"冻住"（overflow:hidden + 全屏播放器层），看起来像整个浏览器坏了。
    try { vvFlushLazy(); } catch (e1) {}
    try { vvSaveNow(); } catch (e2) {}
    try { vvStopWatchdog(); } catch (e3) {}
    try { vvStopPlayerTop(); } catch (e4) {}
    try { vvLeaseStop(); } catch (e5) {}
    try { vvKillMedia(); } catch (e6) {}
    // 兜底：任何分支漏掉 destroy 的实例，在这里统一收掉（含 Worker 与 SourceBuffer）
    try { vvKillAllHls(); } catch (e6b) {}
    try { if (vvG.progDrag) { vvG.progDrag = false; vvG.mode = 'none'; vvG.gtgt = null; } } catch (eG) {}
    VV.playerActive = false;
    VV.active = null;
    // 小窗状态跟着播放器一起退场，否则下次开播放器还带着 .mini 的残留尺寸
    VV._mini = false;
    MINIDRAG = null;
    // 选集浮层是挂在 <html> 上的独立层，播放器退场时别把它落单留在页面上
    try { if (VV._epOpen) vvEpisodesClose(); } catch (eEp) {}
    // 播放器退场后，若「网页铺满」仍开着就把网页那层恢复回来
    try { vvPageFsSync(); } catch (ePF) {}
    try { vvSetPageFreeze(false); } catch (ef) {}
    // 如果页面视频在进播放器前被"后台休眠"摘过 src，这里必须装回去，
    // 否则退出播放器后它就是个没有地址的空壳，只能靠关页签恢复。
    try { if (typeof vvThawMedia === 'function') vvThawMedia(); } catch (et) {}
    // 预载守卫必须在恢复页面媒体之前收工，否则刚还回去的 preload 又被按住
    try { vvStopPreloadGuard(); } catch (epg) {}
    try { vvRestorePagePreload(); } catch (epr) {}
    try { if (typeof vvApRestorePreload === 'function') vvApRestorePreload(true); } catch (epr0) {}
    try { vvResumePageMedia(); } catch (er) {}
    try {
        if (document.fullscreenElement) document.exitFullscreen();
    } catch (ex) {}
    var deadVideo = VID;
    var deadRoot = ROOT;
    // 注意顺序：这里【不能】先把 ROOT 摘掉。
    // Android WebView 的 media 进程只有在 video 仍挂在文档里、并且走完一次
    // 「无资源」的 load() 之后，才会真正 release MediaCodec。先摘 DOM 再 load()
    // 在真机上基本是空操作，解码器会一直占着，直到整页销毁（关页签）为止。
    try { if (deadRoot) deadRoot.style.display = 'none'; } catch (eHide) {}
    setTimeout(function () {
        try { vvHardReleaseVideo(deadVideo); } catch (eR1) {}
        try { if (deadRoot && deadRoot.parentNode) deadRoot.parentNode.removeChild(deadRoot); } catch (eR2) {}
    }, 80);
    // 二次巡检：hls destroy 内部的 transmuxer 清理排在微任务之后，个别机型上
    // 元素摘除的回收也是延迟的。这里再兜一次，池里还有实例就说明有分支漏了 destroy。
    setTimeout(function () {
        // 期间用户可能已经重新打开了播放器，此时池里装的是新实例，不能连坐杀掉
        if (!VV.playerActive) {
            try { if ((VV._hlsPool || []).length) vvKillAllHls(); } catch (eR3) {}
        }
        try { vvHardReleaseVideo(deadVideo); } catch (eR4) {}
        // 留一份关闭后 0.9s 的快照，真机上点「资源释放自检」就能看到它
        try {
            VV._lastAudit = {
                ts: Date.now(),
                pool: (VV._hlsPool || []).length,
                videos: document.querySelectorAll('video').length,
                root: !!document.getElementById('vv-player-root')
            };
        } catch (eR5) {}
        try { deadVideo = null; deadRoot = null; } catch (eR6) {}
    }, 900);
    // 关播放器时把自动收起计时也清掉：ROOT 马上要置空，留着它只会在 4.5s 后抛空指针
    try { if (ROOT && ROOT._csTimer) { clearTimeout(ROOT._csTimer); ROOT._csTimer = 0; } } catch (eCs) {}
    ROOT = null; VID = null; BRIGHT = null; TOPBAR = null; BOTBAR = null; CBTN = null;
    MINIBAR = null;
    CSPLAY = null; CSTIME = null; CSPROG = null; CSBUF = null; CSCUR = null; CSPROGDOT = null;
    LOCKMARK = null; SEEKTIP = null; GESTIP = null; LOADING = null; LOADBAR = null; LOADFILL = null;
    ERRBOX = null; DUREL = null; LAST_CUR_TXT = '';
    vvStopLoadTick();
    if (VV.items.length) vvToggleBadge(true);
}

function vvToggleLock() {
    if (!VV.active) return;
    VV.active.locked = !VV.active.locked;
    var on = VV.active.locked;
    ROOT.classList.toggle('locked', on);
    // 两处锁图标必须来自同一个状态源：以前底栏 🔒 与浮动 🔓 各写各的，语义还相反
    LOCKMARK.innerHTML = vvIcon(on ? 'unlock' : 'lock', 18);
    LOCKMARK.setAttribute('aria-label', on ? '解锁' : '锁定');
    var lb = document.getElementById('vv-lock-btn');
    if (lb) {
        lb.innerHTML = vvIcon(on ? 'lock' : 'unlock', 20);
        lb.setAttribute('aria-pressed', on ? 'true' : 'false');
        lb.setAttribute('aria-label', on ? '已锁定' : '锁定');
    }
    vvToast(on ? '已锁定，点右上方图标解锁' : '已解锁');
}

// 系统画中画在 Via 这类 WebView 里根本不提供：pictureInPictureEnabled 为 false，
// 硬调 requestPictureInPicture() 只会拿到 NotSupportedError。按钮不能只弹一句
// 「小窗启动失败」就完事，所以不可用/被拒时降级成页内悬浮小窗。
function vvTryPip() {
    if (VV._mini) { vvMiniWindow(false); return; }
    try {
        if (VID && VID.requestPictureInPicture && document.pictureInPictureEnabled !== false) {
            VID.requestPictureInPicture().then(function () {
                if (ROOT) ROOT.style.display = 'none';
                vvSetPageFreeze(false);
            }).catch(function (er) {
                vvMiniWindow(true, (er && er.name) || 'reject');
            });
            return;
        }
    } catch (e) {}
    vvMiniWindow(true, 'unsupported');
}

// 页内小窗：不换源、不重建 video，只把播放器这层缩成一枚可拖动的 fixed 窗口。
// 控制栏整组隐藏（240px 宽塞不下），页面解除冻结，视频继续播。
function vvMiniWindow(on, reason) {
    if (!ROOT || !VV.playerActive) return false;
    try {
        if (on) {
            if (VV._mini) return true;
            try { if (document.pictureInPictureElement) document.exitPictureInPicture(); } catch (eP) {}
            VV._mini = true;
            ROOT.style.display = '';
            ROOT.classList.add('mini');
            ROOT.classList.remove('cs-on', 'locked');
            try { vvHideSheet(); } catch (eH) {}
            try { if (ROOT._csTimer) { clearTimeout(ROOT._csTimer); ROOT._csTimer = 0; } } catch (eT) {}
            vvSetPageFreeze(false);
            var w = Math.max(150, Math.min(240, Math.round(window.innerWidth * 0.46)));
            var h = Math.round(w * 9 / 16);
            ROOT.style.width = w + 'px';
            ROOT.style.height = h + 'px';
            ROOT.style.left = Math.max(8, window.innerWidth - w - 12) + 'px';
            ROOT.style.top = Math.max(8, window.innerHeight - h - 24) + 'px';
            vvBringToFront(ROOT);
            vvToast(reason && reason !== 'direct'
                ? '系统小窗不可用，已切到页内小窗（可拖动）'
                : '已切到页内小窗，拖动可移动位置', true);
        } else {
            if (!VV._mini) return true;
            VV._mini = false;
            MINIDRAG = null;
            ROOT.classList.remove('mini');
            ROOT.style.left = ''; ROOT.style.top = '';
            ROOT.style.width = ''; ROOT.style.height = '';
            ROOT.style.display = '';
            vvSetPageFreeze(true);
            vvBringToFront(ROOT);
            vvShowCS();
        }
        return true;
    } catch (e) { return false; }
}

// 小窗拖动：全屏那套手势在 vvGesStart/Move/End 里遇到 VV._mini 会让位，
// 这里单独处理；没移动的轻点直接还原全屏。
function vvMiniDragStart(e) {
    if (!VV._mini || !ROOT) return;
    if (e.target && e.target.closest && e.target.closest('.vv-mini-btn')) return;
    var t = e.touches && e.touches[0];
    if (!t) return;
    MINIDRAG = {
        x: t.clientX, y: t.clientY,
        l: parseFloat(ROOT.style.left) || 0,
        t: parseFloat(ROOT.style.top) || 0,
        moved: false
    };
    try { e.preventDefault(); } catch (eP) {}
}
function vvMiniDragMove(e) {
    if (!MINIDRAG || !ROOT) return;
    var t = e.touches && e.touches[0];
    if (!t) return;
    var dx = t.clientX - MINIDRAG.x, dy = t.clientY - MINIDRAG.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) MINIDRAG.moved = true;
    var w = ROOT.offsetWidth || 200, h = ROOT.offsetHeight || 120;
    ROOT.style.left = Math.max(0, Math.min(window.innerWidth - w, MINIDRAG.l + dx)) + 'px';
    ROOT.style.top = Math.max(0, Math.min(window.innerHeight - h, MINIDRAG.t + dy)) + 'px';
    try { e.preventDefault(); } catch (eP) {}
}
function vvMiniDragEnd(e) {
    if (!MINIDRAG) return;
    var moved = MINIDRAG.moved;
    MINIDRAG = null;
    if (!moved) vvMiniWindow(false);
}

function vvTryFs() {
    // 两枚全屏按钮互斥：点系统沉浸全屏时静默关掉「网页铺满」。
    // 不这么做的话 fullscreenchange 也会让位，但按钮高亮会慢一拍才跳变。
    try { if (VV._pageFs && VV._pageFs.on) vvPageFsSet(false, true); } catch (ePF) {}
    try {
        if (document.fullscreenElement) document.exitFullscreen();
        else ROOT.requestFullscreen().then(function () {
            try {
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(function () {});
                }
            } catch (e2) {}
        }).catch(function () { vvToast('全屏不可用'); });
    } catch (e) {
        vvToast('全屏不可用');
    }
}
function vvHlsNudge(inst) {
    try {
        if (!VV.active) return;
        var now = Date.now();
        // 有分片正在加载时绝对不要 startLoad：那会中断当前请求。
        // 冷门 CDN 的分片首字节可能要 30s+，反复打断会让 seek 永远失败。
        if (inst && VV.active._fragLoadingSince && now - VV.active._fragLoadingSince < 45000) return;
        // 清单还没下来时同理：startLoad 会把在飞的清单请求打断，弱网下等于从头再要一次
        if (inst && VV.active._manifLoadingSince && now - VV.active._manifLoadingSince < 30000) return;
        // 同一个卡顿不要频繁 startLoad，否则会反复中断分片请求
        if (VV.active._lastNudge && now - VV.active._lastNudge < 15000) return;
        VV.active._lastNudge = now;
        if (inst) {
            var t = VID.currentTime || 0;
            inst.startLoad(t);
        } else if (VID) {
            VID.play().catch(function () {
                try { VID.currentTime = VID.currentTime + 0.1; VID.play().catch(function () {}); } catch (e) {}
            });
        }
    } catch (e) {}
}

// 统一的跳转入口：夹紧到可 seek 范围；服务器不支持 Range 时给出明确提示
function vvSeekTo(t, silent) {
    try {
        if (!VID) return;
        var d = VID.duration || 0;
        // 直播 duration 是 Infinity：不能拿它当上界（pct*dur 会算出 Infinity），
        // 交给下面的 seekable 窗口来夹紧，只能在自己的缓冲窗口内回看。
        if (!isFinite(d)) d = 0;
        if (d > 0) t = Math.max(0, Math.min(d - 0.05, t));
        var sk = VID.seekable;
        if (sk && sk.length) {
            var lo = sk.start(0);
            var hi = sk.end(sk.length - 1);
            if (hi - lo < 0.5 && d > 2 && VID.readyState >= 2) {
                if (!silent) vvToast('该视频不支持跳转（服务器未开启 Range）', true);
                // 把进度条恢复到真实位置，避免停在拖动预览处
                try {
                    var cur = VID.currentTime || 0;
                    vvSetCurTime(cur);
                    if (d > 0 && CSCUR) {
                        var pct = Math.min(100, (cur / d) * 100);
                        vvSetBarPct(CSCUR, 'width', pct);
                        vvSetBarPct(CSPROGDOT, 'left', pct);
                    }
                } catch (eU) {}
                return;
            }
            // 只有拿到有效范围时才夹紧；HLS 刚加载时 seekable 可能还是 [0,0]
            if (hi - lo >= 0.5) {
                if (t < lo) t = lo;
                if (t > hi - 0.05) t = Math.max(lo, hi - 0.05);
            }
        }
        VID.currentTime = t;
    } catch (e) {}
}

function vvStartWatchdog() {
    vvStopWatchdog();
    if (!VV.active) return;
    VV.active._lastAdv = Date.now();
    VV.active._lastT = -1;
    VV._wdt = setInterval(function () {
        try {
            if (!VV.playerActive || !VID || !VV.active) return;
            // 暂停状态也要处理 seek：用户经常先暂停、拖到未缓冲位置，再点播放
            if (VID.paused && !VID.seeking) { VV.active._lastAdv = Date.now(); VV.active._seekSince = 0; return; }
            if (vvG.progDrag) { VV.active._lastAdv = Date.now(); VV.active._seekSince = Date.now(); return; }
            // 续播/跳转后分片一直加载不出来时，seek 会永久卡住；这里做超时重试和兜底。
            // 但分片正在加载时只能等：中断请求会让慢 CDN 反复从头开始。
            if (VID.seeking) {
                if (!VV.active._seekSince) VV.active._seekSince = Date.now();
                var fragBusy = VV.active._fragLoadingSince && Date.now() - VV.active._fragLoadingSince < 45000;
                if (!fragBusy && Date.now() - VV.active._seekSince > 45000) {
                    VV.active._seekSince = Date.now();
                    if (!VV.active._seekFallback) {
                        VV.active._seekFallback = 1;
                        vvToast('跳转位置加载超时，正在重试…');
                        vvHlsNudge(VV.active.hls);
                    } else {
                        VV.active._seekFallback = 0;
                        var back = VV.active._lastGoodT || 0;
                        vvToast(back > 3 ? '该位置暂时无法加载，已回到 ' + vvFmtTime(back) : '该位置暂时无法加载，已从头播放', true);
                        try { if (VV.active.hls) VV.active.hls.startLoad(back); } catch (eH0) {}
                        try { VID.currentTime = back; } catch (eH1) {}
                    }
                }
                VV.active._lastAdv = Date.now();
                return;
            }
            VV.active._seekSince = 0;
            VV.active._seekFallback = 0;
            if (VID.readyState >= 3) { VV.active._lastAdv = Date.now(); return; }
            if (Date.now() - VV.active._lastAdv > 20000) {
                VV.active._lastAdv = Date.now();
                // 分片还在正常加载（只是慢）就不要提示“卡住”并打断它
                var fragBusy2 = VV.active._fragLoadingSince && Date.now() - VV.active._fragLoadingSince < 45000;
                if (fragBusy2) return;
                // 直连 mp4 没有分片事件，用同一套"字节在涨"的证据：
                // 慢速下载时 readyState 会在 2 停留很久，那不是卡住，是还没下够。
                if (vvNetFlow(VV.active, Date.now()) >= 2) return;
                VV.active._lastT = -1;
                vvToast('播放卡住，自动恢复中…');
                vvHlsNudge(VV.active.hls);
            }
        } catch (e) {}
    }, 2000);
}

function vvStopWatchdog() {
    try {
        if (VV._wdt) { clearInterval(VV._wdt); VV._wdt = null; }
    } catch (e) {}
}

function vvApplyBrightness(pct) {
    try {
        pct = Math.max(0, Math.min(1, pct));
        if (BRIGHT) BRIGHT.style.opacity = String(Math.max(0, (1 - pct) * 0.92));
        if (VV.active) VV.active.bright = pct;
        // 手势每帧都会调用，只更新画面，停手 500ms 后再写存储
        vvSetLazy('bright', pct);
    } catch (e) {}
}

function vvApplyVolume(pct) {
    try {
        pct = Math.max(0, Math.min(1, pct));
        // 手势调音量一律视为"取消静音"：不然上一轮为省解码器做的临时静音
        // 会把用户这一下抬手吞掉，看起来像"滑了没反应"。
        try { VID.muted = false; } catch (eM) {}
        try { VV._userMuted = false; } catch (eUM) {}
        VID.volume = pct;
        if (VV.active) VV.active.vol = pct;
        // vol 只持久化非零值，0 单独记成静音开关。
        // 只存 vol 的话，一次滑到底就会让"之后每一次打开都是静音"，
        // 而界面上没有任何按钮能看出音量是 0——用户只会说"播着没声音"。
        if (pct > 0.01) {
            vvSetLazy('vol', pct);
            vvSetLazy('mute', 0);
            VV._userMuted = false;
        } else {
            vvSetLazy('mute', 1);
            VV._userMuted = true;
        }
    } catch (e) {}
}

// 通用提示：屏幕上居中的胶囊（双击快进、横滑 seek 用这个）
function vvShowSeek(text) {
    try {
        if (!SEEKTIP) return;
        SEEKTIP.classList.remove('scrub');
        SEEKTIP.style.left = '';
        SEEKTIP.innerHTML = vvEscape(text);
        SEEKTIP.classList.add('on');
    } catch (e) {}
}

// 拖动进度条时的气泡：吸附在拇指正上方而不是画面中央，这样视线不用离开进度条
function vvShowSeekAt(text, pct) {
    try {
        if (!SEEKTIP || !ROOT || !CSPROG) return;
        var rr = ROOT.getBoundingClientRect();
        var pr = CSPROG.getBoundingClientRect();
        var cx = (pr.left - rr.left) + Math.max(0, Math.min(1, pct)) * pr.width;
        // 夹紧到距边 46px：气泡比拇指宽，贴边时会溢出到屏幕外
        cx = Math.max(46, Math.min(Math.max(46, rr.width - 46), cx));
        SEEKTIP.innerHTML = vvEscape(text);
        SEEKTIP.style.left = cx + 'px';
        SEEKTIP.classList.add('scrub', 'on');
    } catch (e) {}
}

function vvHideSeek() {
    try {
        if (!SEEKTIP) return;
        SEEKTIP.classList.remove('on', 'scrub');
        SEEKTIP.style.left = '';
    } catch (e) {}
}

function vvShowGes(text) {
    try {
        GESTIP.innerHTML = vvEscape(text);
        GESTIP.classList.add('on');
    } catch (e) {}
}

function vvHideGes() {
    try { GESTIP.classList.remove('on'); } catch (e) {}
}

function vvInCtrlZone(el) {
    try {
        var t = el;
        while (t && t !== ROOT) {
            if (t.classList && (t.classList.contains('vv-cs-top') || t.classList.contains('vv-cs-bottom') || t.classList.contains('vv-sheet') || t.classList.contains('vv-lockmark') || t.classList.contains('vv-center-play'))) return true;
            t = t.parentNode;
        }
    } catch (e) {}
    return false;
}

var vvG = { mode: 'none', pass: false, sx: 0, sy: 0, t0: 0, startT: 0, startB: 1, startV: 1, longTimer: null, boost: false, tapT: 0, singleTimer: null, moved: false, progDrag: false, progT: null, gtgt: null };

var vvLastTouch = 0;

// 桌面/鼠标场景：触摸后浏览器可能补发鼠标事件，短时间内忽略，避免双触发
function vvIsMouseLike(e) {
    try {
        if (e && e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return false;
        return Date.now() - vvLastTouch > 800;
    } catch (e2) { return true; }
}

// 手指在播放器上时暂停“置顶检测”，避免 DOM 重排打断拖动进度条/横滑 seek
function vvMarkTouch(on) {
    try {
        clearTimeout(VV._touchTimer);
        VV._touchDown = !!on;
        if (on) VV._touchTimer = setTimeout(function () { VV._touchDown = false; }, 60000);
    } catch (e) {}
}

function vvBindGestures() {
    ROOT.addEventListener('touchstart', function () { vvLastTouch = Date.now(); vvMarkTouch(true); }, true);
    ROOT.addEventListener('touchend', function () { vvMarkTouch(false); }, true);
    ROOT.addEventListener('touchcancel', function () { vvMarkTouch(false); }, true);
    ROOT.addEventListener('touchstart', vvGesStart, { passive: false });
    ROOT.addEventListener('touchmove', vvGesMove, { passive: false });
    ROOT.addEventListener('touchend', vvGesEnd, { passive: false });
    ROOT.addEventListener('touchcancel', vvGesCancel, { passive: false });
    // 鼠标移动显示控制栏（桌面浏览器 / 接鼠标的平板）
    ROOT.addEventListener('mousemove', function (e) {
        if (!VV.active || !vvIsMouseLike(e)) return;
        var now = Date.now();
        if (VV._lastMouseCS && now - VV._lastMouseCS < 150) return;
        VV._lastMouseCS = now;
        vvShowCS();
    }, { passive: true });
    ROOT.addEventListener('mousedown', function (e) {
        if (!VV.active || !vvIsMouseLike(e)) return;
        vvShowCS();
    });
    // 鼠标单击画面切换播放/暂停；控制栏上的按钮各自处理
    ROOT.addEventListener('click', function (e) {
        if (!VV.active || !vvIsMouseLike(e)) return;
        if (vvInCtrlZone(e.target)) return;
        // 同触屏：菜单开着时点画面先收菜单，而不是把视频暂停掉
        var s = vvGetSheet();
        if (s && s.classList.contains('open')) { vvHideSheet(); return; }
        vvTogglePlay();
    });
    ROOT.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}

function vvGesStart(e) {
    // 页内小窗里交给 vvMiniDrag*：全屏的亮度/音量/seek 手势在 240px 宽下只会误触
    if (VV._mini) { vvG.pass = false; return; }
    if (!VV.active) return;
    try {
        if (vvInCtrlZone(e.target)) { vvG.pass = true; return; }
        vvG.pass = false;
        var t = e.touches[0];
        vvG.sx = t.clientX;
        vvG.sy = t.clientY;
        vvG.t0 = Date.now();
        vvG.mode = 'none';
        vvG.moved = false;
        // 记住按下瞬间控制栏是显示还是隐藏，供 vvInvokeSingle 判断该显示还是该隐藏
        vvG.csOn0 = !!(ROOT && ROOT.classList.contains('cs-on'));
        try {
            vvG.startT = VID.currentTime || 0;
            vvG.startV = VID.volume || 1;
        } catch (ev) {}
        vvG.startB = vvGet('bright', 1);
        clearTimeout(vvG.longTimer);
        vvG.longTimer = setTimeout(function () {
            if (vvG.t0 && !vvG.moved && VV.playerActive && !VV.active.locked && VID && !VID.paused) {
                vvG.boost = true;
                try {
                    var bx = Math.min(4, (VV.active.speed || 1) * 2);
                    VID.playbackRate = bx;
                    vvShowGes('▶▶ ' + bx + 'x 倍速中，松手恢复');
                } catch (e2) {}
            }
        }, 520);
    } catch (e3) {
        vvG.pass = true;
    }
}

function vvGesMove(e) {
    if (VV._mini) { vvG.pass = false; return; }
    if (!VV.active || vvG.pass) return;
    try {
        var t = e.touches[0];
        var dx = t.clientX - vvG.sx;
        var dy = t.clientY - vvG.sy;
        if (vvG.mode === 'none' && Math.sqrt(dx * dx + dy * dy) > 16) {
            vvG.moved = true;
            clearTimeout(vvG.longTimer);
            if (Math.abs(dx) > Math.abs(dy)) vvG.mode = 'h';
            else if (t.clientX < window.innerWidth / 2) vvG.mode = 'bright';
            else vvG.mode = 'vol';
        }
        if (vvG.mode === 'h') {
            e.preventDefault();
            var dur = VID.duration || 0;
            // 直播没有总长，横向滑动快进的 delta 会按窗口长度算，直接忽略
            if (dur > 0 && isFinite(dur) && !vvIsLive()) {
                var delta = (dx / window.innerWidth) * dur * 0.75;
                var tgt = Math.max(0, Math.min(dur - 0.3, vvG.startT + delta));
                vvG.gtgt = tgt;
                var sign = delta >= 0 ? '+' : '−';
                vvShowSeek(sign + vvFmtTime(Math.abs(delta)) + '  →  ' + vvFmtTime(tgt));
                try {
                    CSCUR.style.width = (tgt / dur * 100) + '%';
                    CSPROGDOT.style.left = (tgt / dur * 100) + '%';
                } catch (eP) {}
            }
        } else if (vvG.mode === 'bright') {
            e.preventDefault();
            var pct = Math.max(0.08, Math.min(1, vvG.startB - dy / (window.innerHeight * 0.75)));
            vvApplyBrightness(pct);
            vvShowGes('☀ 亮度 ' + Math.round(pct * 100) + '%');
        } else if (vvG.mode === 'vol') {
            e.preventDefault();
            var vp = Math.max(0, Math.min(1, vvG.startV - dy / (window.innerHeight * 0.65)));
            vvApplyVolume(vp);
            vvShowGes((vp === 0 ? '🔇' : '🔊') + ' 音量 ' + Math.round(vp * 100) + '%');
        }
    } catch (em) {}
}

function vvGesEnd(e) {
    if (VV._mini) { vvG.pass = false; return; }
    if (!VV.active || vvG.pass) { vvG.pass = false; return; }
    try {
        clearTimeout(vvG.longTimer);
        if (vvG.boost) {
            vvG.boost = false;
            try { VID.playbackRate = VV.active.speed || 1; } catch (eB) {}
            vvHideGes();
        }
        if (vvG.mode === 'h') {
            e.preventDefault();
            vvHideSeek();
            if (typeof vvG.gtgt === 'number' && VID.duration) vvSeekTo(vvG.gtgt);
        } else if (vvG.mode === 'bright' || vvG.mode === 'vol') {
            e.preventDefault();
            vvHideGes();
        } else {
            var quick = Date.now() - vvG.t0 < 300 && !vvG.moved;
            if (quick) {
                // 菜单开着时单击立即可关，不走 300ms 双击判定：
                // 等那 300ms 才收菜单，手感就是"点了没反应"。
                // 菜单浮在画面上，这时双击快进也没有意义。
                var sOpen = vvGetSheet();
                if (sOpen && sOpen.classList.contains('open')) {
                    vvHideSheet();
                } else if (Date.now() - vvG.tapT < 300) {
                    clearTimeout(vvG.singleTimer);
                    vvG.tapT = 0;
                    vvInvokeDouble(e);
                } else {
                    vvG.tapT = Date.now();
                    vvG.singleTimer = setTimeout(function () { vvInvokeSingle(); }, 300);
                }
            }
        }
        vvG.mode = 'none';
        vvG.gtgt = null;
        vvShowCS();
    } catch (e4) {}
}

// 触摸被系统/广告重排打断时，尽量把已经预览到的跳转目标提交，避免“拖了但没跳”
function vvGesCancel(e) {
    try {
        clearTimeout(vvG.longTimer);
        if (vvG.boost) {
            vvG.boost = false;
            try { VID.playbackRate = VV.active.speed || 1; } catch (eB) {}
        }
        if (vvG.mode === 'h' && typeof vvG.gtgt === 'number' && VID.duration) vvSeekTo(vvG.gtgt);
        vvG.mode = 'none';
        vvG.gtgt = null;
        vvG.progDrag = false;
        try { if (CSPROG) CSPROG.classList.remove('dragging'); } catch (eD) {}
        vvHideSeek();
        vvHideGes();
    } catch (e) {}
}

function vvInvokeSingle() {
    try {
        // 菜单开着的时候，点画面只负责收起菜单，不改变控制栏显隐：
        // 菜单是浮在画面上的，用户点空白的第一意图一定是"关掉这个菜单"。
        var s = vvGetSheet();
        if (s && s.classList.contains('open')) { vvHideSheet(); return; }
        // 以"按下瞬间"控制栏的状态决定显示还是隐藏。
        // 不能直接判断当前 class：vvGesEnd 末尾会先调 vvShowCS() 把 cs-on 打开，
        // 那样单击就只会隐藏，永远唤不出控制栏。
        if (vvG.csOn0) ROOT.classList.remove('cs-on');
        else vvShowCS();
    } catch (e) {}
}

function vvInvokeDouble(e) {
    try {
        var x = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : 0;
        var W = window.innerWidth;
        if (vvIsLive()) {
            // 直播的双击快进/快退会一头撞到窗口边缘，只保留中间区域切播放/暂停
            if (x >= W / 3 && x <= W * 2 / 3) vvTogglePlay();
            else vvShowGes('直播流不支持快进');
            return;
        }
        if (x < W / 3) {
            vvSeekTo(Math.max(0, VID.currentTime - 10));
            vvShowSeek('快退 10s ▶ ' + vvFmtTime(VID.currentTime));
        } else if (x > W * 2 / 3) {
            vvSeekTo(Math.min(VID.duration || 1e9, VID.currentTime + 10));
            vvShowSeek('快进 10s ▶ ' + vvFmtTime(VID.currentTime));
        } else {
            vvTogglePlay();
            return;
        }
        setTimeout(vvHideSeek, 700);
        ROOT.classList.add('cs-on');
        vvShowCS();
    } catch (e2) {}
}

function vvProgCommit() {
    try {
        if (CSPROG) CSPROG.classList.remove('dragging');
        if (vvG.progDrag && typeof vvG.progT === 'number' && VID && VID.duration) vvSeekTo(vvG.progT);
    } catch (e) {}
    vvG.progDrag = false;
    vvHideSeek();
    vvShowCS();
}

function vvBindProgress() {
    if (!CSPROG) return;
    try {
        CSPROG.addEventListener('touchstart', function (e) {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            vvG.pass = false;
            vvG.progDrag = true;
            vvProgDrag(e.touches[0].clientX);
        }, { passive: false });
        CSPROG.addEventListener('touchmove', function (e) {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            if (vvG.progDrag && e.touches[0]) vvProgDrag(e.touches[0].clientX);
        }, { passive: false });
        CSPROG.addEventListener('touchend', function (e) {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            vvProgCommit();
        }, { passive: false });
        // 触摸被系统手势/广告重排打断时也要提交，否则拖动后不会跳转
        CSPROG.addEventListener('touchcancel', function (e) {
            e.stopPropagation();
            vvProgCommit();
        }, { passive: false });

        // 鼠标拖动进度条（桌面浏览器 / 接鼠标的平板）
        CSPROG.addEventListener('mousedown', function (e) {
            if (!vvIsMouseLike(e)) return;
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            vvG.pass = false;
            vvG.progDrag = true;
            vvProgDrag(e.clientX);
            vvShowCS();
        });
        ROOT.addEventListener('mousemove', function (e) {
            if (!vvG.progDrag || !vvIsMouseLike(e)) return;
            if (e.cancelable) e.preventDefault();
            vvProgDrag(e.clientX);
        });
        ROOT.addEventListener('mouseup', function (e) {
            if (!vvG.progDrag || !vvIsMouseLike(e)) return;
            if (e.cancelable) e.preventDefault();
            vvProgCommit();
        });
    } catch (e) {}
}

function vvProgDrag(x) {
    try {
        var rect = CSPROG.getBoundingClientRect();
        // 控制栏隐藏/收起时进度条宽度会是 0，此时按 x 算出来的比例会直接顶到 100%，
        // 表现成"一碰进度条就跳到片尾"。宽度异常时直接忽略这次拖动。
        if (!(rect.width > 4)) return;
        var pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
        var dur = VID.duration || 0;
        // 直播不能拖：总长只是当前窗口长度，拖过去立刻卡在窗口边缘
        if (vvIsLive()) return;
        if (!(dur > 0) || !isFinite(dur)) return;
        var t = pct * dur;
        vvG.progT = t;
        CSCUR.style.width = (pct * 100) + '%';
        // 位置必须继续用 left 百分比表达（不改成 transform），拖动中也不会被 vvOnTime 回写覆盖
        CSPROGDOT.style.left = (pct * 100) + '%';
        CSPROG.classList.add('dragging');
        vvShowSeekAt(vvFmtTime(t) + ' / ' + vvFmtTime(dur), pct);
    } catch (e) {}
}

function vvOnEnded() {
    try {
        if (!VV.active || VV._endHandled) return;
        VV._endHandled = true;
        vvSaveNow();
        try {
            var m = vvGetProgressMap();
            var ent = m[VV.active.key];
            if (ent) { ent.t = 0; ent.u = Date.now(); vvSaveProgressMap(m); }
        } catch (eS) {}
        clearTimeout(vvG.longTimer);
        if (vvG.boost) { vvG.boost = false; VID.playbackRate = VV.active.speed || 1; }
        if (VV.cfg.autoplayNext && VV.active && VV.active.nextItem) {
            vvToast('连播下一集...');
            var nx = VV.active.nextItem;
            setTimeout(function () {
                if (VV.playerActive) openPlayer(nx);
            }, 600);
            return;
        }
        if (VV.cfg.autoplayNext && VV.active && VV.active.nextPage) {
            vvNavNext();
            return;
        }
        vvToast('播放结束');
        setTimeout(function () { if (VV.playerActive) closePlayer(); }, 1600);
    } catch (e) {}
}

function vvNavNext() {
    try {
        if (!VV.active || !VV.active.nextPage) return;
        vvSet('autoNextLast', { ts: Date.now() });
        var go = VV.active.nextPage;
        closePlayer();
        location.href = go;
    } catch (e) {}
}

function vvNumInfo(u) {
    try {
        var s = String(u);
        var q = s.indexOf('?');
        var p = q >= 0 ? s.slice(0, q) : s;
        var runs = [], r0, rx = /\d+/g;
        while ((r0 = rx.exec(p)) !== null) runs.push({ n: r0[0], pos: r0.index });
        for (var i = runs.length - 1; i >= 0; i--) {
            var num = parseInt(runs[i].n, 10);
            if (num >= 0 && num < 9998) return { num: num, len: runs[i].n.length, pos: runs[i].pos, base: s };
        }
    } catch (e) {}
    return null;
}

function vvBumpNum(info, add) {
    try {
        var n = info.num + add;
        var s = String(n);
        while (s.length < info.len) s = '0' + s;
        return info.base.slice(0, info.pos) + s + info.base.slice(info.pos + info.len);
    } catch (e) {}
    return null;
}

function vvTemplize(u) {
    return String(u).replace(/\d+/g, '#');
}

function vvProbeUrl(url, isHls, cb) {
    if (typeof GM_xmlhttpRequest !== 'function') { cb(true); return; }
    try {
        GM_xmlhttpRequest({
            method: isHls ? 'GET' : 'HEAD',
            url: url,
            timeout: 9000,
            headers: { Referer: location.href },
            onload: function (r) {
                var ok = r.status >= 200 && r.status < 400;
                if (ok && isHls) {
                    var t = (r.responseText || '').slice(0, 512);
                    if (t.indexOf('#EXTM3U') < 0) ok = false;
                }
                cb(ok);
            },
            onerror: function () { cb(false); },
            ontimeout: function () { cb(false); }
        });
    } catch (e) { cb(true); }
}

function vvFindNext() {
    try {
        if (!VV.active) return;
        var item = VV.active.item;
        var cands = [];
        var mi = vvNumInfo(item.url);
        if (mi && parseInt(mi.num, 10) > 0 && mi.num < 900) {
            for (var k = 1; k <= 2; k++) {
                var nu = vvBumpNum(mi, k);
                if (nu) cands.push({ url: nu, via: 'media' });
            }
        }
        try {
            var page = location.href;
            var pi = vvNumInfo(page);
            if (pi) {
                var links = document.querySelectorAll('a[href]');
                var pageTem = vvTemplize(page.split('#')[0]);
                for (var i = 0; i < links.length; i++) {
                    var l = links[i].getAttribute('href');
                    if (!l || l.indexOf('javascript:') === 0) continue;
                    var full;
                    try { full = new URL(l, location.href).href; } catch (e2) {}
                    var li = full ? vvNumInfo(full) : null;
                    if (li && Math.abs(li.num - pi.num) === 1 && vvTemplize(full.split('#')[0]) === pageTem) {
                        cands.push({ url: full, via: 'page' });
                        break;
                    }
                }
            }
        } catch (e3) {}
        if (!cands.length) return;
        var cand = cands[0];
        if (cand.via === 'page') {
            VV.active.nextPage = cand.url;
            vvShowNext(true);
            return;
        }
        vvProbeUrl(cand.url, VV.active.item.type === 'HLS', function (ok) {
            if (ok && VV.active) {
                VV.active.nextItem = { url: cand.url, type: VV.active.item.type, name: VV.active.item.name };
                vvShowNext(true);
            }
        });
    } catch (e) {}
}

function vvShowNext(on) {
    try {
        var b = document.getElementById('vv-next-btn');
        // 直播永远不显示"下一集"：页面里搜到的频道/相关视频链接会被当成剧集
        if (b) b.style.display = (on && !vvIsLive()) ? '' : 'none';
    } catch (e) {}
}

function vvGoNext() {
    try {
        if (VV.active && VV.active.nextItem) { openPlayer(VV.active.nextItem); return; }
        if (VV.active && VV.active.nextPage) { vvNavNext(); return; }
        vvToast('没有检测到下一集');
    } catch (e) {}
}

function vvGetSheet() {
    try { return document.getElementById('vv-sheet'); } catch (e) {}
    return null;
}

function vvHideSheet() {
    try {
        var s = vvGetSheet();
        if (s) { s.classList.remove('open'); s.innerHTML = ''; }
        // 菜单收起后控制栏要保持可见并重新计时。
        // 原来是"菜单一关就把控制栏也收掉"，点空白关菜单会连带把界面清空，
        // 看起来像"点一下全没了"，只能再点一次把控制栏唤回来。
        vvShowCS();
    } catch (e) {}
}

// 菜单协议：{group:'标题'} 表头；{label, sub?, icon?, on?, switch?, act}
// 选中态由 .on + 勾选图标表达，不再往 label 里拼 "  ✓"；布尔项用开关而不是「：开/关」文案。
function vvSheetShow(items) {
    try {
        var s = vvGetSheet();
        if (!s) return;
        s.innerHTML = '';
        items.forEach(function (it) {
            if (!it) return;
            if (it.group) { s.appendChild(vvEl('div', 'vv-sheet-group', vvEscape(it.group))); return; }
            var row = vvEl('div', 'vv-sheet-item' + (it.on ? ' on' : '') + (it.off ? ' off' : ''));
            // 图标槽位恒定占位：有的行有图标、有的没有，不留空槽会让标题栏左右参差
            row.innerHTML =
                '<span class="vv-sheet-ico">' + (it.icon ? vvIcon(it.icon, 18) : '') + '</span>' +
                '<span class="vv-sheet-txt">' +
                    '<span class="vv-sheet-label">' + vvEscape(it.label) + '</span>' +
                    (it.sub ? '<span class="vv-sheet-sub">' + vvEscape(it.sub) + '</span>' : '') +
                '</span>' +
                (it.switch
                    ? '<span class="vv-switch" role="switch" aria-checked="' + (it.on ? 'true' : 'false') + '"></span>'
                    : (it.on ? '<span class="vv-sheet-check">' + vvIcon('check', 16) + '</span>' : ''));
            row.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!it.act) return;
                var keep = it.act();
                if (!keep) vvHideSheet();
            });
            s.appendChild(row);
        });
        s.classList.add('open');
        vvShowCS();
    } catch (e) {}
}

function vvSpeedMenu() {
    var opts = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
    var cur = VV.active ? VV.active.speed : 1;
    var items = [{ group: '播放速度' }];
    opts.forEach(function (o) {
        items.push({
            label: o === 1 ? '正常' : o + 'x',
            on: o === cur,
            act: function () {
                vvSetSpeed(o);
                return false;
            }
        });
    });
    vvSheetShow(items);
}

function vvLevelLabel(lv, idx) {
    try {
        var h = lv && lv.height ? lv.height + 'P' : ('线路' + (idx + 1));
        var b = lv && lv.bitrate ? Math.round(lv.bitrate / 1000) + 'kbps' : '';
        return h + (b ? ' · ' + b : '');
    } catch (e) { return '线路' + (idx + 1); }
}

function vvAudioLabel(tr, idx) {
    try {
        var n = tr && (tr.name || tr.lang) || ('音轨' + (idx + 1));
        if (tr && tr.name && tr.lang && tr.name !== tr.lang) n += ' (' + tr.lang + ')';
        return n;
    } catch (e) { return '音轨' + (idx + 1); }
}

// 倍速 chip 只表达倍速本身。以前把画质也拼进来（"1.5x · 自动·200P"），
// 12px 字号下三个信息挤在一枚胶囊里，扫一眼读不出来；画质现在有独立入口。
function vvUpdateSpeedChip() {
    try {
        var a = VV.active;
        var chip = document.getElementById('vv-speed-chip');
        if (!a || !chip) return;
        var fast = !!(a.speed && a.speed !== 1);
        chip.textContent = fast ? (a.speed + 'x') : '倍速';
        chip.classList.toggle('on', fast);
        chip.setAttribute('aria-pressed', fast ? 'true' : 'false');
        vvUpdateQualityChip();
    } catch (e) {}
}

function vvUpdateQualityChip() {
    try {
        var a = VV.active;
        var chip = document.getElementById('vv-quality-chip');
        if (!a || !chip) return;
        var levels = a.levels || [];
        if (levels.length < 2) {
            chip.classList.remove('show', 'on');
            chip.textContent = '';
            return;
        }
        var manual = a.qIndex !== undefined;
        var txt;
        if (!manual) txt = '自动';
        else if (levels[a.qIndex] && levels[a.qIndex].height) txt = levels[a.qIndex].height + 'P';
        else txt = '线路' + (a.qIndex + 1);
        chip.textContent = txt;
        chip.classList.add('show');
        // 自动档不点亮：只有"用户主动选过档位"才算非默认状态
        chip.classList.toggle('on', manual);
    } catch (e) {}
}

function vvSetSpeed(sp) {
    try {
        VV.active.speed = sp;
        VID.playbackRate = sp;
        vvSet('speed', String(sp));
        vvUpdateSpeedChip();
        vvToast('倍速 ' + (sp === 1 ? '正常' : sp + 'x'));
    } catch (e) {}
}

function vvBufAhead() {
    try {
        var t = VID.currentTime || 0;
        var b = VID.buffered;
        if (!b || !b.length) return 0;
        for (var i = 0; i < b.length; i++) {
            if (t >= b.start(i) - 0.5 && t <= b.end(i) + 0.5) return Math.max(0, b.end(i) - t);
        }
        return Math.max(0, b.end(b.length - 1) - t);
    } catch (e) { return 0; }
}

// 生成可复制的播放诊断，用来区分：源/网络慢、解码掉帧、还是 hls.js 策略问题
function vvDiagText() {
    var a = VV.active || {};
    var v = VID || {};
    var lines = [];
    var push = function (s) { lines.push(s); };
    push('Via 视频播放诊断 v' + VV.version + (VV.build ? '  build ' + VV.build : ''));
    try { push('UA: ' + navigator.userAgent); } catch (e0) {}
    push('类型: ' + ((a.item && a.item.type) || '?') + '  倍速: ' + (v.playbackRate || 1) + 'x');
    push('画面: ' + (v.videoWidth || 0) + 'x' + (v.videoHeight || 0) + '  时长: ' + vvFmtTime(v.duration || 0));
    push('状态: ready=' + (v.readyState || 0) + ' network=' + (v.networkState || 0) +
        ' paused=' + !!v.paused + ' seeking=' + !!v.seeking);
    var ahead = vvBufAhead();
    push('缓冲: ' + ahead.toFixed(1) + 's ahead');
    var dropPct = 0;
    try {
        var q = v.getVideoPlaybackQuality && v.getVideoPlaybackQuality();
        if (q && q.totalVideoFrames) {
            dropPct = q.droppedVideoFrames / q.totalVideoFrames * 100;
            push('丢帧: ' + q.droppedVideoFrames + ' / ' + q.totalVideoFrames +
                ' (' + dropPct.toFixed(2) + '%)');
        } else if (typeof v.webkitDroppedFrameCount === 'number') {
            var totalF = v.webkitDecodedFrameCount || 0;
            if (totalF) dropPct = v.webkitDroppedFrameCount / totalF * 100;
            push('丢帧: ' + v.webkitDroppedFrameCount + ' / ' + totalF +
                (totalF ? ' (' + dropPct.toFixed(2) + '%)' : ''));
        }
    } catch (eQ) {}
    var waitMs = (a._waitMs || 0) + (a._waitStart ? Date.now() - a._waitStart : 0);
    push('卡顿: ' + (a._waitCount || 0) + ' 次 / 累计 ' + Math.round(waitMs) + 'ms');
    if (a.hls) {
        var inst = a.hls;
        var lv = inst.levels && inst.currentLevel >= 0 ? inst.levels[inst.currentLevel] : null;
        var lvLoad = inst.levels && inst.loadLevel >= 0 ? inst.levels[inst.loadLevel] : null;
        push('HLS: ' + (inst.autoLevelEnabled ? '自动' : '手动') +
            ' 当前=' + (lv ? ((lv.height || '?') + 'P/' + Math.round((lv.bitrate || 0) / 1000) + 'k') : '?') +
            ' 加载=' + (lvLoad ? ((lvLoad.height || '?') + 'P') : '?'));
        push('码率估计: ' + (inst.bandwidthEstimate ? (inst.bandwidthEstimate / 1000000).toFixed(2) + ' Mbps' : '?'));
        var loads = a._fragLoads || [];
        var avg = 0;
        for (var li = 0; li < loads.length; li++) avg += loads[li];
        if (loads.length) avg = Math.round(avg / loads.length);
        push('分片: 最近 ' + (a._fragMs ? a._fragMs + 'ms' : '?') +
            ' / ' + (a._fragBytes ? Math.round(a._fragBytes / 1024) + 'KB' : '?') +
            '  平均 ' + (avg ? avg + 'ms' : '?'));
        if (a._fragLoadingSince) push('分片加载中: ' + ((Date.now() - a._fragLoadingSince) / 1000).toFixed(1) + 's');
        // 负载率 = 播放消耗速率 ÷ 实际下载速率，不依赖分片时长也能算。
        // ≥100% 表示下载已经追不上播放，必然持续卡顿，换什么播放策略都没用。
        var dlKbs = (a._fragMsSum && a._fragBytesSum)
            ? a._fragBytesSum / a._fragMsSum
            : ((a._fragMs && a._fragBytes) ? a._fragBytes / a._fragMs : 0);
        var needKbs = lv && lv.bitrate ? lv.bitrate / 8000 : 0;
        var loadPct = (dlKbs && needKbs) ? needKbs / dlKbs * 100 : 0;
        if (dlKbs) {
            push('速率: 下载 ' + dlKbs.toFixed(1) + 'KB/s  需要 ' + needKbs.toFixed(1) +
                'KB/s  负载 ' + Math.round(loadPct) + '%');
        }
        // 分片时长只用于参考：不是所有清单都能拿到 details
        var tdur = 0;
        try {
            var ld = inst.latestLevelDetails;
            if (!ld && inst.levels && inst.levels.length) {
                var liD = inst.loadLevel >= 0 ? inst.loadLevel : (inst.currentLevel >= 0 ? inst.currentLevel : 0);
                ld = inst.levels[liD] && inst.levels[liD].details;
            }
            if (!ld) {
                for (var liE = 0; liE < inst.levels.length; liE++) {
                    if (inst.levels[liE].details && inst.levels[liE].details.targetDuration) { ld = inst.levels[liE].details; break; }
                }
            }
            if (ld && ld.targetDuration) tdur = ld.targetDuration;
        } catch (eTd) {}
        if (tdur) push('分片时长: ' + tdur.toFixed(1) + 's' + (loadPct ? '  按分片时长算占用 ' + Math.round(avg / (tdur * 1000) * 100) + '%' : ''));
        var verdict;
        var curH = lv && lv.height ? lv.height + 'P' : '当前档';
        var loadingSec = a._fragLoadingSince ? (Date.now() - a._fragLoadingSince) / 1000 : 0;
        if (loadPct >= 100) {
            verdict = inst.autoLevelEnabled
                ? '源或 CDN 限速：下载 ' + dlKbs.toFixed(0) + 'KB/s，播放要 ' + needKbs.toFixed(0) + 'KB/s，调策略没用'
                : '手动锁了 ' + curH + '：要 ' + needKbs.toFixed(0) + 'KB/s，只有 ' + dlKbs.toFixed(0) + 'KB/s';
        } else if (loadingSec > 6) {
            verdict = '有分片已等 ' + loadingSec.toFixed(0) + 's 未返回：源太慢，或正在硬等';
        } else if (dropPct >= 2) {
            verdict = 'WebView 软解超载：网络够快但丢帧 ' + dropPct.toFixed(1) + '%，先关界面毛玻璃 / 减少并行页签，画质不必降';
        } else if (ahead < 2 && loadPct >= 60) {
            verdict = '策略偏紧：缓冲只剩 ' + ahead.toFixed(1) + 's，负载 ' + Math.round(loadPct) + '% 已到临界';
        } else if (loadPct >= 60) {
            verdict = '网络偏紧：负载 ' + Math.round(loadPct) + '%，还没卡死但缓冲在走低';
        } else if (ahead >= 2) {
            verdict = '网络与解码都正常：卡顿来自 seek、重排或事件抖动';
        } else {
            verdict = '缓冲已空但下载很快：ABR 起播或切档瞬间的抖动';
        }
        push('判定: ' + verdict);
    } else {
        push('内核: 系统原生 / MP4');
        if (dropPct >= 2) push('判定: 解码超载，码率超出设备软解能力');
    }
    try {
        var mem = performance.memory;
        if (mem) push('JS 堆: ' + Math.round(mem.usedJSHeapSize / 1048576) + 'MB / ' + Math.round(mem.jsHeapSizeLimit / 1048576) + 'MB');
    } catch (eM) {}
    push('页面可见: ' + !document.hidden);
    // 独占模式的现场：这一行是"为什么别的页不肯让出解码器"的唯一可靠答案。
    // 三个信号全绿（visible + rAF 在跑 + 有焦点）的页面会一直认为自己在台前，
    // 只有它自己不拆；这时要看别的页面这一行是不是也全绿（那就是多窗口/分屏场景，
    // 靠 hasFocus 区分，需要持续失焦 4 秒才判定）。
    try {
        var visTxt = '';
        try { visTxt = document.visibilityState || '?'; } catch (eV) {}
        var focTxt = '未知';
        try { focTxt = vvHasFocus() ? '有' : '无'; } catch (eF) {}
        push('独占判定: ' + (VV._bg ? '后台（已交出解码器）' : '前台（持有解码器）') +
            '  vis=' + visTxt + ' 焦点=' + focTxt +
            (VV._focusEverTrue ? '' : '(不可用)') +
            (VV._noFocusAt ? ' 已失焦' + Math.round((Date.now() - VV._noFocusAt) / 1000) + 's' : ''));
        push('解码器: 本页管线 ' + vvMediaPipelineCount() + ' 条' +
            '  已交还 ' + (VV._releaseTotal || 0) + ' 条' +
            '  后台巡检 ' + (VV._sweepCount || 0) + ' 轮' +
            '  拦下起播 ' + (VV._gateBlocked || 0) + ' 次' +
            '（其中拦下装源 ' + (VV._gateSrcBlocked || 0) + ' 次）');
        // 声音状态：排查"画面在动却听不到声音"时，这一行就能定性
        // （是我们的临时静音没还原，还是站点自己在 muted）。
        try {
            var _pv = document.querySelector('.vv-player-video');
            push('声音: ' + (_pv ? ('muted=' + _pv.muted + ' vol=' + (Math.round(_pv.volume * 100) / 100)) : '无播放器') +
                '  存储 vol=' + vvGet('vol', 1) + ' mute=' + vvGet('mute', 0));
        } catch (eSnd) {}
        if (VV._lastReleaseAt) {
            push('最近交还: ' + Math.round((Date.now() - VV._lastReleaseAt) / 1000) + 's 前（' + (VV._lastReleaseWhy || '?') + '）');
        }
        // 跨页通道是否真的通。"我看的那页独占"要靠别的页知道该让位，
        // 而 localStorage 按域名隔离——十个不同视频站互相看不见。
        // 这里显示到底走通了哪条通道；两条都没通就说明只能靠"失焦/停帧"各自判定。
        push('跨页通道: ' + (VV._gmBusOk ? 'GM 脚本级（跨站可用）'
            : VV._lsBusOk ? 'localStorage（仅同站）' : '尚未收到过其它页的通知'));
        // 嗅探开销：判断"这站是本来就卡，还是被我们拖卡的"。
        // 丢弃数不为 0 说明页面的 DOM 增速超过了我们的处理速度（瀑布流/弹幕/自动轮播的典型特征）。
        // 省读是"没有去读的响应体次数"，被挡住的是 js/css/html 这类读了也没用的东西。
        try {
            push('嗅探开销: 条目 ' + VV.items.length +
                '  DOM ' + (VV._moNodes || 0) + (VV._moDropped ? '(丢弃' + VV._moDropped + ')' : '') +
                '  省读 ' + (VV._bodySkip || 0) + ' 次/' + Math.round((VV._bodySkipKb || 0) / 102.4) / 10 + 'MB');
        } catch (eCost) {}
    } catch (eX) {}
    return lines.join('\n');
}

try { VV._diagText = vvDiagText; VV._bufAhead = vvBufAhead; } catch (eD) {}

function vvMenuSheet() {
    var act = VV.active;
    if (!act) return;
    var dur = VID.duration || 0;
    var items = [];
    items.push({ group: '播放' });
    items.push({
        label: '标记片头',
        sub: '跳过当前位置之前',
        icon: 'back',
        on: act.skipS > 0,
        act: function () {
            act.skipS = Math.max(0, (VID.currentTime || 0) - 0.2);
            vvSaveProgressField();
            vvToast('已标记片头 ' + vvFmtTime(act.skipS));
            return false;
        }
    });
    if (dur > 0) {
        items.push({
            label: '标记片尾',
            sub: '播到当前位置结束',
            icon: 'next',
            on: act.skipE > 0,
            act: function () {
                act.skipE = Math.max(0, dur - (VID.currentTime || 0) - 0.2);
                vvSaveProgressField();
                vvToast('已标记片尾，距结尾 ' + vvFmtTime(act.skipE));
                return false;
            }
        });
    }
    if (act.skipS > 0 || act.skipE > 0) {
        items.push({
            label: '清除片头片尾标记',
            icon: 'close',
            act: function () {
                act.skipS = 0;
                act.skipE = 0;
                vvSaveProgressField();
                vvToast('已清除');
                return false;
            }
        });
    }
    items.push({
        label: '从头播放',
        icon: 'play',
        act: function () {
            vvSeekTo(0);
            return false;
        }
    });
    items.push({
        label: '选集',
        sub: (function () {
            var d = vvEpisodesScan();
            var n = d.page.length + d.media.length;
            return n ? '本页找到 ' + n + ' 集' : '本页还没认出剧集列表';
        })(),
        icon: 'list',
        act: function () {
            vvEpisodesOpen();
            return false;
        }
    });
    items.push({ group: '设置' });
    // 布尔项改用开关控件：状态由控件本身表达，不再往标题里拼「：开/关」
    items.push({
        label: '多页并行播放',
        sub: '同时播多个页面时只压缩缓冲与内存，码率档位不变',
        switch: true,
        on: !!VV.cfg.multiPlay,
        act: function () {
            vvToggleMultiPlay();
            return false;
        }
    });
    items.push({
        label: '连播（自动下一集）',
        switch: true,
        on: !!VV.cfg.autoplayNext,
        act: function () {
            VV.cfg.autoplayNext = !VV.cfg.autoplayNext;
            vvSet('autoplayNext', VV.cfg.autoplayNext);
            vvToast('连播已' + (VV.cfg.autoplayNext ? '开启' : '关闭'));
            return false;
        }
    });
    // 开关语义是「开 = 有毛玻璃」，配置项是「开 = 低特效」，这里取反
    items.push({
        label: '界面毛玻璃',
        sub: '关掉后播放时菜单不再每帧模糊重算，低性能设备更稳',
        switch: true,
        on: !VV.cfg.lowFx,
        act: function () {
            vvToggleLowFx();
            return false;
        }
    });
    // 开关语义是「开 = 允许网页自动播放」，配置项同名；默认关
    items.push({
        label: '网页视频自动播放',
        sub: '关掉后站点播放器不再一进页面就起播，等你点播放',
        switch: true,
        on: !!VV.cfg.pageAutoplay,
        act: function () {
            VV.cfg.pageAutoplay = !VV.cfg.pageAutoplay;
            vvSet('pageAutoplay', VV.cfg.pageAutoplay);
            if (VV.cfg.pageAutoplay) { try { vvApRestorePreload(); } catch (e0) {} }
            vvToast('网页自动播放已' + (VV.cfg.pageAutoplay ? '开启' : '关闭'));
            return false;
        }
    });
    // 「画面」组按实际内容决定是否出现：直链 mp4 既没有档位也没有音轨，
    // 先推表头会留下一个空分组
    var visual = [];
    if (act.hls && act.levels && act.levels.length > 1) {
        visual.push({
            label: '画质：' + (act.qIndex === undefined ? (act.qAutoHeight ? '自动·' + act.qAutoHeight + 'P' : '自动') : (act.levels[act.qIndex].height ? act.levels[act.qIndex].height + 'P' : ('线路' + (act.qIndex + 1)))),
            icon: 'gear',
            act: function () {
                vvQualityMenu();
                return true;
            }
        });
    }
    if (act.hls && act.audioTracks && act.audioTracks.length > 1) {
        var ai = act.hlsInst && typeof act.hlsInst.audioTrack === 'number' ? act.hlsInst.audioTrack : act.audioIndex;
        visual.push({
            label: '音轨：' + vvAudioLabel(act.audioTracks[ai] || act.audioTracks[0], ai),
            icon: 'gear',
            act: function () {
                vvAudioMenu();
                return true;
            }
        });
    }
    if (act.item && act.item.type === 'HLS') {
        var eng = VV.cfg.hlsEngine || 'auto';
        var engLabel = eng === 'native' ? '系统原生' : (eng === 'hlsjs' ? 'hls.js' : '自动');
        visual.push({
            label: 'HLS 内核：' + engLabel,
            sub: '点按切换',
            icon: 'gear',
            act: function () {
                var next = eng === 'auto' ? 'native' : (eng === 'native' ? 'hlsjs' : 'auto');
                if (next === 'native' && !vvCanNativeHls()) {
                    vvToast('系统 WebView 不支持原生 HLS', true);
                    return false;
                }
                VV.cfg.hlsEngine = next;
                vvSet('hlsEngine', next);
                var t = VID.currentTime || 0;
                vvToast('已切换 HLS 内核，重新加载…', true);
                vvLoadMedia(act.item);
                var onMeta = function () {
                    try { VID.removeEventListener('loadedmetadata', onMeta); } catch (eR) {}
                    try {
                        if (t > 0.5) {
                            if (act.hls) act.hls.startLoad(t);
                            VID.currentTime = t;
                        }
                    } catch (eS) {}
                };
                try { VID.addEventListener('loadedmetadata', onMeta); } catch (eA) {}
                return false;
            }
        });
    }
    if (visual.length) {
        items.push({ group: '画面' });
        items = items.concat(visual);
    }
    items.push({ group: '工具' });
    items.push({
        label: VV._mini ? '退出页内小窗' : '页内小窗（悬浮播放）',
        sub: '系统画中画不可用时也能边看边刷页面，可拖动',
        icon: 'pip',
        act: function () {
            vvMiniWindow(!VV._mini, 'direct');
            return false;
        }
    });
    items.push({
        label: '复制链接',
        icon: 'link',
        act: function () {
            if (act.item) { vvCopy(act.item.url); vvToast('已复制链接'); }
            return false;
        }
    });
    items.push({
        label: '下载此视频',
        icon: 'dl',
        act: function () {
            vvDownloadItem(act.item);
            return false;
        }
    });
    items.push({
        label: '导出 / 复制链接',
        sub: '生成带 Referer 的 .m3u，外部播放器可直接打开',
        icon: 'link',
        act: function () {
            vvShareOpen(act.item);
            return false;
        }
    });
    items.push({
        label: '用外部播放器播放',
        sub: '独立进程解码，可和多页播放并行',
        icon: 'play',
        act: function () {
            var ok = vvOpenExternal(act.item);
            vvToast(ok ? '已唤起系统选择器，选 VLC / MX 等即可' : '无法唤起外部应用，请用「导出 / 复制链接」导出 .m3u', true);
            return false;
        }
    });
    items.push({
        label: '复制播放诊断',
        icon: 'gear',
        act: function () {
            var txt = vvDiagText();
            vvCopy(txt);
            var q = null;
            try { q = VID.getVideoPlaybackQuality && VID.getVideoPlaybackQuality(); } catch (eQ) {}
            var drop = q && q.totalVideoFrames ? (q.droppedVideoFrames / q.totalVideoFrames * 100).toFixed(1) + '%' : '?';
            vvToast('诊断已复制 · 缓冲 ' + vvBufAhead().toFixed(1) + 's · 丢帧 ' + drop, true);
            return false;
        }
    });
    items.push({
        label: '重建播放实例',
        sub: '解码失败或卡死时重建，进度保留',
        icon: 'gear',
        act: function () {
            vvRebuildMedia();
            return false;
        }
    });
    vvSheetShow(items);
}

function vvSaveProgressField() {
    try {
        var m = vvGetProgressMap();
        m[VV.active.key] = {
            t: (m[VV.active.key] && m[VV.active.key].t) || (VID.currentTime || 0),
            d: VID.duration || 0,
            s: VV.active.skipS,
            e: VV.active.skipE,
            u: Date.now()
        };
        vvSaveProgressMap(m);
    } catch (e) {}
}

function vvBuildQualityMenu(levels, hlsInst) {
    if (!VV.active) return;
    VV.active.levels = levels;
    VV.active.hlsInst = hlsInst;
    try {
        if (hlsInst && hlsInst.currentLevel >= 0 && levels[hlsInst.currentLevel] && levels[hlsInst.currentLevel].height) {
            VV.active.qAutoHeight = levels[hlsInst.currentLevel].height;
        }
    } catch (eL) {}
    vvUpdateSpeedChip();
}

function vvQualityMenu() {
    try {
        var act = VV.active;
        if (!act || !act.levels) return;
        var items = [{
            label: '自动（自适应）',
            sub: '按带宽在档位间平滑切换',
            on: act.qIndex === undefined,
            act: function () {
                // 用 nextLevel 而不是 currentLevel：后者会立刻 flush 缓冲重拉，
                // 弱网下切档瞬间必卡 2~5 秒；nextLevel 等到下个分片边界平滑切。
                try { act.hlsInst.nextLevel = -1; } catch (e) {}
                act.qIndex = undefined;
                act.qAutoHeight = 0;
                vvToast('画质 自动');
                vvBuildQualityMenu(act.levels, act.hlsInst);
                return false;
            }
        }];
        act.levels.forEach(function (lv, idx) {
            items.push({
                label: vvLevelLabel(lv, idx),
                on: act.qIndex === idx,
                act: function () {
                    try { act.hlsInst.nextLevel = idx; } catch (e2) {}
                    act.qIndex = idx;
                    act.qAutoHeight = lv.height || 0;
                    vvToast('画质 ' + vvLevelLabel(lv, idx) + '（下一段生效）');
                    vvBuildQualityMenu(act.levels, act.hlsInst);
                    return false;
                }
            });
        });
        vvSheetShow(items);
    } catch (e) {}
}

function vvAudioMenu() {
    try {
        var act = VV.active;
        if (!act || !act.audioTracks || act.audioTracks.length < 2) return;
        var cur = act.hlsInst && typeof act.hlsInst.audioTrack === 'number' ? act.hlsInst.audioTrack : act.audioIndex;
        var items = act.audioTracks.map(function (tr, idx) {
            return {
                label: vvAudioLabel(tr, idx),
                on: cur === idx,
                act: function () {
                    try { act.hlsInst.audioTrack = idx; } catch (eA) {}
                    act.audioIndex = idx;
                    vvToast('音轨 ' + vvAudioLabel(tr, idx));
                    return false;
                }
            };
        });
        vvSheetShow(items);
    } catch (e) {}
}
// ===== 外链导出与兼容性自检 =====
// 站内能播、把链接丢给 VLC / MX / N_m3u8DL 就失败，几乎只有三种原因：
//   1. 防盗链：CDN 校验 Referer，缺了就 403
//   2. 鉴权：需要页面 Cookie / Authorization，外部播放器没有
//   3. 签名过期或一次性令牌：链接离开页面就已经死了
// 这里把当前页面上下文打包成外部播放器能吃的格式，并做一次可复现的链路探测。

function vvShareName(item) {
    var n = '';
    try { n = vvSafeName((item && item.name) || 'video'); } catch (e) { n = 'video'; }
    return n.replace(/[,;]/g, ' ').replace(/[\r\n]+/g, ' ').slice(0, 60) || 'video';
}

function vvIsHls(url) {
    return /\.m3u8(?:$|[?#])/i.test(url || '');
}

// VLC / mpv / PotPlayer 都认这个 .m3u：把 Referer 和 UA 写进播放列表里
function vvBuildM3U(item) {
    var ua = '';
    try { ua = navigator.userAgent || ''; } catch (eU) {}
    var ref = '';
    try { ref = location.href || ''; } catch (eR) {}
    var lines = ['#EXTM3U', '#EXTINF:-1,' + vvShareName(item)];
    if (ref) lines.push('#EXTVLCOPT:http-referrer=' + ref);
    if (ua) lines.push('#EXTVLCOPT:http-user-agent=' + ua);
    if (vvIsHls(item.url)) lines.push('#EXTVLCOPT:network-caching=3000');
    lines.push(item.url);
    return lines.join('\n');
}

function vvBuildCmd(item) {
    var ua = '';
    try { ua = navigator.userAgent || ''; } catch (eU) {}
    var ref = '';
    try { ref = location.href || ''; } catch (eR) {}
    var ext = vvIsHls(item.url) ? '.m3u8' : '.mp4';
    var q = function (s) { return '"' + String(s).replace(/"/g, '\\"') + '"'; };
    return 'curl -L --retry 2 -A ' + q(ua) + ' -e ' + q(ref) +
        ' -o ' + q(vvShareName(item) + ext) + ' ' + q(item.url);
}

function vvSaveText(name, text, mime) {
    try {
        var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.rel = 'noopener';
        document.documentElement.appendChild(a);
        a.click();
        setTimeout(function () {
            try { URL.revokeObjectURL(url); } catch (e1) {}
            try { a.parentNode.removeChild(a); } catch (e2) {}
        }, 4000);
        return true;
    } catch (e) { return false; }
}

// 生成 Android intent:// 链接：把播放交给「另一个 App」的独立进程去解码。
// 这就是那类浏览器能扛多路的关键——播放器在别的进程，
// 有自己的 MediaCodec 配额，一个崩了也不牵连页面。
// 脚本在 Via 的 WebView 里没有起 Activity 的权限，只能"请求"系统去起，
// 所以能不能成，取决于 Via 是否放行外部应用跳转。
function vvBuildIntent(item, mimeOverride) {
    var url = String((item && item.url) || '');
    var hash = url.indexOf('#');
    if (hash >= 0) url = url.slice(0, hash);
    var scheme = url.indexOf('https://') === 0 ? 'https' : 'http';
    var bare = url.replace(/^https?:\/\//, '');
    bare = bare.replace(/ /g, '%20').replace(/;/g, '%3B');
    var mime = mimeOverride ||
        (item && item.type === 'HLS' ? 'application/vnd.apple.mpegurl' :
            (item && item.type === 'MP4' ? 'video/mp4' : 'video/*'));
    return 'intent://' + bare + '#Intent;scheme=' + scheme +
        ';action=android.intent.action.VIEW;type=' + mime + ';end';
}

// 触发系统选择器：交给 VLC / MX / 系统播放器等任意外部播放器
function vvOpenExternal(item, mimeOverride) {
    try {
        var intent = vvBuildIntent(item, mimeOverride);
        var a = document.createElement('a');
        a.href = intent;
        a.style.display = 'none';
        a.rel = 'noopener';
        document.documentElement.appendChild(a);
        a.click();
        setTimeout(function () {
            try { if (a.parentNode) a.parentNode.removeChild(a); } catch (e) {}
        }, 3000);
        return true;
    } catch (e) {
        return false;
    }
}

// ---- 链路探测 ----
// 用三种请求模拟"外部播放器"的处境，比对着看状态码就知道缺的是 Referer 还是 Cookie。
function vvFetchProbe(url, opts, timeoutMs) {
    return new Promise(function (resolve) {
        var done = false;
        var t0 = Date.now();
        var timer = 0;
        var ctl = null;
        function fin(o) {
            if (done) return;
            done = true;
            if (timer) clearTimeout(timer);
            o.ms = Date.now() - t0;
            resolve(o);
        }
        try { ctl = new AbortController(); } catch (eC) {}
        timer = setTimeout(function () {
            fin({ ok: false, err: '超时 ' + Math.round((timeoutMs || 8000) / 1000) + 's' });
            try { if (ctl) ctl.abort(); } catch (eA) {}
        }, timeoutMs || 8000);
        try {
            var o = { method: 'GET', cache: 'no-store' };
            if (ctl) o.signal = ctl.signal;
            for (var k in (opts || {})) o[k] = opts[k];
            fetch(url, o).then(function (r) {
                fin({ ok: true, status: r.status });
            }).catch(function (e) {
                fin({ ok: false, err: String((e && e.message) || e) });
            });
        } catch (e) {
            fin({ ok: false, err: String((e && e.message) || e) });
        }
    });
}

// GM_xmlhttpRequest 走 Via 的 native 通道：不带 Referer、不带 Cookie，
// 行为和外部播放器最接近，而且不受 CORS 限制。
function vvGmProbe(url, timeoutMs) {
    return new Promise(function (resolve) {
        if (typeof GM_xmlhttpRequest !== 'function') { resolve(null); return; }
        var done = false;
        var t0 = Date.now();
        function fin(o) {
            if (done) return;
            done = true;
            o.ms = Date.now() - t0;
            resolve(o);
        }
        setTimeout(function () { fin({ ok: false, err: '超时' }); }, timeoutMs || 9000);
        try {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: timeoutMs || 9000,
                headers: {},
                onload: function (r) { fin({ ok: true, status: r.status, gm: true }); },
                onerror: function () { fin({ ok: false, err: '请求失败' }); },
                ontimeout: function () { fin({ ok: false, err: '超时' }); }
            });
        } catch (e) {
            fin({ ok: false, err: String((e && e.message) || e) });
        }
    });
}

function vvProbeText(label, r) {
    if (!r) return label + ': 不可用';
    if (!r.ok) return label + ': ' + r.err + ' (' + r.ms + 'ms)';
    return label + ': HTTP ' + r.status + ' (' + r.ms + 'ms)';
}

function vvJudgeProbe(bare, ref, ck) {
    function blocked(r) { return !!(r && r.ok && (r.status === 401 || r.status === 403)); }
    function good(r) { return !!(r && r.ok && r.status >= 200 && r.status < 400); }
    function corsFail(r) { return !!(r && !r.ok && /fetch|network|cors|load failed/i.test(r.err || '')); }
    if (blocked(bare) && (good(ref) || good(ck))) {
        return '防盗链：裸链 ' + bare.status + '，带 Referer 就通 → 用「导出 .m3u」交给外部播放器';
    }
    if (blocked(bare) && blocked(ck)) {
        return '令牌失效或 IP 绑定：带 Cookie 也 ' + bare.status + ' → 回页面重新嗅探一条新链接';
    }
    if (good(bare) && (ref || ck) && !good(ref) && !good(ck)) {
        return '加了请求头反而被拒 → 服务器挑 Referer，导出的 .m3u 需要换成别的 Referer';
    }
    if (good(bare)) {
        return '链接可移植：裸链就能拉 → 外部失败是播放器不支持该封装（HLS 用 VLC / mpv），或只认 UA';
    }
    if (corsFail(bare) && (!ck || corsFail(ck))) {
        return '页面内判不了（CORS 拦截），但外部播放器不受 CORS 限制 → 直接用 .m3u 试，别用浏览器验';
    }
    return '结果矛盾，看上面三行状态码：相同则是源的问题，只差在裸链则是请求头的问题';
}

// 返回 { lines: [...], verdict: '...' }
function vvShareProbe(item) {
    var url = item.url;
    var isHls = item.type === 'HLS' || vvIsHls(url);
    var bare = vvFetchProbe(url, { referrerPolicy: 'no-referrer', credentials: 'omit' }, 8000);
    var ref = vvFetchProbe(url, { referrer: location.href, referrerPolicy: 'strict-origin-when-cross-origin', credentials: 'omit' }, 8000);
    return Promise.all([bare, ref]).then(function (arr) {
        return vvGmProbe(url, 9000).then(function (gm) {
            var b = arr[0], r = arr[1];
            // 页面内带 Cookie 的对照：只在裸链失败时才跑，避免和 ACAO:* 冲突产生假阴性
            var ckP = (b.ok && b.status >= 200 && b.status < 400)
                ? Promise.resolve(null)
                : vvFetchProbe(url, { referrer: location.href, credentials: 'include' }, 8000);
            return ckP.then(function (ck) {
                var lines = [
                    vvProbeText('裸链（无 Referer/无 Cookie）', b),
                    vvProbeText('加页面 Referer', r)
                ];
                if (ck) lines.push(vvProbeText('再加 Cookie', ck));
                if (gm) lines.push(vvProbeText('GM 直连（最像外部播放器）', gm));
                if (!isHls) lines.push('提示：mp4 还需要服务器支持 Range，否则外部播放器拖不动进度');
                var judgeBase = gm && !gm.ok && b && b.ok === false ? gm : b;
                return { lines: lines, verdict: vvJudgeProbe(judgeBase, r, ck || gm) };
            });
        });
    });
}

// ---- 浮层 UI ----
function vvShareClose() {
    try {
        var w = document.getElementById('vv-share-wrap');
        if (w && w.parentNode) w.parentNode.removeChild(w);
        // 角标还原：面板或播放器在的时候不该冒出来
        var b = vvBadge();
        if (b) b.style.display = '';
        if (!VV.playerActive && !VV._panelOpen && VV.items.length) vvToggleBadge(true);
    } catch (e) {}
}

function vvShareOpen(item) {
    if (!item || !item.url) { vvToast('没有可分享的链接', true); return; }
    vvShareClose();
    // 从嗅探面板的「导出」按钮进来时把面板收起：两层全屏遮罩叠着，
    // 面板的置顶巡检还会把分享浮层挪到自己下面（看着像界面自动关闭）。
    try {
        if (VV._panelOpen && vvUI && vvUI.panel) vvUI.panel.close();
    } catch (eP) {}
    var wrap = vvEl('div', 'vv-share-wrap');
    wrap.id = 'vv-share-wrap';
    var box = vvEl('div', 'vv-share');

    var head = vvEl('div', 'vv-share-head');
    var title = vvEl('div', 'vv-share-title', '外部播放器');
    var x = vvEl('button', 'vv-share-x');
    x.innerHTML = vvIcon('close', 14);
    x.setAttribute('aria-label', '关闭');
    x.title = '关闭';
    head.appendChild(title);
    head.appendChild(x);

    var sub = vvEl('div', 'vv-share-sub',
        '站内能播、外部失败，通常是链接缺少页面上下文（Referer / Cookie / 签名）。' +
        '「用外部播放器播放」会把播放交给另一个 App 的独立进程去解码 —— 这就是多路并行不打架的关键。');
    var urlBox = vvEl('div', 'vv-share-url');
    urlBox.textContent = item.url.length > 160 ? item.url.slice(0, 160) + '…' : item.url;

    var btns = vvEl('div', 'vv-share-btns');
    var log = vvEl('div', 'vv-share-log');
    log.textContent = '点「自检」看这个链接离开页面后还能不能被拉取。\n' +
        '提示：「用外部播放器播放」需要 Via 允许跳转外部应用；若没反应，请改用「导出 .m3u」在 VLC 里打开。';

    function mkBtn(label, cls, fn) {
        var b = vvEl('button', 'vv-share-btn' + (cls ? ' ' + cls : ''), label);
        b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
        btns.appendChild(b);
        return b;
    }

    mkBtn('导出 .m3u（带请求头）', 'primary', function () {
        var txt = vvBuildM3U(item);
        var ok = vvSaveText(vvShareName(item) + '.m3u', txt, 'audio/x-mpegurl;charset=utf-8');
        if (ok) vvToast('已导出 .m3u，用 VLC 打开', true);
        else { vvCopy(txt); vvToast('无法保存，已复制播放列表内容', true); }
    });
    mkBtn('用外部播放器播放', 'primary', function () {
        var ok = vvOpenExternal(item);
        vvToast(ok ? '已唤起系统选择器，选 VLC / MX 等即可' : '无法唤起外部应用，请用「导出 .m3u」', true);
    });
    if (item.type === 'HLS') {
        mkBtn('外部播放器（兼容 MIME）', '', function () {
            var ok = vvOpenExternal(item, 'application/x-mpegURL');
            vvToast(ok ? '已唤起系统选择器' : '无法唤起外部应用', true);
        });
    }
    mkBtn('复制 curl 命令', '', function () {
        vvCopy(vvBuildCmd(item));
        vvToast('已复制 curl，可在电脑上直接下载');
    });
    mkBtn('只复制链接', '', function () {
        vvCopy(item.url);
        vvToast('已复制裸链（外部可能被拒）');
    });
    var btnProbe = mkBtn('自检兼容性', '', function () {
        log.textContent = '正在用三种方式请求…';
        btnProbe.disabled = true;
        vvShareProbe(item).then(function (res) {
            log.innerHTML = '';
            res.lines.forEach(function (l) {
                var d = vvEl('div', 'vv-share-line', l);
                log.appendChild(d);
            });
            var v = vvEl('div', 'vv-share-verdict', '判定：' + res.verdict);
            log.appendChild(v);
            btnProbe.disabled = false;
        }).catch(function (e) {
            log.textContent = '自检失败：' + ((e && e.message) || e);
            btnProbe.disabled = false;
        });
        return true;
    });

    x.addEventListener('click', vvShareClose);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) vvShareClose(); });

    box.appendChild(head);
    box.appendChild(sub);
    box.appendChild(urlBox);
    box.appendChild(btns);
    box.appendChild(log);
    wrap.appendChild(box);
    document.documentElement.appendChild(wrap);
    // 角标是 fixed + 最高层级，会压在浮层按钮上，直接藏掉
    try { var b = vvBadge(); if (b) b.style.display = 'none'; } catch (eT) {}
    try { if (typeof vvBringToFront === 'function') vvBringToFront(wrap); } catch (eB) {}
    // 点「导出 .m3u」时 Via 会弹系统下载界面，页面短暂进入后台；回来后
    // 角标/面板可能又排到了浮层前面，把浮层重新压回最上层，别让用户以为它关了。
    if (!VV._shareVisBound) {
        VV._shareVisBound = true;
        try {
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) return;
                var w = document.getElementById('vv-share-wrap');
                if (w) vvBringToFront(w);
            });
        } catch (eV) {}
    }
}
// ===== 多页面并行播放的治理 =====
// 手机上 Via（Android WebView）的视频解码走 MediaCodec，同时可用的解码器实例数是硬上限。
// 用户明确要求"同时播几个"，所以这里不能简单锁死单实例，改为：
//   1. 登记表（谁在播），跨页面共享
//   2. 单实例模式（默认）：只有最早的页面在播，其余自动挂起 —— 防解码器耗尽
//   3. 并行模式（可开）：允许多页同时播，但按并发数压缩每页的缓冲与内存上限，
//      把"多个解码器"的压力降到能撑住的范围内；画质档位一律不压（画质红线）
// 两种模式都保留了：挂起后释放解码器、实例重建、强制关闭逃生门。

var VV_LEASE_TTL = 9000;    // 登记表里超过 9 秒没续的条目视为已退出
var VV_LEASE_TICK = 2500;

function vvLeaseId() {
    if (!VV._pageId) {
        VV._pageId = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
    return VV._pageId;
}

// 登记表：{ id: { ts, first, url } }
//
// 每个页签写自己的一条（独立 key），读的时候扫前缀。
// 之前是"读整个对象 → 改自己那条 → 整个写回"，两个页签同时续登就会互相覆盖，
// 登记表时不时少一条，仲裁结果跟着飘。独立 key 没有这个竞态。
var VV_LEASE_PREFIX = 'vvs:lease:';

function vvPlayersRead() {
    var out = {};
    var now = Date.now();
    try {
        var del = [];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (!k || k.indexOf(VV_LEASE_PREFIX) !== 0) continue;
            var e = null;
            try { e = JSON.parse(localStorage.getItem(k)); } catch (e1) {}
            if (!e || typeof e !== 'object') continue;
            if (now - (e.ts || 0) >= VV_LEASE_TTL) { del.push(k); continue; }
            out[k.slice(VV_LEASE_PREFIX.length)] = e;
        }
        for (var d = 0; d < del.length; d++) { try { localStorage.removeItem(del[d]); } catch (eD) {} }
    } catch (e2) {}
    return out;
}

function vvPlayersWrite(url) {
    var me = vvLeaseId();
    var prev = null;
    try { prev = JSON.parse(localStorage.getItem(VV_LEASE_PREFIX + me) || 'null'); } catch (e0) {}
    // first = 首次登记时间，续登只刷新 ts（心跳）。
    // 主页面必须按 first 排，否则每 2.5 秒续登一次会让"主页面"在多个页面间来回跳，
    // 表现为多个页面互相抢权、轮流挂起。
    var rec = {
        ts: Date.now(),
        first: (prev && prev.first) || Date.now(),
        url: url || (prev && prev.url) || ''
    };
    try { localStorage.setItem(VV_LEASE_PREFIX + me, JSON.stringify(rec)); } catch (e1) {}
    return vvPlayersRead();
}

function vvPlayersUnregister() {
    try {
        localStorage.removeItem(VV_LEASE_PREFIX + vvLeaseId());
    } catch (e) {}
}

function vvPlayersCount() {
    var n = 0;
    var list = vvPlayersRead();
    for (var k in list) n++;
    return n;
}

// 单实例模式下的"主页面"：登记最早的优先（按首次登记时间，不受续登刷新影响）
function vvPlayersOwner() {
    var list = vvPlayersRead();
    var owner = null, best = Infinity;
    for (var k in list) {
        var e = list[k] || {};
        var t = e.first || e.ts || 0;
        if (t < best || (t === best && (!owner || k < owner))) {
            best = t;
            owner = k;
        }
    }
    return owner;
}

// 挂起：停拉流 + 暂停画面，把解码器和带宽让出来
function vvSuspendPlayback(reason) {
    try {
        if (!VV.active) return;
        if (VV.active._suspended) return;
        VV.active._suspended = true;
        VV.active._suspendReason = reason || 'other';
        VV.active._suspendAt = Date.now();
        try { if (VID) VID.pause(); } catch (e1) {}
        try { if (VV.active.hls) VV.active.hls.stopLoad(); } catch (e2) {}
        if (reason === 'other') {
            vvShowLoading('已挂起：另一个页面正在播放');
            vvToast('另一个页面正在播放，本页已自动挂起（可在脚本菜单改为并行播放）', true);
        }
    } catch (e) {}
}

// 彻底交还解码器（不是"挂起"）。
//
// 关键区别：pause() 只是停止送帧，MediaCodec 还挂在 media 进程里；
// 只有把 <video> 退回"无资源"状态（摘 src + load()）才会 release。
// 而且必须连 hls 一起销毁——只 destroy hls 不摘 src，MediaSource 还在，
// SourceBuffer 的解码器照样活着。
function vvReleaseDecoder() {
    try {
        if (!VV.active) {
            // 播放器已退出但 VID 还活着（异常路径），也照样清干净
            try { if (VID) vvHardReleaseVideo(VID); } catch (eA) {}
            return;
        }
        var t = 0;
        try { t = (VID && isFinite(VID.currentTime) && VID.currentTime > 0) ? VID.currentTime : 0; } catch (eT) {}
        if (t > 0) VV.active._suspendT = t;
        if (VV.active.hls) {
            try { VV.active.hls.stopLoad(); } catch (e0) {}
            try { VV.active.hls.detachMedia(); } catch (e0b) {}
            try { VV.active.hls.destroy(); } catch (e1) {}
            VV.active.hls = null;
            VV.active._inst = null;
        }
        // 池里的残渣（重建失败留下的旧实例）一并清掉
        try { vvKillAllHls(); } catch (e1b) {}
        try { vvHardReleaseVideo(VID); } catch (e2) {}
        VV.active._mediaReleased = true;
        VV.active._suspended = true;
        if (!VV.active._suspendReason) VV.active._suspendReason = 'hidden';
        if (!VV.active._suspendAt) VV.active._suspendAt = Date.now();
    } catch (e) {}
}

function vvResumePlayback() {
    try {
        if (!VV.active || !VV.active._suspended) return;
        if (vvTabHidden()) return;
        VV.active._suspended = false;
        VV.active._suspendReason = '';
        VV.active._suspendAt = 0;
        // 顺手把临时静音还原（有些机型 pause 后元素会被静音，回来必须还原）
        try { vvRestoreAudio(VID); } catch (eRA) {}
        if (VV.active.hls && !VV.active._mediaReleased) {
            try { VV.active.hls.startLoad(VID.currentTime || 0); } catch (e1) {}
            try { if (VID) VID.play().catch(function () {}); } catch (e2) {}
            vvHideLoading();
        } else {
            // 管线已经被拆掉了：只能整条重建（进度从 _suspendT 续上）
            VV.active._mediaReleased = false;
            try { vvRebuildMedia(); } catch (e3) {}
        }
    } catch (e) {}
}

// ---- 前台/后台判定 ----
// 为什么不只靠 visibilitychange：Via 这类 WebView 壳切标签时不一定会给后台页面派发它，
// 一旦不派发，本页的释放逻辑就永远不触发，解码器一直挂着——
// 表现就是"开了几个页签之后，新页签能加载但播不动，关掉几个才好"。
// 所以这里加一条 rAF 心跳：页面不可见时浏览器会停掉 requestAnimationFrame，
// 这条信号比事件更难被骗过。
function vvRafBeat() {
    VV._rafArmed = false;
    VV._rafSeen = true;
    VV._rafLast = Date.now();
    vvArmRaf();
}

function vvArmRaf() {
    if (VV._rafArmed) return;
    try {
        if (typeof requestAnimationFrame !== 'function') return;
        VV._rafArmed = true;
        requestAnimationFrame(vvRafBeat);
    } catch (e) { VV._rafArmed = false; }
}

function vvHasFocus() {
    try { return !!(document.hasFocus && document.hasFocus()); } catch (e) { return true; }
}

// 焦点信号是否可信：有些 WebView 根本没有"焦点"概念，hasFocus() 恒为 false。
// 恒 false 还拿它当判据的话，页面会在启动几秒后把自己拆掉——所以必须先"见过 true"才启用。
function vvFocusUsable() {
    if (VV._focusEverTrue) return true;
    try {
        if (vvHasFocus()) { VV._focusEverTrue = true; return true; }
    } catch (e) {}
    return false;
}

// 多窗口 / 分屏时，两个页面 visibility 都是 visible、rAF 也都在跑，
// 只有"窗口焦点"能区分用户正在看哪一个。但要防误判：点地址栏、系统弹窗、
// 输入法升起都会短暂失焦，所以要求"持续失焦"超过阈值才算。
var VV_NOFOCUS_MS = 4000;
function vvFocusLostLong() {
    if (!vvFocusUsable()) return false;
    try {
        if (vvHasFocus()) { VV._noFocusAt = 0; return false; }
    } catch (e) { return false; }
    if (!VV._noFocusAt) VV._noFocusAt = Date.now();
    if (Date.now() - VV._noFocusAt < VV_NOFOCUS_MS) return false;
    // 关键限定：失焦本身**不足以**证明"用户去看别的页了"。
    // 点地址栏、系统弹窗、输入法、无头环境都会让 hasFocus 长期为 false，
    // 单靠它判定就是无缘无故把自己拆掉（本地跑 UI 用例时整条链路卡死就是这么来的）。
    // 只有"确实有别的页签在最近宣称过自己在台前"，失焦才算数。
    return vvPeerFrontSeen();
}

// ---- 前台宣告 ----
// 每个页签在自己处于台前时写一条心跳，别人读到就知道"台前在别处"。
// 这是失焦判定的前置证据，也是"我看的那页独占"能被别的页确认的唯一方式。
// 每个页签写自己的一条（独立 key），不是一个共用 key。
// 共用一个 key 的话后写的会覆盖前写的：分屏时 A 失焦后读到的可能还是 A 自己那条，
// 于是"有别的页在台前"永远不成立，失焦判定形同虚设。
var VV_FRONT_PREFIX = 'vvs:front:';
var VV_GM_FRONT = 'vvfront';

function vvAnnounceFront() {
    var now = Date.now();
    var me = vvLeaseId();
    try { localStorage.setItem(VV_FRONT_PREFIX + me, JSON.stringify({ ts: now })); } catch (e0) {}
    try {
        if (typeof GM_setValue === 'function') GM_setValue(VV_GM_FRONT, { id: me, ts: now });
    } catch (e1) {}
}

// 最近 12 秒内，有没有**别的**页签宣称自己在台前。带 2 秒缓存：
// 这个函数被 900ms 的巡检反复调用，GM_getValue 在某些壳里是同步 IPC，不适合每次都问。
function vvPeerFrontSeen() {
    var now = Date.now();
    if (VV._peerFrontAt && now - VV._peerFrontAt < 2000) return !!VV._peerFrontSeen;
    VV._peerFrontAt = now;
    var seen = false;
    var me = vvLeaseId();
    // 本地：扫前缀，顺手清过期条目（页签关掉后不该继续"证明"别人在台前）
    try {
        var del = [];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (!k || k.indexOf(VV_FRONT_PREFIX) !== 0) continue;
            var id = k.slice(VV_FRONT_PREFIX.length);
            var e = null;
            try { e = JSON.parse(localStorage.getItem(k)); } catch (e1) {}
            if (!e || now - (e.ts || 0) > 12000) { del.push(k); continue; }
            if (id !== me) seen = true;
        }
        for (var d = 0; d < del.length; d++) { try { localStorage.removeItem(del[d]); } catch (eD) {} }
    } catch (e2) {}
    // GM 通道（跨站唯一可能通的）：只有一个 key，但够判断"台前在别处"
    try {
        if (typeof GM_getValue === 'function') {
            var r = GM_getValue(VV_GM_FRONT, null);
            if (r && r.id && r.id !== me && now - (r.ts || 0) <= 12000) seen = true;
        }
    } catch (e3) {}
    VV._peerFrontSeen = seen;
    return seen;
}

// 只做"事实判断"，不改状态
function vvTabHidden() {
    try {
        if (document.visibilityState === 'hidden' || document.hidden === true) return true;
    } catch (e0) {}
    try {
        if (VV._rafSeen) {
            var gap = Date.now() - (VV._rafLast || 0);
            // 阈值从 1.6s 提到 2.6s。原因：重页面（首屏解析、瀑布流批量渲染、
            // 广告/统计脚本）出现 1~2 秒的长任务很常见，主线程一忙 rAF 就断，
            // 1.6s 会把"本页自己卡了一下"误判成"用户切走了"。
            // 误判的代价远大于晚一秒发现切走：我们会拆它的解码器、还拦住它重建，
            // 站点于是永远停在加载中——用户看到的就是"这个网站一点就卡死"。
            if (gap > 2600) {
                // 已经重新可见但 rAF 链断了（个别内核恢复后不补帧）：补一次
                if (!document.hidden && gap > 3200 && !VV._rafArmed) vvArmRaf();
                // 光凭 rAF 停顿还不够：要么 document 确实隐藏，要么别的页签宣称在台前。
                // 两个证据都没有时，最可能的是本页主线程被自己卡住了，不是切走。
                if (document.hidden || vvPeerFrontSeen()) return true;
            }
        }
    } catch (e1) {}
    return vvFocusLostLong();
}

// 本页现在挂着几条媒体管线（= 可能各占一个 MediaCodec）。
// 判断"还攥着资源"一律用 src 属性/IDL，不看 currentSrc——后者在 load() 后会残留一会儿。
function vvMediaPipelineCount() {
    var n = 0;
    try {
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el) continue;
            try { if (el.mediaKeys) continue; } catch (eK) {}
            if (vvHasSrc(el)) n++;
        }
    } catch (e) {}
    return n;
}

// 状态机：两次采样都判后台才动作，避免主线程卡一下（解析大页面）被误判成切标签
function vvVisibilityTick() {
    try {
        if (vvTabHidden()) {
            VV._hidStreak = (VV._hidStreak || 0) + 1;
            if (!VV._bg && VV._hidStreak >= 2) vvEnterBackground();
            else if (VV._bg) vvBackgroundSweep();
        } else {
            VV._hidStreak = 0;
            if (VV._bg) vvLeaveBackground();
            else if (VV._peerReleased && VV._hib && VV._hib.length) {
                // 之前为了给别人让位拆掉了本页的播放器，现在用户真的回到这一页了：
                // 把能装回去的装回去（直链基本都能成，MSE 看站点有没有 revoke）。
                try { vvThawMedia(); } catch (eT) {}
            }
            // 前台每轮都补一次声音：只要这页在前台、没有待恢复的记录，
            // 就不该有任何元素停在我们压下去的静音态。
            try { vvRestorePageAudio(); } catch (eAH) {}
            try { vvRestorePlayerAudio(); } catch (ePH) {}
        }
    } catch (e) {}
    try { vvArmRaf(); } catch (e2) {}
}

// 后台页的补漏巡检。
//
// 为什么"进后台那一刻拆一次"不够：站点会在后台把播放器自己重建起来
// （自动连播、切集、预加载下一集、悬浮广告位），拆完又被装回去，
// 解码器一路没真正归还。这条巡检不看事件，每轮把新冒出来的管线再收走。
function vvBackgroundSweep() {
    try {
        if (VV.cfg.hibernate === false || VV.cfg.multiPlay) return;
        VV._sweepCount = (VV._sweepCount || 0) + 1;
        if (vvMediaPipelineCount() > 0) vvReleaseAllMedia('sweep');
        if (VV.playerActive && VV.active && !VV.active._mediaReleased) vvReleaseDecoder();
    } catch (e) {}
}

// 后台页禁止起播。
//
// 只"事后拆"是拉锯战：站点被定时器唤醒 → play() → 我们拆 → 它再 play()。
// 在源头挡住更省事，也避免这中间反复向 media 进程申请/释放解码器
// （那本身就会失败，还会让系统判定"解码器资源紧张"）。
// 用 NotAllowedError 而不是别的错误：这是站点最熟悉的"被自动播放策略拦了"，
// 各家播放器都有兜底（显示"点击播放"），不会白屏也不会刷错误上报。
function vvGateActive() {
    try {
        if (VV.cfg.hibernate === false) return false;
        if (VV.cfg.multiPlay) return false;
        // _yielded 是"已经答应让位给别人"，_bg 是"判定为后台"。
        // 两个都要挡：分屏时本页可能仍然可见（_bg 为 false），
        // 但它已经把解码器交出去了，站点重建播放器必须拦住。
        return !!(VV._bg || VV._yielded);
    } catch (e) { return false; }
}

// 拦"建源"比拦 play() 狠得多：拦错了，站点就再也建不出播放管线，
// 页面永远停在加载圈上——用户看到的是"卡死"，而且是不可自愈的那种。
// 所以这里用比 vvGateActive 更硬的证据：
//   · 主动让位（收到别的页签的求让）
//   · document 真的隐藏了
//   · 或者 rAF 停了且有"别的页签在台前"的证据
// 缺一条就不拦。宁可让后台页偶尔多建一条管线（下一轮 sweep 会拆掉），
// 也不能因为一次"本页卡了 2 秒"的误判把正常页面钉死。
function vvSrcGateActive() {
    try {
        if (VV.cfg.hibernate === false) return false;
        if (VV.cfg.multiPlay) return false;
        if (VV._yielded) return true;
        if (!VV._bg) return false;
        try { if (document.hidden === true || document.visibilityState === 'hidden') return true; } catch (eH) {}
        try { if (vvPeerFrontSeen()) return true; } catch (eP) {}
        return false;
    } catch (e) { return false; }
}

function vvInstallPlayGate() {
    if (VV._playGate) return;
    try {
        var proto = window.HTMLMediaElement && HTMLMediaElement.prototype;
        if (!proto || typeof proto.play !== 'function') return;
        var orig = proto.play;
        VV._playGate = orig;
        proto.play = function () {
            var blocked = false;
            try { blocked = vvGateActive(); } catch (e0) {}
            if (blocked) {
                VV._gateBlocked = (VV._gateBlocked || 0) + 1;
                VV._gateBlockedAt = Date.now();
                try { this.pause(); } catch (e1) {}
                try {
                    var p = Promise.reject(new DOMException('vv: background page', 'NotAllowedError'));
                    // 内部先挂一个空 catch：既让调用方看到标准的 NotAllowedError，
                    // 又不会在控制台刷一堆 unhandledrejection（站点常常不 catch）。
                    try { p.catch(function () {}); } catch (e2b) {}
                    return p;
                } catch (e2) {
                    return orig.apply(this, arguments);
                }
            }
            return orig.apply(this, arguments);
        };
    } catch (e) {}
}

// 后台页连"装源"这一步都不许做。
//
// 只拦 play() 是打不赢的：hls.js 那一系在后台会自己走一遍
//   src = URL.createObjectURL(new MediaSource()) → appendBuffer → play()
// 管线和解码器在 play() 之前就建好了。我们事后拆、它再建，形成"拆-建"拉锯——
// 实测 8 个 m3u8 页签里总有一两页每隔几秒就冒出一条管线（pipelines 计数在 0/1 之间跳）。
// 在 src 的 setter 上直接吞掉赋值，等于把拉锯的源头掐掉：后台页再也建不出新管线。
// 清空（v 为空）永远放行，否则站点连"停播"都做不了。
function vvSrcBlocked(el) {
    try {
        if (VV._allowSrc) return false;
        if (!el) return false;
        if (ROOT && ROOT.contains(el)) return false;   // 我们自己的播放器要用
        if (!vvSrcGateActive()) return false;
        VV._gateSrcBlocked = (VV._gateSrcBlocked || 0) + 1;
        VV._gateBlocked = (VV._gateBlocked || 0) + 1;
        VV._lastGateAt = Date.now();
        return true;
    } catch (e) { return false; }
}

function vvInstallSrcGuard() {
    if (VV._srcGuard) return;
    VV._srcGuard = true;
    function wrapCtor(C) {
        try {
            var p = C && C.prototype;
            if (!p) return;
            var d = Object.getOwnPropertyDescriptor(p, 'src');
            if (!d || !d.set) return;
            Object.defineProperty(p, 'src', {
                configurable: true,
                enumerable: !!d.enumerable,
                get: function () { return d.get.call(this); },
                set: function (v) {
                    if (v && vvSrcBlocked(this)) return;
                    d.set.call(this, v);
                }
            });
        } catch (e) {}
    }
    wrapCtor(window.HTMLMediaElement);
    wrapCtor(window.HTMLSourceElement);
    // 走属性写法（el.setAttribute('src', u)）的站点也不少，一起挡。
    // 只对 media/source 生效：img/script 的 src 跟解码器无关，别误伤。
    try {
        var sa = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function (k, v) {
            try {
                if (v && String(k || '').toLowerCase() === 'src') {
                    var tag = String(this.tagName || '').toLowerCase();
                    if ((tag === 'video' || tag === 'audio' || tag === 'source') && vvSrcBlocked(this)) return;
                }
            } catch (e0) {}
            return sa.call(this, k, v);
        };
    } catch (e) {}
}

// ---- 跨页签求让 ----
// 解码器是设备级资源，一个页签没法直接去释放另一个页签的 MediaCodec。
// 但所有页签跑的是同一个脚本、共用同一份存储，所以可以"打招呼"：
// 谁要开播就广播一条请求，别的页签看到就主动把解码器交出来。
var VV_PEER_KEY = 'releaseReq';
// GM 存储是"脚本级"的，所有站点共用一份；localStorage 是按 origin 隔离的。
// 用户真实用法是多开十个**不同**视频站 —— 那条路两边都看不见对方，
// 跨页协调完全失效，只能各页各自猜。所以再开一条 GM 通道，双通道广播。
// 能不能真读到别的页签写的值取决于壳的实现（有的只给本地缓存），所以"先探后用"：
// 一旦真的读到过别人写的值，就把 _gmBusOk 置位，自检面板能看到。
var VV_GM_BUS = 'vvbus';

function vvRequestPeerRelease() {
    var rec = { ts: Date.now(), from: vvLeaseId() };
    try { vvSharedSet(VV_PEER_KEY, rec); } catch (e) {}
    try {
        if (typeof GM_setValue === 'function') GM_setValue(VV_GM_BUS, rec);
    } catch (e2) {}
}

// 处理一条"求让"记录。viaGm 只用于标记通道是否真的通，不影响动作。
function vvPeerHandleOne(r, viaGm) {
    if (!r || !r.ts) return;
    if (r.from === vvLeaseId()) return;
    if (Date.now() - (r.ts || 0) > 8000) return;
    if (VV._peerHandled === r.ts) return;
    // 多窗口/分屏时两边都在前台，谁都"看得见"。这时按"最后一次用户操作"决胜：
    // 对方宣告得比我最近一次操作更晚，才让位；我刚点过这页就没理由让。
    if (VV._claimAt && r.ts <= VV._claimAt) return;
    VV._peerHandled = r.ts;
    if (viaGm) {
        VV._gmBusOk = true;
        VV._gmBusAt = r.ts;
    } else {
        VV._lsBusOk = true;
    }
    // 让位态：不是"暂停"，是"这页现在不该持有解码器"。
    // 它和 _bg 分开记，因为让位之后本页可能仍然 reported 可见（分屏），
    // 只靠 _bg 判断的话，站点一重建播放器就又被它占回去了。
    VV._yielded = true;
    VV._yieldedAt = Date.now();
    VV._yieldFrom = r.from || '';
    vvReleaseAllMedia('peer');
}

// 用户一碰屏幕就宣告主权。比"失焦判定"早 4 秒，而且是真凭实据：
// 手指在这页上，别的页就该让。节流 5 秒，滚动时不至于狂写存储。
function vvClaimFront() {
    var now = Date.now();
    // 8 秒节流：同一次"回到这页"里用户会连点几下，没必要每下都落一次存储。
    // 真需要更快的场景（切页签）由 vvLeaveBackground 的广播负责。
    if (VV._claimAt && now - VV._claimAt < 8000) return;
    VV._claimAt = now;
    // 我刚操作了这页 → 之前收到过的让位请求作废
    if (VV._yielded && now - (VV._yieldedAt || 0) > 800) VV._yielded = false;
    try { vvAnnounceFront(); } catch (e0) {}
    try { vvRequestPeerRelease(); } catch (e) {}
}

function vvPeerReleaseSeen() {
    try { vvPeerHandleOne(vvSharedGet(VV_PEER_KEY, null), false); } catch (e0) {}
    try {
        if (typeof GM_getValue === 'function') vvPeerHandleOne(GM_getValue(VV_GM_BUS, null), true);
    } catch (e1) {}
}

// 并行预算：并发页数越多，每页分到的缓冲与内存越少。
// 画质红线：只压缓冲与内存，不动清晰度档位——分辨率由源和 ABR 决定，
// 真要省资源由用户在画质菜单手动选低档，脚本不擅自降画质。
// 多解码器并发的兜底是默认的单实例模式，而不是压画质。
function vvApplyParallelBudget(count) {
    try {
        var inst = VV.active && VV.active.hls;
        if (!inst) return;
        var cfg = inst.config;
        var ml = count <= 1 ? 36 : count === 2 ? 20 : 12;
        var ms = count <= 1 ? 50 * 1000 * 1000 : count === 2 ? 24 * 1000 * 1000 : 12 * 1000 * 1000;
        if (cfg.maxBufferLength !== ml) cfg.maxBufferLength = ml;
        if (cfg.maxMaxBufferLength !== ml * 2) cfg.maxMaxBufferLength = ml * 2;
        if (cfg.maxBufferSize !== ms) cfg.maxBufferSize = ms;

        // 画质红线：保持 autoLevelCapping = -1（不封顶）。
        // 以前并行 2/3 页会把档位压到 ≤480P / ≤360P，用户要的原画质直接没了；
        // 并发解码器压力交给默认单实例模式与上面的缓冲预算消化。
        // 用户手选档位走 nextLevel，与 capping 互不干扰，这里不碰。
        try {
            if (inst.autoLevelCapping !== -1) inst.autoLevelCapping = -1;
        } catch (e2) {}
    } catch (e) {}
}

// 周期仲裁
function vvLeaseTick() {
    try {
        // 别的页签正在开播、请求让出解码器：这条必须在"本页在不在播"之前判断，
        // 否则本页一退出就没人理会别人的求让了。
        vvPeerReleaseSeen();
        if (!VV.playerActive || !VV.active) return;
        // 隐藏的页面不参与抢权，否则会把正在看的那一页挤掉
        if (vvTabHidden()) return;
        var url = (VV.active.item && VV.active.item.url) || '';
        var list = vvPlayersWrite(url);
        var count = 0;
        for (var k in list) count++;

        if (VV.cfg.multiPlay) {
            // 并行模式：都播，只按并发数压缩资源
            vvApplyParallelBudget(count);
            if (VV.active._suspended && VV.active._suspendReason === 'other') vvResumePlayback();
            return;
        }

        var owner = vvPlayersOwner();
        var me = vvLeaseId();
        if (count > 1 && owner && owner !== me) {
            vvSuspendPlayback('other');
        } else {
            vvApplyParallelBudget(count);
            if (VV.active._suspended && VV.active._suspendReason === 'other') vvResumePlayback();
        }
        // 兜底：挂起超过 8 秒还没恢复，就直接把解码器交出去（正常路径在进后台那一刻就交了）
        if (VV.active._suspended && VV.active._suspendAt &&
            Date.now() - VV.active._suspendAt > 8000 && !VV.active._mediaReleased) {
            vvReleaseDecoder();
        }
    } catch (e) {}
}

function vvLeaseStart() {
    vvLeaseStop();
    try {
        vvPlayersWrite((VV.active && VV.active.item && VV.active.item.url) || '');
        VV._leaseTimer = setInterval(vvLeaseTick, VV_LEASE_TICK);
    } catch (e) {}
}

function vvLeaseStop() {
    try {
        if (VV._leaseTimer) clearInterval(VV._leaseTimer);
        VV._leaseTimer = 0;
        vvPlayersUnregister();
    } catch (e) {}
}

// 重建播放实例：hls.js 实例坏掉（解码器分配失败/流中断到死）时的就地自愈，
// 不用重启浏览器。
function vvRebuildMedia() {
    try {
        if (!VV.active || !VV.active.item) { vvToast('当前没有正在播放的视频', true); return; }
        var t = VV.active._suspendT || (VID ? (VID.currentTime || 0) : 0);
        var item = VV.active.item;
        VV.active._suspendT = 0;
        vvToast('正在重建播放实例…');
        vvLoadMedia(item);
        var onMeta = function () {
            try { VID.removeEventListener('loadedmetadata', onMeta); } catch (eR) {}
            try {
                if (t > 0.5) {
                    if (VV.active && VV.active.hls) VV.active.hls.startLoad(t);
                    VID.currentTime = t;
                }
            } catch (eS) {}
        };
        try { VID.addEventListener('loadedmetadata', onMeta); } catch (eA) {}
    } catch (e) {}
}

// 页面已经卡死时的逃生门：不管播放器内部状态如何，强制拆掉界面、解除冻结
function vvForceClose() {
    try {
        if (VV._leaseTimer) clearInterval(VV._leaseTimer);
        VV._leaseTimer = 0;
        vvPlayersUnregister();
        try { if (VV.active && VV.active.hls) VV.active.hls.destroy(); } catch (e1) {}
        try { if (VID) { VID.pause(); VID.removeAttribute('src'); VID.load(); } } catch (e2) {}
        try { vvSetPageFreeze(false); } catch (e3) {}
        // 网页铺满的黑底遮罩也会让人以为「页面被冻住」，逃生门一并拆掉
        try { vvPageFsSet(false, true); } catch (ePF) {}
        try { vvResumePageMedia(); } catch (e4) {}
        try { vvStopWatchdog(); } catch (e5) {}
        try { vvStopPlayerTop(); } catch (e6) {}
        try { if (ROOT && ROOT.parentNode) ROOT.parentNode.removeChild(ROOT); } catch (e7) {}
        ROOT = null; VID = null; BRIGHT = null; TOPBAR = null; BOTBAR = null;
        CBTN = null; CSPLAY = null; CSTIME = null; CSPROG = null; CSBUF = null;
        CSCUR = null; CSPROGDOT = null; LOCKMARK = null; SEEKTIP = null; GESTIP = null; LOADING = null;
        VV.playerActive = false;
        VV.active = null;
        if (VV.items.length) vvToggleBadge(true);
        vvToast('已强制关闭播放器');
    } catch (e) {}
}

// 切换单实例 / 并行播放
function vvToggleMultiPlay() {
    VV.cfg.multiPlay = !VV.cfg.multiPlay;
    vvSet('multiPlay', VV.cfg.multiPlay);
    if (VV.cfg.multiPlay) {
        vvToast('已开启多页并行播放：多个页面可同时播放，只压缩缓冲与内存，画质不变', true);
        try { if (VV.active) vvApplyParallelBudget(vvPlayersCount()); } catch (e) {}
    } else {
        vvToast('已关闭并行播放：同一时间只允许一个页面播放（防解码器耗尽）', true);
    }
}

// ---- 全局"活跃视频页"计数 ----
// 设备解码器是全局资源，但"我这一页在播"只有本页知道。
// 每个页签在自己有在播的媒体时写一条带 TTL 的心跳，谁都能读到"现在全设备有几路在播"。
// 用途：页签多到有压力时（>=3 路），后台就别再"只暂停"，直接把 MSE 也交还，
// 否则十个视频页会一路把硬件解码器占满，最后连站点自己的播放器都起不来。
var VV_ACTIVE_PREFIX = 'vvs:active:';
var VV_ACTIVE_TTL = 12000;

function vvActiveTouch() {
    var has = false;
    try {
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el) continue;
            // 判据是"还挂着媒体管线"，不是"正在播"：
            // 暂停的 MSE 元素同样占着一条管线，只是不产生帧。
            // 用"在播"做判据的话，后台页把自己标成非活跃，压力永远算不出来。
            try {
                if (!el.ended && (el.currentSrc || el.src || el.getAttribute('src'))) { has = true; break; }
            } catch (e0) {}
        }
    } catch (e1) {}
    try {
        var k = VV_ACTIVE_PREFIX + vvLeaseId();
        // 只在"状态变了"或"心跳快过期"时才动 localStorage。
        // 这是同步磁盘操作：十几个页签每 2 秒各写一次，累积起来是实打实的主线程阻塞，
        // 还会让其它页签的 storage 回调被反复唤醒。TTL 是 12 秒，6 秒刷一次完全够。
        if (has) {
            var prev = VV._actMark || 0;
            if (!prev || Date.now() - prev > 6000) {
                localStorage.setItem(k, JSON.stringify({ ts: Date.now() }));
                VV._actMark = Date.now();
            }
        } else if (VV._actMark) {
            localStorage.removeItem(k);
            VV._actMark = 0;
        }
    } catch (e2) {}
    return has;
}

function vvActiveCount() {
    var n = 0, now = Date.now(), del = [];
    try {
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (!k || k.indexOf(VV_ACTIVE_PREFIX) !== 0) continue;
            var e = null;
            try { e = JSON.parse(localStorage.getItem(k)); } catch (e1) {}
            if (!e || now - (e.ts || 0) > VV_ACTIVE_TTL) { del.push(k); continue; }
            n++;
        }
        for (var d = 0; d < del.length; d++) { try { localStorage.removeItem(del[d]); } catch (e2) {} }
    } catch (e3) {}
    return n;
}

function vvActiveClear() {
    try { localStorage.removeItem(VV_ACTIVE_PREFIX + vvLeaseId()); } catch (e) {}
}

// ---- 真正归还一路解码器 ----
// 这是整套"播放不了"问题的根：pause() 不等于释放。
// <video> 只要还挂着资源，就握着一条完整的解码管线（demuxer + decoder + renderer），
// MediaCodec 实例不会退回系统。必须让它回到"无资源"状态：摘 src（或 srcObject）再 load()。
// 注意 load() 不能省：按 HTML 规范，removeAttribute('src') 本身不会触发资源选择算法，
// 只摘不 load，浏览器手里的播放器一动不动。
// 判断元素现在是否还攥着资源。
// 注意不能只看 getAttribute('src')：站点常用 `<source>` 子元素或直接写 el.src 属性，
// 这时属性值是 null 但元素确实有源，误判会让你把好好的播放器又"恢复"一次。
function vvHasSrc(el) {
    if (!el) return false;
    // 只看"属性/IDL"，不看 currentSrc：
    // 摘掉 src + load() 之后 currentSrc 会残留一会儿（资源选择还没跑完），
    // 拿它判断"没拆过"会让我们跳过恢复，页面就一直黑着。
    try { if (el.src) return true; } catch (e0) {}
    try { if (el.getAttribute && el.getAttribute('src')) return true; } catch (e1) {}
    return false;
}

// ---- 声音自愈 ----
//
// 为了交还解码器，我们会把 <video> 临时压成 muted=true / volume=0。
// 还原它原本只挂在几条明确的路径上（attach 成功 / thaw / 重建），
// 但真实 WebView 里"回到前台"有很多条：visibilitychange、页面冻结后 resume、
// bfcache pageshow、Via 自己的前后台切换、还有站点在后台把播放器重建一遍。
// 漏掉任何一条，用户看到的就是"切回来画面在动、一点声音没有"。
//
// 与其把每条路径都补一遍（补不完），不如在巡检里做一次幂等兜底：
// 前台、没有待恢复记录的元素，一律回到"用户原本的静音/音量"。
function vvRestorePageAudio() {
    var n = 0;
    try {
        // 后台/让位态一律不动：这时开声音等于让用户听见一个看不见的页面。
        // 等用户真的回到这页（_yielded 由 vvLeaveBackground 清掉）再补。
        if (vvTabHidden() || VV._bg || VV._yielded) return 0;
    } catch (e0) {}
    try {
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            try {
                if (!el || (ROOT && ROOT.contains(el))) continue;
                if (!el.__vvUsMuted) continue;
                if (VV._hib && VV._hib.length) {
                    // 有挂起的恢复记录：让 vvThawMedia / vvAttachMedia 走它们的流程，
                    // 这里只把"已经装回去、但还静着"的补一下。
                    var pending = false;
                    for (var j = 0; j < VV._hib.length; j++) {
                        if (VV._hib[j] && VV._hib[j].el === el) { pending = true; break; }
                    }
                    if (pending && !vvHasSrc(el)) continue;
                }
                var wantMuted = (el.__vvMuted === true);
                if (el.muted !== wantMuted) el.muted = wantMuted;
                if (!el.volume) el.volume = (typeof el.__vvVol === 'number' && el.__vvVol > 0) ? el.__vvVol : 1;
                delete el.__vvUsMuted;
                delete el.__vvMuted;
                delete el.__vvVol;
                if (!wantMuted) n++;
            } catch (e1) {}
        }
    } catch (e2) {}
    return n;
}

// 播放器自己的 <video> 同理：用户没有主动静音，就不该是静音态。
function vvRestorePlayerAudio() {
    try {
        if (!VID || !VV.playerActive) return 0;
        if (vvTabHidden() || VV._bg || VV._yielded) return 0;
        if (VID.__vvMuted !== undefined) return 0;     // 有挂起的释放，等它自己还原
        if (VV._userMuted) return 0;                   // 用户自己按的静音，别抢
        var n = 0;
        if (VID.muted) { VID.muted = false; n++; }
        if (!VID.volume) { VID.volume = (typeof VV.active === 'object' && VV.active && VV.active.vol > 0) ? VV.active.vol : 1; n++; }
        return n;
    } catch (e) { return 0; }
}

// 元素"用户原本的静音状态"。
// 不能直接用 el.muted：我们自己为了立刻止住残余音频会临时把它设成 true，
// 这时候再记录一次，就会把"临时静音"固化成用户的选择——之后每次都静音。
function vvOrigMuted(el) {
    try {
        if (el && el.__vvMuted !== undefined) return !!el.__vvMuted;
    } catch (e0) {}
    try { return !!(el && el.muted); } catch (e1) { return false; }
}

function vvDetachMedia(el) {
    if (!el) return false;
    // 和 vvHardReleaseVideo 一样：静音是临时措施，先把用户原本的状态记下来，
    // 装回去的时候（vvAttachMedia / vvThawMedia）要原样还原，否则就是"有画面没声音"。
    try { if (el.__vvMuted === undefined) el.__vvMuted = (el.muted === true); } catch (eM0) {}
    try { if (el.__vvVol === undefined) el.__vvVol = (typeof el.volume === 'number' ? el.volume : 1); } catch (eV0) {}
    try { el.pause(); } catch (e0) {}
    try {
        el.__vvUsMuted = true;
        if (el.muted !== true) {
            el.muted = true;
            if (typeof VV === 'object') { VV._muteBy = 'detach'; VV._muteCount = (VV._muteCount || 0) + 1; }
        }
    } catch (e1) {}
    try { if (el.srcObject) el.srcObject = null; } catch (e2) {}
    try { el.removeAttribute('src'); } catch (e3) {}
    // 必须连 <source> 子元素一起清：只摘 video 的 src 属性再 load()，
    // 资源选择算法会重新去选 <source src>，当场又建一条管线——
    // 等于"拆了但又装回去"，解码器一路没还。
    try { while (el.firstChild) el.removeChild(el.firstChild); } catch (e3b) {}
    try { el.load(); } catch (e4) {}
    return true;
}

// 把一路媒体装回去。直链可以直接恢复；blob/MSE 只有页面没 revoke 才有机会，
// 大部分站点在 detach 后 MediaSource 已 closed，会走到 onFail。
function vvAttachMedia(el, src, t, autoplay, onFail, muted) {
    if (!el || !src) return;
    var done = false;
    function ok() {
        if (done) return;
        done = true;
        try { el.removeEventListener('loadedmetadata', ok); } catch (eR) {}
        try { if (t > 0.5 && isFinite(t)) el.currentTime = t; } catch (eS) {}
        // 还原原来的静音状态：detach 时为了立刻省资源设了 muted，
        // 恢复后如果不还原，用户会以为视频没声音。
        try { el.muted = !!muted; } catch (eM) {}
        // 元素可能刚被"硬释放"过（volume 被压成 0）：只还原 muted 不够，
        // volume 还是 0 的话照样没声音。
        try {
            if (!el.volume) el.volume = (typeof el.__vvVol === 'number' && el.__vvVol > 0) ? el.__vvVol : 1;
        } catch (eV) {}
        try { delete el.__vvMuted; delete el.__vvVol; } catch (eDel) {}
        if (autoplay) { try { vvApAllowNext(el); } catch (eA) {} try { el.play().catch(function () {}); } catch (eP) {} }
    }
    function bad() {
        if (done) return;
        done = true;
        try { el.removeEventListener('loadedmetadata', ok); } catch (eR) {}
        // 装不回去也要把临时静音还回去：站点随后会自己重建播放器，
        // 元素如果还停在 muted=true，重建出来的是一路"有声轨但没声音"的视频。
        try { vvRestoreAudio(el); } catch (eRM) {}
        if (onFail) { try { onFail(); } catch (eF) {} }
    }
    try { el.addEventListener('loadedmetadata', ok); } catch (eL) {}
    try { el.addEventListener('error', bad, { once: true }); } catch (eE) {}
    try { el.src = src; el.load(); } catch (eA) { bad(); }
    // 有的流已经缓存在内存里，不会再派发 loadedmetadata
    setTimeout(function () { try { if (el.readyState >= 1) ok(); } catch (eT) {} }, 1200);
}

// 用户点提示条时的第一步：先不刷新，把让位时记下的**直链**源重新挂回去。
//
// 为什么不能直接刷新：刷新会把页面脚本整条重跑一遍，站点自己的播放器、
// 自动连播、甚至"新窗口播放"那套逻辑跟着一起跑——用户看到的后果就是
// "点一次重载，凭空多出一串页签"。能就地恢复就地恢复，只有 MSE
// （blob: 对应的 MediaSource 已经 closed）才真去刷新。
function vvReviveYielded() {
    var list = (VV._hib || []).slice();
    var retry = [];
    for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (it && it.src && !it.blob) retry.push(it);
    }
    if (!retry.length) return 0;
    // 本页此刻还在 _yielded 态，正常路径会故意把装源拦下来；
    // 用户亲自动手了就得放行，只放开这一小段窗口，2.5 秒后自动收回。
    VV._allowSrc = true;
    for (var j = 0; j < retry.length; j++) {
        try {
            vvAttachMedia(retry[j].el, retry[j].src, retry[j].t,
                retry[j].paused === false, null, retry[j].muted);
        } catch (e0) {}
    }
    setTimeout(function () { try { VV._allowSrc = false; } catch (e1) {} }, 2500);
    return retry.length;
}

// 被拆掉的 MSE 流装不回来了：不要静默黑屏，给一条能点的提示。
function vvMediaLost(el) {
    try {
        if (VV._lostTip && VV._lostTip.parentNode) return;
        var d = document.createElement('div');
        d.setAttribute('id', 'vv-lost-tip');
        d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:84px;z-index:2147483000;' +
            'background:rgba(24,24,28,.94);color:#fff;font:13px/1.5 -apple-system,sans-serif;' +
            'padding:10px 12px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.35);' +
            'display:flex;gap:10px;align-items:center;pointer-events:none;';
        var txt = document.createElement('span');
        txt.style.cssText = 'flex:1;';
        txt.textContent = '本页已让出视频解码器';
        var btn = document.createElement('button');
        btn.textContent = '恢复播放';
        btn.style.cssText = 'flex:none;pointer-events:auto;background:#ff5c5c;color:#fff;border:0;border-radius:6px;padding:6px 10px;font-size:12px;';
        function doReload() {
            btn.textContent = '重载中…';
            try { btn.disabled = true; } catch (eD) {}
            // 留个标记：刷新后 5 秒内不把本页判成后台（站点首屏还没挂完播放器时
            // 焦点状态经常是错的，一判后台就拆，拆完又弹条，看起来像"重载没用"）。
            try { sessionStorage.setItem('vvs:reloaded', String(Date.now())); } catch (eS) {}
            try { location.reload(); } catch (eR) {
                try { btn.disabled = false; btn._busy = false; btn.textContent = '恢复播放'; } catch (eR2) {}
            }
        }
        btn.onclick = function () {
            if (btn._busy) return;
            btn._busy = true;
            var retried = 0;
            try { retried = vvReviveYielded(); } catch (eR0) {}
            if (retried > 0) {
                btn.textContent = '恢复中…';
                setTimeout(function () {
                    var back = false;
                    try {
                        var vs = document.querySelectorAll('video');
                        for (var i = 0; i < vs.length; i++) {
                            var v = vs[i];
                            if (!v || (ROOT && ROOT.contains(v))) continue;
                            if (v.readyState >= 2 && vvHasSrc(v)) { back = true; break; }
                        }
                    } catch (eR1) {}
                    if (back) {
                        // 画面回来了就别刷新：刷新会丢页面状态，有的站点还会顺手再开播放器窗口。
                        VV._hib = null;
                        vvRemoveLostTip();
                        return;
                    }
                    doReload();
                }, 1800);
                return;
            }
            doReload();
        };
        d.appendChild(txt); d.appendChild(btn);
        (document.body || document.documentElement).appendChild(d);
        VV._lostTip = d;
        // 不自动消失：用户可能过了半分钟才切回来，这时候正是最需要这个按钮的时候。
        // 站点自己恢复出画面时由 vvRemoveLostTip() 收掉。
    } catch (e) {}
}

function vvRemoveLostTip() {
    try {
        if (VV._lostTip && VV._lostTip.parentNode) VV._lostTip.parentNode.removeChild(VV._lostTip);
        VV._lostTip = null;
    } catch (e) {}
}

// 收到别的页签的"求让"：把本页所有解码器都交出去，包括站点自己的 MSE 播放器。
// 页签之间没法直接操作对方的 MediaCodec，但大家跑同一份脚本、共用一份存储，
// 所以用一条广播来协调——对方要开播，本页立刻停手。
function vvReleaseAllMedia(reason) {
    var n = 0;
    try {
        if (VV.playerActive) {
            try { vvSuspendPlayback(reason === 'peer' ? 'other' : 'hidden'); } catch (e0) {}
            try { vvReleaseDecoder(); } catch (e0b) {}
        }
    } catch (e1) {}
    try {
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            try {
                if (!el || (ROOT && ROOT.contains(el))) continue;
                if (el.mediaKeys) continue;
                var src = el.currentSrc || el.getAttribute('src');
                if (!src) continue;
                if (!VV._hib) VV._hib = [];
                var hit = false;
                for (var j = 0; j < VV._hib.length; j++) {
                    if (VV._hib[j] && VV._hib[j].el === el) { hit = true; break; }
                }
                if (!hit) {
                    VV._hib.push({
                        el: el, src: src, blob: src.indexOf('blob:') === 0,
                        t: el.currentTime || 0, paused: !!el.paused,
                        muted: vvOrigMuted(el), deep: true
                    });
                }
                vvDetachMedia(el);
                n++;
            } catch (e2) {}
        }
    } catch (e3) {}
    // 主动交还（对方求让 / 用户点菜单让出）都进入"让位态"：
    // 之后站点再想重建播放器会被门禁拦住，否则刚让出的解码器立刻又被它占回去。
    if (reason === 'peer' || reason === 'manual') {
        VV._yielded = true;
        VV._yieldedAt = Date.now();
    }
    VV._peerReleased = true;
    VV._peerReleasedAt = Date.now();
    VV._peerReleaseCount = (VV._peerReleaseCount || 0) + n;
    VV._lastReleaseAt = Date.now();
    VV._lastReleaseWhy = reason || 'api';
    VV._releaseTotal = (VV._releaseTotal || 0) + n;
    // 一路都没拆到就别留个空数组，否则 vvHibernateMedia 的 `if (VV._hib) return`
    // 会误以为"已经休眠过"，后面的后台释放全被跳过。
    if (VV._hib && !VV._hib.length) VV._hib = null;
    return n;
}

// 页面级媒体休眠：后台标签页把原生 <video> 的 src 摘掉，
// 从而真正释放 MediaCodec（只 pause 是不会释放的，元素仍占着一个解码器）。
// 回前台再把 src 装回去并回到原进度。
// 这比浏览器级"丢弃标签页"更精确：页面状态、DOM、表单都还在，只有媒体管线被释放。
function vvHibernateMedia() {
    try {
        if (VV._hib) return;
        var list = [];
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            try {
                if (ROOT && ROOT.contains(el)) continue;             // 内置播放器另有一套
                if (el.mediaKeys) continue;                        // DRM 不动
                var src = el.currentSrc || el.getAttribute('src');
                if (!src) continue;
                // 暂停的直链也照拆：暂停的 <video> 未必已经把解码器还回去，
                // 一页一路积起来就是好几路白占着，而直链拆了能无损装回。
                // 暂停的 MSE 不拆（见下）。
                var t = el.currentTime || 0;
                var wasPaused = !!el.paused;
                if (src.indexOf('blob:') === 0) {
                    // MSE 的 blob 摘了就装不回去：站点播放器会变成永久黑屏。
                    // 所以后台只暂停（Chromium 会把暂停的 pipeline 挂起），
                    // 真正要抢解码器时（收到别的页签求让 / 本页解码失败）由
                    // vvReleaseAllMedia() 统一深拆——那条路径会明确提示用户。
                    if (wasPaused) continue;   // 暂停的 MSE 不动，拆了就回不来
                    list.push({ el: el, src: src, blob: true, t: t, paused: wasPaused, muted: vvOrigMuted(el), deep: false });
                    try { el.pause(); } catch (eB) {}
                    continue;
                }
                list.push({ el: el, src: src, t: t, paused: wasPaused, muted: vvOrigMuted(el), deep: true });
                vvDetachMedia(el);
            } catch (e3) {}
        }
        VV._hib = list.length ? list : null;
    } catch (e) {}
}

// 解码器真的不够用时的最后一招：连 blob/MSE 的页面播放器一起拆掉。
// 代价是回到这一页时站点自带的播放器可能是黑的（需要用户点一下站点的播放键让它重建），
// 所以只在"点了播放却始终没有画面"时调用。
function vvDeepHibernateBlob() {
    try {
        var els = document.querySelectorAll('video,audio');
        var n = 0;
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            try {
                if (ROOT && ROOT.contains(el)) continue;
                if (el.mediaKeys) continue;
                var src = el.currentSrc || el.getAttribute('src');
                if (!src) continue;
                vvHardReleaseVideo(el);
                n++;
            } catch (e1) {}
        }
        return n;
    } catch (e) { return 0; }
}

function vvThawMedia() {
    try {
        var list = VV._hib || [];
        VV._hib = null;
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            try {
                if (vvHasSrc(it.el)) {
                    // 保守模式没拆过：接着播就行
                    if (!it.paused) it.el.play().catch(function () {});
                    continue;
                }
                if (!it.src) continue;
                // MSE（blob:）别装回去：让位时 MediaSource 已经 closed，把 blob URL
                // 重新赋给元素只会得到一条"有管线、没数据"的假管线——pipelines 计数 +1、
                // readyState 一直是 0、画面全黑，既没恢复播放，又白占一个解码器槽位，
                // 正是我们想避免的情况。正确做法是让站点自己的播放器重建
                // （hls.js/shaka 在前台恢复定时器后会发现 media 被 reset 而自行 attach），
                // 我们只负责清干净并观察，起不来再给用户一个明确的恢复入口。
                if (it.blob) {
                    // 让位时元素被压成 muted=true / volume=0，站点重建播放器时
                    // 不会主动改回来（它只负责装源和 play），所以这里必须自己还原。
                    try { vvRestoreAudio(it.el); } catch (eRT) {}
                    try { it.el.load(); } catch (eLB) {}
                    (function (el) {
                        setTimeout(function () {
                            var rs = 0;
                            try { rs = el.readyState || 0; } catch (eRS) {}
                            if (rs < 2) vvMediaLost(el);
                            else vvRemoveLostTip();
                        }, 1800);
                    })(it.el);
                    continue;
                }
                // 被拆过的直链：装回去就行。
                vvAttachMedia(it.el, it.src, it.t, it.paused === false, (function (rec) {
                    return function () {
                        // blob 恢复失败多半不是"装不回去"，而是接管解码器需要时间：
                        // 别的页签从"发现失去焦点"到真正把 MediaCodec 交出来要几秒。
                        // 直接判死会让用户以为这页废了，隔 2.5 秒再试一次。
                        if (!rec._retried) {
                            rec._retried = true;
                            setTimeout(function () {
                                try {
                                    vvAttachMedia(rec.el, rec.src, rec.t, rec.paused === false,
                                        function () { vvMediaLost(rec.el); }, rec.muted);
                                } catch (eR) { vvMediaLost(rec.el); }
                            }, 2500);
                            return;
                        }
                        vvMediaLost(rec.el);
                    };
                })(it), it.muted);
            } catch (e) {}
        }
        VV._peerReleased = false;
    } catch (e) {}
}
// 页面隐藏时，把这个页面里所有 <video>/<audio> 都暂停：
// Android 上后台标签页不会释放 MediaCodec，只有暂停或销毁页面才会让出来。
// 这条对"不用内置播放器、就用页面原生的视频"的站点同样有效。
function vvPauseHiddenMedia() {
    try {
        if (VV._hiddenMedia) return;
        VV._hiddenMedia = [];
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            try {
                if (el && !el.paused && !el.ended) {
                    VV._hiddenMedia.push(el);
                    el.pause();
                }
            } catch (e) {}
        }
    } catch (e2) {}
}

function vvResumeHiddenMedia() {
    try {
        var list = VV._hiddenMedia || [];
        VV._hiddenMedia = null;
        for (var i = 0; i < list.length; i++) {
            try { list[i].play().catch(function () {}); } catch (e) {}
        }
    } catch (e2) {}
}

// 进入/离开后台的统一入口
//
// 这里的核心原则：**后台页签不持有任何解码器**。
// 以前是"先挂起、20 秒后再释放、而且必须存在 hls 实例"，直链 mp4 和刚切走的那十几秒
// 全都在占着 MediaCodec；几个页签一起来就是"新页签能加载但播不动"。
function vvEnterBackground() {
    try {
        if (VV._bg) return;
        // 刚刷新完的 5 秒宽限（见 vvSetupLifecycle）：这段时间不判后台，
        // 否则首屏还没起播就被拆，用户点完"重载"只会看到一个当场黑掉的页面。
        if (VV._bgGraceUntil && Date.now() < VV._bgGraceUntil) return;
        VV._bg = true;
        VV._bgAt = Date.now();        VV._bgCount = (VV._bgCount || 0) + 1;
        try { if (VV._hibTimer) { clearTimeout(VV._hibTimer); VV._hibTimer = 0; } } catch (e0) {}
        try { vvFlushLazy(); } catch (eF) {}
        try { vvSaveNow(); } catch (eS) {}
        // 1) 页面自带的播放器：一律深度交还，不问"全局有几路在播"。
        //
        // 这里是整套机制的核心约束：**非当前页不持有任何解码器**。
        // 以前是"全局活跃 >=3 路才深拆"，两个问题叠在一起让它从不生效：
        //   a) 那个计数存在 localStorage 里，而 localStorage 是按 origin 隔离的，
        //      用户开的十个页签是十个不同站点 → 每页都只数到自己 1 路，永远到不了 3；
        //   b) 默认分支对 blob/MSE 只 pause()，而 pause 根本不归还 MediaCodec。
        // 结果就是十个页签、九个后台页各攥一路硬件解码器，第十个"能加载、出不来画面"。
        if (VV.cfg.hibernate === false) {
            try { vvPauseHiddenMedia(); } catch (eH0) {}
        } else {
            try { vvHibernateMedia(); } catch (eH) {}
            try { vvPauseHiddenMedia(); } catch (eP) {}
            try { vvReleaseAllMedia('bg'); } catch (eRA) {}
        }
        // 2) 我们的播放器：立刻彻底交还解码器，回到前台再整条重建
        if (VV.playerActive) {
            try { vvSuspendPlayback('hidden'); } catch (e1) {}
            try { vvPlayersUnregister(); } catch (e2) {}
            try { vvReleaseDecoder(); } catch (e3) {}
        }
    } catch (e) {}
}

function vvLeaveBackground() {
    try {
        VV._bg = false;
        VV._bgAt = 0;
        // 回到前台 = 这一页重新持有解码器，之前答应的"让位"作废。
        // 清理时也把 _claimAt 一并更新：否则刚回前台就被别人一条更早的求让按下去。
        VV._yielded = false;
        VV._claimAt = Date.now();
        try { if (VV._hibTimer) { clearTimeout(VV._hibTimer); VV._hibTimer = 0; } } catch (e0) {}
        // 先宣告"我回到前台了"：别的页签读到就立刻让位（同源还有 storage 事件即时触发）。
        // 跨站的靠 GM 通道，两条都不通就只能等对方自己失焦判定。
        try { vvAnnounceFront(); } catch (eF) {}
        try { vvRequestPeerRelease(); } catch (eC) {}
        try { vvThawMedia(); } catch (e1) {}
        try { vvResumeHiddenMedia(); } catch (e2) {}
        // 关播放器时因为在后台而没恢复的页面视频，等回到前台再补上
        try {
            var d = VV._pageMediaDeferred;
            if (d && d.length) {
                VV._pageMediaDeferred = [];
                if (typeof vvResumePageMediaNow === 'function') vvResumePageMediaNow(d);
            }
        } catch (e2b) {}
        if (VV.playerActive && VV.active) {
            try { vvLeaseTick(); } catch (e3) {}
            try { vvResumePlayback(); } catch (e4) {}
        }
        // 回前台立刻补一次声音：巡检是 900ms 一轮，够快但用户能听出来那一下。
        try { vvRestorePageAudio(); } catch (eAH2) {}
        try { vvRestorePlayerAudio(); } catch (ePH2) {}
    } catch (e) {}
}

// 有些 WebView 壳切标签时根本不派发 visibilitychange，
// 所以额外用 rAF 心跳 + 焦点轮询兜底（见 vvVisibilityTick）。
function vvFocusPoll() {
    vvVisibilityTick();
}

// 页面即将被销毁时的清理：关标签页 / 导航离开 / WebView 被系统回收。
//
// 这条路径和"点播放器返回"完全是两回事：它不会进 closePlayer()，而且页面一销毁，
// 所有 setTimeout、微任务、异步回调都不再执行——所以这里必须全部同步做完，
// 任何"等一下再释放"的兜底都等不到。
//
// final=true 表示页面确定要没了（pagehide 且非 bfcache），此时连定时器一起清掉。
// final=false 用于 beforeunload 这种"可能还会进 bfcache 活过来"的场合，只物理释放。
var _vvTornDown = false;
// beforeunload 与 pagehide 会先后各调一次，两次都做全量媒体释放等于把同一件事干两遍。
// 页面上摆着几十个 <video>（预加载、广告位、连播预览）的站点，这两遍会明显拖慢关页签——
// 用户感知就是"点关闭，浏览器卡住两秒才反应"。只做一次即可。
var _vvReleasedOnce = false;
function vvHardTeardown(final) {
    // 留下时间戳：真机上关标签页后没法回看日志，只能靠这个外部可读的痕迹判断
    // "是我们清理的"还是"WebView 自己回收的"，排查释放类问题离不开它。
    try { VV._lastTeardown = Date.now(); } catch (eTS) {}
    // 关页签时把自己的"活跃视频页"心跳撤掉，否则别的页会以为这一路还在播，
    // 后台压力判断被幽灵条目顶高，白白多拆解码器。
    try { vvActiveClear(); } catch (eAC) {}
    // 定时器清理和媒体释放分开去重：beforeunload 可能先来（只做释放），
    // pagehide 后到（必须把定时器也停掉）。合成一个标记会让后到的那次什么都不做，
    // 页面在 bfcache 里还会被自己的巡检叫醒。
    if (final) {
        if (_vvTornDown) {
            // 已经彻底清过一轮，后面再来的都是重复事件
        } else {
            _vvTornDown = true;
            try { if (VV._hibTimer) { clearTimeout(VV._hibTimer); VV._hibTimer = 0; } } catch (e0) {}
            try { if (VV._focusTimer) { clearInterval(VV._focusTimer); VV._focusTimer = 0; } } catch (e0b) {}
            try { if (ROOT) clearTimeout(ROOT._csTimer); } catch (e0c) {}
            try { vvStopLoadTick(); } catch (e0d) {}
            try { vvLeaseStop(); } catch (e1) {}
        }
    }
    if (_vvReleasedOnce) return;
    _vvReleasedOnce = true;
    // hls 实例池可能不止一个（重建失败、旧实例 destroy 抛错都会留下残余），全清。
    try { vvKillAllHls(); } catch (e2) {}
    // 直链 mp4 没有 hls 实例，上面这步完全管不到它。必须单独硬释放播放器自己的 video，
    // 否则关掉标签后 MediaCodec 会一直挂着，直到 WebView 进程被回收。
    try { vvHardReleaseVideo(VID); } catch (e3) {}
    // 站点自带的播放器也一起还回去：标签都要关了，没有理由让它继续占着解码器。
    // 用查 DOM 而不是靠 VID，因为 closePlayer 之后 VID 已经被置成 null 了。
    //
    // 只处理"真的挂着源"的元素，而且最多 12 个：
    // 广告站/信息流页面上常有几十个预加载的空 <video>，对每个都 removeAttribute + load()
    // 是纯浪费（系统解码器上限本来只有个位数，后面的不可能各自持有管线），
    // 而关页签这条路径是同步执行的，拖慢的每一毫秒都直接体现在"点了没反应"。
    try {
        var vs = document.querySelectorAll('video,audio');
        var rel = 0;
        for (var i = 0; i < vs.length && rel < 12; i++) {
            var el = vs[i];
            if (!el || el === VID) continue;
            var hs = false;
            try { hs = !!(el.getAttribute('src') || el.src || el.srcObject); } catch (eHS) {}
            if (!hs) continue;
            vvHardReleaseVideo(el);
            rel++;
        }
    } catch (e4) {}
    try {
        if (VV.active) {
            VV.active.hls = null;
            VV.active._inst = null;
            // 标成已挂起：万一页面进了 bfcache 又被恢复，vvResumePlayback 靠这个标记重建
            VV.active._suspended = true;
            VV.active._suspendReason = 'hidden';
        }
    } catch (e5) {}
}

// 全局生命周期：页面隐藏时挂起并让出播放权，页面关闭时彻底销毁实例释放解码器
function vvSetupLifecycle() {
    if (VV._lifeReady) return;
    VV._lifeReady = true;
    // 刚点过"重载"的页面：给 5 秒宽限，别在首屏加载期就把它判成后台。
    // 刷新后站点还没挂完播放器，焦点/可见性常常是错的值，一判后台就拆，
    // 拆完又弹"已让出解码器"，用户看到的就是"重载没用，还多了个提示"。
    try {
        if (sessionStorage.getItem('vvs:reloaded')) {
            sessionStorage.removeItem('vvs:reloaded');
            VV._bgGraceUntil = Date.now() + 5000;
        }
    } catch (eRG) {}
    // 后台页不许新建媒体管线（拦 src 赋值），比拦 play() 更靠前一步。
    try { vvInstallSrcGuard(); } catch (eSG) {}
    // 脚本一加载就宣告"我在前台"。
    // 新开的页签通常就是用户想看的那一个，其它页签收到就立刻让位，
    // 不用等它们自己发现失焦（那条要 4 秒）。跨站走 GM 通道，都收不到就靠失焦/停帧。
    try {
        if (!vvTabHidden()) {
            VV._claimAt = Date.now();
            vvAnnounceFront();
            vvRequestPeerRelease();
        }
    } catch (e0i) {}
    // 手指一碰屏幕就宣告主权：比"失焦 4 秒"早得多，而且是真凭实据——手指在这页上。
    try {
        var claim = function () { vvClaimFront(); };
        document.addEventListener('touchstart', claim, { passive: true, capture: true });
        document.addEventListener('pointerdown', claim, { passive: true, capture: true });
        document.addEventListener('keydown', claim, true);
    } catch (e0c) {}
    try {
        document.addEventListener('visibilitychange', function () {
            // 事件到了就直接动作，不用等轮询（轮询是给"事件不到"的壳兜底的）
            if (document.hidden) vvEnterBackground();
            else vvLeaveBackground();
            vvArmRaf();
        });
    } catch (e2) {}
    try {
        vvArmRaf();
        vvInstallPlayGate();
        VV._focusTimer = setInterval(vvFocusPoll, 900);
    } catch (e2b) {}
    // 常驻的"求让"监听：没打开内置播放器的页签也必须能被叫醒。
    // 这条以前只挂在 vvLeaseTick 里，而那个定时器只有打开播放器才启动，
    // 于是"只用站点原生播放器"的页签永远不会让位——多页签播放不动的另一半原因。
    try {
        if (VV._peerTimer) clearInterval(VV._peerTimer);
        VV._peerTimer = setInterval(function () {
            try { vvPeerReleaseSeen(); } catch (e) {}
            try { vvActiveTouch(); } catch (eA) {}
        }, 2000);
    } catch (e2p) {}
    // storage 事件：别的页签一广播就能立刻响应，不用等 2 秒轮询。
    // localStorage 的这个事件只在"其它页签"触发，正好是要的方向。
    try {
        window.addEventListener('storage', function (ev) {
            try {
                if (!ev || !ev.key) return;
                if (ev.key === VV_SHARED_PREFIX + VV_PEER_KEY) vvPeerReleaseSeen();
            } catch (e) {}
        });
    } catch (e2s) {}
    try {
        window.addEventListener('focus', function () {
            // 焦点回来只做"离开后台"的判定，是否真的可见交给 vvVisibilityTick，
            // 避免个别壳里焦点乱跳时反复重建播放管线
            vvVisibilityTick();
            vvArmRaf();
        });
        window.addEventListener('blur', function () {
            // 注意：地址栏、菜单、系统弹窗都会触发 blur，不能一见 blur 就拆解码器。
            // 交给 600ms 后的判定：只有 rAF 也停了（=页面真的不可见）才算进后台。
            setTimeout(function () { try { vvVisibilityTick(); } catch (eB) {} }, 600);
        });
    } catch (e2c) {}
    try {
        window.addEventListener('pagehide', function (ev) {
            try {
                if (ev && ev.persisted) {
                    // 进 bfcache：页面还活着，但已经不可见了——照样要把解码器交出去，
                    // 回来时由 pageshow 整条重建
                    vvEnterBackground();
                    return;
                }
                // 真正要走了（关标签页 / 导航走 / 页面被回收）
                vvHardTeardown(true);
            } catch (e4) {}
        });
    } catch (e5) {}
    // 关页面前的最后一次机会。有些内核 pagehide 派发得晚甚至不派发，
    // 这一层更早、更稳；因为页面可能还会进 bfcache 活过来，这里不置永久标记。
    try {
        window.addEventListener('beforeunload', function () {
            try { vvHardTeardown(false); } catch (eb) {}
        });
    } catch (e5b) {}
    // Page Lifecycle 的 freeze：页面被冻结时 CPU 已挂起，解码器还挂在 media 进程里。
    // 这里立刻归还；解冻（resume）后走正常的重建逻辑。
    try {
        document.addEventListener('freeze', function () {
            try { vvEnterBackground(); } catch (ez) {}
        });
        document.addEventListener('resume', function () {
            try { vvVisibilityTick(); } catch (ez2) {}
        });
    } catch (e5c) {}
    // 从 bfcache 恢复：上一次 pagehide/beforeunload 可能已经把 _vvTornDown 置位，
    // 不复位的话，恢复后再关标签页就永远不会再清理了（静默失效，最难查的一类）。
    try {
        window.addEventListener('pageshow', function (ev) {
            try {
                _vvTornDown = false;
                _vvReleasedOnce = false;
                if (ev && ev.persisted && VV.playerActive) vvLeaveBackground();
            } catch (ep) {}
        });
    } catch (e5d) {}
}
function vvSetupMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    try {
        GM_registerMenuCommand('嗅探结果面板', function () { vvOpenPanel(); });
        GM_registerMenuCommand('选集（打开剧集列表）', vvEpisodesOpen);
        // 「网页铺满」= 把站点自己的播放器放大到整个可视区，不进系统全屏。
        // 它不碰 Via 的地址栏/底部工具栏（那些是 WebView 之外的系统 UI）。
        // 播放器顶栏那枚「沉浸全屏」是另一套（会隐藏栏），两者互斥。
        GM_registerMenuCommand('网页铺满 开/关（放大站点播放器）', vvTogglePageFullscreen);
        // 点了没反应时先点这里：会说明页面里到底有几个 video / iframe / canvas，
        // 以及脚本最后把哪个元素当成「主画面」，不用猜。
        GM_registerMenuCommand('网页铺满 诊断（点了没反应时用）', vvPageFsDiagnose);
        GM_registerMenuCommand('开启/关闭嗅探（全局）', vvToggleGlobal);
        GM_registerMenuCommand('本站启用/禁用嗅探', vvToggleSite);
        GM_registerMenuCommand('默认倍速（点击切换）', vvCycleSpeed);
        GM_registerMenuCommand('重建播放实例（解码失败/卡死时用）', vvRebuildMedia);
        GM_registerMenuCommand('多页并行播放（当前：' + (VV.cfg.multiPlay ? '开' : '关') + '）', vvToggleMultiPlay);
        GM_registerMenuCommand('后台释放解码器 / 标签页休眠（当前：' + (VV.cfg.hibernate ? '开' : '关') + '）', vvToggleHibernate);
        GM_registerMenuCommand('选集跳页后自动播放（当前：' + (VV.cfg.epAutoPlay ? '开' : '关') + '）', vvToggleEpAutoPlay);
        GM_registerMenuCommand('播放界面毛玻璃（当前：' + (VV.cfg.lowFx ? '关·省电' : '开') + '）', vvToggleLowFx);
        GM_registerMenuCommand('强制关闭播放器（页面卡死时用）', vvForceClose);
        GM_registerMenuCommand('资源释放自检（退出后卡顿/不释放时用）', vvReleaseAudit);
        GM_registerMenuCommand('本页让出解码器（其它页面要用）', vvForceRelease);
        GM_registerMenuCommand('清除所有播放进度', vvClearProgress);
        GM_registerMenuCommand('自检（排查未生效）', vvSelfCheck);
        GM_registerMenuCommand('选集 诊断（列表没出来时用）', vvEpisodesDiagnose);
        GM_registerMenuCommand('关于', vvAbout);
    } catch (e) {}
}

function vvToggleGlobal() {
    VV.cfg.enabled = !VV.cfg.enabled;
    vvSet('enabled', VV.cfg.enabled);
    if (VV.cfg.enabled) vvToast('嗅探已开启，刷新页面生效', true);
    else {
        VV.items.length = 0;
        VV.seen = {};
        try { vvToggleBadge(false); } catch (e) {}
        vvToast('嗅探已关闭，刷新页面生效', true);
    }
}

function vvToggleSite() {
    var key = 'offsite:' + location.hostname;
    var off = vvGet(key, false);
    vvSet(key, !off);
    VV.cfg.siteOff = !off;
    vvToast((off ? '本站嗅探已开启' : '本站嗅探已禁用') + '，刷新页面生效', true);
}

function vvCycleSpeed() {
    var opts = [1, 1.25, 1.5, 2, 3];
    var cur = parseFloat(VV.cfg.speed) || 1;
    var idx = opts.indexOf(cur);
    var next = opts[(idx + 1 + opts.length) % opts.length];
    VV.cfg.speed = next;
    vvSet('speed', String(next));
    vvToast('默认倍速：' + (next === 1 ? '正常' : next + 'x') + '（打开播放器时生效）', true);
}

function vvToggleHibernate() {
    VV.cfg.hibernate = !VV.cfg.hibernate;
    vvSet('hibernate', VV.cfg.hibernate);
    if (VV.cfg.hibernate) {
        vvToast('已开启标签页休眠：切到后台时把页面视频的解码器也交出去（多页签更稳）', true);
    } else {
        vvToast('已关闭页面媒体休眠：后台页签会继续占着页面播放器的解码器，多开几页可能播不动内置播放器', true);
    }
}

function vvClearProgress() {
    vvSet('progress', {});
    VV._pmap = {};
    vvToast('播放进度已清空');
}

function vvToggleEpAutoPlay() {
    VV.cfg.epAutoPlay = !VV.cfg.epAutoPlay;
    vvSet('epAutoPlay', VV.cfg.epAutoPlay);
    vvToast(VV.cfg.epAutoPlay
        ? '选集跳页后会自动播放那一集'
        : '选集跳页后只打开页面，不自动播放', true);
}

// 播放态低特效：配置项要立刻同步到播放器根层，否则改了设置得等下次开播放器才生效。
// 真机实测半屏 blur(20px) 让菜单展开时的长帧率从 0.2% 涨到 29.9%，所以默认关毛玻璃；
// 这个开关给想保留观感的用户留一条退路。
function vvToggleLowFx() {
    VV.cfg.lowFx = !VV.cfg.lowFx;
    vvSet('lowFx', VV.cfg.lowFx);
    try { vvSyncLowFx(); } catch (e) {}
    vvToast(VV.cfg.lowFx
        ? '已开启播放界面省电：菜单与加载框不再做毛玻璃，播放更稳'
        : '已恢复毛玻璃：观感更好，低端设备展开菜单时可能掉帧', true);
}

function vvSelfCheck() {
    var L = [];
    L.push('脚本已加载 ✓');
    L.push('页面: ' + location.href.slice(0, 60));
    L.push('本站嗅探: ' + (VV.cfg.siteOff ? '被禁用！(菜单里启用)' : '正常'));
    L.push('全局嗅探: ' + (VV.cfg.enabled ? '正常' : '被关闭！(菜单里开启)'));
    try { L.push('XHR 钩子: ' + (String(XMLHttpRequest.prototype.open).indexOf('_vvUrl') >= 0 ? '已装 ✓' : '未生效 ✗')); } catch (e) { L.push('XHR 钩子: 异常'); }
    try { L.push('hls.js: ' + (window.Hls && Hls.isSupported() ? '内置可用' : '缺失(仅影响m3u8)')); } catch (e2) { L.push('hls.js: 异常'); }
    try { L.push('资源计时: ' + (window.PerformanceObserver ? 'PerformanceObserver 已启用' : '定时补扫')); } catch (e6) {}
    try { L.push('GM API: ' + ['GM_getValue', 'GM_download', 'GM_xmlhttpRequest'].filter(function (f) { return eval('typeof ' + f) === 'function'; }).length + '/3 可用'); } catch (e3) {}
    L.push('嗅探记录: ' + VV.items.length + ' 条');
    try { L.push('页内 <video>: ' + document.querySelectorAll('video').length + ' 个'); } catch (e4) {}
    if (VV._moTimer !== undefined) L.push('DOM 监听: 已启动 ✓');
    if (VV.err) L.push('脚本错误: ' + VV.err.msg.slice(0, 100));
    try { L.push('UA: ' + navigator.userAgent.slice(0, 60)); } catch (e5) {}
    alert('自检结果（复制反馈给开发者）\n\n' + L.join('\n'));
}

// 真机专用：桌面浏览器没有 MediaCodec，这类问题只能在手机上观察。
// 这里把"播放器退场后还占着资源"的证据摊开，用户照屏幕念/截图就能定位。
function vvReleaseAudit() {
    var L = [];
    var pool = 0;
    try { pool = (VV._hlsPool || []).length; } catch (e0) {}
    var root = null;
    try { root = document.getElementById('vv-player-root'); } catch (e1) {}

    L.push('播放器层: ' + (root ? '还在页面里 ✗' : '已移除 ✓'));
    L.push('hls 实例残留: ' + pool + (pool ? ' 个 ✗' : ' ✓'));
    try { if (window.Hls) L.push('hls.js: ' + (window.Hls.version || '已加载')); } catch (e2) {}

    try {
        var vs = document.querySelectorAll('video');
        L.push('页内 video: ' + vs.length + ' 个');
        var busy = 0;
        for (var i = 0; i < vs.length && i < 5; i++) {
            var v = vs[i];
            var src = '';
            try { src = v.currentSrc || v.src || ''; } catch (eS) {}
            var kind = src.indexOf('blob:') === 0 ? 'MSE/自建' : (src ? '直链' : '无源');
            if (!v.paused || v.readyState > 1) busy++;
            L.push('  · rs=' + v.readyState + ' ' + (v.paused ? '暂停' : '播放中') + ' ' + kind);
        }
        if (vs.length > 5) L.push('  · 其余 ' + (vs.length - 5) + ' 个略');
        if (!root && busy === 0) L.push('状态: 解码器应已全部让出 ✓');
    } catch (e3) {}

    L.push('本次打开播放器: ' + (VV._openCount || 0) + ' 次');
    L.push('累计销毁实例: ' + (VV._killCount || 0) + ' 个');
    try {
        var rafGap = VV._rafSeen ? Math.round((Date.now() - (VV._rafLast || 0)) / 100) / 10 : -1;
        L.push('前台判定: ' + (vvTabHidden() ? '后台（已释放）' : '前台') +
            ' / rAF 间隔 ' + (rafGap < 0 ? '未采样' : rafGap + 's') +
            ' / 进后台 ' + (VV._bgCount || 0) + ' 次');
    } catch (e6) {}
    try {
        var mc = 0, ms = 0;
        var vs2 = document.querySelectorAll('video,audio');
        for (var j = 0; j < vs2.length; j++) {
            mc++;
            try { if (vs2[j].currentSrc || vs2[j].getAttribute('src')) ms++; } catch (eM) {}
        }
        L.push('本页媒体管线: ' + mc + ' 个（带 src 的 ' + ms + ' 个 = 可能各占一个解码器）');
    } catch (e7) {}
    try {
        var le = VV._lastHlsErr;
        if (le) {
            L.push('最近 hls 错误: ' + (le.type || '?') + ' / ' + (le.details || '?') +
                (le.code ? ' / HTTP ' + le.code : '') +
                ' (fatal=' + (le.fatal ? '是' : '否') + ', ' + Math.round((Date.now() - le.at) / 1000) + ' 秒前)');
        }
    } catch (e10) {}
    try {
        var r = VV._lastRescue;
        if (r) L.push('最近一次解码器自救: ' + r.why + '（第 ' + r.n + ' 次）/ ' + Math.round((Date.now() - r.ts) / 1000) + ' 秒前');
    } catch (e8) {}
    try {
        L.push('跨页协调: 常驻监听 ' + (VV._peerTimer ? '开 ✓' : '关 ✗') +
            ' / 被叫停后拆掉 ' + (VV._peerReleaseCount || 0) + ' 路' +
            (VV._peerReleased ? '（当前让位中）' : ''));
    } catch (e9) {}
    try {
        var a = VV._lastAudit;
        if (a) {
            var ago = Math.round((Date.now() - a.ts) / 1000);
            L.push('上次退出 +0.9s: 实例 ' + a.pool + ' / video ' + a.videos + ' / 层 ' + (a.root ? '还在' : '已移除') + '（' + ago + ' 秒前）');
        } else L.push('上次退出: 还没有关闭过播放器');
    } catch (e4) {}

    try {
        if (performance.memory) L.push('JS 堆: ' + Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB');
    } catch (e5) {}

    L.push('UA: ' + navigator.userAgent.slice(0, 48));

    alert('资源释放自检\n\n' + L.join('\n') +
        '\n\n判读：\n· 「播放器层」应为已移除\n· 「hls 实例残留」应为 0\n· 退出后页面 video 仍「播放中/MSE」= 解码器被占\n\n仍不正常就点菜单「本页让出解码器（其它页面要用）」，看是否立刻恢复。');
}

function vvForceRelease() {
    var n = 0;
    try { n = (VV._hlsPool || []).length; } catch (e0) {}
    try { vvKillAllHls(); } catch (e1) {}
    var cnt = 0;
    try { if (VID) { vvHardReleaseVideo(VID); cnt++; } } catch (e2) {}
    try {
        var root = document.getElementById('vv-player-root');
        if (root) {
            var vs = root.querySelectorAll('video');
            for (var i = 0; i < vs.length; i++) { vvHardReleaseVideo(vs[i]); cnt++; }
            try { if (root.parentNode) root.parentNode.removeChild(root); } catch (eR) {}
        }
    } catch (e3) {}
    try {
        var left = (VV._hlsPool || []).length;
        // 站点自己的播放器也一起交还：多页签"播不动"多半是它们占着硬件解码器，
        // 只放我们自己的播放器等于没放。
        var pageN = 0;
        try { pageN = vvReleaseAllMedia('manual'); } catch (eP) {}
        alert('已强制释放\n\n· hls 实例: ' + n + ' 个\n· 播放器 video: ' + cnt + ' 个' +
            '\n· 本页其它媒体（含站点播放器）: ' + pageN + ' 个' +
            '\n· 残留实例: ' + left +
            '\n\n页面立刻恢复 → 问题在释放链，请把「自检」截图给我。\n毫无变化 → 占用来自其它页签，请在那些页签里也点一次。');
    } catch (e4) {}
}

function vvAbout() {
    try {
        alert('Via 视频嗅探播放器 v' + VV.version +
            '\n\n功能：视频嗅探·网页铺满（放大站点播放器）·全屏手势播放器·选集·倍速·进度记忆·m3u8·连播·下载' +
            '\n\n使用：嗅探角标出现后点击打开列表；▶ 播放进内置播放器；播放器顶栏「选集」可切换剧集。' +
            '\n\n限制：部分站点加密流（blob）无法导出；m3u8 下载需第三方工具；用 JS 原地切集且页面不吐出新地址的站点，选集只能替你点一下元素。' +
            '\n\n作者：ViaModes · 本地运行，不上传任何数据');
    } catch (e) {}
}

function vvConsumeAutoNext() {
    try {
        var f = vvGet('autoNextLast', null);
        if (f && Date.now() - f.ts < 240000) {
            vvDel('autoNextLast');
            // 用户关掉「选集跳页后自动播放」时，标记照样消费掉，只是不打开播放器
            if (f.why === 'ep' && !VV.cfg.epAutoPlay) return;
            setTimeout(function () {
                try {
                    var cand = null;
                    for (var i = 0; i < VV.items.length; i++) {
                        if (VV.items[i].type !== 'BLOB') { cand = VV.items[i]; break; }
                    }
                    if (cand && VV.playerActive === false) {
                        vvToast(f.why === 'ep'
                            ? '选集：自动播放第 ' + (f.num === undefined ? '' : f.num) + ' 集'
                            : '连播：自动续播下一集', true);
                        openPlayer(cand);
                    }
                } catch (e2) {}
            }, 3000);
        }
    } catch (e) {}
}
// ============================================================
// 网页铺满（原名「页面全屏」）
//
// 做的事只有一件：把站点自己的播放器（video / iframe / canvas）铺满
// WebView 可视区，不用先打开嗅探播放器。**不调用** requestFullscreen()。
//
// 关于浏览器栏的边界（实测结论，别再按「保留状态栏」来宣传）：
//   · 我们从不碰 Via 的地址栏 / 底部工具栏，它们是 WebView 之外的系统 UI；
//   · 栏显示与否 100% 由 Via 自己的「下滑隐藏、上滑显示」决定，
//     用 scrollTo 这类程序化滚动叫不回来（没有手势，Via 不认）；
//   · 所以本文件也不锁页面滚动 —— 锁了就既叫不回栏、也让用户没法自己上滑。
//
// 它和播放器顶栏那枚「沉浸全屏」是两种独立模式：
//   · 网页铺满   = 网页层（本文件，脚本菜单 / 顶栏按钮）
//   · 沉浸全屏   = ROOT.requestFullscreen()，系统全屏，栏被隐藏
//
// 实现上只用 class + !important CSS，不写目标元素的 inline style、不移动
// video 节点：MSE/blob 流靠 DOM 位置活着，搬一次 DOM 就黑屏；
// 退出时摘 class 即可，页面样式零残留。
//
// 取目标按「实际能看见的画面」来挑，因为真实站点里视频不一定老老实实
// 躺在顶层文档的 <video> 里：
//   · <video> 在 open shadow root 里（自研播放器很常见）
//   · <video> 在 iframe 里（第三方播放器 / 站点用 iframe 隔离播放页）
//   · 画面被画到 <canvas> 上，<video> 只是 0 尺寸的解码器
// 这三种以前都会「点了没反应」，现在分别有对应兜底。
// ============================================================

if (!VV._pageFs) {
    VV._pageFs = {
        on: false,          // 菜单开关状态
        bound: false,       // document 级事件只绑一次
        timer: 0,           // 1.5s 巡检：视频延迟插入 / 被移除 / 播放器切换
        deepAt: 0,          // 上次深挖 shadow root 的时间（限制频率）
        deepPick: null,     // 深挖到的 shadow 视频
        video: null,        // 当前被铺满的 <video>（仅 kind=video）
        iframe: null,       // 当前被铺满的 <iframe>（仅 kind=iframe）
        canvas: null,       // 当前被铺满的 <canvas>（仅 kind=canvas）
        target: null,       // 实际挂 class 的元素（上面三者之一）
        kind: '',           // 'video' | 'iframe' | 'canvas'
        anc: [],            // 临时清掉 containing block 的祖先
        inner: null,        // iframe 内部（同源时）的注入记录
        shade: null,        // 黑底遮罩
        exit: null,         // 可见的退出按钮（Via 没有 Esc，必须有出口）
        suspended: false    // 内置播放器打开时暂时挂起
    };
}

// iframe 内部注入的样式：iframe 被拉满后，里面的 video 还得跟着满，
// 否则只会得到「大黑框里一个小画面」。
var VV_PAGEFS_INNER_CSS =
    '.vv-pagefs-inner-anc{transform:none!important;-webkit-transform:none!important;' +
    'filter:none!important;-webkit-filter:none!important;perspective:none!important;' +
    'will-change:auto!important;contain:none!important;' +
    'backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' +
    '.vv-pagefs-inner-video{position:fixed!important;left:0!important;top:0!important;' +
    'width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;' +
    'min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;' +
    'border:0!important;border-radius:0!important;object-fit:contain!important;' +
    'background:#000!important;opacity:1!important;visibility:visible!important;' +
    'z-index:2147483001!important}';

var VV_PAGEFS_ANC_PROPS = ['transform', '-webkit-transform', 'filter', '-webkit-filter',
    'perspective', 'will-change', 'contain', 'backdrop-filter', '-webkit-backdrop-filter'];

function vvPageFsState() {
    var st = VV._pageFs, sys = null;
    try { sys = document.fullscreenElement || document.webkitFullscreenElement || null; } catch (eS) {}
    return {
        on: !!st.on,
        suspended: !!st.suspended,
        video: !!st.video,
        target: !!st.target,
        kind: st.kind || '',
        iframe: !!st.iframe,
        canvas: !!st.canvas,
        anc: (st.anc || []).length,
        shade: !!st.shade,
        exit: !!st.exit,
        timer: !!st.timer,
        bound: !!st.bound,
        sys: !!sys,
        player: !!VV.playerActive
    };
}

function vvPageFsWin(el) {
    try {
        var d = el && el.ownerDocument;
        if (d && d.defaultView) return d.defaultView;
    } catch (e) {}
    return window;
}

// 元素是否真的「看得见」：0 尺寸、display:none、opacity:0 的都不算。
function vvPageFsVisible(el) {
    if (!el) return false;
    try {
        var cs = vvPageFsWin(el).getComputedStyle ? vvPageFsWin(el).getComputedStyle(el) : null;
        if (cs) {
            var disp = cs.display || '', vis = cs.visibility || '', op = cs.opacity;
            if (disp === 'none' || vis === 'hidden' || vis === 'collapse') return false;
            if (op !== undefined && op !== '' && parseFloat(op) === 0) return false;
        }
    } catch (eC) {}
    try {
        var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
        if (r && (r.width < 2 || r.height < 2)) return false;
    } catch (eR) {}
    return true;
}

function vvPageFsArea(el) {
    try {
        var r = el.getBoundingClientRect();
        return Math.max(0, r.width) * Math.max(0, r.height);
    } catch (e) { return 0; }
}

// 是不是脚本自己播放器里的元素（跨 shadow 边界往上找）
function vvPageFsOwned(el) {
    var n = el, guard = 0;
    while (n && guard++ < 48) {
        try { if (n.closest && n.closest('#vv-player-root,.vv-player-root,#vv-pagefs-exit')) return true; } catch (e) {}
        var root = null;
        try { root = n.getRootNode ? n.getRootNode() : null; } catch (e2) {}
        if (root && root.host) { n = root.host; continue; }
        n = n.parentNode || null;
    }
    return false;
}

// 收集元素：deep=true 时连 open shadow root 一起挖。
// shadow 只在常规层挑不出目标时才挖，避免每次巡检都遍历整页。
function vvPageFsCollect(sel, deep) {
    var out = [], roots = [document], guard = 0;
    while (roots.length && guard++ < 24) {
        var r = roots.shift();
        if (!r) continue;
        try {
            var hit = r.querySelectorAll(sel);
            for (var i = 0; i < hit.length; i++) out.push(hit[i]);
        } catch (e1) {}
        if (!deep) continue;
        try {
            var all = r.querySelectorAll('*');
            for (var j = 0; j < all.length; j++) {
                if (all[j] && all[j].shadowRoot) roots.push(all[j].shadowRoot);
            }
        } catch (e2) {}
    }
    return out;
}

// 给候选打分：面积为主，正在播 / 有源 额外加权。
// 排除脚本自己的播放器元素，否则会把内置播放器又套一层。
function vvPageFsScore(el, kind) {
    if (!el || vvPageFsOwned(el)) return -1;
    if (!vvPageFsVisible(el)) return -1;
    var score = vvPageFsArea(el);
    if (kind === 'video') {
        try { if (!el.paused && el.readyState > 0) score += 100000000; } catch (eP) {}
        try {
            if (el.currentSrc || el.getAttribute('src') || (el.querySelectorAll && el.querySelectorAll('source').length)) score += 100000;
        } catch (eA) {}
    }
    return score;
}

function vvPageFsBest(list, kind) {
    var best = null, bestScore = -1;
    for (var i = 0; i < list.length; i++) {
        var s = vvPageFsScore(list[i], kind);
        if (s > bestScore) { bestScore = s; best = list[i]; }
    }
    return best;
}

// 后台 iframe 里若有正在播的视频，给它和顶层视频同等的「正在播」权重，
// 这样「顶层小广告 video + iframe 大播放器」能选对。
function vvPageFsIframeScore(f) {
    if (!f || vvPageFsOwned(f) || !vvPageFsVisible(f)) return { score: -1, inner: null };
    var inner = vvPageFsIframeInner(f);
    var area = vvPageFsArea(f);
    var s = area;
    if (inner) {
        try { if (!inner.paused && inner.readyState > 0) s += 100000000; } catch (e) {}
    }
    return { score: s, inner: inner, area: area };
}

// iframe 里是不是装着播放器：
//   · 同源 → 直接看内部有没有 <video>（有就优先，且不受面积门槛限制）
//   · 跨域 → 读不到，只能按「够大」判断（第三方播放器一般都在内容区铺满）
function vvPageFsIframeInner(f) {
    try {
        var doc = f.contentDocument;
        if (!doc) return null;
        var vs = doc.querySelectorAll('video');
        var best = null, bestScore = -1;
        for (var i = 0; i < vs.length; i++) {
            if (!vvPageFsVisible(vs[i])) continue;
            var s = 0;
            try { if (!vs[i].paused && vs[i].readyState > 0) s += 100000000; } catch (e) {}
            s += vvPageFsArea(vs[i]);
            if (s > bestScore) { bestScore = s; best = vs[i]; }
        }
        return best;
    } catch (e) { return null; }   // 跨域
}

// 挑「主画面」：video / shadow 里的 video → iframe → canvas
// 视频和 iframe 之间按分数比（面积 + 是否在播），canvas 只在前两者都没有时兜底，
// 否则页面上一块大的背景动画 canvas 会把真视频挤掉。
function vvPageFsPick() {
    var st = VV._pageFs;
    var vw = 0, vh = 0;
    try { vw = window.innerWidth; vh = window.innerHeight; } catch (e0) {}
    // 视口读不到时给个保守默认，否则面积门槛会变成 NaN（任何 iframe/canvas 都放行）
    if (!(vw > 0)) vw = 360;
    if (!(vh > 0)) vh = 640;
    var minIframe = Math.max(12000, vw * vh * 0.15);

    // ① 顶层 <video>
    var bestV = vvPageFsBest(vvPageFsCollect('video', false), 'video');
    var bestVScore = bestV ? vvPageFsScore(bestV, 'video') : -1;

    // ② 顶层没有合格 video，才去 shadow root 里挖（5s 一次，避免拖慢重站）
    if (!bestV) {
        var now = Date.now();
        if (!st.deepAt || now - st.deepAt > 5000) {
            st.deepAt = now;
            st.deepPick = vvPageFsBest(vvPageFsCollect('video', true), 'video');
        }
        if (st.deepPick) {
            var sc = vvPageFsScore(st.deepPick, 'video');
            if (sc >= 0) { bestV = st.deepPick; bestVScore = sc; }
        }
    }

    // ③ iframe（同源有视频 / 跨域够大）
    var frames = vvPageFsCollect('iframe', false);
    var bestF = null, bestFScore = -1, bestFInner = null;
    for (var i = 0; i < frames.length; i++) {
        var info = vvPageFsIframeScore(frames[i]);
        if (info.score < 0) continue;
        // 同源且内部有视频 → 一定是播放器；跨域读不到，用面积兜底
        if (!info.inner && info.area < minIframe) continue;
        if (info.score > bestFScore) { bestFScore = info.score; bestF = frames[i]; bestFInner = info.inner; }
    }

    if (bestV && bestF) {
        return bestFScore > bestVScore
            ? { el: bestF, kind: 'iframe', inner: bestFInner }
            : { el: bestV, kind: 'video' };
    }
    if (bestV) return { el: bestV, kind: 'video' };
    if (bestF) return { el: bestF, kind: 'iframe', inner: bestFInner };

    // ④ 最后兜底：画面被画到 canvas 上（video 只做解码）
    var cvs = vvPageFsCollect('canvas', false), bestC = null, bestCScore = -1;
    for (var k = 0; k < cvs.length; k++) {
        if (vvPageFsOwned(cvs[k]) || !vvPageFsVisible(cvs[k])) continue;
        var a = vvPageFsArea(cvs[k]);
        if (a < minIframe) continue;
        if (a > bestCScore) { bestCScore = a; bestC = cvs[k]; }
    }
    if (bestC) return { el: bestC, kind: 'canvas' };

    return null;
}

// 兼容旧接口：只返回被选中的 <video>
function vvPageFsVideo() {
    var t = vvPageFsPick();
    return t && t.kind === 'video' ? t.el : null;
}

// 诊断：点了没反应时，用来告诉用户页面上到底有什么
function vvPageFsDiag() {
    var t = null;
    try { t = vvPageFsPick(); } catch (e) {}
    var rect = null;
    if (t && t.el) {
        try {
            var r = t.el.getBoundingClientRect();
            rect = { w: Math.round(r.width), h: Math.round(r.height) };
        } catch (e2) {}
    }
    return {
        videos: vvPageFsCollect('video', false).length,
        shadowVideos: vvPageFsCollect('video', true).length,
        iframes: vvPageFsCollect('iframe', false).length,
        canvases: vvPageFsCollect('canvas', false).length,
        kind: t ? t.kind : '',
        target: t && t.el ? String(t.el.tagName || '') : '',
        rect: rect
    };
}

// 菜单里的「诊断」：一句话说明现状，方便回报「哪个站点没反应」
function vvPageFsDiagnose() {
    var d = vvPageFsDiag(), st = vvPageFsState();
    var msg = '网页铺满' + (st.on ? '已开' : '未开') +
        ' · video ' + d.videos + '（shadow ' + d.shadowVideos + '）' +
        ' · iframe ' + d.iframes + ' · canvas ' + d.canvases +
        (d.target ? ' · 目标 ' + d.target + (d.rect ? ' ' + d.rect.w + '×' + d.rect.h : '') : ' · 未找到目标');
    try { vvToast(msg, true); } catch (e1) {}
    try {
        // 只在 ?vvdebug=1 时打控制台，免得正常浏览时刷一堆日志
        if (/(?:\?|&)vvdebug=1(?:&|$)/.test((window.location && window.location.search) || '')) {
            console.log('[ViaModes] 网页铺满诊断', { state: st, diag: d, picked: vvPageFsPick() });
        }
    } catch (e2) {}
    return msg;
}

// position:fixed 会被祖先的 transform/filter/perspective/contain 变成
// 「相对该祖先定位」，这是网页全屏最常见的失效原因（全屏后视频还缩在原来那一小块）。
// 只给 computed 值确实非默认的祖先挂 class，退出时摘掉，布局零改动。
function vvPageFsAncestors(v) {
    var hit = [], p = null, win = vvPageFsWin(v);
    // 只走到 <html> 为止：给根元素挂 class 改不了它自己的样式（选择器要求后代），
    // 而且整站被套进根层叠上下文的极端情况，靠 video 自己 fixed 也够用了。
    var root = null;
    try { root = v.ownerDocument ? v.ownerDocument.documentElement : null; } catch (eR) {}
    try { p = v.parentNode; } catch (e0) {}
    while (p && hit.length < 16) {
        // 穿过 shadow 边界：shadow root 的 parentNode 是 null，要跳到 host 才找得到外层祖先
        if (p.nodeType !== 1) {
            try { p = p.host || p.parentNode || null; } catch (eS) { p = null; }
            continue;
        }
        if (p === root) break;
        try {
            var cs = win.getComputedStyle ? win.getComputedStyle(p) : null;
            if (cs) {
                for (var i = 0; i < VV_PAGEFS_ANC_PROPS.length; i++) {
                    var k = VV_PAGEFS_ANC_PROPS[i];
                    var val = '';
                    try { val = cs.getPropertyValue ? cs.getPropertyValue(k) : (cs[k] || ''); } catch (eV) {}
                    val = String(val || '').trim();
                    if (val && val !== 'none' && val !== 'auto' && val !== 'normal' && val !== '0s') {
                        // 两个类一起挂：外层文档里只有 .vv-pagefs-anc 生效，
                        // shadow root / iframe 内部只有 .vv-pagefs-inner-anc 生效。
                        p.classList.add('vv-pagefs-anc');
                        p.classList.add('vv-pagefs-inner-anc');
                        hit.push(p);
                        break;
                    }
                }
            }
        } catch (e1) {}
        try { p = p.parentNode; } catch (e2) { break; }
    }
    return hit;
}

// 把「铺满」样式注入到某个独立样式作用域里（iframe 的 document / shadow root）。// 外层页面的样式表穿不过这两个边界，不注入就是「class 加了但一点反应没有」。
function vvPageFsStyleAttach(v, root, cls) {
    var st = VV._pageFs;
    if (!v || !root) return null;
    var style = null;
    try { style = root.getElementById ? root.getElementById('vv-pagefs-inner-style') : null; } catch (e0) {}
    if (!style) {
        try {
            var doc = root.ownerDocument || root;   // ShadowRoot 自己没有 createElement
            style = doc.createElement('style');
            style.id = 'vv-pagefs-inner-style';
            style.appendChild(doc.createTextNode(VV_PAGEFS_INNER_CSS));
            var host = (root.head || root.documentElement || root);
            host.appendChild(style);
        } catch (e1) { style = null; }
    }
    var anc = [];
    try { v.classList.add(cls); } catch (e2) {}
    anc = vvPageFsAncestors(v);
    st.inner = { root: root, style: style, el: v, cls: cls, anc: anc };
    return st.inner;
}

// 同源 iframe：把内部主视频也拉满，否则 iframe 变大只是空框变大。
// 跨域读不到 contentDocument，直接跳过 —— iframe 本身的播放器一般自适应。
function vvPageFsInnerAttach(f, innerHint) {
    var st = VV._pageFs;
    st.inner = null;
    var doc = null, v = innerHint || null;
    try { doc = f.contentDocument; } catch (e) { return; }
    if (!doc || !doc.documentElement) return;
    try {
        if (!v) v = vvPageFsPickVideoIn(doc);
        if (!v) {
            // 内层没有 <video>（例如播放器又套了一层），只把 iframe 放大就够了
            return;
        }
        vvPageFsStyleAttach(v, doc, 'vv-pagefs-inner-video');
    } catch (e4) { st.inner = null; }
}

// 在一个独立文档里挑主视频（iframe 内部用）
function vvPageFsPickVideoIn(doc) {
    var vs = null, best = null, bestScore = -1;
    try { vs = doc.querySelectorAll('video'); } catch (e) { return null; }
    for (var i = 0; i < vs.length; i++) {
        if (!vvPageFsVisible(vs[i])) continue;
        var s = vvPageFsArea(vs[i]);
        try { if (!vs[i].paused && vs[i].readyState > 0) s += 100000000; } catch (e2) {}
        if (s > bestScore) { bestScore = s; best = vs[i]; }
    }
    return best;
}

function vvPageFsInnerDetach() {
    var st = VV._pageFs, inner = st.inner;
    st.inner = null;
    if (!inner) return;
    try { if (inner.el && inner.cls) inner.el.classList.remove(inner.cls); } catch (e1) {}
    var anc = inner.anc || [];
    for (var i = 0; i < anc.length; i++) {
        try { anc[i].classList.remove('vv-pagefs-anc'); } catch (e2) {}
        try { anc[i].classList.remove('vv-pagefs-inner-anc'); } catch (e3) {}
    }
    try { if (inner.style && inner.style.parentNode) inner.style.parentNode.removeChild(inner.style); } catch (e4) {}
}

// iframe 内部跳转后会换掉 contentDocument，注入的样式随之消失，要补一次
function vvPageFsInnerSync() {
    var st = VV._pageFs;
    if (!st.iframe) return;
    var doc = null;
    try { doc = st.iframe.contentDocument; } catch (e) {}
    if (!doc) return;                                   // 跨域，无能为力也不需要
    if (!st.inner || st.inner.root !== doc) vvPageFsInnerAttach(st.iframe);
}

function vvPageFsFront() {
    var st = VV._pageFs;
    try { if (st.shade) vvBringToFront(st.shade); } catch (e1) {}
    try { if (st.exit) vvBringToFront(st.exit); } catch (e2) {}
}

// 这里曾经有一段「开屏时向上滚几个像素，把被滚走的浏览器栏叫回来」的逻辑。
// 真机 A/B 实测无效，已删除，别再复活它：
//   · Via 的栏由原生手势方向驱动，window.scrollTo 不带手势，innerH 一直停在隐藏态；
//   · 之前还配了 overflow:hidden 滚动锁，反而让用户连上滑唤回栏都做不了；
//   · 现在不锁滚动，用户像平时一样上滑即可让 Via 自己把栏显示回来。


function vvPageFsEnsureUi() {
    var st = VV._pageFs;
    if (!st.shade) {
        var shade = vvEl('div', 'vv-pagefs-shade');
        shade.id = 'vv-pagefs-shade';
        // 站点常见的「全局 div 样式」会污染这里，所以 CSS 里带 all:initial；
        // 遮罩不接事件，点视频还是站点自己的控件说了算。
        try { document.documentElement.appendChild(shade); } catch (eA) {}
        st.shade = shade;
    }
    if (!st.exit) {
        var btn = vvEl('button', 'vv-pagefs-exit');
        btn.id = 'vv-pagefs-exit';
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-label', '退出网页铺满');
        btn.title = '退出网页铺满';
        btn.innerHTML = vvIcon('fsExit', 15) + '<span>退出网页铺满</span>';
        btn.addEventListener('click', function (e) {
            try { e.stopPropagation(); } catch (e1) {}
            try { e.preventDefault(); } catch (e2) {}
            vvPageFsSet(false);
        }, false);
        try { document.documentElement.appendChild(btn); } catch (eB) {}
        st.exit = btn;
    }
    vvPageFsFront();
    vvPageFsSyncExitBtn();
}

function vvPageFsDropUi() {
    var st = VV._pageFs;
    try { if (st.shade && st.shade.parentNode) st.shade.parentNode.removeChild(st.shade); } catch (e1) {}
    try { if (st.exit && st.exit.parentNode) st.exit.parentNode.removeChild(st.exit); } catch (e2) {}
    st.shade = null;
    st.exit = null;
}

function vvPageFsAttach(t) {
    var st = VV._pageFs;
    if (!t || !t.el) {
        try { if (st.shade) st.shade.classList.remove('on'); } catch (e0) {}
        st.video = null; st.iframe = null; st.canvas = null; st.target = null; st.kind = '';
        return;
    }
    st.target = t.el;
    st.kind = t.kind || 'video';
    st.video = t.kind === 'video' ? t.el : null;
    st.iframe = t.kind === 'iframe' ? t.el : null;
    st.canvas = t.kind === 'canvas' ? t.el : null;
    st.inner = null;

    var rt = null;
    if (st.kind === 'video') {
        try { rt = t.el.getRootNode ? t.el.getRootNode() : null; } catch (eR) {}
    }
    if (rt && rt.host) {
        // shadow root 里的视频：外层页面的样式表根本穿不进 shadow root，
        // 只挂 class 会是「加了但毫无反应」，必须把样式注入到 root 内部。
        vvPageFsStyleAttach(t.el, rt, 'vv-pagefs-inner-video');
        st.anc = st.inner ? st.inner.anc : [];
    } else {
        try { t.el.classList.add('vv-pagefs-video'); } catch (e1) {}
        st.anc = vvPageFsAncestors(t.el);
        if (st.kind === 'iframe') vvPageFsInnerAttach(t.el, t.inner);
    }
    try { if (st.shade) st.shade.classList.add('on'); } catch (e2) {}
    vvPageFsFront();
}

function vvPageFsDetach() {
    var st = VV._pageFs;
    try { if (st.target) st.target.classList.remove('vv-pagefs-video'); } catch (e1) {}
    var anc = st.anc || [];
    for (var i = 0; i < anc.length; i++) {
        // 祖先同时挂了两个类（外层 / 内层作用域各一个），退出必须都摘掉，
        // 否则 class 里会留下 vv-pagefs-inner-anc 这种无用残留。
        try { anc[i].classList.remove('vv-pagefs-anc'); } catch (e2) {}
        try { anc[i].classList.remove('vv-pagefs-inner-anc'); } catch (e3) {}
    }
    vvPageFsInnerDetach();
    st.video = null;
    st.iframe = null;
    st.canvas = null;
    st.target = null;
    st.kind = '';
    st.anc = [];
    try { if (st.shade) st.shade.classList.remove('on'); } catch (e3) {}
}

// 系统全屏会隐藏浏览器栏，和「网页铺满」互斥：开启时先退出来，
// 让 Via 的地址栏与底部状态栏回到可见状态。
function vvPageFsExitSys() {
    try {
        var fs = document.fullscreenElement || document.webkitFullscreenElement;
        if (!fs) return;
        var r = null;
        if (document.exitFullscreen) r = document.exitFullscreen();
        else if (document.webkitExitFullscreen) r = document.webkitExitFullscreen();
        else if (document.webkitCancelFullScreen) r = document.webkitCancelFullScreen();
        else if (document.msExitFullscreen) r = document.msExitFullscreen();
        // 新版返回 Promise，被拒时不吞会产生一条 unhandled rejection
        if (r && r.catch) r.catch(function () {});
    } catch (e) {}
}

// 内置播放器顶栏已经有同一枚按钮，网页层右上角就不该再叠一个出口。
function vvPageFsSyncExitBtn() {
    var st = VV._pageFs;
    if (!st.exit) return;
    try {
        var hide = !st.on || !!VV.playerActive;
        if (hide) st.exit.classList.add('hide');
        else st.exit.classList.remove('hide');
    } catch (e) {}
}

// 顶栏按钮的高亮与网页层退出胶囊，都只认同一个状态源。
// 菜单、按钮、打开/关闭播放器、生命周期清理，任何一条路径改了状态都要走这里。
function vvPageFsSyncBtn() {
    var st = VV._pageFs;
    try {
        var b = document.querySelector('.vv-cs-top [data-act="webfs"]');
        if (b) {
            if (st.on) b.classList.add('on');
            else b.classList.remove('on');
            b.setAttribute('aria-pressed', st.on ? 'true' : 'false');
            b.title = st.on ? '网页铺满（已开）' : '网页铺满（把站点播放器放大到可视区）';
        }
    } catch (eB) {}
    vvPageFsSyncExitBtn();
}

// 内置播放器自己就铺满视口，且会暂停/接管页面媒体；期间把网页全屏挂起，
// 关掉播放器再恢复，避免两层 fixed 元素互相打架。
function vvPageFsSync() {
    var st = VV._pageFs;
    if (!st.on) return;
    var shouldSuspend = !!VV.playerActive;
    if (shouldSuspend === !!st.suspended) return;
    st.suspended = shouldSuspend;
    if (shouldSuspend) vvPageFsDetach();
    else vvPageFsAttach(vvPageFsPick());
    vvPageFsSyncBtn();
}

function vvPageFsTick() {
    var st = VV._pageFs;
    if (!st.on) return;
    try {
        // 用户/站点主动进了系统全屏 → 让位，别把两套全屏叠在一起。
        // 这里不能静默退出：点了开、然后什么都没发生是最难排查的观感。
        var fs = document.fullscreenElement || document.webkitFullscreenElement;
        if (fs) {
            vvPageFsSet(false, true);
            try { vvToast('站点自己进入了系统全屏，网页铺满已退出'); } catch (eT) {}
            return;
        }
    } catch (eF) {}
    vvPageFsSync();
    if (st.suspended) return;
    var t = vvPageFsPick();
    if (st.target && (!t || t.el !== st.target)) {
        vvPageFsDetach();
        vvPageFsAttach(t);
    } else if (!st.target && t) {
        vvPageFsAttach(t);
    } else if (st.target && !st.target.parentNode) {
        vvPageFsDetach();
    }
    if (st.iframe) vvPageFsInnerSync();
    // 站点会不断插入广告浮层，只有 UI 真被盖住时才重排
    try { if (st.exit && vvIsOccluded(st.exit)) vvPageFsFront(); } catch (eO) {}
}

function vvPageFsWatch(on) {
    var st = VV._pageFs;
    if (on) {
        if (st.timer) return;
        st.timer = setInterval(function () {
            try { vvPageFsTick(); } catch (e) {}
        }, 1500);
    } else {
        try { if (st.timer) clearInterval(st.timer); } catch (e1) {}
        st.timer = 0;
    }
}

// on=true 开启；silent=true 用于生命周期/逃生门清理，不弹 toast。
// 返回最终状态，方便自动化断言。
function vvPageFsSet(on, silent) {
    var st = VV._pageFs;
    on = !!on;
    if (on === !!st.on) {
        if (!silent) vvToast(on ? '网页铺满已经是开启状态' : '网页铺满本来就是关的');
        return st.on;
    }
    if (on) {
        vvPageFsExitSys();
        st.on = true;
        st.suspended = false;
        st.deepAt = 0;
        vvEnsureStyle();
        // 只加「铺满」这一个状态 class。不锁滚动：栏由 Via 手势控制，
        // 锁了用户就没法上滑把它叫回来。
        try { document.documentElement.classList.add('vv-pagefs-on'); } catch (eC) {}
        vvPageFsEnsureUi();
        // 立刻铺满，不等 1.5s 巡检；播放器开着时先挂起网页层
        var t = vvPageFsPick();
        if (VV.playerActive) { st.suspended = true; vvPageFsDetach(); }
        else { st.suspended = false; vvPageFsAttach(t); }
        vvPageFsWatch(true);
        vvPageFsSetup();
        vvPageFsSyncBtn();
        if (!silent) {
            if (VV.playerActive) {
                vvToast('网页铺满已开启：播放器本来就占满可视区', true);
            } else if (!t) {
                var d = vvPageFsDiag();
                vvToast('暂时没找到视频（video ' + d.videos + ' / iframe ' + d.iframes + '），出现后自动铺满', true);
            } else {
                vvToast('已铺满：' + (t.kind === 'video' ? '视频' : t.kind === 'iframe' ? '内嵌播放器' : '画面') +
                    '已放大到可视区', true);
            }
        }
    } else {
        st.on = false;
        st.suspended = false;
        vvPageFsWatch(false);
        vvPageFsDetach();
        vvPageFsDropUi();
        try { document.documentElement.classList.remove('vv-pagefs-on'); } catch (eD) {}
        vvPageFsSyncBtn();
        if (!silent) vvToast('已退出网页铺满');
    }
    return st.on;
}

function vvTogglePageFullscreen() {
    return vvPageFsSet(!VV._pageFs.on);
}

// document 级事件只绑一次。不开网页铺满时这些监听是空转，
// 所以放在 vvMain 里统一注册，不依赖任何 GM API。
function vvPageFsSetup() {
    var st = VV._pageFs;
    if (st.bound) return;
    st.bound = true;
    var onFsChange = function () {
        try {
            if (VV._pageFs.on && (document.fullscreenElement || document.webkitFullscreenElement)) {
                vvPageFsSet(false, true);
            }
        } catch (e) {}
    };
    try { document.addEventListener('fullscreenchange', onFsChange, false); } catch (e1) {}
    try { document.addEventListener('webkitfullscreenchange', onFsChange, false); } catch (e2) {}
    var onLeave = function () { try { vvPageFsSet(false, true); } catch (e3) {} };
    try { window.addEventListener('pagehide', onLeave, false); } catch (e4) {}
    try { window.addEventListener('beforeunload', onLeave, false); } catch (e5) {}
    var onResize = function () { try { if (VV._pageFs.on) { vvPageFsFront(); vvPageFsTick(); } } catch (e6) {} };
    try { window.addEventListener('resize', onResize, false); } catch (e7) {}
    try { window.addEventListener('orientationchange', onResize, false); } catch (e8) {}
}
// ============================================================
// 选集：把「这一页有哪些集」认出来，做成能直接点的网格。
//
// 两类来源，行为完全不同，必须分开标注，否则用户点了不知道会发生什么：
//   page  —— 页面上真实的剧集链接（<a href> / data-href），点它会跳到那一集，
//            跳完靠 autoNextLast 让新页面自动接着播；
//   el    —— 站点用 JS 原地切集、没有可跳转地址的元素，点它等于替用户点一下，
//            再重新嗅探，看页面有没有吐出新的视频地址；
//   media —— 已经嗅探到的多条媒体直链本身就是分集（同模板不同数字），
//            点它不跳页，直接换源重开播放器，最快。
//
// 为什么不按「页面上有多少个带数字的链接」直接列出来：
// 影视页里带数字的链接一大堆（年份、播放量、相关推荐、广告位），
// 全列出来就是一屏垃圾。这里按「URL 数字模板」分组，只取成员最多、
// 且集数互不重复的那一组；当前页所在模板额外加权，保证选出的是本剧的选集，
// 而不是侧栏「相关推荐」的另一部剧。
// ============================================================

var VV_EP_MAX_LINKS = 3000;   // 一次最多遍历这么多 a[href]，防止超大页面卡顿
var VV_EP_MAX_ELS = 1200;     // 无 href 的候选元素上限
var VV_EP_MAX_CELLS = 200;    // 网格最多 200 集
var VV_EP_BAD_TEXT = /预告|花絮|评论|下载|演员|简介|详情|全集|更新至|更多|排行榜|会员|VIP|线路|播放地址|收藏|分享|广告/;
var VV_EP_DATA_KEYS = ['data-href', 'data-url', 'data-link', 'data-ep'];
var VV_EP_EL_RX = '[data-href],[data-url],[data-link],[data-ep],[data-num],[onclick]';

// 从可见文本里读集数。返回 null = 这不是一集（和第 0 集区分开）。
// 只认三种写法：「第12集 / 12话 / EP12」「12」「12」这类纯数字短文本；
// 带年份、播放量的长文本一概不认。
function vvEpNum(text) {
    var t = String(text === undefined || text === null ? '' : text)
        .replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!t || VV_EP_BAD_TEXT.test(t)) return null;
    var m = /(?:第\s*)?(\d{1,4})\s*(?:集|话|話|期|回|部)/.exec(t);
    if (!m) m = /(?:^|[^a-z])ep\.?\s*(\d{1,4})(?:$|[^a-z])/i.exec(t);
    if (!m) m = /^(\d{1,3})$/.exec(t);
    if (!m) return null;
    var n = parseInt(m[1], 10);
    return (n >= 0 && n <= 9999) ? n : null;
}

// URL 模板：path 里的数字统一换成 #，query 只保留键名（token / 时间戳的值每次都不同）。
// /play/1.html?t=111 与 /play/2.html?t=222 → 同一模板；
// /play/1.html 与 /detail/1.html → 不同模板，不会被混成一部剧。
function vvEpTemplate(u) {
    var s = String(u || '').split('#')[0];
    var q = s.indexOf('?');
    var path = (q >= 0 ? s.slice(0, q) : s).replace(/\d+/g, '#');
    if (q < 0) return path;
    var keys = [];
    var parts = s.slice(q + 1).split('&');
    for (var i = 0; i < parts.length && i < 12; i++) {
        var k = parts[i].split('=')[0];
        if (k && keys.indexOf(k) < 0) keys.push(k);
    }
    return path + '?' + keys.sort().join('&');
}

function vvEpSameHost(u) {
    try { return new URL(u, location.href).hostname === location.hostname; } catch (e) { return false; }
}

function vvEpAbs(raw) {
    if (!raw) return '';
    var r = String(raw).trim();
    if (!r || r === '#' || /^(?:javascript|mailto|tel|data):/i.test(r)) return '';
    try { return vvAbsUrl(r, location.href); } catch (e) { return ''; }
}

// 从一组候选里挑「最像选集」的一组：成员数最多，当前页所在模板加权。
// 同集数只保留第一条（站点常给同一集配多个线路/清晰度链接）。
function vvEpPickGroup(cands, curTemplate) {
    var groups = {}, order = [];
    for (var i = 0; i < cands.length; i++) {
        var t = cands[i].template;
        if (!t) continue;
        if (!groups[t]) { groups[t] = []; order.push(t); }
        groups[t].push(cands[i]);
    }
    var best = null, bestScore = 0;
    for (var j = 0; j < order.length; j++) {
        var t2 = order[j];
        var arr = groups[t2];
        if (arr.length < 2) continue;
        var seen = {}, list = [];
        for (var k = 0; k < arr.length; k++) {
            var num = arr[k].num;
            if (seen[num]) continue;
            seen[num] = 1;
            list.push(arr[k]);
        }
        if (list.length < 2) continue;
        var score = list.length * 2 + (t2 === curTemplate ? 60 : 0);
        if (score > bestScore) { bestScore = score; best = list; }
    }
    if (!best) return [];
    best.sort(function (a, b) { return a.num - b.num; });
    return best.slice(0, VV_EP_MAX_CELLS);
}

function vvEpCollectLinks() {
    var out = [];
    var list = [];
    try { list = document.querySelectorAll('a[href]'); } catch (e) { return out; }
    var n = Math.min(list.length, VV_EP_MAX_LINKS);
    for (var i = 0; i < n; i++) {
        var a = list[i];
        var txt = '';
        try { txt = a.textContent || a.getAttribute('title') || ''; } catch (e1) {}
        var num = vvEpNum(txt);
        if (num === null) continue;
        var raw = '';
        try { raw = a.getAttribute('href'); } catch (e2) {}
        var full = vvEpAbs(raw);
        if (!full || !vvEpSameHost(full)) continue;   // 外域推荐位不进选集
        out.push({
            kind: 'page', num: num, label: String(num), href: full,
            template: vvEpTemplate(full), el: a, title: txt.slice(0, 30)
        });
    }
    return out;
}

// 站点用 JS 原地切集：<li onclick="play(3)">第3集</li>。
// 这类元素没有 href，只能替用户点一下；同一父容器视为同一个选集组。
function vvEpCollectEls() {
    var out = [];
    var list = [];
    try { list = document.querySelectorAll(VV_EP_EL_RX); } catch (e) { return out; }
    var n = Math.min(list.length, VV_EP_MAX_ELS);
    var seq = 0;
    for (var i = 0; i < n; i++) {
        var el = list[i];
        // a[href] 已经在 links 组里处理过，别重复
        try { if (el.tagName === 'A' && el.getAttribute('href')) continue; } catch (e0) {}
        var txt = '';
        try { txt = el.textContent || el.getAttribute('title') || ''; } catch (e1) {}
        var num = vvEpNum(txt);
        if (num === null) {
            var dn = '';
            try { dn = el.getAttribute('data-num') || ''; } catch (e2) {}
            if (/^\d{1,4}$/.test(dn)) num = parseInt(dn, 10);
        }
        if (num === null) continue;
        var href = '';
        for (var d = 0; d < VV_EP_DATA_KEYS.length; d++) {
            var v = '';
            try { v = el.getAttribute(VV_EP_DATA_KEYS[d]) || ''; } catch (e3) {}
            var abs = vvEpAbs(v);
            if (abs && vvEpSameHost(abs)) { href = abs; break; }
        }
        var p = null;
        try { p = el.parentNode; } catch (e4) {}
        var group = '';
        if (p) {
            if (!p._vvEpGroup) { seq++; p._vvEpGroup = 'el' + Date.now().toString(36) + '_' + seq; }
            group = p._vvEpGroup;
        }
        out.push({
            kind: href ? 'page' : 'el', num: num, label: String(num),
            href: href || '', template: href ? vvEpTemplate(href) : group,
            el: el, title: txt.slice(0, 30)
        });
    }
    return out;
}

// 媒体直链的集号只从「文件名主干」最后一段数字里取，不能用 vvNumInfo：
// 后者取的是 URL 里最后一个数字，对 ep1.mp4 / ep2.mp4 一律读成 4（扩展名 mp4），
// 三条不同集会被去重成一条，选集组直接消失。
function vvEpMediaNum(u) {
    var s = String(u || '').split('#')[0].split('?')[0];
    var file = s.slice(s.lastIndexOf('/') + 1).replace(/\.[a-z0-9]{2,5}$/i, '');
    var last = null, m, rx = /\d+/g;
    while ((m = rx.exec(file)) !== null) last = m[0];
    if (last === null) return null;
    var n = parseInt(last, 10);
    return (n >= 0 && n <= 999) ? n : null;
}

// 嗅探到的多条直链若呈「同模板不同数字」，本身就是一套选集，点它不用跳页。
// 排除纯音频 / 音轨清单 / blob 死链，并把 720p、1080p 这类码率数字挡在外面。
function vvEpCollectMedia() {
    var groups = {}, order = [];
    for (var i = 0; i < VV.items.length; i++) {
        var it = VV.items[i];
        if (!it || !it.url || it.type === 'BLOB' || it.type === 'AUDIO') continue;
        if (it.type === 'HLS' && vvLooksLikeAudioHls(it.url)) continue;
        if (/\d{3,4}p(?:\.|_|\/|$)/i.test(it.url)) continue;
        var t = vvEpTemplate(it.url);
        if (!groups[t]) { groups[t] = []; order.push(t); }
        groups[t].push(it);
    }
    var best = [];
    for (var j = 0; j < order.length; j++) {
        var arr = groups[order[j]];
        if (arr.length < 2) continue;
        var seen = {}, list = [];
        for (var k = 0; k < arr.length; k++) {
            var num = vvEpMediaNum(arr[k].url);
            if (num === null) num = k + 1;
            if (num < 0 || num > 999 || seen[num]) continue;
            seen[num] = 1;
            list.push({ kind: 'media', num: num, label: String(num), item: arr[k], href: arr[k].url });
        }
        if (list.length > best.length) best = list;
    }
    if (best.length < 2) return [];
    best.sort(function (a, b) { return a.num - b.num; });
    return best.slice(0, VV_EP_MAX_CELLS);
}

function vvEpCurrent(page, media) {
    var hereFull = location.href;
    var here = hereFull.split('#')[0];
    var res = { page: -1, media: -1 };
    // 先比完整地址（带 #ep=3 的站内锚点式选集），再比去掉锚点的地址
    for (var h = 0; h < page.length; h++) {
        if (page[h].href && page[h].href === hereFull) { res.page = page[h].num; break; }
    }
    if (res.page < 0) {
        for (var i = 0; i < page.length; i++) {
            if (page[i].href && page[i].href.split('#')[0] === here) { res.page = page[i].num; break; }
        }
    }
    // 当前页 URL 里的数字常常就是集数（/play/3.html）；只在候选里唯一时采信
    if (res.page < 0) {
        var mi = null;
        try { mi = vvNumInfo(location.href); } catch (e) {}
        if (mi && mi.num <= 999) {
            var hit = 0;
            for (var j = 0; j < page.length; j++) if (page[j].num === mi.num) hit++;
            if (hit === 1) res.page = mi.num;
        }
    }
    try {
        var cur = VV.active && VV.active.item ? VV.active.item.url : '';
        for (var k = 0; k < media.length; k++) if (media[k].item.url === cur) { res.media = media[k].num; break; }
    } catch (e2) {}
    return res;
}

// 扫描结果缓存 800ms：菜单项要显示集数，紧跟着点开面板不该把 DOM 再遍历两遍。
function vvEpisodesScan(force) {
    if (!force && VV._epCache && VV._epCache.data && Date.now() - VV._epCache.ts < 800) return VV._epCache.data;
    var curTem = vvEpTemplate(location.href);
    var links = vvEpCollectLinks();
    var els = vvEpCollectEls();
    var page = vvEpPickGroup(links, curTem);
    // 链接组已经能认出选集时，不再混入 JS 元素组，避免同一集出现两格
    if (!page.length) page = vvEpPickGroup(els, curTem);
    var media = vvEpCollectMedia();
    var data = {
        page: page, media: media, current: vvEpCurrent(page, media),
        linkCands: links.length, elCands: els.length, curTemplate: curTem
    };
    VV._epCache = { ts: Date.now(), data: data };
    return data;
}

// 诊断：列表没出来时，先搞清是「页面没有剧集链接」还是「我们没认出来」。
function vvEpisodesDiag() {
    var links = vvEpCollectLinks();
    var els = vvEpCollectEls();
    var counts = {}, top = [];
    for (var i = 0; i < links.length; i++) counts[links[i].template] = (counts[links[i].template] || 0) + 1;
    for (var t in counts) top.push({ template: t, n: counts[t] });
    top.sort(function (a, b) { return b.n - a.n; });
    var d = vvEpisodesScan(true);
    return {
        aLinks: (function () { try { return document.querySelectorAll('a[href]').length; } catch (e) { return -1; } })(),
        linkCands: links.length,
        elCands: els.length,
        topGroups: top.slice(0, 3),
        curTemplate: d.curTemplate,
        sniffed: VV.items.length,
        page: d.page.length,
        media: d.media.length,
        current: d.current
    };
}

function vvEpisodesDiagnose() {
    var d = vvEpisodesDiag();
    var L = [];
    L.push('页面地址: ' + location.href.slice(0, 90));
    L.push('a[href] 总数: ' + d.aLinks + ' / 文本像集数的: ' + d.linkCands);
    L.push('JS 切集候选元素: ' + d.elCands);
    L.push('嗅探到的媒体: ' + d.sniffed + ' 条');
    L.push('当前 URL 模板: ' + d.curTemplate.slice(0, 90));
    for (var i = 0; i < d.topGroups.length; i++) {
        L.push('链接模板 ' + (i + 1) + ': ' + d.topGroups[i].n + ' 条 · ' + d.topGroups[i].template.slice(0, 80));
    }
    L.push('最终选集: 页面链接 ' + d.page + ' 集 / 媒体直链 ' + d.media + ' 集');
    L.push('当前集: 页面 ' + d.current.page + ' / 媒体 ' + d.current.media);
    alert('选集 诊断（复制反馈给开发者）\n\n' + L.join('\n') +
        '\n\n判读：\n· 「文本像集数」为 0 → 站点剧集不是数字文本，或还没渲染出来，先播一下视频再打开选集\n· 模板条数 ≥2 但「最终选集」为 0 → 集数重复/不在本站，把模板发我\n· 只有「媒体直链」有集 → 直接换源即可，不用跳页');
    return L.join('\n');
}

function vvEpisodesClose() {
    try {
        var w = document.getElementById('vv-ep-wrap');
        if (w) { w.classList.remove('open'); var g = w.querySelector('.vv-ep-grid'); if (g) g.innerHTML = ''; }
    } catch (e) {}
    VV._epOpen = false;
    try { if (ROOT) ROOT.classList.remove('ep-open'); } catch (e2) {}
    // 挑完集把控制栏重新点亮并重新计时，否则用户会觉得「点一下界面全没了」
    try { if (VV.playerActive) vvShowCS(); } catch (e3) {}
}

function vvEpEnsureWrap() {
    var w = document.getElementById('vv-ep-wrap');
    if (w) return w;
    w = vvEl('div', 'vv-ep-wrap');
    w.id = 'vv-ep-wrap';
    var box = vvEl('div', 'vv-ep');
    var head = vvEl('div', 'vv-ep-head');
    var title = vvEl('div', 'vv-ep-title', '选集');
    var btnRefresh = vvEl('button', 'vv-ep-btn', '刷新');
    var btnClose = vvEl('button', 'vv-ep-btn');
    btnClose.innerHTML = vvIcon('close', 14);
    btnClose.title = '关闭';
    btnClose.setAttribute('aria-label', '关闭');
    head.appendChild(title);
    head.appendChild(btnRefresh);
    head.appendChild(btnClose);
    var note = vvEl('div', 'vv-ep-note', '');
    var grid = vvEl('div', 'vv-ep-grid');
    var foot = vvEl('div', 'vv-ep-foot', '');
    box.appendChild(head);
    box.appendChild(note);
    box.appendChild(grid);
    box.appendChild(foot);
    w.appendChild(box);
    document.documentElement.appendChild(w);
    btnRefresh.addEventListener('click', function () {
        vvEpRender(vvEpisodesScan(true));
        vvToast('已重新扫描本页');
    });
    btnClose.addEventListener('click', vvEpisodesClose);
    w.addEventListener('click', function (e) { if (e.target === w) vvEpisodesClose(); });
    w.addEventListener('touchstart', function () { w._touching = true; }, { passive: true });
    w.addEventListener('touchend', function () { w._touching = false; }, { passive: true });
    return w;
}

function vvEpAddSection(frag, label, sub, list, curNum) {
    if (!list.length) return;
    var h = vvEl('div', 'vv-ep-sec', vvEscape(label) + (sub ? ' · ' + vvEscape(sub) : ''));
    frag.appendChild(h);
    var row = vvEl('div', 'vv-ep-cells');
    for (var i = 0; i < list.length; i++) {
        var ep = list[i];
        var cell = vvEl('div', 'vv-ep-cell' + (ep.num === curNum ? ' on' : ''), vvEscape(ep.label));
        cell.setAttribute('data-num', String(ep.num));
        cell.setAttribute('data-kind', ep.kind);
        cell.setAttribute('role', 'button');
        cell.setAttribute('aria-label', '第 ' + ep.num + ' 集');
        cell.title = '第 ' + ep.num + ' 集' + (ep.title ? ' · ' + ep.title : '');
        cell._ep = ep;
        cell.addEventListener('click', function () { vvEpGo(this._ep); });
        row.appendChild(cell);
    }
    frag.appendChild(row);
}

function vvEpRender(data) {
    var w = vvEpEnsureWrap();
    var title = w.querySelector('.vv-ep-title');
    var note = w.querySelector('.vv-ep-note');
    var grid = w.querySelector('.vv-ep-grid');
    var foot = w.querySelector('.vv-ep-foot');
    var total = data.page.length + data.media.length;
    if (title) title.innerHTML = '选集 · ' + total + ' 集';
    if (note) {
        note.innerHTML = data.page.length
            ? '点集数会打开该集页面' + (VV.cfg.epAutoPlay ? '并自动续播' : '') + '；蓝色为当前集'
            : '下面是已嗅探到的分集视频地址，点集数直接换源、不跳页';
    }
    if (foot) {
        foot.innerHTML = (data.media.length ? '视频直链换源无需跳页 · ' : '') +
            '找不到想要的集？先播放一下视频再点「刷新」';
    }
    if (grid) {
        var frag = document.createDocumentFragment();
        vvEpAddSection(frag, '本页剧集', data.page.length ? String(data.page.length) + ' 集' : '',
            data.page, data.current.page);
        vvEpAddSection(frag, '嗅探到的视频', data.media.length ? String(data.media.length) + ' 集' : '',
            data.media, data.current.media);
        grid.innerHTML = '';
        grid.appendChild(frag);
    }
}

function vvEpisodesOpen() {
    vvEnsureStyle();
    var data = vvEpisodesScan(true);
    if (!data.page.length && !data.media.length) {
        vvToast('没找到剧集列表。先播放一下视频，或用菜单「选集 诊断」看页面结构', true);
        return;
    }
    vvEpRender(data);
    var w = document.getElementById('vv-ep-wrap');
    if (!w) return;
    vvBringToFront(w);
    w.classList.add('open');
    VV._epOpen = true;
    // 挑集期间控制栏不许自动收起（和底部菜单同一套规则）
    try { if (ROOT && VV.playerActive) ROOT.classList.add('ep-open'); } catch (e) {}
    try { if (VV.playerActive) vvShowCS(); } catch (e2) {}
}

// 原地切集：站点用 JS 切集（点一下元素），或只换 URL 锚点（hashchange）。
// 两者都不会整页刷新，只能靠重新嗅探拿到新一集的视频地址。
function vvEpGoElement(ep, hashUrl) {
    var before = [];
    for (var i = 0; i < VV.items.length; i++) before.push(VV.items[i].url);
    if (VV.cfg.epAutoPlay) vvSet('autoNextLast', { ts: Date.now(), why: 'ep', num: ep.num });
    if (hashUrl) {
        try { location.href = hashUrl; } catch (e) {}
    } else {
        try { if (ep.el) ep.el.click(); } catch (e2) {}
    }
    vvToast('已切到第 ' + ep.num + ' 集，正在找新的视频地址…', true);
    setTimeout(function () {
        try { vvScanDOM(); vvScanPerf(); } catch (e1) {}
        // 没跳页的话，这条续播标记不能留着，否则下次刷新页面会莫名自动播
        try { vvDel('autoNextLast'); } catch (e2) {}
        var cand = null;
        for (var j = 0; j < VV.items.length; j++) {
            var it = VV.items[j];
            if (!it || it.type === 'BLOB' || it.type === 'AUDIO') continue;
            if (it.type === 'HLS' && vvLooksLikeAudioHls(it.url)) continue;
            if (before.indexOf(it.url) >= 0) continue;
            cand = it; break;
        }
        if (!cand) { vvToast('页面没吐出新的视频地址，可点「刷新」再扫一次', true); return; }
        try { openPlayer(cand); } catch (e3) {}
        try { vvSetTitle('第 ' + ep.num + ' 集 · ' + vvPageTitle()); } catch (e4) {}
    }, 1500);
}

function vvEpGo(ep) {
    if (!ep) return;
    vvEpisodesClose();
    if (ep.kind === 'media') {
        if (ep.item) {
            try { openPlayer(ep.item); } catch (e) {}
            try { vvSetTitle('第 ' + ep.num + ' 集 · ' + vvPageTitle()); } catch (e2) {}
            vvToast('已切到第 ' + ep.num + ' 集');
        }
        return;
    }
    if (ep.kind === 'el') { vvEpGoElement(ep, null); return; }
    var hereFull = location.href;
    var here = hereFull.split('#')[0];
    var go = ep.href || '';
    if (!go) { vvToast('第 ' + ep.num + ' 集没有可跳转的链接', true); return; }
    var goBase = go.split('#')[0];
    var sameHash = (go.split('#')[1] || '') === (hereFull.split('#')[1] || '');
    if (go === hereFull || (goBase === here && sameHash)) {
        vvToast('已经在第 ' + ep.num + ' 集');
        return;
    }
    // 只换锚点的 SPA 选集（#/play/5）不是整页跳转：交给站点 hashchange，
    // 再重新嗅探。若只按 path 比较，会被误判成「已经在当前集」而点了没反应。
    if (goBase === here) {
        try { if (VV.playerActive) closePlayer(); } catch (e4) {}
        vvEpGoElement(ep, go);
        return;
    }
    if (VV.cfg.epAutoPlay) vvSet('autoNextLast', { ts: Date.now(), why: 'ep', num: ep.num });
    else vvDel('autoNextLast');
    try { if (VV.playerActive) closePlayer(); } catch (e3) {}
    vvToast('正在打开第 ' + ep.num + ' 集' + (VV.cfg.epAutoPlay ? '，将自动续播' : ''), true);
    location.href = ep.href;
}
function vvMain() {
    try {
        vvEnsureStyle();
        vvSetupMenu();
        vvPageFsSetup();
        vvSetupLifecycle();
        vvConsumeAutoNext();
        setTimeout(vvvSyncBadge, 900);
        function vvvSyncBadge() { if (VV.items.length && !VV.playerActive) vvShowBadgeNew(); }
    } catch (e) {}
    // 排查与自动化验证用的内部句柄，只在地址带 ?vvdebug=1 时挂到 window
    try {
        if (/(?:\?|&)vvdebug=1(?:&|$)/.test(location.search || '')) {
            window.__vv = {
                VV: VV,
                // Via 里 vvSet 优先走 GM_setValue（脚本私有存储），页面 localStorage 读不到；
                // 真机验证「跳页自动续播」这类跨页标记时只能从脚本这一侧读
                get: vvGet,
                hlsConfig: vvHlsConfig,
                hlsSeekMode: vvHlsSetSeekMode,
                diag: vvDiagText,
                bufAhead: vvBufAhead,
                open: openPlayer,
                close: closePlayer,
                openPanel: vvOpenPanel,
                closePanel: function () { try { if (vvUI && vvUI.panel) vvUI.panel.close(); } catch (e) {} },
                epScan: vvEpisodesScan,
                epOpen: vvEpisodesOpen,
                epClose: vvEpisodesClose,
                epGo: vvEpGo,
                epDiag: vvEpisodesDiag,
                epNum: vvEpNum,
                epTemplate: vvEpTemplate,
                badge: vvToggleBadge,
                // 网页铺满（原名页面全屏）：现场状态与手动开关
                pageFs: vvPageFsState,
                pageFsSet: vvPageFsSet,
                pageFsToggle: vvTogglePageFullscreen,
                pageFsVideo: vvPageFsVideo,
                pageFsPick: vvPageFsPick,
                pageFsDiag: vvPageFsDiag,
                pageFsDiagnose: vvPageFsDiagnose,
                pageFsTick: vvPageFsTick,
                pageFsBtn: vvPageFsSyncBtn,
                shareProbe: vvShareProbe,
                buildM3U: vvBuildM3U,
                buildCmd: vvBuildCmd,
                buildIntent: vvBuildIntent,
                shareOpen: vvShareOpen,
                shareClose: vvShareClose,
                mini: vvMiniWindow,
                pip: vvTryPip,
                hasPriorityOverlay: vvHasPriorityOverlay,
                // 播放态低特效：只读状态与手动切换，供真机帧率探针复验
                lowFxSync: vvSyncLowFx,
                lowFxToggle: vvToggleLowFx,
                // 网页自动播放拦截：拦了几次、钩子装上没有、当前是否放行
                apState: function () {
                    try { return { blocked: VV_AP.blocked, hooked: VV_AP.hooked, allow: vvApCfgOn() }; } catch (e) { return null; }
                },
                apRestorePreload: function () { try { vvApRestorePreload(); } catch (e) {} },
                leaseWrite: function (id, ts) {
                    try {
                        if (!ts) { localStorage.removeItem(VV_LEASE_PREFIX + id); return; }
                        // first 设得足够早：仲裁按 first 排，本页的 first 是打开播放器那一刻，
                        // 不设早一点就永远轮不到对方当 owner，测不出挂起。
                        localStorage.setItem(VV_LEASE_PREFIX + id,
                            JSON.stringify({ ts: ts, first: ts - 3600000, url: '' }));
                    } catch (e) {}
                },
                leaseRead: vvPlayersRead,
                leaseId: vvLeaseId,
                leaseTick: vvLeaseTick,
                playersCount: vvPlayersCount,
                multiPlay: vvToggleMultiPlay,
                rebuild: vvRebuildMedia,
                forceClose: vvForceClose,
                suspend: vvSuspendPlayback,
                resume: vvResumePlayback,
                restorePageAudio: function () { try { return vvRestorePageAudio(); } catch (e) { return -1; } },
                restorePlayerAudio: function () { try { return vvRestorePlayerAudio(); } catch (e) { return -1; } },
                hibernate: vvHibernateMedia,
                thaw: vvThawMedia,
                enterBg: vvEnterBackground,
                leaveBg: vvLeaveBackground,
                setLoadPct: vvSetLoadPct,
                loadProgress: vvUpdateLoadProgress,
                stopLoadTick: vvStopLoadTick,
                showErr: vvShowErr,
                hideErr: vvHideErr,
                armWatchdog: vvArmStartWatchdog,
                disarmWatchdog: vvDisarmStartWatchdog,
                // 起播诊断：看门狗放宽了几次、有没有触发解码器自救、最近一次拿到分片的时间。
                // 真机上"插件起播比网页慢"只能靠这几个数分辨是网络慢还是重建循环。
                startDiag: function () {
                    var a = VV.active || {};
                    var now = Date.now();
                    return {
                        ext: a._wdogExtend || 0,
                        extAll: VV._startWdogExtend || 0,
                        rescue: a._rescue || 0,
                        lastRescue: VV._lastRescue || null,
                        fragMs: a._fragMs || 0,
                        fragAgo: a._fragLoadedAt ? now - a._fragLoadedAt : -1,
                        loading: !!a._fragLoadingSince,
                        // 清单在飞 / 最近一次真的有字节到账（直连 mp4 也能看到）
                        manif: !!a._manifLoadingSince,
                        netAgo: a._netAt ? now - a._netAt : -1,
                        flow: (function () { try { return vvNetFlow(a, now); } catch (eF) { return -1; } })(),
                        wdogAge: a._wdogT0 ? Math.round((now - a._wdogT0) / 1000) : 0,
                        rx: VID ? VID.readyState : -1,
                        t: VID ? +(VID.currentTime || 0).toFixed(2) : -1
                    };
                },
                // 泄漏自查：存活 hls 实例数（应为 0）、播放器视频元素是否还有 src
                hlsPool: function () { return (VV._hlsPool || []).length; },
                killAllHls: vvKillAllHls,
                // 关标签页/离开页面时最后一次清理的时间戳（0 表示从没触发过）
                lastTeardown: function () { return VV._lastTeardown || 0; },
                tornDown: function () { return !!_vvTornDown; },
                // 后台判定 / 释放链路的现场状态（排查"多页签播不动"用）
                tabHidden: function () { try { return vvTabHidden(); } catch (e) { return null; } },
                bg: function () { return { bg: !!VV._bg, since: VV._bgAt || 0, count: VV._bgCount || 0, rafGap: VV._rafSeen ? Date.now() - (VV._rafLast || 0) : -1 }; },
                // 前台判定的原始信号。「为什么不肯让出解码器」这个问题，看这一个就够：
                // vis=visible + rafGap 小 + hasFocus=true 的页面，会一直认为自己在前台。
                front: function () {
                    var vis = '';
                    try { vis = document.visibilityState || ''; } catch (e0) {}
                    var foc = null;
                    try { foc = vvHasFocus(); } catch (e1) {}
                    return {
                        bg: !!VV._bg,
                        hidden: vvTabHidden(),
                        vis: vis,
                        hasFocus: foc,
                        focusUsable: !!VV._focusEverTrue,
                        noFocusMs: VV._noFocusAt ? Date.now() - VV._noFocusAt : 0,
                        rafGap: VV._rafSeen ? Date.now() - (VV._rafLast || 0) : -1,
                        streak: VV._hidStreak || 0,
                        gate: vvGateActive(),
                        blocked: VV._gateBlocked || 0,
                        blockedSrc: VV._gateSrcBlocked || 0,
                        srcGuard: !!VV._srcGuard,
                        sweep: VV._sweepCount || 0,
                        pipelines: vvMediaPipelineCount(),
                        lastReleaseAt: VV._lastReleaseAt || 0,
                        muteBy: VV._muteBy || '',
                        muteCount: VV._muteCount || 0,
                        restoreCount: VV._restoreCount || 0,
                        hibCount: (VV._hib || []).length,
                        lastReleaseWhy: VV._lastReleaseWhy || ''
                    };
                },
                sweep: function () { try { vvBackgroundSweep(); } catch (e) {} },
                pipelines: function () { try { return vvMediaPipelineCount(); } catch (e) { return -1; } },
                visibilityTick: function () { try { vvVisibilityTick(); } catch (e) {} },
                requestPeerRelease: function () { try { vvRequestPeerRelease(); } catch (e) {} },
                peerReleaseSeen: function () { try { vvPeerReleaseSeen(); } catch (e) {} },
                deepHibernateBlob: function () { try { return vvDeepHibernateBlob(); } catch (e) { return -1; } },
                codecRescue: function (why) { try { return vvCodecRescue(why || 'api'); } catch (e) { return false; } },
                lastRescue: function () { return VV._lastRescue || null; },
                // 本页当前有多少条媒体管线（=可能各占一个解码器）
                mediaCount: function () {
                    var n = 0, withSrc = 0;
                    try {
                        var vs = document.querySelectorAll('video,audio');
                        n = vs.length;
                        for (var i = 0; i < vs.length; i++) {
                            var s = '';
                            try { s = vs[i].currentSrc || vs[i].getAttribute('src') || ''; } catch (e1) {}
                            if (s) withSrc++;
                        }
                    } catch (e2) {}
                    return { el: n, withSrc: withSrc, pool: (VV._hlsPool || []).length, playerActive: !!VV.playerActive };
                },
                videoSrcLen: function () {
                    var v = document.querySelector('.vv-player-video');
                    if (!v) return -1;
                    // 判据用 src 属性/IDL，不用 currentSrc：
                    // 摘掉 src + load() 之后 currentSrc 会残留一小会儿（要等资源选择跑完），
                    // 拿它判断"还没释放"会误报。真正的释放信号是属性没了。
                    var s = '';
                    try { s = v.getAttribute('src') || ''; } catch (e0) {}
                    if (!s) { try { s = v.src || ''; } catch (e1) {} }
                    return s.length;
                },
                // 页面级解码器治理：本页还挂着几条媒体管线、被别的页签叫停过几次
                releaseAllMedia: function (why) { try { return vvReleaseAllMedia(why || 'api'); } catch (e) { return -1; } },
                pausePageMedia: function () { try { vvPausePageMedia(); } catch (e) {} },
                // 页面预载治理：按住几条、守卫有没有在跑、当前页面还剩几条在拉的媒体
                stopPagePreload: function () { try { vvStopPagePreload(); } catch (e) {} },
                preloadState: function () {
                    var n = 0;
                    try {
                        var els = document.querySelectorAll('video,audio');
                        for (var i = 0; i < els.length; i++) {
                            var s = '';
                            try { s = els[i].currentSrc || els[i].getAttribute('src') || ''; } catch (e0) {}
                            if (s && els[i].networkState === 2) n++;
                        }
                    } catch (e1) {}
                    return {
                        held: (VV._pagePreload || []).length,
                        guard: !!VV._preloadTimer,
                        loadingNow: n,
                        aborts: VV._preloadAbort || 0
                    };
                },
                pageMedia: function () { return (VV._pageMedia || []).length; },
                peerStats: function () {
                    return {
                        released: !!VV._peerReleased,
                        at: VV._peerReleasedAt || 0,
                        n: VV._peerReleaseCount || 0,
                        handled: VV._peerHandled || 0,
                        timer: !!VV._peerTimer
                    };
                },
                // 嗅探开销自查：卡顿/卡死时先看这里，判断是"页面本身就重"还是"我们把页面拖重了"。
                // bodySkip 是省下来的响应体读取次数（js/css/html 这类），
                // moDropped 是 DOM 洪峰时主动丢弃的节点数（丢弃说明页面的节点生产速度超过了消费速度）。
                cost: function () {
                    return {
                        items: VV.items.length,
                        moNodes: VV._moNodes || 0,
                        moDropped: VV._moDropped || 0,
                        moQueue: (typeof vvMoQueue !== 'undefined' && vvMoQueue) ? vvMoQueue.length : 0,
                        bodyRead: VV._bodyRead || 0,
                        bodySkip: VV._bodySkip || 0,
                        bodySkipMb: +(((VV._bodySkipKb || 0) / 1024).toFixed(1)),
                        seen: Object.keys(VV.seen || {}).length,
                        perfSeen: (typeof vvPerfSeen !== 'undefined' && vvPerfSeen) ? Object.keys(vvPerfSeen).length : 0
                    };
                }
            };
        }
    } catch (eD) {}
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', vvMain, false);
} else {
    vvMain();
}
})();
