/**
 * Created by LUCKY on 7/22/2016.
 */

var Horsemen = require('node-horseman');
var async = require('async')
var fs = require('fs');


var outCSV = fs.createWriteStream('file.csv', {flags: 'r+'});

var rider = new Horsemen
(
    {
        loadImages: false
    }
);

rider
    .open("https://www.google.com/search?q=offense&ie=utf-8&oe=utf-8")
    .status()
    .then(function (result)
    {
        if (result != 200)
            console.log("Search does not load!");

        else
        {
            rider.text('div')
                .then(function (res)
                {
                    console.log(res);
                })
        }
    });






