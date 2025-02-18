import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { baseURL } from "../../config.js";
import { FaFilter } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

import ReactPaginate from "react-paginate";
import html2canvas from "html2canvas";
import { UserContext } from "../UserContext/UserContext.jsx";
import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Select, MenuItem, TextField, IconButton, TablePagination } from "@mui/material";

const Form = () => {
  const [formData, setFormData] = useState({
    domain: "",
  });
  const { user } = useContext(UserContext);
  console.log("DashBoard context value:", user);
  const [ticketsPerPage, setTicketsPerPage] = useState(10); // default to 10 rows per page
  const [currentPage, setCurrentPage] = useState(0);
  let i = 1;

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState({
    id: false,
    name: false,
  });

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${baseURL}/backend/fetchTicket_status.php`
        );
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
    const fileExtension = file ? file.name.split(".").pop().toLowerCase() : "";

    if (file && allowedExtensions.includes(fileExtension)) {
      setAttachment(file);
      setAttachmentError("");
    } else {
      setAttachment(null);
      setAttachmentError(
        "Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed."
      );
    }
  };

  const handleRowsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10); // Parse the input value as an integer
    if (!isNaN(value) && value >= 1) {
      setTicketsPerPage(value);
      setCurrentPage(0); // Update state only if value is a valid number >= 1
    } else {
      setTicketsPerPage(1);
      setCurrentPage(0); // Default to 1 if input is cleared or set to invalid value
    }
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    for (const key in formData) {
      form.append(key, formData[key]);
    }
    if (attachment) {
      form.append("attachment", attachment);
    }

    try {
      const response = await fetch(`${baseURL}/backend/ticket_status_add.php`, {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }
      setSubmissionStatus({ success: true, message: result.message });
      toast.success("Ticket Status added");
      location.reload();
    } catch (error) {
      setSubmissionStatus({
        success: false,
        message:
          "There was a problem with your fetch operation: " + error.message,
      });
    }
  };

  const handleFilterChange = (e, field, type) => {
    const value = e.target.value.toLowerCase(); // convert filter value to lowercase
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

  const exportCSV = () => {
    // Get table headers
    const tableHeaders = Array.from(
      document.querySelectorAll(".header span")
    ).map((header) => header.textContent.trim());

    // Get table data values
    const tableData = Array.from(document.querySelectorAll("table tr")).map(
      (row) =>
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
    link.setAttribute("download", "Ticket_status.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const table = document.querySelector(".filter-table");
    if (!table) return;

    // Extract table headers
    const headers = Array.from(document.querySelectorAll(".header span")).map(
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
    XLSX.writeFile(workbook, "Ticket_status.xlsx");
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
      pdf.save("Ticket_status.pdf");

      // Remove the cloned table from the document
      document.body.removeChild(tableClone);
    });
  };
  const offset = currentPage * ticketsPerPage;
  const currentTickets = filteredUsers.slice(offset, offset + ticketsPerPage);

  return (
    <div className="bg-second max-h-5/6 w-full relative  text-xs mx-auto lg:overflow-y-hidden h-auto ticket-scroll">
      {showForm && (
        <div className="w-full relative  m-1 mb-1 bg-box p-3 rounded-lg font-mont ">
          <div className="ticket-table mt-2">
            <form onSubmit={handleSubmit} className="space-y-4 text-label">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 ml-10 pr-10 mb-0">
                <div className="font-mont font-semibold text-2xl mb-4">
                  Ticet Status Details:
                </div>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 ml-10 pr-10 mb-0">
                <div className="flex items-center mb-2 mr-4">
                  <label className="text-sm font-semibold text-prime mr-2 w-16">
                    Name
                  </label>
                  <input
                    type="text"
                    name="status"
                    placeholder="Enter Ticket Status Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                  />
                  <button
                    type="submit"
                    className="hover:bg-prime border-2 border-prime font-bold text-sm text-prime hover:text-white py-2 px-4 rounded-md shadow focus:outline-none transition ml-2"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="w-full relative m-0.5 bg-box p-3 rounded-lg font-mont">


        {/* Table displaying fetched user data */}
        <div className="ticket-table mt-8">
          <h2 className="text-2xl font-bold text-prime mb-4 flex justify-between items-center">

            <span className="items-end">
              <span>Ticket Status Data </span>
              <button
                onClick={() => setShowForm(!showForm)}
                className="hover:bg-prime border-2 border-prime font-bold text-sm text-prime hover:text-white py-2 px-4 rounded-md shadow focus:outline-none transition"
              >
                {showForm ? "Close" : "+ Add Ticket Status"}
              </button>
            </span>
            <span>
              {/* Pagination Controls */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]} // Options for rows per page
                component="div"
                count={filteredUsers.length} // Total number of rows
                rowsPerPage={ticketsPerPage} // Current rows per page
                page={currentPage} // Current page index
                onPageChange={(event, newPage) => setCurrentPage(newPage)} // Change page
                onRowsPerPageChange={(event) => {
                  setTicketsPerPage(parseInt(event.target.value, 10)); // Update rows per page
                  setCurrentPage(0); // Reset to first page
                }}
              />
            </span>
            <span>
              <div className="flex justify-end flex-wrap space-x-2 mt-4">
                <button
                  onClick={exportCSV}
                  className="bg-second font-sui font-bold text-xs border hover:bg-flo hover:text-white transition-all ease-out py-1 px-3 rounded-md shadow-md focus:outline-none"
                >
                  CSV
                </button>
                <button
                  onClick={exportExcel}
                  className="bg-second font-sui font-bold text-xs border hover:bg-flo hover:text-white transition-all ease-out py-1 px-3 rounded-md shadow-md focus:outline-none"
                >
                  Excel
                </button>
                <button
                  onClick={exportPDF}
                  className="bg-second font-sui font-bold text-xs border hover:bg-flo hover:text-white transition-all ease-out py-1 px-3 rounded-md shadow-md focus:outline-none"
                >
                  PDF
                </button>
              </div>
            </span>
          </h2>



          <Table className="min-w-full  rounded-lg overflow-hidden">
            <TableHead className="">
              <TableRow>
                {["Id", "status"].map((header, index) => (
                  <TableCell key={index} className="w-1/6 py-2 px-4">
                    <div className="flex items-center justify-center">
                      <div className="header flex font-semibold text-sm">
                        <span>{header}</span>

                      </div>
                    </div>

                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {currentTickets.map((user, i) => (
                <TableRow key={user.id} className="hover:bg-gray-100">
                  <TableCell style={{ padding: '10px' }} className="border-t" align="center">{i + offset}</TableCell>
                  <TableCell style={{ padding: '10px' }} className="border-t" align="center">{user.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </div>

      </div>
    </div>
  );
};

export default Form;
