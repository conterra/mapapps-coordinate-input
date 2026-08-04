# dn_coordinate_input

Lets the user paste a list of coordinates, choose how they are interpreted (points, line, polygon) and pick the
reference system they are given in.

## Usage

Add `dn_coordinate_input` to the `allowedBundles` of your app and add `coordinateInputToggleTool` to a toolset.

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
