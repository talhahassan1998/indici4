/* Kora Health — sample data (New Zealand specialist practice)
   All people, NHIs, claim numbers and invoices are fictional. */
(function () {
  const TODAY = new Date(2026, 8, 17); // Thu 17 Sep 2026

  const clinics = [
    { id: 'c1', name: 'Kora Specialists — Newmarket', short: 'Newmarket', addr: '212 Broadway, Newmarket, Auckland 1023', phone: '09 523 8840' },
    { id: 'c2', name: 'Kora Specialists — Takapuna',  short: 'Takapuna',  addr: '4 Anzac Street, Takapuna, Auckland 0622', phone: '09 486 2210' },
    { id: 'c3', name: 'Ascot Day Surgery (visiting)',  short: 'Ascot',     addr: '90 Green Lane East, Remuera, Auckland 1051', phone: '09 520 9400' },
  ];

  const staff = [
    { id: 'u1', name: 'Dr Alice Fenwick',   initials: 'AF', role: 'Clinician',        spec: 'Orthopaedic Surgeon',  tone: 1, hpi: '99ZZZZ', mcnz: '41827', accId: 'DR9182', signature: 'A. Fenwick' },
    { id: 'u2', name: 'Dr Rāwiri Manaia',   initials: 'RM', role: 'Clinician',        spec: 'General Surgeon',      tone: 2, hpi: '88YYYY', mcnz: '38442', accId: 'DR7741', signature: 'R. Manaia' },
    { id: 'u3', name: 'Dr Sina Faleolo',    initials: 'SF', role: 'Clinician',        spec: 'Rheumatologist',       tone: 3, hpi: '77XXXX', mcnz: '45019', accId: 'DR6620', signature: 'S. Faleolo' },
    { id: 'u4', name: 'Kate Downie',        initials: 'KD', role: 'Clinician',        spec: 'Nurse Practitioner',   tone: 5, hpi: '66WWWW', mcnz: 'NC2281', accId: 'NP4410', signature: 'K. Downie' },
    { id: 'u5', name: 'Mereana Hopa',       initials: 'MH', role: 'Reception',        spec: 'Front of house',       tone: 4 },
    { id: 'u6', name: 'Josh Petersen',      initials: 'JP', role: 'Typist',           spec: 'Medical typist',       tone: 1 },
    { id: 'u7', name: 'Lorraine Beckett',   initials: 'LB', role: 'Practice Manager', spec: 'Practice manager',     tone: 3 },
  ];
  const clinicians = staff.filter(s => s.role === 'Clinician');

  const gps = [
    { id: 'g1', name: 'Dr Helen Prasad',    practice: 'Ōtāhuhu Family Doctors',   email: 'h.prasad@otahuhufd.co.nz',   hl: 'OTAHUHUFD' },
    { id: 'g2', name: 'Dr Michael Toomey',  practice: 'Glenfield Medical Centre',  email: 'm.toomey@glenfieldmc.co.nz', hl: 'GLENMC' },
    { id: 'g3', name: 'Dr Anahera Kingi',   practice: 'Te Puna Hauora, Northcote', email: 'a.kingi@tepunahauora.nz',    hl: 'TEPUNA' },
    { id: 'g4', name: 'Dr Sunil Ramchand',  practice: 'Mt Roskill Doctors',        email: 's.ramchand@mrd.co.nz',       hl: 'MTROSKILL' },
    { id: 'g5', name: 'Dr Bridget Neale',   practice: 'Devonport Health Centre',   email: 'b.neale@devonporthc.co.nz',  hl: 'DEVHC' },
  ];

  const patients = [
    { id:'p1',  first:'Te Aroha',  last:'Ngata',      dob:'1974-03-12', sex:'F', nhi:'JKL8407', phone:'021 442 907',  email:'tearoha.ngata@xtra.co.nz',  addr:'18 Kōwhai Road, Sandringham, Auckland 1025', gp:'g1', funder:'ACC',           alerts:['Penicillin allergy'], warn:['Interpreter — te reo Māori preferred'], nok:'Hemi Ngata (husband) · 021 550 118', claim:'ACC-2026-44817', injury:'2026-07-28', tone:1 },
    { id:'p2',  first:'Hemi',      last:'Waititi',    dob:'1959-11-02', sex:'M', nhi:'PQR2218', phone:'027 819 4402', email:'hemi.waititi@gmail.com',    addr:'7A Seabrook Ave, New Lynn, Auckland 0600',   gp:'g4', funder:'Southern Cross', alerts:[],                     warn:['Anticoagulated — dabigatran'], nok:'Marama Waititi (daughter) · 027 300 991', claim:null, injury:null, tone:2 },
    { id:'p3',  first:'Margaret',  last:"O'Connell",  dob:'1948-06-24', sex:'F', nhi:'BCD9132', phone:'09 445 2218',  email:'m.oconnell48@outlook.co.nz',addr:'22 Lake Road, Devonport, Auckland 0624',     gp:'g5', funder:'Private',       alerts:['Latex allergy'],      warn:['Falls risk'],                  nok:'Peter O\'Connell (son) · 021 774 209', claim:null, injury:null, tone:3 },
    { id:'p4',  first:'Siosaia',   last:'Tupou',      dob:'1991-01-19', sex:'M', nhi:'MNP5567', phone:'022 634 7781', email:'s.tupou91@gmail.com',       addr:'44 Rata Street, Māngere, Auckland 2022',     gp:'g1', funder:'ACC',           alerts:[],                     warn:[],                              nok:'Ana Tupou (partner) · 022 118 640', claim:'ACC-2026-45102', injury:'2026-08-30', tone:4 },
    { id:'p5',  first:'Priya',     last:'Naidu',      dob:'1986-09-08', sex:'F', nhi:'STU7714', phone:'021 077 3312', email:'priya.naidu@kiwilink.nz',   addr:'3/58 Balmoral Road, Mt Eden, Auckland 1024', gp:'g4', funder:'Southern Cross', alerts:['NSAID sensitivity'],  warn:[],                              nok:'Ravi Naidu (husband) · 021 448 205', claim:null, injury:null, tone:5 },
    { id:'p6',  first:'Wiremu',    last:'Kawiti',     dob:'2003-04-30', sex:'M', nhi:'DEF3383', phone:'020 411 8890', email:'w.kawiti@studentmail.ac.nz',addr:'11 Puriri Drive, Henderson, Auckland 0612',  gp:'g3', funder:'ACC',           alerts:[],                     warn:[],                              nok:'Rangi Kawiti (mother) · 021 660 774', claim:'ACC-2026-45330', injury:null, tone:1 },
    { id:'p7',  first:'Ngaire',    last:'Solomon',    dob:'1966-12-15', sex:'F', nhi:'GHJ6025', phone:'027 220 5518', email:'ngaire.solomon@ihug.co.nz', addr:'9 Rewi Street, Onehunga, Auckland 1061',     gp:'g2', funder:'Private',       alerts:[],                     warn:[],                              nok:'Dean Solomon (husband) · 027 884 110', claim:null, injury:null, tone:2 },
    { id:'p8',  first:'James',     last:'Sutherland', dob:'1981-07-07', sex:'M', nhi:'VWX4453', phone:'021 938 0064', email:'jsutherland@workmail.nz',   addr:'160 Hurstmere Road, Takapuna, Auckland 0622',gp:'g5', funder:'Southern Cross', alerts:[],                     warn:[],                              nok:'Emma Sutherland (wife) · 021 300 447', claim:null, injury:null, tone:3 },
    { id:'p9',  first:'Mele',      last:'Fifita',     dob:'1995-02-21', sex:'F', nhi:'YZA1171', phone:'022 500 9913', email:'mele.fifita@gmail.com',     addr:'5 Favona Road, Māngere, Auckland 2024',      gp:'g1', funder:'ACC',           alerts:['Codeine — nausea'],   warn:[],                              nok:'Sione Fifita (brother) · 022 774 300', claim:'ACC-2026-44290', injury:'2026-06-11', tone:4 },
    { id:'p10', first:'Bruce',     last:'Lockhart',   dob:'1953-10-05', sex:'M', nhi:'JKM8806', phone:'09 418 6673',  email:'brucel53@xtra.co.nz',       addr:'31 Wairau Road, Glenfield, Auckland 0629',   gp:'g2', funder:'Private',       alerts:[],                     warn:['Pacemaker in situ'],           nok:'Judith Lockhart (wife) · 021 552 908', claim:null, injury:null, tone:5 },
    { id:'p11', first:'Anahera',   last:'Tait',       dob:'1989-05-27', sex:'F', nhi:'NPP3348', phone:'021 664 1129', email:'anahera.tait@korohealth.nz',addr:'77 Hillsborough Rd, Hillsborough, Akld 1042',gp:'g3', funder:'ACC',           alerts:[],                     warn:[],                              nok:'Tama Tait (partner) · 021 883 447', claim:'ACC-2026-45611', injury:'2026-09-02', tone:1 },
    { id:'p12', first:'Rangi',     last:'Mātaira',    dob:'1972-08-14', sex:'M', nhi:'QRS9968', phone:'027 445 2207', email:'r.mataira@nzpost.co.nz',    addr:'14 Tiverton Road, Avondale, Auckland 0600',  gp:'g4', funder:'Southern Cross', alerts:['Sulfa drugs'],        warn:[],                              nok:'Hine Mātaira (wife) · 027 119 662', claim:null, injury:null, tone:2 },
    { id:'p13', first:'Chloe',     last:'Bennett',    dob:'1998-11-30', sex:'F', nhi:'TUV2287', phone:'020 882 4419', email:'chloe.bennett98@gmail.com', addr:'2/19 Jervois Road, Herne Bay, Auckland 1011',gp:'g5', funder:'Private',       alerts:[],                     warn:[],                              nok:'Sarah Bennett (mother) · 021 447 998', claim:null, injury:null, tone:3 },
    { id:'p14', first:'Tui',       last:'Parata',     dob:'1962-01-09', sex:'F', nhi:'WXY5500', phone:'021 338 7740', email:'tui.parata@ngatiwhatua.nz', addr:'40 Bassett Road, Remuera, Auckland 1050',    gp:'g3', funder:'ACC',           alerts:[],                     warn:[],                              nok:'Kahu Parata (son) · 027 660 118', claim:'ACC-2026-43980', injury:'2026-05-19', tone:4 },
  ];


  /* ---- PMS registration fields, as a NZ practice actually files them ----
     Enrolment status drives the colour a patient's name is shown in, but the
     list also labels it — colour alone would fail WCAG and is hard to learn. */
  const ENROL_STATUS = {
    enrolled:    { label: 'Enrolled',        tone: 'var(--text)',        chip: 'chip-ok'    },
    unenrolled:  { label: 'Un-enrolled',     tone: 'var(--accent-text)', chip: 'chip-accent'},
    casual:      { label: 'Casual / visitor',tone: 'var(--ok-fg)',       chip: 'chip-ok'    },
    transferred: { label: 'Transferred',     tone: 'var(--warn-fg)',     chip: 'chip-warn'  },
    notfunded:   { label: 'Registered, not funded', tone: 'var(--appt-procedure)', chip: '' },
    deceased:    { label: 'Deceased',        tone: 'var(--text-subtle)', chip: ''           },
  };

  // Deterministic so the sample set is stable between reloads.
  const REG = [
    ['enrolled',   'NES', 'R', 'P',     'A3', 'N', false, 'u1'],
    ['enrolled',   'NES', 'R', 'P',     'A3', 'N', true,  'u2'],
    ['transferred','NES', 'R', 'P',     'A3', 'N', true,  'u1'],
    ['casual',     'U',   'C', 'CAS',   'A3', 'N', false, 'u1'],
    ['enrolled',   'NES', 'R', 'P',     'A3', 'F', false, 'u2'],
    ['unenrolled', 'U',   'C', 'absgp', 'C3', 'N', false, 'u4'],
    ['enrolled',   'NES', 'R', 'P',     'A3', 'N', false, 'u2'],
    ['notfunded',  'NES', 'C', 'BD',    'C3', 'N', false, 'u1'],
    ['enrolled',   'NES', 'R', 'P',     'A3', 'N', true,  'u1'],
    ['enrolled',   'NES', 'R', 'P',     'A3', 'N', true,  'u2'],
    ['unenrolled', 'U',   'C', 'P',     'A3', 'N', false, 'u4'],
    ['enrolled',   'NES', 'R', 'P',     'A3', 'N', false, 'u3'],
    ['casual',     'U',   'C', 'CAS',   'A3', 'N', false, 'u1'],
    ['enrolled',   'NES', 'R', 'P',     'A3', 'F', true,  'u3'],
  ];
  const PREFERRED = { p1: 'Aroha', p3: 'Maggie', p8: 'Jim', p13: 'Chlo' };

  patients.forEach((p, i) => {
    const [status, enrol, reg, pay, gms, fund, csc, prov] = REG[i % REG.length];
    p.status = status;
    p.enrol = enrol;      // NES = enrolled national scheme, U = un-enrolled
    p.reg = reg;          // C = casual, R = registered
    p.payGrp = pay;
    p.gms = gms;          // General Medical Services subsidy level
    p.fund = fund;        // F = funded, N = not
    p.csc = csc;          // Community Services Card held
    p.provider = prov;    // usual provider
    p.chart = 'KRA-' + (47400 + i * 7);
    p.preferred = PREFERRED[p.id] || null;
  });


  /* ---- Demographic fields the consult banner carries ---- */
  const ETHNIC = ['NZ European', 'Māori', 'Samoan', 'Tongan', 'Indian', 'Chinese', 'NZ European'];
  patients.forEach((p, i) => {
    p.ethnicity = ETHNIC[i % ETHNIC.length];
    p.quintile = (i % 5) + 1;                 // NZDep quintile, 5 = most deprived
    p.dhb = ['G00028-E', 'G00011-A', 'G00042-C'][i % 3];
    p.portal = i % 3 !== 0;                   // patient portal registered
    p.ahBalance = 0;
  });

  /* ---- Recalls and prompts: what the consult screen nags about ---- */
  const recalls = [
    { pt:'p1',  kind:'Vaccine schedule', text:'Influenza — annual',              due:'2027-04-01', status:'due' },
    { pt:'p1',  kind:'Vaccine schedule', text:'Zoster 65Y',                      due:'2039-03-12', status:'future' },
    { pt:'p1',  kind:'Screening',        text:'Cervical screening — 5 yearly',   due:'2026-10-02', status:'overdue' },
    { pt:'p1',  kind:'Review',           text:'ACC45 review — right knee',       due:'2026-10-15', status:'due' },
    { pt:'p3',  kind:'Screening',        text:'Bowel screening kit',             due:'2026-09-30', status:'due' },
    { pt:'p12', kind:'Monitoring',       text:'Methotrexate bloods — 3 monthly', due:'2026-09-20', status:'due' },
  ];

  const problems = [
    { pt:'p1',  text:'Medial meniscal tear, right knee', onset:'2026-07-28', status:'active',   acc:true  },
    { pt:'p1',  text:'Osteoarthritis, medial compartment', onset:'2024-02-10', status:'active', acc:false },
    { pt:'p1',  text:'Iron deficiency anaemia',          onset:'2021-06-04', status:'resolved', acc:false },
    { pt:'p12', text:'Seropositive rheumatoid arthritis', onset:'2026-08-30', status:'active',  acc:false },
  ];

  const consultTypes = ['Note only', 'Face to face', 'Telehealth', 'Phone', 'Home visit', 'Nurse consult', 'ACC review'];


  /* ======================================================================
     Bulk sample population.
     A real practice grid is thousands of rows, so the design has to hold up
     at volume: sticky header, pagination, and columns that stay readable.
     Generated deterministically, and every NHI carries a valid check digit.
     ====================================================================== */
  const extraProviders = [
    { id:'v1', name:'Dr Cathy Ferguson',  initials:'CF', role:'Provider', spec:'General Practitioner', tone:2 },
    { id:'v2', name:'Dr Alan Phillips',   initials:'AP', role:'Provider', spec:'General Practitioner', tone:4 },
    { id:'v3', name:'Dr Moana Reihana',   initials:'MR', role:'Provider', spec:'General Practitioner', tone:1 },
    { id:'v4', name:'Dr Ian Whitcombe',   initials:'IW', role:'Provider', spec:'General Practitioner', tone:3 },
    { id:'v5', name:'Nurse Aroha Pene',   initials:'AP', role:'Provider', spec:'Practice Nurse',       tone:5 },
  ];
  staff.push(...extraProviders);

  (function generatePopulation() {
    // Small deterministic PRNG so the set is identical on every load.
    let seed = 20260917;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

    const SURNAMES = [
      'NGATA','WAITITI','KAWITI','PARATA','MĀTAIRA','TAIT','SOLOMON','RĀWIRI','HEKE','TAMATI',
      'HOHEPA','IHAKA','MANAIA','ROPATA','PŌTIKI','TE RANGI','WHAREPAPA','MARINO','KĒPA','NGAWATI',
      'TUPOU','FIFITA','FALEOLO','TAUFA','LATU','VAKA','HALAPUA','TUILAGI','SAVEA','FONOTI',
      'IOSEFA','LEOTA','MATAELE','PELE','TAUAFIAFI',
      "O'CONNELL",'SUTHERLAND','BENNETT','LOCKHART','BECKETT','DOWNIE','PETERSEN','FENWICK','HARDING',
      'ASHCROFT','PRENDERGAST','KIRKWOOD','BLACKWELL','THORNTON','WINSTANLEY','ALDERTON','CUSACK',
      'MERRICK','WHITCOMBE','BRADY','TRAYLOR','JEWETT','BRITT','BETSON','BOOT',
      'NAIDU','RAMCHAND','PRASAD','CHAUHAN','IYER','SEKHON','BHATIA','DHILLON','KAPADIA','MISTRY',
      'CHEN','ZHANG','LIU','HUANG','WONG','LAM','NG','TSE','YEUNG','KWOK',
      'DELA CRUZ','BAUTISTA','VILLANUEVA','AGUSTIN',
    ];
    const FIRST_F = ['Te Aroha','Anahera','Tui','Mereana','Marama','Aroha','Māia','Hine','Ngaire','Moana',
      'Mele','Sina','Losa','Ana','Ofa','Litia','Priya','Anjali','Deepa','Kavita','Mei','Ling','Hui','Xiu',
      'Margaret','Chloe','Lorraine','Kate','Alice','Sarah','Emma','Charlotte','Isla','Mia','Ruby','Ella',
      'Ava','Zoe','Harriet','Jocelyn','Noeline','Bridget','Fiona','Rosemary'];
    const FIRST_M = ['Hemi','Wiremu','Rangi','Kahu','Tama','Nikau','Ihaia','Manaaki','Rāwiri','Tane',
      'Siosaia','Sione','Tevita','Filipe','Malakai','Ravi','Sunil','Rohan','Arjun','Vikram',
      'Wei','Jian','Ming','Hao','James','Bruce','Josh','Peter','Liam','Oliver','Hunter','Jack','Leo',
      'Max','Noah','Malcolm','Gordon','Trevor','Desmond','Clive','Angus','Duncan'];
    const PREF = { 'Margaret':'Maggie','James':'Jim','Charlotte':'Lottie','Te Aroha':'Aroha',
      'Wiremu':'Wiri','Rosemary':'Rose','Desmond':'Des','Malcolm':'Mal','Elizabeth':'Liz' };

    const STREETS = ['Devon Street','Caroline Road','Maanihi Drive','Maple Street','Andrew Avenue',
      'Hamilton Place','Brightside Road','Molesworth Street','Longfellow Avenue','Kōwhai Road',
      'Rata Street','Puriri Drive','Rewi Street','Hurstmere Road','Jervois Road','Bassett Road',
      'Tiverton Road','Favona Road','Lake Road','Broadway','Anzac Street','Balmoral Road',
      'Sandringham Road','Wairau Road','Seabrook Avenue','Great North Road','Riccarton Road'];
    const PLACES = [
      ['Newmarket','Auckland','1023'], ['Takapuna','Auckland','0622'], ['Māngere','Auckland','2022'],
      ['Henderson','Auckland','0612'], ['Onehunga','Auckland','1061'], ['Remuera','Auckland','1050'],
      ['Mt Eden','Auckland','1024'], ['Devonport','Auckland','0624'], ['Glenfield','Auckland','0629'],
      ['Avondale','Auckland','0600'], ['Papatoetoe','Auckland','2025'], ['Epsom','Auckland','1023'],
      ['Rototuna','Hamilton','3210'], ['Chartwell','Hamilton','3210'], ['Glenholme','Rotorua','3010'],
      ['Mayfair','Hastings','4122'], ['Roslyn','Palmerston North','4414'], ['Bunnythorpe','Palmerston North','4478'],
      ['Napier South','Napier','4110'], ['Thorndon','Wellington','6011'], ['Riccarton','Christchurch','8041'],
      ['Papanui','Christchurch','8052'], ['Mosgiel','Dunedin','9024'], ['Mount Maunganui','Tauranga','3116'],
    ];

    const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const usedNhi = new Set(patients.map(x => x.nhi));
    function makeNhi() {
      for (let attempt = 0; attempt < 400; attempt++) {
        const stem = [0,1,2].map(() => ALPHA[int(0, ALPHA.length - 1)]).join('')
                   + [0,1,2].map(() => int(0, 9)).join('');
        let total = 0;
        for (let i = 0; i < 6; i++) {
          const ch = stem[i];
          total += (/[A-Z]/.test(ch) ? ALPHA.indexOf(ch) + 1 : Number(ch)) * (7 - (i + 1));
        }
        const rem = total % 11;
        if (rem === 0) continue;
        const cd = (11 - rem) === 10 ? 0 : 11 - rem;
        const nhi = stem + cd;
        if (!usedNhi.has(nhi)) { usedNhi.add(nhi); return nhi; }
      }
      return null;
    }

    const STATUSES = ['enrolled','enrolled','enrolled','enrolled','enrolled','enrolled',
                      'unenrolled','casual','transferred','notfunded','deceased'];
    const PAYGRPS = ['P','P','P','P','CAS','absgp','BD','C3'];
    const FUNDERS = ['ACC','Southern Cross','Private','Private','ACC'];
    const providerIds = ['u1','u2','u3','u4','v1','v2','v3','v4','v5'];

    const TOTAL = 480;
    for (let i = 0; i < TOTAL; i++) {
      const nhi = makeNhi();
      if (!nhi) break;
      const sex = rnd() < 0.52 ? 'F' : 'M';
      const first = sex === 'F' ? pick(FIRST_F) : pick(FIRST_M);
      const last = pick(SURNAMES);
      const status = pick(STATUSES);
      const [suburb, city, pc] = pick(PLACES);
      const year = int(1932, 2024);
      const month = int(1, 12), day = int(1, 28);
      const enrolled = status === 'enrolled' || status === 'notfunded';
      const hasBalance = rnd() < 0.18;

      patients.push({
        id: 'g' + (i + 1),
        first, last,
        preferred: PREF[first] && rnd() < 0.5 ? PREF[first] : null,
        dob: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
        sex, nhi,
        phone: rnd() < 0.7 ? `+64 2${int(0,9)} ${int(100,999)} ${int(1000,9999)}` : '',
        email: `${first.toLowerCase().replace(/[^a-z]/g,'')}.${last.toLowerCase().replace(/[^a-z]/g,'')}@example.co.nz`,
        addr: `${int(1,220)} ${pick(STREETS)}, ${suburb}, ${city} ${pc}`,
        gp: pick(gps).id,
        funder: pick(FUNDERS),
        alerts: rnd() < 0.14 ? [pick(['Penicillin allergy','NSAID sensitivity','Latex allergy','Sulfa drugs','Codeine — nausea'])] : [],
        warn: rnd() < 0.08 ? [pick(['Falls risk','Interpreter required','Anticoagulated','Pacemaker in situ'])] : [],
        nok: '', claim: null, injury: null,
        tone: int(1, 5),
        // registration fields
        status,
        enrol: enrolled ? 'NES' : 'U',
        reg: enrolled ? 'R' : 'C',
        payGrp: pick(PAYGRPS),
        gms: pick(['A3','A3','A3','C3']),
        fund: rnd() < 0.12 ? 'F' : 'N',
        csc: rnd() < 0.22,
        provider: pick(providerIds),
        chart: 'KRA-' + (47500 + i),
        ethnicity: pick(['NZ European','Māori','Samoan','Tongan','Cook Islands Māori','Indian','Chinese','Filipino','Other European']),
        quintile: int(1, 5),
        dhb: pick(['G00028-E','G00011-A','G00042-C']),
        portal: rnd() < 0.55,
        ahBalance: 0,
        bal: hasBalance ? Math.round(rnd() * 84000) / 100 : 0,
      });
    }
  })();

  const apptTypes = [
    { id:'t1', name:'New consultation',     type:'consult',    mins:45, price:395.00, code:'CON-NEW' },
    { id:'t2', name:'Follow-up',            type:'followup',   mins:20, price:195.00, code:'CON-FU' },
    { id:'t3', name:'ACC review',           type:'acc',        mins:30, price:0,      code:'ACC-REV' },
    { id:'t4', name:'Minor procedure',      type:'procedure',  mins:60, price:860.00, code:'PROC-MIN' },
    { id:'t5', name:'Telehealth follow-up', type:'telehealth', mins:15, price:145.00, code:'TEL-FU' },
    { id:'t6', name:'Post-op check',        type:'followup',   mins:15, price:0,      code:'POSTOP' },
  ];

  // status: booked | arrived | consult | done | dna | cancelled
  const appts = [
    { id:'a1',  pt:'p1',  cl:'u1', clinic:'c1', start: 8*60+30,  type:'t1', status:'done',    note:'Right knee — post fall at work',            invoiced:true  },
    { id:'a2',  pt:'p4',  cl:'u1', clinic:'c1', start: 9*60+15,  type:'t3', status:'done',    note:'ACC review — shoulder',                      invoiced:false },
    { id:'a3',  pt:'p3',  cl:'u1', clinic:'c1', start: 9*60+45,  type:'t2', status:'consult', note:'Hip — 6 week review',                        invoiced:false },
    { id:'a4',  pt:'p9',  cl:'u1', clinic:'c1', start:10*60+15,  type:'t2', status:'arrived', note:'Wrist ORIF follow-up',                       invoiced:false },
    { id:'a5',  pt:'p8',  cl:'u1', clinic:'c1', start:10*60+45,  type:'t1', status:'booked',  note:'New — lumbar back pain',                     invoiced:false },
    { id:'a6',  pt:'p13', cl:'u1', clinic:'c1', start:11*60+30,  type:'t5', status:'booked',  note:'Telehealth — result discussion',             invoiced:false },
    { id:'a7',  pt:'p12', cl:'u1', clinic:'c1', start:13*60+30,  type:'t4', status:'booked',  note:'Ganglion excision — local',                  invoiced:false },
    { id:'a8',  pt:'p6',  cl:'u1', clinic:'c1', start:14*60+45,  type:'t2', status:'dna',     note:'Ankle — did not attend',                     invoiced:false },
    { id:'a9',  pt:'p14', cl:'u1', clinic:'c1', start:15*60+15,  type:'t3', status:'booked',  note:'ACC review — lumbar',                        invoiced:false },
    { id:'a10', pt:'p11', cl:'u1', clinic:'c1', start:16*60,     type:'t2', status:'booked',  note:'Shoulder — 2 week post-op',                  invoiced:false },

    { id:'b1',  pt:'p2',  cl:'u2', clinic:'c1', start: 8*60,     type:'t1', status:'done',    note:'Hernia assessment',                          invoiced:true  },
    { id:'b2',  pt:'p5',  cl:'u2', clinic:'c1', start: 9*60,     type:'t2', status:'done',    note:'Gallbladder follow-up',                      invoiced:true  },
    { id:'b3',  pt:'p10', cl:'u2', clinic:'c1', start:10*60,     type:'t1', status:'arrived', note:'New — abdominal pain',                       invoiced:false },
    { id:'b4',  pt:'p7',  cl:'u2', clinic:'c1', start:11*60,     type:'t6', status:'booked',  note:'Post-op wound check',                        invoiced:false },
    { id:'b5',  pt:'p1',  cl:'u2', clinic:'c1', start:14*60,     type:'t2', status:'booked',  note:'Second opinion — knee',                      invoiced:false },

    { id:'d1',  pt:'p12', cl:'u3', clinic:'c2', start: 9*60+30,  type:'t1', status:'done',    note:'New — inflammatory arthritis',               invoiced:false },
    { id:'d2',  pt:'p14', cl:'u3', clinic:'c2', start:10*60+30,  type:'t2', status:'arrived', note:'Methotrexate review',                        invoiced:false },
    { id:'d3',  pt:'p5',  cl:'u3', clinic:'c2', start:11*60+15,  type:'t5', status:'booked',  note:'Telehealth — bloods',                        invoiced:false },
    { id:'d4',  pt:'p3',  cl:'u3', clinic:'c2', start:13*60,     type:'t2', status:'booked',  note:'Polymyalgia review',                         invoiced:false },
    { id:'d5',  pt:'p9',  cl:'u3', clinic:'c2', start:15*60,     type:'t2', status:'booked',  note:'Joint injection review',                     invoiced:false },

    { id:'e1',  pt:'p6',  cl:'u4', clinic:'c1', start: 9*60,     type:'t6', status:'done',    note:'Dressing change',                            invoiced:true  },
    { id:'e2',  pt:'p11', cl:'u4', clinic:'c1', start: 9*60+30,  type:'t6', status:'done',    note:'Suture removal',                             invoiced:true  },
    { id:'e3',  pt:'p8',  cl:'u4', clinic:'c1', start:13*60+30,  type:'t6', status:'booked',  note:'Pre-admission workup',                       invoiced:false },
    { id:'e4',  pt:'p13', cl:'u4', clinic:'c1', start:14*60+30,  type:'t6', status:'booked',  note:'Wound review',                               invoiced:false },
  ];

  const blocks = [
    { cl:'u1', clinic:'c1', start:12*60,    mins:60, label:'Lunch' },
    { cl:'u2', clinic:'c1', start:12*60,    mins:90, label:'Theatre list — Ascot' },
    { cl:'u3', clinic:'c2', start:12*60,    mins:45, label:'Lunch' },
    { cl:'u4', clinic:'c1', start:10*60+30, mins:150,label:'Annual leave (half day)' },
    { cl:'u2', clinic:'c1', start:15*60+30, mins:90, label:'MDT meeting' },
  ];

  // Letters: draft | pending | approved | sent
  const letters = [
    { id:'l1', pt:'p1',  cl:'u1', title:'Initial orthopaedic assessment',   to:'g1', cc:['ACC'],            status:'pending',  updated:'2026-09-17T09:10', typedBy:'u6', channel:'Healthlink', words:412, aiAssisted:true },
    { id:'l2', pt:'p4',  cl:'u1', title:'ACC45 supporting report',           to:'g1', cc:['ACC'],            status:'pending',  updated:'2026-09-17T08:52', typedBy:'u6', channel:'Healthlink', words:318, aiAssisted:true },
    { id:'l3', pt:'p3',  cl:'u1', title:'Six week hip review',               to:'g5', cc:[],                 status:'draft',    updated:'2026-09-17T10:04', typedBy:null, channel:'Healthlink', words:96,  aiAssisted:false },
    { id:'l4', pt:'p2',  cl:'u2', title:'Hernia repair — operative plan',    to:'g4', cc:['Southern Cross'], status:'pending',  updated:'2026-09-16T16:40', typedBy:'u6', channel:'Email',      words:527, aiAssisted:false },
    { id:'l5', pt:'p12', cl:'u3', title:'Rheumatology first assessment',     to:'g4', cc:[],                 status:'approved', updated:'2026-09-16T15:12', typedBy:'u6', channel:'Healthlink', words:688, aiAssisted:true },
    { id:'l6', pt:'p9',  cl:'u1', title:'Wrist ORIF — 8 week progress',      to:'g1', cc:['ACC'],            status:'sent',     updated:'2026-09-15T11:22', typedBy:'u6', channel:'Healthlink', words:352, aiAssisted:false },
    { id:'l7', pt:'p10', cl:'u2', title:'Referral to gastroenterology',      to:'g2', cc:[],                 status:'draft',    updated:'2026-09-17T07:58', typedBy:null, channel:'Healthlink', words:0,   aiAssisted:false },
    { id:'l8', pt:'p14', cl:'u3', title:'Methotrexate monitoring plan',      to:'g3', cc:[],                 status:'pending',  updated:'2026-09-16T14:05', typedBy:'u6', channel:'Email',      words:274, aiAssisted:true },
  ];

  const letterTemplates = [
    { id:'tp1', name:'Initial specialist assessment', pinned:true,  group:'Clinical', fields:[
      { k:'side',    label:'Side',            type:'select', opts:['Left','Right','Bilateral'] },
      { k:'region',  label:'Body region',     type:'select', opts:['Knee','Hip','Shoulder','Wrist','Ankle','Lumbar spine'] },
      { k:'onset',   label:'Onset / injury date', type:'date' },
      { k:'plan',    label:'Plan summary',    type:'text' },
    ]},
    { id:'tp2', name:'ACC45 supporting report',  pinned:true,  group:'ACC', fields:[
      { k:'claim',   label:'Claim number', type:'text' },
      { k:'mech',    label:'Mechanism of injury', type:'text' },
      { k:'capacity',label:'Work capacity', type:'select', opts:['Fully unfit','Fit for selected duties','Fully fit'] },
    ]},
    { id:'tp3', name:'Post-operative review',     pinned:true,  group:'Clinical', fields:[
      { k:'op',      label:'Procedure', type:'text' },
      { k:'weeks',   label:'Weeks post-op', type:'select', opts:['2','6','12','26'] },
    ]},
    { id:'tp4', name:'Referral to colleague',     pinned:false, group:'Referral', fields:[] },
    { id:'tp5', name:'Discharge summary',         pinned:false, group:'Clinical', fields:[] },
    { id:'tp6', name:'Southern Cross prior approval', pinned:false, group:'Billing', fields:[] },
  ];

  // Inbox: letters awaiting approval, results, referrals, messages
  const inbox = [
    { id:'i1', kind:'approval', pt:'p1',  from:'Josh Petersen',        subj:'Initial orthopaedic assessment — ready for approval', at:'2026-09-17T09:10', unread:true,  pri:'normal', letter:'l1' },
    { id:'i2', kind:'approval', pt:'p4',  from:'Josh Petersen',        subj:'ACC45 supporting report — ready for approval',        at:'2026-09-17T08:52', unread:true,  pri:'high',   letter:'l2' },
    { id:'i3', kind:'result',   pt:'p9',  from:'Auckland Radiology',   subj:'XR Right wrist — union progressing',                  at:'2026-09-17T08:20', unread:true,  pri:'normal' },
    { id:'i4', kind:'result',   pt:'p12', from:'Awanui Labs',          subj:'CRP 48 mg/L · ESR 62 mm/hr — ABNORMAL',               at:'2026-09-17T07:41', unread:true,  pri:'high'   },
    { id:'i5', kind:'referral', pt:'p10', from:'Dr Michael Toomey',    subj:'Referral — 72M epigastric pain, weight loss',          at:'2026-09-16T17:33', unread:false, pri:'high'   },
    { id:'i6', kind:'message',  pt:'p3',  from:'Mereana Hopa',         subj:'Patient asking to move Friday appointment',            at:'2026-09-16T16:02', unread:false, pri:'normal' },
    { id:'i7', kind:'approval', pt:'p2',  from:'Josh Petersen',        subj:'Hernia repair — operative plan',                       at:'2026-09-16T16:40', unread:false, pri:'normal', letter:'l4' },
    { id:'i8', kind:'result',   pt:'p5',  from:'Awanui Labs',          subj:'LFTs — within normal limits',                          at:'2026-09-16T11:15', unread:false, pri:'low'    },
    { id:'i9', kind:'referral', pt:'p13', from:'Dr Bridget Neale',     subj:'Referral — 27F recurrent shoulder dislocation',        at:'2026-09-15T14:48', unread:false, pri:'normal' },
    { id:'i10',kind:'message',  pt:'p1',  from:'ACC Provider Services',subj:'Claim ACC-2026-44817 approved for 6 sessions',         at:'2026-09-15T09:30', unread:false, pri:'normal' },
  ];

  // Invoices: draft | sent | paid | overdue
  const invoices = [
    { id:'INV-10482', pt:'p1',  cl:'u1', date:'2026-09-17', due:'2026-10-01', payer:'ACC',            status:'draft',   items:[{d:'New consultation',q:1,p:395.00}], paid:0 },
    { id:'INV-10481', pt:'p2',  cl:'u2', date:'2026-09-17', due:'2026-10-01', payer:'Southern Cross', status:'sent',    items:[{d:'New consultation',q:1,p:395.00}], paid:0 },
    { id:'INV-10480', pt:'p5',  cl:'u2', date:'2026-09-17', due:'2026-10-01', payer:'Southern Cross', status:'paid',    items:[{d:'Follow-up',q:1,p:195.00}], paid:224.25 },
    { id:'INV-10479', pt:'p6',  cl:'u4', date:'2026-09-17', due:'2026-10-01', payer:'ACC',            status:'sent',    items:[{d:'Post-op check',q:1,p:85.00}], paid:0 },
    { id:'INV-10478', pt:'p11', cl:'u4', date:'2026-09-17', due:'2026-10-01', payer:'ACC',            status:'paid',    items:[{d:'Suture removal',q:1,p:85.00}], paid:97.75 },
    { id:'INV-10471', pt:'p3',  cl:'u1', date:'2026-09-10', due:'2026-09-24', payer:'Private',        status:'sent',    items:[{d:'Follow-up',q:1,p:195.00},{d:'Injection — joint',q:1,p:120.00}], paid:0 },
    { id:'INV-10465', pt:'p8',  cl:'u1', date:'2026-09-03', due:'2026-09-17', payer:'Southern Cross', status:'paid',    items:[{d:'New consultation',q:1,p:395.00}], paid:454.25 },
    { id:'INV-10452', pt:'p10', cl:'u2', date:'2026-08-20', due:'2026-09-03', payer:'Private',        status:'overdue', items:[{d:'New consultation',q:1,p:395.00},{d:'Ultrasound guidance',q:1,p:180.00}], paid:0 },
    { id:'INV-10448', pt:'p7',  cl:'u2', date:'2026-08-14', due:'2026-08-28', payer:'Private',        status:'overdue', items:[{d:'Minor procedure',q:1,p:860.00}], paid:0 },
    { id:'INV-10444', pt:'p14', cl:'u3', date:'2026-08-12', due:'2026-08-26', payer:'ACC',            status:'overdue', items:[{d:'ACC review',q:1,p:165.00}], paid:0 },
    { id:'INV-10439', pt:'p12', cl:'u3', date:'2026-08-06', due:'2026-08-20', payer:'Southern Cross', status:'paid',    items:[{d:'New consultation',q:1,p:395.00}], paid:454.25 },
    { id:'INV-10430', pt:'p9',  cl:'u1', date:'2026-07-30', due:'2026-08-13', payer:'ACC',            status:'paid',    items:[{d:'Follow-up',q:1,p:195.00}], paid:224.25 },
  ];

  // ACC submission queue — validation errors surfaced friendly
  const accQueue = [
    { id:'ACC-S-881', inv:'INV-10482', pt:'p1',  cl:'u1', svc:'2026-09-17', code:'SP01', amount:395.00, valid:false,
      errors:[{ field:'injury', label:'Date of injury is missing', fix:'Add the injury date on the patient record' }] },
    { id:'ACC-S-882', inv:'INV-10479', pt:'p6',  cl:'u4', svc:'2026-09-17', code:'SP12', amount:85.00,  valid:false,
      errors:[{ field:'claim', label:'Claim number not recognised by ACC', fix:'Check the claim number on the patient record' },
              { field:'injury', label:'Date of injury is missing', fix:'Add the injury date on the patient record' }] },
    { id:'ACC-S-883', inv:'INV-10488', pt:'p4',  cl:'u1', svc:'2026-09-17', code:'SP01', amount:395.00, valid:true,  errors:[] },
    { id:'ACC-S-884', inv:'INV-10489', pt:'p9',  cl:'u1', svc:'2026-09-16', code:'SP08', amount:195.00, valid:true,  errors:[] },
    { id:'ACC-S-885', inv:'INV-10490', pt:'p11', cl:'u4', svc:'2026-09-16', code:'SP12', amount:85.00,  valid:true,  errors:[] },
    { id:'ACC-S-886', inv:'INV-10444', pt:'p14', cl:'u3', svc:'2026-08-12', code:'SP08', amount:165.00, valid:false,
      errors:[{ field:'provider', label:'ACC provider ID missing for Dr Sina Faleolo', fix:'Add the provider ID in Admin → Users' }] },
  ];

  const accHistory = [
    { batch:'BATCH-2026-0912', at:'2026-09-12T16:05', count:14, total:3840.00, accepted:13, rejected:1, status:'Part accepted' },
    { batch:'BATCH-2026-0905', at:'2026-09-05T16:02', count:11, total:2915.00, accepted:11, rejected:0, status:'Accepted' },
    { batch:'BATCH-2026-0829', at:'2026-08-29T15:58', count:16, total:4420.00, accepted:16, rejected:0, status:'Accepted' },
    { batch:'BATCH-2026-0822', at:'2026-08-22T16:11', count:9,  total:2280.00, accepted:8,  rejected:1, status:'Part accepted' },
  ];

  // Tasks: todo | doing | done
  const tasks = [
    { id:'k1', title:'Chase MRI report — right knee',        pt:'p1',  who:'u5', due:'2026-09-17', col:'todo',  pri:'high',   tag:'Imaging' },
    { id:'k2', title:'Send ACC45 once signed',               pt:'p4',  who:'u6', due:'2026-09-17', col:'todo',  pri:'high',   tag:'ACC' },
    { id:'k3', title:'Book theatre — ganglion excision',     pt:'p12', who:'u5', due:'2026-09-18', col:'todo',  pri:'normal', tag:'Theatre' },
    { id:'k4', title:'Southern Cross prior approval',        pt:'p2',  who:'u7', due:'2026-09-19', col:'doing', pri:'normal', tag:'Billing' },
    { id:'k5', title:'Type Friday dictations',               pt:'p3',  who:'u6', due:'2026-09-18', col:'doing', pri:'normal', tag:'Letters' },
    { id:'k6', title:'Follow up unpaid INV-10452',           pt:'p10', who:'u7', due:'2026-09-15', col:'todo',  pri:'high',   tag:'Billing' },
    { id:'k7', title:'Confirm interpreter for Thursday',     pt:'p1',  who:'u5', due:'2026-09-16', col:'doing', pri:'normal', tag:'Admin' },
    { id:'k8', title:'Upload pre-admission bloods',          pt:'p8',  who:'u4', due:'2026-09-16', col:'done',  pri:'normal', tag:'Clinical' },
    { id:'k9', title:'Recall — 6 month review',              pt:'p7',  who:'u5', due:'2026-09-12', col:'done',  pri:'low',    tag:'Recall' },
    { id:'k10',title:'Reconcile Xero payments batch',        pt:null,  who:'u7', due:'2026-09-16', col:'done',  pri:'normal', tag:'Billing' },
    { id:'k11',title:'Update consent form wording',          pt:null,  who:'u7', due:'2026-09-22', col:'todo',  pri:'low',    tag:'Admin' },
  ];

  // Patient timeline events
  const timeline = {
    p1: [
      { at:'2026-09-17T08:30', kind:'note',    by:'u1', title:'Consultation note — right knee',  body:'45F, fall at work 28 July. Persistent medial joint line pain, mechanical locking. Examination: effusion +, McMurray positive medially. Plan: MRI, ACC45 update, review 4 weeks.', signed:false },
      { at:'2026-09-17T09:05', kind:'letter',  by:'u1', title:'Initial orthopaedic assessment',  body:'To Dr Helen Prasad, Ōtāhuhu Family Doctors · CC ACC', status:'pending' },
      { at:'2026-09-17T09:12', kind:'invoice', by:'u5', title:'INV-10482 — New consultation',    body:'$395.00 to ACC · Draft', status:'draft' },
      { at:'2026-09-14T14:20', kind:'result',  by:null, title:'XR Right knee',                   body:'No acute bony injury. Mild medial compartment narrowing.', status:'normal' },
      { at:'2026-08-02T10:10', kind:'rx',      by:'u1', title:'Naproxen 500mg BD',               body:'30 tablets · 1 repeat · dispensed Chemist Warehouse Sandringham' },
      { at:'2026-07-29T11:45', kind:'note',    by:'u1', title:'ACC45 lodged',                    body:'Claim ACC-2026-44817 lodged for right knee — work injury 28/07/2026.', signed:true },
    ],
    p9: [
      { at:'2026-09-17T08:20', kind:'result', by:null, title:'XR Right wrist', body:'Distal radius fracture — union progressing, hardware intact.', status:'normal' },
      { at:'2026-09-15T11:22', kind:'letter', by:'u1', title:'Wrist ORIF — 8 week progress', body:'To Dr Helen Prasad · CC ACC', status:'sent' },
      { at:'2026-07-30T09:00', kind:'invoice',by:'u5', title:'INV-10430 — Follow-up', body:'$224.25 incl GST to ACC · Paid', status:'paid' },
    ],
  };

  const notes = [
    { id:'n1', pt:'p1',  by:'u1', at:'2026-09-17T08:30', title:'Consultation note — right knee', signed:false },
    { id:'n2', pt:'p3',  by:'u1', at:'2026-09-17T09:50', title:'Hip review note',                signed:false },
    { id:'n3', pt:'p2',  by:'u2', at:'2026-09-17T08:10', title:'Hernia assessment',              signed:false },
    { id:'n4', pt:'p12', by:'u3', at:'2026-09-16T10:05', title:'Rheumatology assessment',        signed:false },
    { id:'n5', pt:'p10', by:'u2', at:'2026-09-16T09:15', title:'Abdominal pain — workup',        signed:false },
  ];


  /* ---- Billing codes: mastered in Xero, synced into Kora ---- */
  const XERO_SYNC = '2026-09-17T09:42';
  const billingCodes = [
    { code:'CON-NEW',  name:'New consultation',            price:395.00, acct:'200', tax:'GST on Income', acc:null,    active:true },
    { code:'CON-FU',   name:'Follow-up consultation',      price:195.00, acct:'200', tax:'GST on Income', acc:null,    active:true },
    { code:'TEL-FU',   name:'Telehealth follow-up',        price:145.00, acct:'200', tax:'GST on Income', acc:null,    active:true },
    { code:'PROC-MIN', name:'Minor procedure',             price:860.00, acct:'201', tax:'GST on Income', acc:null,    active:true },
    { code:'INJ-JT',   name:'Joint injection',             price:120.00, acct:'201', tax:'GST on Income', acc:null,    active:true },
    { code:'USG',      name:'Ultrasound guidance',         price:180.00, acct:'201', tax:'GST on Income', acc:null,    active:true },
    { code:'DRESS',    name:'Dressing / wound care',       price:85.00,  acct:'200', tax:'GST on Income', acc:null,    active:true },
    { code:'ACC-SP01', name:'ACC specialist assessment',   price:395.00, acct:'210', tax:'GST on Income', acc:'SP01',  active:true },
    { code:'ACC-SP08', name:'ACC specialist review',       price:195.00, acct:'210', tax:'GST on Income', acc:'SP08',  active:true },
    { code:'ACC-SP12', name:'ACC nurse review',            price:85.00,  acct:'210', tax:'GST on Income', acc:'SP12',  active:true },
    { code:'REPORT',   name:'Medico-legal report',         price:550.00, acct:'220', tax:'GST on Income', acc:null,    active:true },
    { code:'DNA-FEE',  name:'Did not attend fee',          price:75.00,  acct:'230', tax:'GST on Income', acc:null,    active:false },
  ];

  /* ---- Clinic financial identity, shown on every invoice (from Xero) ---- */
  const org = {
    legal:'Kora Health Limited', trading:'Kora Specialists',
    gst:'123-456-789', nzbn:'9429040000000',
    bank:'12-3456-0078901-00', bankName:'Kora Health Ltd',
    email:'accounts@korahealth.nz', phone:'09 523 8840',
    terms:'Payment due within 14 days. Please quote the invoice number as reference.',
    xeroOrg:'Kora Health Limited', xeroBrand:'Kora Specialists — standard',
  };

  /* ---- Doctor timetables: recurring weekly sessions per location ---- */
  // day 0 = Monday … 4 = Friday
  const timetables = [
    { cl:'u1', day:0, start:8*60,     end:12*60,    clinic:'c1', kind:'clinic'  },
    { cl:'u1', day:0, start:13*60,    end:17*60,    clinic:'c3', kind:'theatre' },
    { cl:'u1', day:1, start:8*60,     end:17*60,    clinic:'c1', kind:'clinic'  },
    { cl:'u1', day:2, start:8*60,     end:12*60,    clinic:'c2', kind:'clinic'  },
    { cl:'u1', day:3, start:8*60+30,  end:17*60,    clinic:'c1', kind:'clinic'  },
    { cl:'u1', day:4, start:8*60,     end:12*60,    clinic:'c1', kind:'clinic'  },

    { cl:'u2', day:0, start:8*60,     end:16*60,    clinic:'c1', kind:'clinic'  },
    { cl:'u2', day:2, start:8*60,     end:12*60,    clinic:'c3', kind:'theatre' },
    { cl:'u2', day:3, start:8*60,     end:17*60,    clinic:'c1', kind:'clinic'  },
    { cl:'u2', day:4, start:13*60,    end:17*60,    clinic:'c1', kind:'admin'   },

    { cl:'u3', day:1, start:9*60,     end:16*60,    clinic:'c2', kind:'clinic'  },
    { cl:'u3', day:3, start:9*60+30,  end:16*60,    clinic:'c2', kind:'clinic'  },

    { cl:'u4', day:0, start:8*60+30,  end:16*60,    clinic:'c1', kind:'clinic'  },
    { cl:'u4', day:2, start:8*60+30,  end:16*60,    clinic:'c1', kind:'clinic'  },
    { cl:'u4', day:3, start:8*60+30,  end:10*60+30, clinic:'c1', kind:'clinic'  },
  ];

  /* ---- Prescribing ---- */
  const pharmacies = [
    { id:'ph1', name:'Unichem Newmarket',            addr:'250 Broadway, Newmarket',        edi:'UNINEW'  },
    { id:'ph2', name:'Chemist Warehouse Sandringham',addr:'482 Sandringham Rd, Sandringham',edi:'CWSAND'  },
    { id:'ph3', name:'Life Pharmacy Takapuna',       addr:'40 Hurstmere Rd, Takapuna',      edi:'LIFETAK' },
    { id:'ph4', name:'Māngere Town Centre Pharmacy', addr:'93 Bader Dr, Māngere',           edi:'MANGTC'  },
    { id:'ph5', name:'Bayview Pharmacy',             addr:'12 Glenfield Rd, Glenfield',     edi:'BAYGLN'  },
  ];

  // `classes` drives allergy checking against the patient's recorded alerts
  const medicines = [
    { id:'m1', name:'Naproxen',           form:'500 mg tablet', dose:'One tablet twice daily with food', classes:['NSAID'],      qty:30, repeats:1, funded:true  },
    { id:'m2', name:'Paracetamol',        form:'500 mg tablet', dose:'Two tablets four times daily as needed', classes:[],       qty:100,repeats:2, funded:true  },
    { id:'m3', name:'Codeine phosphate',  form:'30 mg tablet',  dose:'One tablet up to four times daily', classes:['Opioid','Codeine'], qty:20, repeats:0, funded:true },
    { id:'m4', name:'Amoxicillin',        form:'500 mg capsule',dose:'One capsule three times daily for 7 days', classes:['Penicillin'], qty:21, repeats:0, funded:true },
    { id:'m5', name:'Methotrexate',       form:'10 mg tablet',  dose:'Once weekly — Tuesdays. With folic acid.', classes:['DMARD'], qty:12, repeats:5, funded:true },
    { id:'m6', name:'Omeprazole',         form:'20 mg capsule', dose:'One capsule daily before food', classes:[],                qty:30, repeats:5, funded:true  },
    { id:'m7', name:'Prednisone',         form:'20 mg tablet',  dose:'Reducing course — see instructions', classes:['Steroid'],  qty:30, repeats:0, funded:true  },
    { id:'m8', name:'Celecoxib',          form:'200 mg capsule',dose:'One capsule daily', classes:['NSAID'],                     qty:30, repeats:1, funded:false },
    { id:'m9', name:'Cotrimoxazole',      form:'480 mg tablet', dose:'Two tablets twice daily', classes:['Sulfa'],               qty:20, repeats:0, funded:true  },
  ];

  const prescriptions = [
    { id:'rx1', pt:'p1',  by:'u1', at:'2026-08-02T10:10', med:'m1', pharmacy:'ph2', status:'dispensed', qty:30, repeats:1 },
    { id:'rx2', pt:'p14', by:'u3', at:'2026-09-10T11:30', med:'m5', pharmacy:'ph1', status:'sent',      qty:12, repeats:5 },
    { id:'rx3', pt:'p3',  by:'u1', at:'2026-09-05T09:15', med:'m2', pharmacy:'ph3', status:'dispensed', qty:100,repeats:2 },
  ];

  /* ---- Test requesting ---- */
  const testProviders = [
    { id:'tp-rad1', name:'Auckland Radiology',  kind:'radiology', edi:'AKLRAD'  },
    { id:'tp-rad2', name:'TRG Imaging',         kind:'radiology', edi:'TRGIMG'  },
    { id:'tp-rad3', name:'Horizon Radiology',   kind:'radiology', edi:'HORIZON' },
    { id:'tp-lab1', name:'Awanui Labs',         kind:'pathology', edi:'AWANUI'  },
    { id:'tp-lab2', name:'Medlab Auckland',     kind:'pathology', edi:'MEDLAB'  },
  ];

  const testCatalogue = [
    { id:'t-xr',   kind:'radiology', name:'X-ray',                  prep:'No preparation required', accFundable:true  },
    { id:'t-usg',  kind:'radiology', name:'Ultrasound',             prep:'Fasting may be required for abdominal scans', accFundable:true },
    { id:'t-ct',   kind:'radiology', name:'CT scan',                prep:'Check renal function before contrast', accFundable:true },
    { id:'t-mri',  kind:'radiology', name:'MRI',                    prep:'Screen for implants and pacemaker', accFundable:true },
    { id:'t-dexa', kind:'radiology', name:'DEXA bone density',      prep:'No preparation required', accFundable:false },
    { id:'t-fbc',  kind:'pathology', name:'Full blood count',       prep:'No preparation required', accFundable:false },
    { id:'t-crp',  kind:'pathology', name:'CRP and ESR',            prep:'No preparation required', accFundable:false },
    { id:'t-lft',  kind:'pathology', name:'Liver function tests',   prep:'No preparation required', accFundable:false },
    { id:'t-ue',   kind:'pathology', name:'Urea, creatinine and electrolytes', prep:'No preparation required', accFundable:false },
    { id:'t-hba1c',kind:'pathology', name:'HbA1c',                  prep:'No fasting required', accFundable:false },
    { id:'t-rf',   kind:'pathology', name:'Rheumatoid factor and anti-CCP', prep:'No preparation required', accFundable:false },
    { id:'t-ana',  kind:'pathology', name:'ANA screen',             prep:'No preparation required', accFundable:false },
  ];

  const testRequests = [
    { id:'tr1', pt:'p1',  by:'u1', at:'2026-09-17T08:45', test:'t-mri',  provider:'tp-rad1', urgency:'routine', status:'sent',     note:'Right knee — query medial meniscal tear' },
    { id:'tr2', pt:'p12', by:'u3', at:'2026-09-16T10:20', test:'t-rf',   provider:'tp-lab1', urgency:'urgent',  status:'resulted', note:'Query inflammatory arthritis' },
    { id:'tr3', pt:'p14', by:'u3', at:'2026-09-15T14:00', test:'t-lft',  provider:'tp-lab1', urgency:'routine', status:'resulted', note:'Methotrexate monitoring' },
    { id:'tr4', pt:'p9',  by:'u1', at:'2026-09-14T09:05', test:'t-xr',   provider:'tp-rad2', urgency:'routine', status:'resulted', note:'Right wrist — union check' },
  ];

  // The NHI alphabet omits I and O so they cannot be misread as 1 and 0.
  const NHI_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

  const GST = 0.15;

  window.KORA = {
    TODAY, GST, clinics, staff, clinicians, gps, patients, apptTypes, appts, blocks,
    letters, letterTemplates, inbox, invoices, accQueue, accHistory, tasks, timeline, notes,
    billingCodes, XERO_SYNC, org, timetables, pharmacies, medicines, prescriptions, ENROL_STATUS,
    recalls, problems, consultTypes,
    testProviders, testCatalogue, testRequests,

    /* ---- lookups ---- */
    pt:  id => patients.find(p => p.id === id),
    st:  id => staff.find(s => s.id === id),
    gp:  id => gps.find(g => g.id === id),
    at:  id => apptTypes.find(t => t.id === id),
    cln: id => clinics.find(c => c.id === id),
    ltr: id => letters.find(l => l.id === id),
    med: id => medicines.find(m => m.id === id),
    pharm: id => pharmacies.find(x => x.id === id),
    test: id => testCatalogue.find(t => t.id === id),
    prov: id => testProviders.find(t => t.id === id),
    code: c => billingCodes.find(b => b.code === c),

    NHI_ALPHA,
    /* Outstanding balance — what reception is asked about at the desk. */
    balance: id => {
      const p = patients.find(x => x.id === id);
      if (p && p.bal != null) return p.bal;
      return invoices
        .filter(i => i.pt === id && (i.status === 'sent' || i.status === 'overdue'))
        .reduce((sum, i) => sum + i.items.reduce((a, x) => a + x.q * x.p, 0) * (1 + GST), 0);
    },
    /* "BRADY, Thomas (Tom)" — surname first, preferred name in brackets. */
    displayName: p => `${p.last.toUpperCase()}, ${p.first}${p.preferred ? ` (${p.preferred})` : ''}`,
    /* NZ NHI validation — old AAANNNN format, modulus 11 check digit. */
    nhiCheck(raw) {
      const v = String(raw || '').toUpperCase().trim();
      if (!v) return { state: 'empty' };
      if (/[IO]/.test(v)) return { state: 'bad', why: 'NHI numbers never contain the letters I or O.' };
      if (!/^[A-Z]{3}\d{4}$/.test(v)) return { state: 'partial', why: 'Three letters, then four digits.' };
      let total = 0;
      for (let i = 0; i < 6; i++) {
        const ch = v[i];
        let val;
        if (/[A-Z]/.test(ch)) {
          val = NHI_ALPHA.indexOf(ch) + 1;
          if (val <= 0) return { state: 'bad', why: 'That letter is not used in NHI numbers.' };
        } else {
          val = Number(ch);          // a digit may legitimately be 0
        }
        total += val * (7 - (i + 1));
      }
      const rem = total % 11;
      if (rem === 0) return { state: 'bad', why: 'Check digit does not match — re-read the NHI.' };
      const cd = (11 - rem) === 10 ? 0 : 11 - rem;
      return cd === Number(v[6])
        ? { state: 'ok', nhi: v }
        : { state: 'bad', why: `Check digit does not match — did you mean ${v.slice(0, 6)}${cd}?` };
    },

    /* Medicines whose class matches something in the patient's allergy list. */
    allergyClash: (ptId, medId) => {
      const p = patients.find(x => x.id === ptId), m = medicines.find(x => x.id === medId);
      if (!p || !m) return null;
      for (const alert of p.alerts) {
        const hit = m.classes.find(c => alert.toLowerCase().includes(c.toLowerCase()));
        if (hit) return { cls: hit, alert };
      }
      return null;
    },

    ptName: id => { const p = patients.find(x => x.id === id); return p ? `${p.first} ${p.last}` : '—'; },
    ptInitials: id => { const p = patients.find(x => x.id === id); return p ? (p.first[0] + p.last[0]) : '?'; },
  };
})();
