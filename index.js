/**
 * index.js
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pdf = require('pdf-creator-node');
const fs = require('fs');
const path = require('path');

const app = express();
require('dotenv').config();
// APP Config
app.set('port', process.env.PORT || '8081');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// CORS Config
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const {
  WHITELIST_OF_SITE,
} = process.env;

const whitelist = WHITELIST_OF_SITE.split(';');

const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.includes(origin) && origin !== '') {
      callback(null, true);
    } else {
      callback(new Error('Access denied.'));
    }
  },
  preflightContinue: true,
};
app.options('*', cors(corsOptions));
app.use(cors());

app.get('*', (req, res, next) => {
  next();
})
// add front
app.get('/', function(req, res) {
	res.send('API is working at the 8081');
});

app.post('/get-pdf', pdfCreate);
// define a route to download a file
app.get('/download/:file(*)', downloadFunc);

const port = app.get('port');

app.listen(port, () => {
  console.log('PDF API is listening on port: ' + port);
});

function pdfCreate (req, res, next) {
  const data = req.body;
  const templateHTML = fs.readFileSync('./templates/template.html', 'utf8');

  const options = {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
    header: {
        height: "0mm",
        contents: '<div style="text-align: center;">Author:</div>'
    },
    footer: {
      height: "20mm",
      contents: '<div style="font-size: 11px; font-family: Justus, "Open Sans";text-align:center;font-style:italic">thecommunelife.com</div>'
    }
  };
  // font-size: 11px;
  // font-family: Justus, 'Open Sans';
  // font-style: italic;
  // margin-top: 10px;
  // padding: 0;
  // text-align:  center;
  let document = {
    html: templateHTML,
    data: {
      data: data,
      created_on: data.Quote.CreatedOn ? getFormattedDate(data.Quote.CreatedOn) : ''
    },
    path: './pdf/result.pdf'
  }

  pdf.create(document, options)
    .then(result => {
      let filename = result.filename.split('\\').slice(-1)[0];
      res.status(200).json({
        'status': 'success',
        'message': 'PDF Successfully created',
        'link': process.env.HOST_ADDRESS + '/download/result.pdf'
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        'status': 'error',
        'message': 'Failed! Please Try Again!',
      });
    });

}

function downloadFunc (req, res,next) {
  let file = req.params.file;
  console.log(file);
  let fileLocation = path.join('./pdf',file);
  console.log(fileLocation);
  res.download(fileLocation, file);
}


function getFormattedDate (dateString) {
  let dd = dateString.split('T')[0].split('-')[2];
  let mm = parseInt(dateString.split('T')[0].split('-')[1]);
  let months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  let yy = dateString.split('T')[0].split('-')[0];
  return `${dd} ${months[mm - 1]} ${yy}`;
}