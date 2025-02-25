import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { baseURL } from "../../config.js";
import { FaFilter } from "react-icons/fa";
import "./customer.css";
import ReactPaginate from "react-paginate";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { UserContext } from "../UserContext/UserContext";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Select,
  MenuItem,
  TextField,
  TablePagination,
} from "@mui/material";
const Form = () => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    mobile: "",
    mail: "",
    department: "",
    contact_person: "",
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
  const [clientList, setClientList] = useState([]);
  const [showFilter, setShowFilter] = useState({
    id: false,
    name: false,
    location: false,
    mobile: false,
    email: false,
  });

  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(`${baseURL}/backend/fetchCustomers.php`);
      const data = await response.json();
      console.log("Fetched Data:", data); // Debugging
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  
  useEffect(() => {
    fetchData(); // Call fetchData when component loads
  }, []);
  
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${baseURL}/backend/client.php`);
        const data = await response.json();
        setClientList(data);
        
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
      [name]: name === "client_id" ? Number(value) : value, // Convert to integer
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
   
    Object.keys(formData).forEach((key) => {
      form.append(key, formData[key]);
    });
  
    if (attachment) {
      form.append("attachment", attachment);
    }
  
    try {
      const response = await fetch(`${baseURL}/backend/customer_add.php`, {
        method: "POST",
        body: form,
      });
      console.log("form", form)
      const result = await response.json();
      
      console.log("Response Body:", result);
  
      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }
  
      setSubmissionStatus({ success: true, message: result.message });
      toast.success("Customer added successfully!");
  
      // ✅ Reset form fields
      setFormData({
        client_id: "",
        gclunicode: "",
        gclreg: "",
        branchcode: "",
        a_end: "",
        b_end: "",
        node: "",
        modem_type: "",
        router_ip: "",
        primary_link: "",
        wan_ip: "",
        circuit_id: "",
        band_width: "",
        location_type: "",
        address: "",
        contact_num: "",
        mob_num: "",
        commi_date: "",
        state_city: "",
        email: "",
        sla: "",
        service_provider: "",
      });
  
fetchData(); // Fetch updated data

      setAttachment(null); // Reset file attachment if any
    } catch (error) {
      console.error("Submission Error:", error);
      setSubmissionStatus({
        success: false,
        message: "Error during submission: " + error.message,
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

  return (
    <div className="bg-second max-h-5/6 w-full relative text-xs mx-auto lg:overflow-y-hidden h-auto ticket-scroll">
      <div
        className={`box w-full relative m-1 mb-1 bg-box p-3 rounded-lg font-mont transition-height duration-300 ${showForm ? "h-auto block" : " h-0 overflow-hidden hidden"
          }`}
        style={{
          transition: "ease-in-out 1s",
        }}
      >
        <div className="ticket-table  ">
          <form onSubmit={handleSubmit} className="space-y-4 text-label">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 ml-10 pr-10 mb-0">
              <div className="font-mont font-semibold text-2xl mb-4">
                Customer Details:
              </div>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-10 ml-10 pr-10 mb-0">
            <div className="mb-2 mr-4 mt-3">
      <label className="text-sm font-semibold text-prime w-44">
        Name
      </label>
      <select
  name="client_id"
  value={formData.client_id}
  onChange={handleChange}
  required
   className="w-60 mt-2 flex-grow text-xs bg-box border p-2 rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
>
  <option value="">Select Name</option>
  {clientList.map((client) => (
    <option key={client.id} value={client.id}> {/* Send ID, not name */}
      {client.name}
    </option>
  ))}
</select>



    </div>
    {[
  { label: "GCL UNIQUE CODE", type: "text", name: "gclunicode" },
  { label: "GCL REGION", type: "text", name: "gclreg" },
  { label: "BRANCH CODE", type: "text", name: "branchcode" },
  { label: "A END", type: "text", name: "a_end" },
  { label: "B END", type: "text", name: "b_end" },
  { label: "NODE", type: "text", name: "node" },
  { label: "MODEM TYPE", type: "text", name: "modem_type" },
  { label: "ROUTER IP", type: "text", name: "router_ip" },
  { label: "PRIMARY LINK", type: "text", name: "primary_link" },
  { label: "WAN IP", type: "text", name: "wan_ip" },
  { label: "CIRCUIT ID", type: "text", name: "circuit_id" },
  { label: "BAND WIDTH", type: "text", name: "band_width" },
  { label: "LOCATION TYPE", type: "text", name: "location_type" },
  { label: "ADDRESS", type: "text", name: "address" },
  { label: "CONTACT NUMBER", type: "number", name: "contact_num" },
  { label: "MOBILE NUMBER", type: "number", name: "mob_num" },
  { label: "COMMISSIONED DATE", type: "text", name: "commi_date" },
  { label: "STATE/CITY", type: "text", name: "state_city" },
  { label: "E MAIL ID", type: "email", name: "email" },
  { label: "SLA", type: "text", name: "sla" },
  { label: "SERVICE PROVIDER", type: "text", name: "service_provider" },
].map(({ label, type, name }, index) => (
  <div key={index} className="flex flex-col mt-4">
    <label className="font-semibold text-sm mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={formData[name] || ""}
      onChange={handleChange}
      className="border rounded p-2"
      placeholder={`Enter ${label}`}
    />
  </div>
))}

            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 ml-20 pr-20">
              <div className="ml-4 mt-1 md:ml-0 md:w-full flex justify-center items-center">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center rounded-lg cursor-pointer  dark:hover:bg-bray-800 w-full md:w-1/2"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      className={
                        attachment
                          ? "w-8 h-8 text-flo dark:text-gray-500"
                          : "w-8 h-8 text-gray-500 dark:text-gray-500"
                      }
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentcolor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p
                      className={
                        attachment
                          ? " text-sm text-flo font-bold"
                          : " text-sm text-prime font-bold"
                      }
                    >
                      {attachment ? attachment.name : "Click to upload"}
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    name="attachment"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
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

      <div className="w-full relative m-0.5 bg-box p-3 rounded-lg font-mont">


        {/* Table displaying fetched user data */}
        <div className="ticket-table mt-8">

          <div className="flex justify-between items-center space-x-2 my-1 p-2">
            <h2 className="text-2xl font-bold text-prime mb-4">
              <span>Customer Data </span>
              <span className="items-end">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="hover:bg-prime border-2 border-prime ml-4 font-sui font-bold text-sm text-prime hover:text-white py-1 px-3 rounded-md shadow focus:outline-none"
                >
                  {showForm ? "Close" : "+ Add Customer"}
                </button>
              </span>
            </h2>

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
              <div className="flex justify-end flex-wrap space-x-2 ">
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


          </div >


          <div className="overflow-auto max-h-[500px]">
  <Table className="min-w-full">
    {/* Sticky Header */}
    <TableHead className="sticky top-0 bg-white z-10 shadow-md">
      <TableRow>
        {[
          "ID",
          "NAME",
          "GCL UNIQUE CODE",
          "GCL REGION",
          "BRANCH CODE",
          "A END",
          "B END",
          "NODE",
          "MODEM TYPE",
          "ROUTER IP",
          "PRIMARY LINK",
          "WAN IP",
          "CIRCUIT ID",
          "BAND WIDTH",
          "LOCATION TYPE",
          "ADDRESS",
          "CONTACT NUMBER",
          "MOBILE NUMBER",
          "COMMISSIONED DATE",
          "STATE/CITY",
          "E MAIL ID",
          "SLA",
          "SERVICE PROVIDER",
        ].map((header, index) => (
          <TableCell key={index} className="whitespace-nowrap p-2">
            <div style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{header}</div>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>

    {/* Scrollable Body */}
    <TableBody>
  {currentTickets.map((user, i) => (
    <TableRow key={user.id} hover>
      <TableCell className="border-t p-2">{i + 1}</TableCell>
      <TableCell className="border-t p-2">{user.client_id}</TableCell> {/* Show client name instead of ID */}
      <TableCell className="border-t p-2">{user.gcl_unique_code}</TableCell>
      <TableCell className="border-t p-2">{user.gcl_region}</TableCell>
      <TableCell className="border-t p-2">{user.branch_code}</TableCell>
      <TableCell className="border-t p-2">{user.a_end}</TableCell>
      <TableCell className="border-t p-2">{user.b_end}</TableCell>
      <TableCell className="border-t p-2">{user.node}</TableCell>
      <TableCell className="border-t p-2">{user.modem_type}</TableCell>
      <TableCell className="border-t p-2">{user.router_ip}</TableCell>
      <TableCell className="border-t p-2">{user.primary_link}</TableCell>
      <TableCell className="border-t p-2">{user.wan_ip}</TableCell>
      <TableCell className="border-t p-2">{user.circuit_id}</TableCell>
      <TableCell className="border-t p-2">{user.band_width}</TableCell>
      <TableCell className="border-t p-2">{user.location_type}</TableCell>
      <TableCell className="border-t p-2">{user.address}</TableCell>
      <TableCell className="border-t p-2">{user.contact_number}</TableCell> 
      <TableCell className="border-t p-2">{user.mobile_number}</TableCell>
      <TableCell className="border-t p-2">{user.commi_date}</TableCell>
      <TableCell className="border-t p-2">{user.state_city}</TableCell>
      <TableCell className="border-t p-2">{user.email_id}</TableCell>
      <TableCell className="border-t p-2">{user.sla}</TableCell>
      <TableCell className="border-t p-2">{user.service_provider}</TableCell>
    </TableRow>
  ))}
</TableBody>


  </Table>
</div>

        </div>
        {/* Pagination Controls */}

      </div>
    </div>
  );
};

export default Form;
