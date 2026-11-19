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

@interface TEnglishAppDelegate : NSObject <NSApplicationDelegate, WKScriptMessageHandler, WKUIDelegate>
@property (nonatomic, strong) NSWindow *window;
@property (nonatomic, strong) NSVisualEffectView *vibrancy;
@property (nonatomic, strong) WKWebView *webView;
@property (nonatomic, strong) NSStatusItem *statusItem;
@property (nonatomic, strong) NSPopover *popover;
@property (nonatomic, strong) WKWebView *popoverWebView;
@property (nonatomic, strong) BundleSchemeHandler *schemeHandler;
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
    [self.popoverWebView evaluateJavaScript:js completionHandler:nil];
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

- (void)dispatchVieneuResponse:(NSDictionary *)payload toWebView:(WKWebView *)targetWebView {
    if (!targetWebView) return;
    NSError *err = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:payload options:0 error:&err];
    if (!jsonData || err) return;
    NSString *jsonStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    NSString *script = [NSString stringWithFormat:@"window.dispatchEvent(new CustomEvent('tenglish-vieneu-response', { detail: %@ }));", jsonStr];
    dispatch_async(dispatch_get_main_queue(), ^{
        [targetWebView evaluateJavaScript:script completionHandler:nil];
    });
}

- (void)handleVieneuRequest:(NSDictionary *)dict fromWebView:(WKWebView *)sourceWebView {
    NSString *requestId = [dict[@"requestId"] isKindOfClass:[NSString class]] ? dict[@"requestId"] : @"";
    NSString *urlString = [dict[@"url"] isKindOfClass:[NSString class]] ? dict[@"url"] : @"";
    NSString *method = [dict[@"method"] isKindOfClass:[NSString class]] ? dict[@"method"] : @"GET";
    NSString *token = [dict[@"token"] isKindOfClass:[NSString class]] ? dict[@"token"] : @"";
    NSString *bodyStr = [dict[@"body"] isKindOfClass:[NSString class]] ? dict[@"body"] : nil;

    NSURL *url = [NSURL URLWithString:urlString];
    NSString *scheme = url.scheme.lowercaseString;
    if (!url || (![scheme isEqualToString:@"http"] && ![scheme isEqualToString:@"https"])) {
        [self dispatchVieneuResponse:@{
            @"requestId": requestId,
            @"ok": @NO,
            @"status": @0,
            @"error": @"Invalid TTS URL scheme"
        } toWebView:sourceWebView];
        return;
    }

    NSMutableURLRequest *req = [NSMutableURLRequest requestWithURL:url
                                                       cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
                                                   timeoutInterval:15.0];
    req.HTTPMethod = method.uppercaseString;
    if (token.length > 0) {
        [req setValue:token forHTTPHeaderField:@"X-VieNeu-Studio-Token"];
        [req setValue:[NSString stringWithFormat:@"Bearer %@", token] forHTTPHeaderField:@"Authorization"];
    }
    if (bodyStr && [req.HTTPMethod isEqualToString:@"POST"]) {
        [req setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
        req.HTTPBody = [bodyStr dataUsingEncoding:NSUTF8StringEncoding];
    }

    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:req
        completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
            if (error || !response) {
                [self dispatchVieneuResponse:@{
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
            NSInteger sampleRate = sampleRateHeader ? [sampleRateHeader integerValue] : 24000;
            NSString *b64 = data ? [data base64EncodedStringWithOptions:0] : @"";

            [self dispatchVieneuResponse:@{
                @"requestId": requestId,
                @"ok": @(ok),
                @"status": @(status),
                @"contentType": contentType,
                @"sampleRate": @(sampleRate > 0 ? sampleRate : 24000),
                @"bodyBase64": b64
            } toWebView:sourceWebView];
        }];
    [task resume];
}

- (void)userContentController:(WKUserContentController *)userContentController
      didReceiveScriptMessage:(WKScriptMessage *)message {
    if (![message.body isKindOfClass:[NSDictionary class]]) return;
    NSDictionary *dict = (NSDictionary *)message.body;
    NSString *action = dict[@"action"];

    if ([action isEqualToString:@"vieneuRequest"]) {
        [self handleVieneuRequest:dict fromWebView:message.webView];
        return;
    }

    if ([action isEqualToString:@"saveFile"]) {
        NSString *filename = [dict[@"filename"] isKindOfClass:[NSString class]] ? dict[@"filename"] : @"export.csv";
        NSString *content = [dict[@"content"] isKindOfClass:[NSString class]] ? dict[@"content"] : @"";
        [self saveFileWithSuggestedName:filename content:content];
        return;
    }

    if ([action isEqualToString:@"stateUpdated"]) {
        WKWebView *other = (message.webView == self.webView) ? self.popoverWebView : self.webView;
        [other evaluateJavaScript:@"window.dispatchEvent(new CustomEvent('tenglish-sync'));" completionHandler:nil];
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

- (void)togglePopover:(id)sender {
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
    self.window = [[NSWindow alloc] initWithContentRect:NSMakeRect(0, 0, 1180, 810)
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

    // Minimal monochrome template Menu Bar item + 364px Popover
    self.statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength:NSVariableStatusItemLength];
    self.statusItem.button.image = [self createTemplateSquircleLogo];
    self.statusItem.button.title = @"";
    self.statusItem.button.toolTip = @"T-English — Quick Study & Vocabulary";
    self.statusItem.button.target = self;
    self.statusItem.button.action = @selector(togglePopover:);

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
