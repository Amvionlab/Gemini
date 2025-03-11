import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { toast } from "react-toastify";
import { baseURL, backendPort } from "../../config.js";
import { FaFilter, FaUserPlus,FaEdit, FaCheck, FaTimes} from "react-icons/fa";
import { MdSupervisedUserCircle } from "react-icons/md";
import { FaCircleUser } from "react-icons/fa6";
import { HiTicket } from "react-icons/hi2";
import * as XLSX from "xlsx";
import { tooltipClasses } from "@mui/material/Tooltip";
import jsPDF from "jspdf";
import { styled } from "@mui/material/styles";
import html2canvas from "html2canvas";
import ReactPaginate from "react-paginate";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  TextField,
  MenuItem,
  TablePagination,
  Paper,
  InputBase,
} from "@mui/material";

import {
  faRightFromBracket,
  faSquarePlus,
  faUserSecret,
  faUserTie,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Tooltip,
} from "@mui/material";
import { UserContext } from "../UserContext/UserContext";
import { useTicketContext } from "../UserContext/TicketContext";
import "./singleticket.css";

const SingleTicket = () => {
  const { ticketId } = useTicketContext();

  const CustomTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))({
    [`& .${tooltipClasses.tooltip}`]: {
      maxWidth: 900,
      backgroundColor: "purple",
    },
  });
  const id = ticketId;
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedDate, setSelectedDate] = useState("");
  const offset = page * rowsPerPage;
  const [ticketData, setTicketData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [statuses, setStatuses] = useState([]);
  const [status, setStatus] = useState([]);
  const [Accesses, setAccesses] = useState([]);
  const { user } = useContext(UserContext);
  const [docket, setDocket] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedRCA, setSelectedRCA] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [users2, setUsers2] = useState([]);
  const [filteredUsers2, setFilteredUsers2] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [rcaList, setRcaList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showInputField, setShowInputField] = useState(false);
  const [newEngineer, setNewEngineer] = useState("");
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [selectedOptions1, setSelectedOptions1] = useState([]); // Define selectedOptions1
  const [availableVendors, setAvailableVendors] = useState([]);

// Add missing functions
const handleVendorModalClose = () => setIsVendorModalOpen(false);
const handleVendorSelectChange = (selectedOptions1) => {
  setSelectedVendors(selectedOptions1);
  updateVendorInDB(ticketId, selectedOptions1.map((v) => v.value));

  // Update available vendors dynamically
  setAvailableVendors(
    availableVendors.filter(
      (vendor) => !selectedOptions1.some((selected) => selected.value === vendor.value)
    )
  );
};

function formatDate(dateString) {
  if (!dateString) return ""; // Handle missing date
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

const handleVendorChipRemove = (removedVendor) => {
  const updatedSelectedVendors = selectedVendors.filter(
    (vendor) => vendor.value !== removedVendor.value
  );

  setSelectedVendors(updatedSelectedVendors);

  // Add removed vendor back to availableVendors list
  setAvailableVendors([...availableVendors, removedVendor]);

  // Update database
  updateVendorInDB(ticketId, updatedSelectedVendors.map((v) => v.value));
};

const vendorConfirm = () => {
  console.log("Vendors selected:", selectedVendors);
};

const updateVendorInDB = async (ticketId, vendorIds) => {
  try {
    const response = await fetch(`${baseURL}backend/updateVendor.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id: ticketId, vendor_ids: vendorIds }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update vendor");

    console.log(`Vendors updated successfully for Ticket ID ${ticketId}`);
  } catch (error) {
    console.error("Error updating vendors:", error);
  }
};

const handleSave = async () => {
  if (!selectedDate) {
    toast.error("Please select a valid date.");
    return;
  }

  try {
    const response = await fetch(`${baseURL}backend/updateTicket.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket_id: ticketData.id,
        post_date: selectedDate,
      }),
    });

    if (!response.ok) throw new Error("Failed to update ticket");

    toast.success("Ticket date updated successfully!");
    fetchTicket();
    setIsEditing(false);
  } catch (error) {
    console.error("Error updating ticket:", error);
    toast.error("Update failed!");
  }
};

const handleAddEngineer = async () => {
  if (newEngineer.trim() === "") {
    alert("Please enter an engineer name.");
    return;
  }

  try {
    const response = await fetch(`${baseURL}/backend/addVendor.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newEngineer }),
    });

    const result = await response.json();

    if (result.success) {
      fetchVendors();
      fetchSelectedVendors();
      setShowInputField(false);
      setNewEngineer("");
      alert("Engineer added successfully!");
    
    } else {
      alert("Failed to add engineer.");
    }
  } catch (error) {
    console.error("Error adding engineer:", error);
    alert("Something went wrong.");
  }
};

const fetchVendors = async () => {
  try {
    const response = await fetch(`${baseURL}backend/fetchVendor.php`);
    const data = await response.json();

    if (Array.isArray(data)) {
      const vendorOptions = data.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
      }));
      setVendors(vendorOptions);
    } else {
      console.error("Invalid response format:", data);
    }
  } catch (error) {
    console.error("Error fetching vendors:", error);
  }
};

useEffect(() => {
  fetchVendors();
}, [baseURL]);


const fetchSelectedVendors = async () => {
  try {
    const response = await fetch(`${baseURL}backend/fetchSelectedVendors.php?id=${ticketId}`);
    const data = await response.json();

    setSelectedVendors(data.vendors || []);
    setAvailableVendors(data.availableVendors || []);
  } catch (error) {
    console.error("Error fetching vendors:", error);
  }
};

useEffect(() => {
  if (ticketId) {
    fetchSelectedVendors();
  }
}, [ticketId, baseURL]);


   // ✅ Filter out selected vendors from the dropdown options
   useEffect(() => {
    setFilteredVendors(
      vendors.filter(vendor => !selectedVendors.some(selected => selected.value === vendor.value))
    );
  }, [vendors, selectedVendors]);

useEffect(() => {
  const fetchRCAList = async () => {
      try {
          const response = await fetch(`${baseURL}backend/fetchRca.php`);
          const data = await response.json();
          setRcaList(data);
      } catch (error) {
          console.error("Error fetching RCA data:", error);
          toast.error("Error fetching RCA list.");
      }
  };

  fetchRCAList();
}, []);

  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState({
    id: false,
    name: false,
    statusfrom: false,
  });
  const [showTimesheet, setShowTimesheet] = useState(true);
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    from_time: "",
    to_time: "",
    tid: id,
  });
  const totalUsers = users.length;
  const totalUsers2 = users2.length;
  const [showForm, setShowForm] = useState(false);

  const [ticketsPerPage, setTicketsPerPage] = useState(10);
  let i = 1;
  let j = 1;
  const [currentPage, setCurrentPage] = useState(0);
  const [ticketsPerPage2, setTicketsPerPage2] = useState(10);
  const [currentPage2, setCurrentPage2] = useState(0);
  const [addEntry, setAddEntry] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const fetchAllData = async () => {
    try {
      const response = await fetch(`${baseURL}backend/timesheet.php?id=${id}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    try {
      const response2 = await fetch(`${baseURL}backend/log.php?id=${id}`);
      const data2 = await response2.json();
      setUsers2(data2);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page changes
  };

  useEffect(() => {
    if (users.length) {
      const updatedFilteredUsers = users.filter((user) => {
        // Apply your filtering logic based on `filters` state
        return true; // Adjust as per your actual filtering needs
      });
      setFilteredUsers(updatedFilteredUsers);
    }
  }, [users, filters]); // Update filteredUsers whenever users or filters change

  const handleRowsPerPageChange2 = (e) => {
    const value = parseInt(e.target.value, 10); // Parse the input value as an integer
    if (!isNaN(value) && value >= 1) {
      setTicketsPerPage2(Number(e.target.value));
      setCurrentPage2(0); // Update state only if value is a valid number >= 1
    } else {
      setTicketsPerPage2(1);
      setCurrentPage2(0); // Default to 1 if input is cleared or set to invalid value
    }
  };


  const handleFilterChange = (e, field, type) => {
    const value = e.target.value.toLowerCase();
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: { type, value },
    }));
  };

  useEffect(() => {
    let filtered = [...users];
    Object.keys(filters).forEach((field) => {
      const { type, value } = filters[field];
      if (value) {
        filtered = filtered.filter((ticket) => {
          const fieldValue = ticket[field];

          if (fieldValue == null) {
            if (type === "contain" || type === "equal to") return false;
            if (type === "not contain") return true;
            if (type === "more than" || type === "less than") return false;
          }

          const fieldValueStr = fieldValue.toString().toLowerCase();
          const valueStr = value.toLowerCase();

          if (type === "contain") return fieldValueStr.includes(valueStr);
          if (type === "not contain") return !fieldValueStr.includes(valueStr);
          if (type === "equal to") return fieldValueStr === valueStr;
          if (type === "more than")
            return parseFloat(fieldValue) > parseFloat(value);
          if (type === "less than")
            return parseFloat(fieldValue) < parseFloat(value);
          return true;
        });
      }
    });
    setFilteredUsers(filtered);
  }, [filters, users]);

  useEffect(() => {
    let filtered = [...users2];
    Object.keys(filters).forEach((field) => {
      const { type, value } = filters[field];
      if (value) {
        filtered = filtered.filter((ticket) => {
          const fieldValue = ticket[field];

          if (fieldValue == null) {
            if (type === "contain" || type === "equal to") return false;
            if (type === "not contain") return true;
            if (type === "more than" || type === "less than") return false;
          }

          const fieldValueStr = fieldValue.toString().toLowerCase();
          const valueStr = value.toLowerCase();

          if (type === "contain") return fieldValueStr.includes(valueStr);
          if (type === "not contain") return !fieldValueStr.includes(valueStr);
          if (type === "equal to") return fieldValueStr === valueStr;
          if (type === "more than")
            return parseFloat(fieldValue) > parseFloat(value);
          if (type === "less than")
            return parseFloat(fieldValue) < parseFloat(value);
          return true;
        });
      }
    });
    setFilteredUsers2(filtered);
  }, [filters, users2]);

  const exportCSV = () => {
    // Get table headers
    const tableHeaders = Array.from(
      document.querySelectorAll(".filter-table .header .head")
    ).map((header) => header.textContent.trim());

    // Get table data values
    const tableData = Array.from(
      document.querySelectorAll(".filter-table tr")
    ).map((row) =>
      Array.from(row.querySelectorAll("td")).map((cell) =>
        cell.textContent.trim()
      )
    );

    // Filter out rows that contain filter content
    const filteredTableData = tableData.filter(
      (row) =>
        !row.some(
          (cell) =>
            cell.includes("Contains") ||
            cell.includes("Does Not Contain") ||
            cell.includes("Equal To") ||
            cell.includes("More Than") ||
            cell.includes("Less Than")
        )
    );

    // Create CSV content
    const csvContent = [
      tableHeaders.join(","),
      ...filteredTableData.map((row) => row.join(",")),
    ].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Timesheet.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const table = document.querySelector(".filter-table");
    if (!table) return;

    // Extract table headers
    const headers = Array.from(document.querySelectorAll(".header .head")).map(
      (header) => header.textContent.trim()
    );

    // Extract table data values
    const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
      Array.from(row.querySelectorAll("td")).map((td) => td.innerText.trim())
    );

    // Filter out rows that contain filter content
    const filteredRows = rows.filter(
      (row) =>
        !row.some(
          (cell) =>
            cell.includes("Contains") ||
            cell.includes("Does Not Contain") ||
            cell.includes("Equal To") ||
            cell.includes("More Than") ||
            cell.includes("Less Than")
        )
    );

    const data = [headers, ...filteredRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "Timesheet.xlsx");
  };

  const exportPDF = () => {
    const table = document.querySelector(".filter-table");
    if (!table) return;

    // Create a copy of the table
    const tableClone = table.cloneNode(true);

    // Remove filter dropdowns and inputs from the cloned table
    tableClone.querySelectorAll(".filter").forEach((filter) => filter.remove());

    // Center-align all table cell contents
    tableClone.querySelectorAll("th, td").forEach((cell) => {
      cell.style.textAlign = "center";
    });

    // Append the cloned table to the body (temporarily)
    document.body.appendChild(tableClone);

    // Use html2canvas to convert the cloned table to an image
    html2canvas(tableClone).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("Timesheet.pdf");

      // Remove the cloned table from the document
      document.body.removeChild(tableClone);
    });
  };

  const exportCSV1 = () => {
    // Get table headers
    const tableHeaders = Array.from(
      document.querySelectorAll(".filter-table1 .header .head")
    ).map((header) => header.textContent.trim());

    // Get table data values
    const tableData = Array.from(
      document.querySelectorAll(".filter-table1 tr")
    ).map((row) =>
      Array.from(row.querySelectorAll("td")).map((cell) =>
        cell.textContent.trim()
      )
    );

    // Filter out rows that contain filter content
    const filteredTableData = tableData.filter(
      (row) =>
        !row.some(
          (cell) =>
            cell.includes("Contains") ||
            cell.includes("Does Not Contain") ||
            cell.includes("Equal To") ||
            cell.includes("More Than") ||
            cell.includes("Less Than")
        )
    );

    // Create CSV content
    const csvContent = [
      tableHeaders.join(","),
      ...filteredTableData.map((row) => row.join(",")),
    ].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel1 = () => {
    const table = document.querySelector(".filter-table1");
    if (!table) return;

    // Extract table headers
    const headers = Array.from(document.querySelectorAll(".header .head")).map(
      (header) => header.textContent.trim()
    );

    // Extract table data values
    const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
      Array.from(row.querySelectorAll("td")).map((td) => td.innerText.trim())
    );

    // Filter out rows that contain filter content
    const filteredRows = rows.filter(
      (row) =>
        !row.some(
          (cell) =>
            cell.includes("Contains") ||
            cell.includes("Does Not Contain") ||
            cell.includes("Equal To") ||
            cell.includes("More Than") ||
            cell.includes("Less Than")
        )
    );

    const data = [headers, ...filteredRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "Log.xlsx");
  };

  const exportPDF1 = () => {
    const table = document.querySelector(".filter-table1");
    if (!table) return;

    // Create a copy of the table
    const tableClone = table.cloneNode(true);

    // Remove filter dropdowns and inputs from the cloned table
    tableClone.querySelectorAll(".filter").forEach((filter) => filter.remove());

    // Center-align all table cell contents
    tableClone.querySelectorAll("th, td").forEach((cell) => {
      cell.style.textAlign = "center";
    });

    // Append the cloned table to the body (temporarily)
    document.body.appendChild(tableClone);

    // Use html2canvas to convert the cloned table to an image
    html2canvas(tableClone).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("Log.pdf");

      // Remove the cloned table from the document
      document.body.removeChild(tableClone);
    });
  };

  const currentTickets = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const currentTickets2 =
    rowsPerPage > 0
      ? users2.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : users; // Show all users when 'All' is selected

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fromTime = new Date(`1970-01-01T${formData.from_time}:00`);
    const toTime = new Date(`1970-01-01T${formData.to_time}:00`);

    if (editMode) {
      // Update entry
      try {
        if (toTime <= fromTime) {
          toast.error("Wrong time period !");
        } else {
          let totalHours = (toTime - fromTime) / 3600000;
          let integerPart = Math.floor(totalHours);
          let fractionalPart = totalHours - integerPart;
          fractionalPart *= 0.6;
          totalHours = integerPart + fractionalPart;
          console.log(totalHours);

          const dataToSubmit = {
            ...formData,
            done_by: user.userId,
            total_hours: totalHours.toFixed(2),
          };
          console.log("edit data", dataToSubmit);

          const response = await fetch(`${baseURL}backend/timesheet-edit.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToSubmit),
          });

          if (!response.ok) {
            throw new Error("Failed to update entry");
          }

          toast.success("Entry Edited");
          setAddEntry(false);
          setEditMode(false);
          fetchAllData();
          setFormData({
            date: "",
            description: "",
            from_time: "",
            to_time: "",
          });
        }
      } catch (error) {
        console.error("Failed to update entry", error);
      }
    } else {
      console.log(fromTime);
      console.log(toTime);

      if (toTime <= fromTime) {
        toast.error("Wrong time period !");
      } else {
        let totalHours = (toTime - fromTime) / 3600000;
        let integerPart = Math.floor(totalHours);
        let fractionalPart = totalHours - integerPart;
        fractionalPart *= 0.6;
        totalHours = integerPart + fractionalPart;
        console.log(totalHours);

        const dataToSubmit = {
          ...formData,
          userid: user.userId,
          tid: id,
          total_hours: totalHours.toFixed(2),
        };
        console.log("entry", dataToSubmit);
        try {
          const response = await fetch(`${baseURL}backend/timesheet.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToSubmit),
          });

          const result = await response.json();

          if (result.success) {
            toast.success("Entry added successfully!");
            setFormData({
              date: "",
              description: "",
              from_time: "",
              to_time: "",
              tid: id,
              userid: user.userId,
            });
            fetchAllData();
          } else {
            toast.error("Failed to add entry.");
          }
        } catch (error) {
          console.error("Error adding entry:", error);
          toast.error("An error occurred while adding entry.");
        }
      }
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`${baseURL}backend/dropdown.php`);
      const data = await response.json();
      setAccesses(data.Support);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${baseURL}backend/get_status.php`);
      const data = await response.json();
      const formattedStatus = data.map((item) => ({ subName: item.status }));
      setStatus(formattedStatus);
    } catch (error) {
      console.error("Error fetching status data:", error);
      fetchStatus();
    }
  };

  const fetchTicket = async () => {
    try {
      const response = await fetch(`${baseURL}backend/getTicket.php?id=${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch ticket data");
      }
      const data = await response.json();

      if (data.message) {
        toast.error(data.message);
      } else {
        setTicketData(data);
        // Update currentStep based on ticketData.status
        const statusIndex = status.findIndex((s) => s.subName === data.status);
        setCurrentStep(data.status - 1);
      }
    } catch (error) {
      toast.error(`Error fetching ticket details: ${error.message}`);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch(`${baseURL}backend/get_status.php`);
      if (!response.ok) {
        throw new Error("Failed to fetch statuses");
      }
      const data = await response.json();
      setStatuses(data);
    } catch (error) {
      console.log(`Error fetching statuses: ${error.message}`);
      location.reload();
    }
  };
  useEffect(() => {
    fetchTicket();
    fetchStatuses();
    fetchStatus();
    fetchData();
  }, [id]);

  const handleEdit = (user) => {
    console.log("edit :", user);
    setFormData({
      id: user.id,
      date: user.date,
      description: user.description,
      from_time: user.starttime,
      to_time: user.endtime,
      total_hours: user.totalhours,
    });
    setEditMode(true);
    setAddEntry(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        const response = await fetch(`${baseURL}backend/timesheet-delete.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete entry");
        } else {
          toast.success("Entry Deleted");
          fetchAllData();
        }
      } catch (error) {
        console.error("Failed to delete entry", error);
      }
    }
  };

  // Usage
  <FontAwesomeIcon
    icon={faTrashAlt}
    className="cursor-pointer text-red-500"
    onClick={() => handleDelete(user.id)}
  />;

  const [selectedOptions, setSelectedOptions] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        const response = await fetch(
          `${baseURL}backend/get_assignees.php?id=${id}`
        );
        const result = await response.json();

        console.log("Assignees fetched:", result.assignees);
        console.log("Accesses:", Accesses);

        const options = result.assignees
          .map((assigneeId) => {
            const assignee = Accesses.find(
              (access) => access.id === assigneeId
            );
            return assignee
              ? { value: assignee.id, label: assignee.name }
              : null;
          })
          .filter((option) => option !== null);

        console.log("Options set:", options);

        setSelectedOptions(options);
      } catch (error) {
        console.error("Failed to fetch assignees", error);
      }
    };

    if (Accesses.length > 0) {
      fetchAssignees();
    }
  }, [id, Accesses]);

  const handleSelectChange = (selected) => {
    setSelectedOptions(selected || []);
  };

  const updateAssignees = async (newAssignees) => {
    const data = {
      id: id,
      assignees: newAssignees.map((option) => option.value),
      done: user.userId,
    };
    try {
      const response = await fetch(`${baseURL}backend/assign.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error("Failed to update assignees", error);
    }
  };

  const handleChipRemove = (option) => {
    const newOptions = selectedOptions.filter((o) => o.value !== option.value);
    setSelectedOptions(newOptions);
    updateAssignees(newOptions);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    updateAssignees(selectedOptions);
  };

  const logStatusChange = async (fromStatus, toStatus) => {
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

      if (response.ok) {
        console.log(`Movement logged for Ticket ID: ${id}`);
      } else {
        console.error("Failed to log movement");
      }
    } catch (error) {
      console.error("Error logging movement:", error);
    }
  };

  const handleStepClick = (step) => {
    setSelectedStep(step);
    setOpen(true);
  };

  const assignConfirm = async () => {
    const newStatus = 2;
    console.log(newStatus);
    const oldStatus = ticketData?.status;
    console.log(oldStatus);
    if (oldStatus != 2) {
      try {
        // Update ticket status
        const response = await fetch(`${baseURL}backend/update_sstatus.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: id, status: newStatus }),
        });
        if (!response.ok) {
          throw new Error("Failed to update status");
        }
        const data = await response.json();
        toast.success(data.message);

        // Log the status change
        await logStatusChange(oldStatus, newStatus);

        // Update local state after successful status update
        setTicketData((prevTicketData) => ({
          ...prevTicketData,
          status: newStatus,
        }));
        setCurrentStep(selectedStep);
        setOpen(false);
        fetchTicket();
      } catch (error) {
        toast.error(`Error updating status: ${error.message}`);
      }
    }
  };

  const handleConfirm = async () => {
    const newStatus = statuses[selectedStep]?.id;
    const oldStatus = ticketData?.status;
    console.log("s",statuses[selectedStep]?.id)
    const isClosingTicket = statuses[selectedStep]?.id === '4'; 
    console.log("ct",isClosingTicket)
    if (isClosingTicket && !selectedRCA) {
        toast.warning("Please select an RCA before closing the ticket.");
        return;
    }

    try {
        // ✅ Step 1: Update Ticket Status
        const response = await fetch(`${baseURL}backend/update_sstatus.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: id, status: newStatus }),
        });

        if (!response.ok) {
            throw new Error("Failed to update status");
        }

        const data = await response.json();
        toast.success(data.message);

        // ✅ Step 2: Log the Status Change
        await logStatusChange(oldStatus, newStatus);

        // ✅ Step 3: If Closing, Update RCA ID
        if (isClosingTicket) {
            const requestData = {
                ticket_id: id,  // Ensure correct ticket ID
                rca_id: selectedRCA,
                docket: docket,
                move_date: selectedDate,
                done_by: user?.name || "System",
            };
            console.log("rd",requestData)
            const updateResponse = await fetch(`${baseURL}Backend/updateTicketRca.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });

            const updateText = await updateResponse.text();
            let updateResult;

            try {
                updateResult = JSON.parse(updateText);
            } catch (jsonError) {
                console.error("Invalid JSON response:", updateText);
                toast.error("Error: Invalid server response. Check console.");
                return;
            }

            if (updateResult.success) {
                toast.success("Ticket RCA updated successfully.");
            } else {
                toast.error(`Error updating RCA: ${updateResult.error}`);
                return;
            }
        }

        // ✅ Step 4: Update Local State After Successful Operations
        setTicketData((prevTicketData) => ({
            ...prevTicketData,
            status: newStatus,
        }));
        setCurrentStep(selectedStep);
        setOpen(false);
        fetchTicket(); // Refresh ticket data

    } catch (error) {
        toast.error(`Error updating status: ${error.message}`);
    }
};

  if (!ticketData || statuses.length === 0) {
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  const customerDetails = [
    { label: "Name", value: ticketData.ticket_customer_value },
    { label: "Location", value: ticketData.customer_branch },
    { label: "Unique Code", value: ticketData.customer_department },
    { label: "Contact Person", value: ticketData.contact_person },
    { label: "WAN IP", value: ticketData.contact_number },
    { label: "Email", value: ticketData.contact_mail },
  ];

  const ticketDetails = [
    { label: "Type of Ticket", value: ticketData.ticket_type_value },
    { label: "Nature of Call", value: ticketData.ticket_noc_value },
    { label: "Type of Service", value: ticketData.ticket_service_value },
    { label: "Catagory", value: ticketData.ticket_domain_value },
    { label: "Sub Catagory", value: ticketData.ticket_subdomain_value },
    { label: "RCA", value: ticketData.rca },
  ];

  const handleButtonClick = () => {
    setAddEntry(true);
  };

  return (
    <div className="bg-second font-sui h-full overflow-hidden p-0.5">
      {user && user.ticketaction === "1" && (
        <div className=" progress-container w-full bg-box  h-[15%] py-14 mb-0.5">
          <div className="bar bg-second ">
            <div
              className="bar__fill bg-flo"
              style={{
                width: `${(currentStep + 1) * (100 / status.length)}%`,
              }}
            ></div>
          </div>
          {status.map((status, index) => (
            <div
              key={index}
              className={`point ${
                index <= currentStep ? "point--complete" : ""
              } ${index === currentStep ? "point--active" : ""}`}
              onClick={() => handleStepClick(index)}
            >
              <div className="bullet bg-prime"></div>
              <div className="label">{status.subName}</div>
            </div>
          ))}
        </div>
      )}

      {/* <div className="progress-container w-full mb-3 pt-5 bg-box font-poppins shadow-md"></div> */}
      <div className="overflow-y-scroll h-[80%]">
        <div className="w-full mx-auto bg-box ">
          <div className="py-2 px-10 flex justify-between items-center bg-white rounded-t-lg shadow-sm">
          <div className="flex items-center gap-2 text-prime font-bold">
      <HiTicket className="text-flo w-24 text-4xl" />
      <span className="text-base text-flo"> #{ticketData.id}</span>

      <CustomTooltip
        title={
          <div className="p-4">
            <pre className="text-wrap">{ticketData.issue_nature}</pre>
          </div>
        }
      >
        <span
          className="w-full min-w-96 whitespace-nowrap overflow-hidden overflow-ellipsis"
          title={ticketData.issue_nature}
        >
          {" "}
          - {ticketData.issue_nature}
        </span>
      </CustomTooltip>

      {isEditing ? (
        <>
          <input
            type="datetime-local"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <button onClick={handleSave} className="text-green-500 ml-2">
            <FaCheck />
          </button>
          <button onClick={() => setIsEditing(false)} className="text-red-500 ml-2">
            <FaTimes />
          </button>
        </>
      ) : (
        <>
          <span className="text-sm text-right font-bold ml-4 text-nowrap">
            Raised On : {ticketData.post_date}
          </span>
          <button onClick={() => setIsEditing(true)} className="ml-2 text-blue-500">
            <FaEdit />
          </button>
        </>
      )}
    </div>
            {ticketData.path && ticketData.path !== "" && (
              <div className="flex items-center gap-2 ml-auto">
                <a
                  href={ticketData.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 text-xs text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-300 mr-4"
                >
                  Attachment
                </a>
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* <span className="text-lg flex items-center gap-2 font-poppins">
            <FaCircleUser className="text-flo text-xl" />
            <span>{ticketData.cname}</span>
          </span> */}
              <Link to="/dashboard">
                <FontAwesomeIcon
                  className="text-[#ff3333] text-xl cursor-pointer"
                  title="Back"
                  icon={faRightFromBracket}
                  rotation={180}
                />
              </Link>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-2 pl-4 pb-4 m-1 bg-white rounded-b-lg">
            <div
              className={`flex flex-col lg:flex-row gap-3 ${
                user && user.assign === "1" && selectedOptions
                  ? "w-full lg:w-4/5"
                  : "w-full"
              }`}
            >
              {/* Customer Details */}
              <div
                className={`flex-1 ${
                  user && user.assign === "1" && selectedOptions
                    ? "w-full lg:w-2/5"
                    : "w-full lg:w-1/2"
                }`}
              >
                <h2 className="text-lg font-semibold mb-3 text-gray-900">
                  Customer Details
                </h2>
                <div className="overflow-x-auto  rounded-lg p-3">
                  <table className="min-w-full divide-y divide-gray-200 ">
                    <tbody>
                      {customerDetails.map((detail, index) => (
                        <tr key={index}>
                          <td className="text-sm font-semibold text-prime whitespace-nowrap">
                            {detail.label}
                          </td>
                          <td className="pl-4 text-xs text-gray-800">
                            {detail.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ticket Details */}
              <div
                className={`flex-1 ${
                  user && user.assign === "1" && selectedOptions
                    ? "w-full lg:w-2/5"
                    : "w-full lg:w-1/2"
                }`}
              >
                <h2 className="text-lg font-semibold mb-3 text-gray-900">
                  Ticket Details
                </h2>
                <div className="overflow-x-auto rounded-lg p-2">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody>
                      {ticketDetails.map((detail, index) => (
                        <tr key={index}>
                          <td className="text-sm font-semibold text-prime whitespace-nowrap">
                            {detail.label}
                          </td>
                          <td className="pl-4 text-xs text-gray-800">
                            {detail.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Assignee Section */}
            {user && user.assign === "1" && selectedOptions ? (
              <div className="flex-col w-full lg:w-1/5 pr-4 pl-2 pt-2 mr-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-semibold ml-2 text-prime">
                    Assignee
                  </span>
                  <button
                    type="button"
                    className="text-prime text-xl ml-3"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <MdSupervisedUserCircle className="text-prime text-2xl" />
                  </button>
                </div>
                <div className="flex-nowrap overflow-x-auto bg-box rounded-lg gap-2 mb-3 p-2 mr-4 max-h-40 overflow-y-auto">
                  {selectedOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center bg-blue-500 text-white text-xs rounded-full px-2 py-1 whitespace-nowrap w-full mb-2"
                    >
                      <span
                        title={option.label}
                        className="flex-grow text-xs cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap w-[90%]"
                      >
                        {option.label}
                      </span>
                      <button
                        type="button"
                        className="flex-shrink-0 w-[10%] ml-2 text-black font-bold hover:text-gray-300"
                        onClick={() => handleChipRemove(option)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {isModalOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-50">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg h-auto shadow-lg w-11/12 sm:w-1/2 lg:w-1/3">
                      <h2 className="text-lg font-semibold mb-4">
                        Select Assignees
                      </h2>
                      <Select
                        isMulti
                        name="customer_department"
                        options={Accesses.map((Access) => ({
                          value: Access.id,
                          label: Access.name,
                        }))}
                        classNamePrefix="select"
                        className="text-xs bg-second border p-1 border-none rounded-md outline-none focus:border-bgGray focus:ring-bgGray"
                        onChange={(selectedOptions) => {
                          handleSelectChange(selectedOptions);
                          assignConfirm();
                        }}
                        value={selectedOptions}
                        placeholder="Select Department"
                      />

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          className="bg-red-500 text-white px-4 py-2 rounded-md"
                          onClick={handleModalClose}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

{user && user.assign === "1" && selectedOptions1 ? (
  <div className="flex-col w-full lg:w-1/5 pr-4 pl-2 pt-2 mr-2">
    {/* Header with Icon */}
    <div className="flex items-center gap-2 mb-4">
      <span className="text-lg font-semibold ml-2 text-prime">Engineers</span>
      <button
        type="button"
        className="text-prime text-xl ml-3"
        onClick={() => setIsVendorModalOpen(true)}
      >
        <MdSupervisedUserCircle className="text-prime text-2xl" />
      </button>
    </div>

    {/* Selected Vendors Display */}
    <div className="flex-nowrap overflow-x-auto bg-box rounded-lg gap-2 mb-3 p-2 mr-4 max-h-40 overflow-y-auto">
      {selectedVendors.map((vendor) => (
        <div
          key={vendor.value}
          className="flex items-center bg-green-500 text-white text-xs rounded-full px-2 py-1 whitespace-nowrap w-full mb-2"
        >
          <span
            title={vendor.label}
            className="flex-grow text-xs cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap w-[90%]"
          >
            {vendor.label}
          </span>
          <button
            type="button"
            className="flex-shrink-0 w-[10%] ml-2 text-black font-bold hover:text-gray-300"
            onClick={() => handleVendorChipRemove(vendor)}
          >
            ×
          </button>
        </div>
      ))}
    </div>

    {/* Vendor Selection Modal */}
    {isVendorModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50">
    <div className="absolute top-1/2 left-3/4 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg h-auto shadow-lg w-11/12 sm:w-1/2 lg:w-1/3">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-lg font-semibold mb-4">Select Engineers</h2>
        <button 
          className="ml-2 px-2 py-1 bg-prime text-box font-medium rounded hover:bg-prime-dark focus:outline-none focus:ring-2 focus:ring-prime-light focus:ring-opacity-75 transition duration-150 ease-in-out text-xs"
          onClick={() => setShowInputField(!showInputField)}
        >
          Add Engineer +
        </button>
      </div>

      {/* ✅ Show Input Field to Add Engineer */}
      {showInputField && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter Engineer Name"
            value={newEngineer}
            onChange={(e) => setNewEngineer(e.target.value)}
            className="border p-2 rounded-md text-xs w-full"
          />
          <button
            className="mt-2 bg-prime text-white px-4 py-1 rounded-md text-xs"
            onClick={handleAddEngineer}
          >
            Submit
          </button>
        </div>
      )}

      {/* ✅ Use `availableVendors` directly instead of filtering */}
      <Select
        isMulti
        name="vendor"
        options={availableVendors}  
        classNamePrefix="select"
        className="text-xs bg-second border p-1 border-none rounded-md outline-none focus:border-bgGray focus:ring-bgGray"
        onChange={(selectedOptions1) => {
          setSelectedVendors(selectedOptions1);
          updateVendorInDB(ticketId, selectedOptions1.map((v) => v.value));
          
          // ✅ Update `availableVendors` dynamically
          setAvailableVendors(
            availableVendors.filter(v => !selectedOptions1.some(sv => sv.value === v.value))
          );
        }}
        value={selectedVendors}
        placeholder="Select Engineers"
      />

      {/* Close Buttons */}
      <div className="mt-4 flex justify-between">
        <button
          type="button"
          className="bg-gray-500 text-white px-4 py-2 rounded-md"
          onClick={() => {
            fetch(`${baseURL}backend/fetchSelectedVendors.php?id=${ticketId}`)
              .then((response) => response.json())
              .then((data) => {
                setSelectedVendors(data.vendors || []);
                setAvailableVendors(data.availableVendors || []);
              })
              .catch((error) => console.error("Error fetching selected vendors:", error));
            setIsVendorModalOpen(false);
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="bg-red-500 text-white px-4 py-2 rounded-md"
          onClick={() => setIsVendorModalOpen(false)}
        >
          Close
        </button>
          </div>
        </div>
      </div>
    )}
  </div>
) : null}
          </div>
          
        </div>
        {addEntry && (
          <div className="fixed w-[100%] h-[100%] bg-black/70 top-0 left-0 z-10 items-center justify-center">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg h-auto shadow-lg w-11/12  lg:w-2/3">
              <form
                onSubmit={handleSubmit}
                className="mb-4 flex items-center flex-col"
              >
                <div className="grid grid-cols-4 gap-4 bg-white p-5 rounded-md">
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      required
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      required
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="from_time"
                      className="block text-sm font-medium text-gray-700"
                    >
                      From Time
                    </label>
                    <input
                      type="time"
                      id="from_time"
                      name="from_time"
                      required
                      value={formData.from_time}
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="to_time"
                      className="block text-sm font-medium text-gray-700"
                    >
                      To Time
                    </label>
                    <input
                      type="time"
                      id="to_time"
                      name="to_time"
                      required
                      value={formData.to_time}
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex items-center mt-4 gap-2 rounded-md">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700"
                  >
                    {editMode ? "Update Entry" : "Add Entry"}
                  </button>
                  <div
                    onClick={() => {
                      setAddEntry(false);
                      setEditMode(false);
                      setFormData({
                        id: "",
                        date: "",
                        description: "",
                        from_time: "",
                        to_time: "",
                        total_hours: "",
                        done_by: "",
                      });
                    }}
                    className="gap-1 flex items-center bg-[red] px-4 py-2 rounded-md text-white cursor-pointer"
                  >
                    <span>Close</span>
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="text-xl text-white"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="max-w-full w-full bg-box p-3 -mt-0.5 rounded text-xs">
          <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={() => setShowTimesheet(true)}
              className={` font-semibold text-sm py-1 px-4 rounded-md shadow-md focus:outline-none ${
                showTimesheet
                  ? "bg-flo text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Timesheet
            </button>
            <button
              onClick={() => setShowTimesheet(false)}
              className={` font-semibold text-sm py-1 px-4 rounded-md shadow-md focus:outline-none ${
                !showTimesheet
                  ? "bg-flo text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Log
            </button>
          </div>

          {showTimesheet ? (
            <div>
              <div className="ticket-table px-4">
                <div className="flex justify-between items-start border-b">
                  <div>
                    <p className="flex items-center">
                      <span className="text-lg font-bold">Timesheet</span>
                      <button
                        onClick={handleButtonClick}
                        className="ml-2 px-4 py-2 bg-prime text-box font-medium rounded hover:bg-prime-dark focus:outline-none focus:ring-2 focus:ring-prime-light focus:ring-opacity-75 transition duration-150 ease-in-out"
                      >
                        ADD +
                      </button>
                    </p>
                  </div>

                  <TablePagination
                    rowsPerPageOptions={[
                      5,
                      10,
                      25,
                      { label: "All", value: -1 },
                    ]}
                    colSpan={3}
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} of ${
                        count !== -1 ? count : `more than ${to}`
                      }`
                    }
                  />

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => exportCSV(filteredUsers)}
                      className="bg-flo font-semibold text-sm text-white py-1 px-4 rounded-md shadow-md focus:outline-none"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => exportExcel(filteredUsers)}
                      className="bg-flo font-semibold text-sm text-white py-1 px-4 rounded-md shadow-md focus:outline-none"
                    >
                      Excel
                    </button>
                    <button
                      onClick={() => exportPDF(filteredUsers)}
                      className="bg-flo font-semibold text-sm text-white py-1 px-4 rounded-md shadow-md focus:outline-none"
                    >
                      PDF
                    </button>
                  </div>
                </div>

                <Table className="w-full rounded-lg overflow-hidden  filter-table">
                  <TableHead className="text-white">
                    <TableRow>
                      {[
                        "Id",
                        "Name",
                        "Date",
                        "Description",
                        "Start",
                        "End",
                        "Total Hours",
                        "Action",
                      ].map((header, index) => (
                        <TableCell key={index} className="w-1/8 py-2 px-4">
                          <div className="flex items-center justify-left gap-2">
                            <div className="header flex">
                              <span className="head">{header}</span>
                            </div>
                          </div>
                          {showFilter[
                            header.toLowerCase().replace(" ", "")
                          ] && (
                            <div className="mt-2 bg-prime p-2 rounded  filter">
                              <TextField
                                select
                                onChange={(e) =>
                                  handleFilterChange(
                                    e,
                                    header.toLowerCase().replace(" ", ""),
                                    e.target.value
                                  )
                                }
                                variant="outlined"
                                size="small"
                                className="mb-2 w-full"
                              >
                                <MenuItem value="contain">Contains</MenuItem>
                                <MenuItem value="not contain">
                                  Does Not Contain
                                </MenuItem>
                                <MenuItem value="equal to">Equal To</MenuItem>
                                <MenuItem value="more than">More Than</MenuItem>
                                <MenuItem value="less than">Less Than</MenuItem>
                              </TextField>
                              <TextField
                                type="text"
                                placeholder="Enter value"
                                onChange={(e) =>
                                  handleFilterChange(
                                    e,
                                    header.toLowerCase().replace(" ", ""),
                                    filters[
                                      header.toLowerCase().replace(" ", "")
                                    ]?.type || "contain"
                                  )
                                }
                                variant="outlined"
                                size="small"
                                className="w-full"
                              />
                            </div>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTickets.map((user, index) => (
                      <TableRow key={user.id} hover>
                        <TableCell
                          className="border-t"
                          style={{ textAlign: "left" }}
                        >
                          {index + 1 + page * rowsPerPage}{" "}
                          {/* Adjust numbering with offset */}
                        </TableCell>
                        <TableCell
                          className="border-t"
                          style={{ textAlign: "left" }}
                        >
                          {user.name}
                        </TableCell>
                        <TableCell
                          className="border-t"
                          style={{ textAlign: "left" }}
                        >
                          {user.date}
                        </TableCell>
                        <TableCell
                          className="border-t"
                          style={{ textAlign: "left" }}
                        >
                          {user.description}
                        </TableCell>
                        <TableCell
                          className="border-t"
                          style={{ textAlign: "left" }}
                        >
                          {user.starttime}
                        </TableCell>
                        <TableCell
                          className="border-t"
                          style={{ textAlign: "left" }}
                        >
                          {user.endtime}
                        </TableCell>
                        <TableCell
                          className="border-t"
                          style={{ textAlign: "left" }}
                        >
                          {user.totalhours}
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEdit(user)}>
                            <FontAwesomeIcon
                              icon={faEdit}
                              className="text-blue-500 text-sm"
                            />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(user.id)}>
                            <FontAwesomeIcon
                              icon={faTrashAlt}
                              className="text-red-500 text-sm"
                            />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div>
              <div className="ticket-table px-4">
                <div className="flex justify-between items-start border-b">
                  <div>
                    <h2 className="text-xl font-bold text-prime">
                      <span>Log</span>
                    </h2>
                  </div>
                  <TablePagination
                    rowsPerPageOptions={[
                      5,
                      10,
                      25,
                      { label: "All", value: -1 },
                    ]} // Pagination options
                    colSpan={3}
                    count={totalUsers} // Total number of users
                    rowsPerPage={rowsPerPage} // Rows per page
                    page={page} // Current page
                    onPageChange={handleChangePage} // Handle page change
                    onRowsPerPageChange={handleRowsPerPageChange} // Handle rows per page change
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} of ${
                        count !== -1 ? count : `more than ${to}`
                      }`
                    } // Display format like "1-5 of 10"
                  />
                  <div className="flex justify-end flex-wrap space-x-2">
                    <button
                      onClick={() => exportCSV1(filteredUsers2)}
                      className="bg-flo font-semibold text-sm text-white py-1 px-4 rounded-md shadow-md focus:outline-none"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => exportExcel1(filteredUsers2)}
                      className="bg-flo font-semibold text-sm text-white py-1 px-4 rounded-md shadow-md focus:outline-none"
                    >
                      Excel
                    </button>
                    <button
                      onClick={() => exportPDF1(filteredUsers2)}
                      className="bg-flo font-semibold text-sm text-white py-1 px-4 rounded-md shadow-md focus:outline-none"
                    >
                      PDF
                    </button>
                  </div>
                </div>

                <Table sx={{ minWidth: 750 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      {[
                        "Id",
                        "Name",
                        "Status From",
                        "Status To",
                        "Post Date",
                      ].map((header, index) => (
                        <TableCell key={index} align="center">
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <span style={{ marginRight: 8 }}>{header}</span>
                          </div>
                          {showFilter[
                            header.toLowerCase().replace(" ", "")
                          ] && (
                            <div
                              style={{
                                marginTop: 2,
                                padding: 2,
                                backgroundColor: "#f5f5f5",
                                borderRadius: 2,
                              }}
                            >
                              <Select
                                fullWidth
                                value={
                                  filters[header.toLowerCase().replace(" ", "")]
                                    ?.type || "contain"
                                }
                                onChange={(e) =>
                                  handleFilterChange(
                                    e,
                                    header.toLowerCase().replace(" ", ""),
                                    e.target.value
                                  )
                                }
                              >
                                <MenuItem value="contain">Contains</MenuItem>
                                <MenuItem value="not contain">
                                  Does Not Contain
                                </MenuItem>
                                <MenuItem value="equal to">Equal To</MenuItem>
                                <MenuItem value="more than">More Than</MenuItem>
                                <MenuItem value="less than">Less Than</MenuItem>
                              </Select>
                              <InputBase
                                placeholder="Enter value"
                                fullWidth
                                style={{
                                  marginTop: 2,
                                  padding: 2,
                                  border: "1px solid #ccc",
                                  borderRadius: 2,
                                }}
                                onChange={(e) =>
                                  handleFilterChange(
                                    e,
                                    header.toLowerCase().replace(" ", ""),
                                    filters[
                                      header.toLowerCase().replace(" ", "")
                                    ]?.type || "contain"
                                  )
                                }
                              />
                            </div>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTickets2.map((user, i) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{i + 1 + page * rowsPerPage}</TableCell>{" "}
                        {/* Add offset for correct row number */}
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.statusfrom}</TableCell>
                        <TableCell>{user.statusto}</TableCell>
                        <TableCell>{user.post_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
            <DialogTitle id="alert-dialog-title">{"Change Ticket Status"}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    Are you sure you want to change the ticket status to{" "}
                    {status[selectedStep]?.subName}?
                </DialogContentText>
                <br />

                {/* Date Picker (Always Shown) */}
                <TextField
                    label="Select Date"
                    type="datetime-local"
                    fullWidth
                    margin="dense"
                    required
                    InputLabelProps={{ shrink: true }}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />

                {/* RCA Dropdown (Only show when status is 'Closed') */}
                {status[selectedStep]?.subName === "Closed" && (
                    <TextField
                        select
                        label="Select RCA"
                        fullWidth
                        margin="dense"
                        required
                        value={selectedRCA}
                        onChange={(e) => setSelectedRCA(e.target.value)}
                    >
                        <MenuItem value="">Select RCA</MenuItem>
                        {rcaList.map((rca) => (
                            <MenuItem key={rca.id} value={rca.id}>
                                {rca.name}
                            </MenuItem>
                        ))}
                    </TextField>
                )}
                {status[selectedStep]?.subName === "Closed" && (
                    <TextField
                    label="Docket No :"
                    type="text-local"
                    fullWidth
                    margin="dense"
                    required
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => setDocket(e.target.value)}
                  />
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                    onClick={handleConfirm}
                    autoFocus
                    disabled={
                        (status[selectedStep]?.subName === "Closed" && !selectedRCA)
                    }
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    </div>
  );
};

export default SingleTicket;
