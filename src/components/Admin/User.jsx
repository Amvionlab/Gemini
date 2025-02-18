import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { baseURL } from "../../config.js";
import { FaFilter } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

import ReactPaginate from "react-paginate";
import html2canvas from "html2canvas";
import { UserContext } from "../UserContext/UserContext";
import { ConstructionOutlined } from "@mui/icons-material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  TextField,
  TablePagination
} from "@mui/material";


const headers = [
  "Id",
  "First Name",
  "Last Name",
  "Username",
  "User Type",
  "Mobile",
  "Location",
  "Employee ID",
];


const Form = () => {
  const [formData, setFormData] = useState({
    domain: "",
    sub_domain: "",
    location: "",
    employee_id: "",
    password: "",
  });
  const { user } = useContext(UserContext);
  const [ticketsPerPage, setTicketsPerPage] = useState(10); // default to 10 rows per page
  const [currentPage, setCurrentPage] = useState(0);
  let i = 1;

  const [domains, setDomains] = useState([]);
  const [subDomains, setSubDomains] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [filters, setFilters] = useState({});
  const [employee, setEmployee] = useState([]);
  const [access, setAccess] = useState([]);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showFilter, setShowFilter] = useState({
    id: false,
    name: false,
    lastname: false,
  });

  const [showForm, setShowForm] = useState(false);


  useEffect(() => {
    // Function to generate a random password of 10 characters
    const generatePassword = () => {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let password = "";
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters[randomIndex];
      }
      return password;
    };

    // Set the generated password in formData
    setFormData((prevState) => ({
      ...prevState,
      password: generatePassword(),
    }));
  }, []);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const response = await fetch(`${baseURL}/backend/fetchAccess.php`);
        const data = await response.json();
        setAccess(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchAccess();

    const fetchDrop = async () => {
      try {
        const response = await fetch(`${baseURL}backend/dropdown.php`);
        const data = await response.json();

        setDomains(data.domains);
        setSubDomains(data.subDomains);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchDrop();

    const fetchData = async () => {
      try {
        const response = await fetch(`${baseURL}/backend/fetchUsers.php`);
        const data = await response.json();
        setUsers(data);
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
  const filteredSubDomains = subDomains.filter(
    (subDomain) => subDomain.domain_id === formData.domain
  );
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

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const response = await fetch(`${baseURL}/backend/fetchAccess.php`);
        const data = await response.json();
        setAccess(data);
      } catch (error) {
        console.error("Error fetching access:", error);
      }
    };

    const fetchEmployee = async () => {
      try {
        const response = await fetch(`${baseURL}/backend/fetchEmployees.php`);
        const data = await response.json();
        setEmployee(data);
      } catch (error) {
        console.error("Error fetching access:", error);
      }
    };
    console.log("emp", employee)
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${baseURL}/backend/fetchUsers.php`);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAccess();
    fetchUsers();
    fetchEmployee();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    document.body.classList.add("cursor-wait", "pointer-events-none");
    const form = new FormData();
    for (const key in formData) {
      form.append(key, formData[key]);
    }
    if (attachment) {
      form.append("attachment", attachment);
    }

    try {
      const response = await fetch(`${baseURL}/backend/user_add.php`, {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }
      setSubmissionStatus({ success: true, message: result.message });
      toast.success("User added");
      document.body.classList.remove("cursor-wait", "pointer-events-none");
      location.reload();
    } catch (error) {
      setSubmissionStatus({
        success: false,
        message:
          "There was a problem with your fetch operation: " + error.message,
      });
    }
  };
  const pageCount = Math.ceil(filteredUsers.length / ticketsPerPage);

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
      document.querySelectorAll(".header .head")
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
    link.setAttribute("download", "Analytics.csv");
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
    XLSX.writeFile(workbook, "Analytics.xlsx");
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
      pdf.save("Analytics.pdf");

      // Remove the cloned table from the document
      document.body.removeChild(tableClone);
    });
  };
  const offset = currentPage * ticketsPerPage;
  const currentTickets = filteredUsers.slice(offset, offset + ticketsPerPage);
  console.log(currentTickets);

  return (
    <div className="bg-second p-1 w-full h-full text-xs lg:overflow-y-hidden  ticket-scroll">
      {showForm && (
        <div className="max-w-full w-full mt-1 mb-1 p-2 bg-box rounded-lg font-mont">
          <div className="ticket-table mt-2">
            <form onSubmit={handleSubmit} className="space-y-4 text-label">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 ml-10 pr-10 mb-0">
                <div className="text-lg font-bold text-prime mb-2 font-mont">
                  User Details:
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-10 ml-10 pr-10 mb-0">

                {/* Employee Name Dropdown */}
                <div className="flex items-center mb-2 mr-4">
                  <label className="text-sm font-semibold text-prime mr-2 w-32">
                    Employee <span className="text-red-600 text-md font-bold">*</span>
                  </label>
                  <select
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    className="selectbox flex-grow text-xs bg-box border w-32 p-3 rounded-md outline-none focus:border-bgGray focus:ring-bgGray focus:shadow-prime focus:shadow-sm"
                  >
                    <option value="" className="custom-option">
                      Select Employee
                    </option>
                    {employee.map((employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                        className="custom-option"
                      >
                        {employee.firstname} - {employee.employee_id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Username Input */}
                <div className="flex items-center mb-2 mr-4">
                  <label className="text-sm font-semibold text-prime mr-2 w-32">
                    Username<span className="text-red-600 text-md font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="flex-grow text-xs bg-box border p-3 rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                  />
                </div>

                {/* User Type Dropdown */}
                <div className="flex items-center mb-2 mr-4">
                  <label className="text-sm font-semibold text-prime mr-2 w-32 text-nowrap">
                    User Type<span className="text-red-600 text-md font-bold">*</span>
                  </label>
                  <select required
                    name="usertype"
                    value={formData.usertype}
                    onChange={handleChange}
                    className="selectbox flex-grow text-xs bg-box border p-3 rounded-md outline-none focus:border-bgGray focus:ring-bgGray focus:shadow-prime focus:shadow-sm"
                  >
                    <option value="" className="custom-option">
                      Select User Type
                    </option>
                    {access.map((access) => (
                      <option key={access.id} value={access.id} className="custom-option">
                        {access.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department Dropdown - Conditional */}
                {showDepartmentDropdown && (
                  <div className="flex items-center mb-2 mr-4">
                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                      Department<span className="text-red-600 text-md font-bold">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="selectbox flex-grow text-xs bg-box border p-3 rounded-md outline-none focus:border-bgGray focus:ring-bgGray focus:shadow-prime focus:shadow-sm"
                    >
                      <option value="" className="custom-option">
                        Select Department
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id} className="custom-option">
                          {dept.type}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="hover:bg-prime border-2 border-prime ml-4 font-sui font-bold text-sm text-prime hover:text-white py-1 px-3 rounded-md shadow focus:outline-none"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="w-full h-full bg-box p-3 rounded-lg font-mont">
        <div className="flex justify-end flex-wrap space-x-2">

        </div>

        {/* Table displaying fetched user data */}
        <div className="ticket-table">
          <h2 className="text-2xl font-bold text-prime mb-4 p-2 flex justify-between items-center">
            <span className="flex items-center gap-2">
              User Data
              <button
                onClick={() => setShowForm(!showForm)}
                className="hover:bg-prime border-2 border-prime ml-4 font-sui font-bold text-sm text-prime hover:text-white py-1 px-3 rounded-md shadow focus:outline-none"
              >
                {showForm ? "Close" : "+ Add User"}
              </button>
            </span>

            <span className="text-xl ">
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
            <span className="flex items-center gap-3">
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
            </span>
          </h2>



          <Table>
            <TableHead className=" font-semibold font-poppins text-xl">
              <TableRow>
                {headers.map((header, index) => (
                  <TableCell key={index} sx={{ fontWeight: "bold" }}>
                    {header}

                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {currentTickets.map((userdet, index) => (
                <TableRow key={userdet.id} hover>
                  <TableCell style={{ padding: '10px 4px', textAlign: "left" }} className="border-t">{index + 1}</TableCell>
                  <TableCell style={{ padding: '10px 4px', textAlign: "left" }} className="border-t">{userdet.firstname}</TableCell>
                  <TableCell style={{ padding: '10px 4px', textAlign: "left" }} className="border-t">{userdet.lastname}</TableCell>
                  <TableCell style={{ padding: '10px 4px', textAlign: "left" }} className="border-t">{userdet.username}</TableCell>
                  <TableCell style={{ padding: '10px 4px', textAlign: "left" }} className="border-t">{userdet.typename}</TableCell>
                  <TableCell style={{ padding: '10px 4px', textAlign: "left" }} className="border-t">{userdet.mobile}</TableCell>
                  <TableCell style={{ padding: '10px 4px', textAlign: "left" }} className="border-t">{userdet.location}</TableCell>
                  <TableCell style={{ padding: '10px 4px', textAlign: "left" }} className="border-t" align="center">{userdet.employee_id}</TableCell>
                   </TableRow>
              ))}
            </TableBody>
          </Table>

        </div>
        {/* Pagination Controls */}

      </div>
    </div>
  );
};

export default Form;
