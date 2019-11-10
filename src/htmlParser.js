var cheerio = require('cheerio');
var scrapeIt = require("scrape-it");
var urlHelper = require('url');
var utils = require('./utils.js');
var linez = require('linez');
var Ajv = require('ajv');
var JSON5 = require('json5');

// add search-result Schema
var ajv = new Ajv();
const sch = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "track": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "name": {
          "type": "string"
        },
        "url": {
          "type": "string",
          "format": "uri"
        },
        "duration": {
          "type": "string"
        }
      },
      "required": ["name"]
    }
  },
  "title": "album-info",
  "description": "The JSON schema that matches album info.",
  "$id": "https://mastert.github.io/bandcamp-scraper/schemas/album-info.json",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "artist": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "url": {
      "type": "string",
      "format": "uri"
    },
    "imageUrl": {
      "type": "string",
      "format": "uri"
    },
    "tracks": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/track"
      }
    },
    "raw": {
      "type": "object"
    }
  },
  "required": ["artist", "title", "url", "imageUrl", "tracks", "raw"]
};

//ajv.addSchema(require('../schemas/search-result.json'), 'search-result');
//ajv.addSchema(require('../schemas/album-product.json'), 'album-product');
ajv.addSchema(sch, 'album-info');
//ajv.addSchema(require('../schemas/tag-result.json'), 'tag-result');


linez.configure({
  newlines: ['\n', '\r\n', '\r']
});

var removeMultipleSpace = function (text) {
  return text.replace(/\s{2,}/g, ' ');
};

var removeNewLine = function (text) {
  text = linez(text).lines.map(function (line) {
    return line.text.trim();
  }).join(' ');
  return removeMultipleSpace(text);
};

var assignProps = function (objFrom, objTo, propNames) {
  propNames.forEach(function (propName) {
    objTo[propName] = objFrom[propName];
  });
  return objTo;
};






exports.extractJavascriptObjectVariable = function (html, variableName) {
  var regex = new RegExp('var ' + variableName + '\\s*=\\s*(\\{[\\s\\S]*?\\})\\s*;');
  var matches = html.match(regex);
  if (matches && matches.length == 2) {
    return matches[1];
  }
};

// parse album info
exports.parseAlbumInfo = function (html, albumUrl) {
  console.log({
    html,
    albumUrl
  })
  var $ = cheerio.load(html);
  var data = scrapeIt.scrapeHTML($, {
    album: {
      selector: 'body',
      data: {
        artist: {
          selector: "#name-section span"
        },
        title: {
          selector: "#name-section .trackTitle"
        },
        imageUrl: {
          selector: "#tralbumArt img",
          attr: 'src',
          convert: function (src) {
            if (src) {
              return src.replace(/_\d{1,3}\./, "_2."); // use small version
            }
          }
        },
        tracks: {
          listItem: 'table#track_table tr.track_row_view',
          data: {
            name: {
              selector: 'span[itemprop=name]'
            },
            url: {
              selector: 'a[itemprop=url]',
              attr: 'href',
              convert: function (href) {
                if (!href) return null
                return urlHelper.resolve(albumUrl, href)
              }
            },
            duration: {
              selector: '.time',
              convert: function (duration) {
                if (!duration) return null
                return duration
              }
            }
          }
        }
      }
    }
  });
  var object = assignProps(data.album, {}, ['artist', 'title', 'imageUrl', 'tracks']);
  // Remove undefined/null properties.
  for (var i = 0; i < object.tracks.length; i++) {
    // Remove tracks properties.
    for (var key in object.tracks[i]) {
      if (object.tracks[i].hasOwnProperty(key)) {
        if (!object.tracks[i][key])
          delete object.tracks[i][key]
      }
    }
  }
  var raw = this.extractJavascriptObjectVariable(html, 'TralbumData');
  // The only javascript in the variable is the concatenation of the base url
  // with the current album path. We nned to do it yourself.
  // Ex:
  //  url: "http://musique.coeurdepirate.com" + "/album/blonde",
  raw = raw.replace('" + "', '')
  try {
    object.raw = JSON5.parse(raw);
  } catch (error) {
    console.error(error);
  }
  object.url = albumUrl;
  // validate through JSON schema
  if (ajv.validate('album-info', object)) {
    return object;
  } else { // TODO add a flag to log only when debugging
    console.error('Validation error on album info: ', ajv.errorsText(), object);
    return null;
  }
};
