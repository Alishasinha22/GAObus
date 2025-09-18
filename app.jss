// GAObus frontend prototype (vanilla JS + localStorage)
// Save as app.js and keep next to index.html and styles.css

// --- Utilities & initial data
const STORAGE = {
  USERS: 'gaobus_users',
  BUSES: 'gaobus_buses',
  REPORTS: 'gaobus_reports',
  SESSION: 'gaobus_session'
};

function read(key){ return JSON.parse(localStorage.getItem(key) || '[]') }
function write(key, val){ localStorage.setItem(key, JSON.stringify(val)) }
function saveSession(obj){ localStorage.setItem(STORAGE.SESSION, JSON.stringify(obj)) }
function readSession(){ return JSON.parse(localStorage.getItem(STORAGE.SESSION) || 'null') }
function clearSession(){ localStorage.removeItem(STORAGE.SESSION) }

// initial sample stops and buses (only if no buses stored)
const SAMPLE_STOPS = ['Central', 'Avenue', 'Market', 'University', 'Station', 'Airport'];

function ensureSampleData(){
  if(read(STORAGE.BUSES).length === 0){
    const buses = [
      {
        id: 'GA-100',
        driver: 'Ramesh',
        route: ['Central','Avenue','Market','University'],
        fare: 25,
        occupancy: 'green',
        nextArrivalMin: 8,
        status: 'on-time', // 'on-time' | 'delayed'
        updatedBy: 'conductor'
      },
      {
        id: 'GA-200',
        driver: 'Sita',
        route: ['Station','Market','Avenue','Airport'],
        fare: 40,
        occupancy: 'orange',
        nextArrivalMin: 18,
        status: 'delayed'
      },
      {
        id: 'GA-300',
        driver: 'Amit',
        route: ['Central','Station','Airport'],
        fare: 45,
        occupancy: 'green',
        nextArrivalMin: 4,
        status: 'on-time'
      }
    ];
    write(STORAGE.BUSES, buses);
  }
  if(read(STORAGE.USERS).length === 0){
    write(STORAGE.USERS, []);
  }
  if(read(STORAGE.REPORTS).length === 0){
    write(STORAGE.REPORTS, []);
  }
}

ensureSampleData();

// --- Element refs
const roleSelect = document.getElementById('role-select');
const registerSection = document.getElementById('register');
const registerTitle = document.getElementById('register-title');
const registerForm = document.getElementById('register-form');
const registerCancel = document.getElementById('register-cancel');

const commuterFields = document.getElementById('commuter-fields');
const conductorFields = document.getElementById('conductor-fields');
const municipalFields = document.getElementById('municipal-fields');

const commuterDashboard = document.getElementById('commuter-dashboard');
const conductorDashboard = document.getElementById('conductor-dashboard');
const municipalDashboard = document.getElementById('municipal-dashboard');

const commuterWelcome = document.getElementById('commuter-welcome');
const conductorWelcome = document.getElementById('conductor-welcome');
const municipalWelcome = document.getElementById('municipal-welcome');

const originSelect = document.getElementById('origin-select');
const destinationSelect = document.getElementById('destination-select');
const searchBusesBtn = document.getElementById('search-buses');
const busesList = document.getElementById('buses-list');
const selectedBusInfo = document.getElementById('selected-bus-info');

const reportForm = document.getElementById('report-form');
const reportType = document.getElementById('report-type');
const reportMessage = document.getElementById('report-message');

const busRegisterForm = document.getElementById('bus-register-form');
const busNumberInput = document.getElementById('bus-number');
const busRouteInput = document.getElementById('bus-route');
const busFareInput = document.getElementById('bus-fare');

const conductorStopSelect = document.getElementById('conductor-stop-select');
const occupancySelect = document.getElementById('occupancy-select');
const arrivalStatusSelect = document.getElementById('arrival-status-select');
const etaMinutesInput = document.getElementById('eta-minutes');
const updateBusStatusBtn = document.getElementById('update-bus-status');
const conductorBusInfo = document.getElementById('conductor-bus-info');

const statTotalBuses = document.getElementById('stat-total-buses');
const statOnTime = document.getElementById('stat-on-time');
const statDelayed = document.getElementById('stat-delayed');
const statComplaints = document.getElementById('stat-complaints');
const complaintsList = document.getElementById('complaints-list');

const registerButtons = document.querySelectorAll('.role-btn');
const registerSubmitBtn = document.getElementById('register-submit');
const commuterLogout = document.getElementById('commuter-logout');
const conductorLogout = document.getElementById('conductor-logout');
const municipalLogout = document.getElementById('municipal-logout');

// track selected role in the register form
let selectedRole = null;
let currentSession = readSession();

// --- Role selection
registerButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    selectedRole = btn.dataset.role;
    showRegisterForRole(selectedRole);
  });
});

function showRegisterForRole(role){
  registerSection.classList.remove('hidden');
  roleSelect.classList.add('hidden');
  // show appropriate fields
  commuterFields.classList.toggle('hidden', role!=='commuter');
  conductorFields.classList.toggle('hidden', role!=='conductor');
  municipalFields.classList.toggle('hidden', role!=='municipal');
  registerTitle.textContent = `Register / Login as ${capitalize(role)}`;
}

// Cancel registration
registerCancel.addEventListener('click', ()=>{
  registerSection.classList.add('hidden');
  roleSelect.classList.remove('hidden');
  selectedRole = null;
});

// On register form submit -> create user or sign in
registerForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const users = read(STORAGE.USERS);
  if(selectedRole === 'commuter'){
    const phone = document.getElementById('commuter-phone').value.trim();
    const name = document.getElementById('commuter-name').value.trim();
    if(!phone){ alert('Enter phone'); return; }
    // if exists, login; else register
    let user = users.find(u => u.role==='commuter' && u.phone===phone);
    if(!user){
      user = { id: 'c-'+Date.now(), role:'commuter', phone, name };
      users.push(user);
      write(STORAGE.USERS, users);
    }
    saveSession({role:'commuter', id:user.id, phone});
    afterLogin();
  } else if(selectedRole === 'conductor'){
    const name = document.getElementById('conductor-name').value.trim();
    const busno = document.getElementById('conductor-busno').value.trim();
    if(!name || !busno){ alert('Enter conductor name and bus number'); return; }
    let user = users.find(u => u.role==='conductor' && u.busno===busno);
    if(!user){
      user = { id: 'd-'+Date.now(), role:'conductor', name, busno };
      users.push(user);
      write(STORAGE.USERS, users);
    }
    saveSession({role:'conductor', id:user.id, name, busno});
    afterLogin();
  } else if(selectedRole === 'municipal'){
    const emp = document.getElementById('municipal-id').value.trim();
    const name = document.getElementById('municipal-name').value.trim();
    if(!emp){ alert('Enter employee id'); return; }
    let user = users.find(u => u.role==='municipal' && u.emp===emp);
    if(!user){
      user = { id: 'm-'+Date.now(), role:'municipal', emp, name };
      users.push(user);
      write(STORAGE.USERS, users);
    }
    saveSession({role:'municipal', id:user.id, emp, name});
    afterLogin();
  }
});

// after login: show relevant dashboard
function afterLogin(){
  currentSession = readSession();
  registerSection.classList.add('hidden');
  roleSelect.classList.add('hidden');
  if(!currentSession) return;
  if(currentSession.role==='commuter'){
    showCommuter();
  } else if(currentSession.role==='conductor'){
    showConductor();
  } else if(currentSession.role==='municipal'){
    showMunicipal();
  }
}

// Logout handlers
commuterLogout.addEventListener('click', ()=>{ clearSession(); location.reload();});
conductorLogout.addEventListener('click', ()=>{ clearSession(); location.reload();});
municipalLogout.addEventListener('click', ()=>{ clearSession(); location.reload();});

// capitalize
function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1) }

// --- Commuter UI
function populateStops(){
  // gather distinct stops from sample stops + buses
  const buses = read(STORAGE.BUSES);
  const stops = new Set(SAMPLE_STOPS);
  buses.forEach(b=> b.route.forEach(r=> stops.add(r)));
  originSelect.innerHTML = '';
  destinationSelect.innerHTML = '';
  stops.forEach(s=>{
    const o = document.createElement('option'); o.value = s; o.textContent = s;
    const d = o.cloneNode(true);
    originSelect.appendChild(o);
    destinationSelect.appendChild(d);
  });
  // make default origin/destination different if possible
  if(originSelect.options.length>1){
    destinationSelect.selectedIndex = 1;
  }
}

function showCommuter(){
  commuterDashboard.classList.remove('hidden');
  commuterWelcome.textContent = `Signed in as ${currentSession.phone || 'Commuter'}`;
  populateStops();
  busesList.innerHTML = '';
  selectedBusInfo.textContent = 'No bus selected.';
}

// search buses matching origin->destination order
searchBusesBtn.addEventListener('click', ()=>{
  const origin = originSelect.value;
  const destination = destinationSelect.value;
  if(origin === destination){ alert('Choose different origin and destination'); return; }
  const buses = read(STORAGE.BUSES);
  const matches = buses.filter(b=>{
    const ri = b.route.indexOf(origin);
    const rj = b.route.indexOf(destination);
    return ri !== -1 && rj !== -1 && ri < rj;
  });
  renderBusesList(matches, origin, destination);
});

function renderBusesList(list, origin, destination){
  busesList.innerHTML = '';
  if(list.length === 0){
    busesList.textContent = 'No buses found for this route.';
    return;
  }
  list.forEach(bus=>{
    const item = document.createElement('div');
    item.className = 'bus-item';
    const left = document.createElement('div'); left.className = 'bus-left';
    left.innerHTML = `<strong>${bus.id}</strong> — ${bus.route[0]} → ${bus.route[bus.route.length-1]}<div style="font-size:13px;color:var(--muted)">Driver: ${bus.driver || '-'}</div>`;
    const meta = document.createElement('div'); meta.className = 'bus-meta';
    const occ = document.createElement('span'); occ.className = 'occ ' + (bus.occupancy || 'green');
    const fare = document.createElement('div'); fare.textContent = `₹ ${bus.fare}`;
    const status = document.createElement('div'); status.textContent = bus.status === 'delayed' ? 'Delayed' : 'On time';
    status.style.fontSize = '13px';
    const btn = document.createElement('button'); btn.textContent = 'Select';
    btn.addEventListener('click', ()=> selectBusForCommuter(bus.id));
    meta.appendChild(occ); meta.appendChild(fare); meta.appendChild(status); meta.appendChild(btn);
    item.appendChild(left);
    item.appendChild(meta);
    busesList.appendChild(item);
  });
}

// select bus -> show route and ETA
function selectBusForCommuter(busId){
  const buses = read(STORAGE.BUSES);
  const bus = buses.find(b => b.id === busId);
  if(!bus) return;
  let html = `<strong>${bus.id}</strong> — Route: ${bus.route.join(' → ')}<br/>Fare: ₹ ${bus.fare}<br/>Occupancy: <span class="occ ${bus.occupancy}"></span> ${bus.occupancy || 'green'}<br/>Status: ${bus.status === 'delayed' ? '<span style="color:var(--danger)">Delayed</span>' : '<span style="color:var(--success)">On time</span>'}<br/>`;
  html += `Estimated arrival: ${bus.nextArrivalMin} min`;
  selectedBusInfo.innerHTML = html;
}

// report submit
reportForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const reports = read(STORAGE.REPORTS);
  const type = reportType.value;
  const msg = reportMessage.value.trim();
  if(!msg){ alert('Describe the issue'); return; }
  const newR = {
    id: 'r-'+Date.now(),
    role: 'commuter',
    from: currentSession.phone || 'unknown',
    type, msg, createdAt: new Date().toISOString()
  };
  reports.unshift(newR);
  write(STORAGE.REPORTS, reports);
  alert('Report sent. Municipal authorities will see it in their dashboard.');
  reportMessage.value = '';
  // update municipal stats if on screen
  updateMunicipalStats();
});

// --- Conductor UI
function showConductor(){
  conductorDashboard.classList.remove('hidden');
  conductorWelcome.textContent = `Signed in as ${currentSession.name || currentSession.busno || 'Conductor'}`;
  populateConductorBusOptions();
  renderConductorBusInfo();
}

// register/update bus by conductor
busRegisterForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const buses = read(STORAGE.BUSES);
  const id = busNumberInput.value.trim();
  const routeCsv = busRouteInput.value.split(',').map(s=>s.trim()).filter(Boolean);
  const fare = parseFloat(busFareInput.value) || 0;
  if(!id || routeCsv.length < 2){ alert('Enter bus number and at least 2 stops'); return; }
  // find existing or add
  let bus = buses.find(b=> b.id === id);
  if(!bus){
    bus = { id, driver: currentSession.name || 'Conductor', route: routeCsv, fare, occupancy:'green', nextArrivalMin: 10, status:'on-time' };
    buses.push(bus);
  } else {
    bus.route = routeCsv;
    bus.fare = fare;
    bus.driver = currentSession.name || bus.driver;
  }
  write(STORAGE.BUSES, buses);
  alert('Bus saved.');
  populateConductorBusOptions();
  updateMunicipalStats();
});

// populate conductor stop select based on bus
function populateConductorBusOptions(){
  const buses = read(STORAGE.BUSES);
  const busNo = currentSession.busno || busNumberInput.value || (buses[0] && buses[0].id);
  // if busno present in session, prefill form and show that bus
  if(currentSession.busno){
    const bus = buses.find(b=> b.id === currentSession.busno);
    if(bus){
      busNumberInput.value = bus.id;
      busRouteInput.value = bus.route.join(', ');
      busFareInput.value = bus.fare;
      // populate stops
      conductorStopSelect.innerHTML = '';
      bus.route.forEach(s=>{
        const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
        conductorStopSelect.appendChild(opt);
      });
    }
  } else {
    // otherwise, list first bus if any
    if(buses.length){
      const bus = buses[0];
      busNumberInput.value = bus.id;
      busRouteInput.value = bus.route.join(', ');
      busFareInput.value = bus.fare;
      conductorStopSelect.innerHTML = '';
      bus.route.forEach(s=>{
        const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
        conductorStopSelect.appendChild(opt);
      });
    }
  }
}

// update occupancy / arrival info
updateBusStatusBtn.addEventListener('click', ()=>{
  const buses = read(STORAGE.BUSES);
  const id = busNumberInput.value.trim();
  const bus = buses.find(b => b.id === id);
  if(!bus){ alert('No such bus registered. Save bus first.'); return; }
  bus.occupancy = occupancySelect.value;
  bus.status = arrivalStatusSelect.value === 'delayed' ? 'delayed' : 'on-time';
  const eta = parseInt(etaMinutesInput.value) || 5;
  bus.nextArrivalMin = eta;
  write(STORAGE.BUSES, buses);
  alert('Bus status updated.');
  renderConductorBusInfo();
  updateMunicipalStats();
});

// show current bus info
function renderConductorBusInfo(){
  const id = busNumberInput.value.trim();
  const buses = read(STORAGE.BUSES);
  const bus = buses.find(b => b.id === id);
  if(!bus){
    conductorBusInfo.textContent = 'No bus selected or registered yet.';
    return;
  }
  conductorBusInfo.innerHTML = `<strong>${bus.id}</strong> – Route: ${bus.route.join(' → ')}<br/>
    Fare: ₹ ${bus.fare}<br/>
    Occupancy: <span class="occ ${bus.occupancy}"></span> ${bus.occupancy}<br/>
    Status: ${bus.status}<br/>
    ETA: ${bus.nextArrivalMin} min`;
  // populate stops select
  conductorStopSelect.innerHTML = '';
  bus.route.forEach(s=>{
    const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
    conductorStopSelect.appendChild(opt);
  });
}

// --- Municipal UI
function showMunicipal(){
  municipalDashboard.classList.remove('hidden');
  municipalWelcome.textContent = `Signed in as ${currentSession.name || currentSession.emp || 'Municipal'}`;
  updateMunicipalStats();
  renderComplaintsList();
}

// compute and update municipal stats
function updateMunicipalStats(){
  const buses = read(STORAGE.BUSES);
  const reports = read(STORAGE.REPORTS);
  statTotalBuses.textContent = buses.length;
  const onTime = buses.filter(b=> b.status === 'on-time').length;
  const delayed = buses.filter(b=> b.status === 'delayed').length;
  statOnTime.textContent = onTime;
  statDelayed.textContent = delayed;
  statComplaints.textContent = reports.length;
}

// complaints list
function renderComplaintsList(){
  const reports = read(STORAGE.REPORTS);
  complaintsList.innerHTML = '';
  if(reports.length === 0){
    complaintsList.textContent = 'No complaints yet.';
    return;
  }
  reports.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'bus-item';
    const left = document.createElement('div'); left.className = 'bus-left';
    left.innerHTML = `<strong>${r.type}</strong> — ${r.msg || r.message || ''}<div style="font-size:13px;color:var(--muted)">From: ${r.from || 'commuter'} • ${new Date(r.createdAt).toLocaleString()}</div>`;
    const meta = document.createElement('div');
    const btn = document.createElement('button'); btn.textContent = 'Mark resolved';
    btn.addEventListener('click', ()=>{
      // remove report
      const all = read(STORAGE.REPORTS);
      const next = all.filter(rr=> rr.id !== r.id);
      write(STORAGE.REPORTS, next);
      renderComplaintsList();
      updateMunicipalStats();
    });
    meta.appendChild(btn);
    div.appendChild(left); div.appendChild(meta);
    complaintsList.appendChild(div);
  });
}

// --- On load: check session
document.addEventListener('DOMContentLoaded', ()=>{
  if(currentSession){
    afterLogin();
  } else {
    // nothing; show role selection
  }
});
