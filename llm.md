# Torn战斗模拟器迁移项目

## 项目概述
这是一个从原版JavaScript实现迁移到Next.js + TypeScript的Torn游戏战斗模拟器项目。

## 当前状态
项目已基本完成主要功能的迁移，但存在一些问题需要解决。

## 已知问题

### 1. ✅ **已修复：Stalemate概率偏高问题**
**问题描述：** 新版的Stalemate（平局）概率要比原版高一些。

**根本原因：** 新版缺少完整的武器掌握技能处理，导致伤害输出显著降低。

**修复状态：** 已修复武器掌握技能处理，Stalemate概率从10%降低到4.5%。

### 2. 🚨 **待修复：武器改装(Mods)系统完全缺失**
**问题描述：** 新版战斗模拟器缺少武器改装系统的实现，这是一个重要功能。

**影响分析：**
- 原版中武器改装提供重要的属性加成：精准度、伤害、暴击率、敏捷度等
- 某些改装有特殊效果（如第一回合加成）
- 改装效果对敌人也可能产生影响（enemy_acc_bonus）

**数据文件：** `public/mods.json` 包含完整的改装数据

**原版实现位置：**
- `applyPMT` 函数第1803-1843行处理武器改装效果
- 支持的效果类型：
  - `acc_bonus`: 精准度加成
  - `enemy_acc_bonus`: 对敌人精准度的影响
  - `crit_chance`: 暴击率加成
  - `dmg_bonus`: 伤害加成
  - `dex_passive`: 敏捷度被动加成
  - `turn1.acc_bonus`: 第一回合特殊精准度加成

**需要实现的功能：**
1. 在`applyPMT`函数中添加武器改装效果处理
2. 加载并应用`mods.json`中的改装数据
3. 处理特殊的第一回合效果
4. 确保改装效果正确应用到主武器和副武器

### 3. 🚨 **待修复：缺失的公司技能**

#### 3.1 Adult Novelties公司技能
**原版实现：** 7星及以上降低敌人速度25点
```javascript
if (x_comp['name'] == "Adult Novelties" && x_comp['star'] >= 7) {
    y_passives['speed'] -= 25
}
```

#### 3.2 Hair Salon公司技能不一致
**问题：** 原版中y玩家的Hair Salon技能缺少星级检查
```javascript
// 原版x玩家（正确）
} else if (x_comp['name'] == "Hair Salon" && x_wep['category'] == "Slashing" && x_comp['star'] == 10) {
// 原版y玩家（错误，缺少星级检查）
} else if (y_comp['name'] == "Hair Salon" && y_wep['category'] == "Slashing") {
```

### 4. 🚨 **待修复：其他可能缺失的功能**

#### 4.1 Furniture Store公司技能错误
**问题：** 原版y玩家的Furniture Store技能使用了错误的星级值100
```javascript
if (y_comp['name'] == "Furniture Store" && y_comp['star'] == 100) {  // 应该是10
```

#### 4.2 可能的数据访问不一致
**问题：** 原版使用`x['perks']['merits']`（复数），新版使用`x.perks.merit`（单数）
需要确认数据结构的一致性。

## 修复优先级

### 高优先级（影响战斗结果）
1. **武器改装系统** - 对战斗结果影响最大
2. **Adult Novelties公司技能** - 影响属性计算

### 中优先级（一致性问题）
3. **Hair Salon技能不一致** - 确保与原版行为一致
4. **Furniture Store技能错误** - 修复错误的星级值

## 实现建议

### 武器改装系统实现步骤：
1. 确保`mods.json`数据正确加载到全局变量`m`
2. 在`applyPMT`函数中添加改装效果处理逻辑
3. 处理所有改装效果类型
4. 特别注意第一回合特殊效果的处理
5. 确保改装效果正确应用到当前选择的武器

### 测试验证：
- 使用相同参数进行10000次战斗模拟
- 目标：将Stalemate概率从当前4.5%进一步降低到接近原版水平
- 验证改装效果是否正确影响战斗结果

## 文件结构
- `origin/fightSimulator.js` - 原版参考实现
- `app/lib/fightSimulator.ts` - 新版TypeScript实现
- `public/mods.json` - 武器改装数据
- `public/companies.json` - 公司技能数据
