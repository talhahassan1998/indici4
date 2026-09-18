import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Shell, { ROLES } from './components/Shell.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import { UiProvider, useUi } from './lib/ui.jsx';
import { useTheme, useLocalState } from './lib/theme.js';
import { Skeleton } from './components/Primitives.jsx';

import Dashboard from './views/Dashboard.jsx';
import Patients from './views/Patients.jsx';
import Consult from './views/Consult.jsx';
import PatientWorkspace from './views/PatientWorkspace.jsx';
import Appointments from './views/Appointments.jsx';
import Letters from './views/Letters.jsx';
import LetterEditor from './views/LetterEditor.jsx';
import InboxView from './views/InboxView.jsx';
import Tasks from './views/Tasks.jsx';
import Billing from './views/Billing.jsx';
import Acc from './views/Acc.jsx';
import Reports from './views/Reports.jsx';
import Admin from './views/Admin.jsx';
/* The design system is a reference page, not part of the daily workflow — load it on demand. */
const StyleGuide = lazy(() => import('./views/StyleGuide.jsx'));

function Inner() {
  const nav = useNavigate();
  const { toast } = useUi();
  const [theme, toggleTheme] = useTheme();
  const [role, setRole] = useLocalState('kora.role', 'clinician');
  const [rail, setRail] = useLocalState('kora.rail', false);
  const [palette, setPalette] = useState(false);

  const roleUser = ROLES[role].user;

  return (
    <>
      <Shell role={role} setRole={r => { setRole(r); toast(`Now viewing as ${ROLES[r].label}`, ROLES[r].desc, 'info'); }}
        theme={theme} toggleTheme={toggleTheme} rail={rail} setRail={setRail}
        onPalette={() => setPalette(true)}>
        <Suspense fallback={<div className="page"><Skeleton rows={5} /></div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard role={role} userId={roleUser} />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patient/:id" element={<PatientWorkspace />} />
            <Route path="/patient/:id/:tab" element={<PatientWorkspace />} />
            <Route path="/consult/:id" element={<Consult />} />
            <Route path="/inbox" element={<InboxView />} />
            <Route path="/letters" element={<Letters />} />
            <Route path="/letter/:id" element={<LetterEditor />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/acc" element={<Acc />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/:section" element={<Admin />} />
            <Route path="/styleguide" element={<StyleGuide />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Shell>
      {palette && (
        <CommandPalette onClose={() => setPalette(false)} nav={nav}
          theme={theme} toggleTheme={toggleTheme} toast={toast} />
      )}
    </>
  );
}

export default function App() {
  return <UiProvider><Inner /></UiProvider>;
}
