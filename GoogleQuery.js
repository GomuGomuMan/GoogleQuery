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


var headers = [COL1, COL2, COL3];


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
            console.log("------------------------------------------------------");
            for (i = 0; i < arrStr.length; i++)
            {
                arrStr[i].trim();
                console.log("Member " + i + " " + arrStr[i] + '\n');
            }


            pushKeyVal(keyValue, arrStr.shift(), word, BLANK);



            // Testing
            console.log("------------------------------------------------------");
            for (i = 0; i < arrStr.length; i++)
            {
                arrStr[i].trim();
                console.log("Testing Member " + i + " " + arrStr[i] + '\n');
            }


            var count = 1;

            // Test if arrStr still has member
            if (arrStr.length != 0) // TODO: Change to while loop for iteration purpose
            {
                var currOriginTrue = arrStr[0].match(/(.+)(?:<i>.*<\/i>)/);
                var currWordTrue = arrStr[0].match(/<i>(.*)<\/i>/); // Remove <i> tag after having the word by itself
                var currDefTrue = arrStr[0].match(/(‘.+’)/);

                var currOrigin = arrStr[0];
                var currWord = BLANK;
                var currDef = BLANK;

                if (currOriginTrue)
                {
                    currOrigin = currOriginTrue[1];
                }

                if (currWordTrue)
                {
                    currWord = currWordTrue[1];
                }

                if (currDefTrue)
                {
                    currDef = currDefTrue[1];
                }



                console.log("------------------------------------------------------");
                console.log("CurrOrigin: " + currOrigin);
                console.log("currWord: " + currWord);
                console.log("currDef: " + currDef);
                console.log("------------------------------------------------------");


                increaseColSize(count);
                pushKeyVal(keyValue, currOrigin, currWord, currDef);

                // Remove this element from arrStr after done
                arrStr.shift();
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

        })
        .catch(function (err)
        {
            console.log("Error: " + err);
        })
        .close();


    return 0;
}



function increaseColSize(count)
{
    headers.push(COL1 + count);
    headers.push(COL2 + count);
    headers.push(COL3 + count);
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






// Parsing
var parser = parse({delimiter: ','}, function (err, data) {
    async.eachSeries(data, function(word, callback)
    {
        getQuery(word);
        callback();
    })
});


fs.createReadStream(INPUT_FILE).pipe(parser);


