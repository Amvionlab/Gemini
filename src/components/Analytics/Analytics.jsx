import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { CSVLink } from "react-csv";
import { baseURL } from "../../config.js";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TablePagination,
  Paper,
  TableSortLabel,
  FormControl,
  OutlinedInput,
  MenuItem,
  Select,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { useTicketContext } from "../UserContext/TicketContext";
import { UserContext } from "../UserContext/UserContext.jsx";
import { PieChart } from "@mui/x-charts";
import InputLabel from "@mui/material/InputLabel";

function Reports() {
  const [tickets, setTickets] = useState([]);
  const { user } = useContext(UserContext);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const [ticketsPerPage, setTicketsPerPage] = useState(50);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("type");
  const [selectedLabels, setSelectedLabels] = useState([
    [],
    [],
    [],
    [],
    [],
    [],
  ]);
  const fields = [
    "type",
    "status",
    "customer",
    "domain",
    "subdomain",
    "customer_branch",
  ];
  const [selectedCategory, setSelectedCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { setTicketId } = useTicketContext();
  const [selectedDateFilter, setSelectedDateFilter] = useState("createdAt");
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("");
  const [fieldByData, setFieldByData] = useState({});
  // Memoized headers for CSV export
  const headers = useMemo(
    () => [
      { label: "Id", key: "id" },
      { label: "Type", key: "type" },
      { label: "Status", key: "status" },
      { label: "RCA", key: "rca" },
      { label: "Ticket Service", key: "service" },
      { label: "Customer Department", key: "customer_department" },
      { label: "Customer", key: "customer" },
      { label: "Assignees", key: "assignees" },
      { label: "Category", key: "domain" },
      { label: "Sub Category", key: "subdomain" },
      { label: "Created By", key: "name" },
      { label: "Created At", key: "post_date" },
      { label: "Closed At", key: "closed_date" },
    ],
    []
  );

  const pieheader = [
    { label: "Type", key: "type" },
    { label: "Status", key: "status" },
    { label: "Customer", key: "customer" },
    { label: "Category", key: "domain" },
    { label: "Sub Category", key: "subdomain" },
  ];

  // Memoized CSV data
  const csvData = useMemo(
    () =>
      filteredTickets.map((ticket) => ({
        id: ticket.id,
        type: ticket.type,
        sla_priority: ticket.sla,
        status: ticket.status,
        ticket_service: ticket.service,
        customer_department: ticket.department,
        customer: ticket.customer,
        assignees: ticket.assignees,
        domain: ticket.domain,
        subdomain: ticket.subdomain,
        created_by: ticket.name,
        post_date: ticket.post_date,
        closed_date: ticket.closed_date,
      })),
    [filteredTickets]
  );

  // Fetch tickets on user change
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        let response;
        if (user?.accessId === "2") {
          response = await fetch(
            `${baseURL}backend/fetchTickets.php?user=${user.userId}`
          );
        } else if (user?.accessId === "5") {
          response = await fetch(
            `${baseURL}backend/fetchTickets.php?support=${user.userId}`
          );
        } else if (user?.accessId === "4") {
          response = await fetch(
            `${baseURL}backend/fetchTickets.php?manager=${user.userId}`
          );
        } else {
          response = await fetch(`${baseURL}backend/fetchTickets.php`);
        }
        const data = await response.json();
        setTickets(Array.isArray(data) ? data : []);
        setFilteredTickets(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching ticket data:", error);
      }
    };
    fetchTickets();
  }, [user]);

  // Set default date range
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayStr = firstDayOfMonth.toLocaleDateString("en-CA");
    setFromDate(firstDayStr);
    setToDate(todayStr);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (index) => (event) => {
      const value = event.target.value;

      const updatedLabels = [...selectedLabels];
      updatedLabels[index] =
        typeof value === "string" ? value.split(",") : value;
      setSelectedLabels(updatedLabels);
    },
    [selectedLabels]
  );

  // Group data by field
  const groupDataByField = useCallback((field, data) => {
    if (!Array.isArray(data)) return {};
    const groupedData = {};
    data.forEach((ticket) => {
      const value = ticket?.[field] || "null";

      groupedData[value] = (groupedData[value] || 0) + 1;
    });
    return groupedData;
  }, []);
  useEffect(() => {
    if (!tickets || tickets.length === 0) return;

    const data = {};
    fields.forEach((field) => {
      data[field] = groupDataByField(field, tickets);
    });

    setFieldByData(data);
  }, [tickets, groupDataByField]);

  // console.log(Object.keys(fieldByData?.[selectedCategory] ?? {}));
  // Memoized domain data
  const domainData = useMemo(
    () => groupDataByField(selectedFilter, filteredTickets),
    [selectedFilter, filteredTickets, groupDataByField]
  );

  // Memoized pie chart data
  const pieChartData = useMemo(
    () =>
      Object.entries(domainData).map(([label, value]) => ({
        label: label.length > 15 ? label.slice(0, 10) + "..." : label,
        value,
      })),
    [domainData]
  );

  // Handle sorting
  const handleRequestSort = useCallback(
    (property) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
    },
    [order, orderBy]
  );

  // Memoized sorted tickets
  const sortedTickets = useMemo(() => {
    const comparator = (a, b) => {
      if (a[orderBy] < b[orderBy]) return order === "asc" ? -1 : 1;
      if (a[orderBy] > b[orderBy]) return order === "asc" ? 1 : -1;
      return 0;
    };
    return [...filteredTickets].sort(comparator);
  }, [filteredTickets, order, orderBy]);

  const handleViewTicket = (ticketId) => {
    setTicketId(ticketId);
    navigate("/singleticket");
  };

  // Handle date and label filtering

  useEffect(() => {
    let filteredData = tickets;

    filteredData = filteredData.filter((ticket) =>
      selectedLabels.every((labels, index) => {
        if (labels.length === 0) return true; // No filter applied for this category

        const field = [
          "type",
          "status",
          "customer",
          "domain",
          "subdomain",
          "customer_branch",
        ][index]; // Removed SLA, as it wasn’t mapped correctly
        const ticketValue = ticket[field]
          ? ticket[field].toString().trim()?.toLowerCase()
          : "";

        return labels.some((label) => ticketValue === label?.toLowerCase()); // Ensures exact match
      })
    );

    // Filter by date range
    if (fromDate || toDate) {
      filteredData = filteredData.filter((ticket) => {
        const dateField =
          selectedDateFilter === "createdAt"
            ? ticket.post_date
            : ticket.closed_date;
        if (!dateField) return false;
        const ticketDate = dateField.split(" ")[0];
        const startDate = fromDate
          ? new Date(fromDate)
          : new Date("1900-01-01");
        const endDate = toDate ? new Date(toDate) : new Date("2100-01-01");
        const selectedDate = new Date(ticketDate);
        return selectedDate >= startDate && selectedDate <= endDate;
      });
    }

    setFilteredTickets(filteredData);
  }, [selectedLabels, tickets, fromDate, toDate, selectedDateFilter]);

  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setTicketsPerPage(parseInt(event.target.value, 10)); // Update rows per page
    setPage(0); // Reset to the first page
  }, []);

  const redirectToFetch = (tickets) => {
    // Extract IDs and join them with commas
    const ids = tickets.map((ticket) => ticket.id).join(",");

    // Construct the URL with query params
    const url = `${baseURL}backend/fetchCustomerDetails.php?ids=${encodeURIComponent(
      ids
    )}`;

    // Use window.location.href to redirect
    window.location.href = url;
  };

  return (
    <div className="bg-second h-full overflow-hidden">
      <div className="m-0.5 p-1 h-[10%] bg-box w-full flex justify-center items-center">
        <div className="flex justify-center items-center text-xs w-full gap-1 ">
          <p
            className="font-semibold text-sm w-16"
            onClick={() =>
              setSelectedLabels((prev) => {
                const updated = [...prev]; // make a shallow copy of the array
                updated[0] = ["SA", "SD"]; // update the first index
                return updated; // return the new state
              })
            }
          >
            Filter :
          </p>
          {selectedLabels.map((selectedLabel, index) => (
            <FormControl key={index} sx={{ m: 0.5, width: 130, height: 30 }}>
              <Select
                multiple
                className="border w-28"
                displayEmpty
                value={selectedLabel}
                onChange={handleFilterChange(index)}
                input={<OutlinedInput />}
                renderValue={(selected) =>
                  selected.length === 0 ? (
                    <span
                      style={{
                        color: "#aaa",
                      }}
                    >
                      {
                        [
                          " type",
                          " status",
                          " customer",
                          " category",
                          " subcategory",
                          " Region",
                        ][index]
                      }
                    </span>
                  ) : (
                    selected.join(", ")
                  )
                }
                MenuProps={{
                  PaperProps: {
                    style: { maxHeight: 30 * 4.5 + 2, minwidth: 180 },
                  },
                }}
                sx={{ fontSize: "0.75rem", padding: "2px", height: 30 }}
              >
                {Object.entries(
                  groupDataByField(
                    [
                      "type",
                      "status",
                      "customer",
                      "domain",
                      "subdomain",
                      "customer_branch",
                    ][index],
                    tickets
                  )
                ).map(([label]) => (
                  <MenuItem
                    key={label}
                    value={label}
                    sx={{ padding: "2px 4px", fontSize: "0.4rem" }}
                  >
                    <Checkbox
                      checked={selectedLabel.includes(label)}
                      size="small"
                      sx={{ fontSize: "0.4rem" }} // Adjust the size directly here if necessary
                    />
                    <ListItemText primary={label} sx={{ fontSize: "0.4rem" }} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}

          <FormControl sx={{ m: 0.5, minWidth: 100 }} size="small">
            <InputLabel id="date-filter-label">Filter</InputLabel>
            <Select
              labelId="date-filter-label"
              id="date-filter"
              value={selectedDateFilter}
              label="Filter"
              onChange={(e) => setSelectedDateFilter(e.target.value)}
            >
              <MenuItem value="createdAt">Created At</MenuItem>
              <MenuItem value="closedAt">Closed At</MenuItem>
            </Select>
          </FormControl>

          <div className="border-black border rounded p-0.5 text-xs">
            <p style={{ margin: 0 }}>From</p>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={toDate}
              className="outline-none border-none text-xs w-full"
            />
          </div>

          <div className="border-black border rounded p-0.5 text-xs">
            <p style={{ margin: 0 }}>To</p>
            <input
              type="date"
              id="toDate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate}
              className="outline-none border-none text-xs w-full"
            />
          </div>

          <div
            className="font-semibold py-1 px-2 rounded border border-[red] text-red-600 hover:bg-red-600 hover:text-white cursor-pointer transition-all duration-150"
            onClick={() => {
              setSelectedLabels([[], [], [], [], [], [], []]);
              setFromDate("");
              setToDate("");
              setSelectedDateFilter("createdAt");
            }}
          >
            <p className="text-xs">Clear</p>
          </div>
        </div>
      </div>

      <div className="main flex h-[90%] gap-0.5">
        <div className="section1 md:flex-col  w-[40%] bg-box rounded-md h-full">
          <div className="px-6 flex gap-2 mt-2 items-center">
            <p className="text-sm font-semibold">Select Category:</p>
            <Select
              value={selectedCategory || ""}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return (
                    <em className="text-gray-400 text-xs">Select Category</em>
                  );
                }
                return selected;
              }}
              sx={{
                fontSize: "0.75rem",
                padding: "2px",
                height: 30,
                width: "7rem",
              }}
              className="border w-28 "
              MenuProps={{
                PaperProps: {
                  style: { maxHeight: 30 * 4.5 + 2, minWidth: 180 },
                },
              }}
            >
              {fields.map((label, i) => (
                <MenuItem
                  onClick={() => {
                    setSelectedCategory((prev) =>
                      prev === label ? "" : label
                    );
                  }}
                  key={label}
                  value={label}
                  sx={{ padding: "2px 4px", fontSize: "0.4rem" }}
                >
                  <Checkbox
                    checked={selectedCategory === label}
                    size="small"
                    sx={{ fontSize: "0.4rem" }} // Adjust the size directly here if necessary
                  />
                  <ListItemText primary={label} sx={{ fontSize: "0.4rem" }} />
                </MenuItem>
              ))}
            </Select>
            {/* select all  */}
            <p
              className="text-sm bg-flo text-white p-1 rounded-md cursor-pointer hover:bg-blue-800"
              onClick={(prev) =>
                setSelectedLabels((prev) => {
                  const updated = [...prev]; // Clone the previous array
                  const id = fields.findIndex(
                    (val) => val === selectedCategory
                  );
                  if (id === -1) {
                    return updated;
                  }
                  const keys = Object.keys(
                    fieldByData?.[selectedCategory] || {}
                  );
                  updated[id] = keys;
                  return updated;
                })
              }
            >
              Select All
            </p>
            {/* clearall */}
            <p
              className="text-sm bg-[red] text-white p-1 rounded-md cursor-pointer hover:bg-red-600"
              onClick={() =>
                setSelectedLabels((prev) => {
                  const updated = [...prev];
                  const id = fields.findIndex((val) => val == selectedCategory);
                  if (id === -1) {
                    return updated;
                  }
                  updated[id] = [];
                  return updated;
                })
              }
            >
              Clear All
            </p>
          </div>
          <div className="flex justify-center items-center gap-5 w-full px-2">
            {pieheader.map(({ label, key }, index) => (
              <div
                key={index}
                onClick={() => setSelectedFilter(key)}
                className={`py-1 px-2 text-xs font-semibold rounded cursor-pointer mt-4 ${
                  key === selectedFilter
                    ? "bg-flo text-white"
                    : "bg-box text-black border border-black"
                }`}
              >
                <p>{label}</p>
              </div>
            ))}
          </div>
          <div className="w-full flex-col justify-start items-center h-full rounded-md flex mb-2">
            <PieChart
              series={[
                {
                  data: pieChartData,
                  innerRadius: 50,
                  outerRadius: 150,
                  highlightScope: { faded: "global", highlighted: "item" },
                  faded: {
                    innerRadius: 30,
                    additionalRadius: -30,
                    color: "gray",
                  },
                  plugins: [
                    {
                      name: "legend",
                      options: {
                        labels: {
                          font: {
                            size: 10,
                          },
                        },
                      },
                    },
                  ],
                },
              ]}
              height={500}
              width={550}
            />
          </div>
        </div>
        <div className="section2 w-full overflow-y-hidden h-full">
          <Paper className="bg-box p-1 rounded-xl border h-full">
            <div className="w-full border-b h-10 flex text-sm justify-between items-center font-medium mb-2">
              <div className="flex capitalize ml-1 mt-3 text-base">
                <p className="font-bold text-prime">Analytics</p>
              </div>
              <TablePagination
                component="div"
                sx={{
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                    { fontSize: "10px" },
                  "& .MuiTablePagination-select": { fontSize: "10px" },
                  "& .MuiTablePagination-actions": { fontSize: "10px" },
                  minHeight: "30px",
                  ".MuiTablePagination-toolbar": {
                    minHeight: "30px",
                    padding: "0 8px",
                  },
                }}
                count={filteredTickets.length}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={ticketsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[10, 25, 50, 100, 500]}
              />
              <div className="flex gap-1">
                <button
                  className="bg-box border transform hover:scale-110 transition-transform duration-200 ease-in-out text-prime text-xs font-semibold py-1 px-3 rounded m-2"
                  onClick={() => redirectToFetch(sortedTickets)}
                >
                  Report
                </button>
              </div>
            </div>
            <TableContainer sx={{ maxHeight: "calc(100vh - 200px)" }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {headers.map(({ label, key }, index) => (
                      <TableCell
                        key={index}
                        align="left"
                        sx={{
                          whiteSpace: "nowrap",
                          fontWeight: "300",
                          fontSize: "14px",
                          padding: "1px 3px",
                          backgroundColor: "#004080",
                          color: "white",
                        }}
                      >
                        <TableSortLabel
                          active={orderBy === key}
                          direction={orderBy === key ? order : "asc"}
                          onClick={() => handleRequestSort(key)}
                          sx={{
                            "&.Mui-active": { color: "white" },
                            "&:hover": { color: "white" },
                            "& .MuiTableSortLabel-icon": {
                              color: "white !important",
                            },
                          }}
                        >
                          {label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody className="py-10">
                  {sortedTickets.length === 0 ? (
                    <TableRow hover>
                      <TableCell
                        colSpan={headers.length}
                        sx={{
                          padding: "1px 3px",
                          fontSize: "10px",
                          textAlign: "center",
                        }}
                      >
                        No tickets available
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedTickets
                      .slice(
                        page * ticketsPerPage,
                        page * ticketsPerPage + ticketsPerPage
                      )
                      .map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          hover
                          onClick={() => handleViewTicket(ticket.id)}
                        >
                          {headers.map(({ key }, idx) => {
                            const value = ticket[key];

                            return (
                              <TableCell
                                key={idx}
                                align="center"
                                sx={{
                                  padding: "1px 3px",
                                  fontSize: "11px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  cursor: "pointer",
                                  "&:hover": {
                                    whiteSpace: "normal",
                                    backgroundColor: "#f5f5f5",
                                  },
                                }}
                                title={value || "N/A"}
                              >
                                {value || "N/A"}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </div>
      </div>
    </div>
  );
}

export default Reports;