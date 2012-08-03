
var Movie = (function(){
    
    var isChrome;

    var listeners = [];
    var sketch;
    var element, movie, frame;

    var shouldLoop = false;
    var isAvailable = false;
    var lastTime = -1, pollerTs = -1;
    var fpsToSeconds;

    var callListeners = function (meth, args) {
        for ( var i = 0, k = listeners.length; i < k; i++ ) {
            if ( meth in listeners[i] ) {
                listeners[i][meth].apply(listeners[i],args);
            }
        }
    }
    
    var addVideoEventListeners = function () {
        
        // TODO:
        // watching properties:
        // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperty

        var events = ['abort', 'canplay', 'canplaythrough', 'durationchange', 
        'emptied', 'ended', 'error', 'loadeddata', 'loadedmetadata', 
        'loadstart', 'mozaudioavailable', 'pause', 'play', 'playing', 
        'progress', 'ratechange', 'seeked', 'seeking', 'suspend', 'timeupdate', 
        'volumechange', 'waiting'];

        for ( var i = 0; i < events.length; i++ ) {
            var fnName = "on"+events[i][0].toUpperCase()+events[i].substring(1);
            try {
                var fn = eval( fnName );
                element.addEventListener(events[i],fn);
            } catch (e) {
                // ignore
            }
        }
    }

    var onError = function (evt) {
        var errMsg = "";
        switch ( element.networkState ) {
            case element.NETWORK_EMPTY:
                errMsg = "Loading did not start yet."; break;
            case element.NETWORK_IDLE:
                errMsg = "Loading did not start yet."; break;
            case element.NETWORK_LOADING:
                errMsg = "Loading has not finished yet."; break;
            case element.NETWORK_NO_SOURCE:
                errMsg = "The source provided is missing. "+element.src; break;
            default:
                errMsg = "Not sure what happened ... care to report it to fjenett@gmail.com ?";
        }
        alert(errMsg);
    }

    var onLoadedmetadata = function (evt) {
        element.setAttribute('width',element.videoWidth);
        element.setAttribute('height',element.videoHeight);
        fpsToSeconds = 1000.0/element.fps;
    }

    var onTimeupdate = function (evt) {
        if ( shouldLoop && isChrome && element.currentTime === element.duration ) {
            element.addEventListener('canplay',function(){
                element.play();
                startPolling();
            });
            stopPolling();
            element.src = element.currentSrc;
        }
    }

    var startPolling = function () {
        var doPoll = function () {
            if ( element.readyState < 3 ) {
                isAvailable = false;
            } else {
                var now = element.currentTime;
                isAvailable = lastTime !== now;
                if ( isAvailable ) {
                    callListeners('movieEvent',[movie]);
                }
                lastTime = now;
            }
            pollerTs = setTimeout( doPoll, 1000/25.0 );
        }
        doPoll();
    }

    var stopPolling = function () {
        clearTimeout(pollerTs);
    }

    // http://en.wikipedia.org/wiki/Comparison_of_layout_engines_(HTML5_Media)
    
    // https://developer.mozilla.org/en/DOM/HTMLVideoElement
    // https://developer.mozilla.org/en/DOM/HTMLMediaElement
    // https://developer-new.mozilla.org/en-US/docs/DOM/Media_events
    
    // https://developer.mozilla.org/En/Manipulating_video_using_canvas
    // http://www.html5videoguide.net/presentations/HTML5_Video_LCA2011/
        
    var Movie = function () {

        var opts = {};
        
        if ( arguments.length == 1 && typeof arguments[0] == 'object' ) {
            opts = arguments[0];
        } else if (arguments.length >= 2) {
            var args = Array.prototype.slice.call(arguments);
            // var-args assumes: listener, src1, src2, …, srcN
            var l = args.shift();
            opts = {
                src: args,
                listener: l
            };
        } else {
            throw('Wrong number of args passed to Movie()!');
        }

        element = opts.element;
        if ( !opts.element && opts.src ) {
            element = document.createElement('video');
            element.setAttribute( 'crossorigin', 'anonymous' );
            //element.setAttribute( 'controls', 'controls' );
            //element.setAttribute( 'src', opts.src );
            for ( var i = 0, k = opts.src.length; i < k; i++ ) {
                var source = document.createElement('source');
                source.setAttribute('src', opts.src[i]);
                element.appendChild(source);
            }
            var container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-10000px';
            container.style.top = '-10000px';
            // container.style.width = '320px';
            // container.style.height = '240px';
            container.appendChild( element );
            document.body.appendChild( container );
        }


        shouldLoop = 'loop' in element;
        
        listeners = [];
        if ( opts.listener )
        {
            listeners.push(opts.listener);
            sketch = opts.listener;
            frame = new sketch.PImage();
        }
            
        addVideoEventListeners();

        isChrome = navigator.appVersion.toLowerCase().indexOf('chrome') >= 0;

        movie = this;
    }
    
    Movie.prototype = {
        /* sets the volume */
        volume: function ( vol ) {
            return element.volume( vol );
        },
        /* Reads the current frame of the movie. */
        read: function () {
            frame = new sketch.PImage;
            //frame.sourceImg = element;
            frame.fromHTMLImageData(element);
            return frame;
        },
        /* Returns "true" when a new movie frame is available to read. */
        available: function () {
            return isAvailable;
        },
        /* Play the movie */
        play: function () {
            element.play();
            startPolling();
        },
        isPlaying : function () {
            return !element.paused;
        },
        /* Pause the movie */
        pause: function () {
            element.pause();
            stopPolling();
        },
        isPaused : function () {
            return element.paused;
        },
        /* Stop the movie */
        stop: function () {
            element.stop();
            stopPolling();
        },
        /* Set loop attribute */
        loop : function () {
          shouldLoop = true;
          element.setAttribute('loop','loop');
        },
        /* Set loop attribute */
        noLoop: function () {
          shouldLoop = false;
          element.removeAttribute('loop');
        },
        isLooping : function () {
          return shouldLoop;
        },
        /* Jump to a specific second (from float) in the video */
        jump: function ( seconds ) {
            element.currentTime = seconds;
        },
        /* Return duration in seconds with frac (as float) */
        duration: function () {
            return element.duration;
        },
        /* Return video current time as seconds with frac (as float) */
        time: function () {
            return element.currentTime;
        },
        /* Set playback speed to be scaled by given value (as float) */
        speed: function ( rate ) {
            if ( rate !== 0.0 )
                element.playbackRate = rate;
            else
            {
                element.pause();
            }
        },
        /* Set the frame rate of the movie in fps */
        frameRate: function ( rate ) {
            // can't as we can not get the fps from the movie ... ideas?
            throw( 'Please use speed() instead' );
        },
        /* ? */
        ready: function () {
            return element.readyState > 2;
        },
        /*  */
        dispose: function () {
            this.stop();
            document.body.removeChild(element);
            delete element;
        },
        /*  */
        newFrame: function () {
            return this.available();
        },
        /*  */
        getFilename: function () {
            return element.currentSrc;
        },
        /* PImage inheritance */
        /* http://processing.org/reference/PImage.html */
        get: function () {
            return frame.get.apply(frame,arguments);
        },
        set: function () {
            return frame.set.apply(frame,arguments);
        },
        copy: function () {
            return frame.copy.apply(frame,arguments);
        },
        mask: function () {
            return frame.mask.apply(frame,arguments);
        },
        blend: function () {
            return frame.blend.apply(frame,arguments);
        },
        filter: function () {
            return frame.filter.apply(frame,arguments);
        },
        save: function () {
            return frame.save.apply(frame,arguments);
        },
        resize: function (){
            return frame.resize.apply(frame,arguments);
        },
        loadPixels: function () {
            return frame.loadPixels.apply(frame,arguments);
        },
        updatePixels: function () {
            return frame.updatePixels.apply(frame,arguments);
        }
        /*, toImageData: function () {
            return frame.toImageData.apply(frame,arguments);
        }*/
    };
    
    return Movie;
    
})();

/*
    These are Java reflection dumps on Movie.class (Processing build 0207)
*/
/*
public processing.core.PImage processing.core.PImage.get()
public int processing.core.PImage.get(int,int)
public processing.core.PImage processing.core.PImage.get(int,int,int,int)
public java.lang.Object processing.core.PImage.clone() throws java.lang.CloneNotSupportedException
public void processing.core.PImage.init(int,int,int)
public boolean processing.core.PImage.save(java.lang.String)
public void processing.core.PImage.copy(processing.core.PImage,int,int,int,int,int,int,int,int)
public void processing.core.PImage.copy(int,int,int,int,int,int,int,int)
public void processing.core.PImage.set(int,int,processing.core.PImage)
public void processing.core.PImage.set(int,int,int)
public void processing.core.PImage.resize(int,int)
public void processing.core.PImage.mask(int[])
public void processing.core.PImage.mask(processing.core.PImage)
public void processing.core.PImage.setCache(processing.core.PGraphics,java.lang.Object)
public java.lang.Object processing.core.PImage.getParams(processing.core.PGraphics)
public void processing.core.PImage.setParams(processing.core.PGraphics,java.lang.Object)
public void processing.core.PImage.loadPixels()
public void processing.core.PImage.updatePixels(int,int,int,int)
public void processing.core.PImage.updatePixels()
public void processing.core.PImage.filter(int,float)
public void processing.core.PImage.filter(int)
public java.lang.Object processing.core.PImage.getCache(processing.core.PGraphics)
public void processing.core.PImage.removeCache(processing.core.PGraphics)
public void processing.core.PImage.removeParams(processing.core.PGraphics)
public static int processing.core.PImage.blendColor(int,int,int)
public void processing.core.PImage.blend(processing.core.PImage,int,int,int,int,int,int,int,int,int)
public void processing.core.PImage.blend(int,int,int,int,int,int,int,int,int)
public java.awt.Image processing.core.PImage.getImage()
public boolean processing.core.PImage.isModified()
public void processing.core.PImage.setModified(boolean)
public void processing.core.PImage.setModified()
public int processing.core.PImage.getModifiedX1()
public int processing.core.PImage.getModifiedX2()
public int processing.core.PImage.getModifiedY1()
public int processing.core.PImage.getModifiedY2()
*/

/*
public void processing.video.Movie.stop()
public void processing.video.Movie.delete()
public synchronized void processing.video.Movie.read()
public boolean processing.video.Movie.available()
public float processing.video.Movie.time()
public boolean processing.video.Movie.ready()
public void processing.video.Movie.loop()
public void processing.video.Movie.frameRate(float)
public void processing.video.Movie.pause()
public void processing.video.Movie.noLoop()
public void processing.video.Movie.dispose()
public void processing.video.Movie.play()
public void processing.video.Movie.speed(float)
public boolean processing.video.Movie.newFrame()
public int processing.video.Movie.getSourceWidth()
public int processing.video.Movie.getSourceHeight()
public float processing.video.Movie.getSourceFrameRate()
public float processing.video.Movie.duration()
public void processing.video.Movie.jump(float)
public boolean processing.video.Movie.isPlaying()
public boolean processing.video.Movie.isPaused()
public boolean processing.video.Movie.isLooping()
public void processing.video.Movie.goToBeginning()
public void processing.video.Movie.goToEnd()
public void processing.video.Movie.volume(float)
public java.lang.String processing.video.Movie.getFilename()
public void processing.video.Movie.printElements()
public void processing.video.Movie.setEventHandlerObject(java.lang.Object)
public void processing.video.Movie.setBufferSink(java.lang.Object,java.lang.String)
public void processing.video.Movie.setBufferSink(java.lang.Object)
public boolean processing.video.Movie.hasBufferSink()
public synchronized void processing.video.Movie.disposeBuffer(java.lang.Object)
*/