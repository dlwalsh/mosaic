var TILE_WIDTH = TILE_WIDTH || 16;
var TILE_HEIGHT = TILE_HEIGHT || 16;

function readFile(file, callback) {

    var reader = new FileReader();

    reader.addEventListener('load', function (event) {

        var image = new Image();
        var ctx = document.createElement('canvas').getContext('2d');
        image.src = event.target.result;

        image.addEventListener('load', function () {

            var bytes, length, i, rgbSum, avgColor;

            ctx.drawImage(image, 0, 0);
            var data = ctx.getImageData(0, 0, TILE_WIDTH, TILE_HEIGHT).data;
            var rgbSum = [0, 0, 0];

            for (i = 0; i < data.length; i += 4) {
                rgbSum[0] += data[i];
                rgbSum[1] += data[i + 1];
                rgbSum[2] += data[i + 2];
            }

            var avgColor = rgbSum.map(function (sum) {
                var average = Math.round(sum * 4 / data.length);
                return average.toString(16);
            }).join('');

            console.log(avgColor);

        });

    });

    reader.readAsDataURL(file);

}

document.addEventListener('DOMContentLoaded', function () {

    var input = document.querySelector('#imageInput');

    var displayError = (function (elem) {
        return function (msg) {
            elem.innerHTML = msg;
        };
    }(document.querySelector('#errorMessage')));

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
        readFile(files[0]);

    });

});
