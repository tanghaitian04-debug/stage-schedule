import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PEOPLE, POSITIONS, dateLabel, buildText, slotAssignments } = require('../app.js');

test('名单17人、岗位12个、无英文名', () => {
  assert.equal(PEOPLE.length, 17);
  assert.equal(POSITIONS.length, 12);
  assert.ok(PEOPLE.every(n => !/[A-Za-z]/.test(n)));
  assert.ok(PEOPLE.includes('闫国豪') && PEOPLE.includes('唐海添'));
});

test('日期按上海时间自动生成且星期正确', () => {
  assert.deepEqual(dateLabel(new Date('2026-11-05T10:00:00+08:00')), { key: '2026-11-05', label: '2026年11月5日 星期四' });
  assert.equal(dateLabel(new Date('2026-11-13T10:00:00+08:00')).label, '2026年11月13日 星期五');
  // 上海已过午夜、UTC还是前一天时，按上海日期算
  assert.equal(dateLabel(new Date('2026-11-05T16:30:00Z')).key, '2026-11-06');
});

test('用模板示例排班生成：人名落位正确、无装大门板、固定文案在', () => {
  const assign = {
    '马强': '激光X', '刘庭旭': '观察A', '钱佳恩': '观察B',
    '张云翔': '控台', '邵成海': '视频', '陈军': '激光3',
    '罗光荣': '自动化', '赵国华': '台仓1', '闫国豪': '台仓2',
    '张禹': '特效', '贺坤华': '激光2',
  };
  const text = buildText('2026年11月5日 星期四', assign);
  for (const line of [
    '2026年11月5日 星期四\n舞台技师工作安排:',
    '【激光操作员】: 马强',
    '【观察A】:刘庭旭',
    '【观察B】:钱佳恩',
    '【控台操作员】: 张云翔',
    '【视频操作员】: 邵成海',
    '【激光3】: 陈军',
    '【自动化】: 罗光荣',
    '  【台仓1】: 赵国华',
    ' 【台仓2】: 闫国豪',
    '【特效观察】:张禹',
    '【激光观察员】：贺坤华（带大钥匙柜102号万能钥匙',
    '皇家宴会厅窗帘预设完成',
    '检查预设两侧炮楼和中间位置喷花机米奇耳朵',
    '升降center piece',
    'C0106 窗帘',
    '降后场480平台）注意观察环境灯光以及show lighting状态',
  ]) assert.ok(text.includes(line), `missing: ${line}`);
  assert.ok(!text.includes('大门板'), '不得出现装大门板');
  assert.ok(!text.includes('（装大门板）') && !text.includes('(装大门板）'));
});

test('激光2与激光观察员同落激光观察员岗；重复岗位并排；空岗留空', () => {
  const by = slotAssignments({ '陈军': '激光2', '贺坤华': '激光观察员', '马强': '控台', '郑思瑜': '控台' });
  assert.deepEqual(by['激光观察员'], ['贺坤华', '陈军'].sort((a, b) => 0) && ['陈军', '贺坤华'].sort(() => 0) && ['贺坤华', '陈军'].length === 2 ? by['激光观察员'] : null);
  assert.equal(by['激光观察员'].length, 2);
  assert.ok(by['激光观察员'].includes('陈军') && by['激光观察员'].includes('贺坤华'));
  assert.deepEqual(by['控台操作员'], ['郑思瑜', '马强']);
  const text = buildText('2026年11月13日 星期五', { '陈军': '激光3' });
  assert.ok(text.includes('【激光3】: 陈军'));
  assert.ok(text.includes('【激光操作员】: \n'));
});
