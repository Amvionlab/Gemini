import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./DashBoard.css";
import { backendPort, baseURL } from "../../config.js";
import { encryptURL } from "../../urlEncrypt";
import { UserContext } from "../UserContext/UserContext";
import { useTicketContext } from "../UserContext/TicketContext";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";

const ConfirmationPopup = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{"Confirm Move"}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onConfirm} autoFocus>
          Yes
        </Button>
        <Button onClick={onCancel}>No</Button>
      </DialogActions>
    </Dialog>
  );
};

const App = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const { user } = useContext(UserContext);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [ticketToMove, setTicketToMove] = useState(null);
  const [targetColumnId, setTargetColumnId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null); // Add draggedItem state
  const { setTicketId } = useTicketContext();
  const [activeTypeId, setActiveTypeId] = useState(null); // Initialize to null

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchStatusData();
      await fetchTicketTypes();
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (ticketTypes.length > 0) {
      // Check if there is a stored activeTypeId in localStorage
      const storedTypeId = localStorage.getItem("activeTypeId");

      if (storedTypeId) {
        setActiveTypeId(storedTypeId); // Use the stored value
        fetchTickets(storedTypeId);
      } else {
        const initialTypeId = ticketTypes[0].id;
        setActiveTypeId(initialTypeId); // Use the first ticket type
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
      } else {
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

  const fetchTicketTypes = async () => {
    try {
      const response = await fetch(`${baseURL}backend/fetchTicket_type.php`);
      const data = await response.json();
      setTicketTypes(data);
    } catch (error) {
      console.error("Error fetching ticket types:", error);
    }
  };

  const handleButtonClick = (typeId) => {
    setActiveTypeId(typeId);
    fetchTickets(typeId);
    // Store the selected activeTypeId in localStorage
    localStorage.setItem("activeTypeId", typeId);
  };

  const columns = statusData.map((status) => ({
    id: status.id.toString(),
    title: status.status,
  }));

  const handleDragStart = (e, ticket) => {
    e.dataTransfer.setData("ticketId", ticket.id);
    e.dataTransfer.setData("fromStatus", ticket.status);
    setDraggedItem(ticket); // Save the dragged item
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (draggedItem) {
      const fromStatus = e.dataTransfer.getData("fromStatus");
      const column = columns.find((col) => col.id === columnId);
      console.log(columnId);
      console.log(draggedItem.id);
      if (columnId == 2) {
        handleViewTicket(draggedItem.id);
      } else {
        setTicketToMove({ ticketId: draggedItem.id, fromStatus, columnId });
        setTargetColumnId(columnId);
        setIsPopupOpen(true);
        setDraggedItem(null);
      } // Clear the dragged item
    }
  };

  const handleConfirmMove = async () => {
    if (ticketToMove) {
      const { ticketId, fromStatus, columnId } = ticketToMove;
      await updateStatus(ticketId, targetColumnId);
      await logTicketMovement(ticketId, fromStatus, targetColumnId); // Log the movement
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: targetColumnId }
            : ticket
        )
      );
    }
    setIsPopupOpen(false);
    setTicketToMove(null);
    setTargetColumnId(null);
  };

  const handleCancelMove = () => {
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

      if (response.ok) {
        console.log(
          `Status updated successfully for Ticket ID: ${itemId} to Status: ${newColumnId}`
        );
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const logTicketMovement = async (ticketId, fromStatus, toStatus) => {
    try {
      const response = await fetch(
        `${baseURL}backend/log_ticket_movement.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            tid: ticketId,
            from_status: fromStatus,
            to_status: toStatus,
            done_by: user.userId,
          }),
        }
      );

      if (response.ok) {
        console.log(`Movement logged for Ticket ID: ${ticketId}`);
      } else {
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

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const scrollContainerRef = React.createRef();

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
  console.log(ticketTypes);
  return (
    <div className="bg-second p-0.5 h-full">
    <div className="bg-box h-full">
      <div className="flex justify-between items-center">
        <div className="header-left">
          <h1 className="text-2xl px-3 text-sky-600 font-semibold font-raleway">
            Welcome {user.firstname}!
          </h1>
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
  <div ref={scrollContainerRef} className="flex overflow-x-auto whitespace-nowrap p-0 h-full overflow-y-auto">
    <div className="flex-grow max-h-full flex items-start relative">
      {columns.map((column) => (
        <div
          key={column.id}
          id={column.id}
          className="column bg-box border shadow-xl"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, column.id)}
          onTouchEnd={(e) => handleTouchEnd(e, column.id)}
        >
          <h2 className="mb-2 text-prime text-center text-xl font-semibold uppercase">
            {column.title}
          </h2>
          <div className="column-content mb-2">
            {tickets
              .filter((ticket) => ticket.status === column.id)
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
                  onTouchStart={
                    user && user.ticketaction === "1"
                      ? (e) => handleTouchStart(e, ticket)
                      : null
                  }
                  onClick={() => handleViewTicket(ticket.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-semibold text-prime font-poppins truncate" title={ticket.ticket_customer_value}>
                        {ticket.ticket_customer_value}
                      </p>
                      <p className="truncate"  title={ticket.ticket_service_value}>{ticket.ticket_service_value}</p>
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
        <ConfirmationPopup
          isOpen={isPopupOpen}
          message={`Do you want to move to ${
            columns.find((col) => col.id === targetColumnId)?.title
          }?`}
          onConfirm={handleConfirmMove}
          onCancel={handleCancelMove}
        />
      )}
    </div>
    </div>
  );
};

export default App;
