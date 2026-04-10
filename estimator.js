(function () {
'use strict';

// ── CONFIG ────────────────────────────────────────────────────────────
var SB = (function () {
  try { var c = JSON.parse(localStorage.getItem('aj_supabase_config') || '{}'); return { url: c.url || '', key: c.key || '' }; } catch (e) { return { url: '', key: '' }; }
})();

function sbPost(table, data) {
  if (!SB.url || !SB.key) return;
  fetch(SB.url + '/rest/v1/' + table, {
    method: 'POST',
    headers: { 'apikey': SB.key, 'Authorization': 'Bearer ' + SB.key, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(data)
  }).catch(function () {});
}
function sbDel(table, id) {
  if (!SB.url || !SB.key) return;
  fetch(SB.url + '/rest/v1/' + table + '?id=eq.' + id, {
    method: 'DELETE',
    headers: { 'apikey': SB.key, 'Authorization': 'Bearer ' + SB.key }
  }).catch(function () {});
}

// ── DATA ──────────────────────────────────────────────────────────────
var REP = {
  residential: {
    centralAC:  { l:'Central AC (Split)',   i:'AC', inc:'Condenser+coil+labor+refrigerant.', exc:'Permit/Disposal/Ductwork', v:[{s:'1.5T',lo:2800,hi:4200},{s:'2T',lo:3200,hi:5000},{s:'2.5T',lo:3700,hi:5800},{s:'3T',lo:4200,hi:6500},{s:'3.5T',lo:4700,hi:7200},{s:'4T',lo:5200,hi:8000},{s:'5T',lo:6000,hi:9500}] },
    furnace:    { l:'Gas Furnace',          i:'FU', inc:'Unit+labor+gas connection.',        exc:'Permit/New flue/Disposal',  v:[{s:'60k BTU',lo:2000,hi:3200},{s:'80k BTU',lo:2400,hi:3900},{s:'100k BTU',lo:2900,hi:4700},{s:'120k BTU',lo:3400,hi:5500}] },
    fullSystem: { l:'Full System AC+Furnace',i:'FS',inc:'Both units+labor+refrigerant.',    exc:'Permit/Disposal/Ductwork',  v:[{s:'2T/60k',lo:5800,hi:8800},{s:'2.5T/80k',lo:6600,hi:10500},{s:'3T/80k',lo:7700,hi:12000},{s:'3.5T/100k',lo:8500,hi:13500},{s:'4T/100k',lo:9500,hi:15000},{s:'5T/120k',lo:11000,hi:17500}] },
    heatPump:   { l:'Heat Pump Ducted',     i:'HP', inc:'Outdoor+AHU+line set+labor+refrig.',exc:'Permit/Disposal/Electrical',v:[{s:'2T',lo:5000,hi:8000},{s:'2.5T',lo:5700,hi:9500},{s:'3T',lo:6500,hi:11000},{s:'3.5T',lo:7200,hi:12000},{s:'4T',lo:8000,hi:13500},{s:'5T',lo:9500,hi:16000}] },
    miniSplit:  { l:'Ductless Mini-Split',  i:'MS', inc:'Outdoor+heads+line set+labor.',    exc:'Permit/Electrical/Disposal', v:[{s:'1-Zone 9-12k',lo:2500,hi:4200},{s:'1-Zone 18-24k',lo:3200,hi:5500},{s:'2-Zone',lo:4500,hi:7500},{s:'3-Zone',lo:5800,hi:10000},{s:'4-Zone',lo:7500,hi:13000},{s:'5-Zone',lo:9500,hi:17000}] },
    ductwork:   { l:'Ductwork Replacement', i:'DW', inc:'Sheet metal+flex+insulation+labor.',exc:'Permit/Duct test/Disposal', v:[{s:'Under 1000 SF',lo:1800,hi:3500},{s:'1000-1500 SF',lo:2500,hi:4500},{s:'1500-2000 SF',lo:3200,hi:6000},{s:'2000-2500 SF',lo:4000,hi:7500},{s:'2500-3500 SF',lo:5500,hi:10000},{s:'3500+ SF',lo:8000,hi:15000}] },
    thermostat: { l:'Thermostat Controls',  i:'TH', inc:'Device+wiring+labor.',             exc:'System upgrade if needed',  v:[{s:'Programmable',lo:180,hi:400},{s:'Smart Ecobee/Nest',lo:300,hi:650},{s:'Communicating',lo:500,hi:1100}] }
  },
  commercial: {
    rtu:      { l:'Packaged RTU',          i:'RT', inc:'Unit+rigging labor ONLY.',            exc:'Crane/Curb/Permit/TAB/Disposal/Electrical', v:[{s:'3-4T',lo:5500,hi:10000},{s:'5T',lo:7000,hi:12500},{s:'7.5T',lo:9000,hi:15500},{s:'10T',lo:12000,hi:20000},{s:'12.5T',lo:15000,hi:25000},{s:'15T',lo:18000,hi:31000},{s:'17.5T',lo:21000,hi:37000},{s:'20T',lo:24000,hi:44000},{s:'25T',lo:30000,hi:56000}] },
    splitComm:{ l:'Commercial Split',      i:'CS', inc:'Condenser+AHU+line set+labor+refrig.',exc:'Permit/Electrical/TAB/Disposal', v:[{s:'3-5T',lo:6500,hi:14000},{s:'7.5T',lo:9500,hi:18000},{s:'10T',lo:13000,hi:22000},{s:'15T',lo:17000,hi:31000},{s:'20T',lo:22000,hi:42000}] },
    vrf:      { l:'VRF/VRV System',        i:'VF', inc:'Outdoor VRF+indoor heads+piping+labor.',exc:'Permit/BAS/TAB/Electrical/Disposal', v:[{s:'4-6T Small',lo:14000,hi:26000},{s:'8-10T Med',lo:22000,hi:40000},{s:'12-16T Large',lo:33000,hi:58000},{s:'20T+ Full Bldg',lo:46000,hi:82000}] },
    chiller:  { l:'Chiller Air-Cooled',    i:'CH', inc:'Chiller unit+rigging+labor.',         exc:'Permit/Pump/BAS/TAB/Disposal', v:[{s:'20-30T',lo:40000,hi:75000},{s:'40-60T',lo:65000,hi:110000},{s:'80-100T',lo:100000,hi:160000},{s:'100T+',lo:130000,hi:220000}] },
    ahu:      { l:'Air Handling Unit',     i:'AH', inc:'AHU unit+labor.',                     exc:'Permit/Coil/TAB/Controls/Disposal', v:[{s:'2k-4k CFM',lo:6000,hi:13000},{s:'5k-8k CFM',lo:11000,hi:21000},{s:'10k-15k CFM',lo:18000,hi:33000},{s:'20k+ CFM',lo:28000,hi:52000}] },
    ductComm: { l:'Commercial Ductwork',   i:'CD', inc:'Sheet metal+insulation+labor.',       exc:'Permit/TAB', v:[{s:'Under 2000 SF',lo:4000,hi:10000},{s:'2k-5k SF',lo:8000,hi:22000},{s:'5k-10k SF',lo:15000,hi:40000},{s:'10k-20k SF',lo:28000,hi:65000},{s:'20k-50k SF',lo:50000,hi:120000}] },
    exhaust:  { l:'Exhaust/Vent Fan',      i:'EX', inc:'Fan unit+labor.',                     exc:'Permit/Grease duct/Fire suppression', v:[{s:'Restroom Fan',lo:300,hi:750},{s:'Inline Fan',lo:650,hi:1500},{s:'Roof Exhauster',lo:2000,hi:5000},{s:'Kitchen Hood',lo:6500,hi:20000},{s:'ERV/HRV',lo:2800,hi:7500}] },
    controls: { l:'Controls/BAS',          i:'BA', inc:'Device+programming+labor.',           exc:'Permit/Network/Third-party fees', v:[{s:'Single Thermostat',lo:350,hi:1100},{s:'Multi-Unit Prog',lo:1000,hi:4000},{s:'BAS Integration',lo:4500,hi:16000},{s:'Full BAS New',lo:13000,hi:45000}] }
  }
};

var ADD = [
  {id:'crane', l:'Crane Rental',           lo:1500,hi:5000, t:'RTU'},
  {id:'curb',  l:'Curb Adapter RTU',       lo:800, hi:2500, t:'RTU'},
  {id:'struct',l:'Structural/Roof Eng',    lo:2000,hi:5000, t:'RTU'},
  {id:'permit',l:'Permits and Inspections',lo:250, hi:2500, t:'ALL'},
  {id:'tab',   l:'TAB/Commissioning',      lo:800, hi:3500, t:'COMM'},
  {id:'elec',  l:'Electrical Upgrade',     lo:1500,hi:6000, t:'ALL'},
  {id:'disp',  l:'Equipment Disposal',     lo:300, hi:800,  t:'ALL'},
  {id:'refr',  l:'Refrigerant Recovery',   lo:200, hi:600,  t:'ALL'},
  {id:'flue',  l:'Flue/Vent Replacement',  lo:400, hi:900,  t:'RES'},
  {id:'dseal', l:'Duct Sealing and Test',  lo:500, hi:2000, t:'OPT'},
  {id:'smart', l:'Smart Controls Add-On',  lo:2000,hi:10000,t:'OPT'},
  {id:'pad',   l:'Concrete Equipment Pad', lo:200, hi:600,  t:'RES'}
];

var RPR = {
  residential: [
    {c:'Diagnostics',        items:[{l:'Service Call',lo:100,hi:250},{l:'Emergency/After-Hours',lo:200,hi:500},{l:'Tune-Up AC',lo:70,hi:200},{l:'Tune-Up Furnace',lo:70,hi:180},{l:'Full Inspection',lo:150,hi:500}]},
    {c:'Electrical+Controls',items:[{l:'Capacitor Replace',lo:150,hi:400},{l:'Contactor Replace',lo:150,hi:350},{l:'Control/Circuit Board',lo:200,hi:900},{l:'Thermostat Replace',lo:200,hi:750},{l:'Transformer',lo:150,hi:350},{l:'Fuses and Breakers',lo:100,hi:250},{l:'Wiring Repair',lo:150,hi:500}]},
    {c:'Refrigerant',        items:[{l:'Recharge R-410A',lo:200,hi:600},{l:'Recharge R-454B',lo:250,hi:700},{l:'Leak Detection',lo:150,hi:450},{l:'Leak Repair Minor',lo:200,hi:600},{l:'Leak Repair Major',lo:500,hi:1800},{l:'TXV/Metering Device',lo:200,hi:600}]},
    {c:'Motors and Fans',    items:[{l:'Condenser Fan Motor',lo:250,hi:600},{l:'Blower Motor PSC',lo:300,hi:600},{l:'Blower Motor ECM',lo:500,hi:1200},{l:'Inducer Motor',lo:400,hi:900},{l:'Fan Blade',lo:150,hi:350}]},
    {c:'Coils and HX',       items:[{l:'Evap Coil Cleaning',lo:100,hi:400},{l:'Condenser Coil Cleaning',lo:100,hi:350},{l:'Evap Coil Replace 2-3T',lo:800,hi:1800},{l:'Evap Coil Replace 4-5T',lo:1100,hi:2400},{l:'HX Inspect/Repair',lo:200,hi:800},{l:'HX Replace',lo:1200,hi:3500}]},
    {c:'Compressor',         items:[{l:'Compressor Retest',lo:300,hi:800},{l:'Compressor Replace 2-3T',lo:1200,hi:2500},{l:'Compressor Replace 4-5T',lo:1800,hi:3500}]},
    {c:'Drainage',           items:[{l:'Condensate Drain Clear',lo:100,hi:300},{l:'Condensate Pan Replace',lo:200,hi:500},{l:'Condensate Pump',lo:150,hi:400},{l:'PVC Drain Repair',lo:150,hi:450}]},
    {c:'Duct and Airflow',   items:[{l:'Duct Sealing/Mastic',lo:300,hi:1500},{l:'Duct Cleaning Full',lo:450,hi:1000},{l:'Duct Repair Section',lo:200,hi:700},{l:'Grille/Register Replace',lo:50,hi:200},{l:'Damper Repair',lo:200,hi:600},{l:'Filter MERV 8-13',lo:20,hi:80},{l:'Filter HEPA/Media',lo:80,hi:250}]},
    {c:'Gas and Combustion', items:[{l:'Ignitor Replace',lo:150,hi:350},{l:'Flame Sensor Clean',lo:100,hi:300},{l:'Gas Valve Replace',lo:300,hi:800},{l:'Burner Clean',lo:100,hi:300},{l:'Pilot Assembly',lo:150,hi:400},{l:'Flue/Vent Repair',lo:200,hi:700}]},
    {c:'Maintenance Plans',  items:[{l:'Annual Contract 1 System',lo:150,hi:350},{l:'Annual Contract 2 Systems',lo:250,hi:500}]}
  ],
  commercial: [
    {c:'Diagnostics+Service',items:[{l:'Commercial Service Call',lo:150,hi:350},{l:'Emergency Commercial',lo:300,hi:800},{l:'Commercial Inspection',lo:300,hi:800},{l:'RTU PM Per Unit',lo:250,hi:600},{l:'PM Contract Single RTU/yr',lo:500,hi:1200},{l:'PM Contract 2-4 RTUs/yr',lo:1500,hi:3500},{l:'PM Contract 5+ Units/yr',lo:3000,hi:8000}]},
    {c:'Electrical+Controls',items:[{l:'Capacitor Commercial',lo:200,hi:600},{l:'Contactor Commercial',lo:200,hi:500},{l:'Control Board RTU',lo:500,hi:2000},{l:'Economizer Repair',lo:400,hi:1800},{l:'Economizer Replace',lo:1500,hi:4500},{l:'BAS/DDC Sensor',lo:300,hi:1200},{l:'Commercial Thermostat',lo:400,hi:1500},{l:'Transformer Commercial',lo:200,hi:600},{l:'Disconnect/Breaker',lo:300,hi:1200},{l:'VFD Replace',lo:800,hi:4000}]},
    {c:'Refrigerant',        items:[{l:'Recharge R-410A Comm',lo:400,hi:1500},{l:'Recharge R-454B Comm',lo:500,hi:1800},{l:'Leak Detection Comm',lo:300,hi:800},{l:'Leak Repair Line Set',lo:400,hi:1200},{l:'TXV/EEV Commercial',lo:400,hi:1200}]},
    {c:'Motors and Fans',    items:[{l:'Condenser Fan Motor RTU',lo:400,hi:1000},{l:'Supply Fan RTU',lo:500,hi:1500},{l:'ECM Motor Commercial',lo:800,hi:2500},{l:'Inducer Fan RTU',lo:500,hi:1200},{l:'Fan Belt',lo:100,hi:350},{l:'Bearings/Lubrication',lo:200,hi:700},{l:'Sheave/Pulley',lo:150,hi:450}]},
    {c:'Coils and HX',       items:[{l:'Evap Coil Cleaning RTU',lo:200,hi:600},{l:'Condenser Coil Cleaning',lo:200,hi:500},{l:'Evap Coil 3-7.5T RTU',lo:1500,hi:4000},{l:'Evap Coil 10-20T RTU',lo:3000,hi:8000},{l:'Condenser Coil Replace',lo:2000,hi:6000},{l:'HX Gas RTU',lo:2000,hi:8000},{l:'Coil Coating',lo:300,hi:1200}]},
    {c:'Compressor',         items:[{l:'Compressor Retest',lo:500,hi:1200},{l:'Compressor 3-7.5T',lo:1800,hi:5000},{l:'Compressor 10-15T',lo:4000,hi:10000},{l:'Compressor 20-25T',lo:8000,hi:20000}]},
    {c:'Drainage',           items:[{l:'Condensate Pan Flush',lo:100,hi:300},{l:'Condensate Line Repair',lo:200,hi:600},{l:'Condensate Pump Comm',lo:200,hi:600},{l:'Drain Pan Replace RTU',lo:400,hi:1200}]},
    {c:'Duct and Airflow',   items:[{l:'Duct Sealing Comm',lo:500,hi:3000},{l:'Commercial Duct Clean',lo:800,hi:3500},{l:'Duct Section Repair',lo:300,hi:1200},{l:'Damper Actuator MOD',lo:300,hi:900},{l:'VAV Box Repair',lo:400,hi:1200},{l:'Diffuser/Grille Per Unit',lo:100,hi:400},{l:'TAB Testing',lo:500,hi:2500}]},
    {c:'Gas and Combustion', items:[{l:'Ignitor RTU',lo:200,hi:500},{l:'Flame Sensor RTU',lo:150,hi:400},{l:'Gas Valve Commercial',lo:400,hi:1200},{l:'Burner Clean RTU',lo:200,hi:500},{l:'Flue/Vent Repair RTU',lo:300,hi:1200},{l:'Gas Pressure Test',lo:200,hi:800}]},
    {c:'Specialty Systems',  items:[{l:'VRF Indoor FCU Repair',lo:400,hi:1500},{l:'VRF Outdoor Repair',lo:800,hi:4000},{l:'Chiller Tube Cleaning',lo:1500,hi:5000},{l:'Cooling Tower Service',lo:800,hi:3000},{l:'Chiller Controls Cal',lo:500,hi:2000},{l:'ERV/HRV Core Service',lo:300,hi:1500},{l:'Kitchen Hood Clean',lo:300,hi:900}]}
  ]
};

// ── HELPERS ───────────────────────────────────────────────────────────
function fa(n) { return n >= 1000 ? '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k' : '$' + n; }
function ff(n) { return '$' + Number(n).toLocaleString(); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

// ── ESTIMATOR ENGINE ──────────────────────────────────────────────────
var E = {
  markup: 30, contingency: 10,
  scope: 'residential', builderTab: 'replace',
  selCat: null, selIdx: null, repairCat: 0,
  selAdders: {}, bidItems: [],

  tots: function () {
    var lo = this.bidItems.reduce(function (s, x) { return s + parseFloat(x.lo || 0); }, 0);
    var hi = this.bidItems.reduce(function (s, x) { return s + parseFloat(x.hi || 0); }, 0);
    var pos = Math.min(1, Math.max(0, (this.markup - 10) / 50 + this.contingency / 100));
    var q = lo + (hi - lo) * pos;
    return { rLo: lo, rHi: hi, quote: Math.round(q), pos: Math.round(pos * 100) };
  },

  open: function () {
    this.bidItems = []; this.selCat = null; this.selIdx = null;
    this.selAdders = {}; this.scope = 'residential'; this.builderTab = 'replace';
    this.repairCat = 0; this.markup = 30; this.contingency = 10;
    this.draw();
  },

  close: function () { var el = document.getElementById('aj-est-overlay'); if (el) el.remove(); },

  addRep: function () {
    var cat = REP[this.scope][this.selCat];
    var v = cat.v[this.selIdx];
    this.bidItems.push({ id: uid(), label: cat.i + ' ' + cat.l + ' ' + v.s, lo: v.lo, hi: v.hi, type: 'replace' });
    this.selIdx = null; this.draw();
  },

  addRI: function (lo, hi, lbl) {
    this.bidItems.push({ id: uid(), label: 'R ' + lbl, lo: lo, hi: hi, type: 'repair' });
    this.draw();
  },

  addAds: function () {
    var self = this;
    ADD.filter(function (a) { return self.selAdders[a.id]; }).forEach(function (a) {
      self.bidItems.push({ id: uid(), label: '+ ' + a.l, lo: a.lo, hi: a.hi, type: 'adder' });
    });
    this.selAdders = {}; this.draw();
  },

  del: function (i) { this.bidItems.splice(i, 1); this.draw(); },
  upd: function (i, f, v) { if (this.bidItems[i]) this.bidItems[i][f] = v; this.drawTots(); },

  drawTots: function () {
    var el = document.getElementById('aj-tw'); if (!el) return;
    var t = this.tots();
    var pct = t.pos, bw = Math.max(2, Math.min(97, pct));
    var lo = ff(t.rLo), hi = ff(t.rHi), q = ff(t.quote);
    el.innerHTML =
      '<div style="border-top:2px solid #1e4272;background:#0a1628;padding:10px 14px">' +
      '<div style="display:grid;grid-template-columns:1fr 110px 110px;gap:8px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #1e4272">' +
      '<div style="font-size:9px;color:#6a8fb0;letter-spacing:1.5px;text-transform:uppercase">Market Range Total</div>' +
      '<div style="text-align:right"><div style="font-size:8px;color:#34d399;letter-spacing:1px;margin-bottom:1px">SUM LOW</div><div style="font-size:18px;font-weight:700;color:#34d399">' + lo + '</div></div>' +
      '<div style="text-align:right"><div style="font-size:8px;color:#f59e0b;letter-spacing:1px;margin-bottom:1px">SUM HIGH</div><div style="font-size:18px;font-weight:700;color:#f59e0b">' + hi + '</div></div>' +
      '</div>' +
      '<div style="font-size:8px;color:#c9a84c;letter-spacing:1px;margin-bottom:6px">Your Quote Position \u2014 ' + pct + '%</div>' +
      '<div style="position:relative;height:10px;background:#1e4272;border-radius:5px;margin-bottom:4px">' +
      '<div style="position:absolute;left:0;width:' + bw + '%;height:100%;background:linear-gradient(90deg,#34d399,#c9a84c);border-radius:5px;transition:width .15s"></div>' +
      '<div style="position:absolute;left:' + bw + '%;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;background:#122340;border:2px solid #c9a84c;border-radius:50%;box-shadow:0 0 6px #c9a84c99"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:8px;color:#6a8fb0;margin-bottom:2px"><span>' + lo + '</span><span>' + hi + '</span></div>' +
      '</div>' +
      '<div style="background:linear-gradient(90deg,#c9a84c22,transparent);border-top:2px solid #c9a84c;padding:12px 14px;display:grid;grid-template-columns:1fr auto;align-items:center">' +
      '<div><div style="font-size:9px;font-weight:700;color:#c9a84c;letter-spacing:1.5px;text-transform:uppercase">Your Quoted Price</div>' +
      '<div style="font-size:8px;color:#6a8fb0;margin-top:2px">Slides between ' + lo + ' \u2013 ' + hi + '</div></div>' +
      '<div style="font-size:28px;font-weight:700;color:#c9a84c">' + q + '</div></div>';
  },

  saveQuote: function () {
    var t = this.tots();
    if (this.bidItems.length === 0) return;
    var li = this.bidItems.map(function (x) { return x.label + ': ' + ff(x.lo) + ' - ' + ff(x.hi); }).join('\n');
    var xn = document.getElementById('aj-fn') ? document.getElementById('aj-fn').value : '';
    var notes = li + (xn ? '\n\n' + xn : '');
    var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var quote = {
      id: uid(),
      quoteNumber: 'QT-' + Date.now().toString().slice(-6),
      customer: g('aj-fc'), address: g('aj-fa'),
      scope: this.scope,
      type: this.bidItems.some(function (x) { return x.type === 'replace'; }) ? 'Replacement' : 'Repair',
      priority: g('aj-fp') || 'Normal',
      status: 'Open',
      technician: g('aj-ft'),
      equipment: g('aj-fe') || (this.bidItems[0] ? this.bidItems[0].label : ''),
      notes: notes,
      bidLow: t.rLo, bidHigh: t.rHi, quote: t.quote,
      markup: this.markup, contingency: this.contingency, pos: t.pos,
      lineItems: JSON.stringify(this.bidItems),
      createdAt: new Date().toISOString(),
      awardedAt: null, status: 'Open', source: 'estimator'
    };
    var ex = JSON.parse(localStorage.getItem('takeoff_quotes') || '[]');
    ex.push(quote);
    localStorage.setItem('takeoff_quotes', JSON.stringify(ex));
    sbPost('takeoff_quotes', quote);
    this.close();
    showToast('Quote saved! (' + quote.quoteNumber + ')', '#4fb3d9');
  },

  draw: function () {
    var S = this;
    var cats = REP[this.scope];
    var rg = RPR[this.scope];
    var cat = this.selCat ? cats[this.selCat] : null;
    var vv = cat ? cat.v : [];
    var tc = { RTU: '#a78bfa', ALL: '#67e8f9', COMM: '#fb923c', RES: '#6ee7b7', OPT: '#fcd34d' };

    var rcH = Object.keys(cats).map(function (k) {
      var c = cats[k];
      var ac = S.selCat === k ? ' active' : '';
      return '<button class="aj-cat-btn' + ac + '" onclick="window.AJEst.selCat=\'' + k + '\';window.AJEst.selIdx=null;window.AJEst.draw()">' + c.i + ' ' + c.l + '</button>';
    }).join('');

    var rpH = rg.map(function (g, i) {
      var ac = S.repairCat === i ? ' active' : '';
      return '<button class="aj-cat-btn' + ac + '" onclick="window.AJEst.repairCat=' + i + ';window.AJEst.draw()">' + g.c + '</button>';
    }).join('');

    var vH = vv.map(function (v, i) {
      var ac = S.selIdx === i ? ' sel' : '';
      return '<button class="aj-var' + ac + '" onclick="window.AJEst.selIdx=' + i + ';window.AJEst.draw()"><div class="aj-vsz">' + v.s + '</div><div class="aj-pr"><div class="aj-lo"><div class="aj-ll">LOW</div><div class="aj-la">' + fa(v.lo) + '</div></div><div class="aj-hi"><div class="aj-ll">HIGH</div><div class="aj-la">' + fa(v.hi) + '</div></div></div></button>';
    }).join('');

    var riH = (rg[this.repairCat] ? rg[this.repairCat].items : []).map(function (x) {
      var lbl = x.l.replace(/'/g, '');
      return '<div class="aj-rr"><div style="font-size:10px;color:#e8f0f8;font-weight:600">' + x.l + '</div>' +
        '<div style="background:#34d39918;border-radius:4px;padding:2px 6px;text-align:center"><div style="font-size:7px;color:#34d399">LOW</div><div style="font-size:10px;font-weight:700;color:#34d399">' + fa(x.lo) + '</div></div>' +
        '<div style="background:#f59e0b18;border-radius:4px;padding:2px 6px;text-align:center"><div style="font-size:7px;color:#f59e0b">HIGH</div><div style="font-size:10px;font-weight:700;color:#f59e0b">' + fa(x.hi) + '</div></div>' +
        '<button class="aj-ra" onclick="window.AJEst.addRI(' + x.lo + ',' + x.hi + ',\'' + lbl + '\')">+</button></div>';
    }).join('');

    var adH = ADD.map(function (a) {
      var c = tc[a.t] || '#fcd34d';
      return '<div class="aj-ai"><input type="checkbox"' + (S.selAdders[a.id] ? ' checked' : '') + ' onchange="window.AJEst.selAdders[\'' + a.id + '\']=this.checked">' +
        '<div style="flex:1"><div style="display:flex;align-items:center;gap:5px">' +
        '<span style="font-size:9px;color:#e8f0f8;font-weight:600">' + a.l + '</span>' +
        '<span style="font-size:7px;padding:1px 5px;border-radius:3px;background:' + c + '22;color:' + c + '">' + a.t + '</span></div>' +
        '<div style="font-size:8px;color:#6a8fb0">' + fa(a.lo) + '-' + fa(a.hi) + '</div></div></div>';
    }).join('');

    var bH = this.bidItems.map(function (x, i) {
      var bc = x.type === 'repair' ? 'aj-tp' : x.type === 'adder' ? 'aj-ta' : 'aj-tr';
      var sl = x.label.replace(/[<>&"]/g, '');
      return '<div class="aj-er"><div><input type="text" value="' + sl + '" oninput="window.AJEst.upd(' + i + ',\'label\',this.value)"><span class="aj-tb ' + bc + '">' + x.type + '</span></div>' +
        '<div style="text-align:right"><input class="aj-li" value="' + x.lo + '" oninput="window.AJEst.upd(' + i + ',\'lo\',+this.value||0)"></div>' +
        '<div style="text-align:right"><input class="aj-hi2" value="' + x.hi + '" oninput="window.AJEst.upd(' + i + ',\'hi\',+this.value||0)"></div>' +
        '<button class="aj-db" onclick="window.AJEst.del(' + i + ')">X</button></div>';
    }).join('');

    var sbH = this.selIdx !== null && cat
      ? '<div class="aj-sbar"><div><div style="font-size:9px;color:#c9a84c">SELECTED - EQUIP + LABOR ONLY</div>' +
        '<div style="font-size:12px;font-weight:700;color:#e8f0f8">' + cat.l + ' ' + vv[this.selIdx].s + '</div>' +
        '<div style="font-size:10px;color:#6a8fb0">' + ff(vv[this.selIdx].lo) + ' - ' + ff(vv[this.selIdx].hi) + '</div></div>' +
        '<button class="aj-sadd" onclick="window.AJEst.addRep()">+ ADD</button></div>' : '';
    
    var hasBid = this.bidItems.length > 0;
    var mkH = hasBid ? '<div class="aj-mb"><div class="aj-sg"><label>Markup <span id="aj-mkv">' + this.markup + '%</span></label><input type="range" min="10" max="60" value="' + this.markup + '" oninput="window.AJEst.markup=+this.value;document.getElementById(\'aj-mkv\').textContent=this.value+\'%\';window.AJEst.drawTots()"></div><div class="aj-sg"><label>Contingency <span id="aj-ctv" style="color:#4fb3d9">' + this.contingency + '%</span></label><input type="range" min="0" max="25" value="' + this.contingency + '" oninput="window.AJEst.contingency=+this.value;document.getElementById(\'aj-ctv\').textContent=this.value+\'%\';window.AJEst.drawTots()" style="accent-color:#4fb3d9"></div></div>' : '';
    var tfH = hasBid ? '<div class="aj-tf"><div class="aj-tfl">Quote Details</div><div class="aj-fd"><label>Customer</label><input id="aj-fc" placeholder="Customer name"></div><div class="aj-fd"><label>Address</label><input id="aj-fa" placeholder="Site address"></div><div class="aj-fd"><label>Priority</label><select id="aj-fp"><option>Normal</option><option>High</option><option>Emergency</option></select></div><div class="aj-fd"><label>Technician</label><input id="aj-ft" placeholder="Tech name"></div><div class="aj-fd full"><label>Equipment / Description</label><input id="aj-fe" placeholder="Units serviced, scope"></div><div class="aj-fd full"><label>Notes</label><textarea id="aj-fn" placeholder="Conditions, exclusions, site notes..."></textarea></div></div>' : '';
    var repS = this.builderTab === 'replace' ? '<div class="aj-grid"><div><div class="aj-slbl">System Type</div><div class="aj-cat-list">' + rcH + '</div><div class="aj-slbl">Adders</div><div class="aj-warn">Not included in base prices above</div>' + adH + '<button class="aj-aab" onclick="window.AJEst.addAds()">+ ADD SELECTED</button></div><div>' + (cat ? '<div class="aj-ibox"><div style="font-size:12px;font-weight:700;color:#4fb3d9;margin-bottom:6px">' + cat.l + '</div><div class="aj-ie"><div class="aj-inc"><div class="aj-el">INCLUDES</div><p>' + cat.inc + '</p></div><div class="aj-exc"><div class="aj-el">EVCLUDES</div><p>' + cat.exc + '</p></div></div></div><div class="aj-variants">' + vH + '</div>' + sbH : '<div class="aj-ph"><div style="font-size:30px">&#x1F448;</div><div>Select a system type</div></div>') + '</div></div>' : '<div class="aj-grid"><div><div class="aj-slbl">Category</div><div class="aj-cat-list">' + rpH + '</div></div><div><div class="aj-slbl">' + (rg[this.repairCat] ? rg[this.repairCat].c : '') + ' - click + to add</div>' + riH + '</div></div>';
    var bidS = hasBid ? '<div style="margin-top:14px"><div class="aj-slbl">Estimate Line Items</div>' + mkH + '<div class="aj-etbl"><div class="aj-eh"><div>Line Item</div><div>Low</div><div>High</div><div></div></div>' + bH + '<div id="aj-tw"></div></div></div>' + tfH : '';
    var sc='<div class="aj-scope-row"><button class="aj-pill'+(this.scope==='residential'?' active':'')+'" onclick="window.AJEst.scope=\'residential\';window.AJEst.selCat=null;window.AJEst.selIdx=null;window.AJEst.repairCat=0;window.AJEst.draw()">Residential</button><button class="aj-pill'+(this.scope==='commercial'?' active':'')+'" onclick="window.AJEst.scope=\'commercial\';window.AJEst.selCat=null;window.AJEst.selIdx=null;window.AJEst.repairCat=0;window.AJEst.draw()">Commercial</button><div class="aj-divider"></div><button class="aj-pill blue'+(this.builderTab==='replace'?' active':'')+'" onclick="window.AJEst.builderTab=\'replace\';window.AJEst.selCat=null;window.AJEst.selIdx=null;window.AJEst.draw()">Replacement</button><button class="aj-pill blue'+(this.builderTab==='repair'?' active':'')+'" onclick="window.AJEst.builderTab=\'repair\';window.AJEst.selCat=null;window.AJEst.selIdx=null;window.AJEst.draw()">Repair/Service</button></div>';
    var html='<div id="aj-est-overlay" onclick="if(event.target===this)window.AJEst.close()"><div id="aj-est-modal"><div class="aj-est-hdr"><h2>BUILD QUOTE</h2><button onclick="window.AJEst.close()" style="background:none;border:none;color:#6a8fb0;font-size:20px;cursor:pointer">&times;</button></div><div class="aj-est-body">'+sc+repS+bidS+'</div><div class="aj-footer"><button class="aj-cn" onclick="window.AJEst.close()">Cancel</button>'+hasBid?'<button class="aj-sv" onclick="window.AJEst.saveQuote()">Save Quote</button>':''+'</div></div></div>';
    var ex=document.getElementById('aj-est-overlay');if(ex)ez.remove();
    document.body.insertAdjacentHTML('beforeend',html);
    this.drawTots();
  }
};

window.AJEst=E;
window.AJEst=E;

function renderQuotesPage(){var inner=document.getElementById('aj-qinner');if(!inner)return;var quotes=JSON.parse(localStorage.getItem('takeoff_quotes')||'[]').slice().reverse();if(!quotes.length){inner.innerHTML='<div style="text-align:center;padding:80px 20px;color:#6a8fb0"><div style="font-size:40px;margin-bottom:16px">&#x1F4CB;</div><div style="font-size:15px;font-weight:600;color:#e8f0f8;margin-bottom:8px">No quotes yet</div><div style="font-size:12px">Go to <b style="color:#c9a84c">Service &rarr; Service Tickets</b> and click <b style="color:#c9a84c">Est. Quote</b></div></div>';return}inner.innerHTML=quotes.map(function(q){var awarded=q.status==='Awarded';var sc=awarded?'#c9a84c':'#4fb3d9';var dt=q.createdAt?new Date(q.createdAt).toLocaleDateString():'';var lo=ff(q.bidLow||0);var hi=ff(q.bidHigh||0);var qp=q.quote?ff(q.quote):'';return '<div style="background:#152a45;border:1px solid #1e4272;border-radius:10px;padding:16px;margin-bottom:12px"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px"><div><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:12px;font-weight:700;color:#c9a84c;letter-spacing:1px">'+(q.quoteNumber||'QT-???')+'</span><span style="font-size:9px;padding:2px 8px;border-radius:10px;background:'+sc+'22;color:'+sc+';font-weight:700">'+(q.status||'Open').toUpperCase()+'</span></div><div style="font-size:14px;font-weight:600;color:#e8f0f8">'+(q.customer||'(no customer)')+'</div>'+(q.address?'<div style="font-size:11px;color:#6a8fb0;margin-top:2px">'+q.address+'</div>':'')+'</div><div style="text-align:right;font-size:10px;color:#6a8fb0;white-space:nowrap">'+(q.type||'')+(q.type&&dt?'<br>':'')+st+'</div></div><div style="display:flex;align-items:center;gap:16px;padding:10px 14px;background:#0f2035;border-radius:7px;margin-bottom:10px"><div><div style="font-size:8px;color:#34d399;letter-spacing:1px;margin-bottom:2px">MARKET LOW</div><div style="font-size:18px;font-weight:700;color:#34d399">'+lo+'</div></div><div style="color:#1e4272;font-size:14px">\u2500</div><div><div style="font-size:8px;color:#f59e0b;letter-spacing:1px;margin-bottom:2px">MARKET HIGH</div><div style="font-size:18px;font-weight:700;color:#f59e0b">'+hi+'</div></div>'+(qp?'<div style="margin-left:auto;text-align:right"><div style="font-size:8px;color:#c9a84c;letter-spacing:1px;margin-bottom:2px">QUOTED PRICE</div><div style="font-size:22px;font-weight:700;color:#c9a84c">'+qp+'</div></div>':'')+'</div>' +(q.notes&&q.notes.trim()?'<div style="font-size:10px;color:#6a8fb0;white-space:pre-wrap;max-height:50px;overflow:hidden;margin-bottom:10px;line-height:1.5">'+q.notes.slice(0,200)+'</div>' :'')+(!awarded?'<div style="display:flex;gap:8px"><button onclick="window._ajAwardQuote(\''+q.id+'\')" style="padding:7px 18px;border-radius:6px;background:#c9a84c;border:none;color:#0a1628;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer">Award \u2192 Service Ticket</button><button onclick="window._ajDeleteQuote(\''+q.id+'\')" style="padding:7px 12px;border-radius:6px;background:transparent;border:1px solid #ef444455;color:#ef4444;font-family:inherit;font-size:11px;cursor:pointer">Delete</button></div>':'<div style="font-size:10px;color:#c9a84c;font-weight:700">\u2713 Awarded '+(q.awardedAt?new Date(q.awardedAt).toLocaleDateString():'')+'</div>')+'</div>';}).join('');}
function showQuotesOverlay(){var ov=document.getElementById('aj-quotes-ov');if(ov){ov.style.display='flex';renderQuotesPage();return;}ov=document.createElement('div');ov.id='aj-quotes-ov';ov.style.cssText='position:fixed;inset:0;z-index:9999;background:#0a1628;display:flex;flex-direction:column;font-family:IBM Plex Mono,monospace';ov.innerHTML='<div style="background:#122340;border-bottom:2px solid #c9a84c;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0"><div style="display:flex;align-items:center;gap:14px"><div style="width:36px;height:36px;background:#c9a84c22;border:1.5px solid #c9a84c;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px">&#x1F4CB;</div><div><div style="font-size:15px;font-weight:700;color:#c9a84c;letter-spacing:1px">QUOTES</div><div style="font-size:10px;color:#6a8fb0">Estimate &rarr; Build &rarr; Award to Service Ticket</div></div></div><div style="display:flex;gap:10px;align-items:center"><button onclick="window.AJEst.open()" style="padding:8px 18px;border-radius:6px;border:1.5px solid #c9a84c;background:#c9a84c18;color:#c9a84c;font-family:inherit;font-weight:700;font-size:11px;cursor:pointer">+ New Quote</button><button onclick="document.getElementById(\'aj-quotes-ov\').style.display=\'none\'" style="padding:8px 14px;border-radius:6px;border:1.5px solid #1e4272;background:transparent;color:#6a8fb0;font-family:inherit;font-size:11px;cursor:pointer">&larr; Back</button></div></div><div style="flex:1;overflow-y:auto;padding:20px"><div style="max-width:960px;margin:0 auto"><div id="aj-qinner"></div></div></div>';document.body.appendChild(ov);renderQuotesPage();}
window._ajAwardQuote=function(qid){var quotes=JSON.parse(localStorage.getItem('takeoff_quotes')||'[]');var q=quotes.find(function(x){return x.id===qid;});if(!q)return;var now=new Date().toISOString();var ticket={id:Date.now(),customer:q.customer,address:q.address,type:q.type,priority:q.priority||'Normal',status:'Open',scheduledDate:'',completedDate:'',technician:q.technician,equipment:q.equipment||(q.notes||'').slice(0,60),laborHours:0,materialCost:q.bidLow,invoiceAmount:q.quote||q.bidLow,invoiceDate:'',notes:'AWARDEEF FROM QUOTE '+q.quoteNumber+'\n\n'+(q.notes||''),estimateLow:q.bidLow,estimateHigh:q.bidHigh,quotePrice:q.quote,markup:q.markup,contingency:q.contingency,lineItems:q.lineItems,createdAt:now,source:'quote-'+q.quoteNumber};var tix=JSON.parse(localStorage.getItem('takeoff_service_tickets')||'[]');tix.push(ticket);localStorage.setItem('takeoff_service_tickets',JSON.stringify(tix));sbPost('takeoff_service_tickets',ticket);var updated=quotes.map(function(x){return x.id===qid?Object.assign({},x,{status:'Awarded',awardedAt:now}):x;});localStorage.setItem('takeoff_quotes',JSON.stringify(updated));sbPost('takeoff_quotes',Object.assign({},q,{status:'Awarded',awardedAt:now}));window.dispatchEvent(new CustomEvent('aj-ticket-saved',{detail:ticket}));renderQuotesPage();showToast('\u2713 Quote awarded! Service ticket created.','#c9a84c');};
window._ajDeleteQuote=function(qid){if(!confirm('Delete this quote?'))return;if(!qid)return;var quotes=JSON.parse(localStorage.getItem('takeoff_quotes')||'[]');localStorage.setItem('takeoff_quotes',JSON.stringify(quotes.filter(function(x){return x.id!==qid;})));sbDel('takeoff_quotes',qid);renderQuotesPage();};
function showToast(msg,bg){var t=document.createElement('div');t.className='aj-toast';t.style.background=bl||'#10b981';t.style.color=bg==='#c9a84c'?'#0a1628':'#fff';t.textContent=msg;document.body.appendChild(t);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},4000);}
var _injBusy=false;
function injectUI(){var svcBtn=[].slice.call(document.querySelectorAll('button')).find(function(b){return b.textContent.trim()==='+ Service Ticket';});if(svcBtn&&!document.getElementById('aj-est-trigger')){var n=document.createElement('button');n.id='aj-est-trigger';n.className='aj-est-btn';n.textContent='Est. Quote';n.onclick=function(){window.AJEst.open();};svcBtn.parentNode.insertBefore(n,svcBtn);}if(!document.getElementById('aj-quotes-nav')){var popsBtn=[].slice.call(document.querySelectorAll('button')).find(function(b){return b.textContent.includes('Pops')||b.textContent.includes('Takeoff');});if(popsBtn&&popsBtn.parentNode){var qBtn=document.createElement('button');qBtn.id='aj-quotes-nav';qBtn.className=popsBtn.className;qBtn.style.cssText=popsBtn.style.cssText;qBtn.innerHTML='&#x1F4CB; Quotes';qBtn.style.borderColor='#c9a84c';qBtn.style.color='#c9a84c';qBtn.onclick=function(e){e.stopPropagation();showQuotesOverlay();};popsBtn.parentNode.appendChild(qBtn);}}}
injectUI();
var _obs=new MutationObserver(function(muts){if(_injBusy)return;if(!muts.some(function(m){return[].slice.call(m.addedNodes).some(function(n){if(n.nodeType!==1)return false;var ov=document.getElementById('aj-quotes-ov');return !ov||!ov.contains(n);});}))return;_injBusy=true;setTimeout(function(){injectUI();_injBusy=false;},200);});_obs.observe(document.body,{childList:true,subtree:true});

})();
