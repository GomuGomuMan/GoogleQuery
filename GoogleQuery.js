/**
 * Created by LUCKY on 7/22/2016.
 */

var Horsemen = require('node-horseman');
var async = require('async');

var rider = new Horsemen(
    {
        loadImages: false
    }
);

rider
    .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
    .open('https://www.google.com/search?q=innocence')
    .status()
    .then(function (result)
    {
        if (result !== 200)
        {
            console.log("Website does NOT load!")
            rider.close();
        }


        else
        {
            console.log("Website loads!");

        }
    })
    .click('#uid_0 > div._LJ._qxg.xpdarr._WGh.vk_arc')
    .keyboardEvent('keypress', 16777221)
    .text('.xpdxpnd >> span:first')
    .log() // prints out the number of results
    .catch(function (err)
    {
        console.log(err);
    })
    .close();



