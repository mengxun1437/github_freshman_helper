import "./App.css";
import { Routes, Route } from "react-router-dom";
import { Index } from "./pages/Index";
import { Admin } from "./pages/Admin";
import { IssueLabel } from './pages/IssueLabel';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path='/admin' element={<Admin />} />
      <Route path='/label/:issueId' element={<IssueLabel />} />
    </Routes>
  );
}

export default App;
