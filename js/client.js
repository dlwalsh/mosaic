var TILE_WIDTH = TILE_WIDTH || 16;
var TILE_HEIGHT = TILE_HEIGHT || 16;

/**
 * Listens to specified file input field element
 * and returns a promise which resolves to a File object
 */
function receiveInput(input) {

    return new Promise(function (resolve, reject) {

        input.addEventListener('change', function (event) {

            var files = input.files;

            if (!files || files.length === 0) {
                reject('No file uploaded');
            }

            if (!/^image\//.test(files[0].type)) {
                reject('File is not an image');
            }

            resolve(files[0]);

        });

    });

}

/**
 * Given a File object,
 * a promise is returned which resolves to its contents
 */
function readFile(file) {

    return new Promise(function (resolve, reject) {

        var reader = new FileReader();

        reader.addEventListener('load', function () {
            resolve(reader.result);
        });
        reader.readAsDataURL(file);

    });

}

/**
 * Given image contents,
 * a promise is returned which resolves to a HTMLImageElement
 */
function readImage(content) {

    return new Promise(function (resolve, reject) {

        var image = new Image();
        image.src = content;

        image.addEventListener('load', function () {
            resolve(image);
        });

    });

}

/**
 * Given an HTMLImageElement,
 * returns an array of promises
 * each entry containing the average hexadecimal colour of each tile
 */
function constructColorRow(image) {

    var imageData, numberOfRows, numberOfCols;

    // Need to cache width and height of original image
    // for the sake of the canvas drawn below
    imageData = canvasImageData(image, {
        tileWidth: TILE_WIDTH,
        tileHeight: TILE_HEIGHT
    });

    // Use canvas API to convert the image into RGBA bitmap

    numberOfRows = Math.ceil(image.height / TILE_HEIGHT);
    numberOfCols = Math.ceil(image.width / TILE_WIDTH);

    return Array.from(Array(numberOfRows)).map(function (row, rowNumber) {
        // Slice the image at the particular tile we desire
        // Note that the size of the slice may need to be contained
        // to ensure it doesn't go outside the bounds of the image
        return new Promise(function (resolve, reject) {
            var worker = new Worker('js/color.js');
            var colors = Array.from(Array(numberOfCols)).map(function (col, colNumber) {
                return imageData(colNumber * TILE_WIDTH, rowNumber * TILE_HEIGHT);
            });
            worker.addEventListener('message', function (event) {
                resolve(event.data);
            });
            worker.postMessage(colors);
        });
    });

}

function canvasImageData(image, options) {

    var canvas, ctx, width, height;

    width = image.width;
    height = image.height;

    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    return function (x, y) {
        return ctx.getImageData(
            x,
            y,
            Math.min(options.tileWidth, width - x),
            Math.min(options.tileHeight, height - y)
        ).data;
    };

}

/**
 * Given an array of colors,
 * each tile is fetched from the server and a promise is returned
 * that resolves to an array of tiles
 */
function fetchRow(colorRow) {
    return Promise.all(colorRow.map(fetchTile));
}

/**
 * Given a color,
 * its corresponding tile is fetched from the server,
 * a promise is return that resolves to a tile
 * (i.e. a string containing SVG markup)
 */
function fetchTile(color) {

    var url = '/color/' + color;

    return fetch(url).then(function (response) {
        return response.text();
    });

}

/**
 * Element to output messages to (e.g. errors)
 */
function createDisplayer(elem) {
    return function (msg) {
        elem.innerHTML = msg;
    };
}

/**
 * Element to output block elements to
 */
function createRowAppender(elem) {
    return function (items) {
        var div = document.createElement('div');
        div.innerHTML = Array.isArray(items) ? items.join('') : items;
        elem.appendChild(div);
    };
}

function createRowHandler(appendRow) {

    return function handleRow(colorRows) {

        // stop when there's no more rows to print
        if (colorRows.length === 0) {
            return;
        }

        // Print the color matrix, row by row
        //
        // Only fetch and print the first row,
        // recursively fetch and print the rest
        colorRows[0]
            .then(fetchRow)
            .then(function (content) {
                appendRow(content);
                handleRow(colorRows.slice(1));
            });

    };

}

document.addEventListener('DOMContentLoaded', function () {

    var input, output, displayError, appendRow;

    input = document.querySelector('#imageInput');
    output = document.querySelector('#imageOutput');
    displayError = createDisplayer(document.querySelector('#errorMessage'));
    appendRow = createRowAppender(output);

    receiveInput(input)
        .then(function (image) {
            displayError('');
            return image;
        })
        .then(readFile)
        .then(readImage)
        .then(constructColorRow)
        .then(createRowHandler(appendRow))
        .catch(displayError);

});
