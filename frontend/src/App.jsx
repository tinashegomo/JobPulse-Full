import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useForegroundMessages } from './hooks/useForegroundMessages';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Toast from './components/shared/Toast';
import Home from './pages/Home';
import Alerts from './pages/Alerts';
import Login from './pages/Login';
import Register from './pages/Register';

const App = () => {
  const { messages, dismiss } = useForegroundMessages();

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/alerts" element={<Alerts />} />
            </Route>
          </Route>
        </Routes>

        {messages.map((msg, i) => (
          <Toast
            key={msg.receivedAt}
            title={msg.title}
            body={msg.body}
            url={msg.url}
            onClose={() => dismiss(i)}
          />
        ))}
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
