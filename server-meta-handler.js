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

  if (request.query['getData'] !== undefined) {
    response.send(meta.getData());
    return;
  }

  if (request.query['getDataDownload'] !== undefined) {
    response.setHeader('Content-Type', 'text/json');
    response.setHeader('Content-disposition', 'attachment;filename=hqpwv-metadata.json');
    const o = meta.getShallowCopyEmptyHistory();
    response.send(o);
    return;
  }

  // ---
  // 'put' methods

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

  response.status(400).json( {error: 'missing_required_param'} );
};

module.exports = {
  go: go
};
