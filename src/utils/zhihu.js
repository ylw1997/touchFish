// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require("crypto-js");
window = (function () {
  var v_saf;
  !(function () {
    var n = Function.toString,
      t = [],
      i = [],
      o = [].indexOf.bind(t),
      e = [].push.bind(t),
      r = [].push.bind(i);
    function u(n, t) {
      return (
        -1 == o(n) &&
          (e(n), r(`function ${t || n.name || ""}() { [native code] }`)),
        n
      );
    }
    Object.defineProperty(Function.prototype, "toString", {
      enumerable: !1,
      configurable: !0,
      writable: !0,
      value: function () {
        return ("function" == typeof this && i[o(this)]) || n.call(this);
      },
    }),
      u(Function.prototype.toString, "toString"),
      (v_saf = u);
  })();

  function _inherits(t, e) {
    (t.prototype = Object.create(e.prototype, {
      constructor: { value: t, writable: !0, configurable: !0 },
    })),
      e && Object.setPrototypeOf(t, e);
  }
  Object.defineProperty(Object.prototype, Symbol.toStringTag, {
    get() {
      return Object.getPrototypeOf(this).constructor.name;
    },
    configurable: true,
  });
  var v_new_toggle = true;
  var v_console_logger = console.log;
  var v_allow_types = ["string", "number", "boolean"];
  console.log = v_saf(function (a) {
    if (v_allow_types.indexOf(typeof a) != -1) {
      v_console_logger.apply(this, arguments);
    }
  }, "log");
  console.debug = v_saf(function (a) {
    if (v_allow_types.indexOf(typeof a) != -1) {
      v_console_logger.apply(this, arguments);
    }
  }, "debug");
  console.warn = v_saf(function (a) {
    if (v_allow_types.indexOf(typeof a) != -1) {
      v_console_logger.apply(this, arguments);
    }
  }, "warn");
  console.info = v_saf(function (a) {
    if (v_allow_types.indexOf(typeof a) != -1) {
      v_console_logger.apply(this, arguments);
    }
  }, "info");
  var v_console_log = function () {};;
  var v_random = (function () {
    var seed = 276951438;
    return function random() {
      return (seed = (seed * 9301 + 49297) % 233280), seed / 233280;
    };
  })();
  var v_new = function (v) {
    var temp = v_new_toggle;
    v_new_toggle = true;
    var r = new v();
    v_new_toggle = temp;
    return r;
  };

  Navigator = v_saf(function Navigator() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
    this._plugins = typeof PluginArray == "undefined" ? [] : v_new(PluginArray);
    this._mimeTypes =
      typeof MimeTypeArray == "undefined" ? [] : v_new(MimeTypeArray);
  });
  Storage = v_saf(function Storage() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  EventTarget = v_saf(function EventTarget() {});
  NodeList = v_saf(function NodeList() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  HTMLCollection = v_saf(function HTMLCollection() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  NamedNodeMap = v_saf(function NamedNodeMap() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  Event = v_saf(function Event() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  MessageChannel = v_saf(function MessageChannel() {});
  CSSStyleDeclaration = v_saf(function CSSStyleDeclaration() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  URLSearchParams = v_saf(function URLSearchParams() {});
  Headers = v_saf(function Headers() {});
  PerformanceTiming = v_saf(function PerformanceTiming() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  PerformanceObserver = v_saf(function PerformanceObserver() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  Crypto = v_saf(function Crypto() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
    this.getRandomValues = function () {
      v_console_log("  [*] Crypto -> getRandomValues[func]");
      var e = arguments[0];
      return e.map(function (x, i) {
        return (e[i] = v_random() * 1073741824);
      });
    };
    this.randomUUID = function () {
      v_console_log("  [*] Crypto -> randomUUID[func]");
      function get2() {
        return ((v_random() * 255) ^ 0).toString(16).padStart(2, "0");
      }
      function rpt(func, num) {
        var r = [];
        for (var i = 0; i < num; i++) {
          r.push(func());
        }
        return r.join("");
      }
      return [
        rpt(get2, 4),
        rpt(get2, 2),
        rpt(get2, 2),
        rpt(get2, 2),
        rpt(get2, 6),
      ].join("-");
    };
  });
  IntersectionObserver = v_saf(function IntersectionObserver() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  StyleSheet = v_saf(function StyleSheet() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  CSSRuleList = v_saf(function CSSRuleList() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  DOMRectReadOnly = v_saf(function DOMRectReadOnly() {});
  ResizeObserver = v_saf(function ResizeObserver() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  ResizeObserverEntry = v_saf(function ResizeObserverEntry() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  PerformanceObserverEntryList = v_saf(function PerformanceObserverEntryList() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  PerformanceEntry = v_saf(function PerformanceEntry() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  Response = v_saf(function Response() {});
  IntersectionObserverEntry = v_saf(function IntersectionObserverEntry() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  DOMTokenList = v_saf(function DOMTokenList() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  NavigatorUAData = v_saf(function NavigatorUAData() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  Blob = v_saf(function Blob() {});
  History = v_saf(function History() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  webkitURL = v_saf(function webkitURL() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  MutationObserver = v_saf(function MutationObserver() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  WebKitMutationObserver = v_saf(function WebKitMutationObserver() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  FormData = v_saf(function FormData() {});
  Image = v_saf(function Image() {
    return v_new(HTMLImageElement);
  });
  PluginArray = v_saf(function PluginArray() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
    this[0] = v_new(Plugin);
    this[0].description = "Portable Document Format";
    this[0].filename = "internal-pdf-viewer";
    this[0].length = 2;
    this[0].name = "PDF Viewer";
    this[1] = v_new(Plugin);
    this[1].description = "Portable Document Format";
    this[1].filename = "internal-pdf-viewer";
    this[1].length = 2;
    this[1].name = "Chrome PDF Viewer";
    this[2] = v_new(Plugin);
    this[2].description = "Portable Document Format";
    this[2].filename = "internal-pdf-viewer";
    this[2].length = 2;
    this[2].name = "Chromium PDF Viewer";
    this[3] = v_new(Plugin);
    this[3].description = "Portable Document Format";
    this[3].filename = "internal-pdf-viewer";
    this[3].length = 2;
    this[3].name = "Microsoft Edge PDF Viewer";
    this[4] = v_new(Plugin);
    this[4].description = "Portable Document Format";
    this[4].filename = "internal-pdf-viewer";
    this[4].length = 2;
    this[4].name = "WebKit built-in PDF";
  });
  Plugin = v_saf(function Plugin() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  MimeType = v_saf(function MimeType() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  CanvasRenderingContext2D = v_saf(function CanvasRenderingContext2D() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  WebGLRenderingContext = v_saf(function WebGLRenderingContext() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
    function WebGLBuffer() {}
    function WebGLProgram() {}
    function WebGLShader() {}
    this._toggle = {};
    this.createBuffer = function () {
      v_console_log("  [*] WebGLRenderingContext -> createBuffer[func]");
      return v_new(WebGLBuffer);
    };
    this.createProgram = function () {
      v_console_log("  [*] WebGLRenderingContext -> createProgram[func]");
      return v_new(WebGLProgram);
    };
    this.createShader = function () {
      v_console_log("  [*] WebGLRenderingContext -> createShader[func]");
      return v_new(WebGLShader);
    };
    this.getSupportedExtensions = function () {
      v_console_log(
        "  [*] WebGLRenderingContext -> getSupportedExtensions[func]"
      );
      return [
        "ANGLE_instanced_arrays",
        "EXT_blend_minmax",
        "EXT_color_buffer_half_float",
        "EXT_disjoint_timer_query",
        "EXT_float_blend",
        "EXT_frag_depth",
        "EXT_shader_texture_lod",
        "EXT_texture_compression_bptc",
        "EXT_texture_compression_rgtc",
        "EXT_texture_filter_anisotropic",
        "WEBKIT_EXT_texture_filter_anisotropic",
        "EXT_sRGB",
        "KHR_parallel_shader_compile",
        "OES_element_index_uint",
        "OES_fbo_render_mipmap",
        "OES_standard_derivatives",
        "OES_texture_float",
        "OES_texture_float_linear",
        "OES_texture_half_float",
        "OES_texture_half_float_linear",
        "OES_vertex_array_object",
        "WEBGL_color_buffer_float",
        "WEBGL_compressed_texture_s3tc",
        "WEBKIT_WEBGL_compressed_texture_s3tc",
        "WEBGL_compressed_texture_s3tc_srgb",
        "WEBGL_debug_renderer_info",
        "WEBGL_debug_shaders",
        "WEBGL_depth_texture",
        "WEBKIT_WEBGL_depth_texture",
        "WEBGL_draw_buffers",
        "WEBGL_lose_context",
        "WEBKIT_WEBGL_lose_context",
        "WEBGL_multi_draw",
      ];
    };
    var self = this;
    this.getExtension = function (key) {
      v_console_log("  [*] WebGLRenderingContext -> getExtension[func]:", key);
      class WebGLDebugRendererInfo {
        get UNMASKED_VENDOR_WEBGL() {
          self._toggle[37445] = 1;
          return 37445;
        }
        get UNMASKED_RENDERER_WEBGL() {
          self._toggle[37446] = 1;
          return 37446;
        }
      }
      class EXTTextureFilterAnisotropic {}
      class WebGLLoseContext {
        loseContext() {}
        restoreContext() {}
      }
      if (key == "WEBGL_debug_renderer_info") {
        var r = new WebGLDebugRendererInfo();
      }
      if (key == "EXT_texture_filter_anisotropic") {
        var r = new EXTTextureFilterAnisotropic();
      }
      if (key == "WEBGL_lose_context") {
        var r = new WebGLLoseContext();
      } else {
        var r = new WebGLDebugRendererInfo();
      }
      return r;
    };
    this.getParameter = function (key) {
      v_console_log("  [*] WebGLRenderingContext -> getParameter[func]:", key);
      if (this._toggle[key]) {
        if (key == 37445) {
          return "Google Inc. (NVIDIA)";
        }
        if (key == 37446) {
          return "ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0, D3D11-27.21.14.5671)";
        }
      } else {
        if (key == 33902) {
          return new Float32Array([1, 1]);
        }
        if (key == 33901) {
          return new Float32Array([1, 1024]);
        }
        if (key == 35661) {
          return 32;
        }
        if (key == 34047) {
          return 16;
        }
        if (key == 34076) {
          return 16384;
        }
        if (key == 36349) {
          return 1024;
        }
        if (key == 34024) {
          return 16384;
        }
        if (key == 34930) {
          return 16;
        }
        if (key == 3379) {
          return 16384;
        }
        if (key == 36348) {
          return 30;
        }
        if (key == 34921) {
          return 16;
        }
        if (key == 35660) {
          return 16;
        }
        if (key == 36347) {
          return 4095;
        }
        if (key == 3386) {
          return new Int32Array([32767, 32767]);
        }
        if (key == 3410) {
          return 8;
        }
        if (key == 7937) {
          return "WebKit WebGL";
        }
        if (key == 35724) {
          return "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)";
        }
        if (key == 3415) {
          return 0;
        }
        if (key == 7936) {
          return "WebKit";
        }
        if (key == 7938) {
          return "WebGL 1.0 (OpenGL ES 2.0 Chromium)";
        }
        if (key == 3411) {
          return 8;
        }
        if (key == 3412) {
          return 8;
        }
        if (key == 3413) {
          return 8;
        }
        if (key == 3414) {
          return 24;
        }
        return null;
      }
    };
    this.getContextAttributes = function () {
      v_console_log(
        "  [*] WebGLRenderingContext -> getContextAttributes[func]"
      );
      return {
        alpha: true,
        antialias: true,
        depth: true,
        desynchronized: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: "default",
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: false,
        xrCompatible: false,
      };
    };
    this.getShaderPrecisionFormat = function (a, b) {
      v_console_log(
        "  [*] WebGLRenderingContext -> getShaderPrecisionFormat[func]"
      );
      function WebGLShaderPrecisionFormat() {}
      var r1 = v_new(WebGLShaderPrecisionFormat);
      r1.rangeMin = 127;
      r1.rangeMax = 127;
      r1.precision = 23;
      var r2 = v_new(WebGLShaderPrecisionFormat);
      r2.rangeMin = 31;
      r2.rangeMax = 30;
      r2.precision = 0;
      if (a == 35633 && b == 36338) {
        return r1;
      }
      if (a == 35633 && b == 36337) {
        return r1;
      }
      if (a == 35633 && b == 36336) {
        return r1;
      }
      if (a == 35633 && b == 36341) {
        return r2;
      }
      if (a == 35633 && b == 36340) {
        return r2;
      }
      if (a == 35633 && b == 36339) {
        return r2;
      }
      if (a == 35632 && b == 36338) {
        return r1;
      }
      if (a == 35632 && b == 36337) {
        return r1;
      }
      if (a == 35632 && b == 36336) {
        return r1;
      }
      if (a == 35632 && b == 36341) {
        return r2;
      }
      if (a == 35632 && b == 36340) {
        return r2;
      }
      if (a == 35632 && b == 36339) {
        return r2;
      }
      throw Error("getShaderPrecisionFormat");
    };
    v_saf(this.createBuffer, "createBuffer");
    v_saf(this.createProgram, "createProgram");
    v_saf(this.createShader, "createShader");
    v_saf(this.getSupportedExtensions, "getSupportedExtensions");
    v_saf(this.getExtension, "getExtension");
    v_saf(this.getParameter, "getParameter");
    v_saf(this.getContextAttributes, "getContextAttributes");
    v_saf(this.getShaderPrecisionFormat, "getShaderPrecisionFormat");
  });
  WebGLShaderPrecisionFormat = v_saf(function WebGLShaderPrecisionFormat() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  AudioParam = v_saf(function AudioParam() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  AudioBuffer = v_saf(function AudioBuffer() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  TextDecoder = v_saf(function TextDecoder() {});
  Node = v_saf(function Node() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(Node, EventTarget);
  MessageEvent = v_saf(function MessageEvent() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(MessageEvent, Event);
  MessagePort = v_saf(function MessagePort() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(MessagePort, EventTarget);
  Performance = v_saf(function Performance() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(Performance, EventTarget);
  UIEvent = v_saf(function UIEvent() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(UIEvent, Event);
  CSSStyleSheet = v_saf(function CSSStyleSheet() {});
  _inherits(CSSStyleSheet, StyleSheet);
  XMLHttpRequestEventTarget = v_saf(function XMLHttpRequestEventTarget() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(XMLHttpRequestEventTarget, EventTarget);
  DOMRect = v_saf(function DOMRect() {});
  _inherits(DOMRect, DOMRectReadOnly);
  BroadcastChannel = v_saf(function BroadcastChannel() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(BroadcastChannel, EventTarget);
  PromiseRejectionEvent = v_saf(function PromiseRejectionEvent() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PromiseRejectionEvent, Event);
  Screen = v_saf(function Screen() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(Screen, EventTarget);
  NetworkInformation = v_saf(function NetworkInformation() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(NetworkInformation, EventTarget);
  MediaQueryList = v_saf(function MediaQueryList() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(MediaQueryList, EventTarget);
  BaseAudioContext = v_saf(function BaseAudioContext() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(BaseAudioContext, EventTarget);
  AudioNode = v_saf(function AudioNode() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(AudioNode, EventTarget);
  OfflineAudioCompletionEvent = v_saf(function OfflineAudioCompletionEvent() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(OfflineAudioCompletionEvent, Event);
  Worker = v_saf(function Worker() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(Worker, EventTarget);
  WebSocket = v_saf(function WebSocket() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(WebSocket, EventTarget);
  PerformanceResourceTiming = v_saf(function PerformanceResourceTiming() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PerformanceResourceTiming, PerformanceEntry);
  PageTransitionEvent = v_saf(function PageTransitionEvent() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PageTransitionEvent, Event);
  LayoutShift = v_saf(function LayoutShift() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(LayoutShift, PerformanceEntry);
  Document = v_saf(function Document() {});
  _inherits(Document, Node);
  Element = v_saf(function Element() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(Element, Node);
  MouseEvent = v_saf(function MouseEvent() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(MouseEvent, UIEvent);
  XMLHttpRequest = v_saf(function XMLHttpRequest() {});
  _inherits(XMLHttpRequest, XMLHttpRequestEventTarget);
  Attr = v_saf(function Attr() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(Attr, Node);
  AudioScheduledSourceNode = v_saf(function AudioScheduledSourceNode() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(AudioScheduledSourceNode, AudioNode);
  DynamicsCompressorNode = v_saf(function DynamicsCompressorNode() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(DynamicsCompressorNode, AudioNode);
  OfflineAudioContext = v_saf(function OfflineAudioContext() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(OfflineAudioContext, BaseAudioContext);
  PerformanceNavigationTiming = v_saf(function PerformanceNavigationTiming() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PerformanceNavigationTiming, PerformanceResourceTiming);
  HTMLElement = v_saf(function HTMLElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLElement, Element);
  SVGElement = v_saf(function SVGElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(SVGElement, Element);
  PointerEvent = v_saf(function PointerEvent() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PointerEvent, MouseEvent);
  OscillatorNode = v_saf(function OscillatorNode() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(OscillatorNode, AudioScheduledSourceNode);
  HTMLScriptElement = v_saf(function HTMLScriptElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLScriptElement, HTMLElement);
  HTMLLinkElement = v_saf(function HTMLLinkElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLLinkElement, HTMLElement);
  HTMLInputElement = v_saf(function HTMLInputElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLInputElement, HTMLElement);
  HTMLCanvasElement = v_saf(function HTMLCanvasElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLCanvasElement, HTMLElement);
  HTMLStyleElement = v_saf(function HTMLStyleElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLStyleElement, HTMLElement);
  HTMLMetaElement = v_saf(function HTMLMetaElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLMetaElement, HTMLElement);
  HTMLImageElement = v_saf(function HTMLImageElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLImageElement, HTMLElement);
  HTMLAnchorElement = v_saf(function HTMLAnchorElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
    v_hook_href(this, "HTMLAnchorElement", location.href);
  });
  _inherits(HTMLAnchorElement, HTMLElement);
  HTMLTemplateElement = v_saf(function HTMLTemplateElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLTemplateElement, HTMLElement);
  Window = v_saf(function Window() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(Window, EventTarget);
  HTMLDocument = v_saf(function HTMLDocument() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
    Object.defineProperty(this, "location", {
      get() {
        return location;
      },
    });
  });
  _inherits(HTMLDocument, Document);
  HTMLHtmlElement = v_saf(function HTMLHtmlElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLHtmlElement, HTMLElement);
  HTMLHeadElement = v_saf(function HTMLHeadElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLHeadElement, HTMLElement);
  HTMLBodyElement = v_saf(function HTMLBodyElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLBodyElement, HTMLElement);
  MimeTypeArray = v_saf(function MimeTypeArray() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
    this[0] = v_new(Plugin);
    this[0].description = "Portable Document Format";
    this[0].enabledPlugin = { 0: {}, 1: {} };
    this[0].suffixes = "pdf";
    this[0].type = "application/pdf";
    this[1] = v_new(Plugin);
    this[1].description = "Portable Document Format";
    this[1].enabledPlugin = { 0: {}, 1: {} };
    this[1].suffixes = "pdf";
    this[1].type = "text/pdf";
  });
  Location = v_saf(function Location() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  PerformanceElementTiming = v_saf(function PerformanceElementTiming() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PerformanceElementTiming, PerformanceEntry);
  PerformanceEventTiming = v_saf(function PerformanceEventTiming() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PerformanceEventTiming, PerformanceEntry);
  PerformanceLongTaskTiming = v_saf(function PerformanceLongTaskTiming() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PerformanceLongTaskTiming, PerformanceEntry);
  PerformanceMark = v_saf(function PerformanceMark() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PerformanceMark, PerformanceEntry);
  PerformanceMeasure = v_saf(function PerformanceMeasure() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PerformanceMeasure, PerformanceEntry);
  PerformanceNavigation = v_saf(function PerformanceNavigation() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  PerformancePaintTiming = v_saf(function PerformancePaintTiming() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(PerformancePaintTiming, PerformanceEntry);
  PerformanceServerTiming = v_saf(function PerformanceServerTiming() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  HTMLMediaElement = v_saf(function HTMLMediaElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLMediaElement, HTMLElement);
  HTMLUnknownElement = v_saf(function HTMLUnknownElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLUnknownElement, HTMLElement);
  Touch = v_saf(function Touch() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  TouchEvent = v_saf(function TouchEvent() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(TouchEvent, UIEvent);
  HTMLDivElement = v_saf(function HTMLDivElement() {
    if (!v_new_toggle) {
      throw TypeError("Illegal constructor");
    }
  });
  _inherits(HTMLDivElement, HTMLElement);
  Object.defineProperties(Navigator.prototype, {
    userAgent: {
      get() {
        v_console_log(
          "  [*] Navigator -> userAgent[get]",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
        );
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
      },
    },
    platform: {
      get() {
        v_console_log("  [*] Navigator -> platform[get]", "Win32");
        return "Win32";
      },
    },
    webdriver: {
      get() {
        v_console_log("  [*] Navigator -> webdriver[get]", false);
        return false;
      },
    },
    language: {
      get() {
        v_console_log("  [*] Navigator -> language[get]", "zh-CN");
        return "zh-CN";
      },
    },
    connection: {
      get() {
        v_console_log("  [*] Navigator -> connection[get]", {});
        return {};
      },
    },
    maxTouchPoints: {
      get() {
        v_console_log("  [*] Navigator -> maxTouchPoints[get]", 0);
        return 0;
      },
    },
    hardwareConcurrency: {
      get() {
        v_console_log("  [*] Navigator -> hardwareConcurrency[get]", 12);
        return 12;
      },
    },
    appName: {
      get() {
        v_console_log("  [*] Navigator -> appName[get]", "Netscape");
        return "Netscape";
      },
    },
    plugins: {
      get() {
        v_console_log("  [*] Navigator -> plugins[get]", this._plugins || []);
        return this._plugins || [];
      },
    },
    languages: {
      get() {
        v_console_log("  [*] Navigator -> languages[get]", {});
        return {};
      },
    },
    productSub: {
      get() {
        v_console_log("  [*] Navigator -> productSub[get]", "20030107");
        return "20030107";
      },
    },
    cookieEnabled: {
      get() {
        v_console_log("  [*] Navigator -> cookieEnabled[get]", true);
        return true;
      },
    },
    vendorSub: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    productSub: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "20030107";
      },
      set: function () {
        return true;
      },
    },
    vendor: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "Google Inc.";
      },
      set: function () {
        return true;
      },
    },
    maxTouchPoints: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    pdfViewerEnabled: {
      enumerable: true,
      configurable: true,
      get: function () {
        return true;
      },
      set: function () {
        return true;
      },
    },
    hardwareConcurrency: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 12;
      },
      set: function () {
        return true;
      },
    },
    cookieEnabled: {
      enumerable: true,
      configurable: true,
      get: function () {
        return true;
      },
      set: function () {
        return true;
      },
    },
    appCodeName: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "Mozilla";
      },
      set: function () {
        return true;
      },
    },
    appName: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "Netscape";
      },
      set: function () {
        return true;
      },
    },
    appVersion: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
      },
      set: function () {
        return true;
      },
    },
    platform: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "Win32";
      },
      set: function () {
        return true;
      },
    },
    product: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "Gecko";
      },
      set: function () {
        return true;
      },
    },
    userAgent: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
      },
      set: function () {
        return true;
      },
    },
    language: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "zh-CN";
      },
      set: function () {
        return true;
      },
    },
    languages: {
      enumerable: true,
      configurable: true,
      get: function () {
        return ["zh-CN", "zh", "en"];
      },
      set: function () {
        return true;
      },
    },
    onLine: {
      enumerable: true,
      configurable: true,
      get: function () {
        return true;
      },
      set: function () {
        return true;
      },
    },
    webdriver: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    deprecatedRunAdAuctionEnforcesKAnonymity: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    deviceMemory: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 8;
      },
      set: function () {
        return true;
      },
    },
    [Symbol.toStringTag]: {
      value: "Navigator",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Storage.prototype, {
    [Symbol.toStringTag]: {
      value: "Storage",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(EventTarget.prototype, {
    removeEventListener: {
      value: v_saf(function removeEventListener() {
        v_console_log(
          "  [*] EventTarget -> removeEventListener[func]",
          [].slice.call(arguments)
        );
      }),
    },
    dispatchEvent: {
      value: v_saf(function dispatchEvent() {
        v_console_log(
          "  [*] EventTarget -> dispatchEvent[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "EventTarget",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(NodeList.prototype, {
    length: {
      get() {
        v_console_log("  [*] NodeList -> length[get]", 1);
        return 1;
      },
    },
    forEach: {
      value: v_saf(function forEach() {
        v_console_log(
          "  [*] NodeList -> forEach[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "NodeList",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLCollection.prototype, {
    length: {
      get() {
        v_console_log("  [*] HTMLCollection -> length[get]", 57);
        return 57;
      },
    },
    [Symbol.toStringTag]: {
      value: "HTMLCollection",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(NamedNodeMap.prototype, {
    length: {
      get() {
        v_console_log("  [*] NamedNodeMap -> length[get]", 10);
        return 10;
      },
    },
    [Symbol.toStringTag]: {
      value: "NamedNodeMap",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Event.prototype, {
    target: {
      get() {
        v_console_log("  [*] Event -> target[get]", {});
        return {};
      },
    },
    eventPhase: {
      get() {
        v_console_log("  [*] Event -> eventPhase[get]", 3);
        return 3;
      },
    },
    bubbles: {
      get() {
        v_console_log("  [*] Event -> bubbles[get]", true);
        return true;
      },
    },
    cancelable: {
      get() {
        v_console_log("  [*] Event -> cancelable[get]", true);
        return true;
      },
    },
    timeStamp: {
      get() {
        v_console_log("  [*] Event -> timeStamp[get]", 1286.3999996185303);
        return 1286.3999996185303;
      },
    },
    defaultPrevented: {
      get() {
        v_console_log("  [*] Event -> defaultPrevented[get]", false);
        return false;
      },
    },
    type: {
      get() {
        v_console_log("  [*] Event -> type[get]", "error");
        return "error";
      },
    },
    initEvent: {
      value: v_saf(function initEvent() {
        v_console_log(
          "  [*] Event -> initEvent[func]",
          [].slice.call(arguments)
        );
      }),
    },
    CAPTURING_PHASE: {
      value: 1,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    AT_TARGET: {
      value: 2,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BUBBLING_PHASE: {
      value: 3,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    [Symbol.toStringTag]: {
      value: "Event",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(MessageChannel.prototype, {
    port2: {
      get() {
        v_console_log("  [*] MessageChannel -> port2[get]", {});
        return {};
      },
    },
    port1: {
      get() {
        v_console_log("  [*] MessageChannel -> port1[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "MessageChannel",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(CSSStyleDeclaration.prototype, {
    cssFloat: {
      set() {
        v_console_log(
          "  [*] CSSStyleDeclaration -> cssFloat[set]",
          [].slice.call(arguments)
        );
      },
    },
    [Symbol.toStringTag]: {
      value: "CSSStyleDeclaration",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(URLSearchParams.prototype, {
    toString: {
      value: v_saf(function toString() {
        v_console_log(
          "  [*] URLSearchParams -> toString[func]",
          [].slice.call(arguments)
        );
      }),
    },
    forEach: {
      value: v_saf(function forEach() {
        v_console_log(
          "  [*] URLSearchParams -> forEach[func]",
          [].slice.call(arguments)
        );
      }),
    },
    get: {
      value: v_saf(function get() {
        v_console_log(
          "  [*] URLSearchParams -> get[func]",
          [].slice.call(arguments)
        );
      }),
    },
    has: {
      value: v_saf(function has() {
        v_console_log(
          "  [*] URLSearchParams -> has[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "URLSearchParams",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Headers.prototype, {
    has: {
      value: v_saf(function has() {
        v_console_log("  [*] Headers -> has[func]", [].slice.call(arguments));
      }),
    },
    get: {
      value: v_saf(function get() {
        v_console_log("  [*] Headers -> get[func]", [].slice.call(arguments));
      }),
    },
    set: {
      value: v_saf(function set() {
        v_console_log("  [*] Headers -> set[func]", [].slice.call(arguments));
      }),
    },
    [Symbol.toStringTag]: {
      value: "Headers",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceTiming.prototype, {
    navigationStart: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> navigationStart[get]",
          1754295216312
        );
        return 1754295216312;
      },
    },
    loadEventEnd: {
      get() {
        v_console_log("  [*] PerformanceTiming -> loadEventEnd[get]", 0);
        return 0;
      },
    },
    unloadEventStart: {
      get() {
        v_console_log("  [*] PerformanceTiming -> unloadEventStart[get]", 0);
        return 0;
      },
    },
    unloadEventEnd: {
      get() {
        v_console_log("  [*] PerformanceTiming -> unloadEventEnd[get]", 0);
        return 0;
      },
    },
    redirectStart: {
      get() {
        v_console_log("  [*] PerformanceTiming -> redirectStart[get]", 0);
        return 0;
      },
    },
    redirectEnd: {
      get() {
        v_console_log("  [*] PerformanceTiming -> redirectEnd[get]", 0);
        return 0;
      },
    },
    fetchStart: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> fetchStart[get]",
          1754295216316
        );
        return 1754295216316;
      },
    },
    domainLookupStart: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> domainLookupStart[get]",
          1754295216316
        );
        return 1754295216316;
      },
    },
    domainLookupEnd: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> domainLookupEnd[get]",
          1754295216316
        );
        return 1754295216316;
      },
    },
    connectStart: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> connectStart[get]",
          1754295216316
        );
        return 1754295216316;
      },
    },
    connectEnd: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> connectEnd[get]",
          1754295216316
        );
        return 1754295216316;
      },
    },
    secureConnectionStart: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> secureConnectionStart[get]",
          0
        );
        return 0;
      },
    },
    requestStart: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> requestStart[get]",
          1754295216325
        );
        return 1754295216325;
      },
    },
    responseStart: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> responseStart[get]",
          1754295216718
        );
        return 1754295216718;
      },
    },
    responseEnd: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> responseEnd[get]",
          1754295216727
        );
        return 1754295216727;
      },
    },
    domLoading: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> domLoading[get]",
          1754295216722
        );
        return 1754295216722;
      },
    },
    domInteractive: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> domInteractive[get]",
          1754295217088
        );
        return 1754295217088;
      },
    },
    domContentLoadedEventStart: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> domContentLoadedEventStart[get]",
          1754295217118
        );
        return 1754295217118;
      },
    },
    domContentLoadedEventEnd: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> domContentLoadedEventEnd[get]",
          1754295217686
        );
        return 1754295217686;
      },
    },
    domComplete: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> domComplete[get]",
          1754295218456
        );
        return 1754295218456;
      },
    },
    loadEventStart: {
      get() {
        v_console_log(
          "  [*] PerformanceTiming -> loadEventStart[get]",
          1754295218457
        );
        return 1754295218457;
      },
    },
    [Symbol.toStringTag]: {
      value: "PerformanceTiming",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceObserver.prototype, {
    observe: {
      value: v_saf(function observe() {
        v_console_log(
          "  [*] PerformanceObserver -> observe[func]",
          [].slice.call(arguments)
        );
      }),
    },
    takeRecords: {
      value: v_saf(function takeRecords() {
        v_console_log(
          "  [*] PerformanceObserver -> takeRecords[func]",
          [].slice.call(arguments)
        );
      }),
    },
    disconnect: {
      value: v_saf(function disconnect() {
        v_console_log(
          "  [*] PerformanceObserver -> disconnect[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "PerformanceObserver",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Crypto.prototype, {
    [Symbol.toStringTag]: {
      value: "Crypto",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(IntersectionObserver.prototype, {
    observe: {
      value: v_saf(function observe() {
        v_console_log(
          "  [*] IntersectionObserver -> observe[func]",
          [].slice.call(arguments)
        );
      }),
    },
    disconnect: {
      value: v_saf(function disconnect() {
        v_console_log(
          "  [*] IntersectionObserver -> disconnect[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "IntersectionObserver",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(StyleSheet.prototype, {
    [Symbol.toStringTag]: {
      value: "StyleSheet",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(CSSRuleList.prototype, {
    length: {
      get() {
        v_console_log("  [*] CSSRuleList -> length[get]", 28);
        return 28;
      },
    },
    [Symbol.toStringTag]: {
      value: "CSSRuleList",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(DOMRectReadOnly.prototype, {
    bottom: {
      get() {
        v_console_log("  [*] DOMRectReadOnly -> bottom[get]", 5490.125);
        return 5490.125;
      },
    },
    top: {
      get() {
        v_console_log("  [*] DOMRectReadOnly -> top[get]", 323);
        return 323;
      },
    },
    left: {
      get() {
        v_console_log("  [*] DOMRectReadOnly -> left[get]", 577);
        return 577;
      },
    },
    height: {
      get() {
        v_console_log("  [*] DOMRectReadOnly -> height[get]", 1324.1875);
        return 1324.1875;
      },
    },
    [Symbol.toStringTag]: {
      value: "DOMRectReadOnly",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(ResizeObserver.prototype, {
    observe: {
      value: v_saf(function observe() {
        v_console_log(
          "  [*] ResizeObserver -> observe[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "ResizeObserver",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(ResizeObserverEntry.prototype, {
    contentRect: {
      get() {
        v_console_log("  [*] ResizeObserverEntry -> contentRect[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "ResizeObserverEntry",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceObserverEntryList.prototype, {
    getEntries: {
      value: v_saf(function getEntries() {
        v_console_log(
          "  [*] PerformanceObserverEntryList -> getEntries[func]",
          [].slice.call(arguments)
        );
      }),
    },
    getEntriesByType: {
      value: v_saf(function getEntriesByType() {
        v_console_log(
          "  [*] PerformanceObserverEntryList -> getEntriesByType[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "PerformanceObserverEntryList",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceEntry.prototype, {
    duration: {
      get() {
        v_console_log("  [*] PerformanceEntry -> duration[get]", 222);
        return 222;
      },
    },
    name: {
      get() {
        v_console_log(
          "  [*] PerformanceEntry -> name[get]",
          "https://static.zhihu.com/heifetz/1393.216a26f4.c1535c3425216136df59.css"
        );
        return "https://static.zhihu.com/heifetz/1393.216a26f4.c1535c3425216136df59.css";
      },
    },
    startTime: {
      get() {
        v_console_log(
          "  [*] PerformanceEntry -> startTime[get]",
          1765.1999998092651
        );
        return 1765.1999998092651;
      },
    },
    [Symbol.toStringTag]: {
      value: "PerformanceEntry",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Response.prototype, {
    ok: {
      get() {
        v_console_log("  [*] Response -> ok[get]", false);
        return false;
      },
    },
    status: {
      get() {
        v_console_log("  [*] Response -> status[get]", 200);
        return 200;
      },
    },
    headers: {
      get() {
        v_console_log("  [*] Response -> headers[get]", {});
        return {};
      },
    },
    json: {
      value: v_saf(function json() {
        v_console_log("  [*] Response -> json[func]", [].slice.call(arguments));
      }),
    },
    [Symbol.toStringTag]: {
      value: "Response",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(IntersectionObserverEntry.prototype, {
    isIntersecting: {
      get() {
        v_console_log(
          "  [*] IntersectionObserverEntry -> isIntersecting[get]",
          true
        );
        return true;
      },
    },
    intersectionRatio: {
      get() {
        v_console_log(
          "  [*] IntersectionObserverEntry -> intersectionRatio[get]",
          0.22896182537078857
        );
        return 0.22896182537078857;
      },
    },
    target: {
      get() {
        v_console_log("  [*] IntersectionObserverEntry -> target[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "IntersectionObserverEntry",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(DOMTokenList.prototype, {
    add: {
      value: v_saf(function add() {
        v_console_log(
          "  [*] DOMTokenList -> add[func]",
          [].slice.call(arguments)
        );
      }),
    },
    remove: {
      value: v_saf(function remove() {
        v_console_log(
          "  [*] DOMTokenList -> remove[func]",
          [].slice.call(arguments)
        );
      }),
    },
    contains: {
      value: v_saf(function contains() {
        v_console_log(
          "  [*] DOMTokenList -> contains[func]",
          [].slice.call(arguments)
        );
      }),
    },
    toggle: {
      value: v_saf(function toggle() {
        v_console_log(
          "  [*] DOMTokenList -> toggle[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "DOMTokenList",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(NavigatorUAData.prototype, {
    brands: {
      get() {
        v_console_log("  [*] NavigatorUAData -> brands[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "NavigatorUAData",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Blob.prototype, {
    size: {
      get() {
        v_console_log("  [*] Blob -> size[get]", 100);
        return 100;
      },
    },
    [Symbol.toStringTag]: {
      value: "Blob",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(History.prototype, {
    state: {
      get() {
        v_console_log("  [*] History -> state[get]", {});
        return {};
      },
    },
    length: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 1;
      },
      set: function () {
        return true;
      },
    },
    scrollRestoration: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "auto";
      },
      set: function () {
        return true;
      },
    },
    [Symbol.toStringTag]: {
      value: "History",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(webkitURL.prototype, {
    searchParams: {
      get() {
        v_console_log("  [*] webkitURL -> searchParams[get]", {});
        return {};
      },
    },
    pathname: {
      get() {
        v_console_log(
          "  [*] webkitURL -> pathname[get]",
          "/api/v4/creator/apply"
        );
        return "/api/v4/creator/apply";
      },
      set() {
        v_console_log(
          "  [*] webkitURL -> pathname[set]",
          [].slice.call(arguments)
        );
        return "/api/v4/creator/apply";
      },
    },
    href: {
      get() {
        v_console_log("  [*] webkitURL -> href[get]", "http://a/c%20d?a=1&c=3");
        return "http://a/c%20d?a=1&c=3";
      },
    },
    username: {
      get() {
        v_console_log("  [*] webkitURL -> username[get]", "a");
        return "a";
      },
    },
    host: {
      get() {
        v_console_log("  [*] webkitURL -> host[get]", "x");
        return "x";
      },
    },
    hash: {
      get() {
        v_console_log("  [*] webkitURL -> hash[get]", "#%D0%B1");
        return "#%D0%B1";
      },
    },
    hostname: {
      get() {
        v_console_log("  [*] webkitURL -> hostname[get]", "www.zhihu.com");
        return "www.zhihu.com";
      },
    },
    search: {
      get() {
        v_console_log("  [*] webkitURL -> search[get]", "");
        return "";
      },
    },
    [Symbol.toStringTag]: {
      value: "webkitURL",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(MutationObserver.prototype, {
    observe: {
      value: v_saf(function observe() {
        v_console_log(
          "  [*] MutationObserver -> observe[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "MutationObserver",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(WebKitMutationObserver.prototype, {
    observe: {
      value: v_saf(function observe() {
        v_console_log(
          "  [*] WebKitMutationObserver -> observe[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "WebKitMutationObserver",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(FormData.prototype, {
    append: {
      value: v_saf(function append() {
        v_console_log(
          "  [*] FormData -> append[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "FormData",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Image.prototype, {
    src: {
      set() {
        v_console_log("  [*] Image -> src[set]", [].slice.call(arguments));
      },
    },
    width: {
      get() {
        v_console_log("  [*] Image -> width[get]", 1);
        return 1;
      },
    },
    height: {
      get() {
        v_console_log("  [*] Image -> height[get]", 1);
        return 1;
      },
    },
    complete: {
      get() {
        v_console_log("  [*] Image -> complete[get]", false);
        return false;
      },
    },
    [Symbol.toStringTag]: {
      value: "Image",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PluginArray.prototype, {
    length: {
      get() {
        v_console_log("  [*] PluginArray -> length[get]", 5);
        return 5;
      },
    },
    [Symbol.toStringTag]: {
      value: "PluginArray",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Plugin.prototype, {
    [Symbol.toStringTag]: {
      value: "Plugin",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(MimeType.prototype, {
    [Symbol.toStringTag]: {
      value: "MimeType",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(CanvasRenderingContext2D.prototype, {
    rect: {
      value: v_saf(function rect() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> rect[func]",
          [].slice.call(arguments)
        );
      }),
    },
    isPointInPath: {
      value: v_saf(function isPointInPath() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> isPointInPath[func]",
          [].slice.call(arguments)
        );
      }),
    },
    textBaseline: {
      set() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> textBaseline[set]",
          [].slice.call(arguments)
        );
      },
    },
    fillStyle: {
      set() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> fillStyle[set]",
          [].slice.call(arguments)
        );
      },
    },
    fillRect: {
      value: v_saf(function fillRect() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> fillRect[func]",
          [].slice.call(arguments)
        );
      }),
    },
    font: {
      set() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> font[set]",
          [].slice.call(arguments)
        );
      },
    },
    fillText: {
      value: v_saf(function fillText() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> fillText[func]",
          [].slice.call(arguments)
        );
      }),
    },
    globalCompositeOperation: {
      set() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> globalCompositeOperation[set]",
          [].slice.call(arguments)
        );
      },
    },
    beginPath: {
      value: v_saf(function beginPath() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> beginPath[func]",
          [].slice.call(arguments)
        );
      }),
    },
    arc: {
      value: v_saf(function arc() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> arc[func]",
          [].slice.call(arguments)
        );
      }),
    },
    closePath: {
      value: v_saf(function closePath() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> closePath[func]",
          [].slice.call(arguments)
        );
      }),
    },
    fill: {
      value: v_saf(function fill() {
        v_console_log(
          "  [*] CanvasRenderingContext2D -> fill[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "CanvasRenderingContext2D",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(WebGLRenderingContext.prototype, {
    bindBuffer: {
      value: v_saf(function bindBuffer() {
        v_console_log(
          "  [*] WebGLRenderingContext -> bindBuffer[func]",
          [].slice.call(arguments)
        );
      }),
    },
    bufferData: {
      value: v_saf(function bufferData() {
        v_console_log(
          "  [*] WebGLRenderingContext -> bufferData[func]",
          [].slice.call(arguments)
        );
      }),
    },
    shaderSource: {
      value: v_saf(function shaderSource() {
        v_console_log(
          "  [*] WebGLRenderingContext -> shaderSource[func]",
          [].slice.call(arguments)
        );
      }),
    },
    compileShader: {
      value: v_saf(function compileShader() {
        v_console_log(
          "  [*] WebGLRenderingContext -> compileShader[func]",
          [].slice.call(arguments)
        );
      }),
    },
    attachShader: {
      value: v_saf(function attachShader() {
        v_console_log(
          "  [*] WebGLRenderingContext -> attachShader[func]",
          [].slice.call(arguments)
        );
      }),
    },
    linkProgram: {
      value: v_saf(function linkProgram() {
        v_console_log(
          "  [*] WebGLRenderingContext -> linkProgram[func]",
          [].slice.call(arguments)
        );
      }),
    },
    useProgram: {
      value: v_saf(function useProgram() {
        v_console_log(
          "  [*] WebGLRenderingContext -> useProgram[func]",
          [].slice.call(arguments)
        );
      }),
    },
    getAttribLocation: {
      value: v_saf(function getAttribLocation() {
        v_console_log(
          "  [*] WebGLRenderingContext -> getAttribLocation[func]",
          [].slice.call(arguments)
        );
      }),
    },
    getUniformLocation: {
      value: v_saf(function getUniformLocation() {
        v_console_log(
          "  [*] WebGLRenderingContext -> getUniformLocation[func]",
          [].slice.call(arguments)
        );
      }),
    },
    enableVertexAttribArray: {
      value: v_saf(function enableVertexAttribArray() {
        v_console_log(
          "  [*] WebGLRenderingContext -> enableVertexAttribArray[func]",
          [].slice.call(arguments)
        );
      }),
    },
    vertexAttribPointer: {
      value: v_saf(function vertexAttribPointer() {
        v_console_log(
          "  [*] WebGLRenderingContext -> vertexAttribPointer[func]",
          [].slice.call(arguments)
        );
      }),
    },
    uniform2f: {
      value: v_saf(function uniform2f() {
        v_console_log(
          "  [*] WebGLRenderingContext -> uniform2f[func]",
          [].slice.call(arguments)
        );
      }),
    },
    drawArrays: {
      value: v_saf(function drawArrays() {
        v_console_log(
          "  [*] WebGLRenderingContext -> drawArrays[func]",
          [].slice.call(arguments)
        );
      }),
    },
    canvas: {
      get() {
        v_console_log(
          "  [*] WebGLRenderingContext -> canvas[get]",
          this._canvas
        );
        return this._canvas;
      },
    },
    clearColor: {
      value: v_saf(function clearColor() {
        v_console_log(
          "  [*] WebGLRenderingContext -> clearColor[func]",
          [].slice.call(arguments)
        );
      }),
    },
    enable: {
      value: v_saf(function enable() {
        v_console_log(
          "  [*] WebGLRenderingContext -> enable[func]",
          [].slice.call(arguments)
        );
      }),
    },
    depthFunc: {
      value: v_saf(function depthFunc() {
        v_console_log(
          "  [*] WebGLRenderingContext -> depthFunc[func]",
          [].slice.call(arguments)
        );
      }),
    },
    clear: {
      value: v_saf(function clear() {
        v_console_log(
          "  [*] WebGLRenderingContext -> clear[func]",
          [].slice.call(arguments)
        );
      }),
    },
    DEPTH_BUFFER_BIT: {
      value: 256,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_BUFFER_BIT: {
      value: 1024,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    COLOR_BUFFER_BIT: {
      value: 16384,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LINES: { value: 1, writable: false, enumerable: true, configurable: false },
    LINE_LOOP: {
      value: 2,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LINE_STRIP: {
      value: 3,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TRIANGLES: {
      value: 4,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TRIANGLE_STRIP: {
      value: 5,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TRIANGLE_FAN: {
      value: 6,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ONE: { value: 1, writable: false, enumerable: true, configurable: false },
    SRC_COLOR: {
      value: 768,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ONE_MINUS_SRC_COLOR: {
      value: 769,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SRC_ALPHA: {
      value: 770,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ONE_MINUS_SRC_ALPHA: {
      value: 771,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DST_ALPHA: {
      value: 772,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ONE_MINUS_DST_ALPHA: {
      value: 773,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DST_COLOR: {
      value: 774,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ONE_MINUS_DST_COLOR: {
      value: 775,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SRC_ALPHA_SATURATE: {
      value: 776,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FUNC_ADD: {
      value: 32774,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BLEND_EQUATION: {
      value: 32777,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BLEND_EQUATION_RGB: {
      value: 32777,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BLEND_EQUATION_ALPHA: {
      value: 34877,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FUNC_SUBTRACT: {
      value: 32778,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FUNC_REVERSE_SUBTRACT: {
      value: 32779,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BLEND_DST_RGB: {
      value: 32968,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BLEND_SRC_RGB: {
      value: 32969,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BLEND_DST_ALPHA: {
      value: 32970,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BLEND_SRC_ALPHA: {
      value: 32971,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CONSTANT_COLOR: {
      value: 32769,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ONE_MINUS_CONSTANT_COLOR: {
      value: 32770,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CONSTANT_ALPHA: {
      value: 32771,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ONE_MINUS_CONSTANT_ALPHA: {
      value: 32772,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BLEND_COLOR: {
      value: 32773,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ARRAY_BUFFER: {
      value: 34962,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ELEMENT_ARRAY_BUFFER: {
      value: 34963,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ARRAY_BUFFER_BINDING: {
      value: 34964,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ELEMENT_ARRAY_BUFFER_BINDING: {
      value: 34965,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STREAM_DRAW: {
      value: 35040,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STATIC_DRAW: {
      value: 35044,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DYNAMIC_DRAW: {
      value: 35048,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BUFFER_SIZE: {
      value: 34660,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BUFFER_USAGE: {
      value: 34661,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CURRENT_VERTEX_ATTRIB: {
      value: 34342,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRONT: {
      value: 1028,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BACK: {
      value: 1029,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRONT_AND_BACK: {
      value: 1032,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_2D: {
      value: 3553,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CULL_FACE: {
      value: 2884,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BLEND: {
      value: 3042,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DITHER: {
      value: 3024,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_TEST: {
      value: 2960,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_TEST: {
      value: 2929,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SCISSOR_TEST: {
      value: 3089,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    POLYGON_OFFSET_FILL: {
      value: 32823,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SAMPLE_ALPHA_TO_COVERAGE: {
      value: 32926,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SAMPLE_COVERAGE: {
      value: 32928,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INVALID_ENUM: {
      value: 1280,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INVALID_VALUE: {
      value: 1281,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INVALID_OPERATION: {
      value: 1282,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    OUT_OF_MEMORY: {
      value: 1285,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CW: { value: 2304, writable: false, enumerable: true, configurable: false },
    CCW: {
      value: 2305,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LINE_WIDTH: {
      value: 2849,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ALIASED_POINT_SIZE_RANGE: {
      value: 33901,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ALIASED_LINE_WIDTH_RANGE: {
      value: 33902,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CULL_FACE_MODE: {
      value: 2885,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRONT_FACE: {
      value: 2886,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_RANGE: {
      value: 2928,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_WRITEMASK: {
      value: 2930,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_CLEAR_VALUE: {
      value: 2931,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_FUNC: {
      value: 2932,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_CLEAR_VALUE: {
      value: 2961,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_FUNC: {
      value: 2962,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_FAIL: {
      value: 2964,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_PASS_DEPTH_FAIL: {
      value: 2965,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_PASS_DEPTH_PASS: {
      value: 2966,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_REF: {
      value: 2967,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_VALUE_MASK: {
      value: 2963,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_WRITEMASK: {
      value: 2968,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_BACK_FUNC: {
      value: 34816,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_BACK_FAIL: {
      value: 34817,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_BACK_PASS_DEPTH_FAIL: {
      value: 34818,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_BACK_PASS_DEPTH_PASS: {
      value: 34819,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_BACK_REF: {
      value: 36003,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_BACK_VALUE_MASK: {
      value: 36004,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_BACK_WRITEMASK: {
      value: 36005,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VIEWPORT: {
      value: 2978,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SCISSOR_BOX: {
      value: 3088,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    COLOR_CLEAR_VALUE: {
      value: 3106,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    COLOR_WRITEMASK: {
      value: 3107,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    UNPACK_ALIGNMENT: {
      value: 3317,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    PACK_ALIGNMENT: {
      value: 3333,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_TEXTURE_SIZE: {
      value: 3379,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_VIEWPORT_DIMS: {
      value: 3386,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SUBPIXEL_BITS: {
      value: 3408,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RED_BITS: {
      value: 3410,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    GREEN_BITS: {
      value: 3411,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BLUE_BITS: {
      value: 3412,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ALPHA_BITS: {
      value: 3413,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_BITS: {
      value: 3414,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_BITS: {
      value: 3415,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    POLYGON_OFFSET_UNITS: {
      value: 10752,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    POLYGON_OFFSET_FACTOR: {
      value: 32824,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_BINDING_2D: {
      value: 32873,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SAMPLE_BUFFERS: {
      value: 32936,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SAMPLES: {
      value: 32937,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SAMPLE_COVERAGE_VALUE: {
      value: 32938,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SAMPLE_COVERAGE_INVERT: {
      value: 32939,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    COMPRESSED_TEXTURE_FORMATS: {
      value: 34467,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DONT_CARE: {
      value: 4352,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FASTEST: {
      value: 4353,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    NICEST: {
      value: 4354,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    GENERATE_MIPMAP_HINT: {
      value: 33170,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BYTE: {
      value: 5120,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    UNSIGNED_BYTE: {
      value: 5121,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SHORT: {
      value: 5122,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    UNSIGNED_SHORT: {
      value: 5123,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INT: {
      value: 5124,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    UNSIGNED_INT: {
      value: 5125,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FLOAT: {
      value: 5126,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_COMPONENT: {
      value: 6402,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ALPHA: {
      value: 6406,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RGB: {
      value: 6407,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RGBA: {
      value: 6408,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LUMINANCE: {
      value: 6409,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LUMINANCE_ALPHA: {
      value: 6410,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    UNSIGNED_SHORT_4_4_4_4: {
      value: 32819,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    UNSIGNED_SHORT_5_5_5_1: {
      value: 32820,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    UNSIGNED_SHORT_5_6_5: {
      value: 33635,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAGMENT_SHADER: {
      value: 35632,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VERTEX_SHADER: {
      value: 35633,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_VERTEX_ATTRIBS: {
      value: 34921,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_VERTEX_UNIFORM_VECTORS: {
      value: 36347,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_VARYING_VECTORS: {
      value: 36348,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_COMBINED_TEXTURE_IMAGE_UNITS: {
      value: 35661,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: {
      value: 35660,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_TEXTURE_IMAGE_UNITS: {
      value: 34930,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_FRAGMENT_UNIFORM_VECTORS: {
      value: 36349,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SHADER_TYPE: {
      value: 35663,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DELETE_STATUS: {
      value: 35712,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LINK_STATUS: {
      value: 35714,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VALIDATE_STATUS: {
      value: 35715,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ATTACHED_SHADERS: {
      value: 35717,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ACTIVE_UNIFORMS: {
      value: 35718,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ACTIVE_ATTRIBUTES: {
      value: 35721,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SHADING_LANGUAGE_VERSION: {
      value: 35724,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CURRENT_PROGRAM: {
      value: 35725,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    NEVER: {
      value: 512,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LESS: {
      value: 513,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    EQUAL: {
      value: 514,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LEQUAL: {
      value: 515,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    GREATER: {
      value: 516,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    NOTEQUAL: {
      value: 517,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    GEQUAL: {
      value: 518,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ALWAYS: {
      value: 519,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    KEEP: {
      value: 7680,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    REPLACE: {
      value: 7681,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INCR: {
      value: 7682,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DECR: {
      value: 7683,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INVERT: {
      value: 5386,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INCR_WRAP: {
      value: 34055,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DECR_WRAP: {
      value: 34056,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VENDOR: {
      value: 7936,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERER: {
      value: 7937,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VERSION: {
      value: 7938,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    NEAREST: {
      value: 9728,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LINEAR: {
      value: 9729,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    NEAREST_MIPMAP_NEAREST: {
      value: 9984,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LINEAR_MIPMAP_NEAREST: {
      value: 9985,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    NEAREST_MIPMAP_LINEAR: {
      value: 9986,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LINEAR_MIPMAP_LINEAR: {
      value: 9987,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_MAG_FILTER: {
      value: 10240,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_MIN_FILTER: {
      value: 10241,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_WRAP_S: {
      value: 10242,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_WRAP_T: {
      value: 10243,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE: {
      value: 5890,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_CUBE_MAP: {
      value: 34067,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_BINDING_CUBE_MAP: {
      value: 34068,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_CUBE_MAP_POSITIVE_X: {
      value: 34069,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_CUBE_MAP_NEGATIVE_X: {
      value: 34070,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_CUBE_MAP_POSITIVE_Y: {
      value: 34071,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_CUBE_MAP_NEGATIVE_Y: {
      value: 34072,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_CUBE_MAP_POSITIVE_Z: {
      value: 34073,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE_CUBE_MAP_NEGATIVE_Z: {
      value: 34074,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_CUBE_MAP_TEXTURE_SIZE: {
      value: 34076,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE0: {
      value: 33984,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE1: {
      value: 33985,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE2: {
      value: 33986,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE3: {
      value: 33987,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE4: {
      value: 33988,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE5: {
      value: 33989,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE6: {
      value: 33990,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE7: {
      value: 33991,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE8: {
      value: 33992,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE9: {
      value: 33993,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE10: {
      value: 33994,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE11: {
      value: 33995,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE12: {
      value: 33996,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE13: {
      value: 33997,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE14: {
      value: 33998,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE15: {
      value: 33999,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE16: {
      value: 34000,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE17: {
      value: 34001,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE18: {
      value: 34002,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE19: {
      value: 34003,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE20: {
      value: 34004,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE21: {
      value: 34005,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE22: {
      value: 34006,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE23: {
      value: 34007,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE24: {
      value: 34008,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE25: {
      value: 34009,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE26: {
      value: 34010,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE27: {
      value: 34011,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE28: {
      value: 34012,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE29: {
      value: 34013,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE30: {
      value: 34014,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXTURE31: {
      value: 34015,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ACTIVE_TEXTURE: {
      value: 34016,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    REPEAT: {
      value: 10497,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CLAMP_TO_EDGE: {
      value: 33071,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MIRRORED_REPEAT: {
      value: 33648,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FLOAT_VEC2: {
      value: 35664,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FLOAT_VEC3: {
      value: 35665,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FLOAT_VEC4: {
      value: 35666,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INT_VEC2: {
      value: 35667,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INT_VEC3: {
      value: 35668,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INT_VEC4: {
      value: 35669,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BOOL: {
      value: 35670,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BOOL_VEC2: {
      value: 35671,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BOOL_VEC3: {
      value: 35672,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BOOL_VEC4: {
      value: 35673,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FLOAT_MAT2: {
      value: 35674,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FLOAT_MAT3: {
      value: 35675,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FLOAT_MAT4: {
      value: 35676,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SAMPLER_2D: {
      value: 35678,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    SAMPLER_CUBE: {
      value: 35680,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VERTEX_ATTRIB_ARRAY_ENABLED: {
      value: 34338,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VERTEX_ATTRIB_ARRAY_SIZE: {
      value: 34339,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VERTEX_ATTRIB_ARRAY_STRIDE: {
      value: 34340,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VERTEX_ATTRIB_ARRAY_TYPE: {
      value: 34341,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VERTEX_ATTRIB_ARRAY_NORMALIZED: {
      value: 34922,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VERTEX_ATTRIB_ARRAY_POINTER: {
      value: 34373,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: {
      value: 34975,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    IMPLEMENTATION_COLOR_READ_TYPE: {
      value: 35738,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    IMPLEMENTATION_COLOR_READ_FORMAT: {
      value: 35739,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    COMPILE_STATUS: {
      value: 35713,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LOW_FLOAT: {
      value: 36336,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MEDIUM_FLOAT: {
      value: 36337,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    HIGH_FLOAT: {
      value: 36338,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LOW_INT: {
      value: 36339,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MEDIUM_INT: {
      value: 36340,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    HIGH_INT: {
      value: 36341,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER: {
      value: 36160,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER: {
      value: 36161,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RGBA4: {
      value: 32854,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RGB5_A1: {
      value: 32855,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RGB565: {
      value: 36194,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_COMPONENT16: {
      value: 33189,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_INDEX8: {
      value: 36168,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_STENCIL: {
      value: 34041,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER_WIDTH: {
      value: 36162,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER_HEIGHT: {
      value: 36163,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER_INTERNAL_FORMAT: {
      value: 36164,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER_RED_SIZE: {
      value: 36176,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER_GREEN_SIZE: {
      value: 36177,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER_BLUE_SIZE: {
      value: 36178,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER_ALPHA_SIZE: {
      value: 36179,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER_DEPTH_SIZE: {
      value: 36180,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER_STENCIL_SIZE: {
      value: 36181,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: {
      value: 36048,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: {
      value: 36049,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: {
      value: 36050,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: {
      value: 36051,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    COLOR_ATTACHMENT0: {
      value: 36064,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_ATTACHMENT: {
      value: 36096,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    STENCIL_ATTACHMENT: {
      value: 36128,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DEPTH_STENCIL_ATTACHMENT: {
      value: 33306,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER_COMPLETE: {
      value: 36053,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER_INCOMPLETE_ATTACHMENT: {
      value: 36054,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: {
      value: 36055,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER_INCOMPLETE_DIMENSIONS: {
      value: 36057,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER_UNSUPPORTED: {
      value: 36061,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    FRAMEBUFFER_BINDING: {
      value: 36006,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RENDERBUFFER_BINDING: {
      value: 36007,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    MAX_RENDERBUFFER_SIZE: {
      value: 34024,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    INVALID_FRAMEBUFFER_OPERATION: {
      value: 1286,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    UNPACK_FLIP_Y_WEBGL: {
      value: 37440,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: {
      value: 37441,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CONTEXT_LOST_WEBGL: {
      value: 37442,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    UNPACK_COLORSPACE_CONVERSION_WEBGL: {
      value: 37443,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    BROWSER_DEFAULT_WEBGL: {
      value: 37444,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RGB8: {
      value: 32849,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    RGBA8: {
      value: 32856,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    [Symbol.toStringTag]: {
      value: "WebGLRenderingContext",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(WebGLShaderPrecisionFormat.prototype, {
    precision: {
      get() {
        v_console_log("  [*] WebGLShaderPrecisionFormat -> precision[get]", 0);
        return 0;
      },
    },
    rangeMin: {
      get() {
        v_console_log("  [*] WebGLShaderPrecisionFormat -> rangeMin[get]", 31);
        return 31;
      },
    },
    rangeMax: {
      get() {
        v_console_log("  [*] WebGLShaderPrecisionFormat -> rangeMax[get]", 30);
        return 30;
      },
    },
    [Symbol.toStringTag]: {
      value: "WebGLShaderPrecisionFormat",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(AudioParam.prototype, {
    setValueAtTime: {
      value: v_saf(function setValueAtTime() {
        v_console_log(
          "  [*] AudioParam -> setValueAtTime[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "AudioParam",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(AudioBuffer.prototype, {
    getChannelData: {
      value: v_saf(function getChannelData() {
        v_console_log(
          "  [*] AudioBuffer -> getChannelData[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "AudioBuffer",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(TextDecoder.prototype, {
    decode: {
      value: v_saf(function decode() {
        v_console_log(
          "  [*] TextDecoder -> decode[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "TextDecoder",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Node.prototype, {
    appendChild: {
      value: v_saf(function appendChild() {
        v_console_log(
          "  [*] Node -> appendChild[func]",
          [].slice.call(arguments)
        );
      }),
    },
    nodeType: {
      get() {
        v_console_log("  [*] Node -> nodeType[get]", 1);
        return 1;
      },
    },
    ownerDocument: {
      get() {
        v_console_log("  [*] Node -> ownerDocument[get]", {});
        return {};
      },
    },
    firstChild: {
      get() {
        v_console_log("  [*] Node -> firstChild[get]", {});
        return {};
      },
    },
    nextSibling: {
      get() {
        v_console_log("  [*] Node -> nextSibling[get]", {});
        return {};
      },
    },
    nodeName: {
      get() {
        v_console_log("  [*] Node -> nodeName[get]", "BODY");
        return "BODY";
      },
    },
    removeChild: {
      value: v_saf(function removeChild() {
        v_console_log(
          "  [*] Node -> removeChild[func]",
          [].slice.call(arguments)
        );
      }),
    },
    textContent: {
      get() {
        v_console_log(
          "  [*] Node -> textContent[get]",
          '<p></p><figure data-size="normal"><noscript><img src="https://pica.zhimg.com/50/v2-fb18c538b657e69fed41300a2290e7a1_720w.jpg?source=2c26e567" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-fb18c538b657e69fed41300a2290e7a1" data-default-watermark-src="https://picx.zhimg.com/50/v2-7d92b8c08ff1ae85a294db36355f464b_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb" width="1080" data-original="https://pic1.zhimg.com/v2-fb18c538b657e69fed41300a2290e7a1_r.jpg?source=2c26e567"/></noscript><img src="data:image/svg+xml;utf8,&lt;svg xmlns=&#39;http://www.w3.org/2000/svg&#39; width=&#39;1080&#39; height=&#39;2400&#39;&gt;&lt;/svg&gt;" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-fb18c538b657e69fed41300a2290e7a1" data-default-watermark-src="https://picx.zhimg.com/50/v2-7d92b8c08ff1ae85a294db36355f464b_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb lazy" width="1080" data-original="https://pic1.zhimg.com/v2-fb18c538b657e69fed41300a2290e7a1_r.jpg?source=2c26e567" data-actualsrc="https://pica.zhimg.com/50/v2-fb18c538b657e69fed41300a2290e7a1_720w.jpg?source=2c26e567"/></figure><p data-pid="zZZW-xX-">女儿这么可爱，唉</p><figure data-size="normal"><noscript><img src="https://pic1.zhimg.com/50/v2-02585bfc5da5588c696ac107bf4dec2e_720w.jpg?source=2c26e567" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-02585bfc5da5588c696ac107bf4dec2e" data-default-watermark-src="https://picx.zhimg.com/50/v2-b73dab4ece2d6184a18db78d9970173a_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb" width="1080" data-original="https://pica.zhimg.com/v2-02585bfc5da5588c696ac107bf4dec2e_r.jpg?source=2c26e567"/></noscript><img src="data:image/svg+xml;utf8,&lt;svg xmlns=&#39;http://www.w3.org/2000/svg&#39; width=&#39;1080&#39; height=&#39;2400&#39;&gt;&lt;/svg&gt;" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-02585bfc5da5588c696ac107bf4dec2e" data-default-watermark-src="https://picx.zhimg.com/50/v2-b73dab4ece2d6184a18db78d9970173a_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb lazy" width="1080" data-original="https://pica.zhimg.com/v2-02585bfc5da5588c696ac107bf4dec2e_r.jpg?source=2c26e567" data-actualsrc="https://pic1.zhimg.com/50/v2-02585bfc5da5588c696ac107bf4dec2e_720w.jpg?source=2c26e567"/></figure><p class="ztext-empty-paragraph"><br/></p><figure data-size="normal"><noscript><img src="https://pic1.zhimg.com/50/v2-88183d464c6ac1ac65a472dadf344edc_720w.jpg?source=2c26e567" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-88183d464c6ac1ac65a472dadf344edc" data-default-watermark-src="https://pica.zhimg.com/50/v2-92db902debd2cdc8b96a355d28bb5958_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb" width="1080" data-original="https://pic1.zhimg.com/v2-88183d464c6ac1ac65a472dadf344edc_r.jpg?source=2c26e567"/></noscript><img src="data:image/svg+xml;utf8,&lt;svg xmlns=&#39;http://www.w3.org/2000/svg&#39; width=&#39;1080&#39; height=&#39;2400&#39;&gt;&lt;/svg&gt;" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-88183d464c6ac1ac65a472dadf344edc" data-default-watermark-src="https://pica.zhimg.com/50/v2-92db902debd2cdc8b96a355d28bb5958_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb lazy" width="1080" data-original="https://pic1.zhimg.com/v2-88183d464c6ac1ac65a472dadf344edc_r.jpg?source=2c26e567" data-actualsrc="https://pic1.zhimg.com/50/v2-88183d464c6ac1ac65a472dadf344edc_720w.jpg?source=2c26e567"/></figure><p data-pid="uCCLD4vi">难蚌</p>'
        );
        return '<p></p><figure data-size="normal"><noscript><img src="https://pica.zhimg.com/50/v2-fb18c538b657e69fed41300a2290e7a1_720w.jpg?source=2c26e567" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-fb18c538b657e69fed41300a2290e7a1" data-default-watermark-src="https://picx.zhimg.com/50/v2-7d92b8c08ff1ae85a294db36355f464b_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb" width="1080" data-original="https://pic1.zhimg.com/v2-fb18c538b657e69fed41300a2290e7a1_r.jpg?source=2c26e567"/></noscript><img src="data:image/svg+xml;utf8,&lt;svg xmlns=&#39;http://www.w3.org/2000/svg&#39; width=&#39;1080&#39; height=&#39;2400&#39;&gt;&lt;/svg&gt;" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-fb18c538b657e69fed41300a2290e7a1" data-default-watermark-src="https://picx.zhimg.com/50/v2-7d92b8c08ff1ae85a294db36355f464b_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb lazy" width="1080" data-original="https://pic1.zhimg.com/v2-fb18c538b657e69fed41300a2290e7a1_r.jpg?source=2c26e567" data-actualsrc="https://pica.zhimg.com/50/v2-fb18c538b657e69fed41300a2290e7a1_720w.jpg?source=2c26e567"/></figure><p data-pid="zZZW-xX-">女儿这么可爱，唉</p><figure data-size="normal"><noscript><img src="https://pic1.zhimg.com/50/v2-02585bfc5da5588c696ac107bf4dec2e_720w.jpg?source=2c26e567" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-02585bfc5da5588c696ac107bf4dec2e" data-default-watermark-src="https://picx.zhimg.com/50/v2-b73dab4ece2d6184a18db78d9970173a_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb" width="1080" data-original="https://pica.zhimg.com/v2-02585bfc5da5588c696ac107bf4dec2e_r.jpg?source=2c26e567"/></noscript><img src="data:image/svg+xml;utf8,&lt;svg xmlns=&#39;http://www.w3.org/2000/svg&#39; width=&#39;1080&#39; height=&#39;2400&#39;&gt;&lt;/svg&gt;" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-02585bfc5da5588c696ac107bf4dec2e" data-default-watermark-src="https://picx.zhimg.com/50/v2-b73dab4ece2d6184a18db78d9970173a_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb lazy" width="1080" data-original="https://pica.zhimg.com/v2-02585bfc5da5588c696ac107bf4dec2e_r.jpg?source=2c26e567" data-actualsrc="https://pic1.zhimg.com/50/v2-02585bfc5da5588c696ac107bf4dec2e_720w.jpg?source=2c26e567"/></figure><p class="ztext-empty-paragraph"><br/></p><figure data-size="normal"><noscript><img src="https://pic1.zhimg.com/50/v2-88183d464c6ac1ac65a472dadf344edc_720w.jpg?source=2c26e567" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-88183d464c6ac1ac65a472dadf344edc" data-default-watermark-src="https://pica.zhimg.com/50/v2-92db902debd2cdc8b96a355d28bb5958_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb" width="1080" data-original="https://pic1.zhimg.com/v2-88183d464c6ac1ac65a472dadf344edc_r.jpg?source=2c26e567"/></noscript><img src="data:image/svg+xml;utf8,&lt;svg xmlns=&#39;http://www.w3.org/2000/svg&#39; width=&#39;1080&#39; height=&#39;2400&#39;&gt;&lt;/svg&gt;" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-88183d464c6ac1ac65a472dadf344edc" data-default-watermark-src="https://pica.zhimg.com/50/v2-92db902debd2cdc8b96a355d28bb5958_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb lazy" width="1080" data-original="https://pic1.zhimg.com/v2-88183d464c6ac1ac65a472dadf344edc_r.jpg?source=2c26e567" data-actualsrc="https://pic1.zhimg.com/50/v2-88183d464c6ac1ac65a472dadf344edc_720w.jpg?source=2c26e567"/></figure><p data-pid="uCCLD4vi">难蚌</p>';
      },
      set() {
        v_console_log(
          "  [*] Node -> textContent[set]",
          [].slice.call(arguments)
        );
        return '<p></p><figure data-size="normal"><noscript><img src="https://pica.zhimg.com/50/v2-fb18c538b657e69fed41300a2290e7a1_720w.jpg?source=2c26e567" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-fb18c538b657e69fed41300a2290e7a1" data-default-watermark-src="https://picx.zhimg.com/50/v2-7d92b8c08ff1ae85a294db36355f464b_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb" width="1080" data-original="https://pic1.zhimg.com/v2-fb18c538b657e69fed41300a2290e7a1_r.jpg?source=2c26e567"/></noscript><img src="data:image/svg+xml;utf8,&lt;svg xmlns=&#39;http://www.w3.org/2000/svg&#39; width=&#39;1080&#39; height=&#39;2400&#39;&gt;&lt;/svg&gt;" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-fb18c538b657e69fed41300a2290e7a1" data-default-watermark-src="https://picx.zhimg.com/50/v2-7d92b8c08ff1ae85a294db36355f464b_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb lazy" width="1080" data-original="https://pic1.zhimg.com/v2-fb18c538b657e69fed41300a2290e7a1_r.jpg?source=2c26e567" data-actualsrc="https://pica.zhimg.com/50/v2-fb18c538b657e69fed41300a2290e7a1_720w.jpg?source=2c26e567"/></figure><p data-pid="zZZW-xX-">女儿这么可爱，唉</p><figure data-size="normal"><noscript><img src="https://pic1.zhimg.com/50/v2-02585bfc5da5588c696ac107bf4dec2e_720w.jpg?source=2c26e567" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-02585bfc5da5588c696ac107bf4dec2e" data-default-watermark-src="https://picx.zhimg.com/50/v2-b73dab4ece2d6184a18db78d9970173a_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb" width="1080" data-original="https://pica.zhimg.com/v2-02585bfc5da5588c696ac107bf4dec2e_r.jpg?source=2c26e567"/></noscript><img src="data:image/svg+xml;utf8,&lt;svg xmlns=&#39;http://www.w3.org/2000/svg&#39; width=&#39;1080&#39; height=&#39;2400&#39;&gt;&lt;/svg&gt;" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-02585bfc5da5588c696ac107bf4dec2e" data-default-watermark-src="https://picx.zhimg.com/50/v2-b73dab4ece2d6184a18db78d9970173a_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb lazy" width="1080" data-original="https://pica.zhimg.com/v2-02585bfc5da5588c696ac107bf4dec2e_r.jpg?source=2c26e567" data-actualsrc="https://pic1.zhimg.com/50/v2-02585bfc5da5588c696ac107bf4dec2e_720w.jpg?source=2c26e567"/></figure><p class="ztext-empty-paragraph"><br/></p><figure data-size="normal"><noscript><img src="https://pic1.zhimg.com/50/v2-88183d464c6ac1ac65a472dadf344edc_720w.jpg?source=2c26e567" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-88183d464c6ac1ac65a472dadf344edc" data-default-watermark-src="https://pica.zhimg.com/50/v2-92db902debd2cdc8b96a355d28bb5958_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb" width="1080" data-original="https://pic1.zhimg.com/v2-88183d464c6ac1ac65a472dadf344edc_r.jpg?source=2c26e567"/></noscript><img src="data:image/svg+xml;utf8,&lt;svg xmlns=&#39;http://www.w3.org/2000/svg&#39; width=&#39;1080&#39; height=&#39;2400&#39;&gt;&lt;/svg&gt;" data-rawwidth="1080" data-rawheight="2400" data-size="normal" data-original-token="v2-88183d464c6ac1ac65a472dadf344edc" data-default-watermark-src="https://pica.zhimg.com/50/v2-92db902debd2cdc8b96a355d28bb5958_720w.jpg?source=2c26e567" class="origin_image zh-lightbox-thumb lazy" width="1080" data-original="https://pic1.zhimg.com/v2-88183d464c6ac1ac65a472dadf344edc_r.jpg?source=2c26e567" data-actualsrc="https://pic1.zhimg.com/50/v2-88183d464c6ac1ac65a472dadf344edc_720w.jpg?source=2c26e567"/></figure><p data-pid="uCCLD4vi">难蚌</p>';
      },
    },
    insertBefore: {
      value: v_saf(function insertBefore() {
        v_console_log(
          "  [*] Node -> insertBefore[func]",
          [].slice.call(arguments)
        );
      }),
    },
    parentNode: {
      get() {
        v_console_log("  [*] Node -> parentNode[get]", {});
        return {};
      },
    },
    contains: {
      value: v_saf(function contains() {
        v_console_log("  [*] Node -> contains[func]", [].slice.call(arguments));
      }),
    },
    isEqualNode: {
      value: v_saf(function isEqualNode() {
        v_console_log(
          "  [*] Node -> isEqualNode[func]",
          [].slice.call(arguments)
        );
      }),
    },
    parentElement: {
      get() {
        v_console_log("  [*] Node -> parentElement[get]", {});
        return {};
      },
    },
    childNodes: {
      get() {
        v_console_log("  [*] Node -> childNodes[get]", {});
        return {};
      },
    },
    replaceChild: {
      value: v_saf(function replaceChild() {
        v_console_log(
          "  [*] Node -> replaceChild[func]",
          [].slice.call(arguments)
        );
      }),
    },
    nodeType: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 9;
      },
      set: function () {
        return true;
      },
    },
    nodeName: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "#document";
      },
      set: function () {
        return true;
      },
    },
    baseURI: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "https://www.zhihu.com/question/7272414588/answer/1923233640646702518";
      },
      set: function () {
        return true;
      },
    },
    isConnected: {
      enumerable: true,
      configurable: true,
      get: function () {
        return true;
      },
      set: function () {
        return true;
      },
    },
    ELEMENT_NODE: {
      value: 1,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ATTRIBUTE_NODE: {
      value: 2,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TEXT_NODE: {
      value: 3,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CDATA_SECTION_NODE: {
      value: 4,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ENTITY_REFERENCE_NODE: {
      value: 5,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ENTITY_NODE: {
      value: 6,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    PROCESSING_INSTRUCTION_NODE: {
      value: 7,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    COMMENT_NODE: {
      value: 8,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DOCUMENT_NODE: {
      value: 9,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DOCUMENT_TYPE_NODE: {
      value: 10,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DOCUMENT_FRAGMENT_NODE: {
      value: 11,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    NOTATION_NODE: {
      value: 12,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DOCUMENT_POSITION_DISCONNECTED: {
      value: 1,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DOCUMENT_POSITION_PRECEDING: {
      value: 2,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DOCUMENT_POSITION_FOLLOWING: {
      value: 4,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DOCUMENT_POSITION_CONTAINS: {
      value: 8,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DOCUMENT_POSITION_CONTAINED_BY: {
      value: 16,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: {
      value: 32,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    [Symbol.toStringTag]: {
      value: "Node",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(MessageEvent.prototype, {
    source: {
      get() {
        v_console_log("  [*] MessageEvent -> source[get]", {});
        return {};
      },
    },
    data: {
      get() {
        v_console_log("  [*] MessageEvent -> data[get]", {});
        return {};
      },
    },
    origin: {
      get() {
        v_console_log(
          "  [*] MessageEvent -> origin[get]",
          "https://www.zhihu.com"
        );
        return "https://www.zhihu.com";
      },
    },
    [Symbol.toStringTag]: {
      value: "MessageEvent",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(MessagePort.prototype, {
    onmessage: {
      set() {
        v_console_log(
          "  [*] MessagePort -> onmessage[set]",
          [].slice.call(arguments)
        );
      },
    },
    postMessage: {
      value: v_saf(function postMessage() {
        v_console_log(
          "  [*] MessagePort -> postMessage[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "MessagePort",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Performance.prototype, {
    now: {
      value: v_saf(function now() {
        v_console_log(
          "  [*] Performance -> now[func]",
          [].slice.call(arguments)
        );
      }),
    },
    timing: {
      get() {
        v_console_log(
          "  [*] Performance -> timing[get]",
          v_new(PerformanceTiming)
        );
        return v_new(PerformanceTiming);
      },
    },
    getEntriesByType: {
      value: v_saf(function getEntriesByType() {
        v_console_log(
          "  [*] Performance -> getEntriesByType[func]",
          [].slice.call(arguments)
        );
        if (arguments[0] == "resource") {
          return v_new(PerformanceResourceTiming);
        }
      }),
    },
    mark: {
      value: v_saf(function mark() {
        v_console_log(
          "  [*] Performance -> mark[func]",
          [].slice.call(arguments)
        );
      }),
    },
    getEntries: {
      value: v_saf(function getEntries() {
        v_console_log(
          "  [*] Performance -> getEntries[func]",
          [].slice.call(arguments)
        );
      }),
    },
    navigation: {
      get() {
        v_console_log("  [*] Performance -> navigation[get]", {});
        return {};
      },
    },
    memory: {
      get() {
        v_console_log("  [*] Performance -> memory[get]", {});
        return {};
      },
    },
    getEntriesByName: {
      value: v_saf(function getEntriesByName() {
        v_console_log(
          "  [*] Performance -> getEntriesByName[func]",
          [].slice.call(arguments)
        );
      }),
    },
    timeOrigin: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 1754295216311.3;
      },
      set: function () {
        return true;
      },
    },
    [Symbol.toStringTag]: {
      value: "Performance",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(UIEvent.prototype, {
    view: {
      get() {
        v_console_log("  [*] UIEvent -> view[get]", {});
        return {};
      },
    },
    detail: {
      get() {
        v_console_log("  [*] UIEvent -> detail[get]", 0);
        return 0;
      },
    },
    [Symbol.toStringTag]: {
      value: "UIEvent",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(CSSStyleSheet.prototype, {
    cssRules: {
      get() {
        v_console_log("  [*] CSSStyleSheet -> cssRules[get]", {});
        return {};
      },
    },
    insertRule: {
      value: v_saf(function insertRule() {
        v_console_log(
          "  [*] CSSStyleSheet -> insertRule[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "CSSStyleSheet",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(XMLHttpRequestEventTarget.prototype, {
    onerror: {
      get() {
        v_console_log("  [*] XMLHttpRequestEventTarget -> onerror[get]", {});
        return {};
      },
      set() {
        v_console_log(
          "  [*] XMLHttpRequestEventTarget -> onerror[set]",
          [].slice.call(arguments)
        );
        return {};
      },
    },
    onload: {
      get() {
        v_console_log("  [*] XMLHttpRequestEventTarget -> onload[get]", {});
        return {};
      },
      set() {
        v_console_log(
          "  [*] XMLHttpRequestEventTarget -> onload[set]",
          [].slice.call(arguments)
        );
        return {};
      },
    },
    onprogress: {
      get() {
        v_console_log("  [*] XMLHttpRequestEventTarget -> onprogress[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "XMLHttpRequestEventTarget",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(DOMRect.prototype, {
    width: {
      get() {
        v_console_log("  [*] DOMRect -> width[get]", 385);
        return 385;
      },
    },
    height: {
      get() {
        v_console_log("  [*] DOMRect -> height[get]", 54);
        return 54;
      },
    },
    [Symbol.toStringTag]: {
      value: "DOMRect",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(BroadcastChannel.prototype, {
    postMessage: {
      value: v_saf(function postMessage() {
        v_console_log(
          "  [*] BroadcastChannel -> postMessage[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "BroadcastChannel",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PromiseRejectionEvent.prototype, {
    reason: {
      get() {
        v_console_log("  [*] PromiseRejectionEvent -> reason[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "PromiseRejectionEvent",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Screen.prototype, {
    width: {
      get() {
        v_console_log("  [*] Screen -> width[get]", 2560);
        return 2560;
      },
    },
    height: {
      get() {
        v_console_log("  [*] Screen -> height[get]", 1440);
        return 1440;
      },
    },
    colorDepth: {
      get() {
        v_console_log("  [*] Screen -> colorDepth[get]", 24);
        return 24;
      },
    },
    availWidth: {
      get() {
        v_console_log("  [*] Screen -> availWidth[get]", 2560);
        return 2560;
      },
    },
    availHeight: {
      get() {
        v_console_log("  [*] Screen -> availHeight[get]", 1392);
        return 1392;
      },
    },
    availWidth: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 2560;
      },
      set: function () {
        return true;
      },
    },
    availHeight: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 1392;
      },
      set: function () {
        return true;
      },
    },
    width: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 2560;
      },
      set: function () {
        return true;
      },
    },
    height: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 1440;
      },
      set: function () {
        return true;
      },
    },
    colorDepth: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 24;
      },
      set: function () {
        return true;
      },
    },
    pixelDepth: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 24;
      },
      set: function () {
        return true;
      },
    },
    availLeft: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    availTop: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    isExtended: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    [Symbol.toStringTag]: {
      value: "Screen",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(NetworkInformation.prototype, {
    effectiveType: {
      get() {
        v_console_log("  [*] NetworkInformation -> effectiveType[get]", "4g");
        return "4g";
      },
    },
    saveData: {
      get() {
        v_console_log("  [*] NetworkInformation -> saveData[get]", false);
        return false;
      },
    },
    downlink: {
      get() {
        v_console_log("  [*] NetworkInformation -> downlink[get]", 10);
        return 10;
      },
    },
    rtt: {
      get() {
        v_console_log("  [*] NetworkInformation -> rtt[get]", 50);
        return 50;
      },
    },
    [Symbol.toStringTag]: {
      value: "NetworkInformation",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(MediaQueryList.prototype, {
    matches: {
      get() {
        v_console_log("  [*] MediaQueryList -> matches[get]", false);
        return false;
      },
    },
    [Symbol.toStringTag]: {
      value: "MediaQueryList",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(BaseAudioContext.prototype, {
    createOscillator: {
      value: v_saf(function createOscillator() {
        v_console_log(
          "  [*] BaseAudioContext -> createOscillator[func]",
          [].slice.call(arguments)
        );
      }),
    },
    currentTime: {
      get() {
        v_console_log("  [*] BaseAudioContext -> currentTime[get]", 0);
        return 0;
      },
    },
    createDynamicsCompressor: {
      value: v_saf(function createDynamicsCompressor() {
        v_console_log(
          "  [*] BaseAudioContext -> createDynamicsCompressor[func]",
          [].slice.call(arguments)
        );
      }),
    },
    destination: {
      get() {
        v_console_log("  [*] BaseAudioContext -> destination[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "BaseAudioContext",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(AudioNode.prototype, {
    connect: {
      value: v_saf(function connect() {
        v_console_log(
          "  [*] AudioNode -> connect[func]",
          [].slice.call(arguments)
        );
      }),
    },
    disconnect: {
      value: v_saf(function disconnect() {
        v_console_log(
          "  [*] AudioNode -> disconnect[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "AudioNode",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(OfflineAudioCompletionEvent.prototype, {
    renderedBuffer: {
      get() {
        v_console_log(
          "  [*] OfflineAudioCompletionEvent -> renderedBuffer[get]",
          {}
        );
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "OfflineAudioCompletionEvent",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Worker.prototype, {
    onmessage: {
      set() {
        v_console_log(
          "  [*] Worker -> onmessage[set]",
          [].slice.call(arguments)
        );
      },
    },
    postMessage: {
      value: v_saf(function postMessage() {
        v_console_log(
          "  [*] Worker -> postMessage[func]",
          [].slice.call(arguments)
        );
      }),
    },
    terminate: {
      value: v_saf(function terminate() {
        v_console_log(
          "  [*] Worker -> terminate[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "Worker",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(WebSocket.prototype, {
    binaryType: {
      set() {
        v_console_log(
          "  [*] WebSocket -> binaryType[set]",
          [].slice.call(arguments)
        );
      },
    },
    readyState: {
      get() {
        v_console_log("  [*] WebSocket -> readyState[get]", 0);
        return 0;
      },
    },
    onopen: {
      set() {
        v_console_log(
          "  [*] WebSocket -> onopen[set]",
          [].slice.call(arguments)
        );
        return 0;
      },
    },
    onclose: {
      set() {
        v_console_log(
          "  [*] WebSocket -> onclose[set]",
          [].slice.call(arguments)
        );
        return 0;
      },
    },
    onerror: {
      set() {
        v_console_log(
          "  [*] WebSocket -> onerror[set]",
          [].slice.call(arguments)
        );
        return 0;
      },
    },
    onmessage: {
      set() {
        v_console_log(
          "  [*] WebSocket -> onmessage[set]",
          [].slice.call(arguments)
        );
        return 0;
      },
    },
    OPEN: { value: 1, writable: false, enumerable: true, configurable: false },
    CLOSING: {
      value: 2,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    CLOSED: {
      value: 3,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    [Symbol.toStringTag]: {
      value: "WebSocket",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceResourceTiming.prototype, {
    domainLookupEnd: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> domainLookupEnd[get]",
          4.599999904632568
        );
        return 4.599999904632568;
      },
    },
    domainLookupStart: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> domainLookupStart[get]",
          4.599999904632568
        );
        return 4.599999904632568;
      },
    },
    connectEnd: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> connectEnd[get]",
          4.599999904632568
        );
        return 4.599999904632568;
      },
    },
    connectStart: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> connectStart[get]",
          4.599999904632568
        );
        return 4.599999904632568;
      },
    },
    responseStart: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> responseStart[get]",
          406.69999980926514
        );
        return 406.69999980926514;
      },
    },
    requestStart: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> requestStart[get]",
          13.799999713897705
        );
        return 13.799999713897705;
      },
    },
    responseEnd: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> responseEnd[get]",
          416.5
        );
        return 416.5;
      },
    },
    secureConnectionStart: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> secureConnectionStart[get]",
          4.599999904632568
        );
        return 4.599999904632568;
      },
    },
    fetchStart: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> fetchStart[get]",
          4.599999904632568
        );
        return 4.599999904632568;
      },
    },
    redirectEnd: {
      get() {
        v_console_log("  [*] PerformanceResourceTiming -> redirectEnd[get]", 0);
        return 0;
      },
    },
    redirectStart: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> redirectStart[get]",
          0
        );
        return 0;
      },
    },
    nextHopProtocol: {
      get() {
        v_console_log(
          "  [*] PerformanceResourceTiming -> nextHopProtocol[get]",
          "h3"
        );
        return "h3";
      },
    },
    [Symbol.toStringTag]: {
      value: "PerformanceResourceTiming",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PageTransitionEvent.prototype, {
    persisted: {
      get() {
        v_console_log("  [*] PageTransitionEvent -> persisted[get]", false);
        return false;
      },
    },
    [Symbol.toStringTag]: {
      value: "PageTransitionEvent",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(LayoutShift.prototype, {
    hadRecentInput: {
      get() {
        v_console_log("  [*] LayoutShift -> hadRecentInput[get]", false);
        return false;
      },
    },
    value: {
      get() {
        v_console_log("  [*] LayoutShift -> value[get]", 0.012021561181901484);
        return 0.012021561181901484;
      },
    },
    [Symbol.toStringTag]: {
      value: "LayoutShift",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Document.prototype, {
    activeElement: {
      get() {
        v_console_log("  [*] Document -> activeElement[get]", {});
        return {};
      },
    },
    createElementNS: {
      value: v_saf(function createElementNS() {
        v_console_log(
          "  [*] Document -> createElementNS[func]",
          [].slice.call(arguments)
        );
      }),
    },
    createTextNode: {
      value: v_saf(function createTextNode() {
        v_console_log(
          "  [*] Document -> createTextNode[func]",
          [].slice.call(arguments)
        );
      }),
    },
    defaultView: {
      get() {
        v_console_log("  [*] Document -> defaultView[get]", {});
        return {};
      },
    },
    all: {
      get() {
        v_console_log("  [*] Document -> all[get]", {});
        return {};
      },
    },
    readyState: {
      get() {
        v_console_log("  [*] Document -> readyState[get]", "interactive");
        return "interactive";
      },
    },
    visibilityState: {
      get() {
        v_console_log("  [*] Document -> visibilityState[get]", "visible");
        return "visible";
      },
    },
    title: {
      get() {
        v_console_log(
          "  [*] Document -> title[get]",
          "如何评价大胃袋良子？ - 知乎"
        );
        return "如何评价大胃袋良子？ - 知乎";
      },
      set() {
        v_console_log("  [*] Document -> title[set]", [].slice.call(arguments));
        return "如何评价大胃袋良子？ - 知乎";
      },
    },
    currentScript: {
      get() {
        v_console_log("  [*] Document -> currentScript[get]", {});
        return {};
      },
    },
    createEvent: {
      value: v_saf(function createEvent() {
        v_console_log(
          "  [*] Document -> createEvent[func]",
          [].slice.call(arguments)
        );
      }),
    },
    referrer: {
      get() {
        v_console_log(
          "  [*] Document -> referrer[get]",
          "https://www.zhihu.com/"
        );
        return "https://www.zhihu.com/";
      },
    },
    scripts: {
      get() {
        v_console_log("  [*] Document -> scripts[get]", {});
        return {};
      },
    },
    createDocumentFragment: {
      value: v_saf(function createDocumentFragment() {
        v_console_log(
          "  [*] Document -> createDocumentFragment[func]",
          [].slice.call(arguments)
        );
      }),
    },
    implementation: {
      get() {
        v_console_log("  [*] Document -> implementation[get]", {});
        return {};
      },
    },
    URL: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "https://www.zhihu.com/question/7272414588/answer/1923233640646702518";
      },
      set: function () {
        return true;
      },
    },
    documentURI: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "https://www.zhihu.com/question/7272414588/answer/1923233640646702518";
      },
      set: function () {
        return true;
      },
    },
    compatMode: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "CSS1Compat";
      },
      set: function () {
        return true;
      },
    },
    characterSet: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "UTF-8";
      },
      set: function () {
        return true;
      },
    },
    charset: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "UTF-8";
      },
      set: function () {
        return true;
      },
    },
    inputEncoding: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "UTF-8";
      },
      set: function () {
        return true;
      },
    },
    contentType: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "text/html";
      },
      set: function () {
        return true;
      },
    },
    xmlStandalone: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    domain: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "www.zhihu.com";
      },
      set: function () {
        return true;
      },
    },
    referrer: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "https://www.zhihu.com/";
      },
      set: function () {
        return true;
      },
    },
    lastModified: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "08/04/2025 16:13:40";
      },
      set: function () {
        return true;
      },
    },
    readyState: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "complete";
      },
      set: function () {
        return true;
      },
    },
    title: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "(26 封私信 / 80 条消息) 如何评价大胃袋良子？ - 知乎";
      },
      set: function () {
        return true;
      },
    },
    dir: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    designMode: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "off";
      },
      set: function () {
        return true;
      },
    },
    fgColor: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    linkColor: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    vlinkColor: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    alinkColor: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    bgColor: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    hidden: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    visibilityState: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "visible";
      },
      set: function () {
        return true;
      },
    },
    wasDiscarded: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    prerendering: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    webkitVisibilityState: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "visible";
      },
      set: function () {
        return true;
      },
    },
    webkitHidden: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    fullscreenEnabled: {
      enumerable: true,
      configurable: true,
      get: function () {
        return true;
      },
      set: function () {
        return true;
      },
    },
    fullscreen: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    webkitIsFullScreen: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    webkitFullscreenEnabled: {
      enumerable: true,
      configurable: true,
      get: function () {
        return true;
      },
      set: function () {
        return true;
      },
    },
    pictureInPictureEnabled: {
      enumerable: true,
      configurable: true,
      get: function () {
        return true;
      },
      set: function () {
        return true;
      },
    },
    childElementCount: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 1;
      },
      set: function () {
        return true;
      },
    },
    [Symbol.toStringTag]: {
      value: "Document",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Element.prototype, {
    namespaceURI: {
      get() {
        v_console_log(
          "  [*] Element -> namespaceURI[get]",
          "http://www.w3.org/1999/xhtml"
        );
        return "http://www.w3.org/1999/xhtml";
      },
    },
    tagName: {
      get() {
        v_console_log("  [*] Element -> tagName[get]", this.v_tagName);
        return this.v_tagName;
      },
    },
    setAttribute: {
      value: v_saf(function setAttribute() {
        v_console_log(
          "  [*] Element -> setAttribute[func]",
          [].slice.call(arguments)
        );
      }),
    },
    removeAttribute: {
      value: v_saf(function removeAttribute() {
        v_console_log(
          "  [*] Element -> removeAttribute[func]",
          [].slice.call(arguments)
        );
      }),
    },
    getAttribute: {
      value: v_saf(function getAttribute() {
        v_console_log(
          "  [*] Element -> getAttribute[func]",
          [].slice.call(arguments)
        );
      }),
    },
    nextElementSibling: {
      get() {
        v_console_log("  [*] Element -> nextElementSibling[get]", {});
        return {};
      },
    },
    getBoundingClientRect: {
      value: v_saf(function getBoundingClientRect() {
        v_console_log(
          "  [*] Element -> getBoundingClientRect[func]",
          [].slice.call(arguments)
        );
      }),
    },
    children: {
      get() {
        v_console_log("  [*] Element -> children[get]", {});
        return {};
      },
    },
    scrollTop: {
      get() {
        v_console_log("  [*] Element -> scrollTop[get]", 0);
        return 0;
      },
    },
    closest: {
      value: v_saf(function closest() {
        v_console_log(
          "  [*] Element -> closest[func]",
          [].slice.call(arguments)
        );
      }),
    },
    className: {
      get() {
        v_console_log("  [*] Element -> className[get]", "itcauecng");
        return "itcauecng";
      },
      set() {
        v_console_log(
          "  [*] Element -> className[set]",
          [].slice.call(arguments)
        );
        return "itcauecng";
      },
    },
    id: {
      get() {
        v_console_log("  [*] Element -> id[get]", "");
        return "";
      },
      set() {
        v_console_log("  [*] Element -> id[set]", [].slice.call(arguments));
        return "";
      },
    },
    classList: {
      get() {
        v_console_log("  [*] Element -> classList[get]", {});
        return {};
      },
    },
    querySelectorAll: {
      value: v_saf(function querySelectorAll() {
        v_console_log(
          "  [*] Element -> querySelectorAll[func]",
          [].slice.call(arguments)
        );
      }),
    },
    firstElementChild: {
      get() {
        v_console_log("  [*] Element -> firstElementChild[get]", {});
        return {};
      },
    },
    querySelector: {
      value: v_saf(function querySelector() {
        v_console_log(
          "  [*] Element -> querySelector[func]",
          [].slice.call(arguments)
        );
      }),
    },
    insertAdjacentElement: {
      value: v_saf(function insertAdjacentElement() {
        v_console_log(
          "  [*] Element -> insertAdjacentElement[func]",
          [].slice.call(arguments)
        );
      }),
    },
    clientWidth: {
      get() {
        v_console_log("  [*] Element -> clientWidth[get]", 2114);
        return 2114;
      },
    },
    clientHeight: {
      get() {
        v_console_log("  [*] Element -> clientHeight[get]", 5076);
        return 5076;
      },
    },
    scrollHeight: {
      get() {
        v_console_log("  [*] Element -> scrollHeight[get]", 4534);
        return 4534;
      },
    },
    attributes: {
      get() {
        v_console_log("  [*] Element -> attributes[get]", {});
        return {};
      },
    },
    namespaceURI: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "http://www.w3.org/1999/xhtml";
      },
      set: function () {
        return true;
      },
    },
    localName: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "link";
      },
      set: function () {
        return true;
      },
    },
    tagName: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "LINK";
      },
      set: function () {
        return true;
      },
    },
    id: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    className: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    slot: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    scrollTop: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    scrollLeft: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    scrollWidth: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    scrollHeight: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    clientTop: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    clientLeft: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    clientWidth: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    clientHeight: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    elementTiming: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    childElementCount: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    currentCSSZoom: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 1;
      },
      set: function () {
        return true;
      },
    },
    [Symbol.toStringTag]: {
      value: "Element",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(MouseEvent.prototype, {
    fromElement: {
      get() {
        v_console_log("  [*] MouseEvent -> fromElement[get]", {});
        return {};
      },
    },
    buttons: {
      get() {
        v_console_log("  [*] MouseEvent -> buttons[get]", 0);
        return 0;
      },
    },
    toElement: {
      get() {
        v_console_log("  [*] MouseEvent -> toElement[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "MouseEvent",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(XMLHttpRequest.prototype, {
    OPENED: {
      value: 1,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    HEADERS_RECEIVED: {
      value: 2,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    LOADING: {
      value: 3,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    DONE: { value: 4, writable: false, enumerable: true, configurable: false },
    [Symbol.toStringTag]: {
      value: "XMLHttpRequest",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Attr.prototype, {
    name: {
      get() {
        v_console_log("  [*] Attr -> name[get]", "data-default-watermark-src");
        return "data-default-watermark-src";
      },
    },
    value: {
      get() {
        v_console_log(
          "  [*] Attr -> value[get]",
          "https://pic1.zhimg.com/50/v2-88183d464c6ac1ac65a472dadf344edc_720w.jpg?source=2c26e567"
        );
        return "https://pic1.zhimg.com/50/v2-88183d464c6ac1ac65a472dadf344edc_720w.jpg?source=2c26e567";
      },
    },
    [Symbol.toStringTag]: {
      value: "Attr",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(AudioScheduledSourceNode.prototype, {
    start: {
      value: v_saf(function start() {
        v_console_log(
          "  [*] AudioScheduledSourceNode -> start[func]",
          [].slice.call(arguments)
        );
      }),
    },
    [Symbol.toStringTag]: {
      value: "AudioScheduledSourceNode",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(DynamicsCompressorNode.prototype, {
    threshold: {
      get() {
        v_console_log("  [*] DynamicsCompressorNode -> threshold[get]", {});
        return {};
      },
    },
    knee: {
      get() {
        v_console_log("  [*] DynamicsCompressorNode -> knee[get]", {});
        return {};
      },
    },
    ratio: {
      get() {
        v_console_log("  [*] DynamicsCompressorNode -> ratio[get]", {});
        return {};
      },
    },
    reduction: {
      get() {
        v_console_log("  [*] DynamicsCompressorNode -> reduction[get]", 0);
        return 0;
      },
    },
    attack: {
      get() {
        v_console_log("  [*] DynamicsCompressorNode -> attack[get]", {});
        return {};
      },
    },
    release: {
      get() {
        v_console_log("  [*] DynamicsCompressorNode -> release[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "DynamicsCompressorNode",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(OfflineAudioContext.prototype, {
    startRendering: {
      value: v_saf(function startRendering() {
        v_console_log(
          "  [*] OfflineAudioContext -> startRendering[func]",
          [].slice.call(arguments)
        );
      }),
    },
    oncomplete: {
      set() {
        v_console_log(
          "  [*] OfflineAudioContext -> oncomplete[set]",
          [].slice.call(arguments)
        );
      },
    },
    [Symbol.toStringTag]: {
      value: "OfflineAudioContext",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceNavigationTiming.prototype, {
    domInteractive: {
      get() {
        v_console_log(
          "  [*] PerformanceNavigationTiming -> domInteractive[get]",
          777.0999999046326
        );
        return 777.0999999046326;
      },
    },
    loadEventStart: {
      get() {
        v_console_log(
          "  [*] PerformanceNavigationTiming -> loadEventStart[get]",
          2146.199999809265
        );
        return 2146.199999809265;
      },
    },
    domContentLoadedEventEnd: {
      get() {
        v_console_log(
          "  [*] PerformanceNavigationTiming -> domContentLoadedEventEnd[get]",
          1374.5
        );
        return 1374.5;
      },
    },
    type: {
      get() {
        v_console_log(
          "  [*] PerformanceNavigationTiming -> type[get]",
          "navigate"
        );
        return "navigate";
      },
    },
    [Symbol.toStringTag]: {
      value: "PerformanceNavigationTiming",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLElement.prototype, {
    dataset: {
      get() {
        v_console_log("  [*] HTMLElement -> dataset[get]", {});
        return {};
      },
    },
    onload: {
      get() {
        v_console_log("  [*] HTMLElement -> onload[get]", {});
        return {};
      },
      set() {
        v_console_log(
          "  [*] HTMLElement -> onload[set]",
          [].slice.call(arguments)
        );
        return {};
      },
    },
    contentEditable: {
      get() {
        v_console_log("  [*] HTMLElement -> contentEditable[get]", "inherit");
        return "inherit";
      },
    },
    onclick: {
      set() {
        v_console_log(
          "  [*] HTMLElement -> onclick[set]",
          [].slice.call(arguments)
        );
        return "inherit";
      },
    },
    onerror: {
      get() {
        v_console_log("  [*] HTMLElement -> onerror[get]", {});
        return {};
      },
      set() {
        v_console_log(
          "  [*] HTMLElement -> onerror[set]",
          [].slice.call(arguments)
        );
        return {};
      },
    },
    offsetHeight: {
      get() {
        v_console_log("  [*] HTMLElement -> offsetHeight[get]", 82);
        return 82;
      },
    },
    offsetWidth: {
      get() {
        v_console_log("  [*] HTMLElement -> offsetWidth[get]", 708);
        return 708;
      },
    },
    click: {
      value: v_saf(function click() {
        v_console_log(
          "  [*] HTMLElement -> click[func]",
          [].slice.call(arguments)
        );
      }),
    },
    title: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    lang: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    translate: {
      enumerable: true,
      configurable: true,
      get: function () {
        return true;
      },
      set: function () {
        return true;
      },
    },
    dir: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    hidden: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    inert: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    accessKey: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    draggable: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    spellcheck: {
      enumerable: true,
      configurable: true,
      get: function () {
        return true;
      },
      set: function () {
        return true;
      },
    },
    autocapitalize: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    contentEditable: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "inherit";
      },
      set: function () {
        return true;
      },
    },
    enterKeyHint: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    isContentEditable: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    inputMode: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    virtualKeyboardPolicy: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    offsetTop: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    offsetLeft: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    offsetWidth: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    offsetHeight: {
      enumerable: true,
      configurable: true,
      get: function () {
        return 0;
      },
      set: function () {
        return true;
      },
    },
    innerText: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    outerText: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    writingSuggestions: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "true";
      },
      set: function () {
        return true;
      },
    },
    nonce: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    autofocus: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    tabIndex: {
      enumerable: true,
      configurable: true,
      get: function () {
        return -1;
      },
      set: function () {
        return true;
      },
    },
    [Symbol.toStringTag]: {
      value: "HTMLElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(SVGElement.prototype, {
    style: {
      get() {
        v_console_log("  [*] SVGElement -> style[get]");
      },
    },
    [Symbol.toStringTag]: {
      value: "SVGElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PointerEvent.prototype, {
    pointerId: {
      get() {
        v_console_log("  [*] PointerEvent -> pointerId[get]", 1);
        return 1;
      },
    },
    width: {
      get() {
        v_console_log("  [*] PointerEvent -> width[get]", 1);
        return 1;
      },
    },
    height: {
      get() {
        v_console_log("  [*] PointerEvent -> height[get]", 1);
        return 1;
      },
    },
    pressure: {
      get() {
        v_console_log("  [*] PointerEvent -> pressure[get]", 0);
        return 0;
      },
    },
    tangentialPressure: {
      get() {
        v_console_log("  [*] PointerEvent -> tangentialPressure[get]", 0);
        return 0;
      },
    },
    tiltX: {
      get() {
        v_console_log("  [*] PointerEvent -> tiltX[get]", 0);
        return 0;
      },
    },
    tiltY: {
      get() {
        v_console_log("  [*] PointerEvent -> tiltY[get]", 0);
        return 0;
      },
    },
    twist: {
      get() {
        v_console_log("  [*] PointerEvent -> twist[get]", 0);
        return 0;
      },
    },
    pointerType: {
      get() {
        v_console_log("  [*] PointerEvent -> pointerType[get]", "");
        return "";
      },
    },
    isPrimary: {
      get() {
        v_console_log("  [*] PointerEvent -> isPrimary[get]", true);
        return true;
      },
    },
    [Symbol.toStringTag]: {
      value: "PointerEvent",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(OscillatorNode.prototype, {
    type: {
      set() {
        v_console_log(
          "  [*] OscillatorNode -> type[set]",
          [].slice.call(arguments)
        );
      },
    },
    frequency: {
      get() {
        v_console_log("  [*] OscillatorNode -> frequency[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "OscillatorNode",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLScriptElement.prototype, {
    crossOrigin: {
      set() {
        v_console_log(
          "  [*] HTMLScriptElement -> crossOrigin[set]",
          [].slice.call(arguments)
        );
      },
    },
    src: {
      get() {
        v_console_log(
          "  [*] HTMLScriptElement -> src[get]",
          "https://static.zhihu.com/heifetz/chunks/lib-c4d1bd12.35ac2085eb3e412d7efe.js"
        );
        return "https://static.zhihu.com/heifetz/chunks/lib-c4d1bd12.35ac2085eb3e412d7efe.js";
      },
      set() {
        v_console_log(
          "  [*] HTMLScriptElement -> src[set]",
          [].slice.call(arguments)
        );
        return "https://static.zhihu.com/heifetz/chunks/lib-c4d1bd12.35ac2085eb3e412d7efe.js";
      },
    },
    charset: {
      set() {
        v_console_log(
          "  [*] HTMLScriptElement -> charset[set]",
          [].slice.call(arguments)
        );
        return "https://static.zhihu.com/heifetz/chunks/lib-c4d1bd12.35ac2085eb3e412d7efe.js";
      },
    },
    [Symbol.toStringTag]: {
      value: "HTMLScriptElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLLinkElement.prototype, {
    rel: {
      get() {
        v_console_log("  [*] HTMLLinkElement -> rel[get]", "dns-prefetch");
        return "dns-prefetch";
      },
      set() {
        v_console_log(
          "  [*] HTMLLinkElement -> rel[set]",
          [].slice.call(arguments)
        );
        return "dns-prefetch";
      },
    },
    as: {
      set() {
        v_console_log(
          "  [*] HTMLLinkElement -> as[set]",
          [].slice.call(arguments)
        );
        return "dns-prefetch";
      },
    },
    href: {
      get() {
        v_console_log(
          "  [*] HTMLLinkElement -> href[get]",
          "https://static.zhihu.com/heifetz/4017.216a26f4.0d9e0bd5bbe2c9ec7640.css"
        );
        return "https://static.zhihu.com/heifetz/4017.216a26f4.0d9e0bd5bbe2c9ec7640.css";
      },
      set() {
        v_console_log(
          "  [*] HTMLLinkElement -> href[set]",
          [].slice.call(arguments)
        );
        return "https://static.zhihu.com/heifetz/4017.216a26f4.0d9e0bd5bbe2c9ec7640.css";
      },
    },
    crossOrigin: {
      set() {
        v_console_log(
          "  [*] HTMLLinkElement -> crossOrigin[set]",
          [].slice.call(arguments)
        );
        return "https://static.zhihu.com/heifetz/4017.216a26f4.0d9e0bd5bbe2c9ec7640.css";
      },
    },
    type: {
      set() {
        v_console_log(
          "  [*] HTMLLinkElement -> type[set]",
          [].slice.call(arguments)
        );
        return "https://static.zhihu.com/heifetz/4017.216a26f4.0d9e0bd5bbe2c9ec7640.css";
      },
    },
    disabled: {
      enumerable: true,
      configurable: true,
      get: function () {
        return false;
      },
      set: function () {
        return true;
      },
    },
    href: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "https://unpkg.zhimg.com/@cfe/font-misans@1.1.1/dist/font.min.css";
      },
      set: function () {
        return true;
      },
    },
    crossOrigin: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "anonymous";
      },
      set: function () {
        return true;
      },
    },
    rel: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "stylesheet";
      },
      set: function () {
        return true;
      },
    },
    media: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    hreflang: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    type: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    as: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "style";
      },
      set: function () {
        return true;
      },
    },
    referrerPolicy: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    fetchPriority: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "auto";
      },
      set: function () {
        return true;
      },
    },
    imageSrcset: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    imageSizes: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    charset: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    rev: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    target: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    integrity: {
      enumerable: true,
      configurable: true,
      get: function () {
        return "";
      },
      set: function () {
        return true;
      },
    },
    [Symbol.toStringTag]: {
      value: "HTMLLinkElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLInputElement.prototype, {
    type: {
      get() {
        v_console_log("  [*] HTMLInputElement -> type[get]", "text");
        return "text";
      },
    },
    value: {
      get() {
        v_console_log("  [*] HTMLInputElement -> value[get]", "");
        return "";
      },
    },
    defaultValue: {
      get() {
        v_console_log("  [*] HTMLInputElement -> defaultValue[get]", "");
        return "";
      },
      set() {
        v_console_log(
          "  [*] HTMLInputElement -> defaultValue[set]",
          [].slice.call(arguments)
        );
        return "";
      },
    },
    name: {
      get() {
        v_console_log("  [*] HTMLInputElement -> name[get]", "");
        return "";
      },
    },
    defaultChecked: {
      set() {
        v_console_log(
          "  [*] HTMLInputElement -> defaultChecked[set]",
          [].slice.call(arguments)
        );
        return "";
      },
    },
    [Symbol.toStringTag]: {
      value: "HTMLInputElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLCanvasElement.prototype, {
    getContext: {
      value: v_saf(function getContext() {
        v_console_log(
          "  [*] HTMLCanvasElement -> getContext[func]",
          [].slice.call(arguments)
        );
        if (arguments[0] == "2d") {
          var r = v_new(CanvasRenderingContext2D);
          return r;
        }
        if (arguments[0] == "webgl" || arguments[0] == "experimental-webgl") {
          var r = v_new(WebGLRenderingContext);
          r._canvas = this;
          return r;
        }
        return null;
      }),
    },
    width: {
      set() {
        v_console_log(
          "  [*] HTMLCanvasElement -> width[set]",
          [].slice.call(arguments)
        );
      },
    },
    height: {
      set() {
        v_console_log(
          "  [*] HTMLCanvasElement -> height[set]",
          [].slice.call(arguments)
        );
      },
    },
    [Symbol.toStringTag]: {
      value: "HTMLCanvasElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLStyleElement.prototype, {
    sheet: {
      get() {
        v_console_log("  [*] HTMLStyleElement -> sheet[get]", {});
        return {};
      },
    },
    media: {
      set() {
        v_console_log(
          "  [*] HTMLStyleElement -> media[set]",
          [].slice.call(arguments)
        );
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "HTMLStyleElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLMetaElement.prototype, {
    content: {
      set() {
        v_console_log(
          "  [*] HTMLMetaElement -> content[set]",
          [].slice.call(arguments)
        );
      },
    },
    [Symbol.toStringTag]: {
      value: "HTMLMetaElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLImageElement.prototype, {
    src: {
      set() {
        v_console_log(
          "  [*] HTMLImageElement -> src[set]",
          [].slice.call(arguments)
        );
      },
    },
    width: {
      get() {
        v_console_log("  [*] HTMLImageElement -> width[get]", 1);
        return 1;
      },
    },
    height: {
      get() {
        v_console_log("  [*] HTMLImageElement -> height[get]", 1);
        return 1;
      },
    },
    complete: {
      get() {
        v_console_log("  [*] HTMLImageElement -> complete[get]", false);
        return false;
      },
    },
    [Symbol.toStringTag]: {
      value: "HTMLImageElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLAnchorElement.prototype, {
    [Symbol.toStringTag]: {
      value: "HTMLAnchorElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLTemplateElement.prototype, {
    content: {
      get() {
        v_console_log("  [*] HTMLTemplateElement -> content[get]", {});
        return {};
      },
    },
    [Symbol.toStringTag]: {
      value: "HTMLTemplateElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Window.prototype, {
    PERSISTENT: {
      value: 1,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    [Symbol.toStringTag]: {
      value: "Window",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLDocument.prototype, {
    [Symbol.toStringTag]: {
      value: "HTMLDocument",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLHtmlElement.prototype, {
    [Symbol.toStringTag]: {
      value: "HTMLHtmlElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLHeadElement.prototype, {
    [Symbol.toStringTag]: {
      value: "HTMLHeadElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLBodyElement.prototype, {
    [Symbol.toStringTag]: {
      value: "HTMLBodyElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(MimeTypeArray.prototype, {
    [Symbol.toStringTag]: {
      value: "MimeTypeArray",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Location.prototype, {
    [Symbol.toStringTag]: {
      value: "Location",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceElementTiming.prototype, {
    [Symbol.toStringTag]: {
      value: "PerformanceElementTiming",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceEventTiming.prototype, {
    [Symbol.toStringTag]: {
      value: "PerformanceEventTiming",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceLongTaskTiming.prototype, {
    [Symbol.toStringTag]: {
      value: "PerformanceLongTaskTiming",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceMark.prototype, {
    [Symbol.toStringTag]: {
      value: "PerformanceMark",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceMeasure.prototype, {
    [Symbol.toStringTag]: {
      value: "PerformanceMeasure",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceNavigation.prototype, {
    TYPE_RELOAD: {
      value: 1,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TYPE_BACK_FORWARD: {
      value: 2,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    TYPE_RESERVED: {
      value: 255,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    [Symbol.toStringTag]: {
      value: "PerformanceNavigation",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformancePaintTiming.prototype, {
    [Symbol.toStringTag]: {
      value: "PerformancePaintTiming",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(PerformanceServerTiming.prototype, {
    [Symbol.toStringTag]: {
      value: "PerformanceServerTiming",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLMediaElement.prototype, {
    NETWORK_IDLE: {
      value: 1,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    NETWORK_LOADING: {
      value: 2,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    NETWORK_NO_SOURCE: {
      value: 3,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    HAVE_METADATA: {
      value: 1,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    HAVE_CURRENT_DATA: {
      value: 2,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    HAVE_FUTURE_DATA: {
      value: 3,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    HAVE_ENOUGH_DATA: {
      value: 4,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    [Symbol.toStringTag]: {
      value: "HTMLMediaElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLUnknownElement.prototype, {
    [Symbol.toStringTag]: {
      value: "HTMLUnknownElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(Touch.prototype, {
    [Symbol.toStringTag]: {
      value: "Touch",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(TouchEvent.prototype, {
    [Symbol.toStringTag]: {
      value: "TouchEvent",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });
  Object.defineProperties(HTMLDivElement.prototype, {
    [Symbol.toStringTag]: {
      value: "HTMLDivElement",
      writable: false,
      enumerable: false,
      configurable: true,
    },
  });

  if (typeof __dirname != "undefined") {
    __dirname = undefined;
  }
  if (typeof __filename != "undefined") {
    __filename = undefined;
  }
  if (typeof Buffer != "undefined") {
    Buffer = undefined;
  }
  var avoid_log = [
    "Symbol",
    "Object",
    "Number",
    "RegExp",
    "Boolean",
    "String",
    "constructor",
  ];
  var __globalThis__ = typeof global != "undefined" ? global : this;
  var window = new Proxy(v_new(Window), {
    get(a, b) {
      if (b == "global") {
        return;
      }
      var r = a[b] || __globalThis__[b];
      if (typeof b !== "symbol" && avoid_log.indexOf(b) == -1) {
        v_console_log("  [*] [window get " + b + "] ==>", r);
      }
      return r;
    },
    set(a, b, c) {
      if (b == "onclick" && typeof c == "function") {
        window.addEventListener("click", c);
      }
      if (b == "onmousedown" && typeof c == "function") {
        window.addEventListener("mousedown", c);
      }
      if (b == "onmouseup" && typeof c == "function") {
        window.addEventListener("mouseup", c);
      }
      __globalThis__[b] = a[b] = c;
      return true;
    },
  });
  function v_proxy(obj, name, func) {
    return new Proxy(obj, {
      get(a, b) {
        if (b == "global") {
          return;
        }
        var r = a[b];
        if (typeof b !== "symbol" && avoid_log.indexOf(b) == -1) {
          v_console_log("  [*] [" + name + " get " + b + "] ==>", r);
        }
        if (func && typeof r == "undefined") {
          r = func(name);
        }
        return r;
      },
      set(a, b, c) {
        if (typeof b !== "symbol" && avoid_log.indexOf(b) == -1) {
          v_console_log("  [*] [" + name + " set " + b + "] <--", c);
        }
        a[b] = c;
        return true;
      },
    });
  }
  var v_hasOwnProperty = Object.prototype.hasOwnProperty;
  Object.prototype.hasOwnProperty = v_saf(function hasOwnProperty() {
    var r;
    if (this === window) {
      r = v_hasOwnProperty.apply(__globalThis__, arguments);
    } else {
      r = v_hasOwnProperty.apply(this, arguments);
    }
    v_console_log(
      "  [*] [hasOwnProperty]",
      this === window ? window : this,
      [].slice.call(arguments),
      r
    );
    return r;
  });
  Object.defineProperties(__globalThis__, {
    [Symbol.toStringTag]: { value: "Window" },
  });
  Object.defineProperties(
    __globalThis__,
    Object.getOwnPropertyDescriptors(window)
  );
  Object.setPrototypeOf(__globalThis__, Object.getPrototypeOf(window));
  window.parent = window;
  window.top = window;
  window.frames = window;
  window.self = window;
  window.document = v_proxy(v_new(HTMLDocument), "document");
  window.location = v_proxy(v_new(Location), "location");
  window.history = v_proxy(v_new(History), "history");
  window.navigator = v_proxy(v_new(Navigator), "navigator");
  window.screen = v_proxy(v_new(Screen), "screen");
  window.clientInformation = navigator;
  window.performance = v_proxy(v_new(Performance), "performance");
  window.crypto = v_proxy(v_new(Crypto), "crypto");
  window.sessionStorage = v_proxy(v_new(Storage), "sessionStorage");
  window.localStorage = v_proxy(v_new(Storage), "localStorage");
  window.x = v_proxy(v_new(HTMLLinkElement), "x");

  var win = {
    window: window,
    frames: window,
    parent: window,
    self: window,
    top: window,
  };
  function v_repair_this() {
    win = {
      window: __globalThis__,
      frames: __globalThis__,
      parent: __globalThis__,
      self: __globalThis__,
      top: __globalThis__,
    };
  }
  Object.defineProperties(window, {
    window: {
      get: function () {
        return win.window;
      },
      set: function (e) {
        return true;
      },
    },
    frames: {
      get: function () {
        return win.frames;
      },
      set: function (e) {
        return true;
      },
    },
    parent: {
      get: function () {
        return win.parent;
      },
      set: function (e) {
        return true;
      },
    },
    self: {
      get: function () {
        return win.self;
      },
      set: function (e) {
        return true;
      },
    },
    top: {
      get: function () {
        return win.top;
      },
      set: function (e) {
        return true;
      },
    },
  });

  function _createElement(name) {
    var htmlmap = {
      HTMLElement: [
        "abbr",
        "address",
        "article",
        "aside",
        "b",
        "bdi",
        "bdo",
        "cite",
        "code",
        "dd",
        "dfn",
        "dt",
        "em",
        "figcaption",
        "figure",
        "footer",
        "header",
        "hgroup",
        "i",
        "kbd",
        "main",
        "mark",
        "nav",
        "noscript",
        "rp",
        "rt",
        "ruby",
        "s",
        "samp",
        "section",
        "small",
        "strong",
        "sub",
        "summary",
        "sup",
        "u",
        "var",
        "wbr",
      ],
      HTMLAnchorElement: ["a"],
      HTMLImageElement: ["img"],
      HTMLFontElement: ["font"],
      HTMLOutputElement: ["output"],
      HTMLAreaElement: ["area"],
      HTMLInputElement: ["input"],
      HTMLFormElement: ["form"],
      HTMLParagraphElement: ["p"],
      HTMLAudioElement: ["audio"],
      HTMLLabelElement: ["label"],
      HTMLFrameElement: ["frame"],
      HTMLParamElement: ["param"],
      HTMLBaseElement: ["base"],
      HTMLLegendElement: ["legend"],
      HTMLFrameSetElement: ["frameset"],
      HTMLPictureElement: ["picture"],
      HTMLBodyElement: ["body"],
      HTMLLIElement: ["li"],
      HTMLHeadingElement: ["h1", "h2", "h3", "h4", "h5", "h6"],
      HTMLPreElement: ["listing", "pre", "xmp"],
      HTMLBRElement: ["br"],
      HTMLLinkElement: ["link"],
      HTMLHeadElement: ["head"],
      HTMLProgressElement: ["progress"],
      HTMLButtonElement: ["button"],
      HTMLMapElement: ["map"],
      HTMLHRElement: ["hr"],
      HTMLQuoteElement: ["blockquote", "q"],
      HTMLCanvasElement: ["canvas"],
      HTMLMarqueeElement: ["marquee"],
      HTMLHtmlElement: ["html"],
      HTMLScriptElement: ["script"],
      HTMLDataElement: ["data"],
      HTMLMediaElement: [],
      HTMLIFrameElement: ["iframe"],
      HTMLTimeElement: ["time"],
      HTMLDataListElement: ["datalist"],
      HTMLMenuElement: ["menu"],
      HTMLSelectElement: ["select"],
      HTMLTitleElement: ["title"],
      HTMLDetailsElement: ["details"],
      HTMLMetaElement: ["meta"],
      HTMLSlotElement: ["slot"],
      HTMLTableRowElement: ["tr"],
      HTMLDialogElement: ["dialog"],
      HTMLMeterElement: ["meter"],
      HTMLSourceElement: ["source"],
      HTMLTableSectionElement: ["thead", "tbody", "tfoot"],
      HTMLDirectoryElement: ["dir"],
      HTMLModElement: ["del", "ins"],
      HTMLSpanElement: ["span"],
      HTMLTemplateElement: ["template"],
      HTMLDivElement: ["div"],
      HTMLObjectElement: ["object"],
      HTMLStyleElement: ["style"],
      HTMLTextAreaElement: ["textarea"],
      HTMLDListElement: ["dl"],
      HTMLOListElement: ["ol"],
      HTMLTableCaptionElement: ["caption"],
      HTMLTrackElement: ["track"],
      HTMLEmbedElement: ["embed"],
      HTMLOptGroupElement: ["optgroup"],
      HTMLTableCellElement: ["th", "td"],
      HTMLUListElement: ["ul"],
      HTMLFieldSetElement: ["fieldset"],
      HTMLOptionElement: ["option"],
      HTMLTableColElement: ["col", "colgroup"],
      HTMLUnknownElement: [],
      HTMLTableElement: ["table"],
      HTMLVideoElement: ["video"],
    };
    var ret,
      htmlmapkeys = Object.keys(htmlmap);
    name = name.toLocaleLowerCase();
    for (var i = 0; i < htmlmapkeys.length; i++) {
      if (htmlmap[htmlmapkeys[i]].indexOf(name) != -1) {
        if (!window[htmlmapkeys[i]]) {
          break;
        }
        ret = v_new(window[htmlmapkeys[i]]);
        break;
      }
    }
    if (!ret) {
      ret = v_proxy(
        v_new(HTMLUnknownElement),
        "HTMLUnknownElement",
        function (a) {
          return function () {
            v_console_log(a, ...arguments);
          };
        }
      );
    }
    if (typeof CSSStyleDeclaration != "undefined") {
      ret.v_style = v_proxy(v_new(CSSStyleDeclaration), "style");
    }
    ret.v_tagName = name.toUpperCase();
    return ret;
  }
  function init_cookie(cookie) {
    var cache = (cookie || "").trim();
    if (!cache) {
      cache = "";
    } else if (cache.charAt(cache.length - 1) != ";") {
      cache += "; ";
    } else {
      cache += " ";
    }
    Object.defineProperty(Document.prototype, "cookie", {
      get: function () {
        var r = cache.slice(0, cache.length - 2);
        v_console_log("  [*] document -> cookie[get]", r);
        return r;
      },
      set: function (c) {
        v_console_log("  [*] document -> cookie[set]", c);
        var ncookie = c.split(";")[0].split("=");
        if (!ncookie.slice(1).join("")) {
          return c;
        }
        var key = ncookie[0].trim();
        var val = ncookie.slice(1).join("").trim();
        var newc = key + "=" + val;
        var flag = false;
        var temp = cache.split("; ").map(function (a) {
          if (a.split("=")[0] === key) {
            flag = true;
            return newc;
          }
          return a;
        });
        cache = temp.join("; ");
        if (!flag) {
          cache += newc + "; ";
        }
        return cache;
      },
    });
  }
  function v_hook_href(obj, name, initurl) {
    var r = Object.defineProperty(obj, "href", {
      get: function () {
        if (!this.protocol && !this.hostname) {
          r = "";
        } else {
          r =
            this.protocol +
            "//" +
            this.hostname +
            (this.port ? ":" + this.port : "") +
            this.pathname +
            this.search +
            this.hash;
        }
        v_console_log(
          `  [*] ${name || obj.constructor.name} -> href[get]:`,
          JSON.stringify(r)
        );
        return r;
      },
      set: function (href) {
        href = href.trim();
        v_console_log(
          `  [*] ${name || obj.constructor.name} -> href[set]:`,
          JSON.stringify(href)
        );
        if (href.startsWith("http://") || href.startsWith("https://")) {
          /*ok*/
        } else if (href.startsWith("//")) {
          href = (this.protocol ? this.protocol : "http:") + href;
        } else {
          href =
            this.protocol +
            "//" +
            this.hostname +
            (this.port ? ":" + this.port : "") +
            "/" +
            (href[0] == "/" ? href.slice(1) : href);
        }
        var a = href.match(
          /([^:]+:)\/\/([^/:?#]+):?(\d+)?([^?#]*)?(\?[^#]*)?(#.*)?/
        );
        this.protocol = a[1] ? a[1] : "";
        this.hostname = a[2] ? a[2] : "";
        this.port = a[3] ? a[3] : "";
        this.pathname = a[4] ? a[4] : "";
        this.search = a[5] ? a[5] : "";
        this.hash = a[6] ? a[6] : "";
        this.host = this.hostname + (this.port ? ":" + this.port : "");
        this.origin =
          this.protocol +
          "//" +
          this.hostname +
          (this.port ? ":" + this.port : "");
      },
    });
    if (initurl && initurl.trim()) {
      var temp = v_new_toggle;
      v_new_toggle = true;
      r.href = initurl;
      v_new_toggle = temp;
    }
    return r;
  }
  function v_hook_storage() {
    Storage.prototype.clear = v_saf(function () {
      v_console_log(`  [*] Storage -> clear[func]:`);
      var self = this;
      Object.keys(self).forEach(function (key) {
        delete self[key];
      });
    }, "clear");
    Storage.prototype.getItem = v_saf(function (key) {
      v_console_log(`  [*] Storage -> getItem[func]:`, key);
      var r = this.hasOwnProperty(key) ? String(this[key]) : null;
      return r;
    }, "getItem");
    Storage.prototype.setItem = v_saf(function (key, val) {
      v_console_log(`  [*] Storage -> setItem[func]:`, key, val);
      this[key] = val === undefined ? null : String(val);
    }, "setItem");
    Storage.prototype.key = v_saf(function (key) {
      v_console_log(`  [*] Storage -> key[func]:`, key);
      return Object.keys(this)[key || 0];
    }, "key");
    Storage.prototype.removeItem = v_saf(function (key) {
      v_console_log(`  [*] Storage -> removeItem[func]:`, key);
      delete this[key];
    }, "removeItem");
    Object.defineProperty(Storage.prototype, "length", {
      get: function () {
        if (this === Storage.prototype) {
          throw TypeError("Illegal invocation");
        }
        return Object.keys(this).length;
      },
    });
    window.sessionStorage = new Proxy(sessionStorage, {
      set: function (a, b, c) {
        v_console_log(`  [*] Storage -> [set]:`, b, c);
        return (a[b] = String(c));
      },
      get: function (a, b) {
        v_console_log(`  [*] Storage -> [get]:`, b, a[b]);
        return a[b];
      },
    });
    window.localStorage = new Proxy(localStorage, {
      set: function (a, b, c) {
        v_console_log(`  [*] Storage -> [set]:`, b, c);
        return (a[b] = String(c));
      },
      get: function (a, b) {
        v_console_log(`  [*] Storage -> [get]:`, b, a[b]);
        return a[b];
      },
    });
  }
  function v_init_document() {
    Document.prototype.documentElement = v_proxy(
      _createElement("html"),
      "documentElement"
    );
    Document.prototype.createElement = v_saf(function createElement() {
      return v_proxy(
        _createElement(arguments[0]),
        "createElement " + arguments[0]
      );
    });
    Document.prototype.getElementById = v_saf(function getElementById(name) {
      var r = v_getele(name, "getElementById");
      v_console_log("  [*] Document -> getElementById", name, r);
      return r;
    });
    Document.prototype.querySelector = v_saf(function querySelector(name) {
      var r = v_getele(name, "querySelector");
      v_console_log("  [*] Document -> querySelector", name, r);
      return r;
    });
    Document.prototype.getElementsByClassName = v_saf(
      function getElementsByClassName(name) {
        var r = v_geteles(name, "getElementsByClassName");
        v_console_log("  [*] Document -> getElementsByClassName", name, r);
        return r;
      }
    );
    Document.prototype.getElementsByName = v_saf(function getElementsByName(
      name
    ) {
      var r = v_geteles(name, "getElementsByName");
      v_console_log("  [*] Document -> getElementsByName", name, r);
      return r;
    });
    Document.prototype.getElementsByTagName = v_saf(
      function getElementsByTagName(name) {
        var r = v_geteles(name, "getElementsByTagName");
        v_console_log("  [*] Document -> getElementsByTagName", name, r);
        return r;
      }
    );
    Document.prototype.getElementsByTagNameNS = v_saf(
      function getElementsByTagNameNS(name) {
        var r = v_geteles(name, "getElementsByTagNameNS");
        v_console_log("  [*] Document -> getElementsByTagNameNS", name, r);
        return r;
      }
    );
    Document.prototype.querySelectorAll = v_saf(function querySelectorAll(
      name
    ) {
      var r = v_geteles(name, "querySelectorAll");
      v_console_log("  [*] Document -> querySelectorAll", name, r);
      return r;
    });
    var v_head = v_new(HTMLHeadElement);
    var v_body = v_new(HTMLBodyElement);
    Object.defineProperties(Document.prototype, {
      head: {
        get() {
          v_console_log("  [*] Document -> head[get]", v_head);
          return v_proxy(v_head, "document.head");
        },
      },
      body: {
        get() {
          v_console_log("  [*] Document -> body[get]", v_body);
          return v_proxy(v_body, "document.body");
        },
      },
    });
  }
  function v_init_canvas() {
    HTMLCanvasElement.prototype.getContext = function () {
      if (arguments[0] == "2d") {
        var r = v_proxy(
          v_new(CanvasRenderingContext2D),
          "canvas2d",
          function (a) {
            return function () {
              v_console_log(a, ...arguments);
            };
          }
        );
        return r;
      }
      if (arguments[0] == "webgl" || arguments[0] == "experimental-webgl") {
        var r = v_proxy(v_new(WebGLRenderingContext), "webgl", function (a) {
          return function () {
            v_console_log(a, ...arguments);
          };
        });
        r._canvas = this;
        return r;
      }
      return null;
    };
    HTMLCanvasElement.prototype.toDataURL = function () {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAEYklEQVR4Xu3UAQkAAAwCwdm/9HI83BLIOdw5AgQIRAQWySkmAQIEzmB5AgIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlACBB1YxAJfjJb2jAAAAAElFTkSuQmCC";
    };
  }
  var v_start_stamp = +new Date();
  var v_fake_stamp = +new Date();
  function v_init_event_target() {
    v_events = {};
    function add_event(_this, x) {
      if (!v_events[x[0]]) {
        v_events[x[0]] = [];
      }
      v_events[x[0]].push([_this, x[1].bind(_this)]);
    }
    function _mk_mouse_event(
      type,
      canBubble,
      cancelable,
      view,
      detail,
      screenX,
      screenY,
      clientX,
      clientY,
      ctrlKey,
      altKey,
      shiftKey,
      metaKey,
      button,
      relatedTarget
    ) {
      if (type == "click") {
        var m = new v_saf(function PointerEvent() {});
        m.pointerType = "mouse";
      } else {
        var m = new v_saf(function MouseEvent() {});
      }
      m.isTrusted = true;
      m.type = type;
      m.canBubble = canBubble;
      m.cancelable = cancelable;
      m.view = view;
      m.detail = detail;
      m.screenX = screenX;
      m.movementX = screenX;
      m.screenY = screenY;
      m.movementY = screenY;
      m.clientX = clientX;
      m.layerX = clientX;
      m.offsetX = clientX;
      m.pageX = clientX;
      m.x = clientX;
      m.clientY = clientY;
      m.layerY = clientY;
      m.offsetY = clientY;
      m.pageY = clientY;
      m.y = clientY;
      m.ctrlKey = ctrlKey;
      m.altKey = altKey;
      m.shiftKey = shiftKey;
      m.metaKey = metaKey;
      m.button = button;
      m.relatedTarget = relatedTarget;
      return m;
    }
    function make_mouse(type, x, y) {
      return _mk_mouse_event(
        type,
        true,
        true,
        window,
        0,
        0,
        0,
        x,
        y,
        false,
        false,
        false,
        false,
        0,
        null
      );
    }
    function mouse_click(x, y) {
      for (var i = 0; i < (v_events["click"] || []).length; i++) {
        v_events["click"][i][1](make_mouse("click", x, y));
      }
      for (var i = 0; i < (v_events["mousedown"] || []).length; i++) {
        v_events["mousedown"][i][1](make_mouse("mousedown", x, y));
      }
      for (var i = 0; i < (v_events["mouseup"] || []).length; i++) {
        v_events["mouseup"][i][1](make_mouse("mouseup", x, y));
      }
    }
    var offr = Math.random();
    function make_touch(_this, type, x, y, timeStamp) {
      var offx = Math.random();
      var offy = Math.random();
      var t = v_new(new v_saf(function Touch() {}));
      t = clientX = offx + x;
      t = clientY = offy + y;
      t = force = 1;
      t = identifier = 0;
      t = pageX = offx + x;
      t = pageY = offy + y;
      t = radiusX = 28 + offr;
      t = radiusY = 28 + offr;
      t = rotationAngle = 0;
      t = screenX = 0;
      t = screenY = 0;
      var e = v_new(new v_saf(function TouchEvent() {}));
      e.isTrusted = true;
      e.altKey = false;
      e.bubbles = true;
      e.cancelBubble = false;
      e.cancelable = false;
      e.changedTouches = e.targetTouches = e.touches = [t];
      e.composed = true;
      e.ctrlKey = false;
      e.currentTarget = null;
      e.defaultPrevented = false;
      e.detail = 0;
      e.eventPhase = 0;
      e.metaKey = false;
      e.path = _this == window ? [window] : [_this, window];
      e.returnValue = true;
      e.shiftKey = false;
      e.sourceCapabilities = new v_saf(function InputDeviceCapabilities() {
        this.firesTouchEvents = true;
      });
      e.srcElement = _this;
      e.target = _this;
      e.type = type;
      e.timeStamp =
        timeStamp == undefined
          ? new Date() - v_start_stamp
          : (v_fake_stamp += Math.random() * 20) - v_start_stamp;
      e.view = window;
      e.which = 0;
      return e;
    }
    function make_trace(x1, y1, x2, y2) {
      // 贝塞尔曲线
      function step_len(x1, y1, x2, y2) {
        var ln = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5;
        return (ln / 10) ^ 0;
      }
      var slen = step_len(x1, y1, x2, y2);
      if (slen < 3) {
        return [];
      }
      function factorial(x) {
        for (var y = 1; x > 1; x--) {
          y *= x;
        }
        return y;
      }
      var lp = Math.random();
      var rp = Math.random();
      var xx1 = (x1 + ((x2 - x1) / 12) * (4 - lp * 4)) ^ 0;
      var yy1 = (y1 + ((y2 - y1) / 12) * (8 + lp * 4)) ^ 0;
      var xx2 = (x1 + ((x2 - x1) / 12) * (8 + rp * 4)) ^ 0;
      var yy2 = (y1 + ((y2 - y1) / 12) * (4 - rp * 4)) ^ 0;
      var points = [
        [x1, y1],
        [xx1, yy1],
        [xx2, yy2],
        [x2, y2],
      ];
      var N = points.length;
      var n = N - 1;
      var traces = [];
      var step = slen;
      for (var T = 0; T < step + 1; T++) {
        var t = T * (1 / step);
        var x = 0;
        var y = 0;
        for (var i = 0; i < N; i++) {
          var B =
            (factorial(n) * t ** i * (1 - t) ** (n - i)) /
            (factorial(i) * factorial(n - i));
          x += points[i][0] * B;
          y += points[i][1] * B;
        }
        traces.push([x ^ 0, y ^ 0]);
      }
      return traces;
    }
    function touch(x1, y1, x2, y2) {
      if (x2 == undefined && y2 == undefined) {
        x2 = x1;
        y2 = y1;
      }
      var traces = make_trace(x1, y1, x2, y2);
      v_console_log("traces:", traces);
      for (var i = 0; i < (v_events["touchstart"] || []).length; i++) {
        v_events["touchstart"][i][1](
          make_touch(v_events["touchstart"][i][0], "touchstart", x1, y1)
        );
      }
      for (var j = 0; j < traces.length; j++) {
        var x = traces[j][0];
        var y = traces[j][0];
        for (var i = 0; i < (v_events["touchmove"] || []).length; i++) {
          v_events["touchmove"][i][1](
            make_touch(v_events["touchmove"][i][0], "touchmove", x, y)
          );
        }
      }
      for (var i = 0; i < (v_events["touchend"] || []).length; i++) {
        v_events["touchend"][i][1](
          make_touch(v_events["touchend"][i][0], "touchend", x2, y2)
        );
      }
    }
    function mouse_move(x1, y1, x2, y2) {
      if (x2 == undefined && y2 == undefined) {
        x2 = x1;
        y2 = y1;
      }
      var traces = make_trace(x1, y1, x2, y2);
      v_console_log("traces:", traces);
      for (var j = 0; j < traces.length; j++) {
        var x = traces[j][0];
        var y = traces[j][0];
        for (var i = 0; i < (v_events["mousemove"] || []).length; i++) {
          v_events["mousemove"][i][1](
            make_touch(v_events["mousemove"][i][0], "mousemove", x, y)
          );
        }
      }
    }
    window.make_mouse = make_mouse;
    window.mouse_click = mouse_click;
    window.mouse_move = mouse_move;
    window.touch = touch;
    EventTarget.prototype.addEventListener = function () {
      v_console_log(
        "  [*] EventTarget -> addEventListener[func]",
        this === window ? "[Window]" : this === document ? "[Document]" : this,
        [].slice.call(arguments)
      );
      add_event(this, [].slice.call(arguments));
      return null;
    };
    EventTarget.prototype.dispatchEvent = function () {
      v_console_log(
        "  [*] EventTarget -> dispatchEvent[func]",
        this === window ? "[Window]" : this === document ? "[Document]" : this,
        [].slice.call(arguments)
      );
      add_event(this, [].slice.call(arguments));
      return null;
    };
    EventTarget.prototype.removeEventListener = function () {
      v_console_log(
        "  [*] EventTarget -> removeEventListener[func]",
        this === window ? "[Window]" : this === document ? "[Document]" : this,
        [].slice.call(arguments)
      );
      add_event(this, [].slice.call(arguments));
      return null;
    };
  }
  function v_init_Element_prototype() {
    Element.prototype.appendChild =
      Element.prototype.appendChild ||
      v_saf(function appendChild() {
        v_console_log(
          "  [*] Element -> appendChild[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.removeChild =
      Element.prototype.removeChild ||
      v_saf(function removeChild() {
        v_console_log(
          "  [*] Element -> removeChild[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getAnimations =
      Element.prototype.getAnimations ||
      v_saf(function getAnimations() {
        v_console_log(
          "  [*] Element -> getAnimations[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getAttribute =
      Element.prototype.getAttribute ||
      v_saf(function getAttribute() {
        v_console_log(
          "  [*] Element -> getAttribute[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getAttributeNS =
      Element.prototype.getAttributeNS ||
      v_saf(function getAttributeNS() {
        v_console_log(
          "  [*] Element -> getAttributeNS[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getAttributeNames =
      Element.prototype.getAttributeNames ||
      v_saf(function getAttributeNames() {
        v_console_log(
          "  [*] Element -> getAttributeNames[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getAttributeNode =
      Element.prototype.getAttributeNode ||
      v_saf(function getAttributeNode() {
        v_console_log(
          "  [*] Element -> getAttributeNode[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getAttributeNodeNS =
      Element.prototype.getAttributeNodeNS ||
      v_saf(function getAttributeNodeNS() {
        v_console_log(
          "  [*] Element -> getAttributeNodeNS[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getBoundingClientRect =
      Element.prototype.getBoundingClientRect ||
      v_saf(function getBoundingClientRect() {
        v_console_log(
          "  [*] Element -> getBoundingClientRect[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getClientRects =
      Element.prototype.getClientRects ||
      v_saf(function getClientRects() {
        v_console_log(
          "  [*] Element -> getClientRects[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getElementsByClassName =
      Element.prototype.getElementsByClassName ||
      v_saf(function getElementsByClassName() {
        v_console_log(
          "  [*] Element -> getElementsByClassName[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getElementsByTagName =
      Element.prototype.getElementsByTagName ||
      v_saf(function getElementsByTagName() {
        v_console_log(
          "  [*] Element -> getElementsByTagName[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getElementsByTagNameNS =
      Element.prototype.getElementsByTagNameNS ||
      v_saf(function getElementsByTagNameNS() {
        v_console_log(
          "  [*] Element -> getElementsByTagNameNS[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.getInnerHTML =
      Element.prototype.getInnerHTML ||
      v_saf(function getInnerHTML() {
        v_console_log(
          "  [*] Element -> getInnerHTML[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.hasAttribute =
      Element.prototype.hasAttribute ||
      v_saf(function hasAttribute() {
        v_console_log(
          "  [*] Element -> hasAttribute[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.hasAttributeNS =
      Element.prototype.hasAttributeNS ||
      v_saf(function hasAttributeNS() {
        v_console_log(
          "  [*] Element -> hasAttributeNS[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.hasAttributes =
      Element.prototype.hasAttributes ||
      v_saf(function hasAttributes() {
        v_console_log(
          "  [*] Element -> hasAttributes[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.hasPointerCapture =
      Element.prototype.hasPointerCapture ||
      v_saf(function hasPointerCapture() {
        v_console_log(
          "  [*] Element -> hasPointerCapture[func]",
          [].slice.call(arguments)
        );
      });
    Element.prototype.webkitMatchesSelector =
      Element.prototype.webkitMatchesSelector ||
      v_saf(function webkitMatchesSelector() {
        v_console_log(
          "  [*] Element -> webkitMatchesSelector[func]",
          [].slice.call(arguments)
        );
      });
  }
  function v_init_HTMLElement() {
    try {
      Object.defineProperties(HTMLElement.prototype, {
        style: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function style() {
            v_console_log(
              "  [*] HTMLElement -> style[get]",
              [].slice.call(arguments)
            );
            return this.v_style;
          }),
        },
      });
    } catch (e) {
      v_console_log(e);
    }
  }
  function v_init_DOMTokenList_prototype() {
    DOMTokenList.prototype.add =
      DOMTokenList.prototype.add ||
      v_saf(function add() {
        v_console_log(
          "  [*] DOMTokenList -> add[func]",
          [].slice.call(arguments)
        );
      });
    DOMTokenList.prototype.contains =
      DOMTokenList.prototype.contains ||
      v_saf(function contains() {
        v_console_log(
          "  [*] DOMTokenList -> contains[func]",
          [].slice.call(arguments)
        );
      });
    DOMTokenList.prototype.entries =
      DOMTokenList.prototype.entries ||
      v_saf(function entries() {
        v_console_log(
          "  [*] DOMTokenList -> entries[func]",
          [].slice.call(arguments)
        );
      });
    DOMTokenList.prototype.forEach =
      DOMTokenList.prototype.forEach ||
      v_saf(function forEach() {
        v_console_log(
          "  [*] DOMTokenList -> forEach[func]",
          [].slice.call(arguments)
        );
      });
    DOMTokenList.prototype.item =
      DOMTokenList.prototype.item ||
      v_saf(function item() {
        v_console_log(
          "  [*] DOMTokenList -> item[func]",
          [].slice.call(arguments)
        );
      });
    DOMTokenList.prototype.keys =
      DOMTokenList.prototype.keys ||
      v_saf(function keys() {
        v_console_log(
          "  [*] DOMTokenList -> keys[func]",
          [].slice.call(arguments)
        );
      });
    DOMTokenList.prototype.length =
      DOMTokenList.prototype.length ||
      v_saf(function length() {
        v_console_log(
          "  [*] DOMTokenList -> length[func]",
          [].slice.call(arguments)
        );
      });
    DOMTokenList.prototype.remove =
      DOMTokenList.prototype.remove ||
      v_saf(function remove() {
        v_console_log(
          "  [*] DOMTokenList -> remove[func]",
          [].slice.call(arguments)
        );
      });
    DOMTokenList.prototype.replace =
      DOMTokenList.prototype.replace ||
      v_saf(function replace() {
        v_console_log(
          "  [*] DOMTokenList -> replace[func]",
          [].slice.call(arguments)
        );
      });
    DOMTokenList.prototype.supports =
      DOMTokenList.prototype.supports ||
      v_saf(function supports() {
        v_console_log(
          "  [*] DOMTokenList -> supports[func]",
          [].slice.call(arguments)
        );
      });
    DOMTokenList.prototype.toggle =
      DOMTokenList.prototype.toggle ||
      v_saf(function toggle() {
        v_console_log(
          "  [*] DOMTokenList -> toggle[func]",
          [].slice.call(arguments)
        );
      });
  }
  function v_init_CSSStyleDeclaration_prototype() {
    CSSStyleDeclaration.prototype["zoom"] = "";
    CSSStyleDeclaration.prototype["resize"] = "";
    CSSStyleDeclaration.prototype["text-rendering"] = "";
    CSSStyleDeclaration.prototype["text-align-last"] = "";
  }
  function v_init_PointerEvent_prototype() {
    PointerEvent.prototype.getCoalescedEvents = v_saf(
      function getCoalescedEvents() {
        v_console_log(
          "  [*] PointerEvent -> getCoalescedEvents[func]",
          [].slice.call(arguments)
        );
      }
    );
    PointerEvent.prototype.getPredictedEvents = v_saf(
      function getPredictedEvents() {
        v_console_log(
          "  [*] PointerEvent -> getPredictedEvents[func]",
          [].slice.call(arguments)
        );
      }
    );
  }
  function v_init_PerformanceTiming_prototype() {
    try {
      Object.defineProperties(PerformanceTiming.prototype, {
        connectEnd: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function connectEnd() {
            v_console_log(
              "  [*] PerformanceTiming -> connectEnd[get]",
              [].slice.call(arguments)
            );
          }),
        },
        connectStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function connectStart() {
            v_console_log(
              "  [*] PerformanceTiming -> connectStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
        domComplete: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function domComplete() {
            v_console_log(
              "  [*] PerformanceTiming -> domComplete[get]",
              [].slice.call(arguments)
            );
          }),
        },
        domContentLoadedEventEnd: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function domContentLoadedEventEnd() {
            v_console_log(
              "  [*] PerformanceTiming -> domContentLoadedEventEnd[get]",
              [].slice.call(arguments)
            );
          }),
        },
        domContentLoadedEventStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function domContentLoadedEventStart() {
            v_console_log(
              "  [*] PerformanceTiming -> domContentLoadedEventStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
        domInteractive: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function domInteractive() {
            v_console_log(
              "  [*] PerformanceTiming -> domInteractive[get]",
              [].slice.call(arguments)
            );
          }),
        },
        domLoading: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function domLoading() {
            v_console_log(
              "  [*] PerformanceTiming -> domLoading[get]",
              [].slice.call(arguments)
            );
          }),
        },
        domainLookupEnd: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function domainLookupEnd() {
            v_console_log(
              "  [*] PerformanceTiming -> domainLookupEnd[get]",
              [].slice.call(arguments)
            );
          }),
        },
        domainLookupStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function domainLookupStart() {
            v_console_log(
              "  [*] PerformanceTiming -> domainLookupStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
        fetchStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function fetchStart() {
            v_console_log(
              "  [*] PerformanceTiming -> fetchStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
        loadEventEnd: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function loadEventEnd() {
            v_console_log(
              "  [*] PerformanceTiming -> loadEventEnd[get]",
              [].slice.call(arguments)
            );
          }),
        },
        loadEventStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function loadEventStart() {
            v_console_log(
              "  [*] PerformanceTiming -> loadEventStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
        navigationStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function navigationStart() {
            v_console_log(
              "  [*] PerformanceTiming -> navigationStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
        redirectEnd: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function redirectEnd() {
            v_console_log(
              "  [*] PerformanceTiming -> redirectEnd[get]",
              [].slice.call(arguments)
            );
          }),
        },
        redirectStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function redirectStart() {
            v_console_log(
              "  [*] PerformanceTiming -> redirectStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
        requestStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function requestStart() {
            v_console_log(
              "  [*] PerformanceTiming -> requestStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
        responseEnd: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function responseEnd() {
            v_console_log(
              "  [*] PerformanceTiming -> responseEnd[get]",
              [].slice.call(arguments)
            );
          }),
        },
        responseStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function responseStart() {
            v_console_log(
              "  [*] PerformanceTiming -> responseStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
        secureConnectionStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function secureConnectionStart() {
            v_console_log(
              "  [*] PerformanceTiming -> secureConnectionStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
        unloadEventEnd: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function unloadEventEnd() {
            v_console_log(
              "  [*] PerformanceTiming -> unloadEventEnd[get]",
              [].slice.call(arguments)
            );
          }),
        },
        unloadEventStart: {
          set: undefined,
          enumerable: true,
          configurable: true,
          get: v_saf(function unloadEventStart() {
            v_console_log(
              "  [*] PerformanceTiming -> unloadEventStart[get]",
              [].slice.call(arguments)
            );
          }),
        },
      });
    } catch (e) {}
  }
  function mk_atob_btoa(r) {
    var a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
      t = [
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57,
        58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1,
        -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1,
      ];
    return {
      atob: function (r) {
        var a, e, o, h, c, i, n;
        for (i = r.length, c = 0, n = ""; c < i; ) {
          do {
            a = t[255 & r.charCodeAt(c++)];
          } while (c < i && -1 == a);
          if (-1 == a) break;
          do {
            e = t[255 & r.charCodeAt(c++)];
          } while (c < i && -1 == e);
          if (-1 == e) break;
          n += String.fromCharCode((a << 2) | ((48 & e) >> 4));
          do {
            if (61 == (o = 255 & r.charCodeAt(c++))) return n;
            o = t[o];
          } while (c < i && -1 == o);
          if (-1 == o) break;
          n += String.fromCharCode(((15 & e) << 4) | ((60 & o) >> 2));
          do {
            if (61 == (h = 255 & r.charCodeAt(c++))) return n;
            h = t[h];
          } while (c < i && -1 == h);
          if (-1 == h) break;
          n += String.fromCharCode(((3 & o) << 6) | h);
        }
        return n;
      },
      btoa: function (r) {
        var t, e, o, h, c, i;
        for (o = r.length, e = 0, t = ""; e < o; ) {
          if (((h = 255 & r.charCodeAt(e++)), e == o)) {
            (t += a.charAt(h >> 2)), (t += a.charAt((3 & h) << 4)), (t += "==");
            break;
          }
          if (((c = r.charCodeAt(e++)), e == o)) {
            (t += a.charAt(h >> 2)),
              (t += a.charAt(((3 & h) << 4) | ((240 & c) >> 4))),
              (t += a.charAt((15 & c) << 2)),
              (t += "=");
            break;
          }
          (i = r.charCodeAt(e++)),
            (t += a.charAt(h >> 2)),
            (t += a.charAt(((3 & h) << 4) | ((240 & c) >> 4))),
            (t += a.charAt(((15 & c) << 2) | ((192 & i) >> 6))),
            (t += a.charAt(63 & i));
        }
        return t;
      },
    };
  }
  var atob_btoa = mk_atob_btoa();
  window.btoa = window.btoa || v_saf(atob_btoa.btoa, "btoa");
  window.atob = window.atob || v_saf(atob_btoa.atob, "atob");
  window.postMessage = v_saf(function () {
    v_console_log("  [*] [postMessage]", arguments);
  }, "postMessage");
  window.matchMedia = v_saf(function () {
    v_console_log("  [*] [matchMedia]", arguments);
    return v_proxy({}, "matchMedia{}");
  }, "matchMedia");

  init_cookie(
    "_zap=528fa2c6-4449-4c25-a046-b9d5fbc83949; d_c0=AFCSc2wb_RmPTtdAxKxyQyok-YuztUisHw8=|1739262461; __snaker__id=IlrksQSsGBjlBlLb; q_c1=11aac7aa553447b0818a97ceb2b44324|1739262471000|1739262471000; _xsrf=X0T93BIdgNCBQmPGU7Zl3Qv844HBmm8t; edu_user_uuid=edu-v1|d74f2b44-15b8-425f-a887-14b287e9b46f; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1753322021,1753689347,1753757980,1753924249; __zse_ck=004_LRk1WfVJ8Z0vyWaKQIpLIwrLlvpxwfi2Ji1Et7w4XDw0tsapWKgND8f==RXP9qbaXN=CFFyRAZJt=/1rq=ATr=iFf/eDCEimgO8ih5Ak3NJDoGfuhw9MWHNDoYXrSKAo-0p9uqvf6aBLKlAPldeWwEJD5+Iz7UaGXFwaNwgRGxUsPpnpfCbMCQz08rivLhbZxDBF9T7WyBk/ll1Aa/i9XZ8YoiyZv943eLRe8YCD7eEomuAYYv4j0IaIZq97mklYR; wzaIsOn=true; speakVolume=0; readStatus=pointRead; batchReadIsOn=false; guidesStatus=off; highContrastMode=defaltMode; cursorStatus=off; tst=r; SESSIONID=X27URaM6MVhlhH7OtMhUxpnkbrLi0izOo15sipeStvI; JOID=VVsQC0pCfi6QRMXNBU2MvZAt0TIeHkoUzBCghj4JLEDxJYv-TO8euvdGx8YBcw40ZOmLzyNjDmVa9hL4mj6cLIY=; osd=U1EdBUtEdCOeRcPHCEONu5og3zMYFEcazRaqizAIKkr8K4r4RuIQu_FMysgAdQQ5auiNxS5tD2NQ-xz5nDSRIoc=; BEC=684e706569bf16169217bb2a788786f3"
  );
  v_hook_href(
    window.location,
    "location",
    "https://www.zhihu.com/question/7272414588/answer/1923233640646702518"
  );
  Location.prototype.toString = v_saf(function toString() {
    return "https://www.zhihu.com/question/7272414588/answer/1923233640646702518";
  });
  window.alert = v_saf(function alert() {});
  v_hook_storage();
  v_init_HTMLElement();
  v_init_document();
  v_init_canvas();
  v_init_event_target();
  v_init_Element_prototype();
  v_init_DOMTokenList_prototype();
  v_init_CSSStyleDeclaration_prototype();
  v_init_PointerEvent_prototype();
  v_init_PerformanceTiming_prototype();
  window.innerWidth = 2129;
  window.innerHeight = 1211;
  window.outerHeight = 1340;
  window.outerWidth = 2145;
  window.isSecureContext = true;
  window.origin = location.origin;
  function v_getele(name, func) {
    if (
      name.toLocaleLowerCase() == "js-clientconfig" &&
      func == "getElementById"
    ) {
      return v_new(HTMLScriptElement);
    }
    if (name.toLocaleLowerCase() == "ariascripts" && func == "getElementById") {
      return v_new(HTMLScriptElement);
    }
    if (name.toLocaleLowerCase() == ":defined" && func == "querySelector") {
      return v_new(HTMLHtmlElement);
    }
    if (name.toLocaleLowerCase() == "#ariascripts" && func == "querySelector") {
      return v_new(HTMLScriptElement);
    }
    if (name.toLocaleLowerCase() == "head" && func == "querySelector") {
      return v_new(HTMLHeadElement);
    }
    if (
      name.toLocaleLowerCase() == "[http-equiv='x-ua-compatible']" &&
      func == "querySelector"
    ) {
      return v_new(HTMLMetaElement);
    }
    if (
      name.toLocaleLowerCase() == "js-initialdata" &&
      func == "getElementById"
    ) {
      return v_new(HTMLScriptElement);
    }
    if (name.toLocaleLowerCase() == "root" && func == "getElementById") {
      return v_new(HTMLDivElement);
    }
    if (
      name.toLocaleLowerCase() == 'style[data-emotion-css="1oxku7z"]' &&
      func == "querySelector"
    ) {
      return v_new(HTMLStyleElement);
    }
    if (
      name.toLocaleLowerCase() ==
        ".answeritem[name='1923233640646702518'] .richcontent-inner" &&
      func == "querySelector"
    ) {
      return v_new(HTMLDivElement);
    }
    return null;
  }
  function v_geteles(name, func) {
    if (name == "style[data-emotion-css]" && func == "querySelectorAll") {
      return [
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
        v_new(HTMLStyleElement),
      ];
    }
    if (name == "#ariascripts" && func == "querySelectorAll") {
      return [v_new(HTMLScriptElement)];
    }
    if (name == "body" && func == "querySelectorAll") {
      return [v_new(HTMLBodyElement)];
    }
    if (name == "meta[http-equiv]" && func == "querySelectorAll") {
      return [v_new(HTMLMetaElement)];
    }
    if (name == "script" && func == "getElementsByTagName") {
      return [
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
      ];
    }
    if (name == "link" && func == "getElementsByTagName") {
      return [
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
      ];
    }
    if (name == "head" && func == "getElementsByTagName") {
      return [v_new(HTMLHeadElement)];
    }
    if (name == 'link[rel="stylesheet"]' && func == "querySelectorAll") {
      return [
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
        v_new(HTMLLinkElement),
      ];
    }
    if (
      name == "img.origin_image,img.content_image" &&
      func == "querySelectorAll"
    ) {
      return [
        v_new(HTMLImageElement),
        v_new(HTMLImageElement),
        v_new(HTMLImageElement),
      ];
    }
    if (name == "adsbox" && func == "getElementsByClassName") {
      return [];
    }
    if (
      name ==
        "#app, .app, #root, .root, body, body > *, body > * > *, body > * > * > *" &&
      func == "querySelectorAll"
    ) {
      return [
        v_new(HTMLBodyElement),
        v_new(HTMLAnchorElement),
        v_new(HTMLImageElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLScriptElement),
        v_new(HTMLLinkElement),
        v_new(HTMLScriptElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLElement),
        v_new(HTMLScriptElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLScriptElement),
      ];
    }
    if (name == "body > div" && func == "querySelectorAll") {
      return [
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
        v_new(HTMLDivElement),
      ];
    }
    return null;
  }
  var v_Date = Date;
  var v_base_time = +new Date();
  (function () {
    function ftime() {
      return new v_Date() - v_base_time + v_to_time;
    }
    Date = (function (_Date) {
      var bind = Function.bind;
      var unbind = bind.bind(bind);
      function instantiate(constructor, args) {
        return new (unbind(constructor, null).apply(null, args))();
      }
      var names = Object.getOwnPropertyNames(_Date);
      for (var i = 0; i < names.length; i++) {
        if (names[i] in Date) continue;
        var desc = Object.getOwnPropertyDescriptor(_Date, names[i]);
        Object.defineProperty(Date, names[i], desc);
      }
      function Date() {
        var date = instantiate(_Date, [ftime()]);
        return date;
      }
      Date.prototype = _Date.prototype;
      return v_saf(Date);
    })(Date);
    Date.now = v_saf(function now() {
      return ftime();
    });
  })();
  var v_to_time = +new v_Date();
  // var v_to_time = +new v_Date('Sat Sep 03 2022 11:11:58 GMT+0800') // 自定义起始时间

  v_repair_this(); // 修复 window 指向global
  v_new_toggle = false;

  // v_console_log = function(){} // 关闭日志输出
  // setTimeout = function(){} // 关闭定时器
  // setInterval = function(){} // 关闭定时器
  return window;
})();

(self.webpackChunkheifetz = self.webpackChunkheifetz || []).push([
  [2636],
  {
    1514: function (__unused_webpack_module, exports, __webpack_require__) {
      "use strict";
      var _type_of = __webpack_require__(74185),
        x = function (tt) {
          return C(tt) || s(tt) || t();
        },
        C = function (tt) {
          if (Array.isArray(tt)) {
            for (var te = 0, tr = Array(tt.length); te < tt.length; te++)
              tr[te] = tt[te];
            return tr;
          }
        },
        s = function (tt) {
          if (
            Symbol.A in Object(tt) ||
            "[object Arguments]" === Object.prototype.toString.call(tt)
          )
            return Array.from(tt);
        },
        t = function () {
          throw TypeError("Invalid attempt to spread non-iterable instance");
        },
        i = function (tt, te, tr) {
          (te[tr] = 255 & (tt >>> 24)),
            (te[tr + 1] = 255 & (tt >>> 16)),
            (te[tr + 2] = 255 & (tt >>> 8)),
            (te[tr + 3] = 255 & tt);
        },
        B = function (tt, te) {
          return (
            ((255 & tt[te]) << 24) |
            ((255 & tt[te + 1]) << 16) |
            ((255 & tt[te + 2]) << 8) |
            (255 & tt[te + 3])
          );
        },
        Q = function (tt, te) {
          return ((4294967295 & tt) << te) | (tt >>> (32 - te));
        },
        G = function (tt) {
          var te = [, , , ,],
            tr = [, , , ,];
          i(tt, te, 0),
            (tr[0] = h.zb[255 & te[0]]),
            (tr[1] = h.zb[255 & te[1]]),
            (tr[2] = h.zb[255 & te[2]]),
            (tr[3] = h.zb[255 & te[3]]);
          var ti = B(tr, 0);
          return ti ^ Q(ti, 2) ^ Q(ti, 10) ^ Q(ti, 18) ^ Q(ti, 24);
        },
        l = (window.l = function () {
          (this.C = [0, 0, 0, 0]),
            (this.s = 0),
            (this.t = []),
            (this.S = []),
            (this.h = []),
            (this.i = []),
            (this.B = []),
            (this.Q = !1),
            (this.G = []),
            (this.D = []),
            (this.w = 1024),
            (this.g = null),
            (this.a = Date.now()),
            (this.e = 0),
            (this.T = 255),
            (this.V = null),
            (this.U = Date.now),
            (this.M = Array(32));
        });
      function o(tt) {
        return (o =
          "function" == typeof Symbol && "symbol" == _type_of._(Symbol.A)
            ? function (tt) {
                return void 0 === tt ? "undefined" : _type_of._(tt);
              }
            : function (tt) {
                return tt &&
                  "function" == typeof Symbol &&
                  tt.constructor === Symbol &&
                  tt !== Symbol.prototype
                  ? "symbol"
                  : void 0 === tt
                  ? "undefined"
                  : _type_of._(tt);
              })(tt);
      }
      __webpack_unused_export__ = {
        value: !0,
      };
      var __webpack_unused_export__,
        h,
        A = "3.0",
        S = "undefined" != typeof window ? window : {},
        __g = {
          x: function (tt, te) {
            for (var tr = [], ti = tt.length, ta = 0; 0 < ti; ti -= 16) {
              for (
                var tu = tt.slice(16 * ta, 16 * (ta + 1)),
                  tc = Array(16),
                  tf = 0;
                tf < 16;
                tf++
              )
                tc[tf] = tu[tf] ^ te[tf];
              (te = __g.r(tc)), (tr = tr.concat(te)), ta++;
            }
            return tr;
          },
          r: function (tt) {
            var te = Array(16),
              tr = Array(36);
            (tr[0] = B(tt, 0)),
              (tr[1] = B(tt, 4)),
              (tr[2] = B(tt, 8)),
              (tr[3] = B(tt, 12));
            for (var ti = 0; ti < 32; ti++) {
              var ta = G(tr[ti + 1] ^ tr[ti + 2] ^ tr[ti + 3] ^ h.zk[ti]);
              tr[ti + 4] = tr[ti] ^ ta;
            }
            return (
              i(tr[35], te, 0),
              i(tr[34], te, 4),
              i(tr[33], te, 8),
              i(tr[32], te, 12),
              te
            );
          },
        };
      (l.prototype.O = function (A, C, s) {
        for (
          var t, S, h, i, B, Q, G, D, w, g, a, e, E, T, r, V, U, M, O, c, I;
          this.T < this.w;

        )
          try {
            switch (this.T) {
              case 27:
                (this.C[this.c] = this.C[this.I] >> this.C[this.F]),
                  (this.M[12] = 35),
                  (this.T =
                    this.T * (this.C.length + (this.M[13] ? 3 : 9)) + 1);
                break;
              case 34:
                (this.C[this.c] = this.C[this.I] & this.C[this.F]),
                  (this.T = this.T * (this.M[15] - 6) + 12);
                break;
              case 41:
                (this.C[this.c] = this.C[this.I] <= this.C[this.F]),
                  (this.T = 8 * this.T + 27);
                break;
              case 48:
                (this.C[this.c] = !this.C[this.I]), (this.T = 7 * this.T + 16);
                break;
              case 50:
                (this.C[this.c] = this.C[this.I] | this.C[this.F]),
                  (this.T = 6 * this.T + 52);
                break;
              case 57:
                (this.C[this.c] = this.C[this.I] >>> this.C[this.F]),
                  (this.T = 7 * this.T - 47);
                break;
              case 64:
                (this.C[this.c] = this.C[this.I] << this.C[this.F]),
                  (this.T = 5 * this.T + 32);
                break;
              case 71:
                (this.C[this.c] = this.C[this.I] ^ this.C[this.F]),
                  (this.T = 6 * this.T - 74);
                break;
              case 78:
                (this.C[this.c] = this.C[this.I] & this.C[this.F]),
                  (this.T = 4 * this.T + 40);
                break;
              case 80:
                (this.C[this.c] = this.C[this.I] < this.C[this.F]),
                  (this.T = 5 * this.T - 48);
                break;
              case 87:
                (this.C[this.c] = -this.C[this.I]), (this.T = 3 * this.T + 91);
                break;
              case 94:
                (this.C[this.c] = this.C[this.I] > this.C[this.F]),
                  (this.T = 4 * this.T - 24);
                break;
              case 101:
                (this.C[this.c] = this.C[this.I] in this.C[this.F]),
                  (this.T = 3 * this.T + 49);
                break;
              case 108:
                (this.C[this.c] = o(this.C[this.I])),
                  (this.T = 2 * this.T + 136);
                break;
              case 110:
                (this.C[this.c] = this.C[this.I] !== this.C[this.F]),
                  (this.T += 242);
                break;
              case 117:
                (this.C[this.c] = this.C[this.I] && this.C[this.F]),
                  (this.T = 3 * this.T + 1);
                break;
              case 124:
                (this.C[this.c] = this.C[this.I] || this.C[this.F]),
                  (this.T += 228);
                break;
              case 131:
                (this.C[this.c] = this.C[this.I] >= this.C[this.F]),
                  (this.T = 3 * this.T - 41);
                break;
              case 138:
                (this.C[this.c] = this.C[this.I] == this.C[this.F]),
                  (this.T = 2 * this.T + 76);
                break;
              case 140:
                (this.C[this.c] = this.C[this.I] % this.C[this.F]),
                  (this.T += 212);
                break;
              case 147:
                (this.C[this.c] = this.C[this.I] / this.C[this.F]),
                  (this.T += 205);
                break;
              case 154:
                (this.C[this.c] = this.C[this.I] * this.C[this.F]),
                  (this.T += 198);
                break;
              case 161:
                (this.C[this.c] = this.C[this.I] - this.C[this.F]),
                  (this.T += 191);
                break;
              case 168:
                (this.C[this.c] = this.C[this.I] + this.C[this.F]),
                  (this.T = 2 * this.T + 16);
                break;
              case 254:
                (this.C[this.c] = eval(i)),
                  (this.T += 20 < this.M[11] ? 98 : 89);
                break;
              case 255:
                (this.s = C || 0),
                  (this.M[26] = 52),
                  (this.T += this.M[13] ? 8 : 6);
                break;
              case 258:
                g = {};
                for (var F = 0; F < this.k; F++)
                  (e = this.i.pop()), (a = this.i.pop()), (g[a] = e);
                (this.C[this.W] = g), (this.T += 94);
                break;
              case 261:
                (this.D = s || []),
                  (this.M[11] = 68),
                  (this.T += this.M[26] ? 3 : 5);
                break;
              case 264:
                (this.M[15] = 16), (this.T = "string" == typeof A ? 331 : 336);
                break;
              case 266:
                (this.C[this.I][i] = this.i.pop()), (this.T += 86);
                break;
              case 278:
                (this.C[this.c] = this.C[this.I][i]),
                  (this.T += this.M[22] ? 63 : 74);
                break;
              case 283:
                this.C[this.c] = eval(String.fromCharCode(this.C[this.I]));
                break;
              case 300:
                (S = this.U()), (this.M[0] = 66), (this.T += this.M[11]);
                break;
              case 331:
                (D = atob(A)),
                  (w =
                    (D.charCodeAt(0) << 16) |
                    (D.charCodeAt(1) << 8) |
                    D.charCodeAt(2));
                for (var k = 3; k < w + 3; k += 3)
                  this.G.push(
                    (D.charCodeAt(k) << 16) |
                      (D.charCodeAt(k + 1) << 8) |
                      D.charCodeAt(k + 2)
                  );
                for (V = w + 3; V < D.length; )
                  (E = (D.charCodeAt(V) << 8) | D.charCodeAt(V + 1)),
                    (T = D.slice(V + 2, V + 2 + E)),
                    this.D.push(T),
                    (V += E + 2);
                (this.M[21] = 8), (this.T += 1e3 < V ? 21 : 35);
                break;
              case 336:
                (this.G = A),
                  (this.D = s),
                  (this.M[18] = 134),
                  (this.T += this.M[15]);
                break;
              case 344:
                this.T = 3 * this.T - 8;
                break;
              case 350:
                (U = 66), (M = []), (I = this.D[this.k]);
                for (var W = 0; W < I.length; W++)
                  M.push(String.fromCharCode(24 ^ I.charCodeAt(W) ^ U)),
                    (U = 24 ^ I.charCodeAt(W) ^ U);
                (r = parseInt(M.join("").split("|")[1])),
                  (this.C[this.W] = this.i.slice(this.i.length - r)),
                  (this.i = this.i.slice(0, this.i.length - r)),
                  (this.T += 2);
                break;
              case 352:
                (this.e = this.G[this.s++]), (this.T -= this.M[26]);
                break;
              case 360:
                (this.a = S), (this.T += this.M[0]);
                break;
              case 368:
                this.T -= 500 < S - this.a ? 24 : 8;
                break;
              case 380:
                this.i.push(16383 & this.e), (this.T -= 28);
                break;
              case 400:
                this.i.push(this.S[16383 & this.e]), (this.T -= 48);
                break;
              case 408:
                this.T -= 64;
                break;
              case 413:
                (this.C[(this.e >> 15) & 7] =
                  ((this.e >> 18) & 1) == 0
                    ? 32767 & this.e
                    : this.S[32767 & this.e]),
                  (this.T -= 61);
                break;
              case 418:
                (this.S[65535 & this.e] = this.C[(this.e >> 16) & 7]),
                  (this.T -= this.e >> 16 < 20 ? 66 : 80);
                break;
              case 423:
                (this.c = (this.e >> 16) & 7),
                  (this.I = (this.e >> 13) & 7),
                  (this.F = (this.e >> 10) & 7),
                  (this.J = 1023 & this.e),
                  (this.T -= 255 + 6 * this.J + (this.J % 5));
                break;
              case 426:
                this.T += 5 * (this.e >> 19) - 18;
                break;
              case 428:
                (this.W = (this.e >> 16) & 7),
                  (this.k = 65535 & this.e),
                  this.t.push(this.s),
                  this.h.push(this.S),
                  (this.s = this.C[this.W]),
                  (this.S = []);
                for (var J = 0; J < this.k; J++) this.S.unshift(this.i.pop());
                this.B.push(this.i), (this.i = []), (this.T -= 76);
                break;
              case 433:
                (this.s = this.t.pop()),
                  (this.S = this.h.pop()),
                  (this.i = this.B.pop()),
                  (this.T -= 81);
                break;
              case 438:
                (this.Q = this.C[(this.e >> 16) & 7]), (this.T -= 86);
                break;
              case 440:
                (U = 66), (M = []), (I = this.D[16383 & this.e]);
                for (var b = 0; b < I.length; b++)
                  M.push(String.fromCharCode(24 ^ I.charCodeAt(b) ^ U)),
                    (U = 24 ^ I.charCodeAt(b) ^ U);
                (M = M.join("").split("|")),
                  (O = parseInt(M.shift())),
                  this.i.push(
                    0 === O
                      ? M.join("|")
                      : 1 === O
                      ? -1 !== M.join().indexOf(".")
                        ? parseInt(M.join())
                        : parseFloat(M.join())
                      : 2 === O
                      ? eval(M.join())
                      : 3 === O
                      ? null
                      : void 0
                  ),
                  (this.T -= 88);
                break;
              case 443:
                (this.b = (this.e >> 2) & 65535),
                  (this.J = 3 & this.e),
                  0 === this.J
                    ? (this.s = this.b)
                    : 1 === this.J
                    ? this.Q && (this.s = this.b)
                    : (2 === this.J && this.Q) || (this.s = this.b),
                  (this.g = null),
                  (this.T -= 91);
                break;
              case 445:
                this.i.push(this.C[(this.e >> 14) & 7]), (this.T -= 93);
                break;
              case 448:
                (this.W = (this.e >> 16) & 7),
                  (this.k = (this.e >> 2) & 4095),
                  (this.J = 3 & this.e),
                  (Q = 1 === this.J && this.i.pop()),
                  (G = this.i.slice(this.i.length - this.k, this.i.length)),
                  (this.i = this.i.slice(0, this.i.length - this.k)),
                  (c = 2 < G.length ? 3 : G.length),
                  (this.T += 6 * this.J + 1 + 10 * c);
                break;
              case 449:
                (this.C[3] = this.C[this.W]()), (this.T -= 97 - G.length);
                break;
              case 455:
                (this.C[3] = this.C[this.W][Q]()), (this.T -= 103 + G.length);
                break;
              case 453:
                (B = (this.e >> 17) & 3),
                  (this.T =
                    0 === B ? 445 : 1 === B ? 380 : 2 === B ? 400 : 440);
                break;
              case 458:
                (this.J = (this.e >> 17) & 3),
                  (this.c = (this.e >> 14) & 7),
                  (this.I = (this.e >> 11) & 7),
                  (i = this.i.pop()),
                  (this.T -= 12 * this.J + 180);
                break;
              case 459:
                (this.C[3] = this.C[this.W](G[0])),
                  (this.T -= 100 + 7 * G.length);
                break;
              case 461:
                (this.C[3] = new this.C[this.W]()), (this.T -= 109 - G.length);
                break;
              case 463:
                (U = 66), (M = []), (I = this.D[65535 & this.e]);
                for (var n = 0; n < I.length; n++)
                  M.push(String.fromCharCode(24 ^ I.charCodeAt(n) ^ U)),
                    (U = 24 ^ I.charCodeAt(n) ^ U);
                (M = M.join("").split("|")),
                  (O = parseInt(M.shift())),
                  (this.T += 10 * O + 3);
                break;
              case 465:
                (this.C[3] = this.C[this.W][Q](G[0])),
                  (this.T -= 13 * G.length + 100);
                break;
              case 466:
                (this.C[(this.e >> 16) & 7] = M.join("|")),
                  (this.T -= 114 * M.length);
                break;
              case 468:
                (this.g = 65535 & this.e), (this.T -= 116);
                break;
              case 469:
                (this.C[3] = this.C[this.W](G[0], G[1])),
                  (this.T -= 119 - G.length);
                break;
              case 471:
                (this.C[3] = new this.C[this.W](G[0])),
                  (this.T -= 118 + G.length);
                break;
              case 473:
                throw this.C[(this.e >> 16) & 7];
              case 475:
                (this.C[3] = this.C[this.W][Q](G[0], G[1])), (this.T -= 123);
                break;
              case 476:
                (this.C[(this.e >> 16) & 7] =
                  -1 !== M.join().indexOf(".")
                    ? parseInt(M.join())
                    : parseFloat(M.join())),
                  (this.T -= this.M[21] < 10 ? 124 : 126);
                break;
              case 478:
                (t = [0].concat(x(this.S))),
                  (this.V = 65535 & this.e),
                  (h = this),
                  (this.C[3] = function (tt) {
                    var te = new l();
                    return (
                      (te.S = t), (te.S[0] = tt), te.O(h.G, h.V, h.D), te.C[3]
                    );
                  }),
                  (this.T -= 50 < this.M[3] ? 120 : 126);
                break;
              case 479:
                (this.C[3] = this.C[this.W].apply(null, G)),
                  (this.M[3] = 168),
                  (this.T -= this.M[9] ? 127 : 128);
                break;
              case 481:
                (this.C[3] = new this.C[this.W](G[0], G[1])),
                  (this.T -= 10 * G.length + 109);
                break;
              case 483:
                (this.J = (this.e >> 15) & 15),
                  (this.W = (this.e >> 12) & 7),
                  (this.k = 4095 & this.e),
                  (this.T = 0 === this.J ? 258 : 350);
                break;
              case 485:
                (this.C[3] = this.C[this.W][Q].apply(null, G)),
                  (this.T -= this.M[15] % 2 == 1 ? 143 : 133);
                break;
              case 486:
                (this.C[(this.e >> 16) & 7] = eval(M.join())),
                  (this.T -= this.M[18]);
                break;
              case 491:
                (this.C[3] = new this.C[this.W].apply(null, G)),
                  (this.T -= this.M[8] / this.M[1] < 10 ? 139 : 130);
                break;
              case 496:
                (this.C[(this.e >> 16) & 7] = null),
                  (this.T -= 10 < this.M[5] - this.M[3] ? 160 : 144);
                break;
              case 506:
                (this.C[(this.e >> 16) & 7] = void 0),
                  (this.T -= this.M[18] % this.M[12] == 1 ? 154 : 145);
                break;
              default:
                this.T = this.w;
            }
          } catch (A) {
            this.g && (this.s = this.g), (this.T -= 114);
          }
      }),
        "undefined" != typeof window &&
          ((S.__ZH__ = S.__ZH__ || {}),
          (h = S.__ZH__.zse = S.__ZH__.zse || {}),
          new l().O(
            "ABt7CAAUSAAACADfSAAACAD1SAAACAAHSAAACAD4SAAACAACSAAACADCSAAACADRSAAACABXSAAACAAGSAAACADjSAAACAD9SAAACADwSAAACACASAAACADeSAAACABbSAAACADtSAAACAAJSAAACAB9SAAACACdSAAACADmSAAACABdSAAACAD8SAAACADNSAAACABaSAAACABPSAAACACQSAAACADHSAAACACfSAAACADFSAAACAC6SAAACACnSAAACAAnSAAACAAlSAAACACcSAAACADGSAAACAAmSAAACAAqSAAACAArSAAACACoSAAACADZSAAACACZSAAACAAPSAAACABnSAAACABQSAAACAC9SAAACABHSAAACAC/SAAACABhSAAACABUSAAACAD3SAAACABfSAAACAAkSAAACABFSAAACAAOSAAACAAjSAAACAAMSAAACACrSAAACAAcSAAACABySAAACACySAAACACUSAAACABWSAAACAC2SAAACAAgSAAACABTSAAACACeSAAACABtSAAACAAWSAAACAD/SAAACABeSAAACADuSAAACACXSAAACABVSAAACABNSAAACAB8SAAACAD+SAAACAASSAAACAAESAAACAAaSAAACAB7SAAACACwSAAACADoSAAACADBSAAACACDSAAACACsSAAACACPSAAACACOSAAACACWSAAACAAeSAAACAAKSAAACACSSAAACACiSAAACAA+SAAACADgSAAACADaSAAACADESAAACADlSAAACAABSAAACADASAAACADVSAAACAAbSAAACABuSAAACAA4SAAACADnSAAACAC0SAAACACKSAAACABrSAAACADySAAACAC7SAAACAA2SAAACAB4SAAACAATSAAACAAsSAAACAB1SAAACADkSAAACADXSAAACADLSAAACAA1SAAACADvSAAACAD7SAAACAB/SAAACABRSAAACAALSAAACACFSAAACABgSAAACADMSAAACACESAAACAApSAAACABzSAAACABJSAAACAA3SAAACAD5SAAACACTSAAACABmSAAACAAwSAAACAB6SAAACACRSAAACABqSAAACAB2SAAACABKSAAACAC+SAAACAAdSAAACAAQSAAACACuSAAACAAFSAAACACxSAAACACBSAAACAA/SAAACABxSAAACABjSAAACAAfSAAACAChSAAACABMSAAACAD2SAAACAAiSAAACADTSAAACAANSAAACAA8SAAACABESAAACADPSAAACACgSAAACABBSAAACABvSAAACABSSAAACAClSAAACABDSAAACACpSAAACADhSAAACAA5SAAACABwSAAACAD0SAAACACbSAAACAAzSAAACADsSAAACADISAAACADpSAAACAA6SAAACAA9SAAACAAvSAAACABkSAAACACJSAAACAC5SAAACABASAAACAARSAAACABGSAAACADqSAAACACjSAAACADbSAAACABsSAAACACqSAAACACmSAAACAA7SAAACACVSAAACAA0SAAACABpSAAACAAYSAAACADUSAAACABOSAAACACtSAAACAAtSAAACAAASAAACAB0SAAACADiSAAACAB3SAAACACISAAACADOSAAACACHSAAACACvSAAACADDSAAACAAZSAAACABcSAAACAB5SAAACADQSAAACAB+SAAACACLSAAACAADSAAACABLSAAACACNSAAACAAVSAAACACCSAAACABiSAAACADxSAAACAAoSAAACACaSAAACABCSAAACAC4SAAACAAxSAAACAC1SAAACAAuSAAACADzSAAACABYSAAACABlSAAACAC3SAAACAAISAAACAAXSAAACABISAAACAC8SAAACABoSAAACACzSAAACADSSAAACACGSAAACAD6SAAACADJSAAACACkSAAACABZSAAACADYSAAACADKSAAACADcSAAACAAySAAACADdSAAACACYSAAACACMSAAACAAhSAAACADrSAAACADWSAAAeIAAEAAACAB4SAAACAAySAAACABiSAAACABlSAAACABjSAAACABiSAAACAB3SAAACABkSAAACABnSAAACABrSAAACABjSAAACAB3SAAACABhSAAACABjSAAACABuSAAACABvSAAAeIABEAABCABkSAAACAAzSAAACABkSAAACAAySAAACABlSAAACAA3SAAACAAySAAACAA2SAAACABmSAAACAA1SAAACAAwSAAACABkSAAACAA0SAAACAAxSAAACAAwSAAACAAxSAAAeIABEAACCAAgSAAATgACVAAAQAAGEwADDAADSAAADAACSAAADAAASAAACANcIAADDAADSAAASAAATgADVAAATgAEUAAATgAFUAAATgAGUgAADAAASAAASAAATgADVAAATgAEUAAATgAFUAAATgAHUgAADAABSAAASAAATgADVAAATgAEUAAATgAFUAAATgAIUgAAcAgUSMAATgAJVAAATgAKUgAAAAAADAABSAAADAAAUAAACID/GwQPCAAYG2AREwAGDAABCIABGwQASMAADAAAUAAACID/GwQPCAAQG2AREwAHDAABCIACGwQASMAADAAAUAAACID/GwQPCAAIG2AREwAIDAABCIADGwQASMAADAAAUAAACID/GwQPEwAJDYAGDAAHG2ATDAAIG2ATDAAJG2ATKAAACAD/DIAACQAYGygSGwwPSMAASMAADAACSAAADAABUgAACAD/DIAACQAQGygSGwwPSMAASMAADAACCIABGwQASMAADAABUgAACAD/DIAACQAIGygSGwwPSMAASMAADAACCIACGwQASMAADAABUgAACAD/DIAAGwQPSMAASMAADAACCIADGwQASMAADAABUgAAKAAACAAgDIABGwQBEwANDAAAWQALGwQPDAABG2AREwAODAAODIAADQANGygSGwwTEwAPDYAPKAAACAAESAAATgACVAAAQAAGEwAQCAAESAAATgACVAAAQAAGEwAFDAAASAAADAAQSAAACAAASAAACAKsIAADCAAASAAADAAQUAAACID/GwQPSMAADAABUAAASAAASAAACAAASAAADAAFUgAACAABSAAADAAQUAAACID/GwQPSMAADAABUAAASAAASAAACAABSAAADAAFUgAACAACSAAADAAQUAAACID/GwQPSMAADAABUAAASAAASAAACAACSAAADAAFUgAACAADSAAADAAQUAAACID/GwQPSMAADAABUAAASAAASAAACAADSAAADAAFUgAADAAFSAAACAAASAAACAJ8IAACEwARDAARSAAACAANSAAACALdIAACEwASDAARSAAACAAXSAAACALdIAACEwATDAARDIASGwQQDAATG2AQEwAUDYAUKAAAWAAMSAAAWAANSAAAWAAOSAAAWAAPSAAAWAAQSAAAWAARSAAAWAASSAAAWAATSAAAWAAUSAAAWAAVSAAAWAAWSAAAWAAXSAAAWAAYSAAAWAAZSAAAWAAaSAAAWAAbSAAAWAAcSAAAWAAdSAAAWAAeSAAAWAAfSAAAWAAgSAAAWAAhSAAAWAAiSAAAWAAjSAAAWAAkSAAAWAAlSAAAWAAmSAAAWAAnSAAAWAAoSAAAWAApSAAAWAAqSAAAWAArSAAAeIAsEAAXWAAtSAAAWAAuSAAAWAAvSAAAWAAwSAAAeIAxEAAYCAAESAAATgACVAAAQAAGEwAZCAAkSAAATgACVAAAQAAGEwAaDAABSAAACAAASAAACAJ8IAACSMAASMAACAAASAAADAAZUgAADAABSAAACAAESAAACAJ8IAACSMAASMAACAABSAAADAAZUgAADAABSAAACAAISAAACAJ8IAACSMAASMAACAACSAAADAAZUgAADAABSAAACAAMSAAACAJ8IAACSMAASMAACAADSAAADAAZUgAACAAASAAADAAZUAAACIAASEAADIAYUEgAGwQQSMAASMAACAAASAAADAAaUgAACAABSAAADAAZUAAACIABSEAADIAYUEgAGwQQSMAASMAACAABSAAADAAaUgAACAACSAAADAAZUAAACIACSEAADIAYUEgAGwQQSMAASMAACAACSAAADAAaUgAACAADSAAADAAZUAAACIADSEAADIAYUEgAGwQQSMAASMAACAADSAAADAAaUgAACAAAEAAJDAAJCIAgGwQOMwAGOBG2DAAJCIABGwQASMAADAAaUAAAEAAbDAAJCIACGwQASMAADAAaUAAAEAAcDAAJCIADGwQASMAADAAaUAAAEAAdDAAbDIAcGwQQDAAdG2AQDAAJSAAADAAXUAAAG2AQEwAeDAAeSAAADAACSAAACALvIAACEwAfDAAJSAAADAAaUAAADIAfGwQQSMAASMAADAAJCIAEGwQASMAADAAaUgAADAAJCIAEGwQASMAADAAaUAAASAAASAAADAAJSAAADAAAUgAADAAJCIABGQQAEQAJOBCIKAAADAABTgAyUAAACIAQGwQEEwAVCAAQDIAVGwQBEwAKCAAAEAAhDAAhDIAKGwQOMwAGOBImDAAKSAAADAABTgAzQAAFDAAhCIABGQQAEQAhOBHoCAAASAAACAAQSAAADAABTgA0QAAJEwAiCAAQSAAATgACVAAAQAAGEwAjCAAAEAALDAALCIAQGwQOMwAGOBLSDAALSAAADAAiUAAADIALSEAADIAAUEgAGwQQCAAqG2AQSMAASMAADAALSAAADAAjUgAADAALCIABGQQAEQALOBJkDAAjSAAATgAJVAAATgA1QAAFEwAkDAAkTgA0QAABEwAlCAAQSAAADAABTgAyUAAASAAADAABTgA0QAAJEwAmDAAmSAAADAAkSAAATgAJVAAATgA2QAAJEwAnDAAnSAAADAAlTgA3QAAFSMAAEwAlDYAlKAAAeIA4EAApDAAATgAyUAAAEAAqCAAAEAAMDAAMDIAqGwQOMwAGOBPqDAAMSAAADAAATgA5QAAFEwArDAArCID/GwQPSMAADAApTgAzQAAFDAAMCIABGQQAEQAMOBOMDYApKAAAEwAsTgADVAAAGAAKWQA6GwQFMwAGOBQeCAABSAAAEAAsOCBJTgA7VAAAGAAKWQA6GwQFMwAGOBRKCAACSAAAEAAsOCBJTgA8VAAAGAAKWQA6GwQFMwAGOBR2CAADSAAAEAAsOCBJTgA9VAAAGAAKWQA6GwQFMwAGOBSiCAAESAAAEAAsOCBJTgA+VAAAGAAKWQA6GwQFMwAGOBTOCAAFSAAAEAAsOCBJTgA/VAAAGAAKWQA6GwQFMwAGOBT6CAAGSAAAEAAsOCBJTgA8VAAATgBAUAAAGAAKWQA6GwQFMwAGOBUuCAAHSAAAEAAsOCBJTgADVAAATgBBUAAAWQBCGwQFMwAGOBVeCAAISAAAEAAsOCBJWABDSAAATgA7VAAATgBEQAABTgBFQwAFCAABGAANG2AFMwAGOBWiCAAKSAAAEAAsOCBJWABGSAAATgA8VAAATgBEQAABTgBFQwAFCAABGAANG2AFMwAGOBXmCAALSAAAEAAsOCBJWABHSAAATgA9VAAATgBEQAABTgBFQwAFCAABGAANG2AFMwAGOBYqCAAMSAAAEAAsOCBJWABISAAATgA+VAAATgBEQAABTgBFQwAFCAABGAANG2AFMwAGOBZuCAANSAAAEAAsOCBJWABJSAAATgA/VAAATgBEQAABTgBFQwAFCAABGAANG2AFMwAGOBayCAAOSAAAEAAsOCBJWABKSAAATgA8VAAATgBAUAAATgBLQAABTgBFQwAFCAABGAANG2AJMwAGOBb+CAAPSAAAEAAsOCBJTgBMVAAATgBNUAAAEAAtWABOSAAADAAtTgBEQAABTgBFQwAFCAABGAANG2AFMwAGOBdSCAAQSAAAEAAsOCBJTgA7VAAATgBPUAAAGAAKWQA6GwQFMwAGOBeGCAARSAAAEAAsOCBJWABQSAAAWABRSAAAWABSSAAATgA7VAAATgBPQAAFTgBTQwAFTgBEQwABTgBFQwAFCAABGAANG2AFMwAGOBfqCAAWSAAAEAAsOCBJTgADVAAATgBUUAAAGAAKWQA6GwQJMwAGOBgeCAAYSAAAEAAsOCBJTgADVAAATgBVUAAAGAAKWQA6GwQJMwAGOBhSCAAZSAAAEAAsOCBJTgADVAAATgBWUAAAGAAKWQA6GwQJMwAGOBiGCAAaSAAAEAAsOCBJTgADVAAATgBXUAAAGAAKWQA6GwQJMwAGOBi6CAAbSAAAEAAsOCBJTgADVAAATgBYUAAAGAAKWQA6GwQJMwAGOBjuCAAcSAAAEAAsOCBJTgADVAAATgBZUAAAGAAKWQA6GwQJMwAGOBkiCAAdSAAAEAAsOCBJTgADVAAATgBaUAAAGAAKWQA6GwQJMwAGOBlWCAAeSAAAEAAsOCBJTgADVAAATgBbUAAAGAAKWQA6GwQJMwAGOBmKCAAfSAAAEAAsOCBJTgADVAAATgBcUAAAGAAKWQA6GwQJMwAGOBm+CAAgSAAAEAAsOCBJTgADVAAATgBdUAAAGAAKWQA6GwQJMwAGOBnyCAAhSAAAEAAsOCBJTgADVAAATgBeUAAAGAAKWQA6GwQJMwAGOBomCAAiSAAAEAAsOCBJTgADVAAATgBfUAAAGAAKWQA6GwQJMwAGOBpaCAAjSAAAEAAsOCBJTgADVAAATgBgUAAAGAAKWQA6GwQJMwAGOBqOCAAkSAAAEAAsOCBJTgA7VAAATgBhUAAAGAAKWQA6GwQJMwAGOBrCCAAlSAAAEAAsOCBJTgA8VAAATgBiUAAAWQBjGwQFMwAGOBryCAAmSAAAEAAsOCBJTgA7VAAATgBkUAAAGAAKWQA6GwQJMwAGOBsmCAAnSAAAEAAsOCBJTgADVAAATgBlUAAAGAAKWQA6GwQJMwAGOBtaCAAoSAAAEAAsOCBJTgADVAAATgBmUAAAGAAKWQA6GwQJMwAGOBuOCAApSAAAEAAsOCBJTgADVAAATgBnUAAAGAAKWQA6GwQJMwAGOBvCCAAqSAAAEAAsOCBJTgBoVAAASAAATgBMVAAATgBpQAAFG2AKWABqG2AJMwAGOBwCCAArSAAAEAAsOCBJTgA7VAAATgBrUAAAGAAKWQA6GwQFMwAGOBw2CAAsSAAAEAAsOCBJTgA7VAAATgBrUAAASAAATgBMVAAATgBpQAAFG2AKWABqG2AJMwAGOBx+CAAtSAAAEAAsOCBJTgA7VAAATgBsUAAAGAAKWQA6GwQFMwAGOByyCAAuSAAAEAAsOCBJWABtSAAATgADVAAATgBuUAAATgBvUAAATgBEQAABTgBFQwAFCAABGAANG2AFMwAGOB0GCAAwSAAAEAAsOCBJTgADVAAATgBwUAAAGAAKWQA6GwQJMwAGOB06CAAxSAAAEAAsOCBJWABxSAAATgByVAAAQAACTgBzUNgATgBFQwAFCAABGAANG2AJMwAGOB2CCAAySAAAEAAsOCBJWAB0SAAATgByVAAAQAACTgBzUNgATgBFQwAFCAABGAANG2AJMwAGOB3KCAAzSAAAEAAsOCBJWAB1SAAATgA8VAAATgBAUAAATgBLQAABTgBFQwAFCAABGAANG2AJMwAGOB4WCAA0SAAAEAAsOCBJWAB2SAAATgA8VAAATgBAUAAATgBLQAABTgBFQwAFCAABGAANG2AJMwAGOB5iCAA1SAAAEAAsOCBJWABxSAAATgA9VAAATgB3UAAATgBFQAAFCAABGAANG2AJMwAGOB6mCAA2SAAAEAAsOCBJTgADVAAATgB4UAAAMAAGOB7OCAA4SAAAEAAsOCBJTgADVAAATgB5UAAAGAAKWQA6GwQJMwAGOB8CCAA5SAAAEAAsOCBJTgADVAAATgB6UAAAGAAKWQA6GwQJMwAGOB82CAA6SAAAEAAsOCBJTgADVAAATgB7UAAAGAAKWQA6GwQJMwAGOB9qCAA7SAAAEAAsOCBJTgADVAAATgB8UAAAGAAKWQA6GwQJMwAGOB+eCAA8SAAAEAAsOCBJTgADVAAATgB9UAAAGAAKWQA6GwQJMwAGOB/SCAA9SAAAEAAsOCBJTgADVAAATgB+UAAAGAAKWQA6GwQJMwAGOCAGCAA+SAAAEAAsOCBJTgADVAAATgB/UAAAGAAKWQA6GwQJMwAGOCA6CAA/SAAAEAAsOCBJCAAASAAAEAAsDYAsKAAATgCAVAAATgCBQAABEwAvCAAwSAAACAA1SAAACAA5SAAACAAwSAAACAA1SAAACAAzSAAACABmSAAACAA3SAAACABkSAAACAAxSAAACAA1SAAACABlSAAACAAwSAAACAAxSAAACABkSAAACAA3SAAAeIABEAAwCAT8IAAAEwAxDAAASAAACATbIAABEwAyTgCAVAAATgCBQAABDAAvG2ABEwAzDAAzWQCCGwQMMwAGOCFKCAB+SAAAEAAxOCFNTgCDVAAATgCEQAABCAB/G2ACSMAATgCDVAAATgCFQAAFEwA0DAAxSAAADAAyTgCGQAAFDAA0SAAADAAyTgCGQAAFDAAwSAAADAAySAAACARuIAACEwA1DAA1TgAyUAAACIADGwQEEwA2DAA2CIABGwQFMwAGOCIWWACHSAAADAA1TgAzQAAFWACHSAAADAA1TgAzQAAFOCIZDAA2CIACGwQFMwAGOCJCWACHSAAADAA1TgAzQAAFOCJFWACIWQCJGwQAWACKG2AAWACLG2AAWACMG2AAEwA3CAAAEAA4WACNEAA5DAA1TgAyUAAACIABGwQBEwANDAANCIAAGwQGMwAGOCSeCAAIDIA4CQABGigAEgA4CQAEGygEGwwCEwA6DAANSAAADAA1UAAACIA6DQA6GygSCID/G2QPGwwQEwA7CAAIDIA4CQABGigAEgA4CQAEGygEGwwCSMAAEwA6DAA7DIANCQABGygBSMAADIA1UEgACQA6DYA6G0wSCQD/G2gPGywQCIAIG2QRGQwTEQA7CAAIDIA4CQABGigAEgA4CQAEGygEGwwCSMAAEwA6DAA7DIANCQACGygBSMAADIA1UEgACQA6DYA6G0wSCQD/G2gPGywQCIAQG2QRGQwTEQA7DAA5DIA7CQA/GygPSMAADIA3TgCOQQAFGQwAEQA5DAA5DIA7CQAGGygSCIA/G2QPSMAADIA3TgCOQQAFGQwAEQA5DAA5DIA7CQAMGygSCIA/G2QPSMAADIA3TgCOQQAFGQwAEQA5DAA5DIA7CQASGygSCIA/G2QPSMAADIA3TgCOQQAFGQwAEQA5DAANCIADGQQBEQANOCKUDYA5KAAAAAVrVVYfGwAEa1VVHwAHalQlKxgLAAAIalQTBh8SEwAACGpUOxgdCg8YAAVqVB4RDgAEalQeCQAEalQeAAAEalQeDwAFalQ7GCAACmpUOyITFQkTERwADGtVUB4TFRUXGR0TFAAIa1VQGhwZHhoAC2tVUBsdGh4YGB4RAAtrVV0VHx0ZHxAWHwAMa1VVHR0cHx0aHBgaAAxrVVURGBYWFxYSHRsADGtVVhkeFRQUEx0fHgAMa1VWEhMbGBAXFxYXAAxrVVcYGxkfFxMbGxsADGtVVxwYHBkTFx0cHAAMa1VQHhgSEB0aGR8eAAtrVVAcHBoXFRkaHAALa1VcFxkcExkYEh8ADGtVVRofGxYRGxsfGAAMa1VVEREQFB0fHBkTAAxrVVYYExAYGBgcFREADGtVVh0ZHB0eHBUTGAAMa1VXGRkfHxkaGBAVAAxrVVccHx0UEx4fGBwADGtVUB0eGBsaHB0WFgALa1VXGBwcGRgfHhwAC2tVXBAQGRMcGRcZAAxrVVUbEhAdHhoZHB0ADGtVVR4aHxsaHh8TEgAMa1VWGBgZHBwSFBkZAAxrVVYcFxQeHx8cFhYADGtVVxofGBcVFBAcFQAMa1VXHR0TFRgfGRsZAAxrVVAdGBkYEREfGR8AC2tVVhwXGBQdHR0ZAAtrVVMbHRwYGRsaHgAMa1VVGxsaGhwUERgdAAxrVVUfFhQbGR0ZHxoABGtVVxkADGtVVh0bGh0YGBMZFQAMa1VVHRkeEhgVFBMZAAxrVVUeHB0cEhIfHBAADGtVVhMYEh0XEh8cHAADa1VQAAhqVAgRExELBAAGalQUHR4DAAdqVBcHHRIeAANqVBYAA2pUHAAIalQHFBkVGg0AA2tVVAAMalQHExELKTQTGTwtAAtqVBEDEhkbFx8TGQAKalQAExQOABATAgALalQKFw8HFh4NAwUACmpUCBsUGg0FHhkACWpUDBkCHwMFEwAIalQXCAkPGBMAC2pUER4ODys+GhMCAAZqVAoXFBAACGpUChkTGRcBAA5qVCwEARkQMxQOABATAgAKalQQAyQ/HgMfEQAJalQNHxIZBS8xAAtqVCo3DwcWHg0DBQAGalQMBBgcAAlqVCw5Ah8DBRMACGpUNygJDxgTAApqVAwVHB0QEQ4YAA1qVBADOzsACg8pOgoOAAhqVCs1EBceDwAaalQDGgkjIAEmOgUHDQ8eFSU5DggJAwEcAwUADWpUChcNBQcLXVsUExkAD2pUBwkPHA0JODEREBATAgAIalQnOhcADwoABGpUVk4ACGpUBxoXAA8KAAxqVAMaCS80GQIJBRQACGpUBg8LGBsPAAZqVAEQHAUADWpUBxoVGCQgERcCAxoADWpUOxg3ABEXAgMaFAoACmpUOzcAERcCAxoACWpUMyofKikeGgANalQCBgQOAwcLDzUuFQAWalQ7GCEGBA4DBwsPNTIDAR0LCRgNGQAPalQAExo0LBkDGhQNBR4ZAAZqVBEPFQMADWpUJzoKGw0PLy8YBQUACGpUBxoKGw0PAA5qVBQJDQ8TIi8MHAQDDwAealRAXx8fJCYKDxYUEhUKHhkDBw4WBg0hDjkWHRIrAAtqVBMKHx4OAwcLDwAGaFYQHh8IABdqVDsYMAofHg4DBwsPNTQICQMBHDMhEAARalQ7NQ8OBAIfCR4xOxYdGQ8AEWpUOzQODhgCHhk+OQIfAwUTAAhqVAMTGxUbFQAHalQFFREPHgAQalQDGgk8OgUDAwMVEQ0yMQAKalQCCwMVDwUeGQAQalQDGgkpMREQEBMCLiMoNQAYalQDGgkpMREQEBMCHykjIjcVChglNxQQAA9qVD8tFw0FBwtdWxQTGSAAC2pUOxg3GgUDAygYAA1qVAcUGQUfHh8ODwMFAA1qVDsYKR8WFwQBFAsPAAtqVAgbFBoVHB8EHwAHalQhLxgFBQAHalQXHw0aEAALalQUHR0YDQkJGA8AC2pUFAARFwIDGh8BAApqVAERER4PHgUZAAZqVAwCDxsAB2pUFxsJDgEAGGpUOxQuERETHwQAKg4VGQIVLx4UBQ4ZDwALalQ7NA4RERMfBAAAFmpUOxgwCh8eDgMHCw81IgsPFQEMDQkAFWpUOxg0DhEREx8EACoiCw8VAQwNCQAdalQ7GDAKHx4OAwcLDzU0CAkDARwzIQsDFQ8FHhkAFWpUOxghBgQOAwcLDzUiCw8VAQwNCQAUalQ7GCMOAwcLDzUyAwEdCwkYDRkABmpUID0NCQAFalQKGQAAB2tVVRkYGBgABmpUKTQNBAAIalQWCxcSExoAB2pUAhIbGAUACWpUEQMFAxkXCgADalRkAAdqVFJIDiQGAAtqVBUjHW9telRIQQAJalQKLzkmNSYbABdqVCdvdgsWbht5IjltEFteRS0EPQM1DQAZalQwPx4aWH4sCQ4xNxMnMSA1X1s+b1MNOgACalQACGpUBxMRCyst"
          ));
      var D = function (tt) {
        return __g._encrypt(encodeURIComponent(tt));
      };
      (exports.XL = A), (exports.ZP = D);
    },
    74185: function (tt, te) {
      "use strict";
      function tr(tt) {
        return tt && "undefined" != typeof Symbol && tt.constructor === Symbol
          ? "symbol"
          : typeof tt;
      }
      te._ = tr;
    },
  },
]);

!(function () {
  "use strict";
  var e,
    a,
    c,
    d,
    f,
    b,
    t,
    r,
    o,
    n,
    i,
    s,
    l,
    u = {},
    m = {};
  function p(e) {
    var a = m[e];
    if (void 0 !== a) return a.exports;
    var c = (m[e] = {
      id: e,
      loaded: !1,
      exports: {},
    });
    // console.log("模块名称:", e);
    return u[e].call(c.exports, c, c.exports, p), (c.loaded = !0), c.exports;
  }
  (p.m = u),
    (p.c = m),
    (p.amdD = function () {
      throw Error("define cannot be used indirect");
    }),
    (p.amdO = {}),
    (e = []),
    (p.O = function (a, c, d, f) {
      if (c) {
        f = f || 0;
        for (var b = e.length; b > 0 && e[b - 1][2] > f; b--) e[b] = e[b - 1];
        e[b] = [c, d, f];
        return;
      }
      for (var t = 1 / 0, b = 0; b < e.length; b++) {
        for (
          var c = e[b][0], d = e[b][1], f = e[b][2], r = !0, o = 0;
          o < c.length;
          o++
        )
          t >= f &&
          Object.keys(p.O).every(function (e) {
            return p.O[e](c[o]);
          })
            ? c.splice(o--, 1)
            : ((r = !1), f < t && (t = f));
        if (r) {
          e.splice(b--, 1);
          var n = d();
          void 0 !== n && (a = n);
        }
      }
      return a;
    }),
    (p.n = function (e) {
      var a =
        e && e.__esModule
          ? function () {
              return e.default;
            }
          : function () {
              return e;
            };
      return (
        p.d(a, {
          a: a,
        }),
        a
      );
    }),
    (c = Object.getPrototypeOf
      ? function (e) {
          return Object.getPrototypeOf(e);
        }
      : function (e) {
          return e.__proto__;
        }),
    (p.t = function (e, d) {
      if (
        (1 & d && (e = this(e)),
        8 & d ||
          ("object" == typeof e &&
            e &&
            ((4 & d && e.__esModule) ||
              (16 & d && "function" == typeof e.then))))
      )
        return e;
      var f = Object.create(null);
      p.r(f);
      var b = {};
      a = a || [null, c({}), c([]), c(c)];
      for (var t = 2 & d && e; "object" == typeof t && !~a.indexOf(t); t = c(t))
        Object.getOwnPropertyNames(t).forEach(function (a) {
          b[a] = function () {
            return e[a];
          };
        });
      return (
        (b.default = function () {
          return e;
        }),
        p.d(f, b),
        f
      );
    }),
    (p.d = function (e, a) {
      for (var c in a)
        p.o(a, c) &&
          !p.o(e, c) &&
          Object.defineProperty(e, c, {
            enumerable: !0,
            get: a[c],
          });
    }),
    (p.f = {}),
    (p.e = function (e) {
      return Promise.all(
        Object.keys(p.f).reduce(function (a, c) {
          return p.f[c](e, a), a;
        }, [])
      );
    }),
    (p.u = function (e) {
      return (
        "chunks/" +
        ({
          101: "main-search-routes",
          213: "comments-v3",
          222: "flv.js",
          358: "navbar-notifications",
          430: "GoodsRecommendGoodsCardList",
          450: "gaokao-pray-kanshan-animation-data",
          615: "EmptyViewNormalNoWorksDark",
          620: "lib-2ec050f6",
          876: "report_modals",
          987: "comment-richtext",
          1044: "EmptyViewCompactNoContentDark",
          1128: "Chart",
          1141: "shared-f3e5818d0efff511fc66c5adbc15845c309eb3d6",
          1243: "zswsdid",
          1306: "main-messages-routes",
          1350: "lib-60286b7b",
          1353: "main-roundtable-routes",
          1416: "EmptyViewCompactNoNetworkDark",
          1482: "shared-100a8fca553734d2d5baf90fe24ce2f9792101d5",
          1505: "shared-6aa7d30835ccd3a732f767b141d36d601d8567d7",
          1520: "player-vendors",
          1632: "main-signin-routes",
          1728: "shared-de5d92e14fd28ac8dfbe43558f7e08bebf65a816",
          1787: "shared-72770a11282a3bd1d70cde8cf34a0602e77916cb",
          1801: "EmptyViewNormalLoadingError",
          1923: "lib-55571d13",
          1951: "VideoUploadCoverEditor",
          1996: "shared-aca7fe113a92bc2edfa05ca636ab11cb2fde051e",
          2033: "Labels",
          2096: "EmptyViewCompactNoBalance",
          2121: "main-notifications-routes",
          2156: "EditableV2",
          2327: "shared-6efb5af3bf72fdef70a9e917024648a615dca6d4",
          2330: "lib-6efc30be",
          2411: "math-editor",
          2492: "main-special-routes",
          2520: "main-question-routes",
          2607: "lib-5c8e84aa",
          2714: "shared-a7a63334df534431111e0a90bb8e32b9bf2f8150",
          2744: "lib-4ad82c5e",
          2749: "statsc-deflateAsync",
          2850: "lib-29107295",
          3026: "FeeConsultCard",
          3084: "gaokao-pray-cheer-animation-data",
          3097: "EmptyViewCompactNoContent",
          3199: "writePinV2RichInput",
          3232: "EmptyViewNormalNoCollectionDark",
          3366: "shared-5b230ed9b9803e99eee2669920bc036872d009c2",
          3550: "lib-330004dc",
          3562: "EmptyViewCompactContentErrorDark",
          3584: "VideoAnswerLabel",
          3634: "main-creator-routes",
          3764: "EmptyViewCompactNoWorks",
          3775: "react-id-swiper",
          3786: "navbar-messages",
          3795: "shared-a3708c7e8c84cce0a3b8da43db0c3cd735be2320",
          4055: "KnowledgeForm",
          4065: "shared-e27920846d52202014b3335443e87cf8503d6d5c",
          4078: "shared-f30f848cc80ef396b250ffda8b659ed6952c0c38",
          4117: "lib-0de40faf",
          4167: "VideoController",
          4173: "EmptyViewNormalDefault",
          4202: "EmptyViewNormalNoBalanceDark",
          4260: "lib-fae4f1f9",
          4349: "EmptyViewNormalNoContentDark",
          4361: "main-topic-routes",
          4405: "shared-3498fd48bcc81644300f707c22c1c5e1c9243588",
          4408: "mqtt",
          4418: "theater-player",
          4434: "shared-e1f8cb0d3a17bb12f3d8741d66bd0a0617ccee1a",
          4629: "shared-45a0a7a61d2c356ba8c11e315f1596cb5c837f71",
          4646: "shared-edcc2218c16ac1a9d77d727ad376dd4ed88a4cc3",
          4691: "collection-Scroller",
          4707: "shared-62675887fbafc3655eb6e1058e75f0ca751e8e7f",
          4708: "EmptyViewCompactNoNetwork",
          4713: "main-knowledge-plan-routes",
          4717: "editPinV2RichInput",
          4769: "EmptyViewNormalNoContent",
          4799: "shared-ed6c11be185e1990a9f8222d2e6b70ea8a058e96",
          4813: "shared-c28a9bf3464dd32af4306520d44ac7bcef62e866",
          4814: "EmptyViewCompactNoWorksDark",
          4837: "EmptyViewCompactLoadingError",
          5052: "EditorHelpDocMoveableWrapper",
          5100: "EmptyViewNormalContentErrorDark",
          5117: "main-email-register-routes",
          5146: "lib-134f2ad3",
          5221: "EmptyViewCompactNoCollection",
          5286: "AdmissionsLineChart",
          5290: "main-collections-routes",
          5315: "shared-ffa4183048856409cbbcd8973a5e443d85b1ab57",
          5316: "main-host-routes",
          5326: "shared-17d241cf93732505fbf4ae955c418f7acda389c0",
          5327: "EmptyViewNormalNoNetwork",
          5344: "lib-026acc69",
          5373: "EmptyViewNormalNoNetworkDark",
          5389: "react-draggable-tags",
          5423: "lib-223e7b1c",
          5515: "shared-76e85b62f908064c5d69f1aa6079ebd41c9f3be6",
          5518: "lib-a4c92b5b",
          5546: "lib-4b14521a",
          5560: "richinput",
          5593: "lib-ec74204f",
          5634: "WriteShieldModalComp",
          5640: "globalOrgReport",
          5667: "main-settings-routes",
          5757: "shared-a43f911c38cce19408a6a463776a8d3525aa2e52",
          5857: "main-org-routes",
          5886: "shared-0aa26fe30807a3c13282055eac02f87165db0242",
          5898: "main-topstory-routes",
          6018: "lib-ea88be26",
          6034: "EmptyViewNormalNoBalance",
          6131: "creation-manage-action-list",
          6186: "shared-295135e8c88ceb7996dada75fdffe2d75463933b",
          6246: "VideoCoverEditorNew",
          6248: "lib-cf230269",
          6272: "lib-83b0f42f",
          6334: "shared-2687ffc24d2d5d3ba0bd94c4ae2db838e3216e5f",
          6414: "main-collection-routes",
          6439: "shared-2bb8cded3c25664082ac667719dc92fc1a7009e1",
          6478: "main-campaign-routes",
          6559: "ECharts",
          6567: "lib-0bf4e2b2",
          6649: "lib-74f62c79",
          6668: "main-mcn-routes",
          6670: "lib-9b20c40c",
          6754: "lib-75fc9c18",
          6763: "ScoreLineChart",
          6815: "PcCommentFollowPlugin",
          6869: "main-explore-routes",
          6908: "shared-fcbd992c3f9ed92fc4e1be47893131ed095ad41d",
          6972: "EmptyViewCompactContentError",
          7050: "lib-38cf5c11",
          7190: "InlineVideo",
          7223: "EmptyViewCompactNoCollectionDark",
          7473: "shared-48c241e45c2c8f8299ac51b2226847ca60ef5cf6",
          7556: "EmptyViewNormalNoWorks",
          7590: "EmptyViewCompactDefault",
          7629: "EmptyViewNormalContentError",
          7749: "lib-f3572862",
          7848: "EcommerceAdCard",
          7856: "comment-manage-footer",
          7926: "EmptyViewCompactDefaultDark",
          7936: "richinputV2",
          7970: "biz-co-creation",
          8084: "EmptyViewNormalNoCollection",
          8089: "shared-2f02f8a08f7b763946110f65e90e828646e7116d",
          8128: "main-ai-routes",
          8214: "main-help-center-routes",
          8368: "shared-1dffcf43329e08de9bcf385e1895bae6667163e6",
          8377: "main-ring-routes",
          8400: "ECommerceAd",
          8438: "EmptyViewCompactLoadingErrorDark",
          8530: "lib-7a7085c7",
          8816: "EmptyViewCompactNoBalanceDark",
          8885: "lib-79b5cf47",
          8927: "shared-4d4c0ab0c8614da15552ce332e179a5b459284ba",
          9012: "shared-e4e46619289134f5f956616445f1fff32c6fa9fc",
          9145: "shared-c3ff2c58a8420ff82959a77953ce3b1b5bee008f",
          9202: "main-wiki-routes",
          9241: "shared-bdef4e5ba38b3a12a270fccc08c16cfb5f9dafd3",
          9247: "image-editor",
          9252: "EmptyViewNormalDefaultDark",
          9357: "lib-c4d1bd12",
          9361: "Carousel",
          9378: "EmptyViewNormalLoadingErrorDark",
          9419: "shared-8a673ce8c42bfde3ad4f25330db75f14edb56250",
          9597: "user-hover-card",
          9713: "shared-40f492fca55ad6ad3723a8c1ca48d572de4c69a1",
          9768: "main-creator-salt-routes",
          9956: "main-signup-routes",
        }[e] || e) +
        "." +
        {
          101: "3f6ac4e35d136a6262ae",
          213: "e4dd661e7724483c8c68",
          222: "7f77d93cb2e2ef612efc",
          358: "9ba60c7940301b857439",
          430: "71bb4776ac7657412eea",
          450: "4cd352d1f17a617786e7",
          615: "c791e3e3806ecc419fc7",
          620: "3361bbdec02d9f9e7c79",
          876: "5f82189070be968afab5",
          987: "5f9cb9899393da609b4a",
          1044: "f01cd337a7f8a6b8ff82",
          1057: "43cd0f1697dfb611a25f",
          1128: "41bcea609f72d59aa612",
          1141: "d6ee1378e56bc42c4478",
          1243: "993bf3e63383befd3ad6",
          1306: "48fd9652e8a16cf77f57",
          1350: "72583a10dddc05b2fae8",
          1353: "f2714a9ba8e6b03efe15",
          1393: "2d318802c36e7f34d130",
          1416: "fdf2f9be95a2fa77ae8f",
          1482: "921d8f53a57a48177d50",
          1505: "8c7fcb1daee59ae97cfe",
          1520: "242f5c906436dadf813b",
          1632: "9394696f317fe4da3a7d",
          1728: "7e63c94dec49b5013187",
          1787: "b9dab708eb23e58193a2",
          1801: "1f992dc2aa95c229faef",
          1923: "4b4a176c4ebe1c73d532",
          1951: "3f2c6567f6b83d140966",
          1965: "1ca7da9543a343c5d44a",
          1996: "ab7a595e9b987460ffcc",
          2033: "1c6d1b9b773fc3ab8282",
          2057: "fd907bcae8e7e193dd3e",
          2096: "ebf74c7ecd3823049135",
          2121: "e07334019bea64b000cd",
          2156: "c2d97c8ddc45f80de44b",
          2174: "0a87b6fe64ddcb92dd6b",
          2248: "1f515b95585b33ba26c9",
          2327: "f0205b2556038737abb8",
          2330: "af5d0cf1341a6477d45a",
          2411: "339062b9b9b4ba645469",
          2492: "3e7e22f0ae85a8b197cc",
          2520: "c5b1b9aefb0789d326e3",
          2607: "78ebbf6d0117d3c92cee",
          2656: "db8b82c2e169c729fbdb",
          2688: "92fe013f6741e5dc4937",
          2705: "a942918c47c5d700bcee",
          2714: "489ba04c936847671088",
          2744: "14b9554ef21039c124ee",
          2749: "0dfd6ce5ec86f7cf33c9",
          2793: "5438ed18bf8c191ce829",
          2850: "0692d5fe944e8fb46775",
          2874: "c44f614f9c063efb2f47",
          3026: "745271e464c76ef22c0a",
          3084: "3ff3e6fcb85bc9554cd6",
          3097: "eecd6f555699a98e776f",
          3175: "6f482d30b8b416c306d3",
          3180: "b1c7b755f49e12bc143c",
          3199: "76aae743940ce9a8023f",
          3232: "968ed7c14263f668b034",
          3336: "3d621402a1c81cf43e79",
          3366: "e0777757dec5c9cca345",
          3550: "42a9ad3cdb7831446b3b",
          3562: "d86621b5b8ca287bedce",
          3584: "df3bc603d1de018a3f6e",
          3634: "d29b5067a0190b0d21c7",
          3647: "352d18bc14ccc7e3ea74",
          3764: "1de55109dcce068943a4",
          3775: "d2d87af4d74541b7c79d",
          3786: "28feaa7dfc71638cc9ee",
          3795: "d7c57b1933106287f861",
          3927: "be794f582f32143f1c71",
          4017: "997bcb1b7d4f968f14fa",
          4055: "27734e91d9159a6906a1",
          4065: "c8756de661e8a41e4eb7",
          4078: "92e911270a2896721148",
          4117: "a88679dbff6d835b3558",
          4167: "d70a0a88791f28890e28",
          4173: "d6cb311eebf7e7e67135",
          4202: "fc7ac6387867c59854fd",
          4260: "fe37a461563c070cd885",
          4299: "60b25a97c3f0635e50cf",
          4349: "4966942fe2f473d9dc71",
          4361: "a7ca3749a069c6159495",
          4405: "c65d3474475340dd9e11",
          4408: "c0acde30223787e83632",
          4418: "cd8c78a21ae99d925f50",
          4434: "e37035f066ba397ea2f2",
          4629: "28af81f67c681fa956ab",
          4646: "1980865e18d25b1ae2d5",
          4688: "e00e682f58e0f2240511",
          4691: "da81a3f8de5823f07a93",
          4707: "5607549d60f5832fb14e",
          4708: "231948475f58d9f10235",
          4713: "a0e5e95f206f05e8556e",
          4717: "9bf2d29308d83802baa8",
          4769: "6b975d1aea5ab8f6f7f6",
          4799: "b8f4dad5057950d2bb8e",
          4813: "08c5aef306e7e1c3fa70",
          4814: "ba872d5cf2b74567a70b",
          4821: "089d16cad1c3409dc4d5",
          4837: "4358f37c6b41bac7db0b",
          4912: "5c374b38c22da0b6b0ab",
          5052: "8241b98e51c992632f2b",
          5100: "5af0ba857ed0771aad22",
          5117: "1d4079936fea30027c7c",
          5146: "c41223b767418af97de8",
          5221: "65c6d3f79395bc151577",
          5286: "e175ab0283fafb546df5",
          5290: "880f3755cd30f3617468",
          5315: "4015986bffeb91942938",
          5316: "fdd446a8a32a60a2ac81",
          5326: "7058c97f69f143cefc05",
          5327: "affd0e4ded9606b921f0",
          5344: "ce9f571ec6fa5f651124",
          5373: "5af78f4dea85bd76252a",
          5389: "598ebc816028b43b6420",
          5423: "1fc2a401f4070a935da1",
          5425: "bc7b63b8b50f4de4f070",
          5515: "4c62d168087e5320658d",
          5518: "93c0e1cb74a455a1827b",
          5546: "4b77a86075bc990ba85b",
          5560: "f00db9136bb1254b1716",
          5593: "1fe16a20353151e34c23",
          5634: "5c05878cb71aef0ad59d",
          5640: "e1a5dda9542943d6ccf2",
          5667: "d16c66fced92f3524ea1",
          5757: "1c4b8e8aae59aa8d0a8b",
          5857: "1b4c7acc7c91bc0d1347",
          5865: "fe0113f29d5972b6f298",
          5886: "02f75c33bb4afb9439a0",
          5898: "4d4d37a46223e7073208",
          5946: "4fc6fb99b9bb0835e7e9",
          6018: "36ba39f9e0bdd739e02c",
          6034: "0a898742b21801248a7d",
          6131: "dd36c190ce5e28c0e2e3",
          6151: "4cf713ddc4683846ea08",
          6186: "f948fd133fae2c73bb18",
          6242: "69e7588f6da8a55c2947",
          6246: "bef8776c7715eb60079a",
          6248: "55359491c67a1d611f4b",
          6272: "8e1a7eb057518840cdfb",
          6334: "6dae612ec32f9219b544",
          6414: "e3035f4ffd6153357c75",
          6439: "7265c5556c2536a316ab",
          6478: "7f64eab56e08c9d9f356",
          6559: "af70c78a599c7b43a012",
          6567: "9debc65f2e9372cd3010",
          6642: "76a9c7fdf6c248299319",
          6649: "f945c58fd5a13abc809e",
          6668: "6f5ee6d7ed7a414b71c4",
          6670: "8b14a7b4424e485c7b9d",
          6754: "fa82171dc3014b0aaa1d",
          6763: "6d1ac4ef3e6adabfdbfd",
          6815: "51dd7807f895f91804a0",
          6869: "7a7f6bafa271f5a3ed3a",
          6908: "664bd204304ebe0144e5",
          6972: "c724f6b8d57924164336",
          7050: "c2dc1486c80a12d1d990",
          7099: "8543ad332bdc729976e5",
          7190: "d91fdb76eb8a788fdb53",
          7193: "e0c5ef59ca3f5c269134",
          7223: "3587a2b36a7cab9389a9",
          7368: "d0bf8bc2363febd8cea3",
          7473: "b7d1202cc7f96defa496",
          7556: "f86a6d2a02778dbf93b3",
          7590: "80d1fdeb3c1fbabe15cd",
          7629: "a0e14fa43c4b5541b481",
          7749: "ba6a90457370412a0bdd",
          7848: "4e4c1f2d047c28983eee",
          7856: "bed61632521ce3788270",
          7926: "2694d557d1c000daf706",
          7936: "88597eb38b2c6b8df96f",
          7970: "ccb4a621ba3b77886d6a",
          8084: "a0a60bb85ff1bce49b1c",
          8089: "9746cab44a6aef8cfb35",
          8091: "39839e9867678bdf1ad3",
          8128: "80e670a4239a61c90250",
          8141: "c6a8db13be171d2fa1e3",
          8160: "7c2f943a4d1ac9c07cca",
          8214: "9b7db9926a79d388a7f0",
          8302: "cfd16ade15b3ea30041f",
          8340: "3182bd8f40414bfb1801",
          8368: "af315c7120f656d38315",
          8377: "6fa649c6c7d4f4589507",
          8400: "72027931d31698d8f7a7",
          8438: "53757cbb530c37983cba",
          8530: "bd9b49a88dfb15471f0e",
          8667: "30a0a5808d496c4460c7",
          8816: "2fa61951d92b4c46e6a1",
          8873: "c2b03046ea8329b88997",
          8885: "ef9f36ceaff90561a471",
          8912: "59b636bb88afba7c9288",
          8927: "565ebcc17b615c7e93c9",
          9012: "0bfaa775f70feabc7c5f",
          9145: "e8c4153c2e65e20f414c",
          9165: "56d011346fb8fb845495",
          9202: "867712dd7dfa98642967",
          9241: "977cc9b700c58e58530d",
          9247: "9a7707a9cfc80af68b84",
          9252: "d5860fbe09dc9be44cc4",
          9285: "fab846c6a8f1fab6cb49",
          9357: "35ac2085eb3e412d7efe",
          9361: "01448d1199ee4e751713",
          9378: "b45ab70e2c08b1afdad9",
          9419: "dd7eb8932c92db0664df",
          9597: "4649957e9803e18bc9cb",
          9713: "c07d4f52fe7464d2e9ac",
          9768: "20407eafcc812b8ad316",
          9956: "6c77f48f46c77945bb6a",
        }[e] +
        ".js"
      );
    }),
    (p.miniCssF = function (e) {
      return (
        "" +
        ({
          101: "main-search-routes",
          213: "comments-v3",
          358: "navbar-notifications",
          430: "GoodsRecommendGoodsCardList",
          876: "report_modals",
          987: "comment-richtext",
          1128: "Chart",
          1306: "main-messages-routes",
          1353: "main-roundtable-routes",
          1632: "main-signin-routes",
          2121: "main-notifications-routes",
          2156: "EditableV2",
          2492: "main-special-routes",
          2520: "main-question-routes",
          3026: "FeeConsultCard",
          3199: "writePinV2RichInput",
          3634: "main-creator-routes",
          3786: "navbar-messages",
          4117: "lib-0de40faf",
          4361: "main-topic-routes",
          4713: "main-knowledge-plan-routes",
          4717: "editPinV2RichInput",
          5117: "main-email-register-routes",
          5290: "main-collections-routes",
          5316: "main-host-routes",
          5560: "richinput",
          5640: "globalOrgReport",
          5667: "main-settings-routes",
          5857: "main-org-routes",
          5898: "main-topstory-routes",
          6131: "creation-manage-action-list",
          6414: "main-collection-routes",
          6478: "main-campaign-routes",
          6668: "main-mcn-routes",
          6815: "PcCommentFollowPlugin",
          6869: "main-explore-routes",
          7190: "InlineVideo",
          7848: "EcommerceAdCard",
          7856: "comment-manage-footer",
          8128: "main-ai-routes",
          8214: "main-help-center-routes",
          8377: "main-ring-routes",
          8400: "ECommerceAd",
          9202: "main-wiki-routes",
          9361: "Carousel",
          9597: "user-hover-card",
          9768: "main-creator-salt-routes",
          9956: "main-signup-routes",
        }[e] || e) +
        ".216a26f4." +
        {
          101: "a518d0a6cd264d5c07df",
          213: "3103d20bd699055e1e07",
          358: "3e8b36be7ab8306a375e",
          430: "d95ce79191cdf8d7ac28",
          876: "98c51ea1d813cec0e8bf",
          987: "921071efb1bf760f69ed",
          1128: "04fb429397bda3b51a41",
          1306: "cfa4f032c539620f172f",
          1353: "d64375344017b4b497df",
          1393: "c1535c3425216136df59",
          1632: "107e7a8e9d5090749b3d",
          2057: "5ad9c1eaae1b9892d1f5",
          2121: "826a3a6a2bd6cc886873",
          2156: "14c36bde8e9dec8b06ae",
          2248: "0faf8a677c4983f517f9",
          2492: "3571d43bcc55a339f4ad",
          2520: "8b62264fbac981b93856",
          2656: "2e59b28d8748c7a7c3f0",
          2688: "b6f963a00c8bcef7f4f5",
          3026: "b553d561e75f70cc9266",
          3175: "af05258f7c0cef104d4b",
          3199: "9f1dc8f4ecea45e1d40d",
          3634: "d8c96d5b60e9b7eaec8b",
          3786: "d543e4ed85e00d51b25e",
          4017: "0d9e0bd5bbe2c9ec7640",
          4117: "885d0636e8337bfaf530",
          4361: "0c79926d1c82ad2853a8",
          4713: "8664ec1d21482fc5b6bb",
          4717: "9f1dc8f4ecea45e1d40d",
          4821: "efdb60ecf55d74e13f51",
          5117: "9ac67f1c05a4f55e8f3f",
          5290: "2096fbfa5a629d31f293",
          5316: "03dbc5ae7cf26f5aefae",
          5425: "bfdc088932c7772eb8c0",
          5560: "cfb9833c658baf36aec2",
          5640: "1061879924d5d47c8dd8",
          5667: "e394bc26c285c48e1737",
          5857: "2555ecbf2da2ff6210d0",
          5898: "10e4261f3ac0f7f816a4",
          6131: "62d101947549cba23437",
          6151: "06f8ab9f939cf138a964",
          6414: "dfef79848e41fc00a6b6",
          6478: "fe0ebbc985442fda6e2f",
          6668: "4c8e110ec6306a71af33",
          6815: "dd021feb001cdd846d64",
          6869: "58a9c7e3056744c8d336",
          7190: "595d52f7cb0dc085df49",
          7193: "e83af4adf6ead413ef35",
          7848: "813271c7ddaf35e979bf",
          7856: "64d6a976286e056cc8f1",
          8128: "ae22322f62fef2f9229f",
          8214: "e6ad5e0aad77af4a6688",
          8377: "14217ead9bdced0a0032",
          8400: "01664c51541c8c286b92",
          8912: "03cde079d4e819307919",
          9202: "3d33bef1605741e46da9",
          9285: "f5394974d0d3df29ec9f",
          9361: "cdf86780c4d03bcbcade",
          9597: "2ea30f58b545b6775afa",
          9768: "b7c34700142d058e1a9c",
          9956: "107e7a8e9d5090749b3d",
        }[e] +
        ".css"
      );
    }),
    (p.g = (function () {
      if ("object" == typeof globalThis) return globalThis;
      try {
        return this || Function("return this")();
      } catch (e) {
        if ("object" == typeof window) return window;
      }
    })()),
    (p.o = function (e, a) {
      return Object.prototype.hasOwnProperty.call(e, a);
    }),
    (d = {}),
    (f = "heifetz:"),
    (p.l = function (e, a, c, b) {
      if (d[e]) {
        d[e].push(a);
        return;
      }
      if (void 0 !== c)
        for (
          var t, r, o = document.getElementsByTagName("script"), n = 0;
          n < o.length;
          n++
        ) {
          var i = o[n];
          if (
            i.getAttribute("src") == e ||
            i.getAttribute("data-webpack") == f + c
          ) {
            t = i;
            break;
          }
        }
      t ||
        ((r = !0),
        ((t = document.createElement("script")).charset = "utf-8"),
        (t.timeout = 120),
        p.nc && t.setAttribute("nonce", p.nc),
        t.setAttribute("data-webpack", f + c),
        (t.src = e),
        0 === t.src.indexOf(window.location.origin + "/") ||
          (t.crossOrigin = "anonymous")),
        (d[e] = [a]);
      var s = function (a, c) {
          (t.onerror = t.onload = null), clearTimeout(l);
          var f = d[e];
          if (
            (delete d[e],
            t.parentNode && t.parentNode.removeChild(t),
            f &&
              f.forEach(function (e) {
                return e(c);
              }),
            a)
          )
            return a(c);
        },
        l = setTimeout(
          s.bind(null, void 0, {
            type: "timeout",
            target: t,
          }),
          12e4
        );
      (t.onerror = s.bind(null, t.onerror)),
        (t.onload = s.bind(null, t.onload)),
        r && document.head.appendChild(t);
    }),
    (p.r = function (e) {
      "undefined" != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, {
          value: "Module",
        }),
        Object.defineProperty(e, "__esModule", {
          value: !0,
        });
    }),
    (p.nmd = function (e) {
      return (e.paths = []), e.children || (e.children = []), e;
    }),
    (p.S = {}),
    (b = {}),
    (t = {}),
    (p.I = function (e, a) {
      a || (a = []);
      var c = t[e];
      if ((c || (c = t[e] = {}), !(a.indexOf(c) >= 0))) {
        if ((a.push(c), b[e])) return b[e];
        p.o(p.S, e) || (p.S[e] = {}), p.S[e];
        var d = [];
        return d.length
          ? (b[e] = Promise.all(d).then(function () {
              return (b[e] = 1);
            }))
          : (b[e] = 1);
      }
    }),
    (p.p = "https://static.zhihu.com/heifetz/"),
    (r = function (e, a, c, d) {
      var f = document.createElement("link");
      return (
        (f.rel = "stylesheet"),
        (f.type = "text/css"),
        (f.onerror = f.onload =
          function (b) {
            if (((f.onerror = f.onload = null), "load" === b.type)) c();
            else {
              var t = b && ("load" === b.type ? "missing" : b.type),
                r = (b && b.target && b.target.href) || a,
                o = Error("Loading CSS chunk " + e + " failed.\n(" + r + ")");
              (o.code = "CSS_CHUNK_LOAD_FAILED"),
                (o.type = t),
                (o.request = r),
                f.parentNode.removeChild(f),
                d(o);
            }
          }),
        (f.href = a),
        0 !== f.href.indexOf(window.location.origin + "/") &&
          (f.crossOrigin = "anonymous"),
        (function (e) {
          var a = document.head.querySelectorAll('link[rel="stylesheet"]'),
            c = a.length && a[a.length - 1];
          if (c) {
            c.insertAdjacentElement("afterend", e);
            return;
          }
          document.head.appendChild(e);
        })(f),
        f
      );
    }),
    (o = function (e, a) {
      for (
        var c = document.getElementsByTagName("link"), d = 0;
        d < c.length;
        d++
      ) {
        var f = c[d],
          b = f.getAttribute("data-href") || f.getAttribute("href");
        if ("stylesheet" === f.rel && (b === e || b === a)) return f;
      }
      for (
        var t = document.getElementsByTagName("style"), d = 0;
        d < t.length;
        d++
      ) {
        var f = t[d],
          b = f.getAttribute("data-href");
        if (b === e || b === a) return f;
      }
    }),
    (n = {
      3666: 0,
    }),
    (p.f.miniCss = function (e, a) {
      n[e]
        ? a.push(n[e])
        : 0 !== n[e] &&
          {
            101: 1,
            213: 1,
            358: 1,
            430: 1,
            876: 1,
            987: 1,
            1128: 1,
            1306: 1,
            1353: 1,
            1393: 1,
            1632: 1,
            2057: 1,
            2121: 1,
            2156: 1,
            2248: 1,
            2492: 1,
            2520: 1,
            2656: 1,
            2688: 1,
            3026: 1,
            3175: 1,
            3199: 1,
            3634: 1,
            3786: 1,
            4017: 1,
            4117: 1,
            4361: 1,
            4713: 1,
            4717: 1,
            4821: 1,
            5117: 1,
            5290: 1,
            5316: 1,
            5425: 1,
            5560: 1,
            5640: 1,
            5667: 1,
            5857: 1,
            5898: 1,
            6131: 1,
            6151: 1,
            6414: 1,
            6478: 1,
            6668: 1,
            6815: 1,
            6869: 1,
            7190: 1,
            7193: 1,
            7848: 1,
            7856: 1,
            8128: 1,
            8214: 1,
            8377: 1,
            8400: 1,
            8912: 1,
            9202: 1,
            9285: 1,
            9361: 1,
            9597: 1,
            9768: 1,
            9956: 1,
          }[e] &&
          a.push(
            (n[e] = new Promise(function (a, c) {
              var d = p.miniCssF(e),
                f = p.p + d;
              if (o(d, f)) return a();
              r(e, f, a, c);
            }).then(
              function () {
                n[e] = 0;
              },
              function (a) {
                throw (delete n[e], a);
              }
            ))
          );
    }),
    (i = {
      3666: 0,
    }),
    (p.f.j = function (e, a) {
      var c = p.o(i, e) ? i[e] : void 0;
      if (0 !== c) {
        if (c) a.push(c[2]);
        else if (/^(2(057|156|688)|1393|3666|4117|7190|9285)$/.test(e))
          i[e] = 0;
        else {
          var d = new Promise(function (a, d) {
            c = i[e] = [a, d];
          });
          a.push((c[2] = d));
          var f = p.p + p.u(e),
            b = Error();
          p.l(
            f,
            function (a) {
              if (p.o(i, e) && (0 !== (c = i[e]) && (i[e] = void 0), c)) {
                var d = a && ("load" === a.type ? "missing" : a.type),
                  f = a && a.target && a.target.src;
                (b.message =
                  "Loading chunk " + e + " failed.\n(" + d + ": " + f + ")"),
                  (b.name = "ChunkLoadError"),
                  (b.type = d),
                  (b.request = f),
                  c[1](b);
              }
            },
            "chunk-" + e,
            e
          );
        }
      }
    }),
    (p.O.j = function (e) {
      return 0 === i[e];
    }),
    (s = function (e, a) {
      var c,
        d,
        f = a[0],
        b = a[1],
        t = a[2],
        r = 0;
      if (
        f.some(function (e) {
          return 0 !== i[e];
        })
      ) {
        for (c in b) p.o(b, c) && (p.m[c] = b[c]);
        if (t) var o = t(p);
      }
      for (e && e(a); r < f.length; r++)
        (d = f[r]), p.o(i, d) && i[d] && i[d][0](), (i[d] = 0);
      return p.O(o);
    });
  (window.yang = p),
    (l = self.webpackChunkheifetz = self.webpackChunkheifetz || []).forEach(
      s.bind(null, 0)
    ),
    (l.push = s.bind(null, l.push.bind(l)));
})();

// //'2.0_' x-zse-93 + URI + cookie中的d_c0 + x-zst-81
// x-zse-96 = '2.0_' + tk
// var ta = "101_3_3.0",
//   tu = "AFCSc2wb_RmPTtdAxKxyQyok-YuztUisHw8=|1739262461",
//   tc = null,
//   tf = "/api/v4/creator/rights/8413324000/switch",
//   tp = [ta, tf, tu, false, tc].filter(Boolean).join("+");

// console.log(tp, crypto.MD5(tp).toString());

// console.log(
//   window
//     .yang(1514)
//     .ZP(
//       crypto
//         .MD5(
//           "101_3_3.0+/api/v4/questions/7272414588/concerned_followers?limit=7&offset=0+AFCSc2wb_RmPTtdAxKxyQyok-YuztUisHw8=|1739262461"
//         )
//         .toString()
//     )
// );

const encrypt = (str) => {
  return '2.0_'+ window.yang(1514).ZP(crypto.MD5(str).toString());
};

if (typeof module !== "undefined") {
  module.exports = {
    encrypt,
  };
}
