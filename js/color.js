/*eslint-env serviceworker */

/**
 * Given an array of bytes,
 * determine the average color
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

self.addEventListener('message', function (event) {
    if (Array.isArray(event.data)) {
        self.postMessage(event.data.map(averageColor));
    } else {
        self.postMessage(averageColor(event.data));
    }
});
