# mapapps-coordinate-input

This bundle lets the user paste a list of coordinates, choose how they are interpreted (points, line, polygon) and pick the
reference system they are given in.

![Screenshot App](https://github.com/conterra/mapapps-coordinate-input/blob/main/screenshot.png)

## Software Requirements

- Java >= 17
- Maven >= 3.8.0
- pnpm >= 10.18.3

## Quick start

Clone this project and ensure that you have all required dependencies installed correctly (see [Documentation](https://docs.conterra.de/en/mapapps/latest/developersguide/getting-started/set-up-development-environment.html)).

Then run the following commands from the project root directory to start a local development server:

```bash
# install all required node modules
$ mvn initialize

# start dev server
$ mvn compile -Denv=dev -Pinclude-mapapps-deps

# run unit tests
$ mvn test -P run-js-tests,include-mapapps-deps
```

To execute the tests in your browser, open <http://localhost:9090/js/tests/runTests.html> (may be on a different port depending on your configuration).

For more details refer to the [Developer's Guide](https://docs.conterra.de/en/mapapps/latest/developersguide/getting-started/).
