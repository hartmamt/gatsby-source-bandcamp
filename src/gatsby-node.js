import bandcamp from 'bandcamp-scraper';

const fetch = require("node-fetch");
// Cat Facts!
exports.sourceNodes = async ({
  actions,
  createNodeId,
  createContentDigest
}) => {
  const {
    createNode
  } = actions;
  // Create nodes here, generally by downloading data
  // from a remote API.
  //const query = await fetch("https://cat-fact.herokuapp.com/facts");
  //const data = await query.json();


  var albumUrl = 'https://pinegrove.bandcamp.com/album/skylight';
  bandcamp.getAlbumInfo(albumUrl, function (error, albumInfo) {
    if (error) {
      console.log(error);
    } else {
      console.log(JSON.stringify(albumInfo.tracks));
      // Process data into nodes.
      albumInfo.tracks.map(datum => {
        console.log('datum', datum)
        const nodeContent = JSON.stringify(datum);
        const nodeMeta = {
          id: createNodeId(`bandcamp-${datum.name}`),
          parent: null,
          children: [],
          internal: {
            type: `BandCamp`,
            content: nodeContent,
            contentDigest: createContentDigest(datum)
          }
        };
        const node = Object.assign({}, datum, nodeMeta);
        createNode(node);
      });
    }
  });


  // We're done, return.
  return;
};
