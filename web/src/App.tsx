import "./App.css";
import { Routes, Route } from "react-router-dom";
import { Index } from "./pages/Index";
import { Issue } from './pages/Issue';
import { Log } from "./pages/Log";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/issue" element={<Issue />} />
      <Route path="/log/:type/:sourceId" element={<Log />} />
      <Route path="/issue/:issueId" element={<Issue />} />
    </Routes>
  );
}

export default App;
