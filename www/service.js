import App from './app.js';
import Commands from './commands.js';
import DataUtil from './data-util.js';
import Model from './model.js';
import ToastView from './toast-view.js';
import Values from './values.js';

/**
 * Manages calls to webservice `commands` endpoint.
 * Rem, the service can only handle a single request at a time.
 * That's why requests get put in a queue and are called one-by-one.
 *
 * Also automatically stores the the data coming from those calls
 * (namely, status, library and playlist) into `Model`,
 * which then triggers app events.
 *
 * All calls to the `commands` endpoint should be made through here.
 */
class Service {

	queue = [];
	currentItem = null;

  queueTimestamp = 0;
	itemTimestamp = 0;
  proxyErrorStartTime = 0;
  proxyErrorCounter = 0;
  hasSentProxyErrorEvent = false;
  serverErrorStartTime = 0;
  serverErrorCounter = 0;
  hasSentServerErrorEvent = false;

	/** The currently active command 'item', which is an object with an xml and callback properties. */
	get currentItem() { return this.currentItem; }

	get isBusy() { return !!this.currentItem }

	/** Queued 'commands' waiting to be processed. */
	get queue() { return this.queue; }

	/**
   * Queues a command. If queue is empty, executes immediately.
   * (nb, in practice, we almost always want to insert command/s
   * at the front of the queue using `queueCommandsFront`)
   */
	queueCommand(xml, callback) {
		const item = { xml: xml, callback: callback };
		this.queue.push(item);
		if (!this.currentItem) {
			this.queueTimestamp = new Date().getTime();
			this.doNextItem();
		}
	}

	/** Puts a command at the front of the queue. */
	queueCommandFront(xml, callback) {
		const item = { xml: xml, callback: callback };
		this.queue.unshift(item);
		if (!this.currentItem) {
			this.queueTimestamp = new Date().getTime();
			this.doNextItem();
		}
	}

	/** 
	 * Inserts a list of commands at the front of the queue. 
	 * @param items s/b an array where each item is either an xml string or an object w/ xml and callback properties.
	 */
	queueCommandsFront(array) {
		if (!array || array.length == 0) {
			return;
		}
		const arrayOfObjects = [];
		for (const item of array) {
			const isItemString = (typeof item === 'string' || item instanceof String);
			const object = isItemString ? { xml: item } : item;
			arrayOfObjects.push(object);
		}
		this.queue.unshift(...arrayOfObjects);
		if (!this.currentItem) {
			this.queueTimestamp = new Date().getTime();
			this.doNextItem();
		}
	}

	queueCommandFrontAndGetStatus(xml, callback) {
		const a = [
			{ xml: xml, callback: callback },
			{ xml: Commands.status(), callback: null }
		];
		this.queueCommandsFront(a);
	}

	doNextItem() {
		if (this.queue.length == 0) {
			///cl(`service - queue complete ${new Date().getTime() - this.queueTimestamp}ms`);
			this.currentItem = null;
			return;
		}

		this.itemTimestamp = new Date().getTime();
		this.currentItem = this.queue.shift();

    /*
    // somehow this optimization causes problem when new track activates apply-preset sequence.
    // busy state does not get activated, and track status does not update for 10 seconds :/
    // this may mean problem already exists and is timing-dependent ugh
    if (this.currentItem.xml.includes('<Status') && !this.currentItem.callback) {
      if (this.queue.length) {
        const nextItem = this.queue[0];
        if (nextItem.xml.includes('<Status')) {
          cl('fyi skipping unnecessary status call');
          this.doNextItem();
          return;
        }
      }
    }
    */

		this.makeRequest();
	}

	/**
   * Makes request to server using the xml in `currentItem`
   */
	makeRequest() {
    /*
    if (!this.currentItem.xml.includes('<Status')) {
      cl(`${Values.uptimeString} service ${this.currentItem.xml.substr(0,60)}`);
    }
    */
    const url = Values.COMMAND_ENDPOINT
        + "?id=" + App.instance.instanceId
        + "&xml=" + encodeURIComponent(this.currentItem.xml);
    $.ajax({
      url: url,
      error: this.onError,
      success: this.onSuccess}); // todo timeout?
  }

  /**
   * If too many consecutive errors, send an event (just once).
   */
  onError = (jqXHR, textStatus, errorThrown ) => {
    if (!this.hasSentServerErrorEvent) {
      if (this.serverErrorCounter == 0) {
        this.serverErrorStartTime = new Date().getTime();
      }
      this.serverErrorCounter++;
      const timespan = (new Date().getTime() - this.serverErrorStartTime);
      if (this.serverErrorCounter >= 3 || timespan > 10000) {
        // Rem, status of 0 means unreachable
        cl('sending event proxy-errors');
        $(document).trigger('server-errors', jqXHR.status);
        this.hasSentServerErrorEvent = true;
      }
    }
    this.doNextItem();
  };

	/**
	 * Invokes the current item's callback with the response data, 
	 * and does next item in queue, if any. 
	 *
	 * @param data is json (converted from xml, using `fast-xml-parser`)
	 *     Errors are represented like this: `{ error: "some_error" }`
	 */
	onSuccess = (data, textStatus, jqXHR) => {
    this.serverErrorCounter = 0;
    this.serverErrorStartTime = 0;

    // First, show toast on hqp-reported error
    const errorText = DataUtil.isResultError(data);
    if (errorText) {
      if (errorText != DataUtil.NO_ERROR_TEXT_TEXT) {
        // hqp will report error w/o error text if doing next-track from last-track (ie, more like a warning)
        // which make me suspect it may do likewise in similarly non-error-like situations
        ToastView.show(`<span class="colorAccent">HQPlayer-reported error: ${errorText}</span>`, 3000);
      }
    }

    // Store model data if applicable;
		// model will send event that it's been updated.
		if (data['Status'] != undefined) {
      Model.setStatusUsingResponseObject(data['Status']);
    } else if (data['State'] != undefined) {
      Model.setStateUsingResponseObject(data);
		} else if (data['PlaylistGet'] != undefined) {
			Model.setPlaylistDataUsingResponseObject(data);
		} else if (data['LibraryGet'] != undefined) {
      Model.setLibraryDataUsingResponseObject(data);
		} else if (data['GetInfo']!= undefined) {
      Model.setInfoUsingResponseObject(data);
    }

		// Do callback associated with the item
		if (this.currentItem.callback) {
			this.currentItem.callback(data); 
		}

    // Send event about the type of response that was handled, plus payload
    const a = Object.keys(data);
    let type = null;
    if (a.length != 1) {
      cl('warning unexpected, wrong number of keys:', data);
    } else {
      type = a[0];
    }
    $(document).trigger('service-response-handled', [type, data]);

    if (data['error']) {
      // Rem, this is an error coming from the hqpwv server, not hqp.
      if (!this.hasSentProxyErrorEvent) {
        // If too many consecutive 'proxy errors', send event (just 1).
        if (this.proxyErrorCounter == 0) {
          this.proxyErrorStartTime = new Date().getTime();
        }
        this.proxyErrorCounter++;
        const timespan = (new Date().getTime() - this.proxyErrorStartTime);
        if (this.proxyErrorCounter >= 3 || timespan > 10000) {
          cl('sending event proxy-errors')
          $(document).trigger('proxy-errors', data['error']);
          this.hasSentProxyErrorEvent = true;
        }
      } else {
        this.proxyErrorCounter = 0;
        this.proxyErrorStartTime = 0;
      }
    }

    this.doNextItem();
	}
}

export default new Service()