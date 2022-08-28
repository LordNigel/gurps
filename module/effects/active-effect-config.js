import { GURPSActiveEffectsChanges } from './effects.js'

const ADD = 2
const OVERRIDE = 5
const VALUE_ELEMENT = 'div.value .gurps-effect-control'

export default class GurpsActiveEffectConfig extends ActiveEffectConfig {
  get template() {
    return 'systems/gurps/templates/active-effects/active-effect-config.html'
  }

  getData() {
    const sheetData = super.getData()
    sheetData.changes = GURPSActiveEffectsChanges
    sheetData.changeArrays = {
      text: [],
    }
    return sheetData
  }

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html)
    html.find('.gurps-effect-control').on('click change', this._onEffectControl.bind(this, html))
  }

  /**
   * Provide centralized handling of mouse clicks on control buttons.
   * Delegate responsibility out to action-specific handlers depending on the button action.
   * @param {MouseEvent} event      The originating click event
   * @private
   */
  _onEffectControl(html, event) {
    // <select name="changes.0.key" class="gurps-effect-control" data-action="select-key">
    let type = event.type
    let action = event.currentTarget.dataset.action

    if (type === 'click' && ['add', 'delete'].includes(action)) return super._onEffectControl(event)
    if (type === 'change' && action === 'select-key') {
      let effectIndex = event.currentTarget.dataset.index
      let options = event.currentTarget.options
      let keyIndex = event.currentTarget.selectedIndex
      let value = options[keyIndex].value

      // Reset Mode control to enabled.
      let modeSelect = html.find(`select[name='changes.${effectIndex}.mode']`)
      // modeSelect.prop('disabled', false)

      const overrideKeys = [
        'data.conditions.exhausted',
        'data.conditions.reeling',
        'data.conditions.posture',
        'data.conditions.maneuver',
      ]

      if (overrideKeys.includes(value)) {
        // The only valid change mode is 'Add'. Change the Change Mode select to 'Add' and disable it.
        modeSelect.prop('selectedIndex', OVERRIDE)
      }

      // If the new Key is 'Target Modifier' or 'Self Modifier':
      if (['data.conditions.target.modifiers', 'data.conditions.self.modifiers'].includes(value)) {
        // The only valid change mode is 'Add'. Change the Change Mode select to 'Add' and disable it.
        modeSelect.prop('selectedIndex', ADD)
      }
    }
  }

  /** @inheritdoc */
  async _updateObject(event, formData) {
    // If there is an EndCondition, this is a temporary effect. Signal this by setting the core.statusId value.
    if (!getProperty(formData, 'flags.gurps.effect')) setProperty(formData, 'flags.gurps.effect', { effect: {} })

    let newEndCondition = getProperty(formData, 'flags.gurps.effect.endCondition')
    if (!!newEndCondition && !this.object.getFlag('core', 'statusId')) {
      setProperty(formData, 'flags.core.statusId', this.object.getFlag('core', 'statusId'))
    }

    let result = await super._updateObject(event, formData)

    // Tell the Active Effects List window to refresh its data.
    if (this._parentWindow) this._parentWindow.render(true)
    return result
  }

  /**
   * Add a reference to the 'parent' window into options so we can refresh it.
   * @param {*} force
   * @param {*} options
   */
  render(force, options = {}) {
    if (options.hasOwnProperty('parentWindow')) this._parentWindow = options.parentWindow
    return super.render(force, options)
  }
}
