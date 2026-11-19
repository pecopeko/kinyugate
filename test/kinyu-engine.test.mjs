import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateKinyuAmlThresholds,
  auditKinyuAmlPolicy,
  generateKinyuComplianceMarkdown,
} from '../docs/core/kinyu-engine.mjs';

test('evaluateKinyuAmlThresholds enforces 50% unused deposit over 10M, Type-2 1M cap, Travel Rule, STR & 7yr KYC', () => {
  const badPrepaid = evaluateKinyuAmlThresholds({
    businessType: 'fund_transfer',
    unusedPrepaidBalanceJpy: 30_000_000,
    depositedGuaranteeJpy: 8_000_000,
    singleTransferJpy: 1_500_000,
    hasType1License: false,
    isCryptoCrossBorderTransfer: true,
    hasTravelRuleNotice: false,
    strDetectedDaysElapsed: 14,
    kycRecordRetentionYears: 3,
  });
  assert.equal(badPrepaid.prepaidDepositRequired, true);
  assert.equal(badPrepaid.requiredDepositJpy, 15_000_000);
  assert.equal(badPrepaid.depositShortfallJpy, 7_000_000);
  assert.equal(badPrepaid.prepaidDepositShortfall, true);
  assert.equal(badPrepaid.exceedsType2TransferLimit, true);
  assert.equal(badPrepaid.travelRuleViolation, true);
  assert.equal(badPrepaid.strReportingDelayViolation, true);
  assert.equal(badPrepaid.kycRetentionViolation, true);
});

test('auditKinyuAmlPolicy flags shortfalls/AML breaches and passes 100/100 on compliant PSA/AML policy', () => {
  const bad = auditKinyuAmlPolicy(
    '本人確認省略でトラベルルール通知なし、供託未了かつ確認記録3年破棄とする。',
    {
      businessType: 'fund_transfer',
      unusedPrepaidBalanceJpy: 30_000_000,
      depositedGuaranteeJpy: 8_000_000,
      singleTransferJpy: 1_500_000,
      hasType1License: false,
      isCryptoCrossBorderTransfer: true,
      hasTravelRuleNotice: false,
      strDetectedDaysElapsed: 14,
      kycRecordRetentionYears: 3,
    }
  );
  assert.equal(bad.status, 'fail');
  const badIds = new Set(bad.findings.map((f) => f.id));
  assert.ok(badIds.has('deposit_shortfall'));
  assert.ok(badIds.has('type2_limit_exceeded'));
  assert.ok(badIds.has('travel_rule_missing'));
  assert.ok(badIds.has('str_report_delay'));
  assert.ok(badIds.has('kyc_under_7yrs'));

  const compliantText = [
    '取引時確認およびeKYC・実質的支配者確認を実施する。',
    '未使用残高1,000万円超について2分の1以上の発行保証金を供託・信託保全する。',
    '暗号資産移転時のトラベルルール（送付元情報・受取人情報通知事項伝達）を実施する。',
    '疑わしい取引は取引モニタリングで検知しJAFICへ速やかな届出を行う。',
    'OFAC・財務省制裁リストと照合し該当時は資産凍結する。',
    '第2種100万円上限と利用者資金分別・履行保証金管理を徹底する。',
    '顧客暗号資産の95%以上をマルチシグコールドウォレットで秘密鍵分散保管する。',
    '確認記録・取引記録を7年保存し年次研修と独立監査を行う。',
  ].join('\n');

  const good = auditKinyuAmlPolicy(compliantText, {
    businessType: 'crypto_exchange',
    unusedPrepaidBalanceJpy: 30_000_000,
    depositedGuaranteeJpy: 16_000_000,
    singleTransferJpy: 500_000,
    hasType1License: false,
    isCryptoCrossBorderTransfer: true,
    hasTravelRuleNotice: true,
    strDetectedDaysElapsed: 2,
    kycRecordRetentionYears: 7,
  });
  assert.equal(good.score, 100);
  assert.equal(good.status, 'pass');
  assert.equal(good.findings.length, 0);

  const md = generateKinyuComplianceMarkdown(good, {
    organizationName: '東京テスト金融株式会社',
    serviceName: 'テストウォレット',
  });
  assert.match(md, /ネットワーク通信: `0`回/);
  assert.match(md, /15,000,000 JPY/);
});
