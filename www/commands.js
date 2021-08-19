import Model from './model.js';
import DataUtil from './data-util.js';
import AlbumUtil from './album-util.js';

/**
 * Functions that construct and return xml "commands"
 * which get sent to HQPlayer tcp socket through the proxy server.
 * 'Static' class.
 */
export default class Commands {}

Commands.getInfo = () => {
	return `<GetInfo/>`;
};

Commands.status = () => {
	return `<Status subscribe="0" />`;
};

Commands.state = () => {
  return `<State />`;
};

Commands.libraryGet = () => {
	return `<LibraryGet pictures="0" />`;
};

Commands.libraryPicture = (path) => {
	return `<LibraryPicture path="${path}" />`;
};

Commands.playlistGet = () => {
	return `<PlaylistGet picture="0" />`;
};

Commands.playlistAdd = (uri, queued, clear) => {
	// rem, hqp expects 1 for 'true'
	queued = (queued === true || queued === 1) ? 1 : 0;
	clear = (clear === true || clear === 1) ? 1 : 0;
  return `<PlaylistAdd uri="${uri}" queued="${queued}" clear="${clear}"></PlaylistAdd>`; // todo smth abt <metadata>
};

Commands.playlistClear = () => {
	return `<PlaylistClear />`;
};

Commands.playlistRemove = (index) => {
	return `<PlaylistRemove index="${index}" />`;
};

Commands.playlistMoveUp = (index) => {
	return `<PlaylistMoveUp index="${index}" />`;
};

Commands.playlistMoveDown = (index) => {
	return `<PlaylistMoveDown index="${index}" />`;
};

Commands.getTransport = () => {
  return `<GetTransport />`;
}

Commands.setTransport = (value, arg) => {
  return `<SetTransport value="${value}" arg="${arg}" />`;
};

Commands.setRepeat = (value) => {
  return `<SetRepeat value="${value}" />`;
};

Commands.selectTrack = (oneIndexedValue) => {
	return `<SelectTrack index="${oneIndexedValue}" />`;
};

Commands.play = () => {
	return `<Play />`; // todo support attribute 'last' ?
};

Commands.pause = () => {
	return "<Pause />";
};

Commands.stop = () => {
	return "<Stop />";
};

Commands.previous = () => {
	return "<Previous />";
};

Commands.next = () => {
	return "<Next />";
};

Commands.backward = () => {
	return "<Backward />";
};

Commands.forward = () => {
	return "<Forward />";
};

Commands.seek = (seconds) => {
	return `<Seek position="${seconds}" />`;
};

Commands.getModes = () => {
  return `<GetModes />`;
};
Commands.setMode = (value) => {
  return `<SetMode value="${value}" />`;
};

Commands.getFilters = () => {
  return `<GetFilters />`;
};
Commands.setFilter = (value) => {
  return `<SetFilter value="${value}" />`;
};

Commands.getShapers = () => {
  return `<GetShapers />`;
};
Commands.setShaping = (value) => {
  return `<SetShaping value="${value}" />`;
};

Commands.getRates = () => {
  return `<GetRates />`;
};
Commands.setRate = (value) => {
  return `<SetRate value="${value}" />`;
};

Commands.volume = (value) => { // float
  return `<Volume value=${value} />`;
};

Commands.volumeUp = () => {
  return `<VolumeUp />`;
};

Commands.volumeDown = () => {
  return `<VolumeDown />`;
};


// Higher-level functions

Commands.playlistAddUsingAlbumAndIndex = (album, trackIndex) => {
	const albumPath = album['@_path'];
	const track = AlbumUtil.getTracksOf(album)[trackIndex];
	const trackFilename = track['@_name'];
	const uri = `file://${albumPath}/${trackFilename}`; // todo system directory separator char
	return Commands.playlistAdd(uri);
};

/**
 * Makes an array of <PlaylistAdd> commands using album object and start/end indices.
 */
Commands.playlistAddUsingAlbumAndIndices = (album, startIndex=0, endIndex=-1) => {
	const tracks = AlbumUtil.getTracksOf(album);
	startIndex = parseInt(startIndex);
	if (!(startIndex >= 0)) {
		startIndex = 0;
	}
	endIndex = parseInt(endIndex);
	if (!(endIndex >= 0)) {
		endIndex = tracks.length - 1
	}
	if (endIndex < startIndex) {
		endIndex = startIndex;
	}
	const items = [];
	for (let i = startIndex; i <= endIndex; i++) {
		const xml = Commands.playlistAddUsingAlbumAndIndex(album, i);
		items.push(xml);
	}
	return items;
};
