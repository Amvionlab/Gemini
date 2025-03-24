import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./DashBoard.css";
import { backendPort, baseURL } from "../../config.js";
import { encryptURL } from "../../urlEncrypt";
import { UserContext } from "../UserContext/UserContext";
import { useTicketContext } from "../UserContext/TicketContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { seriesProviderUtils } from "@mui/x-charts/internals";

const App = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const { user } = useContext(UserContext);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [ticketToMove, setTicketToMove] = useState(null);
  const [targetColumnId, setTargetColumnId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const { setTicketId } = useTicketContext();
  const [activeTypeId, setActiveTypeId] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [docket, setDocket] = useState("");
  const scrollContainerRef = useRef();
  const [selectedRCA, setSelectedRCA] = useState("");
  const [rcaList, setRcaList] = useState([]);
  const { ticketId: selectedTicketId } = useTicketContext();
  const [selectedBranch, setSelectedBranch] = useState(""); // Store selected branch
  const [search, setSearch] = useState(""); // Search input state
  const [showDropdown, setShowDropdown] = useState(false); // Control dropdown visibility
  const [fundAmount, setFundAmount] = useState("");
  const [reqfund, setreqFund] = useState("");
  console.log("reqfund", reqfund);
  const uniqueBranches = [...new Set(tickets.map((ticket) => ticket.customer_branch))];
  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchStatusData();
      await fetchTicketTypes();
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (ticketTypes.length > 0) {
      const storedTypeId = localStorage.getItem("activeTypeId");

      if (storedTypeId) {
        setActiveTypeId(storedTypeId);
        fetchTickets(storedTypeId);
      } else {
        const initialTypeId = ticketTypes[0].id;
        setActiveTypeId(initialTypeId);
        fetchTickets(initialTypeId);
      }
    }
  }, [ticketTypes]);
  

  const fetchTickets = async (value) => {
    try {
      let response;
      if (user && user.accessId === "2") {
        response = await fetch(
          `${baseURL}backend/update_status.php?user=${user.userId}&type=${value}`
        );
      } else if (user && user.accessId === "5") {
        response = await fetch(
          `${baseURL}backend/update_status.php?support=${user.userId}&type=${value}`
        );
      } 
      else if (user && user.accessId === "4") {
        response = await fetch(
          `${baseURL}backend/update_status.php?manager=${user.userId}&type=${value}`
        );
      }else {
        response = await fetch(
          `${baseURL}backend/update_status.php?type=${value}`
        );
      }

      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const fetchStatusData = async () => {
    try {
      const response = await fetch(`${baseURL}backend/get_status.php`);
      const data = await response.json();
      setStatusData(data);
    } catch (error) {
      console.error("Error fetching status data:", error);
    }
  };

  const fetchUpdatedFund = async (ticketId) => {
    console.log("Fetching fund amount for ticket ID:", ticketId); // Debugging

    try {
        const response = await fetch(`${baseURL}backend/getFundAmt.php?ticket_id=${ticketId}`);
        const data = await response.json();

        console.log("API Response:", data); // Debugging

        if (data.success) {
            setFundAmount(data.fund_raised); // Update state
        } else {
            console.error("Error fetching fund amount:", data.error);
        }
    } catch (error) {
        console.error("Network error fetching fund amount:", error);
    }
};

  const fetchTicketTypes = async () => {
    try {
      const response = await fetch(`${baseURL}backend/fetchTicket_type.php`);
      const data = await response.json();
      setTicketTypes(data);
    } catch (error) {
      console.error("Error fetching ticket types:", error);
    }
  };

  const handleButtonClick = useCallback((typeId) => {
    setActiveTypeId(typeId);
    fetchTickets(typeId);
    localStorage.setItem("activeTypeId", typeId);
  }, []);

  const columns = statusData.map((status) => ({
    id: status.id.toString(),
    title: status.status,
  }));

  const handleDragStart = useCallback((e, ticket) => {
    e.dataTransfer.setData("ticketId", ticket.id);
    e.dataTransfer.setData("fromStatus", ticket.status);
    setDraggedItem(ticket);
    setFundAmount("");
  }, []);

  
    // Fetch RCA data on mount
    useEffect(() => {
      const fetchRcaData = async () => {
        try {
          const response = await fetch(`${baseURL}Backend/fetchRca.php`);
          const data = await response.json();
          setRcaList(data);
        } catch (error) {
          console.error("Error fetching RCA data:", error);
        }
      };
      fetchRcaData();
    }, []);

    const targetColumnTitle = columns.find((col) => col.id === targetColumnId)?.title;
    const draggedTicket = tickets.find((t) => t.id === ticketToMove?.ticketId);

    console.log("Target Column:", targetColumnTitle);
    console.log("Ticket being moved:", ticketToMove);
    console.log("Dragged Ticket:", draggedTicket);
    

    const handleDrop = useCallback((e, columnId) => {
      e.preventDefault();
      if (draggedItem) {
        const fromStatus = e.dataTransfer.getData("fromStatus");
    
        if (columnId === "2") {
          handleViewTicket(draggedItem.id);
        } else {
          setTicketToMove({ ticketId: draggedItem.id, fromStatus, columnId });
          setTargetColumnId(columnId);
          setIsPopupOpen(true);
          setDraggedItem(null);
          setreqFund();
          // Reset fund amount for new tickets in Fund Req
          if (columnId === "Fund Req") {
            setFundAmount("");
          }
        }
      }
    }, [draggedItem]);
    

    const handleConfirmMove = async () => {
      if (ticketToMove) {
        const { ticketId, fromStatus, columnId } = ticketToMove;
    
        let updatedFundAmount = columnId === "Fund Req" ? fundAmount * 10 : null;
    
        await updateStatus(ticketId, columnId, updatedFundAmount);
        await logTicketMovement(ticketId, fromStatus, columnId);
    
        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket.id === ticketId
              ? { ...ticket, status: columnId, fundAmount: updatedFundAmount }
              : ticket
          )
        );
      }
    
      setIsPopupOpen(false);
      setTicketToMove(null);
      setTargetColumnId(null);
      fetchTickets(activeTypeId);
    };
  
  const handleCancelMove = () => {
    setIsPopupOpen(false);
    setTicketToMove(null);
    setTargetColumnId(null);
  };

  const handleConfirm = async () => {
    if (!ticketToMove) {
        console.error("Error: ticketToMove is undefined!");
        toast.error("Error: No ticket selected.");
        return;
    }

    const { ticketId, fromStatus, columnId } = ticketToMove;

    if (!ticketId) {
        console.error("Error: Ticket ID is missing!");
        toast.error("Error: Ticket ID not found.");
        return;
    }

    if (targetColumnTitle === "Closed" && !selectedRCA) {
        toast.warn("Please select an RCA before closing the ticket.");
        return;
    }

    const requestData = {
        ticket_id: ticketId,
        rca_id: selectedRCA,
        move_date: selectedDate,
        docket: docket,
        done_by: user?.name || "System",
    };

    try {
        const response = await fetch(`${baseURL}Backend/updateTicketRca.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
        });

        const text = await response.text();
        try {
            const result = JSON.parse(text);
            if (result.success) {
                toast.success("Ticket RCA updated successfully.");
                await updateStatus(ticketId, columnId);
                await logTicketMovement(ticketId, fromStatus, columnId);
                setTickets((prevTickets) =>
                    prevTickets.map((ticket) =>
                        ticket.id === ticketId ? { ...ticket, status: columnId } : ticket
                    )
                );
                fetchTickets(activeTypeId);
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (jsonError) {
            console.error("Invalid JSON response:", text);
            toast.error("Error: Invalid server response. Check console.");
        }
    } catch (error) {
        console.error("Error updating ticket:", error);
        toast.error("Error updating ticket. Try again.");
    }

    setIsPopupOpen(false);
    setTicketToMove(null);
    setTargetColumnId(null);
};

  const updateStatus = async (itemId, newColumnId) => {
    try {
      const response = await fetch(`${baseURL}backend/update_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ id: itemId, status: newColumnId }),
      });

      if (!response.ok) {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const logTicketMovement = async (ticketId, fromStatus, toStatus) => {
    try {
      const params = new URLSearchParams({
        tid: ticketId,
        from_status: fromStatus,
        to_status: toStatus,
        done_by: user.userId,
        date: selectedDate || null
      });

      const response = await fetch(
        `${baseURL}backend/log_ticket_movement.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        }
      );

      if (!response.ok) {
        console.error("Failed to log movement");
      }
    } catch (error) {
      console.error("Error logging movement:", error);
    }
  };

  const handleViewTicket = (ticketId) => {
    setTicketId(ticketId);
    navigate("/singleticket");
  };

  const scrollLeft = () => {
    scrollContainerRef.current.scrollBy({
      top: 0,
      left: -2000,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    scrollContainerRef.current.scrollBy({
      top: 0,
      left: 2000,
      behavior: "smooth",
    });
  };

 
  const filteredBranches =
  search.trim() === ""
    ? uniqueBranches.filter((branch) => branch) // Filter out null/undefined branches
    : uniqueBranches.filter((branch) => branch && branch.toLowerCase().includes(search.toLowerCase()));

    const handleFundRequest = async () => {
      if (!ticketToMove) {
          console.error("Error: No ticket selected!");
          toast.error("Error: No ticket selected.");
          return;
      }
  
      const { ticketId, fromStatus, columnId } = ticketToMove;
  
      if (!ticketId) {
          console.error("Error: Ticket ID is missing!");
          toast.error("Error: Ticket ID not found.");
          return;
      }
  
      if (!fundAmount) {
          toast.warn("Please enter a valid fund amount.");
          return;
      }
  
      const todayDate = new Date().toISOString().split("T")[0]; // Get current date (YYYY-MM-DD)
  
      const requestData = {
          ticket_id: ticketId,
          fund_amount: fundAmount * 10, // Multiply by 10 before sending
          move_date: todayDate, // Use today's date
          done_by: user?.name || "System",
      };
  
      try {
          const response = await fetch(`${baseURL}Backend/updatefundamt.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestData),
          });
  
          const text = await response.text();
          try {
              const result = JSON.parse(text);
              if (result.success) {
                  toast.success("Fund amount updated successfully.");
                  await updateStatus(ticketId, columnId);
                  await logTicketMovement(ticketId, fromStatus, columnId);
                  setTickets((prevTickets) =>
                      prevTickets.map((ticket) =>
                          ticket.id === ticketId
                              ? { ...ticket, status: columnId, fundAmount: requestData.fund_amount }
                              : ticket
                      )
                  );
                  fetchTickets(activeTypeId);
              } else {
                  toast.error(`Error: ${result.error}`);
              }
          } catch (jsonError) {
              console.error("Invalid JSON response:", text);
              toast.error("Error: Invalid server response. Check console.");
          }
      } catch (error) {
          console.error("Error updating fund amount:", error);
          toast.error("Error updating fund amount. Try again.");
      }
      setFundAmount("");
      setIsPopupOpen(false);
      setTicketToMove(null);
      setTargetColumnId(null);
  };
  
  const handleApprovedAmount = async () => {
    if (!ticketToMove) {
        console.error("Error: No ticket selected!");
        toast.error("Error: No ticket selected.");
        return;
    }

    const { ticketId } = ticketToMove;

    if (!ticketId) {
        console.error("Error: Ticket ID is missing!");
        toast.error("Error: Ticket ID not found.");
        return;
    }

    if (!fundAmount) {
        toast.warn("Please enter a valid fund amount.");
        return;
    }

    const requestData = {
        ticket_id: ticketId,
        fund_amount: fundAmount, // Use the updated fund amount
        done_by: user?.name || "System",
    };

    try {
        const response = await fetch(`${baseURL}Backend/updateapprovedamt.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
        });

        const text = await response.text();
        try {
            const result = JSON.parse(text);
            if (result.success) {
                toast.success("Approved fund amount updated successfully.");

                // Update fund_approved in UI without changing other fields
                setTickets((prevTickets) =>
                    prevTickets.map((ticket) =>
                        ticket.id === ticketId
                            ? { ...ticket, fund_approved: requestData.fund_amount }
                            : ticket
                    )
                );

                fetchTickets(activeTypeId); // Refresh tickets
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (jsonError) {
            console.error("Invalid JSON response:", text);
            toast.error("Error: Invalid server response. Check console.");
        }
    } catch (error) {
        console.error("Error updating approved fund amount:", error);
        toast.error("Error updating approved fund amount. Try again.");
    }

    setIsPopupOpen(false);
    setTicketToMove(null);
    setTargetColumnId(null);
};


  return (
    <div className="bg-second p-0.5 h-full">
    <div className="bg-box h-full">
      <div className="flex justify-between items-center">
        <div className="header-left">
          <h1 className="text-2xl px-3 text-sky-600 font-semibold font-raleway">
            Welcome {user.firstname}!
          </h1>
        </div>

        <div className="ml-10">
        
        <input
          type="text"
          id="branchFilter"
          className="border-2 border-flo rounded p-1 w-40 text-xs mt-1"
          placeholder="Search branch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          autocomplete="off"
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
        />

        {showDropdown && (
          <ul className="absolute left-80 w-80 bg-white border rounded-md shadow-lg max-h-80 text-xs text-prime font-semibold overflow-y-auto mt-1 z-10">
            <li
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => {
                setSelectedBranch("");
                setSearch("");
              }}
            >
              All Branches
            </li>
            {filteredBranches.map((branch, index) => (
              <li
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={() => {
                  setSelectedBranch(branch);
                  setSearch(branch);
                }}
              >
                {/* Bold matching letters */}
                {branch.split("").map((char, i) => (
                  <span key={i} className={search.toLowerCase().includes(char.toLowerCase()) ? "font-bold text-blue-600" : ""}>
                    {char}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
        </div>

        <div className="m-2 flex-row-reverse header-right items-center">
          
          <div className="ml-4">

            {ticketTypes.map((type) => (
              <Button
                key={type.id}
                variant="contained"
                style={{
                  marginRight: "10px",
                  color: "white",
                  background: activeTypeId === type.id ? "#004080" : "#071A30",
                }}
                onClick={() => handleButtonClick(type.id)}
              >
                {type.type}
              </Button>
            ))}
          </div>
        </div>
        <div className="clearfix"></div>
      </div>
      <div className="relative h-5/6">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto whitespace-nowrap p-0 h-full overflow-y-auto"
        >
          {/* Ticket Columns */}
      <div className="flex-grow max-h-full flex items-start relative">
        {columns.map((column) => (
          <div
            key={column.id}
            id={column.id}
            className="column bg-box border shadow-xl"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <h2 className="mb-2 text-prime text-center text-xl font-semibold uppercase">
              {column.title}
              
            </h2>
            <div className="column-content mb-2">
              {tickets
                .filter((ticket) => ticket.status === column.id)
                .filter((ticket) => (selectedBranch ? ticket.customer_branch === selectedBranch : true)) // Apply filter
                .map((ticket) => (
                  <div
                    key={ticket.id}
                    
                    className={
                      ticket.color === "3"
                        ? "draggable shadow-sm shadow-red-700 hover:shadow-md mb-4 hover:shadow-red-700 text-[red]"
                        : ticket.color === "2"
                        ? "draggable shadow-sm shadow-yellow-600 hover:shadow-md hover:shadow-yellow-600 mb-4 text-yellow-600"
                        : "draggable shadow-sm shadow-green-500 hover:shadow-md hover:shadow-green-500 mb-4 text-green-700"
                    }
                    draggable
                    onDragStart={
                      user && user.ticketaction === "1"
                        ? (e) => handleDragStart(e, ticket)
                        : null
                    }
                    onClick={() => handleViewTicket(ticket.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p
                          className="font-semibold text-prime font-poppins truncate"
                          
                        >   
                          {ticket.ticket_customer_value}
                          
                        </p>
                        <p className="truncate" title={ticket.customer_branch}>
                          {ticket.customer_branch}
                         
                        </p>
                      </div>
                      <div className="rounded-md pr-1 w-6 h-6 min-w-6 flex items-center justify-center">
                        <span className="font-semibold">#{ticket.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
        </div>
        <button
          className="scroll-button absolute left-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-black/10 rounded-full text-2xl"
          onClick={scrollLeft}
          style={{ zIndex: "10" }}
        >
          &lt;
        </button>
        <button
          className="scroll-button absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-black/10 rounded-full text-2xl"
          onClick={scrollRight}
          style={{ zIndex: "10" }}
        >
          &gt;
        </button>
      </div>

      {user && user.ticketaction === "1" && (
        <Dialog open={isPopupOpen} onClose={handleCancelMove} aria-labelledby="alert-dialog-title">
          <DialogTitle id="alert-dialog-title">{"Confirm Move"}</DialogTitle>
          <DialogContent>
  <DialogContentText>
    {`Do you want to move to ${targetColumnTitle}?`}
    <br />
    <br />
  </DialogContentText>

  {/* Only show date picker if NOT moving to Fund Req */}
  {targetColumnTitle !== "Fund Req" && (
    <TextField
      label="Select Date"
      type="datetime-local"
      fullWidth
      margin="dense"
      InputLabelProps={{ shrink: true }}
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
    />
  )}

  {/* RCA & Docket for Closed */}
  {targetColumnTitle === "Closed" && (
    <>
      <FormControl fullWidth margin="dense">
        <InputLabel>Select RCA</InputLabel>
        <Select value={selectedRCA} onChange={(e) => setSelectedRCA(e.target.value)}>
          {rcaList.map((rca) => (
            <MenuItem key={rca.id} value={rca.id}>
              {rca.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Docket No :"
        type="text"
        fullWidth
        margin="dense"
        InputLabelProps={{ shrink: true }}
        onChange={(e) => setDocket(e.target.value)}
      />
    </>
  )}

  {/* Fund Req Input */}
  {targetColumnTitle === "Fund Req" && (
  <div className="flex items-center gap-2 mt-4 w-60"> 
    {/* Enter Amount */}
    <TextField
      label="Enter Km"
      type="number"
      variant="outlined"
      value={fundAmount}
      onChange={(e) => setFundAmount(e.target.value)}
      InputLabelProps={{ shrink: true }}
    />

    <span className="text-xl font-bold">=</span>

    {/* Total Amount */}
    <TextField
      label="Amount"
      type="number"
      variant="outlined"
      value={fundAmount ? fundAmount * 10 : ""}
      InputProps={{ readOnly: true }}
      InputLabelProps={{ shrink: true }}
    />
  </div>
)}

{targetColumnTitle === "Approved" && draggedTicket && (
  <div className="flex items-center gap-2 mt-4 w-60">
    <TextField
      label="Requested Amt"
      type="number"
      variant="outlined"
      value={draggedTicket.fund_raised || ""}
      disabled
      InputLabelProps={{ shrink: true }}
    />
    <TextField
      label="Approved Amt"
      type="number"
      variant="outlined"
      onChange={(e) => setFundAmount(e.target.value)}
      InputLabelProps={{ shrink: true }}
    />
    <button onClick={() => fetchUpdatedFund(draggedTicket.id)}></button>
  </div>
)}

 
</DialogContent>

<DialogActions>
  <Button
    onClick={() => {
      if (targetColumnTitle === "Closed") {
        handleConfirm();
      } else if (targetColumnTitle === "Fund Req") {
        handleFundRequest();
      } else if (targetColumnTitle === "Approved") {
        handleConfirmMove(); // Save changes when moving to Approved
        handleApprovedAmount(); // Post updated fund amount
      } else {
        handleConfirmMove();
      }
    }}
    disabled={
      (targetColumnTitle === "Closed" && !selectedRCA) ||
      (targetColumnTitle === "Fund Req" && !fundAmount)
    }
    autoFocus
  >
    Yes
  </Button>
  <Button onClick={handleCancelMove}>No</Button>
</DialogActions>


        </Dialog>
      )}
    </div>
    </div>
  );
};

export default App;