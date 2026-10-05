import { useEffect, useRef, useState } from 'react';
import Icon from './Icons.jsx';
import { createDraft, evaluateOptions, recordMarkdown, scoreLabels, storageKey, validDraft, weightLabels } from './scoring.js';
import { readStored, writeStored } from './storage.js';

const browserStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};

function download(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Workbench() {
  const [draft, setDraft] = useState(createDraft);
  const [loaded, setLoaded] = useState(false);
  const [storageStatus, setStorageStatus] = useState('正在读取记录…');
  const [storageIssue, setStorageIssue] = useState(null);
  const savedRaw = useRef(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    const saved = readStored(browserStorage, storageKey, validDraft);
    savedRaw.current = saved.raw;
    if (saved.state === 'ready' && saved.value) setDraft(saved.value);
    if (saved.state !== 'ready') { setStorageIssue(saved); setStorageStatus('当前修改请导出保存'); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded || storageIssue) return;
    const saved = writeStored(browserStorage, storageKey, draft, savedRaw.current);
    savedRaw.current = saved.raw;
    if (saved.state === 'ready') setStorageStatus('已自动保存');
    else { setStorageIssue(saved); setStorageStatus('当前修改请导出保存'); }
  }, [draft, loaded, storageIssue]);
  useEffect(() => {
    function changed(event) {
      if ((event.key === storageKey || event.key === null) && event.newValue !== savedRaw.current) {
        setStorageIssue({ state: 'conflict', raw: event.newValue });
        setStorageStatus('另一页面更新了记录');
        setConfirmReplace(false);
      }
    }
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  const update = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  const updateOption = (index, key, value) => setDraft(previous => ({ ...previous, options: previous.options.map((option, i) => i === index ? { ...option, [key]: value } : option) }));
  const evaluation = evaluateOptions(draft.options, draft.criteria);
  function exportRecord() {
    download(recordMarkdown(draft), '我的决策记录.md', 'text/markdown;charset=utf-8');
  }
  function recover(useCurrent, replace = useCurrent) {
    const saved = useCurrent ? writeStored(browserStorage, storageKey, draft, savedRaw.current, replace) : readStored(browserStorage, storageKey, validDraft);
    savedRaw.current = saved.raw;
    setConfirmReplace(false);
    if (saved.state === 'ready') {
      if (!useCurrent) setDraft(saved.value || createDraft());
      setStorageIssue(null); setStorageStatus(useCurrent ? '已保存当前填写' : '已载入保存的记录');
    } else { setStorageIssue(saved); setStorageStatus('当前修改请导出保存'); }
  }
  return <main id="main-content" className="container workbench">
    <div className="page-intro"><a className="breadcrumb" href="/">指南首页 <Icon name="ChevronRight" size={14} /></a><h1>把选择，摆在一起。</h1><p>同一套标准，比较不同方案。</p></div>
    <div className="workbench-toolbar"><span role="status"><Icon name={storageIssue ? 'Info' : 'Check'} size={16} />{storageStatus}</span><button className="text-link" disabled={!loaded} onClick={exportRecord}><Icon name="Download" size={17} />导出记录</button></div>
    {storageIssue && <div className="storage-recovery" role="status"><p>{storageIssue.state === 'invalid' ? '原记录暂时无法读取，已保留。当前填写请先导出；重新载入或确认保存后才会替换。' : storageIssue.state === 'conflict' ? '另一页面已更新记录。当前填写尚未覆盖它，请先导出，再选择载入或保存。' : '浏览器暂时无法读写记录。当前填写可继续使用，请导出保存，或重试保存。'}</p><div>{storageIssue.raw !== null && <button className="text-link" onClick={() => download(storageIssue.raw, '原决策记录.json', 'application/json;charset=utf-8')}>下载原记录</button>}<button className="text-link" onClick={() => storageIssue.state === 'unavailable' ? recover(true, false) : recover(false)}>{storageIssue.state === 'unavailable' ? '重试保存' : '载入保存的记录'}</button>{confirmReplace ? <><span>确认用当前填写覆盖？</span><button className="text-link" onClick={() => recover(true)}>确认覆盖</button><button className="text-link" onClick={() => setConfirmReplace(false)}>取消</button></> : <button className="text-link" onClick={() => setConfirmReplace(true)}>保存当前填写</button>}</div></div>}
    <div className="workbench-grid"><fieldset className="workbench-form" disabled={!loaded}><legend className="sr-only">方案比较记录</legend>
      <section className="worksheet-section"><div className="worksheet-title"><span>01</span><h2>问题与底线</h2></div>
        <label>要决定什么<input placeholder="例如：留在当前公司，还是换工作？" value={draft.question} onChange={event => update('question', event.target.value)} maxLength={500} /></label>
        <details className="decision-context"><summary>写下目标与不可妥协的底线</summary><div className="two-fields"><label>想达成什么<textarea placeholder="例如：提高收入，也留出学习时间。" value={draft.goals} onChange={event => update('goals', event.target.value)} maxLength={5000} /></label><label>要守住什么<textarea placeholder="例如：不能影响必要开支。违反底线的方案先排除。" value={draft.constraints} onChange={event => update('constraints', event.target.value)} maxLength={5000} /></label></div></details>
      </section>
      <section className="worksheet-section"><div className="worksheet-title"><span>02</span><h2>什么对你更重要？</h2></div>
        <p className="field-help">权重 1–5 表示重要程度，0 不计入；占比会自动换算。</p>
        <div className="criteria-editor">{draft.criteria.map((criterion, index) => <div key={index}>
          <label>标准 {index + 1}<input aria-label={`标准 ${index + 1} 名称`} value={criterion.name} maxLength={80} onChange={event => update('criteria', draft.criteria.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /></label>
          <label>重要程度<select aria-label={`标准 ${index + 1} 权重`} value={criterion.weight} onChange={event => update('criteria', draft.criteria.map((item, i) => i === index ? { ...item, weight: Number(event.target.value) } : item))}>{weightLabels.map((label, value) => <option key={value} value={value}>{label}</option>)}</select><small className="weight-share">占比 {(evaluation.weights[index] * 100).toFixed(1)}%</small></label>
        </div>)}</div>
        <p className="field-help">例如“成本可承受”“风险可接受”，越低成本、越小风险，评分越高。</p>
      </section>
      <section className="worksheet-section"><div className="worksheet-title"><span>03</span><h2>每个方案有多符合？</h2></div>
        <div className="score-rubric" aria-label="评分标准">{scoreLabels.slice(1).map((label, i) => <div key={label}><strong>{i + 1}</strong><span>{label.slice(4)}</span></div>)}</div>
        <p className="field-help">全部按“越符合，分越高”填写；拿不准先留空，核实后再评。</p>
        <div className="comparison-scroll"><table className="comparison-table"><caption className="sr-only">同一套标准比较方案，评分越高越符合；权重为 0 的标准不计入。</caption><thead><tr><th scope="col">方案</th>{draft.criteria.map((criterion, i) => <th scope="col" key={i}>{criterion.name || `标准 ${i + 1}`}<small>{(evaluation.weights[i] * 100).toFixed(1)}%</small></th>)}<th scope="col">加权分</th><th scope="col"><span className="sr-only">删除</span></th></tr></thead><tbody>{draft.options.map((option, index) => <tr key={option.id}>
          <td><input aria-label={`方案 ${index + 1} 名称`} value={option.name} maxLength={80} onChange={event => updateOption(index, 'name', event.target.value)} /></td>
          {option.scores.map((value, i) => <td key={i}><select aria-label={`方案 ${index + 1} 标准 ${i + 1} ${draft.criteria[i].name || '未命名'}评分`} value={value} disabled={draft.criteria[i].weight === 0} onChange={event => updateOption(index, 'scores', option.scores.map((item, j) => j === i ? Number(event.target.value) : item))}><option value={0}>{draft.criteria[i].weight === 0 ? '不计入' : '未评分'}</option>{scoreLabels.slice(1).map((label, i) => <option key={i} value={i + 1}>{label}</option>)}</select></td>)}
          <td className="weighted-score">{evaluation.results[index].complete ? <>{evaluation.results[index].hundred.toFixed(1)}<small>/ 100</small></> : '—'}</td>
          <td><button className="icon-button" disabled={draft.options.length <= 2} onClick={() => update('options', draft.options.filter((_, i) => i !== index))} aria-label={`删除方案 ${index + 1}`}><Icon name="Trash2" size={16} /></button></td>
        </tr>)}</tbody></table></div>
        <button className="text-link add-option" disabled={draft.options.length >= 5} onClick={() => update('options', [...draft.options, { id: crypto.randomUUID(), name: ['方案 A', '方案 B', '方案 C', '方案 D', '方案 E'].find(name => !draft.options.some(item => item.name === name)), scores: [0, 0, 0] }])}><Icon name="Plus" size={17} />添加方案{draft.options.length >= 5 ? '（最多 5 个）' : ''}</button>
        <div className="comparison-result" aria-live="polite"><Icon name="Compass" size={20} /><p>{evaluation.complete ? `${evaluation.winners.map(option => option.name || '未命名方案').join('、')}${evaluation.winners.length > 1 ? ' 并列最高' : ' 得分最高'}：${evaluation.highest.toFixed(1)} / 100。` : !evaluation.totalWeight ? '至少设置 1 个大于 0 的权重。' : '填完所有方案的有效标准后，才显示比较结果。'}</p></div>
        <div className="score-breakdowns">{evaluation.results.map(option => <div className="score-breakdown" key={option.id}><div className="score-breakdown-title"><strong>{option.name || '未命名方案'}</strong><span>{option.complete ? `${option.five.toFixed(2)} / 5` : evaluation.totalWeight ? `还差 ${option.missing} 项` : '未设置权重'}</span></div><div className="score-bar" aria-hidden="true"><span style={{ width: `${option.hundred ?? 0}%` }} /></div>{option.complete && <div className="score-contributions">{draft.criteria.map((criterion, i) => <span key={i}>{criterion.name || `标准 ${i + 1}`} <strong>{option.contributions[i].toFixed(1)}</strong></span>)}</div>}</div>)}</div>
        <details className="score-explanation"><summary>总分怎么算？看 1 个例子</summary><p>总分 = 各项（评分 ÷ 5 × 权重占比 × 100）相加。</p><p>权重 5、3、0 → 占比 62.5%、37.5%、0%。评分 5、3、未填 → 62.5 + 22.5 = <strong>85 / 100</strong>（4.25 / 5）。</p><p>分数来自你的判断，不是成功概率。违反底线的方案先排除；得分接近时，先核实关键差异。</p></details>
      </section>
      <details className="decision-next"><summary>记录下一步与回看时间</summary><section className="worksheet-section"><div className="worksheet-title"><span>04</span><h2>先试一步</h2></div><label>先做什么<textarea placeholder="例如：本周和 2 位同行聊新岗位的真实日常。" value={draft.experiment} onChange={event => update('experiment', event.target.value)} maxLength={5000} /></label><label>何时回看<textarea placeholder="例如：2 周后，根据新信息重评。" value={draft.review} onChange={event => update('review', event.target.value)} maxLength={5000} /></label></section></details>
      <div className="worksheet-bottom"><button className="button" onClick={exportRecord}><Icon name="Download" size={17} />导出记录</button>{confirmClear ? <div className="clear-confirm"><span>清空当前记录？</span><button onClick={() => { setDraft(createDraft()); setConfirmClear(false); }}>确认清空</button><button onClick={() => setConfirmClear(false)}>取消</button></div> : <button className="text-link muted" onClick={() => setConfirmClear(true)}>重新开始</button>}</div>
    </fieldset><aside className="workbench-aside"><Icon name="Scale" size={30} /><h2>先统一尺度</h2><p>权重回答“有多重要”。<br />评分回答“有多符合”。</p><p>同一项标准，对所有方案使用相同的判断依据。</p><a className="text-link" href="/guide/reversible-decisions">判断能否回头 <Icon name="ArrowRight" size={16} /></a><p className="privacy-note"><Icon name="House" size={15} />记录仅存于当前浏览器；换设备或清理前请导出。</p></aside></div>
  </main>;
}
