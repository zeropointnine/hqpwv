/**
 * Server mechanics for playlist api.
 */
const log = require('./log');
const playlists = require('./playlists');

const doGet = (request, response) => {

  if (request.query['getPlaylists'] !== undefined) {
    response.send(playlists.getPlaylists());
    return;
  }
  if (request.query['deletePlaylist'] !== undefined) {
    const filename = request.query.name;
    if (!filename) {
      response.status(400).json( {error: 'missing_name_param'} );
      return;
    }
    const isSuccess = playlists.deletePlaylist(filename);
    if (!isSuccess) {
      response.status(400).json( {error: 'delete_failed'} );
    } else {
      response.send('OK');
    }
    return;
  }

  response.status(400).json( {error: 'missing_required_param'} );
};

const doPost = (request, response) => {
  if (request.query['savePlaylist'] != undefined) {
    let filename = request.query.name;
    if (!filename) {
      response.status(400).json( {error: 'missing_name'} );
      return;
    }
    if (!request.body || !request.body.data || request.body.data.length == 0) {
      response.status(400).json( {error: 'missing_contents'} );
      return;
    }
    const isSuccess = playlists.savePlaylist(filename, request.body.data);
    if (!isSuccess) {
      response.status(400).json( {error: 'failed'} );
      return;
    }

    const list = playlists.getPlaylists();
    response.send( { result: list } );
    return;
  }

  response.status(400).json( {error: 'missing_required_param'} );
};

module.exports = {
  doGet: doGet,
  doPost: doPost
};
