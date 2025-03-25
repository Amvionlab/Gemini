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

// Constants moved outside component to prevent recreation on every render
const FIELDS = ["type", "status", "customer", "domain", "subdomain", "customer_branch"];
const PIE_HEADERS = [
  { label: "Type", key: "type" },
  { label: "Status", key: "status" },
  { label: "Customer", key: "customer" },
  { label: "Category", key: "domain" },
  { label: "Sub Category", key: "subdomain" },
];
const CSV_HEADERS = [
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
];
const FILTER_LABELS = [" type", " status", " customer", " category", " subcategory", " Region"];

function Reports() {
  const [tickets, setTickets] = useState([]);
  const { user } = useContext(UserContext);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const [ticketsPerPage, setTicketsPerPage] = useState(50);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("type");
  const [selectedLabels, setSelectedLabels] = useState(Array(FIELDS.length).fill([]));
  const [selectedCategory, setSelectedCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { setTicketId } = useTicketContext();
  const [selectedDateFilter, setSelectedDateFilter] = useState("createdAt");
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("");
  const [fieldByData, setFieldByData] = useState({});

  // Memoized CSV data
  const csvData = useMemo(
    () => filteredTickets.map((ticket) => ({
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
        let endpoint = `${baseURL}backend/fetchTickets.php`;
        
        if (user?.accessId === "2") {
          endpoint += `?user=${user.userId}`;
        } else if (user?.accessId === "5") {
          endpoint += `?support=${user.userId}`;
        } else if (user?.accessId === "4") {
          endpoint += `?manager=${user.userId}`;
        }

        const response = await fetch(endpoint);
        const data = await response.json();
        const ticketData = Array.isArray(data) ? data : [];
        setTickets(ticketData);
        setFilteredTickets(ticketData);
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

  // Group data by field - memoized callback
  const groupDataByField = useCallback((field, data) => {
    if (!Array.isArray(data)) return {};
    return data.reduce((acc, ticket) => {
      const value = ticket?.[field] || "null";
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }, []);

  // Update fieldByData when tickets change
  useEffect(() => {
    if (!tickets || tickets.length === 0) return;

    const newFieldData = FIELDS.reduce((acc, field) => {
      acc[field] = groupDataByField(field, tickets);
      return acc;
    }, {});

    setFieldByData(newFieldData);
  }, [tickets, groupDataByField]);

  // Memoized domain data
  const domainData = useMemo(
    () => groupDataByField(selectedFilter, filteredTickets),
    [selectedFilter, filteredTickets, groupDataByField]
  );

  // Memoized pie chart data
  const pieChartData = useMemo(
    () => Object.entries(domainData).map(([label, value]) => ({
      label: label.length > 15 ? `${label.slice(0, 10)}...` : label,
      value,
    })),
    [domainData]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (index) => (event) => {
      const value = event.target.value;
      setSelectedLabels(prev => {
        const updated = [...prev];
        updated[index] = typeof value === "string" ? value.split(",") : value;
        return updated;
      });
    },
    []
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

  // Handle date and label filtering
  useEffect(() => {
    let filteredData = tickets;

    // Apply label filters
    filteredData = filteredData.filter((ticket) =>
      selectedLabels.every((labels, index) => {
        if (labels.length === 0) return true;
        const field = FIELDS[index];
        const ticketValue = ticket[field]?.toString().trim().toLowerCase() || "";
        return labels.some(label => ticketValue === label?.toLowerCase());
      })
    );

    // Apply date filters
    if (fromDate || toDate) {
      filteredData = filteredData.filter((ticket) => {
        const dateField = selectedDateFilter === "createdAt" ? ticket.post_date : ticket.closed_date;
        if (!dateField) return false;
        
        const ticketDate = dateField.split(" ")[0];
        const startDate = fromDate ? new Date(fromDate) : new Date("1900-01-01");
        const endDate = toDate ? new Date(toDate) : new Date("2100-01-01");
        const selectedDate = new Date(ticketDate);
        
        return selectedDate >= startDate && selectedDate <= endDate;
      });
    }

    setFilteredTickets(filteredData);
    setPage(0); // Reset to first page when filters change
  }, [selectedLabels, tickets, fromDate, toDate, selectedDateFilter]);

  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setTicketsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleViewTicket = useCallback((ticketId) => {
    setTicketId(ticketId);
    navigate("/singleticket");
  }, [navigate, setTicketId]);

  const redirectToFetch = useCallback((tickets) => {
    const ids = tickets.map((ticket) => ticket.id).join(",");
    window.location.href = `${baseURL}backend/fetchCustomerDetails.php?ids=${encodeURIComponent(ids)}`;
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedLabels(Array(FIELDS.length).fill([]));
    setFromDate("");
    setToDate("");
    setSelectedDateFilter("createdAt");
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!selectedCategory) return;
    
    setSelectedLabels(prev => {
      const updated = [...prev];
      const id = FIELDS.findIndex(val => val === selectedCategory);
      if (id === -1) return updated;
      
      const keys = Object.keys(fieldByData?.[selectedCategory] || {});
      updated[id] = keys;
      return updated;
    });
  }, [selectedCategory, fieldByData]);

  const handleClearAll = useCallback(() => {
    if (!selectedCategory) return;
    
    setSelectedLabels(prev => {
      const updated = [...prev];
      const id = FIELDS.findIndex(val => val === selectedCategory);
      if (id === -1) return updated;
      
      updated[id] = [];
      return updated;
    });
  }, [selectedCategory]);

  return (
    <div className="bg-second h-full overflow-hidden">
      <div className="m-0.5 p-1 h-[10%] bg-box w-full flex justify-center items-center">
        <div className="flex justify-center items-center text-xs w-full gap-1">
          <p className="font-semibold text-sm w-16">Filter :</p>
          
          {selectedLabels.map((selectedLabel, index) => (
            <FormControl key={index} sx={{ m: 0.5, width: 130, height: 30 }}>
              <Select
                multiple
                className="border w-28"
                displayEmpty
                value={selectedLabel}
                onChange={handleFilterChange(index)}
                input={<OutlinedInput />}
                renderValue={(selected) => (
                  selected.length === 0 ? (
                    <span style={{ color: "#aaa" }}>{FILTER_LABELS[index]}</span>
                  ) : (
                    selected.join(", ")
                  )
                )}
                MenuProps={{
                  PaperProps: {
                    style: { maxHeight: 30 * 4.5 + 2, minWidth: 180 },
                  },
                }}
                sx={{ fontSize: "0.75rem", padding: "2px", height: 30 }}
              >
                {Object.entries(groupDataByField(FIELDS[index], tickets)).map(([label]) => (
                  <MenuItem
                    key={label}
                    value={label}
                    sx={{ padding: "2px 4px", fontSize: "0.4rem" }}
                  >
                    <Checkbox
                      checked={selectedLabel.includes(label)}
                      size="small"
                      sx={{ fontSize: "0.4rem" }}
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
            onClick={clearFilters}
          >
            <p className="text-xs">Clear</p>
          </div>
        </div>
      </div>

      <div className="main flex h-[90%] gap-0.5">
        <div className="section1 md:flex-col w-[40%] bg-box rounded-md h-full">
          <div className="px-6 flex gap-2 mt-2 items-center">
            <p className="text-sm font-semibold">Select Category:</p>
            <Select
              value={selectedCategory || ""}
              displayEmpty
              renderValue={(selected) => (
                !selected ? <em className="text-gray-400 text-xs">Select Category</em> : selected
              )}
              sx={{
                fontSize: "0.75rem",
                padding: "2px",
                height: 30,
                width: "7rem",
              }}
              className="border w-28"
              MenuProps={{
                PaperProps: {
                  style: { maxHeight: 30 * 4.5 + 2, minWidth: 180 },
                },
              }}
            >
              {FIELDS.map((label) => (
                <MenuItem
                  onClick={() => setSelectedCategory(prev => prev === label ? "" : label)}
                  key={label}
                  value={label}
                  sx={{ padding: "2px 4px", fontSize: "0.4rem" }}
                >
                  <Checkbox
                    checked={selectedCategory === label}
                    size="small"
                    sx={{ fontSize: "0.4rem" }}
                  />
                  <ListItemText primary={label} sx={{ fontSize: "0.4rem" }} />
                </MenuItem>
              ))}
            </Select>
            
            <p
              className="text-sm bg-flo text-white p-1 rounded-md cursor-pointer hover:bg-blue-800"
              onClick={handleSelectAll}
            >
              Select All
            </p>
            
            <p
              className="text-sm bg-[red] text-white p-1 rounded-md cursor-pointer hover:bg-red-600"
              onClick={handleClearAll}
            >
              Clear All
            </p>
          </div>
          
          <div className="flex justify-center items-center gap-5 w-full px-2">
            {PIE_HEADERS.map(({ label, key }) => (
              <div
                key={key}
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
              series={[{
                data: pieChartData,
                innerRadius: 50,
                outerRadius: 150,
                highlightScope: { faded: "global", highlighted: "item" },
                faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
              }]}
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
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "10px" },
                  "& .MuiTablePagination-select": { fontSize: "10px" },
                  "& .MuiTablePagination-actions": { fontSize: "10px" },
                  minHeight: "30px",
                  ".MuiTablePagination-toolbar": { minHeight: "30px", padding: "0 8px" },
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
                    {CSV_HEADERS.map(({ label, key }) => (
                      <TableCell
                        key={key}
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
                            "& .MuiTableSortLabel-icon": { color: "white !important" },
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
                        colSpan={CSV_HEADERS.length}
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
                      .slice(page * ticketsPerPage, page * ticketsPerPage + ticketsPerPage)
                      .map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          hover
                          onClick={() => handleViewTicket(ticket.id)}
                        >
                          {CSV_HEADERS.map(({ key }) => {
                            const value = ticket[key];
                            return (
                              <TableCell
                                key={key}
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

export default React.memo(Reports);