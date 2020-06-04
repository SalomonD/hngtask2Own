let express = require('express');
let router = express.Router();
let path = require('path');
let fs = require('fs')
let { execSync } = require("child_process");

RegExp.prototype.toPartialMatchRegex = function () {
    "use strict";

    var re = this,
        source = this.source,
        i = 0;

    function process() {
        var result = "",
            tmp;

        function appendRaw(nbChars) {
            result += source.substr(i, nbChars);
            i += nbChars;
        };

        function appendOptional(nbChars) {
            result += "(?:" + source.substr(i, nbChars) + "|$)";
            i += nbChars;
        };

        while (i < source.length) {
            switch (source[i]) {
                case "\\":
                    switch (source[i + 1]) {
                        case "c":
                            appendOptional(3);
                            break;

                        case "x":
                            appendOptional(4);
                            break;

                        case "u":
                            if (re.unicode) {
                                if (source[i + 2] === "{") {
                                    appendOptional(source.indexOf("}", i) - i + 1);
                                } else {
                                    appendOptional(6);
                                }
                            } else {
                                appendOptional(2);
                            }
                            break;

                        default:
                            appendOptional(2);
                            break;
                    }
                    break;

                case "[":
                    tmp = /\[(?:\\.|.)*?\]/g;
                    tmp.lastIndex = i;
                    tmp = tmp.exec(source);
                    appendOptional(tmp[0].length);
                    break;

                case "|":
                case "^":
                case "$":
                case "*":
                case "+":
                case "?":
                    appendRaw(1);
                    break;

                case "{":
                    tmp = /\{\d+,?\d*\}/g;
                    tmp.lastIndex = i;
                    tmp = tmp.exec(source);
                    if (tmp) {
                        appendRaw(tmp[0].length);
                    } else {
                        appendOptional(1);
                    }
                    break;

                case "(":
                    if (source[i + 1] == "?") {
                        switch (source[i + 2]) {
                            case ":":
                                result += "(?:";
                                i += 3;
                                result += process() + "|$)";
                                break;

                            case "=":
                                result += "(?=";
                                i += 3;
                                result += process() + ")";
                                break;

                            case "!":
                                tmp = i;
                                i += 3;
                                process();
                                result += source.substr(tmp, i - tmp);
                                break;
                        }
                    } else {
                        appendRaw(1);
                        result += process() + "|$)";
                    }
                    break;

                case ")":
                    ++i;
                    return result;

                default:
                    appendOptional(1);
                    break;
            }
        }

        return result;
    }

    return new RegExp(process(), this.flags);
};

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts')
const REG = /^(Hello World, this is)(.*)with(\s){1}HNGi7(\s){1}ID(\s){1}HNG-(.*)and(\s){1}email(.*)(\s){1}using(.*)for(\s){1}stage(\s){1}2(\s){1}task(\n|\r|\t)*/
var partialMatchRegex = REG.toPartialMatchRegex();
const POSITIVE_INTEGER_REG = /^\+?(0|[1-9]\d*)$/

let readDirectoryFiles = () => {
    try {
        let files = fs.readdirSync(SCRIPT_PATH, { encoding: 'utf-8' })

        let members = []
        let pass = 0
        let fail = 0

        if (files.length) {
            let commandOutput
            let matchResult

            let id
            let name
            let language

            let index

            for (let file of files) {
                commandOutput = executeCommand(file)
                console.log('----------- Le output: ', commandOutput)

                if (commandOutput) {
                    matchResult = commandOutput.match(REG)

                    console.log('----------- Le test part: ', partialMatchRegex.exec(commandOutput))
                    if (commandOutput.indexOf(' ID ') > 0 && commandOutput.indexOf(' and ') > 0) {
                        id = commandOutput.substring(
                            commandOutput.indexOf(' ID ') + 4,
                            commandOutput.indexOf(' and ')
                        ).trim()
                    }

                    if (commandOutput.indexOf(' is ') > 0 && commandOutput.indexOf('with') > 0) {
                        name = commandOutput.substring(
                            commandOutput.indexOf(' is ') + 4,
                            commandOutput.indexOf(' with ')
                        ).trim()
                    }

                    if (commandOutput.indexOf(' is ') > 0 && commandOutput.indexOf('with') > 0) {
                        language = commandOutput.substring(
                            commandOutput.indexOf(' using ') + 7,
                            commandOutput.indexOf(' for ')
                        ).trim()
                    }

                    members.push({
                        file: file,
                        id,
                        name,
                        message: commandOutput,
                        language,
                        status: matchResult ? 'Passed' : 'Failed'
                    })

                    if (matchResult) {
                        pass++
                    } else {
                        fail++
                    }
                } else {
                    members.push({
                        file: file,
                        id: null,
                        name: null,
                        message: null,
                        language: null,
                        status: 'Failed'
                    })
                    fail++
                }
            }
        }


        return {
            members,
            fail,
            pass,
            total: pass + fail
        }
    } catch (error) {
        console.log("Le catch 2")
        console.error(error)
    }
}

let executeCommand = (fileName) => {
    console.log('Le nom', fileName)
    console.log('Lextention', path.extname(fileName))
    try {
        switch (path.extname(fileName)) {
            case '.js':
                console.log('Le exec js:')
                return execSync('node ' + path.join(SCRIPT_PATH, fileName), { encoding: "utf-8" })
                break
            case '.php':
                console.log('Le exec php: ')
                return execSync('php ' + path.join(SCRIPT_PATH, fileName), { encoding: "utf-8" })
                break
            case '.py':
                console.log('Le exec py: ')
                return execSync('python ' + path.join(SCRIPT_PATH, fileName), { encoding: "utf-8" })
                break
        }
    } catch (error) {
        console.log("Le catch: ", error)
        return null
    }
}

//Get Homepage
router.get('/', function (req, res) {
    console.log("Test des params: ", req.query)

    let data = readDirectoryFiles()
    console.log('Le path: ', data)

    if(Object.keys(req.query)[0] === 'json'){
        // res.setHeader('Content-Type', 'application/json');
        // res.end(JSON.stringify(data.members))
        res.json(data.members);
    } else {
        res.render('index', { data });
    }
    
    
});

module.exports = router;