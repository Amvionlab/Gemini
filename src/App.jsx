import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Side from "./components/Side/Side";
import Header from "./components/Header/Header";
import Ticket from "./components/Ticket/Ticket";
import User from "./components/Admin/User";
import Department from "./components/Admin/Department";
import Client from "./components/Admin/Client";
import Customer from "./components/Admin/Customer";
import Employee from "./components/Admin/Employee";
import Vendor from "./components/Admin/Vendor";
import Domain from "./components/Admin/Domain";
import SubDomain from "./components/Admin/SubDomain";
import Location from "./components/Admin/Location";
import RCA from "./components/Admin/RCA";
import Sla from "./components/Admin/Sla";
import Ticket_noc from "./components/Admin/Ticket_noc";
import Access from "./components/Admin/Access";
import Ticket_status from "./components/Admin/Ticket_status";
import Ticket_service from "./components/Admin/Ticket_service";
import Ticket_type from "./components/Admin/Ticket_type";

import SingleTicket from "./components/SingleTicket/SingleTicket";
import DashBoard from "./components/DashBoard/DashBoard";
import Login from "./components/Login/Login";
import ChangePass from "./components/Login/Change_pass"; // Ensure correct import
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserContext } from "../src/components/UserContext/UserContext";
import { TicketProvider } from "../src/components/UserContext/TicketContext";
import Analytics from "../src/components/Analytics/Analytics";
import Reports from "../src/components/Reports/Reports";
import Setup from "../src/components/Setup/Setup";

const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

function App() {
  const { user, setUser } = useContext(UserContext);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );
  const [open, setOpen] = useState(false);
  const timeoutIdRef = useRef(null);

  const resetTimeout = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    timeoutIdRef.current = setTimeout(() => {
      setIsAuthenticated(false);
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }, INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("isAuthenticated", "true");
      resetTimeout();

      const events = [
        "mousemove",
        "mousedown",
        "keypress",
        "scroll",
        "touchstart",
      ];
      const resetUserTimeout = () => resetTimeout();

      events.forEach((event) =>
        window.addEventListener(event, resetUserTimeout)
      );

      return () => {
        events.forEach((event) =>
          window.removeEventListener(event, resetUserTimeout)
        );
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
      };
    } else {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("user");
    }
  }, [isAuthenticated, resetTimeout, setUser]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    toast.success("Logged in successfully!");
  };

  return (
    <Router>
      <ToastContainer />
      {isAuthenticated ? (
        <>
          <div className="main-content flex overflow-y-hidden">
            <Side />
            <div className="flex-1 md:overflow-y-auto pt-12 h-screen">
              <Header />
              <TicketProvider>
                <Routes>
                  <Route path="/password-change" element={<ChangePass />} />
                  {user && user.creation === "1" && (
                    <Route path="*" element={<Navigate to="/setup" />} />
                  )}
                  {user && user.creation === "0" && (
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  )}
                  {user && user.ticket === "1" && (
                    <Route path="/ticket" element={<Ticket />} />
                  )}
                  {user && user.singleticket === "1" && (
                    <>
                      <Route path="/singleticket" element={<SingleTicket />} />
                      <Route path="/" element={<DashBoard />} />
                    </>
                  )}
                  {user && user.dashboard === "1" && (
                    <Route path="/dashboard" element={<DashBoard />} />
                  )}
                  {user && user.analytics === "1" && (
                    <Route path="/reports" element={<Reports />} />
                  )}
                  {user && user.analytics === "1" && (
                    <Route path="/analytics" element={<Analytics />} />
                  )}
                  {user && user.creation === "1" && (
                    <>
                      <Route path="/setup" element={<Setup />} />
                      <Route path="/admin/user" element={<User />} />
                      <Route path="/admin/client" element={<Client />} />
                      <Route path="/admin/customer" element={<Customer />} />
                      <Route path="/admin/employee" element={<Employee />} />
                      <Route path="/admin/vendor" element={<Vendor />} />
                      <Route path="/admin/access" element={<Access />} />
                      <Route
                        path="/admin/department"
                        element={<Department />}
                      />
                      <Route path="/admin/sla" element={<Sla />} />
                      <Route path="/admin/domain" element={<Domain />} />
                      <Route path="/admin/rca" element={<RCA />} />
                      <Route path="/admin/location" element={<Location />} />
                      <Route
                        path="/admin/ticket_status"
                        element={<Ticket_status />}
                      />
                      <Route
                        path="/admin/ticket_service"
                        element={<Ticket_service />}
                      />
                      <Route
                        path="/admin/ticket_type"
                        element={<Ticket_type />}
                      />
                      <Route
                        path="/admin/ticket_noc"
                        element={<Ticket_noc />}
                      />
                      <Route path="/admin/subdomain" element={<SubDomain />} />
                    </>
                  )}
                </Routes>
              </TicketProvider>
            </div>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
          <Route path="password-change" element={<ChangePass />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
