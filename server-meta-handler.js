/**
 * Server mechanics for metadata layer or smth.
 */
const meta = require('./meta');

const go = (request, response) => {

  if (request.query['info'] !== undefined) {
    response.send({
      'isEnabled': meta.getIsEnabled(),
      'filepath': meta.getFilepath()
    });
    return;
  }

  // ---

  if (!meta.getIsEnabled()) {
    response.send( { error: 'meta_disabled'} );
    return;
  }

  // ---
  // 'get' methods

  if (request.query['getTracks'] !== undefined) {
    response.send(meta.getTracks());
    return;
  }

  if (request.query['getTracksDownload'] !== undefined) {
    response.setHeader('Content-Type', 'text/json');
    response.setHeader('Content-disposition', 'attachment;filename=hqpwv-metadata.json');
    response.send(meta.getTracks());
    return;
  }
  // ---
  // 'put' methods

  const hash = request.query['hash'];
  const value = request.query['value'];

  if (request.query['updateTrackViews'] !== undefined) {
    if (!hash || !value) {
      response.status(400).json( {error: 'missing_required_sub_param'} );
      return;
    }
    meta.updateTrackViews(hash, value);
    response.status(200).send('');
    return;
  }

  if (request.query['updateTrackFavorite'] !== undefined) {
    if (!hash || !value) {
      response.status(400).json( {error: 'missing_required_sub_param'} );
      return;
    }
    meta.updateTrackFavorite(hash, value);
    response.status(200).send('');
    return;
  }

  response.status(400).json( {error: 'missing_required_param'} );
};

module.exports = {
  go: go
};
