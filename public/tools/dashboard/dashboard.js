(() => {
  "use strict";

  const ENDPOINT = "/api/v1/dashboard";
  const NS = "http://www.w3.org/2000/svg";
  const COLORS = ["#354eb4", "#6f7bd4", "#45a66b", "#f0b641", "#df6b78", "#6aa9b6", "#9a68ba", "#768093"];
  const FAMILY_ICONS = {PLATFORM:"▦",TENANT_OPERATIONS:"⌂",CAMPUS_OPERATIONS:"⌖",FINANCE:"◉",ENGAGEMENT:"◇",CONTENT:"▤",COMMUNICATIONS:"✉",SECURITY:"◈",CUSTOMER_SELF_SERVICE:"♡",GUEST_SELF_SERVICE:"◎"};
  const FAMILY_NAMES = {PLATFORM:"Platform",TENANT_OPERATIONS:"Tenant operations",CAMPUS_OPERATIONS:"Campus operations",FINANCE:"Finance & giving",ENGAGEMENT:"Engagement",CONTENT:"Content",COMMUNICATIONS:"Communications",SECURITY:"Security",CUSTOMER_SELF_SERVICE:"My dashboard",GUEST_SELF_SERVICE:"Transactions"};
  const state = {response:null, family:null, request:null};
  const el = id => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", start);

  function start() {
    bindEvents();
    el("zone-id").value = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    loadDashboard();
  }

  function bindEvents() {
    el("toggle-filters").addEventListener("click", () => {
      const panel = el("dashboard-filters");
      panel.hidden = !panel.hidden;
      el("toggle-filters").setAttribute("aria-expanded", String(!panel.hidden));
    });
    el("period").addEventListener("change", toggleCustomRange);
    el("dashboard-filters").addEventListener("submit", event => {event.preventDefault(); loadDashboard(readFilters());});
    el("reset-filters").addEventListener("click", resetFilters);
    el("refresh-dashboard").addEventListener("click", () => loadDashboard(state.request));
    el("mobile-menu").addEventListener("click", toggleMobileMenu);
    el("collapse-sidebar").addEventListener("click", () => {
      document.body.classList.toggle("sidebar-collapsed");
      const expanded = !document.body.classList.contains("sidebar-collapsed");
      el("collapse-sidebar").setAttribute("aria-expanded", String(expanded));
    });
    document.addEventListener("keydown", event => {if (event.key === "Escape") closeMobileMenu();});
  }

  function toggleMobileMenu() {
    const open = el("sidebar").classList.toggle("open");
    el("mobile-menu").setAttribute("aria-expanded", String(open));
  }
  function closeMobileMenu(){el("sidebar").classList.remove("open");el("mobile-menu").setAttribute("aria-expanded","false")}
  function toggleCustomRange(){document.querySelectorAll(".custom-range").forEach(node => node.hidden = el("period").value !== "CUSTOM")}
  function resetFilters(){el("dashboard-filters").reset();el("zone-id").value=Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";toggleCustomRange();loadDashboard({family:state.family})}

  function readFilters() {
    const custom = el("period").value === "CUSTOM";
    return compact({family:state.family,period:custom?null:el("period").value,granularity:el("granularity").value,dimension:el("dimension").value,campusId:el("campus-id").value,currency:el("currency").value.toUpperCase(),zoneId:el("zone-id").value,from:custom?toInstant(el("from").value):null,to:custom?toInstant(el("to").value):null,limit:20});
  }
  function toInstant(value){return value?new Date(value).toISOString():null}
  function compact(object){return Object.fromEntries(Object.entries(object).filter(([,value])=>value!==null&&value!==undefined&&value!==""))}

  async function loadDashboard(parameters = {}) {
    state.request = {...parameters};
    setLoading();
    const query = new URLSearchParams(compact(parameters));
    try {
      const response = await fetch(`${ENDPOINT}${query.size?`?${query}`:""}`, {
        method:"GET",
        credentials:"include",
        headers:await requestHeaders(),
        cache:"no-store"
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || body?.detail || `Dashboard request failed (${response.status}).`);
      validateDashboardResponse(body);
      state.response = body;
      state.family = body.selectedFamily || parameters.family || null;
      render(body);
    } catch (error) {
      clearDashboard();
      el("dashboard-status").className = "status error";
      el("dashboard-status").textContent = error.message;
    }
  }

  async function requestHeaders() {
    // Prefer the application's canonical in-memory authentication adapter.
    // HttpOnly session-cookie deployments need no Authorization header.
    const tokenProvider = window.goWorshipAuth?.getAccessToken;
    const token = typeof tokenProvider === "function"
      ? await tokenProvider()
      : null;

    return {
      Accept:"application/json",
      ...(token ? {Authorization:`Bearer ${token}`} : {})
    };
  }

  function validateDashboardResponse(data) {
    if (!data || typeof data !== "object") throw new Error("The dashboard response body is missing.");
    if (!data.context || typeof data.context !== "object") throw new Error("Dashboard context is missing.");
    if (!data.range || typeof data.range !== "object") throw new Error("Dashboard range is missing.");
    if (!Array.isArray(data.availableFamilies)) throw new Error("Dashboard availableFamilies must be an array.");
    if (!Array.isArray(data.sections)) throw new Error("Dashboard sections must be an array.");
    if (!Array.isArray(data.alerts)) throw new Error("Dashboard alerts must be an array.");
    if (data.selectedFamily && !data.availableFamilies.includes(data.selectedFamily)) {
      throw new Error("The selected dashboard family is not authorized.");
    }
  }

  function setLoading() {
    el("dashboard-status").className="status";el("dashboard-status").textContent="Loading authorized dashboard…";
    el("alerts").replaceChildren();el("section-grid").replaceChildren();el("metric-grid").replaceChildren(el("loading-template").content.cloneNode(true));
  }
  function clearDashboard(){el("alerts").replaceChildren();el("metric-grid").replaceChildren();el("section-grid").replaceChildren()}

  function render(data) {
    el("dashboard-status").textContent="";
    renderContext(data.context, data.selectedFamily);
    renderFamilies(data.availableFamilies || [], data.selectedFamily);
    renderAlerts(data.alerts || []);
    renderSections(data.sections || []);
    el("generated-at").textContent=data.generatedAt?`Generated ${formatDateTime(data.generatedAt,data.range?.zoneId)}`:"";
  }

  function renderContext(context, family) {
    if (!context) throw new Error("Dashboard response context is required.");
    el("tenant-name").textContent=context.tenantDisplayName;
    el("user-name").textContent=context.userDisplayName;
    el("user-initials").textContent=initials(context.userDisplayName);
    el("access-mode").textContent=`${humanize(context.accessMode)} · ${context.readOnly?"Read only":"Authorized"}`;
    el("scope-label").textContent=context.campusName||humanize(context.scopeType);
    el("family-eyebrow").textContent=FAMILY_NAMES[family]||humanize(family||"Dashboard");
    el("dashboard-title").textContent=titleFor(context,family);
    el("dashboard-description").textContent=descriptionFor(context,family);
    el("campus-filter").hidden=context.scopeType!=="CAMPUS";
    document.title=`${FAMILY_NAMES[family]||"Dashboard"} | ${context.tenantDisplayName}`;
  }

  function titleFor(context,family){if(family==="CUSTOMER_SELF_SERVICE")return `Hello, ${firstName(context.userDisplayName)}`;if(family==="GUEST_SELF_SERVICE")return "My transactions";if(family==="PLATFORM")return "Platform overview";if(family==="SECURITY")return "Security & compliance";if(family==="FINANCE")return "Financial overview";return context.campusName?`${context.campusName} overview`:`${context.tenantDisplayName} overview`}
  function descriptionFor(context,family){if(family==="CUSTOMER_SELF_SERVICE")return `Your personal activity at ${context.tenantDisplayName}.`;if(family==="GUEST_SELF_SERVICE")return "Your limited, verified contribution and receipt history.";if(family==="PLATFORM")return "Authorized platform-wide operational analysis.";return `Read-only ${humanize(context.scopeType).toLowerCase()} analysis for the selected period.`}

  function renderFamilies(families, selected) {
    const nav=el("family-nav");nav.replaceChildren();
    families.forEach(family=>{const button=node("button","family-button");button.type="button";button.dataset.family=family;if(family===selected)button.setAttribute("aria-current","page");const icon=node("span","family-icon",FAMILY_ICONS[family]||"□");icon.setAttribute("aria-hidden","true");button.append(icon,node("span","nav-label",FAMILY_NAMES[family]||humanize(family)));button.addEventListener("click",()=>{state.family=family;closeMobileMenu();loadDashboard({...readFilters(),family})});nav.append(button)});
  }

  function renderAlerts(alerts) {
    const host=el("alerts");host.replaceChildren();
    alerts.forEach(item=>{const card=node("article","alert");card.dataset.severity=item.severity||"INFORMATION";const copy=node("div");copy.append(node("strong","",item.title),node("p","",item.message));card.append(copy);if(item.actionRoute){const link=node("a","",humanize(item.actionType||"View"));link.href=safeRoute(item.actionRoute);card.append(link)}host.append(card)});
  }

  function renderSections(sections) {
    const metricHost=el("metric-grid"),sectionHost=el("section-grid");metricHost.replaceChildren();sectionHost.replaceChildren();
    sections.flatMap(section=>(section.metrics||[]).map(metric=>({metric,section}))).forEach(({metric,section})=>metricHost.append(renderMetric(metric,section)));
    sections.forEach(section=>{
      const block=node("div","section-block");
      (section.series||[]).forEach(series=>block.append(renderSeries(series,section)));
      (section.breakdowns||[]).forEach(breakdown=>block.append(renderBreakdown(breakdown,section)));
      (section.tables||[]).forEach(table=>block.append(renderTable(table,section)));
      if((section.actions||[]).length)block.append(renderActions(section.actions,section));
      sectionHost.append(block);
    });
    if(!metricHost.children.length)metricHost.hidden=true;else metricHost.hidden=false;
    if(!sectionHost.children.length){sectionHost.append(node("div","empty-state","No analysis is available for this authorized view and period."))}
  }

  function renderMetric(metric,section){const card=node("article","metric-card");card.dataset.severity=metric.severity||section.severity||"NEUTRAL";card.append(node("div","metric-label",metric.label),node("div","metric-value",formatMetric(metric)));const support=node("div","metric-support",metric.supportingText||"");if(metric.percentageChange!=null){const trend=node("span",`trend ${metric.trend||"NOT_AVAILABLE"}`,`${trendSymbol(metric.trend)} ${formatNumber(Math.abs(Number(metric.percentageChange)),1)}%`);support.append(trend)}card.append(support);return card}

  function renderSeries(series,section){const wide=(series.points||[]).length>8||series.chartType==="AREA"||series.chartType==="LINE"||series.chartType==="STACKED_BAR";const card=analysisCard(series.label,section.description,wide);const wrap=node("div",`chart-wrap${wide?"":" compact"}`);const type=series.chartType||"LINE";if(type==="PIE"||type==="DONUT")wrap.append(renderDonut(series.points||[],series.unit,series.currency,type==="PIE"));else if(type==="GAUGE")wrap.append(renderGauge(series.points||[],series.unit,series.currency));else if(type==="HEATMAP")wrap.append(renderHeatmap(series.points||[]));else wrap.append(renderCartesian(series));card.append(wrap);return card}

  function renderBreakdown(breakdown,section){const items=breakdown.items||[];const useDonut=items.length<=6;const card=analysisCard(breakdown.label,section.description,false);const wrap=node("div","chart-wrap compact");wrap.append(useDonut?renderDonut(items,breakdown.unit,breakdown.currency,false):renderHorizontalBars(items,breakdown.unit,breakdown.currency));card.append(wrap);return card}

  function analysisCard(title,description,wide){const card=node("article",`analysis-card${wide?" wide":""}`);const heading=node("div","card-heading"),copy=node("div");copy.append(node("h2","",title));if(description)copy.append(node("p","",description));heading.append(copy);card.append(heading);return card}

  function renderCartesian(series){const points=series.points||[],svg=svgNode("svg",{viewBox:"0 0 800 300",class:"chart-svg",role:"img","aria-label":series.label});if(!points.length){svg.append(svgText(400,150,"No chart data","chart-axis","middle"));return svg}const values=points.map(p=>Number(p.value)||0),max=Math.max(...values,1),left=58,right=18,top=18,bottom=46,w=800-left-right,h=300-top-bottom;for(let i=0;i<=4;i++){const y=top+h-(h*i/4);svg.append(svgNode("line",{x1:left,y1:y,x2:800-right,y2:y,class:"chart-grid"}),svgText(left-8,y+4,formatCompact(max*i/4),"chart-axis","end"))}const bar=series.chartType==="BAR"||series.chartType==="STACKED_BAR";if(bar){const step=w/points.length,bw=Math.max(4,step*.58);points.forEach((p,i)=>{const bh=h*(values[i]/max),x=left+i*step+(step-bw)/2,y=top+h-bh;svg.append(svgNode("rect",{x,y,width:bw,height:bh,rx:3,class:`chart-bar${i%2?" alt":""}`}));if(i%Math.ceil(points.length/8)===0)svg.append(svgText(x+bw/2,300-18,pointLabel(p),"chart-axis","middle"))})}else{const coords=points.map((p,i)=>[left+(points.length===1?w/2:(w*i/(points.length-1))),top+h-(h*values[i]/max)]);if(series.chartType==="AREA"){const polygon=`${left},${top+h} ${coords.map(c=>c.join(",")).join(" ")} ${left+w},${top+h}`;const defs=svgNode("defs"),gradient=svgNode("linearGradient",{id:"area-gradient",x1:"0",y1:"0",x2:"0",y2:"1"});gradient.append(svgNode("stop",{offset:"0%","stop-color":"#4457c4"}),svgNode("stop",{offset:"100%","stop-color":"#dce3ff"}));defs.append(gradient);svg.append(defs,svgNode("polygon",{points:polygon,class:"chart-area"}))}svg.append(svgNode("polyline",{points:coords.map(c=>c.join(",")).join(" "),class:"chart-line"}));coords.forEach((c,i)=>{svg.append(svgNode("circle",{cx:c[0],cy:c[1],r:3.5,fill:"#2d478f"}));if(i%Math.ceil(points.length/8)===0)svg.append(svgText(c[0],300-18,pointLabel(points[i]),"chart-axis","middle"))})}return svg}

  function renderDonut(items,unit,currency,pie){const layout=node("div","donut-layout"),total=items.reduce((sum,item)=>sum+(Number(item.value)||0),0),segments=[];let cursor=0;items.forEach((item,index)=>{const value=Number(item.value)||0,pct=total?value/total*100:0,color=safeColor(item.color)||COLORS[index%COLORS.length];segments.push(`${color} ${cursor}% ${cursor+pct}%`);cursor+=pct});const donut=node("div","donut");donut.style.background=`conic-gradient(${segments.join(",")||"#e7eaf1 0 100%"})`;if(pie)donut.style.setProperty("--pie","1");const legend=node("div","legend");items.forEach((item,index)=>{const row=node("div","legend-item"),swatch=node("span","legend-swatch");swatch.style.background=safeColor(item.color)||COLORS[index%COLORS.length];row.append(swatch,node("span","",item.label||pointLabel(item)),node("strong","",formatValue(item.value,unit,currency)));legend.append(row)});layout.append(donut,legend);return layout}

  function renderHorizontalBars(items,unit,currency){const svg=svgNode("svg",{viewBox:`0 0 700 ${Math.max(220,items.length*42)}`,class:"chart-svg"}),max=Math.max(...items.map(i=>Number(i.value)||0),1);items.forEach((item,index)=>{const y=18+index*42,width=430*(Number(item.value)||0)/max;svg.append(svgText(8,y+15,truncate(item.label,22),"chart-label","start"),svgNode("rect",{x:190,y,width:width,height:22,rx:4,fill:safeColor(item.color)||COLORS[index%COLORS.length]}),svgText(635,y+15,formatValue(item.value,unit,currency),"chart-label","start"))});return svg}
  function renderGauge(points,unit,currency){const value=Number(points[0]?.value)||0,gauge=node("div");const arc=node("div","gauge");arc.style.setProperty("--gauge",String(Math.max(0,Math.min(100,value))));gauge.append(arc,node("div","gauge-value",formatValue(value,unit,currency)));return gauge}
  function renderHeatmap(points){const host=node("div","heatmap"),max=Math.max(...points.map(p=>Number(p.value)||0),1);points.forEach(point=>{const value=Number(point.value)||0,cell=node("div","heat-cell",pointLabel(point));cell.style.background=`rgba(45,71,143,${.12+.78*value/max})`;cell.title=`${pointLabel(point)}: ${value}`;host.append(cell)});return host}

  function renderTable(table,section){const card=node("article","table-card"),heading=node("div","card-heading"),copy=node("div");copy.append(node("h2","",table.title));copy.append(node("p","",`${table.rows?.length||0} of ${table.totalRows||0} rows${table.moreAvailable?" · more available":""}`));heading.append(copy);card.append(heading);const scroll=node("div","table-scroll"),grid=node("table","data-table"),thead=node("thead"),headRow=node("tr");(table.columns||[]).forEach(column=>headRow.append(node("th","",column.label)));thead.append(headRow);const tbody=node("tbody");(table.rows||[]).forEach(row=>{const tr=node("tr");tr.dataset.severity=row.severity||"NEUTRAL";(table.columns||[]).forEach(column=>{const td=node("td");const value=row.values?.[column.key];if(column.key.toLowerCase().includes("status")||column.key.toLowerCase().includes("outcome")){td.append(node("span",`severity-pill ${severityFor(value,row.severity)}`,formatCell(value,column)))}else td.textContent=formatCell(value,column);tr.append(td)});tbody.append(tr)});grid.append(thead,tbody);scroll.append(grid);card.append(scroll);if(!(table.rows||[]).length)card.append(node("p","empty-state","No records are available."));return card}

  function renderActions(actions,section){const card=analysisCard(`${section.title} links`,null,false),host=node("div","actions");actions.forEach(action=>{const link=node("a","action-link",action.label);link.href=safeRoute(action.route);if(!action.enabled){link.setAttribute("aria-disabled","true");link.removeAttribute("href");link.title=action.disabledReason||"Unavailable"}host.append(link)});card.append(host);return card}

  function formatMetric(metric){return metric.formattedValue||formatValue(metric.value,metric.unit,metric.currency)}
  function formatValue(value,unit,currency){const number=Number(value)||0;switch(unit){case"CURRENCY":return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD",maximumFractionDigits:2}).format(number);case"PERCENTAGE":return `${formatNumber(number,1)}%`;case"RATIO":return formatNumber(number,2);case"DURATION_MILLISECONDS":return `${formatNumber(number,0)} ms`;case"DURATION_SECONDS":return `${formatNumber(number,0)} sec`;case"DURATION_MINUTES":return `${formatNumber(number,0)} min`;case"DURATION_HOURS":return `${formatNumber(number,1)} hr`;case"DURATION_DAYS":return `${formatNumber(number,1)} days`;case"BOOLEAN":return number?"Yes":"No";default:return new Intl.NumberFormat(undefined,{notation:Math.abs(number)>=100000?"compact":"standard",maximumFractionDigits:1}).format(number)}}
  function formatCell(value,column){if(value===null||value===undefined)return "—";if(typeof value==="boolean")return value?"Yes":"No";if(column.unit&&typeof value!=="object")return formatValue(value,column.unit);if(typeof value==="object")return JSON.stringify(value);return String(value)}
  function formatNumber(value,digits){return new Intl.NumberFormat(undefined,{maximumFractionDigits:digits}).format(value)}
  function formatCompact(value){return new Intl.NumberFormat(undefined,{notation:"compact",maximumFractionDigits:1}).format(value)}
  function formatDateTime(value,zone){try{return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short",timeZone:zone||undefined}).format(new Date(value))}catch{return new Date(value).toLocaleString()}}
  function pointLabel(point){return point.label||formatDateTime(point.timestamp)}
  function trendSymbol(direction){return direction==="UP"?"↑":direction==="DOWN"?"↓":"→"}
  function severityFor(value,fallback){const normalized=String(value||"").toUpperCase();if(["SUCCEEDED","SUCCESS","ACTIVE","PAID","AUTHORIZED"].includes(normalized))return"SUCCESS";if(["PENDING","WARNING","PAST_DUE","REQUIRES_ACTION"].includes(normalized))return"WARNING";if(["FAILED","ERROR","CANCELED","EXPIRED","SUSPENDED"].includes(normalized))return"ERROR";return fallback||"NEUTRAL"}
  function humanize(value){return String(value||"").toLowerCase().replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
  function initials(value){return String(value||"GW").trim().split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase()}
  function firstName(value){return String(value||"there").trim().split(/\s+/)[0]}
  function truncate(value,length){const text=String(value||"");return text.length>length?`${text.slice(0,length-1)}…`:text}
  function safeRoute(route){return typeof route==="string"&&route.startsWith("/")&&!route.startsWith("//")&&!route.includes("://")?route:"#"}
  function safeColor(color){return typeof color==="string"&&/^(#[0-9a-f]{3,8}|rgb\([\d\s,.%]+\)|hsl\([\d\s,.%]+\))$/i.test(color)?color:null}
  function node(tag,className="",text=""){const item=document.createElement(tag);if(className)item.className=className;if(text!=="")item.textContent=text;return item}
  function svgNode(tag,attributes={}){const item=document.createElementNS(NS,tag);Object.entries(attributes).forEach(([key,value])=>item.setAttribute(key,String(value)));return item}
  function svgText(x,y,text,className,anchor){const item=svgNode("text",{x,y,class:className,"text-anchor":anchor});item.textContent=text;return item}
})();
