import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/login";
import Todolist from "./components/todolist";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/todos" element={<Todolist />} />
      </Routes>
    </Router>
  );
}

export default App;
