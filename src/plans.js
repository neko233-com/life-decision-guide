export const planFamilies = [
  { id: 'build', title: '起步与积累', levels: 'A5–A7', description: '先稳住日常，再形成家庭底盘。' },
  { id: 'protect', title: '配置与保护', levels: 'A8–A9', description: '看清集中风险，安排资产与责任。' },
  { id: 'govern', title: '家族与机构治理', levels: 'A10–A12', description: '把复杂事务交给清楚的规则。' },
];

export const assetPlans = [
  { level: 'A5', title: '起步', family: 'build', lower: 1e4, upper: 1e5, range: '1万–不足10万元', focus: '备用金与稳定收入', priorities: ['算清每月必要开支', '留出能随时使用的备用金', '给收入增长安排 1 个小行动'], first: '列出房租、吃饭、交通、还款和必要医疗费用。先知道最少需要多少钱，才好定备用金目标。' },
  { level: 'A6', title: '积累', family: 'build', lower: 1e5, upper: 1e6, range: '10万–不足100万元', focus: '现金流与赚钱能力', priorities: ['分开应急、近期目标和长期资金', '比较住房、职业与培训投入', '补齐家庭基本保障'], first: '把未来 1 年的大额支出写出来，标上日期。学习、换工作和消费分别算，不让同一笔钱承担多个目标。' },
  { level: 'A7', title: '家庭底盘', family: 'build', lower: 1e6, upper: 1e7, range: '100万–不足1000万元', focus: '住房、保障与长期目标', priorities: ['拆开房产净值与可用现金', '统筹孩子、父母和退休支出', '检查负债、保障和集中风险'], first: '把家庭账分成“拥有多少”和“本月能用多少”。自住房计入净资产，但不能直接拿来付日常账单。' },
  { level: 'A8', title: '稳健配置', family: 'protect', lower: 1e7, upper: 1e8, range: '1000万–不足1亿元', focus: '分散风险与资产规则', priorities: ['核对资产、负债和现金流全貌', '写清目标期限、损失边界和调整规则', '检查机构、费用与退出条件'], first: '先列出每项资产的持有主体、用途和退出条件。不要只数账户个数，要看风险是否集中在同一行业或项目。' },
  { level: 'A9', title: '家企分开', family: 'protect', lower: 1e8, upper: 1e9, range: '1亿–不足10亿元', focus: '家庭与企业的边界', priorities: ['看清家庭和企业之间的资金关系', '梳理股权、借款、担保与控制权', '预备家庭支出和关键人缺席方案'], first: '画出家庭、公司和资产之间的关系图。逐项记录个人担保、股东借款和关联交易，交专业人士核对责任。' },
  { level: 'A10', title: '专业协作', family: 'govern', lower: 1e9, upper: 1e10, range: '10亿–不足100亿元', focus: '团队、授权与监督', priorities: ['按复杂程度确定专业服务需求', '分清投资决策、执行、托管与复核', '让报告、授权和利益冲突可检查'], first: '把现有顾问和服务商列在 1 张表里：负责什么、向谁报告、怎么收费、谁复核、如何终止合作。' },
  { level: 'A11', title: '家族治理', family: 'govern', lower: 1e10, upper: 1e11, range: '100亿–不足1000亿元', focus: '家族规则与接班安排', priorities: ['区分所有权、管理权和家庭角色', '约定分配、加入、退出和争议处理', '安排管理交接与下一代培养'], first: '先讨论“谁能决定什么”，再讨论分配。把重大事项、表决方式、紧急代理和争议路径写下来。' },
  { level: 'A12', title: '机构治理', family: 'govern', lower: 1e11, upper: 1e12, range: '1000亿–不足1万亿元', focus: '治理体系与持续运作', priorities: ['用统一口径看集团与家庭风险', '建立独立监督、审计与业务连续性', '让接班、数据安全和长期责任能执行'], first: '列出跨主体的重要权限、资金渠道和关键系统。检查关键人或系统中断时，谁能接手、资料在哪里。' },
];

// RMB household net worth, including owner-occupied housing. Upper bounds are exclusive.
export function assetLevel(netWorth) {
  if (!Number.isFinite(netWorth)) return null;
  return assetPlans.find(plan => netWorth >= plan.lower && netWorth < plan.upper)?.level || null;
}

export const planHref = level => `/guide/plan-${level.toLowerCase()}`;
