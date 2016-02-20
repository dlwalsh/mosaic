var TILE_WIDTH = TILE_WIDTH || 16;
var TILE_HEIGHT = TILE_HEIGHT || 16;

/**
 * Listens to specified file input field element
 * and returns a promise which resolves to a File object
 */
function receiveInput(input) {

    var promise = new Promise(function (resolve, reject) {

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

    return promise;

}

/**
 * Given a File object,
 * a promise is returned which resolves to its contents
 */
function readFile(file) {

    var reader, promise;

    reader = new FileReader();

    promise = new Promise(function (resolve, reject) {

        reader.addEventListener('load', function (event) {

            resolve(reader.result);

        });

    });

    reader.readAsDataURL(file);

    return promise;

}

/**
 * Given image contents,
 * a promise is returned which resolves to a HTMLImageElement
 */
function readImage(content) {

    var promise, image;

    image = new Image();
    image.src = content;

    promise = new Promise(function (resolve, reject) {

        image.addEventListener('load', function (event) {

            resolve(image);

        });

    });

    return promise;

}

/**
 * Given an HTMLImageElement,
 * returns an array of promises
 * each entry containing the average hexadecimal colour of each tile
 */
function constructColorRow(image) {

    var canvas, ctx, matrix, width, height,
        promiseArray, numberOfRows, numberOfCols;

    // Need to cache width and height of original image
    // for the sake of the canvas drawn below
    width = image.width;
    height = image.height;

    // Use canvas API to convert the image into RGBA bitmap

    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    numberOfRows = Math.ceil(height / TILE_HEIGHT);
    numberOfCols = Math.ceil(width / TILE_WIDTH);

    return Array.from(Array(numberOfRows)).map(function (row, rowNumber) {
        // Slice the image at the particular tile we desire
        // Note that the size of the slice may need to be contained
        // to ensure it doesn't go outside the bounds of the image
        return new Promise(function (resolve, reject) {
            var worker = new Worker('js/color.js');
            var colors = Array.from(Array(numberOfCols)).map(function (col, colNumber) {
                var x = colNumber * TILE_WIDTH,
                    y = rowNumber * TILE_HEIGHT;
                return ctx.getImageData(
                    x,
                    y,
                    Math.min(TILE_WIDTH, width - x),
                    Math.min(TILE_HEIGHT, height - y)
                ).data;
            });
            worker.addEventListener('message', function (event) {
                resolve(event.data);
            });
            worker.postMessage(colors);
        });
    });

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
        //.catch(displayError);

});
