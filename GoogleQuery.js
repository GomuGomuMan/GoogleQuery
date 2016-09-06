/**
 * Created by LUCKY on 7/22/2016.
 */

var Horsemen = require('node-horseman');
var async = require('async');
var fs = require('fs');
var csvWriter = require('csv-write-stream');
var parse = require('csv-parse');




const INPUT_FILE = "C:\\Users\\LUCKY\\Desktop\\Web Crawling\\GoogleQuery\\small input files\\test5.csv"; // Change to data for test
const OUTPUT_FILE = "C:\\Users\\LUCKY\\Desktop\\Web Crawling\\GoogleQuery\\small input files\\output1.csv";
// const INPUT_FILE = "data.csv";
// const OUTPUT_FILE = "output.csv";

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

const MIN_TIME = 10000;
const MAX_TIME = 20000;



var headers = [];

for (count = 1; count < 20; ++count)
{
    increaseColSize(count);
}


var writer = csvWriter(
{
    headers: headers
});

/**
 * flags: 'w' -> overwriting a file
 * flags: 'r+' -> modifying a file
 * flags: 'a' -> appending to a file
 */
writer.pipe(fs.createWriteStream(OUTPUT_FILE, {flags:'a'}));




// Origin -> Word -> Def
// Origin -> Word -> Def
function getQuery(word, callback)
{
    console.log("Word: " + word);

    // Check if input contains a digit -> cannot be word
    if (String(word).match(/.*\d.*/))
    {
        //console.log("Number found: " + word);
        callback(null);
        return 0;
    }

    // Faking human delays
    setTimeout(function()
    {

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
                    if (result == 302) // Check to see if Google Captcha appears
                        console.log("IP addr has been blocked!");

                    console.log("Website does NOT load!");
                    rider.close();
                    callback(null);
                    return 1;
                }

                // console.log("Website loads! " + word);

                rider
                    .exists(JQUERY_SELECTOR_EXPAND_BTN)
                    .then(function (res) {
                        if (!res)
                        {
                            console.log("No def found! ");
                            rider.close();
                            callback(null);
                            return 1;
                        }

                        rider
                            .click(JQUERY_SELECTOR_EXPAND_BTN) // Click expand button
                            .keyboardEvent(COMMAND_KEY_PRESS, COMMAND_ENTER_BTN) // Hit Enter
                            .text(JQUERY_SELECTOR_QUERY)
                            .then(function (res) {
                                if (!res || res.match(/^\s*Translate/))
                                {
                                    console.log("No tree found! " + word);
                                    rider.close();
                                    return 0;
                                }

                                rider
                                    .html(JQUERY_SELECTOR_QUERY)
                                    .then(function (res)
                                    {
                                        processQuery(res, word);
                                    })
                                    .catch(function (err)
                                    {
                                        console.log("Error: " + err);
                                    })
                                    .close();
                            });
                        callback(null);

                    })

            });

        var date = new Date();
        console.log("Word " + word + " Finished at: " + date.getHours() + ":" + date.getMinutes() + ":"
            + date.getSeconds() + '\n');

    }, getRandomInt());





    return 0;
}



function processQuery(res, word)
{
    // Split root
    console.log("Res: " + res);
    var arrStrBranch = res.split(/\s*reinforced by\s*|;\s*based on\s*|\s*;\s*related\s*to\s*|\s+[,\s]*or\s+/);

    // Test
    // for (i = 0; i < arrStrBranch.length; ++i)
    // {
    //     console.log("arrStrBranch " + i + " " + arrStrBranch[i]);
    // }

    var keyValue = [];
    var finalKeyVal = [];


    arrStrBranch.forEach(function (currValRoot, currIndexRoot, currArrRoot)
    {
        // Split second layer


        // Test
        // if (currIndexRoot > 0)
        // {
        //
        //     for (i = 0; i < keyValue.length; ++i)
        //     {
        //         console.log(i + ": " + keyValue[i] + '\n');
        //     }
        //
        // }



        // Split 2nd layer
        var arrStr = currValRoot.split(/[:,(\s]*from\s|\(based on\s|\s*,\s*of\s*|\s*,\s*via\s*|\(.*suggested\s*by\s*/);
        // Test
        // for (i = 0; i < arrStr.length; ++i)
        // {
        //     console.log("arrStr " + i + " " + arrStr[i]);
        // }

        // Test if arrStr still has member
        var currOrigin = BLANK;


        arrStr.forEach(function (currVal2ndLayer, currIndex2ndLayer, currArr2ndLayer)
        {
            if (currVal2ndLayer) // If element is not null -> cont
            {
                var arrLeaf = currVal2ndLayer.split(/\s\+\s|\s*and\s*/);


                // Test
                // for (i = 0; i < arrLeaf.length; ++i)
                // {
                //     console.log("arrLeaf " + i + " " + arrLeaf[i]);
                // }



                arrLeaf.forEach(function (currLastLayer, currIndexLastLayer, currArrLastLayer)
                {
                    var currWord = BLANK;
                    var currDef = BLANK;

                    // console.log("currLastLayer: " + currLastLayer);

                    var extractedArr = currLastLayer.match(/(.+)\s<i>(.+)<\/i>\s*‘(.*)’/);



                    if (!extractedArr) // No word or word def or both
                    {
                        if (extractedArr = currLastLayer.match(/<i>(.+)<\/i>\s*‘(.*)’/)) // No origin
                        {
                            currWord = extractedArr[1];
                            currDef = extractedArr[2];
                        }
                        else if (extractedArr = currLastLayer.match(/(.+)\s<i>(.+)<\/i>\s*/)) // No def
                        {
                            currOrigin = extractedArr[1];
                            currWord = extractedArr[2]; // Remove <i> tag after having the word by itself

                        }
                        else if (extractedArr = currLastLayer.match(/\s*<i>(.+)<\/i>\s*/)) // No origin && No def
                        {
                            currWord = extractedArr[1];
                        }
                        else // Only word origin
                        {
                            currOrigin = currLastLayer;

                            if (currIndex2ndLayer == 0)
                                currWord = word;
                        }


                    }
                    else
                    {
                        currOrigin = extractedArr[1];
                        currWord = extractedArr[2]; // Remove <i> tag after having the word by itself
                        currDef = extractedArr[3];

                    }


                    // Test
                    // console.log("------------------------------------------------------");
                    // console.log("Member " + currIndexLastLayer + " " + currLastLayer + '\n');
                    // console.log("------------------------------------------------------");
                    // console.log("------------------------------------------------------");
                    // console.log("CurrOrigin: " + currOrigin);
                    // console.log("currWord: " + currWord);
                    // console.log("currDef: " + currDef);
                    // console.log("------------------------------------------------------");


                    pushKeyVal(keyValue, currOrigin, currWord, currDef);
                    finalKeyVal = keyValue.slice(0); // Save a path to the final val

                    // Save root iff there is a branch from root & operation on 2ndLayer has finished
                    if (currIndexRoot < currArrRoot.length - 1
                        && currIndex2ndLayer == currArr2ndLayer.length - 1)
                    {
                        // console.log("CurrIndex2ndLayer: " + currIndex2ndLayer);
                        keyValue = keyValue.splice(0, 3 * currIndex2ndLayer);
                        // console.log("keyValue: " + keyValue);
                    }


                    // Save root -> before leaf if there are multiple leaves
                    if (currIndexLastLayer < currArrLastLayer.length - 1)
                    {

                        cleanandWrite(finalKeyVal, writer);

                        keyValue = keyValue.splice(0, keyValue.length - 3);
                        // console.log("keyValueLeaf: " + keyValue);
                    }





                    // Write to finalKeyVal when finishing a leaf



                });
            }


        });



        cleanandWrite(finalKeyVal, writer);

        //Test queue
        // console.log("------------------------------------------------------");
        // for (i = 0; i < keyValue.length; i++)
        // {
        //     console.log("keyVal " + i + " " + keyValue[i] + '\n');
        //     // var i = keyValue.pop();
        //
        // }
        // console.log("------------------------------------------------------");




    });
}


function cleanandWrite(keyValue, writer)
{
    // Clean up ')' and whitespace
    keyValue = cleanupStr(keyValue);


    // Print to file
    writer.write(
        keyValue
    );
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
        arr[i] = String(arr[i]).replace(/\)|^\s+|[\.,]*\s*$/g, ""); // Clean up ')' and whitespace
    }

    return arr;
}




function increaseColSize(count)
{
    headers.push(COL1 + count);
    headers.push(COL2 + count);
    headers.push(COL3 + count);
}


function getRandomInt()
{
    /**
     * Returns an int in range [MIN_TIME, MAX_TIME)
     */
    return Math.floor(Math.random() * (MAX_TIME - MIN_TIME)) + MIN_TIME;
}




// Parsing
var parser = parse({delimiter: ','}, function(err, data) {
    /**
     * Run 5 functions at a time with a delay of 1 second each
     */
    async.eachLimit(data, 5, getQuery, function(err) {
        if (err)
        {
            console.log("Error: " + err);
        }
    })
});


fs.createReadStream(INPUT_FILE).pipe(parser);


