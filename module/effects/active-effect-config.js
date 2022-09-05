import { GURPSActiveEffectsChanges } from './effects.js'

const ADD = 2
const OVERRIDE = 5
const CUSTOM = 0
const VALUE_ELEMENT = 'div.value .gurps-effect-control'

// Change keys that should only allow mode = OVERRIDE
const overrideKeys = [
  'data.conditions.exhausted',
  'data.conditions.reeling',
  'data.conditions.posture',
  // 'data.conditions.maneuver',
]

// Change keys that allow for a single mode value
const singleModeAllowed = [
  'data.conditions.self.modifiers',
  'data.conditions.target.modifiers',
  'data.conditions.exhausted',
  'data.conditions.reeling',
  'data.conditions.posture',
  'data.conditions.maneuver',
]

const booleanValue = ['data.conditions.exhausted', 'data.conditions.reeling']

export default class GurpsActiveEffectConfig extends ActiveEffectConfig {
  static onRender(formApp, html, data) {
    let index = 0
    let key = html.find(`select[name='changes.${index}.key']`)
    while (!!key && key.length) {
      GurpsActiveEffectConfig._adjustElements(html, index)
      key = html.find(`select[name='changes.${++index}.key']`)
    }
  }

  static _adjustElements(html, index) {
    let key = html.find(`select[name='changes.${index}.key']`)
    let mode = html.find(`select[name='changes.${index}.mode']`)
    let currentKey = key[0].value

    if (overrideKeys.includes(currentKey)) {
      // The only valid change mode is 'Override'. Change the Change Mode select to 'Override' and disable it.
      mode.prop('selectedIndex', OVERRIDE)
    } else if (currentKey === 'data.conditions.maneuver') {
      mode.prop('selectedIndex', CUSTOM)
    } else if (['data.conditions.target.modifiers', 'data.conditions.self.modifiers'].includes(currentKey)) {
      mode.prop('selectedIndex', ADD)
    }

    if (singleModeAllowed.includes(currentKey)) {
      mode.addClass('gurps-ignore')
      mode.find(`option:not(:selected)`).prop('disabled', true)
    } else {
      mode.removeClass('gurps-ignore')
      mode.find(`option`).prop('disabled', false)
    }

    // Get all the alternative widgets for this effect.
    // For the appropriate one, set its visibility and name so that it is wired into the object model.
    let valueWidgets = html.find(`ol.changes-list li div.value:eq(${index})`).find('> *')
    // First set them all to invisible:
    valueWidgets.hide()
    // Second set the name to DUMMY.changes.${index}.value
    valueWidgets.prop('name', `DUMMY.changes.${index}.value`)

    // Find the one that should be set:
    let widget = valueWidgets.filter(`[data-action='edit']`)
    if (booleanValue.includes(currentKey)) widget = valueWidgets.filter(`[data-action='select-boolean']`)
    else if (currentKey === 'data.conditions.posture') widget = valueWidgets.filter(`[data-action='select-posture']`)
    else if (currentKey === 'data.conditions.maneuver') widget = valueWidgets.filter(`[data-action='select-maneuver']`)

    widget.prop('name', `changes.${index}.value`)
    widget.show()
  }

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
    html.find('.gurps-effect-control').on('click change', this._onGurpsEffectControl.bind(this, html))
  }

  /**
   * Provide centralized handling of mouse clicks on control buttons.
   * Delegate responsibility out to action-specific handlers depending on the button action.
   * @param {MouseEvent} event      The originating click event
   * @private
   */
  _onGurpsEffectControl(html, event) {
    // <select name="changes.0.key" class="gurps-effect-control" data-action="select-key">
    let type = event.type
    let action = event.currentTarget.dataset.action

    if (type === 'click' && ['add', 'delete'].includes(action)) return super._onEffectControl(event)

    if (type === 'change' && action === 'select-key') {
      let effectIndex = event.currentTarget.dataset.index
      GurpsActiveEffectConfig._adjustElements(html, effectIndex)
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

    delete formData.DUMMY

    console.log(formData)

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
