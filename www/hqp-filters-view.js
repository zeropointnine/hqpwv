/**
 *
 */
import Util from './util.js';
import ViewUtil from './view-util.js';
import Model from './model.js';
import ModelUtil from './model-util.js';
import Commands from './commands.js';
import Service from './service.js';
import Settings from './settings.js';
import HqpPresetsView from './hqp-presets-view.js';
import SnackView from './snack-view.js';

export default class HqpFiltersView {

  $el;
  $modeSelect;
  $filterSelect;
  $shaperSelect;
  $rateSelect;
  $info;

  presetsView;

  modesArray = [];
  filtersArray = [];
  shapersArray = [];
  ratesArray = [];

  // todo `<FiltersItem index= name= value= />` [?]

  constructor($el) {
    this.$el = $el;

    this.$modeSelect = this.$el.find('#modeSelect');
    this.$filterSelect = this.$el.find('#filterSelect');
    this.$shaperSelect = this.$el.find('#shaperSelect');
    this.$rateSelect = this.$el.find('#rateSelect');

    this.$modeSelect.on('change', this.onSelectChange);
    this.$filterSelect.on('change', this.onSelectChange);
    this.$shaperSelect.on('change', this.onSelectChange);
    this.$rateSelect.on('change', this.onSelectChange);

    this.$info = this.$el.find('#hqpFiltersInfo');

    this.presetsView = new HqpPresetsView(this.$el.find('#hqpPresetsView'));

    Util.addAppListener(this, 'save-hqp-preset-button', this.onSavePresetButton);
    Util.addAppListener(this, 'load-hqp-preset-button', this.onLoadPresetButton);
  }

  onShow() {
    this.presetsView.updateLoadPresetsText();
    this.updateData(this.populateSelects);

    ViewUtil.setVisible(this.$info, !ModelUtil.isStopped());
    if (!ModelUtil.isStopped()) {
      $(document).on('model-status-updated', this.onModelStatusUpdated);
    }
  }

  onHide() {
    $(document).off('model-status-updated', this.onModelStatusUpdated);
  }
  
  updateData(callback) {
    Service.queueCommandsFront([
        { xml: Commands.getModes(), callback: this.onGetModes},
        { xml: Commands.getFilters(), callback: this.onGetFilters },
        { xml: Commands.getShapers(), callback: this.onGetShapers },
        { xml: Commands.getRates(), callback: this.onGetRates },
        { xml: Commands.status(), callback: callback }
    ]);
  }

  onGetModes = (data) => {
    this.modesArray = ModelUtil.getArrayFrom(data, 'GetModes', 'ModesItem'); // note 'ModesItem' (plural)
  };
  onGetFilters = (data) => {
    this.filtersArray = ModelUtil.getArrayFrom(data, 'GetFilters', 'FiltersItem');
  };
  onGetShapers = (data) => {
    this.shapersArray = ModelUtil.getArrayFrom(data, 'GetShapers', 'ShapersItem');
  };
  onGetRates = (data) => {
    this.ratesArray = ModelUtil.getArrayFrom(data, 'GetRates', 'RatesItem');
    if (this.ratesArray[0]['@_rate'] == '0') { // special case
      this.ratesArray.shift();
    }
  };

  populateSelects = () => {
    const mode = Model.statusData['@_active_mode'];
    this.populateSelect(this.$modeSelect, this.modesArray, '@_name', '@_index', mode);

    const filter = Model.statusData['@_active_filter']; // these are label values, not indices :/
    this.populateSelect(this.$filterSelect, this.filtersArray, '@_name', '@_index', filter);

    const shaper = Model.statusData['@_active_shaper'];
    this.populateSelect(this.$shaperSelect, this.shapersArray, '@_name', '@_index', shaper);

    const rate = Model.statusData['@_active_rate'];
    this.populateSelect(this.$rateSelect, this.ratesArray, '@_rate', '@_index', rate);

    // cl(mode, filter, shaper, rate)
  };

  /**
   * Use this to guarantee (more or less) that views will get updated reliably after a 'set' command
   * due to the fact that 'set' commands are observed to not always be 'synchronous'.
   */
  populateSelectsRedundant = () => {
    setTimeout(() => Service.queueCommand(Commands.status(), this.populateSelects), 250);
    setTimeout(() => Service.queueCommand(Commands.status(), this.populateSelects), 1000);
    // also, block silently
    this.$el.css('pointer-events', 'none');
    setTimeout(() => this.$el.css('pointer-events', ''), 1100);
  };

  /**
   * @param $select the <select> to be be populated
   * @param array the data array from which the <options> will be populated
   * @param labelKey the key from the array's object items used for the <option> text
   * @param indexKey the key from the array's object items used for the <option value>
   * @param selectedLabelText dictates which <option> should be selected (bc this is how the data comes in from <Status>)
   */
  populateSelect($select, array, labelKey, indexKey, selectedLabelText) {
    // Filter item properties: name, index, value
    // Shaper items properties: name, index, value
    // Rate itemsproperties: rate, index
    $select.empty();
    let optionsHtml = '';
    for (let item of array) {
      const optionText = item[labelKey];
      const value = item[indexKey];
      const selectedness = (optionText == selectedLabelText) ? 'selected' : '';
      optionsHtml += `<option value="${value}" ${selectedness}>${optionText}</option>`;
    }
    $select.html(optionsHtml);
  }

  onSelectChange = (e) => {
    // Note: The option value attribute holds the data object's _index_ value,
    // which is what's used for the 'Set' XML's "value" attribute (!)
    const select = e.currentTarget;
    const value = select.value;
    if (value == undefined) {
      cl('warning no value on select', $select);
      return;
    }

    let command;
    let responseKey;
    let label;
    switch (select) {
      case this.$modeSelect[0]:
        command = Commands.setMode(value);
        responseKey = 'SetMode';
        label = 'mode';
        break;
      case this.$filterSelect[0]:
        command = Commands.setFilter(value);
        responseKey = 'SetFilter';
        label = 'filter';
        break;
      case this.$shaperSelect[0]:
        command = Commands.setShaping(value);
        responseKey = 'SetShaping';
        label = 'shaper';
        break;
      case this.$rateSelect[0]:
        command = Commands.setRate(value);
        responseKey = 'SetRate';
        label = 'bitrate';
        break;
      default:
        break;
    }
    if (command == undefined) {
      cl('warning no command');
      return;
    }

    Service.queueCommandFront(command, (data) => {
      const b = ModelUtil.isResultOk(data, responseKey);
      if (!b) {
        SnackView.show('set-error', 'HQPlayer response', `Couldn't set ${label}`, '');
      }
      // Do full update regardless because
      // (1) not sure that result=ok guarantees that the 'set' is accepted
      // (2) not sure if setting one value may invalidate another (eg rate)
      this.updateData(this.populateSelectsRedundant);
    });
  };

  onSavePresetButton(index) {
    const mode = Model.statusData['@_active_mode'];
    const filter = Model.statusData['@_active_filter'];
    const shaper = Model.statusData['@_active_shaper'];
    const rate = Model.statusData['@_active_rate'];
    const o = { mode: mode, filter: filter, shaper: shaper, rate: rate };
    Settings.hqpPresets[index] = o;
    Settings.commitHqpPresets();
    this.presetsView.updateLoadPresetsText();
  }

  onLoadPresetButton(index) {
    const o = Settings.hqpPresets[index];
    // Make sure object exists
    if (!o) {
      return;
    }
    // Make sure each property has a value
    const mode = o['mode'];
    const filter = o['filter'];
    const shaper = o['shaper'];
    const rate = o['rate'];
    if (!mode || !filter || !shaper || !rate) {
      return;
    }
    // Make sure each value exists in the current arrays data
    // todo but actually first must apply mode and then reload filters/shapers/rates :/
    // const result = this.isPresetValid(o);

    this.applyPreset(o);
  }

  /**
   * Verifies that the current settings arrays do have values
   * for each of the preset's properties.
   * Rem tho, filter/shaper/rate arrays are dependent on the currently set mode!
   */
  isPresetValid(o) {
    const mode = o['mode'];
    const filter = o['filter'];
    const shaper = o['shaper'];
    const rate = o['rate'];
    let b;
    b = Util.hasMatch(this.modesArray, '@_name', mode);
    cl(b);
    b = Util.hasMatch(this.filtersArray, '@_name', filter);
    cl(b);
    b = Util.hasMatch(this.shapersArray, '@_name', shaper);
    cl(b);
    b = Util.hasMatch(this.ratesArray, '@_rate', rate);
    cl(b);
    return true; // todo revisit
  }

  applyPreset(o) {
    const lookup = (array, key1, value, key2) => {
      for (let o of array ) {
        if (o[key1] == value) {
          return o[key2];
        }
      }
    };

    const step4 = () => {
      this.populateSelectsRedundant(); // done
    };
    const step3 = () => {
      let filterIndex = lookup(this.filtersArray, '@_name', o['filter'], '@_index');
      let shaperIndex = lookup(this.shapersArray, '@_name', o['shaper'], '@_index');
      let rateIndex = lookup(this.ratesArray, '@_rate', o['rate'], '@_index');
      const a = [
        Commands.setFilter(filterIndex),
        Commands.setShaping(shaperIndex),
        { xml: Commands.setRate(rateIndex), callback: step4 }
      ];
      Service.queueCommandsFront(a);
    };
    const step2 = () => {
      this.updateData(step3);
    };

    // 1. Set mode
    // 2. Update the data arrays
    // 3. And only then set filter/shaper/rate
    // 4. Finally, repopulate selects.
    let modeIndex = lookup(this.modesArray, '@_name', o['mode'], '@_index');
    Service.queueCommandFront(Commands.setMode(modeIndex), step2);
  }

  onModelStatusUpdated = () => {
    if (ModelUtil.isStopped()) {
      ViewUtil.setVisible(this.$info, false);
      $(document).off('model-status-updated', this.onModelStatusUpdated);
    }
  }
}
