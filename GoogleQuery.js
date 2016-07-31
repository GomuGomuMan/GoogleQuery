/**
 * Created by LUCKY on 7/22/2016.
 */

var Horsemen = require('node-horseman');
var async = require('async');
var fs = require('fs');
var csvWriter = require('csv-write-stream');
var parse = require('csv-parse');



const inputFile = "data.csv";
const outputFile = "output.csv";
const userAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0";
const url = "https://www.google.com/search?q=";
const searchPadding = "+definition";
const blank = "N/A"



var writer = csvWriter(
{
    sendHeaders:false
});

writer.pipe(fs.createWriteStream(outputFile, {flags:'r+'}));


// Origin -> Word -> Def
function getQuery(word)
{
    var query = "";
    var time = "";

    var keyValue = [];


    var rider = new Horsemen(
        {
            loadImages: false,
            timeout: 10000
        }
    );


    rider
        .userAgent(userAgent)
        .open(url + word + searchPadding)
        .status()
        .then(function (result)
        {
            if (result !== 200)
            {
                console.log("Website does NOT load!");
                rider.close();
            }


            else
            {
                console.log("Website loads! " + word);
            }
        })
        .click('#uid_0 > div._LJ._qxg.xpdarr._WGh.vk_arc') // Click expend button
        .keyboardEvent('keypress', 16777221) // Hit Enter
        .text('.xpdxpnd >> span:first')
        .then(function (res)
        {
            query += res;


            // console.log("Query: " + query + '\n');


            // Get Time
            var match = (query.match(/(.+):(.+)/));
            if (match)
            {
                time = match[1].trim();
                // console.log("Time: " + time);
            }
            keyValue.push(time); // Origin
            keyValue.push(word); // Word
            keyValue.push(blank); // Blank Def

            // Get Val
            var arrStr = processVal(match[2]);

            keyValue.push(arrStr[1]);



            // Print to file
            writer.write(
                {
                    Word: word,
                    Time: time,
                    Rest: arrStr[1]
                }
            );


            // Test queue & stack
            for (i = 0; i < keyValue.length; i++)
            {
                console.log("keyVal " + i + " " + keyValue[i]);
                // var i = keyValue.pop();

            }

        })
        .catch(function (err)
        {
            console.log("Error: " + err);
        })
        .close();


    return 0;
}



function processVal(val)
{
    console.log("String: " + val);

    // for (i = 1; i < arrayStr.length; i++)
    // {
    //     console.log("Member " + i + arrayStr[i] + '\n');
    // }

    return val.split(/, from|from/);
}





// Parsing
var parser = parse({delimiter: ','}, function (err, data) {
    async.eachSeries(data, function(word, callback)
    {
        getQuery(word);
        callback();
    })
});


fs.createReadStream(inputFile).pipe(parser);


