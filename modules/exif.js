var ExifImage = require('exif').ExifImage;


const getCoordinates = (image) => {

    return new Promise((resolve, reject) => {
        try {
            new ExifImage({image}, function (error, exifData) {
                if (error)
                    reject(console.log('Error: ' + error.message))
                else {

                    const lat = gpsToDecimal(exifData.gps.GPSLatitude, exifData.gps.GPSLatitudeRef)
                    const lon = gpsToDecimal(exifData.gps.GPSLongitude, exifData.gps.GPSLongitudeRef)
                    const coordinates = {
                        lat: lat,
                        lon: lon
                    };
                    resolve(coordinates);

                }
            });
        } catch (error) {
            console.log('Error: ' + error.message);
            reject('Error: ' + error.message)
        }

    });


}

// convert GPS coordinates to GoogleMaps format
const gpsToDecimal = (gpsData, hem) => {
    let d = parseFloat(gpsData[0]) + parseFloat(gpsData[1] / 60) +
        parseFloat(gpsData[2] / 3600);
    return (hem === 'S' || hem === 'W') ? d *= -1 : d;
};

module.exports = {
    getCoordinates
}