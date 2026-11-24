// The Mechanics for Jetpack Compose (Material 3).
// Colors: TmColors.kt (generated from themes.css). Geometry and type below
// mirror src/the-mechanics/tokens.css: 1 CSS px = 1 dp, font px = sp.
// Rules that tokens cannot carry are in DESIGN.md and android/README.md.
package themechanics.compose

import android.content.res.AssetManager
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

// ------------------------------------------------- geometry (all themes)

/** Theme-independent sizes. Themes never change geometry. */
object TmDimens {
    // Border width per hierarchy level (color in parentheses).
    val bw1 = 2.dp          // Level 1: app region, top bar, screen frame (line1)
    val bw2 = 1.dp          // Level 2: functional panel, table (line2)
    val bw3 = 1.dp          // Level 3: nested record, row separator (line3)
    val bwControl = 2.dp    // buttons, fields, checkboxes are drawn in ink
    val bwFocus = 2.dp

    val radiusRegion = 0.dp
    val radiusPanel = 0.dp
    val radiusControl = 2.dp   // controls, badges, inputs
    val radiusOverlay = 3.dp   // menus, dialogs, sheets

    // 4 dp rhythm
    val space0_5 = 2.dp; val space1 = 4.dp; val space1_5 = 6.dp; val space2 = 8.dp
    val space3 = 12.dp; val space4 = 16.dp; val space5 = 20.dp; val space6 = 24.dp
    val space8 = 32.dp; val space10 = 40.dp; val space12 = 48.dp; val space16 = 64.dp

    // Visual control heights. On touch screens keep a 48 dp hit area
    // around them (Modifier.minimumInteractiveComponentSize()).
    val controlSm = 28.dp; val controlMd = 32.dp; val controlLg = 40.dp
    val controlPadXSm = 8.dp; val controlPadXMd = 12.dp; val controlPadXLg = 16.dp
    val checkSize = 18.dp; val switchW = 32.dp; val switchH = 18.dp

    val iconSm = 14.dp; val iconMd = 16.dp; val iconLg = 20.dp

    // Density: compact rows on desktop, comfortable is the phone default.
    val rowCompact = 32.dp; val rowComfortable = 40.dp
    val cellPadX = 10.dp; val panelPad = 12.dp; val regionPad = 16.dp
    val gapPanel = 12.dp; val gapRegion = 16.dp
    val toolbarH = 44.dp; val topbarH = 48.dp

    // Selection block: container edge → 4 → 2 dp frame → 8 → text.
    val selectInset = 4.dp; val selectPad = 8.dp
    val selectInsetY = 2.dp; val selectPadY = 4.dp

    // Hard shadows (no blur): raised 2/2, overlay 4/4, focus lift 3/3 in ink.
    val shadowRaised = 2.dp; val shadowOverlay = 4.dp; val focusLift = 3.dp

    // Motion in ms. Use 0 when the system disables animations.
    const val durFast = 90; const val durBase = 150; const val durSlow = 240
}

// ------------------------------------------------------------- typography

/** IBM Plex from assets/the-mechanics/fonts (SIL OFL 1.1). */
@Immutable
class TmFonts(val sans: FontFamily, val mono: FontFamily) {
    companion object {
        private const val DIR = "the-mechanics/fonts"
        private val weights = listOf(
            "Regular" to FontWeight.Normal, "Medium" to FontWeight.Medium,
            "SemiBold" to FontWeight.SemiBold, "Bold" to FontWeight.Bold,
        )
        fun fromAssets(assets: AssetManager) = TmFonts(
            sans = FontFamily(weights.map { (n, w) -> Font("$DIR/IBMPlexSans-$n.ttf", assets, w) }),
            mono = FontFamily(weights.map { (n, w) -> Font("$DIR/IBMPlexMono-$n.ttf", assets, w) }),
        )
        /** Platform fallback when the font assets are not packaged. */
        val System = TmFonts(FontFamily.SansSerif, FontFamily.Monospace)
    }
}

/**
 * Type roles outside Material's Typography. Rules (DESIGN.md): titles are
 * Plex Mono bold; uppercase eyebrows and badges are mono with 0.08em
 * tracking; numbers, sizes, counts, codes and hashes are mono.
 */
@Immutable
class TmTextStyles(
    val numeric: TextStyle,     // values in rows and tables
    val kpi: TextStyle,         // large standalone values
    val eyebrow: TextStyle,     // UPPERCASE small labels (call .uppercase() on the text)
    val badge: TextStyle,       // badge / status text
    val code: TextStyle,        // codes, hashes, ids
)

// Scale: 2xs 11 · xs 12 · sm 13 · md 14 · lg 16 · xl 18 · 2xl 22 · 3xl 28 · 4xl 40
private fun style(family: FontFamily, size: Int, weight: FontWeight, lineHeight: Double, tracking: Double = 0.0) =
    TextStyle(fontFamily = family, fontSize = size.sp, fontWeight = weight,
              lineHeight = lineHeight.em, letterSpacing = tracking.em)

fun tmTypography(f: TmFonts) = Typography(
    displayLarge   = style(f.mono, 40, FontWeight.Bold, 1.15, -0.02),
    displayMedium  = style(f.mono, 28, FontWeight.Bold, 1.15, -0.02),
    displaySmall   = style(f.mono, 22, FontWeight.Bold, 1.15),
    headlineLarge  = style(f.mono, 28, FontWeight.Bold, 1.15, -0.02),  // screen title
    headlineMedium = style(f.mono, 22, FontWeight.Bold, 1.15),         // h2
    headlineSmall  = style(f.mono, 18, FontWeight.Bold, 1.3),          // h3
    titleLarge     = style(f.mono, 16, FontWeight.Bold, 1.3),          // region / top bar title
    titleMedium    = style(f.mono, 14, FontWeight.SemiBold, 1.3),      // panel title
    titleSmall     = style(f.mono, 13, FontWeight.SemiBold, 1.3),      // nested group / record title
    bodyLarge      = style(f.sans, 16, FontWeight.Normal, 1.65),       // prose
    bodyMedium     = style(f.sans, 14, FontWeight.Normal, 1.4),        // phone UI body
    bodySmall      = style(f.sans, 13, FontWeight.Normal, 1.4),        // dense rows, metadata
    labelLarge     = style(f.sans, 14, FontWeight.Medium, 1.3),        // button text
    labelMedium    = style(f.sans, 12, FontWeight.Medium, 1.3),        // table headers, meta
    labelSmall     = style(f.mono, 11, FontWeight.SemiBold, 1.3, 0.08),// eyebrow
)

fun tmTextStyles(f: TmFonts) = TmTextStyles(
    numeric = style(f.mono, 13, FontWeight.Medium, 1.4),
    kpi     = style(f.mono, 22, FontWeight.SemiBold, 1.15),
    eyebrow = style(f.mono, 11, FontWeight.SemiBold, 1.3, 0.08),
    badge   = style(f.mono, 11, FontWeight.Medium, 1.3, 0.04),
    code    = style(f.mono, 13, FontWeight.Normal, 1.4),
)

// ----------------------------------------------------------------- shapes

val TmShapes = Shapes(
    extraSmall = RoundedCornerShape(TmDimens.radiusControl),  // fields, chips, badges
    small      = RoundedCornerShape(TmDimens.radiusControl),  // buttons
    medium     = RoundedCornerShape(TmDimens.radiusOverlay),  // menus
    large      = RoundedCornerShape(TmDimens.radiusOverlay),  // sheets
    extraLarge = RoundedCornerShape(TmDimens.radiusOverlay),  // AlertDialog
)

// ---------------------------------------------------- Material 3 mapping

/** Maps The Mechanics roles onto Material 3 so stock components follow the theme. */
fun TmColors.toMaterialColorScheme() = (if (isDark) darkColorScheme() else lightColorScheme()).copy(
    primary = accent, onPrimary = accentText,
    primaryContainer = accentSoft, onPrimaryContainer = text,
    inversePrimary = accentSoft,
    secondary = link, onSecondary = textInverse,
    secondaryContainer = selectBg, onSecondaryContainer = text,
    tertiary = info, onTertiary = textInverse,
    tertiaryContainer = infoSoft, onTertiaryContainer = text,
    background = canvas, onBackground = text,
    surface = surface, onSurface = text,
    surfaceVariant = sunken, onSurfaceVariant = text2,
    surfaceTint = Color.Transparent,                 // no tonal elevation tint
    surfaceBright = surfaceAlt, surfaceDim = canvas,
    surfaceContainerLowest = inset, surfaceContainerLow = sunken,
    surfaceContainer = surface, surfaceContainerHigh = head2,
    surfaceContainerHighest = head1,
    inverseSurface = inverse, inverseOnSurface = textInverse,
    outline = line2, outlineVariant = line3,
    error = danger, onError = textInverse,
    errorContainer = dangerSoft, onErrorContainer = text,
    scrim = backdrop,
)

// ------------------------------------------------------------- tones

/** State tones: text/icon color, soft fill, border line. */
enum class TmTone { Neutral, Success, Warning, Danger, Info, Pending, Offline, Accent }

@Immutable
data class TmToneColors(val fg: Color, val soft: Color, val line: Color)

fun TmColors.tone(t: TmTone) = when (t) {
    TmTone.Neutral -> TmToneColors(neutral, neutralSoft, neutralLine)
    TmTone.Success -> TmToneColors(success, successSoft, successLine)
    TmTone.Warning -> TmToneColors(warning, warningSoft, warningLine)
    TmTone.Danger  -> TmToneColors(danger, dangerSoft, dangerLine)
    TmTone.Info    -> TmToneColors(info, infoSoft, infoLine)
    TmTone.Pending -> TmToneColors(pending, pendingSoft, pendingLine)
    TmTone.Offline -> TmToneColors(offline, offlineSoft, offlineLine)
    TmTone.Accent  -> TmToneColors(text, accentSoft, selectLine)
}

// ------------------------------------------------------------- entry point

val LocalTmColors = staticCompositionLocalOf { TmLightColors }
val LocalTmTextStyles = staticCompositionLocalOf { tmTextStyles(TmFonts.System) }

/** Access: `Tm.colors.line2`, `Tm.text.numeric`, `TmDimens.bw1`. */
object Tm {
    val colors: TmColors @Composable @ReadOnlyComposable get() = LocalTmColors.current
    val text: TmTextStyles @Composable @ReadOnlyComposable get() = LocalTmTextStyles.current
}

fun tmColorsFor(theme: TmThemeName) = when (theme) {
    TmThemeName.Light -> TmLightColors
    TmThemeName.Dark -> TmDarkColors
    TmThemeName.Coffee -> TmCoffeeColors
}

/**
 * Wrap the app content. Light/Dark follow the system by default; Coffee is
 * an explicit user choice. Pass `fonts = TmFonts.System` if the font assets
 * are not packaged.
 */
@Composable
fun TheMechanicsTheme(
    theme: TmThemeName = if (isSystemInDarkTheme()) TmThemeName.Dark else TmThemeName.Light,
    fonts: TmFonts? = null,
    content: @Composable () -> Unit,
) {
    val assets = LocalContext.current.assets
    val f = fonts ?: remember(assets) { TmFonts.fromAssets(assets) }
    val colors = tmColorsFor(theme)
    val typography = remember(f) { tmTypography(f) }
    val textStyles = remember(f) { tmTextStyles(f) }
    CompositionLocalProvider(LocalTmColors provides colors, LocalTmTextStyles provides textStyles) {
        MaterialTheme(
            colorScheme = colors.toMaterialColorScheme(),
            typography = typography,
            shapes = TmShapes,
            content = content,
        )
    }
}

// ------------------------------------------------------------- modifiers

/** Hard, unblurred offset shadow (CSS --tm-shadow-raised / -overlay, focus lift). */
fun Modifier.tmHardShadow(color: Color, offset: Dp = TmDimens.shadowRaised) = drawBehind {
    val o = offset.toPx()
    drawRect(color, topLeft = Offset(o, o), size = size)
}
