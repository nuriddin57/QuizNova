# QuizNova Logo Assets

Original mascot-style logo system for **QuizNova** (copyright-safe, Blooket-inspired mood only).

## Files

- `quiznova-icon.svg` - icon-only mascot (light/dark friendly)
- `quiznova-icon-dark.svg` - icon-only variant tuned for dark backgrounds
- `quiznova-icon-curious.svg` - mascot expression variant (curious)
- `quiznova-icon-confident.svg` - mascot expression variant (confident)
- `quiznova-logo-horizontal.svg` - icon + text horizontal logo
- `quiznova-logo-stacked.svg` - icon + text stacked logo

## Brand Name Swap

In the logo SVGs, change the `<text id="brand-name">QuizNova</text>` node.

## PNG Export (Transparent)

Use either tool below (if installed):

### Inkscape

```powershell
inkscape .\quiznova-logo-horizontal.svg --export-type=png --export-filename=.\quiznova-logo-horizontal.png
inkscape .\quiznova-logo-stacked.svg --export-type=png --export-filename=.\quiznova-logo-stacked.png
inkscape .\quiznova-icon.svg --export-type=png --export-filename=.\quiznova-icon.png
```

### ImageMagick (SVG delegate required)

```powershell
magick .\quiznova-logo-horizontal.svg .\quiznova-logo-horizontal.png
magick .\quiznova-logo-stacked.svg .\quiznova-logo-stacked.png
magick .\quiznova-icon.svg .\quiznova-icon.png
```

