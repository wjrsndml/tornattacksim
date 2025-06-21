'use client'

import React, { useState, useEffect } from 'react'
import WeaponSelector from './WeaponSelector'
import ArmourSelector from './ArmourSelector'
import ArmourCoverage from './ArmourCoverage'
import { getDefaultWeapon, getDefaultArmour, loadGameData, getCompanyList } from '../lib/dataLoader'
import { WeaponData, ArmourData, EducationPerks, FactionPerks, CompanyPerks, PropertyPerks, MeritPerks, BattleStats } from '../lib/fightSimulatorTypes'

interface Player {
  name: string
  life: number
  stats: BattleStats
  passives: BattleStats
  weapons: {
    primary: WeaponData
    secondary: WeaponData
    melee: WeaponData
    temporary: WeaponData
  }
  armour: {
    head: ArmourData
    body: ArmourData
    hands: ArmourData
    legs: ArmourData
    feet: ArmourData
  }
  attacksettings: {
    primary: { setting: number; reload: boolean }
    secondary: { setting: number; reload: boolean }
    melee: { setting: number; reload: boolean }
    temporary: { setting: number; reload: boolean }
  }
  defendsettings: {
    primary: { setting: number; reload: boolean }
    secondary: { setting: number; reload: boolean }
    melee: { setting: number; reload: boolean }
    temporary: { setting: number; reload: boolean }
  }
  perks: {
    education: EducationPerks
    faction: FactionPerks
    company: CompanyPerks
    property: PropertyPerks
    merit: MeritPerks
  }
}

interface PlayerConfigProps {
  player: Player
  onPlayerChange: (player: Player) => void
  playerName: string
  isAttacker: boolean
}

export default function PlayerConfig({ player, onPlayerChange, playerName, isAttacker }: PlayerConfigProps) {
  const [companies, setCompanies] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [importText, setImportText] = useState('')
  const [exportText, setExportText] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        await loadGameData()
        const companyList = getCompanyList()
        setCompanies(companyList)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
  }, [])

  const updatePlayer = (updates: Partial<Player>) => {
    onPlayerChange({ ...player, ...updates })
  }

  const updateStats = (field: keyof BattleStats, value: number) => {
    updatePlayer({
      stats: { ...player.stats, [field]: value }
    })
  }

  const updatePassives = (field: keyof BattleStats, value: number) => {
    updatePlayer({
      passives: { ...player.passives, [field]: value }
    })
  }

  const updateWeapon = (weaponType: keyof Player['weapons'], weapon: WeaponData) => {
    updatePlayer({
      weapons: { ...player.weapons, [weaponType]: weapon }
    })
  }

  const updateArmour = (armourType: keyof Player['armour'], armour: ArmourData) => {
    updatePlayer({
      armour: { ...player.armour, [armourType]: armour }
    })
  }

  const updateEducation = (field: keyof EducationPerks, value: boolean) => {
    updatePlayer({
      perks: {
        ...player.perks,
        education: { ...player.perks.education, [field]: value }
      }
    })
  }

  const updateFaction = (field: keyof FactionPerks, value: number) => {
    updatePlayer({
      perks: {
        ...player.perks,
        faction: { ...player.perks.faction, [field]: value }
      }
    })
  }

  const updateCompany = (field: keyof CompanyPerks, value: string | number) => {
    updatePlayer({
      perks: {
        ...player.perks,
        company: { ...player.perks.company, [field]: value }
      }
    })
  }

  const updateProperty = (field: keyof PropertyPerks, value: boolean) => {
    updatePlayer({
      perks: {
        ...player.perks,
        property: { ...player.perks.property, [field]: value }
      }
    })
  }

  const updateMerit = (field: keyof MeritPerks, value: number) => {
    updatePlayer({
      perks: {
        ...player.perks,
        merit: { ...player.perks.merit, [field]: value }
      }
    })
  }

  const updateAttackSettings = (weaponType: keyof Player['attacksettings'], field: 'setting' | 'reload', value: number | boolean) => {
    updatePlayer({
      attacksettings: {
        ...player.attacksettings,
        [weaponType]: { ...player.attacksettings[weaponType], [field]: value }
      }
    })
  }

  const updateDefendSettings = (weaponType: keyof Player['defendsettings'], field: 'setting' | 'reload', value: number | boolean) => {
    updatePlayer({
      defendsettings: {
        ...player.defendsettings,
        [weaponType]: { ...player.defendsettings[weaponType], [field]: value }
      }
    })
  }

  const multiplyStats = (multiplier: number) => {
    updatePlayer({
      stats: {
        strength: Math.round(player.stats.strength * multiplier),
        speed: Math.round(player.stats.speed * multiplier),
        defense: Math.round(player.stats.defense * multiplier),
        dexterity: Math.round(player.stats.dexterity * multiplier)
      }
    })
  }

  const exportPlayer = () => {
    const exportData = {
      stats: player.stats,
      passives: player.passives,
      life: player.life,
      weapons: player.weapons,
      armour: player.armour,
      perks: player.perks,
      attacksettings: player.attacksettings,
      defendsettings: player.defendsettings
    }
    const exportString = JSON.stringify(exportData)
    setExportText(exportString)
    navigator.clipboard.writeText(exportString)
  }

  const importPlayer = () => {
    try {
      const importData = JSON.parse(importText)
      updatePlayer({
        stats: importData.stats || player.stats,
        passives: importData.passives || player.passives,
        life: importData.life || player.life,
        weapons: importData.weapons || player.weapons,
        armour: importData.armour || player.armour,
        perks: importData.perks || player.perks,
        attacksettings: importData.attacksettings || player.attacksettings,
        defendsettings: importData.defendsettings || player.defendsettings
      })
      setImportText('')
      alert('导入成功！')
    } catch (error) {
      alert('导入失败：无效的JSON格式')
    }
  }

  return (
    <div className="space-y-6">
      {/* 基础属性 */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {playerName} {isAttacker ? '(攻击方)' : '(防守方)'}
          </h3>
          <div className="space-x-2">
            <button
              onClick={() => multiplyStats(10)}
              className="btn-secondary text-xs"
            >
              10x 属性
            </button>
            <button
              onClick={() => multiplyStats(0.1)}
              className="btn-secondary text-xs"
            >
              1/10 属性
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生命值</label>
            <input
              type="number"
              value={player.life}
              onChange={(e) => updatePlayer({ life: parseInt(e.target.value) || 5000 })}
              className="input w-full"
              min="100"
              max="50000"
              aria-label={`${playerName}生命值`}
            />
            <div className="text-xs text-gray-500 mt-1">
              提示：等级100无荣誉=5000，满荣誉=7500，满荣誉+派系=9000
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">力量</label>
              <input
                type="number"
                value={player.stats.strength}
                onChange={(e) => updateStats('strength', parseInt(e.target.value) || 1000)}
                className="input w-full"
                min="100"
                max="10000000"
                aria-label={`${playerName}力量`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">速度</label>
              <input
                type="number"
                value={player.stats.speed}
                onChange={(e) => updateStats('speed', parseInt(e.target.value) || 1000)}
                className="input w-full"
                min="100"
                max="10000000"
                aria-label={`${playerName}速度`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">防御</label>
              <input
                type="number"
                value={player.stats.defense}
                onChange={(e) => updateStats('defense', parseInt(e.target.value) || 1000)}
                className="input w-full"
                min="100"
                max="10000000"
                aria-label={`${playerName}防御`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">敏捷</label>
              <input
                type="number"
                value={player.stats.dexterity}
                onChange={(e) => updateStats('dexterity', parseInt(e.target.value) || 1000)}
                className="input w-full"
                min="100"
                max="10000000"
                aria-label={`${playerName}敏捷`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 属性被动加成 */}
      <div className="card">
        <h4 className="text-md font-semibold text-gray-800 mb-3">属性被动加成</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">力量 %</label>
            <input
              type="number"
              value={player.passives.strength}
              onChange={(e) => updatePassives('strength', parseInt(e.target.value) || 0)}
              className="input w-full"
              min="0"
              max="1000"
              aria-label={`${playerName}力量被动`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">速度 %</label>
            <input
              type="number"
              value={player.passives.speed}
              onChange={(e) => updatePassives('speed', parseInt(e.target.value) || 0)}
              className="input w-full"
              min="0"
              max="1000"
              aria-label={`${playerName}速度被动`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">防御 %</label>
            <input
              type="number"
              value={player.passives.defense}
              onChange={(e) => updatePassives('defense', parseInt(e.target.value) || 0)}
              className="input w-full"
              min="0"
              max="1000"
              aria-label={`${playerName}防御被动`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">敏捷 %</label>
            <input
              type="number"
              value={player.passives.dexterity}
              onChange={(e) => updatePassives('dexterity', parseInt(e.target.value) || 0)}
              className="input w-full"
              min="0"
              max="1000"
              aria-label={`${playerName}敏捷被动`}
            />
          </div>
        </div>
      </div>

      {/* 武器配置 */}
      <div className="card">
        <h4 className="text-md font-semibold text-gray-800 mb-3">武器配置</h4>
        <div className="space-y-3">
          <WeaponSelector
            weaponType="primary"
            selectedWeapon={player.weapons.primary}
            onWeaponChange={(weapon) => updateWeapon('primary', weapon)}
            label="主武器"
          />
          <WeaponSelector
            weaponType="secondary"
            selectedWeapon={player.weapons.secondary}
            onWeaponChange={(weapon) => updateWeapon('secondary', weapon)}
            label="副武器"
          />
          <WeaponSelector
            weaponType="melee"
            selectedWeapon={player.weapons.melee}
            onWeaponChange={(weapon) => updateWeapon('melee', weapon)}
            label="近战武器"
          />
          <WeaponSelector
            weaponType="temporary"
            selectedWeapon={player.weapons.temporary}
            onWeaponChange={(weapon) => updateWeapon('temporary', weapon)}
            label="临时武器"
          />
        </div>
      </div>

      {/* 护甲配置 */}
      <div className="card">
        <h4 className="text-md font-semibold text-gray-800 mb-3">护甲配置</h4>
        <div className="space-y-3">
          <ArmourSelector
            armourType="head"
            selectedArmour={player.armour.head}
            onArmourChange={(armour) => updateArmour('head', armour)}
            label="头部护甲"
          />
          <ArmourSelector
            armourType="body"
            selectedArmour={player.armour.body}
            onArmourChange={(armour) => updateArmour('body', armour)}
            label="身体护甲"
          />
          <ArmourSelector
            armourType="hands"
            selectedArmour={player.armour.hands}
            onArmourChange={(armour) => updateArmour('hands', armour)}
            label="手部护甲"
          />
          <ArmourSelector
            armourType="legs"
            selectedArmour={player.armour.legs}
            onArmourChange={(armour) => updateArmour('legs', armour)}
            label="腿部护甲"
          />
          <ArmourSelector
            armourType="feet"
            selectedArmour={player.armour.feet}
            onArmourChange={(armour) => updateArmour('feet', armour)}
            label="脚部护甲"
          />
        </div>
      </div>

      {/* 护甲覆盖系统 */}
      <ArmourCoverage playerArmour={player.armour} />

      {/* 战斗设置 */}
      <div className="card">
        <h4 className="text-md font-semibold text-gray-800 mb-3">
          {isAttacker ? '攻击设置' : '防守设置'}
        </h4>
        <div className="text-xs text-gray-600 mb-3">
          {isAttacker 
            ? '攻击方按优先级顺序使用武器（1最优先，0不使用）'
            : '防守方按权重随机选择武器（数值越大越容易选中，0不使用）'
          }
        </div>
        
        <div className="space-y-3">
          {['primary', 'secondary', 'melee', 'temporary'].map((weaponType) => (
            <div key={weaponType} className="flex items-center space-x-4">
              <div className="w-20 text-sm font-medium text-gray-700">
                {weaponType === 'primary' ? '主武器' : 
                 weaponType === 'secondary' ? '副武器' : 
                 weaponType === 'melee' ? '近战' : '临时'}
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-600">设置:</label>
                <input
                  type="number"
                  value={isAttacker 
                    ? player.attacksettings[weaponType as keyof Player['attacksettings']].setting
                    : player.defendsettings[weaponType as keyof Player['defendsettings']].setting
                  }
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    if (isAttacker) {
                      updateAttackSettings(weaponType as keyof Player['attacksettings'], 'setting', value)
                    } else {
                      updateDefendSettings(weaponType as keyof Player['defendsettings'], 'setting', value)
                    }
                  }}
                  className="input w-16"
                  min="0"
                  max="10"
                  aria-label={`${playerName}${weaponType}设置`}
                />
              </div>
              {weaponType !== 'melee' && weaponType !== 'temporary' && (
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600">自动重装:</label>
                  <input
                    type="checkbox"
                    checked={isAttacker 
                      ? player.attacksettings[weaponType as keyof Player['attacksettings']].reload
                      : player.defendsettings[weaponType as keyof Player['defendsettings']].reload
                    }
                    onChange={(e) => {
                      if (isAttacker) {
                        updateAttackSettings(weaponType as keyof Player['attacksettings'], 'reload', e.target.checked)
                      } else {
                        updateDefendSettings(weaponType as keyof Player['defendsettings'], 'reload', e.target.checked)
                      }
                    }}
                    className="rounded"
                    aria-label={`${playerName}${weaponType}自动重装`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 高级设置 */}
      <div className="card">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex justify-between items-center text-md font-semibold text-gray-800 mb-3"
        >
          <span>高级设置</span>
          <svg className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showAdvanced && (
          <div className="space-y-4">
            {/* 教育技能 */}
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">教育技能</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.damage}
                    onChange={(e) => updateEducation('damage', e.target.checked)}
                    className="rounded"
                  />
                  <span>1% 伤害</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.meleedamage}
                    onChange={(e) => updateEducation('meleedamage', e.target.checked)}
                    className="rounded"
                  />
                  <span>2% 近战伤害</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.japanesedamage}
                    onChange={(e) => updateEducation('japanesedamage', e.target.checked)}
                    className="rounded"
                  />
                  <span>10% 日本刀伤害</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.tempdamage}
                    onChange={(e) => updateEducation('tempdamage', e.target.checked)}
                    className="rounded"
                  />
                  <span>5% 临时武器伤害</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.needleeffect}
                    onChange={(e) => updateEducation('needleeffect', e.target.checked)}
                    className="rounded"
                  />
                  <span>10% 针剂效果</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.fistdamage}
                    onChange={(e) => updateEducation('fistdamage', e.target.checked)}
                    className="rounded"
                  />
                  <span>100% 拳头伤害</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.neckdamage}
                    onChange={(e) => updateEducation('neckdamage', e.target.checked)}
                    className="rounded"
                  />
                  <span>10% 颈部伤害</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.critchance}
                    onChange={(e) => updateEducation('critchance', e.target.checked)}
                    className="rounded"
                  />
                  <span>3% 暴击几率</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.ammocontrol1}
                    onChange={(e) => updateEducation('ammocontrol1', e.target.checked)}
                    className="rounded"
                  />
                  <span>5% 弹药控制</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.ammocontrol2}
                    onChange={(e) => updateEducation('ammocontrol2', e.target.checked)}
                    className="rounded"
                  />
                  <span>20% 弹药控制</span>
                </label>
                
                {/* 武器类型精准度技能 */}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.machinegunaccuracy}
                    onChange={(e) => updateEducation('machinegunaccuracy', e.target.checked)}
                    className="rounded"
                  />
                  <span>+1.0 机枪精准</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.smgaccuracy}
                    onChange={(e) => updateEducation('smgaccuracy', e.target.checked)}
                    className="rounded"
                  />
                  <span>+1.0 冲锋枪精准</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.pistolaccuracy}
                    onChange={(e) => updateEducation('pistolaccuracy', e.target.checked)}
                    className="rounded"
                  />
                  <span>+1.0 手枪精准</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.rifleaccuracy}
                    onChange={(e) => updateEducation('rifleaccuracy', e.target.checked)}
                    className="rounded"
                  />
                  <span>+1.0 步枪精准</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.heavyartilleryaccuracy}
                    onChange={(e) => updateEducation('heavyartilleryaccuracy', e.target.checked)}
                    className="rounded"
                  />
                  <span>+1.0 重型火炮精准</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.shotgunaccuracy}
                    onChange={(e) => updateEducation('shotgunaccuracy', e.target.checked)}
                    className="rounded"
                  />
                  <span>+1.0 霰弹枪精准</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={player.perks.education.temporaryaccuracy}
                    onChange={(e) => updateEducation('temporaryaccuracy', e.target.checked)}
                    className="rounded"
                  />
                  <span>+1.0 临时武器精准</span>
                </label>
              </div>
            </div>

            {/* 派系技能 */}
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">派系技能</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">伤害加成: {player.perks.faction.damage}%</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={player.perks.faction.damage}
                    onChange={(e) => updateFaction('damage', parseInt(e.target.value))}
                    className="w-full"
                    aria-label={`${playerName}派系伤害`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">精准加成: +{(player.perks.faction.accuracy / 5).toFixed(1)}</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={player.perks.faction.accuracy}
                    onChange={(e) => updateFaction('accuracy', parseInt(e.target.value))}
                    className="w-full"
                    aria-label={`${playerName}派系精准`}
                  />
                </div>
              </div>
            </div>

            {/* 公司技能 */}
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">公司技能</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">公司类型</label>
                  <select
                    value={player.perks.company.name}
                    onChange={(e) => updateCompany('name', e.target.value)}
                    className="input w-full"
                    aria-label={`${playerName}公司类型`}
                  >
                    <option value="None">无</option>
                    {companies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">星级: {player.perks.company.star}</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={player.perks.company.star}
                    onChange={(e) => updateCompany('star', parseInt(e.target.value))}
                    className="w-full"
                    aria-label={`${playerName}公司星级`}
                  />
                </div>
              </div>
            </div>

            {/* 其他技能 */}
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">荣誉技能</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">暴击率荣誉: {player.perks.merit.critrate}</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={player.perks.merit.critrate}
                    onChange={(e) => updateMerit('critrate', parseInt(e.target.value))}
                    className="w-full"
                    aria-label={`${playerName}暴击率荣誉`}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={player.perks.property.damage}
                      onChange={(e) => updateProperty('damage', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs">2% 房产伤害</span>
                  </label>
                </div>
              </div>
              
              {/* 武器精通技能 */}
              <div className="mt-4">
                <h6 className="text-xs font-semibold text-gray-600 mb-2">武器精通</h6>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">主武器精通: {player.perks.merit.primarymastery || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={player.perks.merit.primarymastery || 0}
                      onChange={(e) => updateMerit('primarymastery', parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${playerName}主武器精通`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">副武器精通: {player.perks.merit.secondarymastery || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={player.perks.merit.secondarymastery || 0}
                      onChange={(e) => updateMerit('secondarymastery', parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${playerName}副武器精通`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">近战精通: {player.perks.merit.meleemastery || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={player.perks.merit.meleemastery || 0}
                      onChange={(e) => updateMerit('meleemastery', parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${playerName}近战精通`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">临时武器精通: {player.perks.merit.temporarymastery || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={player.perks.merit.temporarymastery || 0}
                      onChange={(e) => updateMerit('temporarymastery', parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${playerName}临时武器精通`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">手枪精通: {player.perks.merit.pistolmastery || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={player.perks.merit.pistolmastery || 0}
                      onChange={(e) => updateMerit('pistolmastery', parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${playerName}手枪精通`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">步枪精通: {player.perks.merit.riflemastery || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={player.perks.merit.riflemastery || 0}
                      onChange={(e) => updateMerit('riflemastery', parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${playerName}步枪精通`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">霰弹枪精通: {player.perks.merit.shotgunmastery || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={player.perks.merit.shotgunmastery || 0}
                      onChange={(e) => updateMerit('shotgunmastery', parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${playerName}霰弹枪精通`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">冲锋枪精通: {player.perks.merit.smgmastery || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={player.perks.merit.smgmastery || 0}
                      onChange={(e) => updateMerit('smgmastery', parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${playerName}冲锋枪精通`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">机枪精通: {player.perks.merit.machinegunmastery || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={player.perks.merit.machinegunmastery || 0}
                      onChange={(e) => updateMerit('machinegunmastery', parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${playerName}机枪精通`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">重型火炮精通: {player.perks.merit.heavyartillerymastery || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={player.perks.merit.heavyartillerymastery || 0}
                      onChange={(e) => updateMerit('heavyartillerymastery', parseInt(e.target.value))}
                      className="w-full"
                      aria-label={`${playerName}重型火炮精通`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 导入导出 */}
      <div className="card">
        <h4 className="text-md font-semibold text-gray-800 mb-3">导入/导出</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">导入配置</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="粘贴导出的配置JSON..."
                className="input flex-1"
                aria-label={`${playerName}导入配置`}
              />
              <button
                onClick={importPlayer}
                className="btn-secondary"
                disabled={!importText.trim()}
              >
                导入
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">导出配置</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={exportText}
                readOnly
                placeholder="点击导出按钮生成配置..."
                className="input flex-1 bg-gray-50"
                aria-label={`${playerName}导出配置`}
              />
              <button
                onClick={exportPlayer}
                className="btn-secondary"
              >
                导出
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 