# The Mechanics for Android (Jetpack Compose)

This is a source drop-in of The Mechanics themes for Jetpack Compose and Material 3. Add this repository to an Android project and point two Gradle source directories at it. You don't copy any files.

```
android/
  kotlin/themechanics/compose/
    TmColors.kt             GENERATED from src/the-mechanics/themes.css (do not edit)
    TheMechanicsTheme.kt    geometry, typography, shapes, Material 3 mapping, tones, entry point
  assets/the-mechanics/fonts/
    IBMPlexSans-{Regular,Medium,SemiBold,Bold}.ttf
    IBMPlexMono-{Regular,Medium,SemiBold,Bold}.ttf
    IBMPlexSans-LICENSE.txt, IBMPlexMono-LICENSE.txt   (SIL OFL 1.1)
```

Package: `themechanics.compose`. The CSS is the source of truth. The Kotlin colors are generated from it, and the geometry and type mirror `src/the-mechanics/tokens.css`, with 1 CSS px = 1 dp and font px = sp.

## 1. Add the repository

As a git submodule, pinned to a release tag:

```sh
git submodule add https://github.com/hipotures/the-mechanics.git third_party/the-mechanics
git -C third_party/the-mechanics checkout v0.1.11   # or the release you want
git add .gitmodules third_party/the-mechanics
```

To update later, run `git -C third_party/the-mechanics fetch --tags && git -C third_party/the-mechanics checkout <new tag>` and commit the new submodule pointer. The release notes are in `docs/releases/`.

## 2. Wire the sources (app `build.gradle.kts`)

```kotlin
android {
    sourceSets {
        getByName("main") {
            java.srcDir("$rootDir/third_party/the-mechanics/android/kotlin")   // Kotlin sources
            assets.srcDir("$rootDir/third_party/the-mechanics/android/assets") // fonts
        }
    }
}
```

The required dependencies are the ones a Compose app already has: `androidx.compose.ui`, `androidx.compose.foundation` and `androidx.compose.material3` (1.2 or later, for the `surfaceContainer*` roles). Nothing else is required.

To skip packaging the fonts (about 1.5 MB), leave out the `assets.srcDir` line and pass `fonts = TmFonts.System`. The platform sans and mono then stand in for IBM Plex.

## 3. Use it

```kotlin
setContent {
    val theme by settings.theme.collectAsState()   // TmThemeName? (null = follow system)
    TheMechanicsTheme(theme = theme ?: if (isSystemInDarkTheme()) TmThemeName.Dark else TmThemeName.Light) {
        App()
    }
}
```

- Stock Material 3 components (`Text`, `AlertDialog`, `IconButton`, `LazyColumn`, menus, switches) pick up the colors, sharp shapes and typography automatically.
- In your own components, read the tokens directly: `Tm.colors.line2`, `Tm.colors.head2`, `Tm.text.numeric`, `TmDimens.bw1`, `Tm.colors.tone(TmTone.Success)`.
- Light and Dark can follow the system. Coffee is a dark theme the user picks explicitly.
- System bars: `enableEdgeToEdge(statusBarStyle = if (c.isDark) SystemBarStyle.dark(c.chrome.toArgb()) else SystemBarStyle.light(c.chrome.toArgb(), c.text.toArgb()))`.
- Splash screen (XML, before Compose runs): set `windowSplashScreenBackground` to `#DCD9CF` (Light canvas) in `values-v31/themes.xml` and to `#26292C` (Dark canvas) in `values-night-v31/themes.xml`. The splash screen can't know about Coffee.

## 4. Rules the tokens can't carry

The full rules are in [`DESIGN.md`](../DESIGN.md). These are the ones that matter most on a phone:

**Three-level hierarchy.** A nested header never competes with its parent.

| Level | What | Border | Header band |
|---|---|---|---|
| 1 | app region: top bar, screen frame, status bar | `TmDimens.bw1` (2 dp) in `line1` | `head1` / `chrome` |
| 2 | functional panel, list, table | `bw2` (1 dp) in `line2` | `head2` |
| 3 | nested group, record, row separator | `bw3` (1 dp) in `line3` | `sunken` |

**Surfaces.** `canvas` is the page background. `chrome` is the app shell (top bar, bottom bar). `surface` is the panel body. `inset` is used for text-field and code wells. Avoid a white-on-white light theme or a near-black dark one; the tokens already prevent that.

**Controls.** Controls have a 2 dp `ink` frame, a 2 dp radius and a `surface` fill. The primary action is filled with `accent`, with `accentText` on top. Hover and press use `head1` and `sunken`. Pressed and selected states also have `hover`, `press`, `selectBg` and `selectLine`. The visual height is `controlMd` (32 dp) or `controlLg` (40 dp). The touch target stays at 48 dp or more (`Modifier.minimumInteractiveComponentSize()`).

**Focus.** There is no blue ring. Focus is drawn in `ink` as a hard 3 dp "lift" shadow (`Modifier.tmHardShadow(Tm.colors.focus, TmDimens.focusLift)`) or as a 2 dp item frame.

**Badges vs. status plates.**
- *Badge:* a status inside a list row or a line of text, such as LOCAL / SYNCED / REMOTE. It uses the tone `soft` fill, a 1 dp tone `line` border and tone `fg` text in `Tm.text.badge`, with a 2 dp radius. A sensible mapping is LOCAL → `Neutral`, SYNCED → `Success`, REMOTE → `Info`, in progress → `Pending`, failed → `Danger`.
- *Status plate:* a standalone status in a top bar, panel head or KPI tile, such as the result of the last sync. It has control height, an `ink` frame and a `surface` fill, and shows the state with a small mark: ✓ complete, dot active, triangle warning, ring pending.

**Typography.** Titles use Plex Mono bold (`titleLarge` / `titleMedium` / `titleSmall`). Small uppercase eyebrows use `labelSmall` with 0.08em tracking. Numbers, sizes, counts, codes and hashes are mono (`Tm.text.numeric` / `Tm.text.code`). Body text is Plex Sans: `bodyMedium` is 14 sp on a phone, and `bodySmall` (13 sp) is for dense rows.

**No soft elevation.** Use `tonalElevation = 0.dp` and `shadowElevation = 0.dp`. Menus, dialogs and sheets get a hard offset shadow (`tmHardShadow(Tm.colors.shadowOverlay, TmDimens.shadowOverlay)`) or just a 2 dp `line1` frame.

**Progress.** Use `LinearProgressIndicator(color = accent, trackColor = line3)` with square ends (`strokeCap = StrokeCap.Butt`) and no gap or stop indicator.

**Icons.** Material Icons *Outlined* at `iconLg` (20 dp), tinted `text2`, or the tone `fg` when they carry state.

**Motion.** Use `durFast`, `durBase` and `durSlow` with no bounce. Respect the system "remove animations" setting.

### Known gaps vs. the web version

- The Material 3 `Switch` thumb and track are always rounded. Recoloring it is fine, but a fully faithful switch needs a custom component.
- There are no ready-made Compose components such as Panel, Button or Badge. This module ships tokens, theme and helpers only. Build components in the app with the rules above.
- Charts: use `chart1`…`chart8`, `chartGrid`, `chartAxis` and `chartFillOpacity` in any Compose chart library.

## 5. Regenerating (maintainers)

Run `corepack pnpm build:compose` after changing `src/the-mechanics/themes.css`. `corepack pnpm build` runs it too. The generator is `scripts/build-compose.mjs`, and it fails if the three themes don't define the same tokens. If you change `tokens.css`, update `TheMechanicsTheme.kt` by hand.

## Licenses

- Kotlin sources: the repository [LICENSE](../LICENSE).
- IBM Plex Sans / Mono 1.1.0 TTF, unmodified, from the official [IBM/plex releases](https://github.com/IBM/plex/releases) (`@ibm/plex-sans@1.1.0`, `@ibm/plex-mono@1.1.0`): SIL Open Font License 1.1, see the bundled license files.
