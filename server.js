#!/usr/bin/env node

const commander = require('commander'),
    { prompt } = require('inquirer'),
    chalk = require('chalk'),
    fs = require('fs')

const axios = require('axios');
const cheerio = require('cheerio');
const { data } = require('cheerio/lib/api/attributes');

const parse = async() => {
    fs.unlink("data.js", function(err) {
        if (err) {
            console.log('No such directory exists');
        } else {
            console.log("Data has been cleared");
        }
    });
    fs.appendFileSync('./data.js', 'const currencies = [];\n');

    const getHTML = async(url) => {
        const { data } = await axios.get(url);
        return cheerio.load(data);
    }

    const $ = await getHTML(`https://coinmarketcap.com`);
    const pageNumber = $('li.page').eq(-1).text()

    for (let i = 1; i <= pageNumber; i++) {
        const selector = await getHTML(`https://coinmarketcap.com/?page=${i}`)
        selector('tr').each((i, element) => {
            if (selector(element).find('p.sc-1eb5slv-0.iworPT').text().length > 0) {
                if (selector(element).find('p.sc-1eb5slv-0.gGIpIK.coin-item-symbol').text().length > 0) {
                    if (selector(element).find('div.sc-131di3y-0.cLgOOr').text().length > 0) {
                        const nameFull = selector(element).find('p.sc-1eb5slv-0.iworPT').text()
                        const nameShort = selector(element).find('p.sc-1eb5slv-0.gGIpIK.coin-item-symbol').text()
                        const price = selector(element).find('div.sc-131di3y-0.cLgOOr').text().split(',').join('');

                        fs.appendFileSync('./data.js', `currencies.push({name:'${nameShort}', fullName: "${nameFull}", price: '${price.slice(1)}'});\nmodule.exports = currencies;\n`)
                            // console.log(currencies);
                    }
                }
            }
        })
    }
    console.log('Data has been written');

}

const clear = async() => {

    fs.unlink("data.js", function(err) {
        if (err) {
            console.log('No such directory exists');
        } else {
            console.log("Data has been cleared");
        }
    });
    fs.appendFileSync('./data.js', 'const currencies = [];\n');
}

const info = require('./data.js');


commander
    .version('1.0.0')
    .description('Cryptocurrency Converter-Calculator.')


commander
    .command('convert')
    .option('--extension <value>', 'File extension')
    .alias('conv')
    .description('Calculate required amount.')
    .action((curr1, curr2, num) => {
        prompt([{
                type: 'input',
                name: 'curr1',
                message: 'Currency 1 (abbreviation upper or lowercase): ',
            },
            {
                type: 'input',
                name: 'curr2',
                message: 'Currency 2 (abbreviation upper or lowercase): ',
            },
            {
                type: 'input',
                name: 'reqNum',
                message: 'Required amount: ',
            },
        ]).then((options) => {
            let priceOne, priceTwo, currOneFullName, currTwoFullName;

            for (let i = 0; i < info.length; i++) {
                if (info[i].name === options.curr1.toUpperCase()) {
                    priceOne = info[i].price;
                    currOneFullName = info[i].fullName;
                }
                if (info[i].name === options.curr2.toUpperCase()) {
                    priceTwo = info[i].price;
                    currTwoFullName = info[i].fullName;
                }

            }
            if (priceOne === undefined || priceTwo === undefined) {
                console.log(
                    chalk.red("There's no such currency, try again please.")
                )
            } else {
                console.log(
                    chalk.green(
                        `\n${options.reqNum} ${currOneFullName}(${options.curr1.toUpperCase()}) = ${options.reqNum * (priceOne / priceTwo)} ${currTwoFullName}(${options.curr2.toUpperCase()}).`
                    )
                )
            }
        })
    })

commander
    .command('data')
    .alias('gc')
    .description('Get current prices')
    .action(() => { parse() })

commander
    .command('clear')
    .alias('cl')
    .description('Clear currency data')
    .action(() => { clear() })

commander.parse(process.argv)