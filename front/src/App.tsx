// App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Survey from './pages/Survey';
import Results from './pages/Results';
import Employees from './pages/Employees';
import Notifications from './pages/Notifications';
import { ToastContainer } from './components/ToastContainer';
import { ToastProvider } from './contexts/ToastContext'; // Мы создадим этот контекст

function App() {
  return (
    <ToastProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/survey" element={<Survey />} />
            <Route path="/results" element={<Results />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </Layout>
        <ToastContainer />
      </Router>
    </ToastProvider>
  );
}

export default App;