import "./App.css";
import { Routes, Route  } from "react-router-dom";
import { Index } from "./pages/Index";
import { Admin } from "./pages/Admin";
import { IssueLabel } from './pages/IssueLabel';
import { Log } from "./pages/Log";
import { Login } from "./pages/Login";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path='/admin' element={<Admin />} />
      <Route path='/label/:issueId' element={<IssueLabel />} />
      <Route path='/log/:logId' element={<Log />} />
    </Routes>
  );
}

export default App;
