/**
 * Created by LUCKY on 7/22/2016.
 */

var Horsemen = require('node-horseman');
var async = require('async');
var fs = require('fs');
var csvWriter = require('csv-write-stream');
var parse = require('csv-parse');



const INPUT_FILE = "data.csv";
const OUTPUT_FILE = "output.csv";
const USER_AGENT = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0";
const URL = "https://www.google.com/search?q=";
const SEARCH_PADDING = "+definition";
const BLANK = "N/A";
const JQUERY_SELECTOR_EXPAND_BTN = '#uid_0 > div._LJ._qxg.xpdarr._WGh.vk_arc';
const JQUERY_SELECTOR_QUERY = '.xpdxpnd >> span:first';
const COMMAND_KEY_PRESS = 'keypress';
const COMMAND_ENTER_BTN = 16777221;

const COL1 = "Origin";
const COL2 = "Word";
const COL3 = "Def";



var headers = [];

for (count = 1; count < 20; ++count)
{
    increaseColSize(count);
}


var writer = csvWriter(
    {
        headers: headers
    });

writer.pipe(fs.createWriteStream(OUTPUT_FILE, {flags:'r+'}));




// Origin -> Word -> Def
function getQuery(word)
{




    var keyValue = [];


    var rider = new Horsemen(
        {
            loadImages: false,
            timeout: 10000
        }
    );


    rider
        .userAgent(USER_AGENT)
        .open(URL + word + SEARCH_PADDING)
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
        .click(JQUERY_SELECTOR_EXPAND_BTN) // Click expend button
        .keyboardEvent(COMMAND_KEY_PRESS, COMMAND_ENTER_BTN) // Hit Enter
        .html(JQUERY_SELECTOR_QUERY)
        .then(function (res)
        {


            var arrStr = res.split(/: from |, from|from|\(based on/);

            // Clean up ')' and whitespace
            cleanupStr(arrStr);

            // Testing
            // console.log("------------------------------------------------------");
            // for (i = 0; i < arrStr.length; i++)
            // {
            //     arrStr[i].trim();
            //     console.log("Member " + i + " " + arrStr[i] + '\n');
            // }


            //pushKeyVal(keyValue, arrStr.shift(), word, BLANK);



            // Testing
            // console.log("------------------------------------------------------");
            // for (i = 0; i < arrStr.length; i++)
            // {
            //     arrStr[i].trim();
            //     console.log("Testing Member " + i + " " + arrStr[i] + '\n');
            // }


            var count = 1;

            // Test if arrStr still has member
            var currOrigin = BLANK;

            while (arrStr.length != 0) // TODO: Change to while loop for iteration purpose
            {
                var currWord = BLANK;
                var currDef = BLANK;

                console.log("------------------------------------------------------");
                console.log("Member " + count + " " + arrStr[0] + '\n');
                console.log("------------------------------------------------------");


                var currOriginTrue = arrStr[0].match(/(.+)(?:<i>.*<\/i>)/);
                var currWordTrue = arrStr[0].match(/<i>(.*)<\/i>/); // Remove <i> tag after having the word by itself
                var currDefTrue = arrStr[0].match(/(‘.+’)/);



                if (currOriginTrue) // Origin
                {
                    currOrigin = currOriginTrue[1];


                    currWord = currWordTrue[1];


                    if (currDefTrue)
                        currDef = currDefTrue[1];
                }
                else
                {
                    if (count == 1)
                        currWord = word;
                    else if (currWordTrue)
                        currWord = currWordTrue[1];

                    if (currDefTrue) // no origin && def
                    {
                        currDef = currDefTrue[1];
                    }
                    else // No origin && No def
                    {
                        currOrigin = arrStr[0];
                    }

                }





                console.log("------------------------------------------------------");
                console.log("CurrOrigin: " + currOrigin);
                console.log("currWord: " + currWord);
                console.log("currDef: " + currDef);
                console.log("------------------------------------------------------");


                // increaseColSize(count);
                pushKeyVal(keyValue, currOrigin, currWord, currDef);

                // Remove this element from arrStr after done
                arrStr.shift();
                ++count;
            }



            // Print to file
            writer.write(
                keyValue
            );


            //Test queue & stack
            console.log("------------------------------------------------------");
            for (i = 0; i < keyValue.length; i++)
            {
                console.log("keyVal " + i + " " + keyValue[i] + '\n');
                // var i = keyValue.pop();

            }
            console.log("------------------------------------------------------");

            console.log("Header of " + word + ": " + headers.length);
        })
        .catch(function (err)
        {
            console.log("Error: " + err);
        })
        .close();



    return 0;
}


function pushKeyVal(keyValue, origin, word, def)
{
    keyValue.push(origin);
    keyValue.push(word);
    keyValue.push(def);
}




function cleanupStr(arr)
{
    for (i = 0; i < arr.length; i++)
    {
        arr[i] = arr[i].replace(/\)|^\s+|\s+$/g, ''); // Clean up ')'
        // arr[i] = arr[i].replace(/^\s+|\s+$/g, ''); // Clean up whitespace
    }
}



function increaseColSize(count)
{
    headers.push(COL1 + count);
    headers.push(COL2 + count);
    headers.push(COL3 + count);
}




// Parsing
var parser = parse({delimiter: ','}, function (err, data) {
    async.eachSeries(data, function(word, callback)
    {
        getQuery(word);
        callback();
    })
});


fs.createReadStream(INPUT_FILE).pipe(parser);


