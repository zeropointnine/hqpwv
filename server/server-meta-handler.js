/**
 * Server mechanics for metadata layer or smth.
 */
const log = require('./log');
const meta = require('./meta');

const doGet = (request, response) => {

  if (request.query['info'] !== undefined) {
    response.send({
      'isEnabled': meta.getIsEnabled(),
      'mainFilepath': meta.getFilepath()
    });
    return;
  }

  if (!meta.getIsEnabled()) {
    response.send( { error: 'meta_disabled'} );
    return;
  }

  // ---
  // 'accessor' methods

  if (request.query['getMain'] !== undefined) {
    response.send(meta.getData());
    return;
  }

  if (request.query['getDownload'] !== undefined) {
    response.setHeader('Content-Type', 'text/json');
    response.setHeader('Content-disposition', 'attachment;filename=hqpwv-metadata.json');
    response.send(meta.getData());
    return;
  }

  // ---
  // 'mutator' methods

  const hash = request.query['hash'];
  const value = request.query['value'];

  if (request.query['updateTrackFavorite'] !== undefined) {
    if (!hash || !value) {
      response.status(400).json( {error: 'missing_required_sub_param'} );
      return;
    }
    const result = meta.updateTrackFavorite(hash, value);
    response.send( { result: result } );
    return;
  }

  if (request.query['updateAlbumFavorite'] !== undefined) {
    if (!hash || !value) {
      response.status(400).json( {error: 'missing_required_sub_param'} );
      return;
    }
    const result = meta.updateAlbumFavorite(hash, value);
    response.send( { result: result } );
    return;
  }

  if (request.query['incrementTrackViews'] !== undefined) {
    if (!hash) {
      response.status(400).json( {error: 'missing_required_sub_param'} );
      return;
    }
    const result = meta.incrementTrackViews(hash);
    response.send( { result: result } );
    return;
  }

  if (request.query['updateTrackViews'] !== undefined) {
    if (!hash || !value) {
      response.status(400).json( {error: 'missing_required_sub_param'} );
      return;
    }
    const result = meta.updateTrackViews(hash, value);
    response.send( { result: result } );
    return;
  }

  if (request.query['deletePlaylist'] !== undefined) {
    const name = request.query['name'];
    const index = request.query['index'];
    if (!name || isNaN(index)) {
      response.status(400).json( {error: 'bad_param'} );
      return;
    }
    const result = meta.deletePlaylist(name, index);
    response.send( { result: result } );
    return;
  }

  response.status(400).json( {error: 'missing_required_param'} );
};

const doPost = (request, response) => {
  if (request.query['addPlaylist'] != undefined) {
    const o = request.body;
    const uriKey = 'uris[]'; // weird `body-parser` thing
    if (o[uriKey]) {
      o['uris'] = o[uriKey];
      delete o[uriKey];
    }
    let result = meta.addPlaylist(request.body);
    response.send({ result: result });
    return;
  }

  response.status(400).json( {error: 'missing_required_param'} );
};

module.exports = {
  doGet: doGet,
  doPost: doPost
};
