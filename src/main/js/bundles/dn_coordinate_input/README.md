# dn_coordinate_input

Lets the user paste a list of coordinates, choose how they are interpreted (points, line, polygon) and pick the
reference system they are given in.

## Usage

Add `dn_coordinate_input` to the `allowedBundles` of your app and add `coordinateInputToggleTool` to a toolset.

The geometry of the current input is drawn in grey on a sketch layer and updated on every keystroke. **Zoom to
extent** moves the map onto it, and **Add** hands it over to a second layer, where it stays in blue while the
input is cleared for the next geometry.

That second layer appears in the table of contents as soon as it holds something, so it can be switched off like
any other layer, and disappears from it again once **Clear** has emptied it. It is not stored anywhere, so it is
gone on reload.

## Configuration

Configure the reference systems offered in the selection through `Config`. Every entry has an `id`
(a well-known spatial reference id, or `auto` for automatic detection) and an optional `title` used as the label:

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
                "id": "25832",
                "title": "ETRS89 / UTM zone 32N (EPSG:25832)"
            }
        ]
    }
}
```

Entries without a `title` show their `id`, except for `auto`, which is labelled from the bundle i18n
(`ui.referenceSystem.auto`) so that it stays translated.

### Automatic detection

The `auto` entry guesses the reference system from the value ranges of the entered coordinates. It only ever
picks a system that is configured, and it recognizes `4326`, `25832`, `25833` and `3857`. Anything else has to
be selected explicitly, as does a choice between systems that share a value range: the two UTM zones cannot be
told apart from the numbers alone, and the one configured first wins. Coordinates that fit no known range are
not drawn.
