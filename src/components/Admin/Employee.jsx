import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { baseURL } from '../../config.js';
import { FaFilter } from "react-icons/fa";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TablePagination
} from '@mui/material';

import ReactPaginate from 'react-paginate';
import html2canvas from 'html2canvas';
import { UserContext } from '../UserContext/UserContext';
import { ConstructionOutlined } from "@mui/icons-material";

const Form = () => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        empid: '',
        dept: '',
        designation: '',
        authority: '',
        location: '',
        state: '',
        country: '',
        build: '',
        block: '',
        floor: '',
        email: '',
        mobile: ''
    });
    const [message, setMessage] = useState('');
    const { user } = useContext(UserContext);
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
        lastname: false,

    });

    const [showForm, setShowForm] = useState(false);
    const [Access, setAccess] = useState([]);
    const [locations, setLocations] = useState([]);

    useEffect(() => {

        const fetchUsers = async () => {
            try {
                const response = await fetch(`${baseURL}/backend/fetchEmployees.php`);
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await fetch(`${baseURL}/backend/dropdown.php`);
                const data = await response.json();
                if (data.locations && Array.isArray(data.locations)) {
                    setLocations(data.locations);
                } else {
                    console.error("Unexpected data format:", data);
                }
            } catch (error) {
                console.error("Error fetching locations:", error);
            }
        };

        fetchLocations();

    }, []);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
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

    const headers = ["Id", "First Name", "Last Name", "Mobile", "Email", "Location", "Employee ID", "Department", "Designation"];

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
            const response = await fetch(`${baseURL}/backend/employee_add.php`, {
                method: "POST",
                body: form,
            });

            // Check the raw response for debugging
            const result = await response.json();

            console.log("Response:", result); // Log the response to check its format

            if (!response.ok) {
                throw new Error(result.message || "Something went wrong");
            }

            // Handle response based on the message
            if (result.message === 'Employee Already Exists') {
                setSubmissionStatus({ success: false, message: result.message });
                toast.error(result.message); // Display error message
            } else if (result.message === 'Employee added successfully.') {
                setSubmissionStatus({ success: true, message: result.message });
                toast.success(result.message); // Display success message
                location.reload(); // Reload the page to reflect changes
            } else {
                throw new Error("Unexpected response message.");
            }
        } catch (error) {
            setSubmissionStatus({
                success: false,
                message: "There was a problem with your fetch operation: " + error.message,
            });
            toast.error("There was a problem with your fetch operation: " + error.message); // Display error message
        }
    };

    const pageCount = Math.ceil(filteredUsers.length / ticketsPerPage);

    const handleFilterChange = (e, field, type) => {
        const value = e.target.value.toLowerCase(); // convert filter value to lowercase
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: { type, value }
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
                        if (type === "not contain") return true; if (type === "more than" || type === "less than") return false;
                    }

                    const fieldValueStr = fieldValue.toString().toLowerCase();
                    const valueStr = value.toLowerCase();

                    if (type === "contain")
                        return fieldValueStr.includes(valueStr);
                    if (type === "not contain")
                        return !fieldValueStr.includes(valueStr);
                    if (type === "equal to")
                        return fieldValueStr === valueStr;
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
        const tableHeaders = Array.from(document.querySelectorAll(".header .head"))
            .map(header => header.textContent.trim());

        // Get table data values
        const tableData = Array.from(document.querySelectorAll("table tr")).map(row =>
            Array.from(row.querySelectorAll("td")).map(cell => cell.textContent.trim())
        );

        // Filter out rows that contain filter content
        const filteredTableData = tableData.filter(row =>
            !row.some(cell => cell.includes("Contains") || cell.includes("Does Not Contain") || cell.includes("Equal To") || cell.includes("More Than") || cell.includes("Less Than"))
        );

        // Create CSV content
        const csvContent = [
            tableHeaders.join(","),
            ...filteredTableData.map(row => row.join(","))
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
        const table = document.querySelector('.filter-table');
        if (!table) return;

        // Extract table headers
        const headers = Array.from(document.querySelectorAll(".header .head")).map(header => header.textContent.trim());

        // Extract table data values
        const rows = Array.from(table.querySelectorAll('tbody tr')).map(row =>
            Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim())
        );

        // Filter out rows that contain filter content
        const filteredRows = rows.filter(row =>
            !row.some(cell => cell.includes("Contains") || cell.includes("Does Not Contain") || cell.includes("Equal To") || cell.includes("More Than") || cell.includes("Less Than"))
        );

        const data = [headers, ...filteredRows];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, 'Analytics.xlsx');
    };


    const exportPDF = () => {
        const table = document.querySelector('.filter-table');
        if (!table) return;

        // Create a copy of the table
        const tableClone = table.cloneNode(true);

        // Remove filter dropdowns and inputs from the cloned table
        tableClone.querySelectorAll('.filter').forEach(filter => filter.remove());

        // Center-align all table cell contents
        tableClone.querySelectorAll('th, td').forEach(cell => {
            cell.style.textAlign = 'center';
        });

        // Append the cloned table to the body (temporarily)
        document.body.appendChild(tableClone);

        // Use html2canvas to convert the cloned table to an image
        html2canvas(tableClone).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const imgWidth = 210;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save('Analytics.pdf');

            // Remove the cloned table from the document
            document.body.removeChild(tableClone);
        });
    };
    const offset = currentPage * ticketsPerPage;
    const currentTickets = filteredUsers.slice(offset, offset + ticketsPerPage);

    console.log(currentTickets);

    return (
        <div className="bg-second max-h-full max-w-4/6 text-xs mx-auto p-1 lg:overflow-y h-full ticket-scroll">

            {showForm && (
                <div className="max-w-full w-full mt-1 mb-1 p-2 bg-box rounded-lg font-mont " >
                    <div className="ticket-table mt-2">
                        <form onSubmit={handleSubmit} className="space-y-4 text-label">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 ml-10 pr-10 mb-0">
                                <div className="text-lg font-bold text-prime mb-2 font-mont">
                                    Employee Details:
                                </div>
                            </div>

                            {/* Additional Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 ml-10 pr-10 mb-0">
                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        First Name<span className="text-red-600 text-md font-bold">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstname"
                                        placeholder="Enter First Name"
                                        value={formData.firstname}
                                        onChange={handleChange}
                                        required
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Last Name<span className="text-red-600 text-md font-bold">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastname"
                                        placeholder="Enter Last Name"
                                        value={formData.lastname}
                                        onChange={handleChange}
                                        required
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Employee ID<span className="text-red-600 text-md font-bold">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="empid"
                                        placeholder="Enter Emp ID"
                                        value={formData.empid}
                                        onChange={handleChange}
                                        required
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Department<span className="text-red-600 text-md font-bold">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="dept"
                                        placeholder="Enter Dept Name"
                                        value={formData.dept}
                                        onChange={handleChange}
                                        required
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Designation
                                    </label>
                                    <input
                                        type="text"
                                        name="designation"
                                        placeholder="Enter Designation"
                                        value={formData.designation}
                                        onChange={handleChange}
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Authority ID
                                    </label>
                                    <input
                                        type="text"
                                        name="authority"
                                        placeholder="Enter Designation"
                                        value={formData.authority}
                                        onChange={handleChange}
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Location
                                    </label>
                                    <select
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    >
                                        <option value="">Select Location</option>
                                        {locations
                                            .filter(location => location.name) // Ensure that only locations with a name are shown
                                            .map((location) => (
                                                <option key={location.id} value={location.name}>
                                                    {location.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        State<span className="text-red-600 text-md font-bold">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        placeholder="Enter State"
                                        value={formData.state}
                                        onChange={handleChange}
                                        required
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>

                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        placeholder="Enter Country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Building
                                    </label>
                                    <input
                                        type="text"
                                        name="build"
                                        placeholder="Enter Building"
                                        value={formData.build}
                                        onChange={handleChange}
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>

                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Block
                                    </label>
                                    <input
                                        type="text"
                                        name="block"
                                        placeholder="Enter Block"
                                        value={formData.block}
                                        onChange={handleChange}
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Floor
                                    </label>
                                    <input
                                        type="text"
                                        name="floor"
                                        placeholder="Enter Floor"
                                        value={formData.floor}
                                        onChange={handleChange}
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter Email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>

                                <div className="flex items-center mb-2 mr-4">
                                    <label className="text-sm font-semibold text-prime mr-2 w-32">
                                        Mobile
                                    </label>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        placeholder="Enter Mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        className="flex-grow text-xs bg-box border p-2  rounded-md outline-none transition ease-in-out delay-150 focus:shadow-prime focus:shadow-sm"
                                    />
                                </div>

                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-1 ml-20 pr-20">

                                <div className="ml-4 mt-1 md:ml-0 md:w-full flex justify-center items-center">
                                    <label
                                        htmlFor="dropzone-file"
                                        className="flex flex-col items-center justify-center rounded-lg cursor-pointer  dark:hover:bg-bray-800 w-full md:w-1/2"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <svg
                                                className={attachment ? "w-8 h-8 text-flo dark:text-gray-500" : "w-8 h-8 text-gray-500 dark:text-gray-500"}
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
                                            <p className={attachment ? " text-sm text-flo font-bold" : " text-sm text-prime font-bold"}>
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
                                    className="hover:bg-prime border-2 border-prime ml-4 font-sui font-bold text-xs text-prime hover:text-white py-1 px-3 rounded-md shadow focus:outline-none"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="max-w-full w-full h-full m-0.5 bg-box p-5 rounded-lg font-mont">
                <div className="ticket-table mt-1">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-prime mb-2 font-mont">
                            <span>
                                Employee Data
                                <button
                                    onClick={() => setShowForm(!showForm)}
                                    className="hover:bg-prime border-2 border-prime ml-4 font-sui font-bold text-xs text-prime hover:text-white py-1 px-3 rounded-md shadow focus:outline-none"
                                >
                                    {showForm ? "Close" : "+ Add Employee"}
                                </button>
                            </span>
                        </h3>

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
                        <span className="flex gap-4">
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

                    </div>
                    {/* Scrollable Table Container */}
                    <div className="overflow-x-auto mt-8">
                        <Table className="min-w-full  bg-second rounded-lg filter-table">
                            <TableHead className="bg-white font-semibold font-poppins text-fontadd text-nowrap">
                                <TableRow>
                                    {headers.map((header, index) => (
                                        <TableCell
                                            key={index}
                                            className="w-1/10 py-4 px-4 text-left" // Left-align text
                                        >
                                            <span className="font-semibold">{header}</span> {/* Left-aligned by default */}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {currentTickets.map((userdet) => (
                                    <TableRow key={userdet.id} className="bg-box text-fontadd text-center font-medium">
                                        <TableCell style={{ padding: '6px' }} className="border-t">{userdet.id}</TableCell>
                                        <TableCell style={{ padding: '6px' }} className="border-t">{userdet.firstname}</TableCell>
                                        <TableCell style={{ padding: '6px' }} className="border-t">{userdet.lastname}</TableCell>
                                        <TableCell style={{ padding: '6px' }} className="border-t">{userdet.mobile}</TableCell>
                                        <TableCell style={{ padding: '6px' }} className="border-t">{userdet.email}</TableCell>
                                        <TableCell style={{ padding: '6px' }} className="border-t">{userdet.location}</TableCell>
                                        <TableCell style={{ padding: '6px' }} className="border-t">{userdet.employee_id}</TableCell>
                                        <TableCell style={{ padding: '6px' }} className="border-t">{userdet.department}</TableCell>
                                        <TableCell style={{ padding: '6px' }} className="border-t">{userdet.designation}</TableCell>
                                    </TableRow>


                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>



            </div>

        </div>
    );
};

export default Form;