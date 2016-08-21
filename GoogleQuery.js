/**
 * Created by LUCKY on 7/22/2016.
 */

var Horsemen = require('node-horseman');
var async = require('async');
var fs = require('fs');
var csvWriter = require('csv-write-stream');
var parse = require('csv-parse');



const INPUT_FILE = "data.csv"; // Change to data for test
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
// Origin -> Word -> Def
function getQuery(word, callback)
{
    setTimeout(function () {

        // Check if input contains a digit = cannot be word
        if (String(word).match(/.*\d.*/))
        {
            //console.log("Number found: " + word);
            return 0;
        }


        else
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
                        console.log("Website does NOT load!");
                        rider.close();
                        return 1;
                    }


                    else
                    {
                        // console.log("Website loads! " + word);

                        rider
                            .text(JQUERY_SELECTOR_EXPAND_BTN)
                            .then(function (res) {
                                if (!res)
                                {
                                    console.log("No def found! " + res);
                                    rider.close();
                                    return 1;
                                }

                                else
                                {
                                    rider
                                        .click(JQUERY_SELECTOR_EXPAND_BTN) // Click expand button
                                        .keyboardEvent(COMMAND_KEY_PRESS, COMMAND_ENTER_BTN) // Hit Enter
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
                                    callback(null);
                                }

                            })
                    }
                });
        }
    }, 1000);


    return 0;
}



function processQuery(res, word)
{
    // Split root
    var arrStrBranch = res.split(/reinforced by |; based on /);

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
        var arrStr = currValRoot.split(/[:,\s]*from\s|\(based on\s/);


        // Test if arrStr still has member
        var currOrigin = BLANK;


        arrStr.forEach(function (currVal2ndLayer, currIndex2ndLayer, currArr2ndLayer)
        {
            var arrLeaf = currVal2ndLayer.split(/\s\+\s/);





            arrLeaf.forEach(function (currLastLayer, currIndexLastLayer, currArrLastLayer)
            {
                var currWord = BLANK;
                var currDef = BLANK;
                var currOriginTrue = currLastLayer.match(/(.+)(?:<i>.*<\/i>)/);
                var currWordTrue = currLastLayer.match(/<i>(.*)<\/i>/); // Remove <i> tag after having the word by itself
                var currDefTrue = currLastLayer.match(/‘(.+)’/);



                if (currOriginTrue) // Origin
                {
                    currOrigin = currOriginTrue[1];

                    currWord = currWordTrue[1];


                    if (currDefTrue)
                        currDef = currDefTrue[1];
                }
                else
                {
                    if (currIndex2ndLayer == 0)
                        currWord = word;
                    else if (currWordTrue)
                        currWord = currWordTrue[1];

                    if (currDefTrue) // no origin && def
                    {
                        currDef = currDefTrue[1];
                    }
                    else // No origin && No def
                    {
                        currOrigin = currLastLayer;
                    }

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
                    keyValue = keyValue.splice(0, 3);
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




// Parsing
var parser = parse({delimiter: ','}, function(err, data) {
    async.eachLimit(data, 5, getQuery, function(err) {

      if (err)
      {
          console.log("Error: " + err);
      }
    })
});


fs.createReadStream(INPUT_FILE).pipe(parser);


