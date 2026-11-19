import {
  auditKinyuAmlPolicy,
  generateKinyuComplianceMarkdown,
} from './core/kinyu-engine.mjs';

const BAD_POLICY_SAMPLE = `・少額案件につき本人確認省略を認め、供託未了かつ確認記録3年で破棄する。
・トラベルルール通知なしで送金し、届出遅延およびホットウォレット全保管とする。`;

const GOOD_POLICY_SAMPLE = `・犯収法に基づく厳格な取引時確認およびeKYC・実質的支配者確認を全アカウントへ実施する。
・基準日未使用残高1,000万円超に対して2分の1以上の発行保証金を供託・信託保全し、利用者資金分別と第2種100万円上限管理を徹底する。
・暗号資産移転ではトラベルルールによる送付元・受取人情報通知事項伝達を行い、疑わしい取引はJAFICへ速やかな届出と取引モニタリングを実施する。
・OFAC・財務省制裁スクリーニングにより資産凍結し、顧客資産95%以上をマルチシグコールドウォレット保管のうえ確認記録を7年保存して独立監査を実施する。`;

const els = {
  org: document.getElementById('in-org'),
  service: document.getElementById('in-service'),
  btype: document.getElementById('in-btype'),
  unused: document.getElementById('in-unused'),
  deposited: document.getElementById('in-deposited'),
  tx: document.getElementById('in-tx'),
  str: document.getElementById('in-str'),
  kycyrs: document.getElementById('in-kycyrs'),
  type1: document.getElementById('in-type1'),
  cross: document.getElementById('in-cross'),
  travel: document.getElementById('in-travel'),
  policy: document.getElementById('in-policy'),
  badge: document.getElementById('status-badge'),
  mScore: document.getElementById('m-score'),
  mDeposit: document.getElementById('m-deposit'),
  mAml: document.getElementById('m-aml'),
  findingsList: document.getElementById('findings-list'),
  mdOutput: document.getElementById('md-output'),
  btnBad: document.getElementById('btn-sample-bad'),
  btnGood: document.getElementById('btn-sample-good'),
  btnAudit: document.getElementById('btn-audit'),
  btnCopyMd: document.getElementById('btn-copy-md'),
  btnDownloadMd: document.getElementById('btn-download-md'),
};

let latestMarkdown = '';

function renderAudit() {
  const result = auditKinyuAmlPolicy(els.policy.value, {
    businessType: els.btype.value,
    unusedPrepaidBalanceJpy: Number(els.unused.value || 0),
    depositedGuaranteeJpy: Number(els.deposited.value || 0),
    singleTransferJpy: Number(els.tx.value || 0),
    hasType1License: els.type1.checked,
    isCryptoCrossBorderTransfer: els.cross.checked,
    hasTravelRuleNotice: els.travel.checked,
    strDetectedDaysElapsed: Number(els.str.value || 0),
    kycRecordRetentionYears: Number(els.kycyrs.value || 7),
  });

  const t = result.thresholds;
  els.mScore.textContent = `${result.score} / 100点`;
  els.mDeposit.textContent = t.prepaidDepositShortfall
    ? `不足 ${t.depositShortfallJpy.toLocaleString('en-US')}円`
    : t.prepaidDepositRequired
      ? `充足 (要${t.requiredDepositJpy.toLocaleString('en-US')}円)`
      : '1,000万円未満';
  els.mAml.textContent =
    t.travelRuleViolation || t.strReportingDelayViolation || t.kycRetentionViolation || t.exceedsType2TransferLimit
      ? 'AML/送金閾値NGあり'
      : `適正 (保存${t.kycRecordRetentionYears}年)`;

  els.badge.className = 'score-pill';
  if (result.status === 'pass') {
    els.badge.textContent = '資金決済法・AML 適合 (PASS)';
    els.badge.classList.add('status-ready');
  } else if (result.status === 'warn') {
    els.badge.textContent = '一部補完推奨 (WARN)';
    els.badge.classList.add('status-review');
  } else {
    els.badge.textContent = '要改善・金融庁指摘リスク (FAIL)';
    els.badge.classList.add('status-high');
  }

  els.findingsList.innerHTML = '';
  if (result.findings.length === 0) {
    const ok = document.createElement('div');
    ok.setAttribute('data-ui', 'finding-card');
    ok.className = 'sev-ok';
    ok.textContent = '全8要件（eKYC・50%供託・トラベルルール・JAFIC届出・制裁凍結・送金分別・95%コールドウォレット・7年保存）と定量閾値を充足しています。';
    els.findingsList.appendChild(ok);
  } else {
    for (const f of result.findings) {
      const card = document.createElement('div');
      card.setAttribute('data-ui', 'finding-card');
      card.className = f.severity === 'HIGH' ? 'sev-high' : 'sev-medium';
      const head = document.createElement('div');
      head.style.fontWeight = '700';
      head.textContent = `[${f.id}] ${f.title} (${f.criterion})`;
      const desc = document.createElement('div');
      desc.textContent = `${f.detail} ／ 是正案: ${f.remediation}`;
      card.append(head, desc);
      els.findingsList.appendChild(card);
    }
  }

  latestMarkdown = generateKinyuComplianceMarkdown(result, {
    organizationName: els.org.value,
    serviceName: els.service.value,
  });
  els.mdOutput.textContent = latestMarkdown;
}

els.btnBad.addEventListener('click', () => {
  els.btype.value = 'prepaid_payment';
  els.unused.value = '30000000';
  els.deposited.value = '8000000';
  els.tx.value = '1500000';
  els.str.value = '14';
  els.kycyrs.value = '3';
  els.type1.checked = false;
  els.cross.checked = true;
  els.travel.checked = false;
  els.policy.value = BAD_POLICY_SAMPLE;
  renderAudit();
});

els.btnGood.addEventListener('click', () => {
  els.btype.value = 'crypto_exchange';
  els.unused.value = '30000000';
  els.deposited.value = '16000000';
  els.tx.value = '500000';
  els.str.value = '2';
  els.kycyrs.value = '7';
  els.type1.checked = false;
  els.cross.checked = true;
  els.travel.checked = true;
  els.policy.value = GOOD_POLICY_SAMPLE;
  renderAudit();
});

els.btnAudit.addEventListener('click', renderAudit);
els.btnCopyMd.addEventListener('click', async () => {
  await navigator.clipboard.writeText(latestMarkdown);
  els.btnCopyMd.textContent = 'コピー完了';
  setTimeout(() => {
    els.btnCopyMd.textContent = 'Markdownをコピー';
  }, 1500);
});
els.btnDownloadMd.addEventListener('click', () => {
  const blob = new Blob([latestMarkdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kinyugate-aml-certificate.md';
  a.click();
  URL.revokeObjectURL(url);
});

els.policy.value = BAD_POLICY_SAMPLE;
renderAudit();
