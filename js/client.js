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
 * Given an File object,
 * a promise is returned which resolves to a HTMLImageElement
 */
function readImage(file) {

    var reader, promise;

    reader = new FileReader();

    promise = new Promise(function (resolve, reject) {

        reader.addEventListener('load', function (event) {

            var image = new Image();
            image.src = reader.result;

            resolve(image);

        });

    });

    reader.readAsDataURL(file);

    return promise;

}

/**
 * Given an HTMLImageElement,
 * a promise is returned which resolves to a two-dimensional array,
 * each entry containing the average hexadecimal colour of each tile
 */
function constructColorMatrix(image) {

    var width, height, promise;

    // Need to cache width and height of original image
    // for the sake of the canvas drawn below
    width = image.width;
    height = image.height;

    promise = new Promise(function (resolve, reject) {

        image.addEventListener('load', function (event) {

            var canvas, ctx, x, y, row, matrix;

            // Use canvas API to convert the image into RGBA bitmap

            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            // Construct a 2d array of colours
            matrix = [];

            for (y = 0; y < height; y += TILE_HEIGHT) {
                row = [];
                for (x = 0; x < width; x += TILE_WIDTH) {
                    row.push(averageColor(
                        // Slice the image at the particular tile we desire
                        // Note that the size of the slice may need to be contained
                        // to ensure it doesn't go outside the bounds of the image
                        ctx.getImageData(
                            x, y,
                            Math.min(TILE_WIDTH, width - x),
                            Math.min(TILE_HEIGHT, height - y)
                        ).data
                    ));
                }
                matrix.push(row);
            }

            resolve(matrix);

        });

    });

    return promise;

}

/**
 * Given an array of colors,
 * each tile is fetched from the server and a promise is returned
 * that resolves to an array of tiles
 */
function fetchRow(colorRow) {

    var promises = colorRow.map(fetchTile);

    return Promise.all(promises);

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
 * Given an array of bytes,x
 */
function averageColor(bytes) {

    var rgbSum, i,
        INCREMENT = 4;

    if (bytes.length % INCREMENT !== 0) { // Must be a sequence of quadruples (R, G, B, A)
        throw Error('Pixel bytes not a multiple of four');
    }

    // Sum each of the primary colors: red, green and blue
    rgbSum = [0, 0, 0];

    for (i = 0; i < bytes.length; i += INCREMENT) {
        rgbSum[0] += bytes[i];
        rgbSum[1] += bytes[i + 1];
        rgbSum[2] += bytes[i + 2];
    }

    // Converts three sums to a single average string
    return rgbSum.map(function (sum) {
        var average = Math.round(sum * INCREMENT / bytes.length);
        var hex = average.toString(16); // convert to hexadecimal
        return average <= 0x0F ? '0' + hex : hex; // add leading zero if necessary
    }).join('');

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

document.addEventListener('DOMContentLoaded', function () {

    var input, output, displayError, appendRow;

    input = document.querySelector('#imageInput');
    output = document.querySelector('#imageOutput');
    displayError = createDisplayer(document.querySelector('#errorMessage'));

    receiveInput(input)
        .then(function (image) {
            appendRow = createRowAppender(output);
            displayError('');
            return image;
        })
        .then(readImage)
        .then(constructColorMatrix)
        .then(function handleRow(colorMatrix) {

            // stop when there's now more rows to print
            if (colorMatrix.length === 0) {
                return;
            }

            // Print the color matrix, row by row
            //
            // Only fetch and print the first row,
            // recursively fetch and print the rest
            fetchRow(colorMatrix[0]).then(function (content) {
                appendRow(content);
                handleRow(colorMatrix.slice(1));
            });

        })
        .catch(displayError);

});
