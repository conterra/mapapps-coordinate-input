# dn_coordinate_input

Lets the user paste a list of coordinates, choose how they are interpreted (points, line, polygon) and pick the
reference system they are given in.

## Usage

Add `dn_coordinate_input` to the `allowedBundles` of your app and add `coordinateInputToggleTool` to a toolset.

To enter coordinates, write them into the text field. One coordinate should be entered per lines. An error message is
shown if some lines could not be parsed - while the remaining lines are still shown on the map. The spacial reference
system can be selected below, or be determined automatically from the range of the values entered.

The geometry of the current input is shown in grey - updated on every keystroke. **Zoom to
extent** moves the map onto it. The geometry can then be added to a "Entered Coordinates" layer using the **Add**
button, where they are shown in blue. The colors can be configured (see below).

The widget shows the amount of elements added and a **Clear** button to clear the "Entered Coordinates" layer. The added
elements are not stored, so do not persist across reloades.

## Configuration

No configuration is necessary. The reference systems available and colors can be configured as follows:

```json
"dn_coordinate_input": {
    "Config": {
        "referenceSystems": [
            {
                "id": "auto"
            },
            {
                "id": "4326",
                "title": "WGS 84 (EPSG:4326)"
            },
            {
                "id": "3857",
                "title": "WGS 84 / Pseudo-Mercator (EPSG:3857)"
            },
            {
                "id": "25832",
                "title": "ETRS89 / UTM zone 32N (EPSG:25832)"
            },
            {
                "id": "25833",
                "title": "ETRS89 / UTM zone 33N (EPSG:25833)"
            }
        ],
        "sketchColor": "#5c5c5c",
        "addedColor": "#005ce6"
    }
}
```

### Reference systems

`referenceSystems` lists what the selection offers. Every entry has an `id` (a well-known spatial reference id,
or `auto` for automatic detection) and an optional `title` used as the label. Entries without a `title` show
their `id`, except for `auto`, which is labelled from the bundle i18n (`ui.referenceSystem.auto`) so that it
stays translated.

#### Automatic detection

The `auto` entry guesses the reference system from the value ranges of the entered coordinates. It only ever
picks a system that is configured (only `4326`, `25832`, `25833` and `3857` are supported for auto-selection).
The two UTM zones (`25832` and `25833`) cannot be told apart from the numbers alone. If both are configured,
zone 32N always wins over 33N. If the coordinates do not fit any known range, nothing is added.

### Symbol colours

`sketchColor` and `addedColor` set the colors the two layers are drawn in, shown above with their defaults of
grey and blue. Anything CSS accepts works, so `"rgb(0, 92, 230)"` and `"dodgerblue"` do as well.
