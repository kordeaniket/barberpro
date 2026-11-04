import { Routes, Route, Navigate } from 'react-router-dom'; import { useSelector } from 'react-redux';
import Login from './pages/Login'; import Admin from './pages/Admin'; import Barber from './pages/Barber'; import Customer, { ShopPage } from './pages/Customer'; import ChangePassword from './pages/ChangePassword';
const Guard = ({ role, children }) => { const u = useSelector((s) => s.auth.user); if (!u || u.role !== role) return <Navigate to="/login" />; return u.mustChangePassword ? <ChangePassword /> : children; };
export default function App() {
  return <Routes><Route path="/login" element={<Login />} /><Route path="/s/:code" element={<ShopPage />} />
    <Route path="/admin/*" element={<Guard role="superadmin"><Admin /></Guard>} /><Route path="/barber/*" element={<Guard role="barber"><Barber /></Guard>} />
    <Route path="/customer" element={<Guard role="customer"><Customer /></Guard>} /><Route path="*" element={<Navigate to="/login" />} /></Routes>;
}
