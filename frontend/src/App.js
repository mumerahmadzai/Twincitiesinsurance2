import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import CarrierShareView from "./pages/CarrierShareView";

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/share/:token" element={<CarrierShareView />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
