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
    NSString *relPath = url.path;
    if (!relPath || relPath.length == 0 || [relPath isEqualToString:@"/"]) {
        relPath = @"/index.html";
    }
    if ([relPath hasPrefix:@"/"]) {
        relPath = [relPath substringFromIndex:1];
    }

    NSString *fullPath = [self.webRoot stringByAppendingPathComponent:relPath];
    NSFileManager *fm = [NSFileManager defaultManager];
    if (![fm fileExistsAtPath:fullPath]) {
        fullPath = [self.webRoot stringByAppendingPathComponent:@"index.html"];
    }

    NSData *data = [NSData dataWithContentsOfFile:fullPath];
    if (!data) {
        NSError *err = [NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorFileDoesNotExist userInfo:nil];
        [urlSchemeTask didFailWithError:err];
        return;
    }

    NSDictionary *headers = @{
        @"Content-Type": [self mimeTypeForPath:fullPath],
        @"Access-Control-Allow-Origin": @"*",
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
@end

@implementation TEnglishAppDelegate

- (NSImage *)createTemplateSquircleLogo {
    NSSize size = NSMakeSize(18, 18);
    NSImage *img = [[NSImage alloc] initWithSize:size];
    [img lockFocus];
    NSBezierPath *outer = [NSBezierPath bezierPathWithRoundedRect:NSMakeRect(1.5, 1.5, 15, 15) xRadius:4.2 yRadius:4.2];
    outer.lineWidth = 1.5;
    [[NSColor blackColor] setStroke];
    [outer stroke];

    NSBezierPath *tBar = [NSBezierPath bezierPath];
    [tBar moveToPoint:NSMakePoint(5.2, 12.2)];
    [tBar lineToPoint:NSMakePoint(12.8, 12.2)];
    [tBar moveToPoint:NSMakePoint(9.0, 12.2)];
    [tBar lineToPoint:NSMakePoint(9.0, 5.5)];
    tBar.lineWidth = 1.6;
    tBar.lineCapStyle = NSLineCapStyleRound;
    [tBar stroke];
    [img unlockFocus];
    [img setTemplate:YES];
    return img;
}

- (WKWebViewConfiguration *)makeSharedWebConfig {
    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    [config setURLSchemeHandler:self.schemeHandler forURLScheme:@"tenglish"];
    [config.userContentController addScriptMessageHandler:self name:@"tenglish"];
    return config;
}

- (void)applyVibrancyAndAppearance {
    BOOL sysReduce = [NSWorkspace sharedWorkspace].accessibilityDisplayShouldReduceTransparency;
    NSAppearance *appearance = [NSAppearance appearanceNamed:(self.lightMode ? NSAppearanceNameAqua : NSAppearanceNameDarkAqua)];
    [NSApp setAppearance:appearance];
    self.window.appearance = appearance;

    if (sysReduce) {
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

    NSString *js = [NSString stringWithFormat:@"document.body && document.body.classList.toggle('reduce-transparency', %@);",
                    sysReduce ? @"true" : @"false"];
    [self.webView evaluateJavaScript:js completionHandler:nil];
}

- (void)accessibilityDisplayOptionsDidChange:(NSNotification *)note {
    [self applyVibrancyAndAppearance];
}

- (void)windowOcclusionChanged:(NSNotification *)note {
    BOOL visible = (self.window.occlusionState & NSWindowOcclusionStateVisible) != 0;
    self.vibrancy.state = visible ? NSVisualEffectStateFollowsWindowActiveState : NSVisualEffectStateInactive;
}

- (void)userContentController:(WKUserContentController *)userContentController
      didReceiveScriptMessage:(WKScriptMessage *)message {
    if (![message.body isKindOfClass:[NSDictionary class]]) return;
    NSDictionary *dict = (NSDictionary *)message.body;
    NSString *theme = dict[@"theme"];
    NSString *glass = dict[@"glass"];
    NSString *summary = dict[@"statusSummary"];

    if ([theme isKindOfClass:[NSString class]]) {
        self.lightMode = [theme isEqualToString:@"light"];
    }
    if ([glass isKindOfClass:[NSString class]]) {
        self.glassMode = glass;
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
