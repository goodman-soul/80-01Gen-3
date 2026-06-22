import http from 'http';

const BASE = 'http://127.0.0.1:3188';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           菜市场溯源平台 - 安全修复验证测试                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let passCount = 0;
  let total = 0;

  // ============ 安全问题1: JWT Token 认证 ============
  console.log('\n📋 安全问题1: 写接口匿名调用保护验证');
  console.log('──────────────────────────────────────────────────────');

  total++;
  const anonBatch = await request('/api/batches', {
    method: 'POST',
    body: { stallId: 's1', productName: '测试', origin: '测试', supplier: '测试', quantity: 100, unit: 'kg', productionDate: '2026-06-22', shelfLifeDays: 7 },
  });
  if (anonBatch.status === 401 && anonBatch.data.success === false) {
    console.log('✅ 测试1.1: 匿名创建批次 - 正确拒绝 (401)');
    passCount++;
  } else {
    console.log('❌ 测试1.1 失败', anonBatch.status, anonBatch.data);
  }

  total++;
  const anonPatrol = await request('/api/patrol/records', {
    method: 'POST',
    body: { batchId: 'b1', stallId: 's1', findings: '测试', status: 'normal' },
  });
  if (anonPatrol.status === 401 && anonPatrol.data.success === false) {
    console.log('✅ 测试1.2: 匿名创建巡检 - 正确拒绝 (401)');
    passCount++;
  } else {
    console.log('❌ 测试1.2 失败', anonPatrol.status, anonPatrol.data);
  }

  total++;
  const anonDeduct = await request('/api/inventory/b1/deduct', {
    method: 'POST',
    body: { amount: 5 },
  });
  if (anonDeduct.status === 401 && anonDeduct.data.success === false) {
    console.log('✅ 测试1.3: 匿名扣减库存 - 正确拒绝 (401)');
    passCount++;
  } else {
    console.log('❌ 测试1.3 失败', anonDeduct.status, anonDeduct.data);
  }

  total++;
  const vendorLogin = await request('/api/auth/vendor/login', {
    method: 'POST',
    body: { username: 'vendor01', password: '123456' },
  });
  const vendorToken = vendorLogin.data?.data?.token;
  if (vendorLogin.data?.success && vendorToken && vendorLogin.data?.data?.user?.role === 'vendor') {
    console.log('✅ 测试1.4: 摊主登录获取JWT令牌成功');
    passCount++;
  } else {
    console.log('❌ 测试1.4 失败', vendorLogin.data);
  }

  total++;
  const authBatch = await request('/api/batches', {
    method: 'POST',
    headers: { Authorization: `Bearer ${vendorToken}` },
    body: { stallId: 's1', productName: '认证测试菜心', origin: '广东省广州市', supplier: '广州蔬菜基地', quantity: 200, unit: 'kg', productionDate: '2026-06-22', shelfLifeDays: 5 },
  });
  if (authBatch.data?.success && authBatch.data?.data?.productName === '认证测试菜心') {
    console.log('✅ 测试1.5: 携带Token创建批次 - 成功');
    passCount++;
  } else {
    console.log('❌ 测试1.5 失败', authBatch.data);
  }

  // ============ 安全问题2: 消费者数据脱敏 ============
  console.log('\n\n📋 安全问题2: 消费者端数据脱敏验证');
  console.log('──────────────────────────────────────────────────────');

  total++;
  const publicTrace = await request('/api/public/batches/b1');
  const traceData = publicTrace.data?.data;
  let hasLeak = false;
  let leakDetails = [];
  if (traceData) {
    if (traceData.stall?.vendorPhone) { hasLeak = true; leakDetails.push('摊主手机号'); }
    if (traceData.stall?.vendorName) { hasLeak = true; leakDetails.push('摊主真实姓名'); }
    if (traceData.batch?.supplier) { hasLeak = true; leakDetails.push('供应商信息'); }
    if (traceData.inspection?.inspector) { hasLeak = true; leakDetails.push('检测人员姓名'); }
    if (JSON.stringify(traceData.traceChain || []).includes('operator')) { hasLeak = true; leakDetails.push('溯源操作人姓名'); }
    if (JSON.stringify(traceData.traceChain || []).includes('vendorPhone')) { hasLeak = true; leakDetails.push('溯源链中的手机号'); }
  }
  if (!hasLeak && traceData?.batch?.productName === '有机西红柿') {
    console.log('✅ 测试2.1: 消费者溯源接口脱敏验证通过');
    console.log(`   - 展示: 商品=${traceData.batch.productName}, 产地=${traceData.batch.origin}`);
    console.log(`   - 检测项: ${traceData.inspection.itemCount}项, 通过${traceData.inspection.passCount}项, 未通过${traceData.inspection.failCount}项`);
    console.log(`   - 溯源链: ${traceData.traceChain.length}条记录 (无操作人信息)`);
    passCount++;
  } else {
    console.log('❌ 测试2.1 失败, 泄露字段:', leakDetails.join(', '));
  }

  total++;
  const publicStalls = await request('/api/public/stalls');
  const stallsData = publicStalls.data?.data || [];
  const hasPhoneLeak = stallsData.some(s => s.vendorPhone);
  if (!hasPhoneLeak && stallsData[0]?.vendorNameMasked && stallsData.length >= 5) {
    console.log('✅ 测试2.2: 消费者摊位列表脱敏验证通过');
    console.log(`   - 摊主姓名已脱敏: ${stallsData[0].vendorName} → ${stallsData[0].vendorNameMasked}`);
    console.log(`   - 共 ${stallsData.length} 个摊位, 无手机号泄露`);
    passCount++;
  } else {
    console.log('❌ 测试2.2 失败');
  }

  // ============ 安全问题3: JSON文件持久化 ============
  console.log('\n\n📋 安全问题3: JSON文件持久化存储验证');
  console.log('──────────────────────────────────────────────────────');

  total++;
  const storeInfo = await request('/api/store/info');
  const info = storeInfo.data?.data;
  if (storeInfo.data?.success && info?.stallCount >= 5 && info?.batchCount >= 8) {
    console.log('✅ 测试3.1: 持久化存储元数据正常');
    console.log(`   - 存储版本: ${info.version}`);
    console.log(`   - 数据规模: ${info.stallCount}个摊位, ${info.batchCount}个批次`);
    console.log(`   - 最后修改: ${info.lastModified}`);
    passCount++;
  } else {
    console.log('❌ 测试3.1 失败', storeInfo.data);
  }

  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║                    测试结果: ${passCount} / ${total} 通过                         ║`);
  if (passCount === total) {
    console.log('║               ✅ 所有安全问题已修复并验证通过                 ║');
  } else {
    console.log(`║               ⚠️  还有 ${total - passCount} 项测试未通过                    ║`);
  }
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  process.exit(passCount === total ? 0 : 1);
}

runTests().catch(console.error);
