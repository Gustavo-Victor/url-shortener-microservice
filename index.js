//modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require("dns");
const app = express();
const { DB_URI, port } = process.env;
const urlParser = require("url");

//db config
//const mongoose = require("mongoose"); 
const { MongoClient } = require("mongodb");
const client = new MongoClient(DB_URI);
const urlDb = client.db('url_shortener');
const urlCollection = urlDb.collection('url_references');


// Basic Configuration
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

//index
app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});


// Your first API endpoint
app.post('/api/shorturl', function (req, res) {
    const { url } = req.body;

    const dnsLookup = dns.lookup(urlParser.parse(url).hostname, async (err, address, family) => {
        if (!address) {
            res.json({ error: "Invalid URL" });
        } else {
            const document = await urlCollection.findOne({ original_url: url });

            if (document || document != null) {
                res.json({ original_url: document.original_url, short_url: document.short_url });
            } else {
                const urlCount = await urlCollection.countDocuments({}) + 1;
                const newUrl = { original_url: url, short_url: urlCount };
                const result = await urlCollection.insertOne(newUrl);
                res.json({ original_url: url, short_url: urlCount });
            }
        }
    });
});


app.get('/api/shorturl/:id', async function (req, res) {
    const { id } = req.params;
    if (isNaN(Number(id))) {
        res.json({ error: "No short URL found for the given input" });
    } else {
        const document = await urlCollection.findOne({ short_url: Number(id) });
        if (!document || document == null) {
            res.json({ error: "No short URL found for the given input" });
        } else {
            const { original_url, short_url } = document;
            res.json({ original_url, short_url });
        }
    }
});

app.listen(port | 3000, function () {
    console.log(`Listening on port ${port}`);
});