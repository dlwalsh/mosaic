# Mosaic

## Usage

To run the app, you must have a Node environment. From the command line, execute:

    npm start

Then go to http://localhost:8765/

Provide an image for the file input. Acceptable formats include png, jpg and non-animated gif files.

Watch as the mosaic is painted, row by row.

## Known Limitations

If you want to upload another image, you'll need to refresh the page first. (TODO: Put in a reset button to obviate the need for this.)

The UI is very basic. It's just an unstyled input field.

The app is NOT responsive. Your window needs to be at least as wide as the image itself.

## Tests

No automated tests have been written for this app. However, the functions have been deliberately kept small and modular to allow for the possibility of future unit tests.

The application was developed and tested on the latest version of Chrome. No other browsers have been tested.
