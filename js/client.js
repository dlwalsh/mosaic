var TILE_WIDTH = TILE_WIDTH || 16;
var TILE_HEIGHT = TILE_HEIGHT || 16;

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

function constructColorMatrix(image) {

    var width, height, promise;

    width = image.width;
    height = image.height;

    promise = new Promise(function (resolve, reject) {

        image.addEventListener('load', function (event) {

            var canvas, ctx, x, y, row, matrix;

            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            matrix = [];

            for (y = 0; y < height; y += TILE_HEIGHT) {
                row = [];
                for (x = 0; x < width; x += TILE_WIDTH) {
                    row.push(averageColor(
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

function fetchRow(colorRow) {

    var promises = colorRow.map(fetchTile);

    return Promise.all(promises);

}

function fetchTile(color) {

    var url = '/color/' + color;

    return fetch(url).then(function (response) {
        return response.text();
    });

}

function averageColor(bytes) {

    var rgbSum, i,
        INCREMENT = 4;

    if (bytes.length % INCREMENT !== 0) { // Must be a sequence of quadruples (R, G, B, A)
        throw Error('Pixel bytes not a multiple of four');
    }

    rgbSum = [0, 0, 0];

    for (i = 0; i < bytes.length; i += INCREMENT) {
        rgbSum[0] += bytes[i];
        rgbSum[1] += bytes[i + 1];
        rgbSum[2] += bytes[i + 2];
    }

    return rgbSum.map(function (sum) {
        var average = Math.round(sum * INCREMENT / bytes.length);
        var hex = average.toString(16);
        return average <= 0x0F ? '0' + hex : hex;
    }).join('');

}

function createDisplayer(elem) {
    return function (msg) {
        elem.innerHTML = msg;
    };
}

function createRowAdder(elem) {

    var cache, nextRow, appendRow;

    cache = [];
    nextRow = 0;

    appendRow = function (content) {
        var div = document.createElement('div');
        div.innerHTML = Array.isArray(content) ? content.join('') : content;
        elem.appendChild(div);
    };

    return function (content, rowNumber) {

        cache[rowNumber] = content;

        if (rowNumber === nextRow) {

            while (cache[nextRow]) {
                appendRow(cache[nextRow]);
                nextRow += 1;
            }

        }

    };

}

document.addEventListener('DOMContentLoaded', function () {

    var input, output, displayError, addRow;

    input = document.querySelector('#imageInput');
    output = document.querySelector('#imageOutput');
    displayError = createDisplayer(document.querySelector('#errorMessage'));

    receiveInput(input)
        .then(function (image) {
            addRow = createRowAdder(output);
            displayError('');
            return image;
        })
        .then(readImage)
        .then(constructColorMatrix)
        .then(function (colorMatrix) {
            colorMatrix.forEach(function (row, index) {
                fetchRow(row).then(function (tiles) {
                    addRow(tiles, index);
                });
            });
        })
        .catch(function (error) {
            displayError(error);
        });

});
