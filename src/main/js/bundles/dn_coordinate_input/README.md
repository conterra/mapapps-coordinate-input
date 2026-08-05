# dn_coordinate_input

Lets the user paste a list of coordinates, choose how they are interpreted (points, line, polygon) and pick the
reference system they are given in.

## Usage

Add `dn_coordinate_input` to the `allowedBundles` of your app and add `coordinateInputToggleTool` to a toolset.

The geometry of the current input is shown in grey - updated on every keystroke. **Zoom to
extent** moves the map onto it. The geometry can then be added to a "Entered Coordinates" layer using the **Add**
button, where they are shown in blue. The colors can be configured (see below).

The widget shows the amount of elements added and a **Clear** button to clear the "Entered Coordinates" layer. The added
elements are not stored, so do not persist across reloades.

## Configuration

Everything is configured through `Config`:

```json
"dn_coordinate_input": {
    "Config": {
        "referenceSystems": [
            { "id": "auto" },
            { "id": "4326", "title": "WGS 84 (EPSG:4326)" },
            { "id": "25832", "title": "ETRS89 / UTM zone 32N (EPSG:25832)" }
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
picks a system that is configured, and it recognizes `4326`, `25832`, `25833` and `3857`. Anything else has to
be selected explicitly, as does a choice between systems that share a value range: the two UTM zones cannot be
told apart from the numbers alone, and the one configured first wins. Coordinates that fit no known range are
not drawn.


### Symbol colours

`sketchColor` and `addedColor` set the colors the two layers are drawn in, shown above with their defaults of
grey and blue. Anything CSS accepts works, so `"rgb(0, 92, 230)"` and `"dodgerblue"` do as well.
