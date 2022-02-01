import "./App.css";
import { Routes, Route } from "react-router-dom";
import { Index } from "./pages/Index";
import { Issue } from './pages/Issue';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/issue" element={<Issue />} />
      <Route path="/issue/:issueId" element={<Issue />} />
    </Routes>
  );
}

export default App;
