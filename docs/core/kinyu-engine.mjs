/**
 * KINYUGATE（金融門）Core Engine
 * 資金決済法（前払式支払手段 1,000万円超 2分の1発行保証金供託 / 第2種資金移動業100万円上限）・
 * 犯収法（本人確認・7年間保存・疑わしい取引JAFIC届出・制裁凍結）・暗号資産トラベルルール
 * ブラウザローカル監査エンジン（外部通信ゼロ）
 */

const PILLARS = [
  {
    id: 'kyc_ekyc_cdd_onboarding',
    title: '犯罪収益移転防止法に基づく取引時確認・eKYC・実質的支配者確認',
    criterion: '犯収法第4条・FSAマネロンガイドライン（顧客管理措置）',
    weight: 14,
    severity: 'HIGH',
    pattern: /(?:取引時確認|eKYC|本人確認|実質的支配者|顧客管理|厳格な確認)/i,
    antiPattern: /(?:本人確認省略|eKYC免除|匿名取引容認)/i,
    detail: '新規口座開設・高額取引時の非対面eKYC本人確認や実質的支配者・PEPs等の厳格な顧客管理(EDD)条項が不足しています。',
    remediation: 'eKYCまたは法定確認方法による取引時確認とリスクベース顧客格付け手順を規程へ明記してください。',
  },
  {
    id: 'prepaid_50pct_trust_deposit',
    title: '前払式支払手段 未使用残高1,000万円超における2分の1発行保証金供託／信託保全',
    criterion: '資金決済法第14条（発行保証金の供託・銀行等保全契約・信託契約）',
    weight: 14,
    severity: 'HIGH',
    pattern: /(?:発行保証金|信託保全|2分の1|供託|銀行等保証|未使用残高保全)/i,
    antiPattern: /(?:供託未了|保全措置なし|未保全|流用)/i,
    detail: '3月・9月末基準日未使用残高が1,000万円を超えた際にその2分の1以上を供託または保全契約・信託保全する体制が確認できません。',
    remediation: '基準日未使用残高の50%以上の供託・保証契約・信託保全を基準日から2か月以内に確実に実施する統制を設けてください。',
  },
  {
    id: 'travel_rule_originator_beneficiary',
    title: '暗号資産・電子決済手段等移転のトラベルルール（送付元・受取人情報通知）',
    criterion: '犯収法第10条の3・FATF Rec.16 トラベルルール',
    weight: 13,
    severity: 'HIGH',
    pattern: /(?:トラベルルール|送付元情報|受取人情報|通知事項伝達|VASP間通知)/i,
    antiPattern: /(?:トラベルルール非対応|通知事項省略|非通知許容|トラベルルール通知なし)/i,
    detail: 'VASP間・対象国への暗号資産/ステーブルコイン移転時に送付人・受取人氏名・アドレスを通知・保存する要件が欠けています。',
    remediation: 'TRUST/Sygna等のプロトコルにより送付元・受取人通知事項を出金前へ確実に伝達・記録保存してください。',
  },
  {
    id: 'str_jafic_prompt_reporting',
    title: '疑わしい取引（STR）検知モニタリング ＆ 金融庁/JAFIC速報届出',
    criterion: '犯収法第8条（疑わしい取引の届出義務）',
    weight: 13,
    severity: 'HIGH',
    pattern: /(?:疑わしい取引|JAFIC|速やかな届出|取引モニタリング|マネロン検知)/i,
    antiPattern: /(?:届出遅延|JAFIC未報告|監視ルールなし)/i,
    detail: '異常取引シナリオ検知から速やかに主務大臣・JAFICへ疑わしい取引を届け出る期限・エスカレーション基準が曖昧です。',
    remediation: '敷居値跨ぎ分割送金・高リスク国送金等を日次検知し、概ね10日以内を目安にJAFIC届出を完了するSLAを定めてください。',
  },
  {
    id: 'sanctions_freeze_ofac_mof',
    title: '財務省外為法制裁リスト・OFACリアルタイム照合 ＆ 資産凍結ブロック',
    criterion: '外為法制裁措置・テロ資金供与防止',
    weight: 12,
    severity: 'HIGH',
    pattern: /(?:経済制裁|OFAC|財務省制裁|資産凍結|テロ資金供与|制裁スクリーニング)/i,
    antiPattern: /(?:制裁照合なし|凍結対象取引容認)/i,
    detail: '顧客受入時および入出金時の最新の財務省制裁対象者・OFAC SDNスクリーニングと即時取引停止手順が見当たりません。',
    remediation: 'リスト更新即日反映と約定/送金前スクリーニングによる自動保留・凍結措置を導入してください。',
  },
  {
    id: 'fund_transfer_cap_segregation',
    title: '資金移動業 第1種/第2種（100万円）上限 ＆ 滞留資金規制・利用者資金分別管理',
    criterion: '資金決済法第36条の2・第43条',
    weight: 12,
    severity: 'MEDIUM',
    pattern: /(?:第1種|第2種|100万円|滞留規制|履行保証金|利用者資金分別)/i,
    antiPattern: /(?:滞留無制限|分別管理なし|無許可送金)/i,
    detail: '第2種資金移動業の1回100万円上限管理、送金と無関係な資金滞留禁止、および100%超の履行保証金保全規定がありません。',
    remediation: '送金システム上の上限ブロックおよび不要なアカウント滞留残高の返還アラート・全額保全を実装してください。',
  },
  {
    id: 'cold_wallet_multisig_custody',
    title: '暗号資産交換業 コールドウォレット95%以上管理・マルチシグ秘密鍵分散',
    criterion: '資金決済法第63条の11・顧客資産分別管理',
    weight: 11,
    severity: 'MEDIUM',
    pattern: /(?:コールドウォレット|マルチシグ|95%以上|履行保証暗号資産|秘密鍵分散)/i,
    antiPattern: /(?:ホットウォレット全保管|単一秘密鍵|顧客資産流用)/i,
    detail: '顧客から預託を受けた暗号資産をインターネット非接続のコールドウォレット等で95%以上分別保全する運用手順が不足しています。',
    remediation: '95%以上をマルチシグコールドウォレット保管とし、ホット保管分に同額以上の自社履行保証暗号資産を割り当ててください。',
  },
  {
    id: 'seven_year_aml_audit_records',
    title: '確認記録・取引記録の7年間法定保存 ＆ 年次職員研修・独立内部監査',
    criterion: '犯収法第6条・第7条（7年保存）＆ 内部統制3ライン',
    weight: 11,
    severity: 'MEDIUM',
    pattern: /(?:7年保存|7年間保存|確認記録|取引記録|独立監査|年次研修)/i,
    antiPattern: /(?:記録破棄|確認記録3年|監査未実施)/i,
    detail: '取引終了日等から7年間の法定記録保存およびコンプライアンス部門以外の独立部門による年次AML監査規定が欠けています。',
    remediation: '全KYC確認記録・取引ログ・トラベルルール証跡の7年保管と独立第3ライン年次監査を計画化してください。',
  },
];

export function evaluateKinyuAmlThresholds({
  businessType = 'prepaid_payment',
  unusedPrepaidBalanceJpy = 0,
  depositedGuaranteeJpy = 0,
  singleTransferJpy = 0,
  hasType1License = false,
  isCryptoCrossBorderTransfer = false,
  hasTravelRuleNotice = true,
  strDetectedDaysElapsed = 0,
  kycRecordRetentionYears = 7,
} = {}) {
  const rawType = String(businessType || 'prepaid_payment').trim().toLowerCase();
  let btype = 'prepaid_payment';
  if (rawType === 'fund_transfer' || rawType === 'crypto_exchange' || rawType === 'prepaid_payment') {
    btype = rawType;
  } else if (rawType.includes('crypto')) {
    btype = 'crypto_exchange';
  } else if (rawType.includes('transfer') || rawType.includes('remit')) {
    btype = 'fund_transfer';
  }

  const unused = Math.max(0, Number(unusedPrepaidBalanceJpy) || 0);
  const deposited = Math.max(0, Number(depositedGuaranteeJpy) || 0);
  const txAmt = Math.max(0, Number(singleTransferJpy) || 0);
  const strDays = Math.max(0, Math.trunc(Number(strDetectedDaysElapsed) || 0));
  const kycYears = Math.max(0, Math.trunc(Number(kycRecordRetentionYears) || 0));

  const prepaidDepositRequired = unused >= 10_000_000;
  const requiredDepositJpy = prepaidDepositRequired ? Math.round(unused * 0.5) : 0;
  const depositShortfallJpy = prepaidDepositRequired ? Math.max(0, requiredDepositJpy - deposited) : 0;
  const prepaidDepositShortfall = depositShortfallJpy > 0;
  const exceedsType2TransferLimit = Boolean(btype === 'fund_transfer' && txAmt > 1_000_000 && !hasType1License);
  const travelRuleNoticeRequired = Boolean(isCryptoCrossBorderTransfer || (btype === 'crypto_exchange' && txAmt >= 100_000));
  const travelRuleViolation = Boolean(travelRuleNoticeRequired && !hasTravelRuleNotice);
  const strReportingDelayViolation = strDays > 10;
  const kycRetentionViolation = kycYears < 7;

  return {
    businessType: btype,
    unusedPrepaidBalanceJpy: unused,
    depositedGuaranteeJpy: deposited,
    prepaidDepositRequired,
    requiredDepositJpy,
    depositShortfallJpy,
    prepaidDepositShortfall,
    singleTransferJpy: txAmt,
    hasType1License: Boolean(hasType1License),
    exceedsType2TransferLimit,
    travelRuleNoticeRequired,
    hasTravelRuleNotice: Boolean(hasTravelRuleNotice),
    travelRuleViolation,
    strDetectedDaysElapsed: strDays,
    strReportingDelayViolation,
    kycRecordRetentionYears: kycYears,
    kycRetentionViolation,
  };
}

export function auditKinyuAmlPolicy(policyText = '', options = {}) {
  const normalized = String(policyText || '').replace(/\u3000/g, ' ').trim();
  const thresholds = evaluateKinyuAmlThresholds(options);

  const findings = [];
  const passedPillars = [];
  let rawScore = 0;

  for (const pillar of PILLARS) {
    const matched = pillar.pattern.test(normalized);
    const negated = pillar.antiPattern.test(normalized);
    if (matched && !negated) {
      rawScore += pillar.weight;
      passedPillars.push({
        id: pillar.id,
        title: pillar.title,
        criterion: pillar.criterion,
        weight: pillar.weight,
      });
    } else {
      findings.push({
        id: pillar.id,
        title: pillar.title,
        criterion: pillar.criterion,
        severity: pillar.severity,
        detail: negated ? `NG運用パターン検出（${pillar.detail}）` : pillar.detail,
        remediation: pillar.remediation,
      });
    }
  }

  let penalty = 0;
  if (thresholds.prepaidDepositShortfall) {
    penalty += 20;
    findings.push({
      id: 'deposit_shortfall',
      title: '未使用残高1,000万円超に対する2分の1（50%）発行保証金供託不足',
      criterion: `資金決済法14条（要供託 ${thresholds.requiredDepositJpy.toLocaleString('en-US')}円 / 済 ${thresholds.depositedGuaranteeJpy.toLocaleString('en-US')}円）`,
      severity: 'HIGH',
      detail: `未使用残高の50%にあたる ${thresholds.requiredDepositJpy.toLocaleString('en-US')}円 に対して ${thresholds.depositShortfallJpy.toLocaleString('en-US')}円 不足しています。`,
      remediation: '供託金または銀行等保証・信託契約により不足額を基準日翌日から2か月以内に追加保全してください。',
    });
  }
  if (thresholds.exceedsType2TransferLimit) {
    penalty += 20;
    findings.push({
      id: 'type2_limit_exceeded',
      title: '第2種資金移動業の上限100万円を超過した1回送金額',
      criterion: `1回送金額 ${thresholds.singleTransferJpy.toLocaleString('en-US')}円 > 1,000,000円`,
      severity: 'HIGH',
      detail: '第1種資金移動業の認可なく1件100万円を超える送金を実行することは資金決済法違反となります。',
      remediation: '100万円以下へ送金上限システム制限を設定するか第1種ライセンス認可を取得してください。',
    });
  }
  if (thresholds.travelRuleViolation) {
    penalty += 20;
    findings.push({
      id: 'travel_rule_missing',
      title: 'トラベルルール通知事項（送付人・受取人情報）未送信での暗号資産移転',
      criterion: '犯収法第10条の3 トラベルルール義務',
      severity: 'HIGH',
      detail: '暗号資産・電子決済手段移転にあたり取引先VASP等への送付元・受取人通知が欠落しています。',
      remediation: '移転実行前にシステム経由で通知事項を伝達・検証するゲートを有効化してください。',
    });
  }
  if (thresholds.strReportingDelayViolation) {
    penalty += 15;
    findings.push({
      id: 'str_report_delay',
      title: '疑わしい取引（STR）検知後のJAFIC届出遅延（10日超）',
      criterion: `検知経過 ${thresholds.strDetectedDaysElapsed}日 > 10日目安`,
      severity: 'HIGH',
      detail: '疑わしい取引と判断・検知してから主務大臣への届出が10日を超えて滞留しています。',
      remediation: 'MLROレビュー迅速化により概ね10日以内の速やかなJAFIC提出体制へ改善してください。',
    });
  }
  if (thresholds.kycRetentionViolation) {
    penalty += 15;
    findings.push({
      id: 'kyc_under_7yrs',
      title: '確認記録・取引記録の保存年数が法定7年未満',
      criterion: `現在設定 ${thresholds.kycRecordRetentionYears}年 < 7年`,
      severity: 'MEDIUM',
      detail: '犯収法上の確認記録・取引記録は契約終了等の日から7年間の保存が義務付けられています。',
      remediation: 'WORM/改ざん防止ストレージで最低7年間のアーカイブ保持設定へ変更してください。',
    });
  }

  const score = Math.min(100, Math.max(0, rawScore - penalty));
  let readinessLabel = '金融庁検査指摘・供託不足/AML重大リスクあり';
  let status = 'fail';
  if (score >= 88 && findings.every((f) => f.severity !== 'HIGH')) {
    readinessLabel = '資金決済法・犯収法AML・トラベルルール 適合';
    status = 'pass';
  } else if (score >= 65) {
    readinessLabel = '一部補完推奨（供託・トラベルルール・記録保管見直し）';
    status = 'warn';
  }

  return {
    score,
    status,
    readinessLabel,
    thresholds,
    passedPillars,
    findings,
    passedCount: passedPillars.length,
    totalPillars: PILLARS.length,
  };
}

export function generateKinyuComplianceMarkdown(auditResult, meta = {}) {
  const org = String(meta.organizationName || '貴社（未設定）').trim() || '貴社（未設定）';
  const serviceName = String(meta.serviceName || '決済・ウォレットサービス（未設定）').trim() || '決済・ウォレットサービス（未設定）';
  const today = new Date().toISOString().slice(0, 10);
  const t = auditResult.thresholds;

  const lines = [
    '# 資金決済法（50%供託・資金移動業）・犯収法AML・トラベルルール 自己点検証明書',
    '',
    `- **作成日**: ${today}`,
    `- **登録 / 届出事業者名**: ${org}`,
    `- **対象決済サービス**: ${serviceName}`,
    `- **法令適合スコア**: **${auditResult.readinessLabel}**（\`${auditResult.score}/100\` / 充足 \`${auditResult.passedCount}/${auditResult.totalPillars}\`）`,
    '',
    '## 1. 定量閾値・供託/送金/AMLアラート判定',
    '',
    `- **業務業態区分**: \`${t.businessType}\``,
    `- **前払式 基準日未使用残高 / 2分の1供託判定**: 残高 \`${t.unusedPrepaidBalanceJpy.toLocaleString('en-US')} JPY\` / 法定要保全 \`${t.requiredDepositJpy.toLocaleString('en-US')} JPY\` / 保全済 \`${t.depositedGuaranteeJpy.toLocaleString('en-US')} JPY\` -> \`${t.prepaidDepositShortfall ? `不足 ${t.depositShortfallJpy.toLocaleString('en-US')} JPY (NG)` : '保全適正'}\``,
    `- **1回送金額上限（第2種100万円）**: \`${t.singleTransferJpy.toLocaleString('en-US')} JPY\` (第1種認可: \`${t.hasType1License ? '有' : '無'}\`) -> \`${t.exceedsType2TransferLimit ? '第2種上限超過 (NG)' : '範囲内'}\``,
    `- **トラベルルール通知義務**: \`${t.travelRuleNoticeRequired ? '通知必須対象' : '通常取引'}\` / 通知: \`${t.hasTravelRuleNotice ? '実施済み' : '未実施'}\` -> \`${t.travelRuleViolation ? '未通知違反 (NG)' : '問題なし'}\``,
    `- **疑わしい取引(STR)届出経過日数 / 記録保存年数**: 届出 \`${t.strDetectedDaysElapsed}日\` / 保存 \`${t.kycRecordRetentionYears}年\` -> \`${t.strReportingDelayViolation || t.kycRetentionViolation ? 'SLAまたは保存年数不足' : '7年保存・適時届出OK'}\``,
    '',
    '## 2. 資金決済法・犯収法AML 8大遵守チェック項目',
    '',
    '| 法的チェック項目 | 判定 | 根拠 / 是正事項 |',
    '|---|---|---|',
  ];

  for (const p of auditResult.passedPillars) {
    lines.push(`| ${p.title} | 充足 | ${p.criterion} |`);
  }
  for (const f of auditResult.findings) {
    lines.push(`| ${f.title} | 要是正 (${f.severity}) | ${f.detail} ／ 是正案: ${f.remediation} |`);
  }

  lines.push(
    '',
    '---',
    '*本証明書は KINYUGATE（金融門）により未使用残高・送金額・AML統制方針を社外サーバーへ一切送信せずブラウザローカルで生成されました（ネットワーク通信: `0`回）。*'
  );

  return lines.join('\n');
}
