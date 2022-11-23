import { d6ify } from "@util"
import { HitLocation } from "@module/damage_calculator/hit_location"


/* Here is where we do all the work to try to parse the text inbetween [ ].
 Supported formats:
  +N <desc>
  -N <desc>
	add a modifier to the stack, using text as the description
  ST/IQ/DX[+-]N <desc>
	attribute roll with optional add/subtract
  CR: N <desc>
	Self control roll
  "Skill*" +/-N
	Roll vs skill (with option +/- mod)
  "ST12"
  "SW+1"/"THR-1"
  "PDF:B102"
  	
  "modifier", "attribute", "selfcontrol", "damage", "roll", "skill", "pdf"

  (\(-?[\.\d]+\))? == (-.#)
*/

export const COSTS_REGEX = /.*\* ?(?<verb>(cost|per|costs))? (?<cost>\d+) ?(?<type>[ \w\(\)]+)/i
export const DAMAGE_REGEX =
  /^(?<accum>\+)?(?<roll>\d+)(?<D>d\d*)?(?<adds>[\–\-+]@?\w+)?(?<mult>[×x\*]\d+\.?\d*)? ?(?<div>\(-?[\.\d]+\))?(?<min>!)? ?(?<other>[^\*]*?)(?<costs>\*(costs|per)? \d+ ?[\w\(\) ]+)?(?<follow>,.*)?$/i
export const DMG_INDEX_DICE = 1
export const DMG_INDEX_D = 2
export const DMG_INDEX_ADDS = 3
export const DMG_INDEX_MULTIPLIER = 4
export const DMG_INDEX_DIVISOR = 5
export const DMG_INDEX_BANG = 6
export const DMG_INDEX_TYPE = 7
export const DMG_INDEX_COST = 8

export const DERIVED_DAMAGE_REGEX =
  /^(?<accum>\+)?(?<att>sw|thr)()(?<adds>[\–\-+]@?\w+)?(?<mult>[×x\*]\d+\.?\d*)? ?(?<div>\(-?[\.\d]+\))?(?<min>!)? ?(?<other>[^\*]*?)(?<costs>\*(costs|per)? \d+ ?[\w\(\) ]+])?(?<follow>,.*)?$/i
export const DMG_INDEX_BASICDAMAGE = 1

/**
 * @param {string} str
 * @param {string} [overridetxt]
 * @returns {{text: string, action: Action} | null}
 */
export function parseForRollOrDamage(str, overridetxt) {
  // Straight roll 4d, 2d-1, etc. Is "damage" if it includes a damage type. Allows "!" suffix to indicate minimum of 1.
  // Supports:  2d+1x3(5), 4dX2(0.5), etc
  // Straight roll, no damage type. 4d, 2d-1, etc. Allows "!" suffix to indicate minimum of 1.
  str = str.toString() // convert possible array to single string
  let a = str.match(DAMAGE_REGEX)
  if (!!a) {
    const D = a.groups.D || '' // Can now support non-variable damage '2 cut' or '2x3(1) imp'
    const other = !!a.groups.other ? a.groups.other.trim() : ''
    let [actualType, extDamageType, hitLocation] = _parseOtherForTypeModiferAndLocation(other)
    let dmap = GURPS.DamageTables.translate(actualType.toLowerCase())
    if (!dmap) {
      dmap = GURPS.DamageTables.translate(extDamageType?.toLowerCase())
      if (!!dmap) {
        actualType = extDamageType
        extDamageType = ''
      }
    }
    const woundingModifier = GURPS.DamageTables.woundModifiers[dmap]
    const [adds, multiplier, divisor, bang] = _getFormulaComponents(a.groups)

    var next
    if (a.groups.follow) {
      next = parseForRollOrDamage(a.groups.follow.substring(1).trim()) // remove ',')
      if (!!next) next = next.action
    }

    if (!woundingModifier) {
      // Not one of the recognized damage types. Ignore Armor divisor, but allow multiplier.
      let dice = D === 'd' ? d6ify(D) : D
      if (!dice) return null // if no damage type and no dice, not a roll, ex: [70]
      let action = {
        orig: str,
        type: 'roll',
        displayformula: a.groups.roll + D + adds + multiplier + bang,
        formula: a.groups.roll + dice + adds + multiplier + bang,
        desc: other, // Action description
        costs: a.groups.cost,
        hitlocation: hitLocation,
        accumulate: !!a.groups.accum,
        next: next,
      }
      return {
        text: gspan(overridetxt, str, action),
        action: action,
      }
    } else {
      // Damage roll 1d+2 cut.
      let action = {
        orig: str,
        type: 'damage',
        formula: a.groups.roll + D + adds + multiplier + divisor + bang,
        damagetype: !!dmap ? dmap : actualType,
        extdamagetype: extDamageType,
        costs: a.groups.costs,
        hitlocation: hitLocation,
        accumulate: !!a.groups.accum,
        next: next,
      }
      return {
        text: gspan(overridetxt, str, action),
        action: action,
      }
    }
  }

  a = str.match(DERIVED_DAMAGE_REGEX) // SW+1
  if (!!a) {
    const basic = a.groups.att
    const other = !!a.groups.other ? a.groups.other.trim() : ''
    const [actualType, extDamageType, hitLocation] = _parseOtherForTypeModiferAndLocation(other)
    const dmap = GURPS.DamageTables.translate(actualType.toLowerCase())
    const woundingModifier = GURPS.DamageTables.woundModifiers[dmap]
    const [adds, multiplier, divisor, bang] = _getFormulaComponents(a.groups)

    if (!woundingModifier) {
      // Not one of the recognized damage types. Ignore Armor divisor, but allow multiplier.
      let action = {
        orig: str,
        type: 'derivedroll',
        derivedformula: basic,
        formula: adds + multiplier + bang,
        desc: other,
        costs: a.groups.costs,
        hitlocation: hitLocation,
        accumulate: !!a.groups.accum,
      }
      return {
        text: gspan(overridetxt, str, action),
        action: action,
      }
    } else {
      let action = {
        orig: str,
        type: 'deriveddamage',
        derivedformula: basic,
        formula: adds + multiplier + divisor + bang,
        damagetype: actualType,
        extdamagetype: extDamageType,
        costs: a.groups.costs,
        hitlocation: hitLocation,
        accumulate: !!a.groups.accum,
      }
      return {
        text: gspan(overridetxt, str, action),
        action: action,
      }
    }
  }
  return null
}

/**
 * @param {Record<string, string>} matches
 */
function _parseOtherForTypeModiferAndLocation(other) {
  // change the regex from /(w+)(.*)/ to /([A-Za-z0-9_+-]+)(.*)/ to make sure we recognize pi-, pi+ and pi++
  const dmgTypeMatch = other.match(/([A-Za-z0-9_]+[+-]?\+?)(.*)/)
  const actualType = !!dmgTypeMatch ? dmgTypeMatch[1] : other // only take the first word as damage type

  // parse for hitlocation and damge modifier (extDamageType)
  let extDamageType = undefined
  let hitLocation = undefined
  if (!!dmgTypeMatch)
    if (dmgTypeMatch[2].includes('@')) {
      const [type, loc] = dmgTypeMatch[2].trim().split('@')
      extDamageType = !!type.trim() ? type.trim() : undefined
      hitLocation = !!loc.trim() ? HitLocation.translate(loc.trim()) : undefined
    } else extDamageType = dmgTypeMatch[2].trim() // 'ex' or 'inc' or more likely, undefined
  return [actualType, extDamageType, hitLocation]
}

function _getFormulaComponents(groups) {
  let adds = (groups.adds || '').replace('–', '-')
  let m = groups.other.match(/([+-]@margin)/i)
  if (!adds && !!m) {
    adds = m[1]
  }
  let multiplier = groups.mult || ''
  if (!!multiplier && 'Xx×'.includes(multiplier[0])) multiplier = '*' + multiplier.substr(1) // Must convert to '*' for Foundry.
  const divisor = groups.div || ''
  const bang = groups.min || ''
  return [adds, multiplier, divisor, bang]
}

