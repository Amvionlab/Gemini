import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { baseURL } from "../../config.js";
import { UserContext } from "../UserContext/UserContext";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Switch } from "@mui/material";
import "./Access.css";

const Form = () => {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${baseURL}/backend/fetchAccess.php`);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const ToggleSwitch = ({ value, onChange }) => {
    return (
      <label className="switch">
        <input
          type="checkbox"
          className="input"
          checked={value === "1"}
          onChange={onChange}
        />
        <span className="slider"></span>
      </label>
    );
  };

  const handleToggle = async (userId, field, currentValue) => {
    const newValue = currentValue === "1" ? "0" : "1";

    // Update the state locally
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, [field]: newValue } : user
      )
    );

    // Send the update to the server
    try {
      const response = await fetch(`${baseURL}/backend/updateAccess.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          field: field,
          value: newValue,
        }),
      });

      if (response.ok) {
        toast.success("Update successful");
      } else {
        toast.error("Update failed");
      }
    } catch (error) {
      console.error("Error updating data:", error);
      toast.error("Update failed");
    }
  };

  return (
    <div className="bg-second w-full relative text-xs mx-auto lg:overflow-y-hidden h-full ticket-scroll p-0.5">
      <div className="w-full h-full bg-box p-5 rounded-lg font-medium">
        <div className="ticket-table mt-8">
          <h2 className="text-2xl font-bold text-prime mb-5">
            <span>Access Matrix </span>
          </h2>


          <TableContainer >
            <Table className="min-w-full" aria-label="simple table">
              <TableHead>
                <TableRow>
                  {[
                    "Id",
                    "Name",
                    "Dashboard",
                    "Ticket Create",
                    "Analytics",
                    "Ticket Action",
                    "Single Ticket",
                    "Admin",
                    "Assign",
                    "Active",
                  ].map((header, index) => (
                    <TableCell key={index} align="center" sx={{ padding: '10px', fontSize: '14px' }}>
                      <p className="font-bold">{header}</p>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-gray-100 bg-box text-fontadd text-center font-medium"
                  >
                    <TableCell align="center" sx={{ padding: '4px', fontSize: '12px' }}>{user.id}</TableCell>
                    <TableCell align="center" sx={{ padding: '4px', fontSize: '12px' }}>{user.name}</TableCell>
                    {["dashboard", "ticket", "analytics", "ticketaction", "singleticket", "creation", "assign", "is_active"].map((field) => (
                      <TableCell key={field} align="center" sx={{ padding: '4px', fontSize: '12px' }}>
                        <Switch className="text-flo"
                          checked={user[field] === "1"}
                          onChange={() => handleToggle(user.id, field, user[field])}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>


        </div>
      </div>
    </div>
  );
};

export default Form;
