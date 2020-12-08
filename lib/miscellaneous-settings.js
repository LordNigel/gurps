'use strict'

export const SYSTEM_NAME = 'gurps'
export const SETTING_DEFAULT_LOCATION = 'default-hitlocation'
export const SETTING_SIMPLE_DAMAGE = 'combat-simple-damage'
export const SETTING_APPLY_DIVISOR = 'combat-apply-divisor'
export const SETTING_BLUNT_TRAUMA = 'combat-blunt-trauma'
export const SETTING_LOCATION_MODIFIERS = 'combat-location-modifiers'
export const SETTING_WHISPER_STATUS_EFFECTS = 'whisper-status-effectss'

export default function () {
  Hooks.once('init', async function () {
    // Register the setting.
    game.settings.register(SYSTEM_NAME, SETTING_DEFAULT_LOCATION, {
      name: 'Default hit location:',
      hint: 'Set the default hit location used to apply damage.',
      scope: 'world',
      config: true,
      type: String,
      choices: {
        'Torso': 'Torso',
        'Random': 'Random'
      },
      default: 'Torso',
      onChange: value => console.log(`Default hit location: ${value}`)
    })

    game.settings.register(SYSTEM_NAME, SETTING_SIMPLE_DAMAGE, {
      name: 'Use simple Apply Damage dialog:',
      hint: 'If true, only display the "Directly Apply" option in the Apply Damage dialog',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: value => console.log(`Use simply Apply Damage dialog : ${value}`)
    })

    game.settings.register(SYSTEM_NAME, SETTING_APPLY_DIVISOR, {
      name: 'Apply armor divisor to damage:',
      hint: 'If true, adjust the target\'s DR by the armor divisor on the attack.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
      onChange: value => console.log(`Apply Armor Divisor : ${value}`)
    })

    game.settings.register(SYSTEM_NAME, SETTING_BLUNT_TRAUMA, {
      name: 'Apply Blunt Trauma damage:',
      hint: 'If true, use Blunt Trauma rules for calculating damage on flexible armor.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
      onChange: value => console.log(`Apply Blunt Trauma : ${value}`)
    })

    game.settings.register(SYSTEM_NAME, SETTING_LOCATION_MODIFIERS, {
      name: 'Use Hit Location Wounding Modifiers:',
      hint: 'If true, modify Wounding Modifiers based on Hit Location.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
      onChange: value => console.log(`Apply Location Modifiers : ${value}`)
    })
    
    game.settings.register(SYSTEM_NAME, SETTING_WHISPER_STATUS_EFFECTS, {
      name: "Whisper Status Effects",
      hint: "When selected, Status Effects Messages (Shock, Major Wound, etc.) will be sent to the target's owner as a Whisper.   Otherwise they will be sent as a Out of Character (OOC) message to everyone",
      scope: "client",
      config: true,
      type: Boolean,
      default: false,
      onChange: value => console.log(`Whisper Status Effects : ${value}`)
    });


  })
}