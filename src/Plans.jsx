import { useEffect, useRef, useState } from 'react';
import Icon from './Icons.jsx';
import { assetPlans, planFamilies, planHref, planLevelFromSearch, planSelectionHref } from './plans.js';

export default function Plans() {
  const [level, setLevel] = useState('A5');
  const selectedPlan = useRef(null);
  const plan = assetPlans.find(item => item.level === level);
  function showSelectedPlan() {
    requestAnimationFrame(() => {
      selectedPlan.current?.querySelector('h2')?.focus({ preventScroll: true });
      selectedPlan.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }
  useEffect(() => {
    function restore() {
      const fromGroup = assetPlans.find(item => window.location.hash === `#stage-${item.family}`)?.level;
      setLevel(planLevelFromSearch(window.location.search) || fromGroup || 'A5');
      if (window.location.hash === '#selected-plan') showSelectedPlan();
    }
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  function choosePlan(nextLevel) {
    const href = `${planSelectionHref(nextLevel)}#selected-plan`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== href) window.history.pushState(null, '', href);
    setLevel(nextLevel);
    showSelectedPlan();
  }
  return <main id="main-content" className="container plans-page">
    <div className="page-intro"><a className="breadcrumb" href="/">指南首页 <Icon name="ChevronRight" size={14} /></a><span className="eyebrow">生活行动计划 · PLAN</span><h1>你的阶段，先做什么？</h1><p>找重点，再把计划落到接下来 30 天。</p></div>
    <div className="plan-basis"><Icon name="Wallet" size={21} /><p><strong>家庭净资产 = 总资产 − 负债</strong><span>含自住房，以人民币计；区间含下限、不含上限。</span></p><details><summary>怎么算？</summary><p>房屋按参考市值计入资产，未还房贷计入负债；同一笔房贷只扣 1 次。现金、投资和其他可确认资产一起核对，年收入不直接算资产。企业权益按家庭持有的权益价值计，不把公司总资产重复加入。</p><p>例：自住房 200 万元 + 存款 30 万元 − 房贷 80 万元 = 净资产 150 万元，属于本页 A7；可用现金仍需单独检查。</p><p>A 编号按人民币金额位数标记，例如 A5 为 5 位数。分组与计划是本站阅读导航，不是官方财富等级或产品准入标准。</p></details></div>
    <section className="plan-selector" id="plan-selector" aria-label="按家庭净资产选择计划">{planFamilies.map(family => <section className="plan-stage-group" id={`stage-${family.id}`} key={family.id}><div className="plan-stage-heading"><small>{family.levels}</small><h2>{family.title}</h2><p>{family.description}</p></div><div className="plan-stage-options">{assetPlans.filter(item => item.family === family.id).map(item => <button type="button" key={item.level} className={level === item.level ? 'plan-choice selected' : 'plan-choice'} aria-pressed={level === item.level} onClick={() => choosePlan(item.level)}><span><strong>{item.title}</strong><small>{item.range}</small></span><b>{item.level}</b></button>)}</div></section>)}</section>
    <section className="selected-plan" id="selected-plan" ref={selectedPlan} aria-labelledby="selected-plan-title"><div className="selected-plan-intro"><span className="eyebrow">当前查看 · {plan.level}</span><h2 id="selected-plan-title" tabIndex={-1}>{plan.focus}</h2><p>{plan.range}</p><a className="button" href={planHref(plan.level)}>查看 30 / 90 天计划 <Icon name="ArrowRight" size={17} /></a><a className="text-link plan-reselect" href="#plan-selector">重新选区间</a></div><div className="selected-plan-actions" aria-live="polite"><h3>先抓这 3 件事</h3><ol>{plan.priorities.map(priority => <li key={priority}>{priority}</li>)}</ol><div className="plan-first"><span>这周先做</span><p>{plan.first}</p></div></div></section>
    <section className="plan-adjustments" aria-labelledby="adjustments-title"><div><span className="eyebrow">金额之外，再看现实</span><h2 id="adjustments-title">资产多，也要过好今天。</h2><p>收入、负债、供养责任和用钱时间，会改变优先顺序。</p></div><div className="plan-adjustment-links"><a href="/guide/plan-foundation#cashflow"><strong>现金紧张或收入不稳定</strong><span>先处理必要开支、债务和备用金 <Icon name="ArrowRight" size={16} /></span></a><a href="/guide/plan-a7#liquidity"><strong>资产主要是房子或企业股权</strong><span>先检查可用现金和退出条件 <Icon name="ArrowRight" size={16} /></span></a><a href="/guide/plan-foundation#goals"><strong>近期要买房、养育或照顾老人</strong><span>先把金额、日期与责任列清楚 <Icon name="ArrowRight" size={16} /></span></a></div></section>
    <div className="plan-baseline"><Icon name="Compass" size={27} /><div><h2>不确定阶段？从基础计划开始。</h2><p>低于 1 万元、净负债或尚未盘点，都可以先看；达到 1 万亿元后按实际复杂程度继续看治理计划。</p></div><a className="text-link" href="/guide/plan-foundation">稳住日常 <Icon name="ArrowRight" size={17} /></a></div>
    <p className="plan-note">每个阶段都要照顾健康、关系和职业。30 / 90 天是便于执行的示例节奏，按现实调整；投资比例、法律与税务安排需另行核对。</p>
  </main>;
}
