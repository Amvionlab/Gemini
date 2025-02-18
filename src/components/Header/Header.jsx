import React, { useState, useEffect, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faKey, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { Tooltip, Badge, Button } from "@mui/material";
import { styled } from "@mui/system";
import { baseURL } from '../../config.js'; // Update path as needed
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext/UserContext";

const PurpleTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .MuiTooltip-tooltip`]: {
    backgroundColor: "purple",
    color: "white",
    fontSize: "0.875rem",
  },
  [`& .MuiTooltip-arrow`]: {
    color: "purple",
  },
});

function Header() {


  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setUsers] = useState([]);
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    window.location.reload();

  };

  const fetchData = async () => {
    try {
      let url = `${baseURL}/backend/fetchNotifications.php?type=${user.accessId}&user=${user.userId}&ttype=${user.ttype}`;
     
      const response = await fetch(url);
      const data = await response.json();

      setUsers(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 90000); // 90 seconds
    return () => clearInterval(intervalId);
  }, []);



  const handlePasswordChange = () => {
    navigate("/password-change");
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const handleNotificationClose = (noteId, userId) => {
    let url = `${baseURL}/backend/updateNotifications.php`;
    const data = {
      action: 'close', // Action type for closing a notification
      noteId: noteId,
      userId: userId
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(result => {
        // Handle success or failure response
        fetchData();
        console.log('Notification marked as read', result);
      })
      .catch(error => {
        console.error('Error updating notification:', error);
      });
  };

  const handleClearAll = (userId) => {
    const url = `${baseURL}/backend/updateNotifications.php`;

    // Collect all notification IDs to send in the request
    const noteIds = notifications.map((note) => note.id);

    // Prepare the request data
    const data = {
      action: 'clear_all', // Action type for clearing all notifications
      userId: userId,
      noteIds: noteIds, // Include notification IDs in the request
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.status === 'success') {
          console.log('All notifications marked as read:', result);
          // Optionally update the UI state
          fetchData(); // Refresh notifications list
        } else {
          console.error('Failed to clear all notifications:', result.message);
        }
      })
      .catch((error) => {
        console.error('Error clearing all notifications:', error);
      });
  };

  return (
    <header className="fixed bg-box top-0 right-0 h-[7vh] w-full flex justify-between items-center z-40">
      <div className="relative flex justify-between items-center w-full pr-4 p-2 text-sm gap-5 z-50">
        <div className="flex justify-start items-center text-base gap-5">
          <h3 className="ml-52 font-bold text-flo font-raleway capitalize">Hi {user.firstname}, Welcome to SAMPAT TMS</h3>
        </div>
        {/* <p className="font-bold text-xs justify-center text-prime">© 2024, Amvion Labs Pvt. Ltd. All Rights Reserved.</p> */}


        <div className="flex justify-end items-center space-x-4">
          <PurpleTooltip title="Notifications" arrow>
            <Badge badgeContent={notifications.length} color="primary">
              <div
                className={`cursor-pointer hover:text-flo flex items-center justify-center ${notifications.length > 0 ? 'fa-shake mx-3 text-flo' : 'text-prime'
                  }`}
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
              >
                <FontAwesomeIcon icon={faBell} />
              </div>
            </Badge>
          </PurpleTooltip>

          <PurpleTooltip title="Change Password" arrow>
            <div
              className="cursor-pointer text-prime hover:text-flo flex items-center text-sm justify-center"
              onClick={handlePasswordChange}
            >
              <FontAwesomeIcon icon={faKey} />
            </div>
          </PurpleTooltip>

          <PurpleTooltip title="Log out" arrow>
            <div
              className="cursor-pointer text-prime hover:text-flo flex items-center text-sm justify-center"
              onClick={handleLogout}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
            </div>
          </PurpleTooltip>
        </div>
      </div>

      {isNotificationsOpen && (
  <div className="absolute p-2 top-12 border right-4 w-3/12 max-h-[90vh] overflow-y-auto border-box shadow-2xl rounded-lg bg-blue-50 z-50">
    {/* Header */}
    <div className="h-[10%] inline-flex items-center gap-x-3 text-sm font-semibold leading-6 mb-1 text-gray-900" aria-expanded="false">
      <i className="fa-solid fa-bell"></i> <span>Notifications</span>
    </div>

    {/* Notifications List */}
    <div className="overflow-y-auto p-1 mb-0.5">
      {notifications.length > 0 ? (
        notifications.map((note, index) => (
          <div
            key={index}
            className="flex gap-x-6 p-2 mb-1 items-center hover:bg-second bg-box cursor-pointer rounded-lg shadow"
            onClick={() => navigate(note.href)}
          >
            <div className="flex text-xs items-center justify-center w-6 h-6 bg-box rounded-full">
              <FontAwesomeIcon icon={faBell} className="text-prime" />
            </div>
            <div className="w-[75%] overflow-hidden">
              <div className="flex justify-between items-center overflow-hidden mb-1">
                <div
                  className="w-[52%] overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-gray-900 text-sm"
                  title={
                    note.log_type === 1
                      ? "Ticket Created"
                      : note.log_type === 2
                      ? "Ticket Assigned"
                      : note.log_type === 3
                      ? "Ticket Closed"
                      : "unknown"
                  }
                >
                  {note.log_type === 1
                    ? "Ticket Created"
                    : note.log_type === 2
                    ? "Ticket Assigned"
                    : note.log_type === 3
                    ? "Ticket Closed"
                    : "unknown"}
                </div>
                <div className="w-[48%] overflow-hidden whitespace-nowrap text-xs ml-2 font-medium text-gray-600 text-right">
                  {formatTime(note.post_date)}
                </div>
              </div>
              <div className="text-xs text-gray-700 font-normal truncate" title={note.log}>
                {note.log}
              </div>
            </div>
            <button
              className="flex items-center justify-center hover:font-bold font-semibold text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                handleNotificationClose(note.id, user.userId);
              }}
            >
              x
            </button>
          </div>
        ))
      ) : (
        <div className="text-center justify-center text-gray-800 font-bold text-sm pt-[10%] pb-[10%] h-[80%]">
          No Notifications
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="flex text-xs font-bold text-box h-[10%] gap-2">
      <div
        className="text-center rounded p-2 w-[50%] bg-red-500 hover:bg-red-600 cursor-pointer"
        onClick={() => setIsNotificationsOpen(false)}
      >
        Close
      </div>
      <div
        className="text-center rounded p-2 w-[50%] bg-gray-500 hover:bg-gray-600 cursor-pointer"
        onClick={() => handleClearAll(user.userId)}
      >
        Clear All
      </div>
    </div>
  </div>
)}
    </header>
  );
}

export default Header;