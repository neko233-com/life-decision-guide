export const categories = [
  { id: 'health', name: '健康', icon: 'HeartPulse', description: '吃、睡、运动与看病。', primary: true },
  { id: 'safety', name: '安全', icon: 'ShieldCheck', description: '出行、急救与信息保护。', primary: true },
  { id: 'money', name: '生活与钱', icon: 'Wallet', description: '消费、住房与经营。', primary: true },
  { id: 'rights', name: '工作与权益', icon: 'Scale', description: '工资、合同与法律。', primary: true },
  { id: 'family', name: '家人与关系', icon: 'UsersRound', description: '相处、育儿与照护。', primary: true },
  { id: 'growth', name: '成长与选择', icon: 'Compass', description: '时间、学习与下一步。', primary: true },
];
export const categoryAliases = {
  career: 'growth', learning: 'growth', relationships: 'family',
  living: 'money', energy: 'growth', thinking: 'growth',
};
