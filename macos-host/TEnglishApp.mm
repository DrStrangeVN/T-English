#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface BundleSchemeHandler : NSObject <WKURLSchemeHandler>
@property (nonatomic, copy) NSString *webRoot;
@end

@implementation BundleSchemeHandler

- (NSString *)mimeTypeForPath:(NSString *)path {
    NSString *ext = path.pathExtension.lowercaseString;
    if ([ext isEqualToString:@"html"]) return @"text/html; charset=utf-8";
    if ([ext isEqualToString:@"js"] || [ext isEqualToString:@"mjs"]) return @"application/javascript; charset=utf-8";
    if ([ext isEqualToString:@"css"]) return @"text/css; charset=utf-8";
    if ([ext isEqualToString:@"json"]) return @"application/json; charset=utf-8";
    if ([ext isEqualToString:@"svg"]) return @"image/svg+xml";
    if ([ext isEqualToString:@"png"]) return @"image/png";
    if ([ext isEqualToString:@"woff2"]) return @"font/woff2";
    return @"application/octet-stream";
}

- (void)webView:(WKWebView *)webView startURLSchemeTask:(id<WKURLSchemeTask>)urlSchemeTask {
    NSURL *url = urlSchemeTask.request.URL;
    NSString *rawPath = url.path;
    if (!rawPath || rawPath.length == 0 || [rawPath isEqualToString:@"/"]) {
        rawPath = @"/index.html";
    }
    if ([rawPath hasPrefix:@"/"]) {
        rawPath = [rawPath substringFromIndex:1];
    }

    // Canonicalize webRoot and resolved target path to prevent path traversal
    NSString *canonicalRoot = [[self.webRoot stringByResolvingSymlinksInPath] stringByStandardizingPath];
    NSString *allowedPrefix = [canonicalRoot hasSuffix:@"/"] ? canonicalRoot : [canonicalRoot stringByAppendingString:@"/"];
    NSString *candidate = [canonicalRoot stringByAppendingPathComponent:rawPath];
    NSString *canonicalTarget = [[candidate stringByResolvingSymlinksInPath] stringByStandardizingPath];

    if (![canonicalTarget hasPrefix:allowedPrefix] && ![canonicalTarget isEqualToString:canonicalRoot]) {
        NSData *forbidden = [@"Forbidden" dataUsingEncoding:NSUTF8StringEncoding];
        NSHTTPURLResponse *resp403 = [[NSHTTPURLResponse alloc] initWithURL:url
                                                                  statusCode:403
                                                                 HTTPVersion:@"HTTP/1.1"
                                                                headerFields:@{@"Content-Type": @"text/plain; charset=utf-8"}];
        [urlSchemeTask didReceiveResponse:resp403];
        [urlSchemeTask didReceiveData:forbidden];
        [urlSchemeTask didFinish];
        return;
    }

    NSFileManager *fm = [NSFileManager defaultManager];
    BOOL isDir = NO;
    if (![fm fileExistsAtPath:canonicalTarget isDirectory:&isDir] || isDir) {
        canonicalTarget = [canonicalRoot stringByAppendingPathComponent:@"index.html"];
    }

    NSData *data = [NSData dataWithContentsOfFile:canonicalTarget];
    if (!data) {
        NSError *err = [NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorFileDoesNotExist userInfo:nil];
        [urlSchemeTask didFailWithError:err];
        return;
    }

    NSDictionary *headers = @{
        @"Content-Type": [self mimeTypeForPath:canonicalTarget],
        @"Access-Control-Allow-Origin": @"tenglish://app",
        @"Cache-Control": @"no-cache"
    };
    NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:url
                                                              statusCode:200
                                                             HTTPVersion:@"HTTP/1.1"
                                                            headerFields:headers];
    [urlSchemeTask didReceiveResponse:response];
    [urlSchemeTask didReceiveData:data];
    [urlSchemeTask didFinish];
}

- (void)webView:(WKWebView *)webView stopURLSchemeTask:(id<WKURLSchemeTask>)urlSchemeTask {
    // No-op
}

@end

// Non-activating Floating Liquid Glass HUD Panel for macOS Desktop Vocabulary Notifications
@interface VocabHudPanel : NSPanel
@end

@implementation VocabHudPanel
- (BOOL)canBecomeKeyWindow { return NO; }
- (BOOL)canBecomeMainWindow { return NO; }
@end

@interface TEnglishAppDelegate : NSObject <NSApplicationDelegate, WKScriptMessageHandler, WKUIDelegate>
@property (nonatomic, strong) NSWindow *window;
@property (nonatomic, strong) NSVisualEffectView *vibrancy;
@property (nonatomic, strong) WKWebView *webView;
@property (nonatomic, strong) NSStatusItem *statusItem;
@property (nonatomic, strong) NSPopover *popover;
@property (nonatomic, strong) WKWebView *popoverWebView;
@property (nonatomic, strong) BundleSchemeHandler *schemeHandler;
@property (nonatomic, strong) NSTask *localVieneuTask;
@property (nonatomic, strong) VocabHudPanel *vocabHudPanel;
@property (nonatomic, strong) NSTimer *vocabHudTimer;
@property (nonatomic, copy) NSString *activeHudCardId;
@property (nonatomic, assign) BOOL lightMode;
@property (nonatomic, copy) NSString *glassMode;
@property (nonatomic, assign) BOOL userReduceTransparency;
@end

@implementation TEnglishAppDelegate

// Monochrome template logo matching the stylized "T" + 3-bar "E" emblem for macOS Menu Bar
- (NSImage *)createTemplateSquircleLogo {
    NSSize size = NSMakeSize(18, 18);
    NSImage *img = [[NSImage alloc] initWithSize:size];
    [img lockFocus];
    [[NSColor blackColor] setStroke];
    [[NSColor blackColor] setFill];

    NSBezierPath *outer = [NSBezierPath bezierPathWithRoundedRect:NSMakeRect(1.25, 1.25, 15.5, 15.5) xRadius:4.4 yRadius:4.4];
    outer.lineWidth = 1.4;
    [outer stroke];

    // Stylized "T" on left/top
    NSBezierPath *tMark = [NSBezierPath bezierPath];
    [tMark moveToPoint:NSMakePoint(4.2, 12.6)];
    [tMark lineToPoint:NSMakePoint(10.6, 12.6)];
    [tMark moveToPoint:NSMakePoint(6.7, 12.6)];
    [tMark lineToPoint:NSMakePoint(6.7, 5.2)];
    [tMark moveToPoint:NSMakePoint(5.2, 5.2)];
    [tMark lineToPoint:NSMakePoint(8.2, 5.2)];
    tMark.lineWidth = 1.5;
    tMark.lineCapStyle = NSLineCapStyleRound;
    [tMark stroke];

    // 3-bar Speech-Wave "E" on right
    NSBezierPath *eBars = [NSBezierPath bezierPath];
    [eBars moveToPoint:NSMakePoint(9.9, 9.8)];
    [eBars lineToPoint:NSMakePoint(13.6, 9.8)];
    [eBars moveToPoint:NSMakePoint(9.9, 7.5)];
    [eBars lineToPoint:NSMakePoint(12.6, 7.5)];
    [eBars moveToPoint:NSMakePoint(9.9, 5.2)];
    [eBars lineToPoint:NSMakePoint(13.8, 5.2)];
    eBars.lineWidth = 1.35;
    eBars.lineCapStyle = NSLineCapStyleRound;
    [eBars stroke];

    // Accent dot top-right
    NSBezierPath *dot = [NSBezierPath bezierPathWithOvalInRect:NSMakeRect(12.2, 11.7, 1.8, 1.8)];
    [dot fill];

    [img unlockFocus];
    [img setTemplate:YES];
    return img;
}

- (WKWebViewConfiguration *)makeSharedWebConfig {
    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    config.websiteDataStore = [WKWebsiteDataStore defaultDataStore];
    config.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;
    [config setURLSchemeHandler:self.schemeHandler forURLScheme:@"tenglish"];
    [config.userContentController addScriptMessageHandler:self name:@"tenglish"];
    return config;
}

- (void)dispatchEventName:(NSString *)eventName payload:(NSDictionary *)payload toWebView:(WKWebView *)targetWebView {
    if (!targetWebView) return;
    NSError *err = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:payload options:0 error:&err];
    if (!jsonData || err) return;
    NSString *jsonStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    NSString *script = [NSString stringWithFormat:@"window.dispatchEvent(new CustomEvent('%@', { detail: %@ }));", eventName, jsonStr];
    dispatch_async(dispatch_get_main_queue(), ^{
        [targetWebView evaluateJavaScript:script completionHandler:nil];
    });
}

- (void)applyVibrancyAndAppearance {
    BOOL sysReduce = [NSWorkspace sharedWorkspace].accessibilityDisplayShouldReduceTransparency;
    BOOL effectiveReduce = sysReduce || self.userReduceTransparency;
    NSAppearance *appearance = [NSAppearance appearanceNamed:(self.lightMode ? NSAppearanceNameAqua : NSAppearanceNameDarkAqua)];
    [NSApp setAppearance:appearance];
    self.window.appearance = appearance;

    if (effectiveReduce) {
        self.vibrancy.hidden = YES;
        self.window.backgroundColor = self.lightMode
            ? [NSColor colorWithSRGBRed:0.957 green:0.961 blue:0.973 alpha:1.0]
            : [NSColor colorWithSRGBRed:0.047 green:0.055 blue:0.078 alpha:1.0];
    } else {
        self.vibrancy.hidden = NO;
        self.window.backgroundColor = [NSColor clearColor];
        BOOL solid = [self.glassMode isEqualToString:@"solid"];
        self.vibrancy.material = self.lightMode
            ? (solid ? NSVisualEffectMaterialWindowBackground : NSVisualEffectMaterialUnderWindowBackground)
            : (solid ? NSVisualEffectMaterialUnderWindowBackground : NSVisualEffectMaterialHUDWindow);
    }

    NSString *js = [NSString stringWithFormat:
        @"if(document.body){document.body.classList.toggle('reduce-transparency', %@);document.body.classList.toggle('light', %@);}",
        effectiveReduce ? @"true" : @"false",
        self.lightMode ? @"true" : @"false"];
    [self.webView evaluateJavaScript:js completionHandler:nil];
    if (self.popoverWebView) {
        [self.popoverWebView evaluateJavaScript:js completionHandler:nil];
    }
}

- (void)accessibilityDisplayOptionsDidChange:(NSNotification *)note {
    [self applyVibrancyAndAppearance];
}

- (void)windowOcclusionChanged:(NSNotification *)note {
    BOOL visible = (self.window.occlusionState & NSWindowOcclusionStateVisible) != 0;
    self.vibrancy.state = visible ? NSVisualEffectStateFollowsWindowActiveState : NSVisualEffectStateInactive;
}

// Grant microphone permission inside WKWebView for our bundled tenglish:// origin
- (void)webView:(WKWebView *)webView
    requestMediaCapturePermissionForOrigin:(WKSecurityOrigin *)origin
                          initiatedByFrame:(WKFrameInfo *)frame
                                      type:(WKMediaCaptureType)type
                           decisionHandler:(void (^)(WKPermissionDecision))decisionHandler API_AVAILABLE(macos(12.0)) {
    if ([origin.protocol isEqualToString:@"tenglish"] && [origin.host isEqualToString:@"app"]) {
        decisionHandler(WKPermissionDecisionGrant);
    } else {
        decisionHandler(WKPermissionDecisionDeny);
    }
}

- (void)saveFileWithSuggestedName:(NSString *)filename content:(NSString *)content {
    NSSavePanel *panel = [NSSavePanel savePanel];
    panel.nameFieldStringValue = filename.length > 0 ? filename : @"T-English-Export.csv";
    panel.canCreateDirectories = YES;
    [panel beginSheetModalForWindow:self.window completionHandler:^(NSModalResponse result) {
        if (result == NSModalResponseOK && panel.URL) {
            NSError *err = nil;
            [content writeToURL:panel.URL atomically:YES encoding:NSUTF8StringEncoding error:&err];
        }
    }];
}

// Universal native HTTP proxy (eliminates WKWebView CORS / PNA issues for VieNeu 8765/8766 & Ollama 11434)
- (void)handleNativeHttpRequest:(NSDictionary *)dict eventName:(NSString *)eventName fromWebView:(WKWebView *)sourceWebView {
    NSString *requestId = [dict[@"requestId"] isKindOfClass:[NSString class]] ? dict[@"requestId"] : @"";
    NSString *urlString = [dict[@"url"] isKindOfClass:[NSString class]] ? dict[@"url"] : @"";
    NSString *method = [dict[@"method"] isKindOfClass:[NSString class]] ? dict[@"method"] : @"GET";
    NSString *token = [dict[@"token"] isKindOfClass:[NSString class]] ? dict[@"token"] : @"";
    NSString *bodyStr = [dict[@"body"] isKindOfClass:[NSString class]] ? dict[@"body"] : nil;
    NSDictionary *extraHeaders = [dict[@"headers"] isKindOfClass:[NSDictionary class]] ? dict[@"headers"] : nil;
    NSNumber *timeoutMsNum = [dict[@"timeoutMs"] isKindOfClass:[NSNumber class]] ? dict[@"timeoutMs"] : nil;
    NSTimeInterval timeoutSec = timeoutMsNum ? MAX(3.0, MIN(60.0, [timeoutMsNum doubleValue] / 1000.0)) : 25.0;

    NSURL *url = [NSURL URLWithString:urlString];
    NSString *scheme = url.scheme.lowercaseString;
    if (!url || (![scheme isEqualToString:@"http"] && ![scheme isEqualToString:@"https"])) {
        [self dispatchEventName:eventName payload:@{
            @"requestId": requestId,
            @"ok": @NO,
            @"status": @0,
            @"error": @"Invalid HTTP URL scheme"
        } toWebView:sourceWebView];
        return;
    }

    NSMutableURLRequest *req = [NSMutableURLRequest requestWithURL:url
                                                       cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
                                                   timeoutInterval:timeoutSec];
    req.HTTPMethod = method.uppercaseString;
    if (token.length > 0) {
        [req setValue:token forHTTPHeaderField:@"X-VieNeu-Studio-Token"];
        [req setValue:[NSString stringWithFormat:@"Bearer %@", token] forHTTPHeaderField:@"Authorization"];
    }
    if (extraHeaders) {
        for (id key in extraHeaders) {
            id val = extraHeaders[key];
            if ([key isKindOfClass:[NSString class]] && [val isKindOfClass:[NSString class]]) {
                [req setValue:(NSString *)val forHTTPHeaderField:(NSString *)key];
            }
        }
    }
    if (bodyStr && ([req.HTTPMethod isEqualToString:@"POST"] || [req.HTTPMethod isEqualToString:@"PUT"])) {
        if (![req valueForHTTPHeaderField:@"Content-Type"]) {
            [req setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
        }
        req.HTTPBody = [bodyStr dataUsingEncoding:NSUTF8StringEncoding];
    }

    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:req
        completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
            if (error || !response) {
                [self dispatchEventName:eventName payload:@{
                    @"requestId": requestId,
                    @"ok": @NO,
                    @"status": @0,
                    @"error": error ? error.localizedDescription : @"Connection failed"
                } toWebView:sourceWebView];
                return;
            }
            NSHTTPURLResponse *httpResp = (NSHTTPURLResponse *)response;
            NSInteger status = httpResp.statusCode;
            BOOL ok = (status >= 200 && status < 300);
            NSString *contentType = httpResp.MIMEType ?: @"application/octet-stream";
            NSString *sampleRateHeader = httpResp.allHeaderFields[@"X-Sample-Rate"] ?: httpResp.allHeaderFields[@"x-sample-rate"];
            NSInteger sampleRate = sampleRateHeader ? [sampleRateHeader integerValue] : 48000;
            NSString *b64 = data ? [data base64EncodedStringWithOptions:0] : @"";

            [self dispatchEventName:eventName payload:@{
                @"requestId": requestId,
                @"ok": @(ok),
                @"status": @(status),
                @"contentType": contentType,
                @"sampleRate": @(sampleRate > 0 ? sampleRate : 48000),
                @"bodyBase64": b64
            } toWebView:sourceWebView];
        }];
    [task resume];
}

// 1-Click Local Direct VieNeu-TTS v3 Turbo Engine Launcher (port 8766, 48kHz ONNX int8, 108 voices)
- (void)handleStartLocalVieneu:(NSDictionary *)dict fromWebView:(WKWebView *)sourceWebView {
    NSString *requestId = [dict[@"requestId"] isKindOfClass:[NSString class]] ? dict[@"requestId"] : @"";
    NSNumber *portNum = [dict[@"port"] isKindOfClass:[NSNumber class]] ? dict[@"port"] : @(8766);
    NSInteger port = [portNum integerValue] > 1024 ? [portNum integerValue] : 8766;

    if (self.localVieneuTask && self.localVieneuTask.isRunning) {
        [self dispatchEventName:@"tenglish-vieneu-daemon" payload:@{
            @"requestId": requestId,
            @"ok": @YES,
            @"running": @YES,
            @"port": @(port),
            @"message": @"VieNeu Direct Engine đã đang chạy sẵn trên máy."
        } toWebView:sourceWebView];
        return;
    }

    NSString *homeDir = NSHomeDirectory();
    NSString *runtimeDir = [homeDir stringByAppendingPathComponent:@"Developer/chua-vieneu-runtime"];
    NSString *pythonPath = [runtimeDir stringByAppendingPathComponent:@".venv/bin/python"];
    NSString *repoDir = [runtimeDir stringByAppendingPathComponent:@"VieNeu-TTS"];
    NSFileManager *fm = [NSFileManager defaultManager];

    if (![fm isExecutableFileAtPath:pythonPath] || ![fm fileExistsAtPath:repoDir]) {
        [self dispatchEventName:@"tenglish-vieneu-daemon" payload:@{
            @"requestId": requestId,
            @"ok": @NO,
            @"running": @NO,
            @"message": @"Không tìm thấy runtime VieNeu tại ~/Developer/chua-vieneu-runtime."
        } toWebView:sourceWebView];
        return;
    }

    @try {
        NSTask *task = [[NSTask alloc] init];
        task.executableURL = [NSURL fileURLWithPath:pythonPath];
        task.currentDirectoryURL = [NSURL fileURLWithPath:repoDir];
        task.arguments = @[
            @"-m", @"uvicorn", @"apps.openai_speech:app",
            @"--host", @"127.0.0.1",
            @"--port", [NSString stringWithFormat:@"%ld", (long)port],
            @"--workers", @"1",
            @"--no-access-log"
        ];

        NSMutableDictionary *env = [NSMutableDictionary dictionaryWithDictionary:[NSProcessInfo processInfo].environment];
        NSString *srcDir = [repoDir stringByAppendingPathComponent:@"src"];
        NSString *onnxDir = [runtimeDir stringByAppendingPathComponent:@"models/onnx_int8"];
        env[@"PYTHONPATH"] = [NSString stringWithFormat:@"%@:%@", repoDir, srcDir];
        env[@"VIENEU_BACKEND"] = @"onnx";
        env[@"VIENEU_DEVICE"] = @"cpu";
        env[@"VIENEU_PRECISION"] = @"int8";
        if ([fm fileExistsAtPath:onnxDir]) {
            env[@"VIENEU_ONNX_DIR"] = onnxDir;
        }
        env[@"VIENEU_MAX_STREAMS"] = @"2";
        env[@"HF_HUB_OFFLINE"] = @"1";
        env[@"HF_HOME"] = [homeDir stringByAppendingPathComponent:@".cache/huggingface"];
        env[@"VIENEU_HOME"] = [homeDir stringByAppendingPathComponent:@".vieneu"];
        task.environment = env;
        task.standardOutput = [NSFileHandle fileHandleWithNullDevice];
        task.standardError = [NSFileHandle fileHandleWithNullDevice];

        NSError *launchErr = nil;
        BOOL started = [task launchAndReturnError:&launchErr];
        if (!started || launchErr) {
            [self dispatchEventName:@"tenglish-vieneu-daemon" payload:@{
                @"requestId": requestId,
                @"ok": @NO,
                @"running": @NO,
                @"message": launchErr ? launchErr.localizedDescription : @"Không thể khởi chạy tiến trình VieNeu."
            } toWebView:sourceWebView];
            return;
        }
        self.localVieneuTask = task;

        [self dispatchEventName:@"tenglish-vieneu-daemon" payload:@{
            @"requestId": requestId,
            @"ok": @YES,
            @"running": @YES,
            @"port": @(port),
            @"message": [NSString stringWithFormat:@"Đang khởi chạy VieNeu Direct Engine (ONNX 48kHz) tại cổng %ld (~3 giây)...", (long)port]
        } toWebView:sourceWebView];
    } @catch (NSException *ex) {
        [self dispatchEventName:@"tenglish-vieneu-daemon" payload:@{
            @"requestId": requestId,
            @"ok": @NO,
            @"running": @NO,
            @"message": ex.reason ?: @"Lỗi ngoại lệ khi khởi chạy VieNeu Direct Engine"
        } toWebView:sourceWebView];
    }
}

- (void)handleStopLocalVieneu:(NSDictionary *)dict fromWebView:(WKWebView *)sourceWebView {
    NSString *requestId = [dict[@"requestId"] isKindOfClass:[NSString class]] ? dict[@"requestId"] : @"";
    if (self.localVieneuTask && self.localVieneuTask.isRunning) {
        [self.localVieneuTask terminate];
    }
    self.localVieneuTask = nil;
    [self dispatchEventName:@"tenglish-vieneu-daemon" payload:@{
        @"requestId": requestId,
        @"ok": @YES,
        @"running": @NO,
        @"message": @"Đã tắt tiến trình VieNeu Direct Engine cục bộ."
    } toWebView:sourceWebView];
}

// Native macOS Floating Liquid Glass Vocabulary Notification HUD
- (void)dismissVocabHud {
    [self.vocabHudTimer invalidate];
    self.vocabHudTimer = nil;
    if (self.vocabHudPanel) {
        [self.vocabHudPanel orderOut:nil];
    }
}

- (void)hudSpeakClicked:(id)sender {
    if (!self.activeHudCardId) return;
    [self dispatchEventName:@"tenglish-vocab-hud-action"
                    payload:@{@"type": @"speak", @"cardId": self.activeHudCardId}
                  toWebView:self.webView];
}

- (void)hudRememberedClicked:(id)sender {
    NSString *cid = self.activeHudCardId;
    [self dismissVocabHud];
    if (!cid) return;
    [self dispatchEventName:@"tenglish-vocab-hud-action"
                    payload:@{@"type": @"rate", @"cardId": cid, @"rating": @(3)}
                  toWebView:self.webView];
}

- (void)hudAgainClicked:(id)sender {
    NSString *cid = self.activeHudCardId;
    [self dismissVocabHud];
    if (!cid) return;
    [self dispatchEventName:@"tenglish-vocab-hud-action"
                    payload:@{@"type": @"rate", @"cardId": cid, @"rating": @(1)}
                  toWebView:self.webView];
}

- (void)hudOpenAppClicked:(id)sender {
    [self dismissVocabHud];
    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
    [self dispatchEventName:@"tenglish-vocab-hud-action"
                    payload:@{@"type": @"open", @"cardId": self.activeHudCardId ?: @""}
                  toWebView:self.webView];
}

- (void)hudCloseClicked:(id)sender {
    NSString *cid = self.activeHudCardId;
    [self dismissVocabHud];
    if (!cid) return;
    [self dispatchEventName:@"tenglish-vocab-hud-action"
                    payload:@{@"type": @"dismiss", @"cardId": cid}
                  toWebView:self.webView];
}

- (void)showNativeVocabHud:(NSDictionary *)dict {
    NSString *cardId = [dict[@"cardId"] isKindOfClass:[NSString class]] ? dict[@"cardId"] : @"";
    NSString *word = [dict[@"word"] isKindOfClass:[NSString class]] ? dict[@"word"] : @"Vocabulary";
    NSString *ipa = [dict[@"ipa"] isKindOfClass:[NSString class]] ? dict[@"ipa"] : @"";
    NSString *meaningVi = [dict[@"meaningVi"] isKindOfClass:[NSString class]] ? dict[@"meaningVi"] : @"";
    NSString *example = [dict[@"example"] isKindOfClass:[NSString class]] ? dict[@"example"] : @"";
    NSString *cefr = [dict[@"cefr"] isKindOfClass:[NSString class]] ? dict[@"cefr"] : @"B2";

    self.activeHudCardId = cardId;
    [self dismissVocabHud];

    NSScreen *screen = [NSScreen mainScreen];
    NSRect visible = screen ? screen.visibleFrame : NSMakeRect(0, 0, 1440, 900);
    CGFloat w = 368.0;
    CGFloat h = 176.0;
    NSRect frame = NSMakeRect(NSMaxX(visible) - w - 18.0, NSMaxY(visible) - h - 18.0, w, h);

    VocabHudPanel *panel = [[VocabHudPanel alloc] initWithContentRect:frame
                                                            styleMask:(NSWindowStyleMaskBorderless | NSWindowStyleMaskNonactivatingPanel)
                                                              backing:NSBackingStoreBuffered
                                                                defer:NO];
    panel.level = NSFloatingWindowLevel;
    panel.collectionBehavior = NSWindowCollectionBehaviorCanJoinAllSpaces | NSWindowCollectionBehaviorFullScreenAuxiliary;
    panel.opaque = NO;
    panel.backgroundColor = [NSColor clearColor];
    panel.hasShadow = YES;
    panel.appearance = [NSAppearance appearanceNamed:(self.lightMode ? NSAppearanceNameAqua : NSAppearanceNameDarkAqua)];

    NSVisualEffectView *bg = [[NSVisualEffectView alloc] initWithFrame:NSMakeRect(0, 0, w, h)];
    bg.material = self.lightMode ? NSVisualEffectMaterialPopover : NSVisualEffectMaterialHUDWindow;
    bg.blendingMode = NSVisualEffectBlendingModeBehindWindow;
    bg.state = NSVisualEffectStateActive;
    bg.wantsLayer = YES;
    bg.layer.cornerRadius = 18.0;
    bg.layer.masksToBounds = YES;
    bg.layer.borderWidth = 1.0;
    bg.layer.borderColor = self.lightMode
        ? [NSColor colorWithWhite:0.0 alpha:0.12].CGColor
        : [NSColor colorWithWhite:1.0 alpha:0.18].CGColor;

    // Header badge
    NSTextField *badge = [NSTextField labelWithString:[NSString stringWithFormat:@"T-English · Học Từ Vựng · %@", cefr]];
    badge.frame = NSMakeRect(16, h - 28, w - 54, 16);
    badge.font = [NSFont systemFontOfSize:11 weight:NSFontWeightSemibold];
    badge.textColor = [NSColor colorWithSRGBRed:0.22 green:0.74 blue:0.97 alpha:1.0];
    [bg addSubview:badge];

    NSButton *closeBtn = [NSButton buttonWithTitle:@"✕" target:self action:@selector(hudCloseClicked:)];
    closeBtn.frame = NSMakeRect(w - 34, h - 32, 24, 22);
    closeBtn.bezelStyle = NSBezelStyleInline;
    closeBtn.bordered = NO;
    [bg addSubview:closeBtn];

    // Word + IPA
    NSTextField *wordField = [NSTextField labelWithString:word];
    wordField.frame = NSMakeRect(16, h - 58, w - 32, 26);
    wordField.font = [NSFont systemFontOfSize:20 weight:NSFontWeightBold];
    wordField.lineBreakMode = NSLineBreakByTruncatingTail;
    [bg addSubview:wordField];

    NSTextField *ipaField = [NSTextField labelWithString:ipa];
    ipaField.frame = NSMakeRect(16, h - 76, w - 32, 16);
    ipaField.font = [NSFont monospacedSystemFontOfSize:12 weight:NSFontWeightMedium];
    ipaField.textColor = [NSColor colorWithSRGBRed:0.22 green:0.74 blue:0.97 alpha:1.0];
    [bg addSubview:ipaField];

    // Meaning VI
    NSTextField *meaningField = [NSTextField labelWithString:meaningVi];
    meaningField.frame = NSMakeRect(16, h - 102, w - 32, 22);
    meaningField.font = [NSFont systemFontOfSize:13 weight:NSFontWeightSemibold];
    meaningField.lineBreakMode = NSLineBreakByTruncatingTail;
    [bg addSubview:meaningField];

    // Example
    NSTextField *exField = [NSTextField wrappingLabelWithString:example];
    exField.frame = NSMakeRect(16, 46, w - 32, 28);
    exField.font = [NSFont systemFontOfSize:11.5 weight:NSFontWeightRegular];
    exField.textColor = [NSColor secondaryLabelColor];
    exField.maximumNumberOfLines = 2;
    exField.lineBreakMode = NSLineBreakByTruncatingTail;
    [bg addSubview:exField];

    // Action Buttons
    NSButton *speakBtn = [NSButton buttonWithTitle:@"Nghe" target:self action:@selector(hudSpeakClicked:)];
    speakBtn.frame = NSMakeRect(14, 10, 68, 28);
    speakBtn.bezelStyle = NSBezelStyleRounded;
    [bg addSubview:speakBtn];

    NSButton *againBtn = [NSButton buttonWithTitle:@"Ôn lại" target:self action:@selector(hudAgainClicked:)];
    againBtn.frame = NSMakeRect(86, 10, 72, 28);
    againBtn.bezelStyle = NSBezelStyleRounded;
    [bg addSubview:againBtn];

    NSButton *goodBtn = [NSButton buttonWithTitle:@"Đã nhớ" target:self action:@selector(hudRememberedClicked:)];
    goodBtn.frame = NSMakeRect(162, 10, 88, 28);
    goodBtn.bezelStyle = NSBezelStyleRounded;
    goodBtn.keyEquivalent = @"\r";
    [bg addSubview:goodBtn];

    NSButton *openBtn = [NSButton buttonWithTitle:@"Mở App" target:self action:@selector(hudOpenAppClicked:)];
    openBtn.frame = NSMakeRect(256, 10, 96, 28);
    openBtn.bezelStyle = NSBezelStyleRounded;
    [bg addSubview:openBtn];

    panel.contentView = bg;
    self.vocabHudPanel = panel;
    [panel orderFrontRegardless];

    self.vocabHudTimer = [NSTimer scheduledTimerWithTimeInterval:18.0
                                                          target:self
                                                        selector:@selector(dismissVocabHud)
                                                        userInfo:nil
                                                         repeats:NO];
}

- (void)userContentController:(WKUserContentController *)userContentController
      didReceiveScriptMessage:(WKScriptMessage *)message {
    if (![message.body isKindOfClass:[NSDictionary class]]) return;
    NSDictionary *dict = (NSDictionary *)message.body;
    NSString *action = dict[@"action"];

    if ([action isEqualToString:@"vieneuRequest"]) {
        [self handleNativeHttpRequest:dict eventName:@"tenglish-vieneu-response" fromWebView:message.webView];
        return;
    }

    if ([action isEqualToString:@"nativeHttpRequest"]) {
        [self handleNativeHttpRequest:dict eventName:@"tenglish-http-response" fromWebView:message.webView];
        return;
    }

    if ([action isEqualToString:@"startLocalVieneu"]) {
        [self handleStartLocalVieneu:dict fromWebView:message.webView];
        return;
    }

    if ([action isEqualToString:@"stopLocalVieneu"]) {
        [self handleStopLocalVieneu:dict fromWebView:message.webView];
        return;
    }

    if ([action isEqualToString:@"showVocabNotification"]) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [self showNativeVocabHud:dict];
        });
        return;
    }

    if ([action isEqualToString:@"saveFile"]) {
        NSString *filename = [dict[@"filename"] isKindOfClass:[NSString class]] ? dict[@"filename"] : @"export.csv";
        NSString *content = [dict[@"content"] isKindOfClass:[NSString class]] ? dict[@"content"] : @"";
        [self saveFileWithSuggestedName:filename content:content];
        return;
    }

    if ([action isEqualToString:@"stateUpdated"]) {
        if (self.popoverWebView) {
            WKWebView *other = (message.webView == self.webView) ? self.popoverWebView : self.webView;
            [other evaluateJavaScript:@"window.dispatchEvent(new CustomEvent('tenglish-sync'));" completionHandler:nil];
        }
        return;
    }

    NSString *theme = dict[@"theme"];
    NSString *glass = dict[@"glass"];
    NSString *summary = dict[@"statusSummary"];
    NSNumber *reduceNum = dict[@"reduceTransparency"];

    if ([theme isKindOfClass:[NSString class]]) {
        self.lightMode = [theme isEqualToString:@"light"];
    }
    if ([glass isKindOfClass:[NSString class]]) {
        self.glassMode = glass;
    }
    if ([reduceNum isKindOfClass:[NSNumber class]]) {
        self.userReduceTransparency = [reduceNum boolValue];
    }
    if ([summary isKindOfClass:[NSString class]] && self.statusItem.button) {
        self.statusItem.button.toolTip = [NSString stringWithFormat:@"T-English — %@", summary];
    }
    [self applyVibrancyAndAppearance];
}

// Lazy-create popoverWebView on first Menu Bar click (saves ~150MB RAM on cold launch)
- (void)ensurePopoverCreated {
    if (self.popover && self.popoverWebView) return;
    NSViewController *popVC = [[NSViewController alloc] init];
    self.popoverWebView = [[WKWebView alloc] initWithFrame:NSMakeRect(0, 0, 364, 480)
                                             configuration:[self makeSharedWebConfig]];
    self.popoverWebView.UIDelegate = self;
    [self.popoverWebView setValue:@NO forKey:@"drawsBackground"];
    [self.popoverWebView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"tenglish://app/index.html?mode=menubar"]]];
    popVC.view = self.popoverWebView;

    self.popover = [[NSPopover alloc] init];
    self.popover.contentSize = NSMakeSize(364, 480);
    self.popover.behavior = NSPopoverBehaviorTransient;
    self.popover.contentViewController = popVC;
}

- (void)togglePopover:(id)sender {
    [self ensurePopoverCreated];
    if (self.popover.isShown) {
        [self.popover performClose:sender];
    } else if (self.statusItem.button) {
        [self.popover showRelativeToRect:self.statusItem.button.bounds
                                  ofView:self.statusItem.button
                           preferredEdge:NSRectEdgeMinY];
    }
}

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    self.lightMode = NO;
    self.glassMode = @"balanced";
    self.userReduceTransparency = NO;

    // Force Dock & Command-Tab switcher to render the custom T-English AppIcon immediately
    NSString *iconPath = [[NSBundle mainBundle] pathForResource:@"AppIcon" ofType:@"icns"];
    if (iconPath) {
        NSImage *dockIcon = [[NSImage alloc] initWithContentsOfFile:iconPath];
        if (dockIcon) {
            [NSApp setApplicationIconImage:dockIcon];
        }
    }

    NSString *resourceWeb = [[NSBundle mainBundle].resourcePath stringByAppendingPathComponent:@"web"];
    self.schemeHandler = [[BundleSchemeHandler alloc] init];
    self.schemeHandler.webRoot = resourceWeb;

    NSWindowStyleMask mask = NSWindowStyleMaskTitled | NSWindowStyleMaskClosable |
                             NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable |
                             NSWindowStyleMaskFullSizeContentView;
    self.window = [[NSWindow alloc] initWithContentRect:NSMakeRect(0, 0, 1240, 840)
                                              styleMask:mask
                                                backing:NSBackingStoreBuffered
                                                  defer:NO];
    self.window.opaque = NO;
    self.window.backgroundColor = [NSColor clearColor];
    self.window.titlebarAppearsTransparent = YES;
    self.window.titleVisibility = NSWindowTitleHidden;
    self.window.movableByWindowBackground = YES;
    self.window.minSize = NSMakeSize(940, 640);
    [self.window center];

    NSView *root = self.window.contentView;
    root.wantsLayer = YES;
    root.layer.cornerRadius = 18.0;
    root.layer.masksToBounds = YES;

    self.vibrancy = [[NSVisualEffectView alloc] initWithFrame:root.bounds];
    self.vibrancy.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    self.vibrancy.blendingMode = NSVisualEffectBlendingModeBehindWindow;
    self.vibrancy.state = NSVisualEffectStateFollowsWindowActiveState;
    [root addSubview:self.vibrancy];

    self.webView = [[WKWebView alloc] initWithFrame:root.bounds configuration:[self makeSharedWebConfig]];
    self.webView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    self.webView.UIDelegate = self;
    [self.webView setValue:@NO forKey:@"drawsBackground"];
    [root addSubview:self.webView];

    NSURL *appUrl = [NSURL URLWithString:@"tenglish://app/index.html"];
    [self.webView loadRequest:[NSURLRequest requestWithURL:appUrl]];

    // Minimal monochrome template Menu Bar item (Popover lazy-loaded on demand)
    self.statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength:NSVariableStatusItemLength];
    self.statusItem.button.image = [self createTemplateSquircleLogo];
    self.statusItem.button.title = @"";
    self.statusItem.button.toolTip = @"T-English — Học Tiếng Anh & Ôn Từ Vựng Nhanh";
    self.statusItem.button.target = self;
    self.statusItem.button.action = @selector(togglePopover:);

    [[[NSWorkspace sharedWorkspace] notificationCenter]
        addObserver:self
           selector:@selector(accessibilityDisplayOptionsDidChange:)
               name:NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification
             object:nil];

    [[NSNotificationCenter defaultCenter]
        addObserver:self
           selector:@selector(windowOcclusionChanged:)
               name:NSWindowDidChangeOcclusionStateNotification
             object:self.window];

    [self applyVibrancyAndAppearance];
    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
}

- (void)applicationWillTerminate:(NSNotification *)notification {
    [self dismissVocabHud];
    if (self.localVieneuTask && self.localVieneuTask.isRunning) {
        [self.localVieneuTask terminate];
    }
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return NO;
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)sender hasVisibleWindows:(BOOL)flag {
    if (!flag) {
        [self.window makeKeyAndOrderFront:nil];
    }
    return YES;
}

@end

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        [app setActivationPolicy:NSApplicationActivationPolicyRegular];
        TEnglishAppDelegate *delegate = [[TEnglishAppDelegate alloc] init];
        app.delegate = delegate;
        [app run];
    }
    return 0;
}
