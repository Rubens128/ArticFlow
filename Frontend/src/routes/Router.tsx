import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Chats from "../pages/Main/Main";
import Friends from "../pages/Friends/Friends"

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/friends" element={ <Friends />} />
      </Routes>
    </BrowserRouter>
  );
}
