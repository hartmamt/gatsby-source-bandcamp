var req = require("tinyreq"),
  urlHelper = require('url'),
  htmlParser = require('./htmlParser.js'),
  utils = require('./utils.js');

const fetch = require("node-fetch");


exports.search = function (params, cb) {
  var url = utils.generateSearchUrl(params);
  req(url, function (error, html) {
    if (error) {
      cb(error, null);
    } else {
      var searchResults = htmlParser.parseSearchResults(html);
      cb(null, searchResults);
    }
  });
};


exports.getAlbumsWithTag = function (params, cb) {
  var url = utils.generateTagUrl(params);
  req(url, function (error, html) {
    if (error) {
      cb(error, null);
    } else {
      var tagResults = htmlParser.parseTagResults(html);
      cb(null, tagResults);
    }
  });
};


exports.getAlbumUrls = function (artistUrl, cb) {
  artistUrl = urlHelper.resolve(artistUrl, '/music');
  req(artistUrl, function (error, html) {
    if (error) {
      cb(error, null);
    } else {
      var albumUrls = htmlParser.parseAlbumUrls(html, artistUrl);
      cb(null, albumUrls);
    }
  });
};


exports.getAlbumInfo = function (albumUrl, cb) {
  const albumUrl = await fetch(albumUrl)
  return albumInfo = htmlParser.parseAlbumInfo(html, albumUrl);
};


exports.getAlbumProducts = function (albumUrl, cb) {
  req(albumUrl, function (error, html) {
    if (error) {
      cb(error, null);
    } else {
      var products = htmlParser.parseAlbumProducts(html, albumUrl);
      cb(null, products);
    }
  });
};
