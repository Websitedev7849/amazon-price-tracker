require('dotenv').config();
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const process = require('process');
const fs = require('fs');
const http = require('http');
const PORT = process.env.PORT || 3300;


const indexPage = "https://www.amazon.in/Bajaj-HM-01-250-Watt-Mixer/dp/B0187F2IOK/ref=sr_1_3?dchild=1&keywords=hand+blender+bajaj&qid=1623850292&smid=A36K7IJAJHSE6I&sr=8-3";

const minute = 60 * 1000;
const timeInterval = 11 * minute;
let currentProductInfo = {
    productName: '',
    price: 0
};
let lowestPrice = 1000,  highestPrice = 1200;

let messageBody;

let theInterval;

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.PASSWORD
    }   
});

const startInterval = async () => {
            
    const browser = await puppeteer.launch( {headless: true , timeout: 0} );
    console.log("Browser opened Successfully");

    theInterval = function () {
        return setInterval(async ()=>{
        

            try {
                const page = await browser.newPage({timeout: 0});
                await page.goto(indexPage);
                // await page.waitForNavigation({ timeout: 0 });
                console.log("page opened succesfully");
    
                currentProductInfo = await page.evaluate(()=>{
                    let price = document.querySelector("span[id='priceblock_ourprice']");
                    price = price.innerText;
                    price = price.replace('₹', '');
                    price = price.replace(',', '');
                    price = parseFloat(price);
    
                    let productName = document.querySelector("span[id = 'productTitle']");
                    productName = productName.innerText;
    
                    return {productName: productName, price: price};
                });
    
                console.log(`current price of product, ${currentProductInfo.productName} IS ${currentProductInfo.price}`);
    
                if (currentProductInfo.price < lowestPrice){
    
                    messageBody = `current price of product, ${currentProductInfo.productName}, ₹ ${currentProductInfo.price} is the lowest price ever`;
                    lowestPrice = currentProductInfo.price;
    
                } else if (currentProductInfo.price > highestPrice) {
                    
                    messageBody = `current price of product, ${currentProductInfo.productName}, ₹ ${currentProductInfo.price} is the highest price ever`;
                    highestPrice = currentProductInfo.price;
                
                }else{
                
                    messageBody = `current price of product, ${currentProductInfo.productName}, ₹ ${currentProductInfo.price} is the same as last recorded`;
                
                }
    
                let mailOptions = {
                    from: process.env.EMAIL_ID,
                    to: process.env.RECEIVER_EMAIL_ID,
                    subject: 'Current price of product',
                    text: messageBody
                };
    
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log('Email Sent: ' + info.response + "\n\n");
                });
    
                await page.close();
                console.log("page closed successfully\n\n");
                
                
    
            } catch (err) {
                if (err) {
                    console.log("there was some error", err);
                }
                await page.close();
                console.log("page closed successfully\n\n");
            }
    
    
    
        }, timeInterval);
    };

    theInterval();
    
};

const server = http.createServer((req,res) => {
    console.log(`req was made to ${req.url}`);
    switch (req.url) {
        case '/':
            res.setHeader('Content-Type','text/html');
            fs.readFile('./Public/index.html', (err,data)=>{
                res.end(data);
            });
            break;
            
        case '/start-interval':
            res.setHeader('Content-Type','text/html');
            startInterval();
            res.write('Innterval started succefully');
            break;


        case '/Public/script.js':
            res.setHeader('Content-Type','text/js');
            fs.readFile('./Public/script.js', (err,data)=>{
                res.end(data);
            });
            break;
    
        default:
            res.setHeader('Content-Type','text/html');
            res.end("<h1> INVALID URL </h1>");
            break;
    }
});

server.listen(PORT,()=>{
    console.log(`Listening to Port ${PORT}`)
});
