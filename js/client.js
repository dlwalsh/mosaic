var TILE_WIDTH = TILE_WIDTH || 16;
var TILE_HEIGHT = TILE_HEIGHT || 16;

function readImage(file, callback) {

    var reader = new FileReader();

    reader.addEventListener('load', function (readerEvent) {

        var image = new Image();
        image.src = readerEvent.target.result;

        image.addEventListener('load', function (imageEvent) {

            var ctx, h, w, img, row, matrix;

            img = imageEvent.target;
            ctx = document.createElement('canvas').getContext('2d');
            ctx.drawImage(img, 0, 0);

            matrix = [];

            for (w = 0; w < img.width; w += TILE_WIDTH) {
                row = [];
                for (h = 0; h < img.height; h += TILE_HEIGHT) {
                    row.push(averageColor(ctx.getImageData(w, h, TILE_WIDTH, TILE_HEIGHT).data));
                }
                matrix.push(row);
            }

            callback(matrix);

        });

    });

    reader.readAsDataURL(file);

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
        return average < 0x0F ? '0' + hex : hex;
    }).join('');

}

function createDisplayer(elem) {
    return function (msg) {
        elem.innerHTML = msg;
    };
}

document.addEventListener('DOMContentLoaded', function () {

    var input = document.querySelector('#imageInput');
    var displayError = createDisplayer(document.querySelector('#errorMessage'));

    input.addEventListener('change', function (event) {

        var files = event.target.files;

        if (!files || files.length === 0) {
            displayError('No file uploaded');
            return;
        }

        if (!/^image\//.test(files[0].type)) {
            displayError('File is not an image');
            return;
        }

        displayError('');
        readImage(files[0], function (colorMatrix) {
            console.log(colorMatrix);
        });

    });

});
