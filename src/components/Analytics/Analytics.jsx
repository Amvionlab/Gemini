import React, { useContext, useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import { baseURL } from "../../config.js";
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
import { UserContext } from "../UserContext/UserContext.jsx";
import Chart from "react-google-charts";
import { PieChart } from "@mui/x-charts";

function Reports() {
  const [tickets, setTickets] = useState([]);
  const { user } = useContext(UserContext);
  const [page, setPage] = useState(0);
  const [ticketsPerPage, setTicketsPerPage] = useState(50);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("type");
  const [selectedLabels, setSelectedLabels] = useState([[], [], [], [], []]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const csvData = Array.isArray(filteredTickets) ? filteredTickets.map((ticket) => ({
    Id: ticket.id,
    Type: ticket.type,
    SLA: ticket.sla,
    Status: ticket.status,
    Service: ticket.service,
    Department: ticket.department,
    Assignees: ticket.assignees,
    Domain: ticket.domain,
    SubDomain: ticket.subdomain,
    Customer: ticket.customer,
    "Created At": ticket.post_date,
    "Created By": ticket.name,
    "Closed At": ticket.closed_date,
})) : [];

  const headers = [
    "Id",
    "Type",
    "Status",
    "Customer",
    "Assignees",
    "Domain",
    "Post Date",
  ];

  useEffect(() => {
    const fetchTickets = async (value) => {
      try {
        let response;
        if (user && user.accessId === "2") {
          response = await fetch(
            `${baseURL}backend/fetchTickets.php?user=${user.userId}`
          );
        } else if (user && user.accessId === "5") {
          response = await fetch(
            `${baseURL}backend/fetchTickets.php?support=${user.userId}`
          );
        } else {
          response = await fetch(`${baseURL}backend/fetchTickets.php`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setTickets(data);
        } else {
          setTickets([]); // Ensure tickets is always an array
        }
        setFilteredTickets(data);
      } catch (error) {
        console.error("Error fetching ticket data:", error);
      }
    };
    fetchTickets();
  }, [user]);

  const handleFilterChange = (index) => (event) => {
    const {
      target: { value },
    } = event;
    const updatedLabels = [...selectedLabels];
    updatedLabels[index] = typeof value === "string" ? value.split(",") : value;
    setSelectedLabels(updatedLabels);
  };

  // Improved groupDataByField function
const groupDataByField = (field, data) => {
  if (!Array.isArray(data)) {
    console.warn("groupDataByField: Expected an array but received:", data);
    return {};
  }

  const groupedData = {};
  data.forEach((ticket) => {
    const value = ticket?.[field] || "Empty";
    groupedData[value] = (groupedData[value] || 0) + 1;
  });

  return groupedData;
};

  // Generate data for the selected filter based on filteredTickets
  const domainData = groupDataByField(selectedFilter, filteredTickets);
  // Ensure domainData is structured like { "Domain1": 10, "Domain2": 20 }
  // Function to wrap labels
  const wrapLabel = (label) => {
    const words = label.split(" ");
    return words.length > 100
      ? words.slice(0, 1).join(" ") + "\n" + words.slice(1).join(" ")
      : label;
  };

  const labelValue = Object.entries(domainData)

    .slice(0, 10)
    .map(([label]) => {
      return wrapLabel(label.length > 15 ? label.slice(0, 10) + "..." : label);
    });

  const pieChartData = Object.entries(domainData)
  .map(([label, value], index) => {
    return {
      label: labelValue[index],
      value,
    };
  });

  const pieChartOptions = {
    legend: { textStyle: { fontSize: 12 } },
    pieSliceText: "value",
    title: ` Ticket Distribution by ${selectedFilter}`,
    is3D: true,
    pieSliceTextStyle: { fontSize: 20 },
    titleTextStyle: { fontSize: 18, color: "#000" },
  };

  const handlePageChange = (event, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (event) => {
    setTicketsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  //ascending

  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("");

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const getComparator = (order, orderBy) => {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    if (a[orderBy] < b[orderBy]) {
      return -1;
    }
    if (a[orderBy] > b[orderBy]) {
      return 1;
    }
    return 0;
  };

  // Improved stableSort function
const stableSort = (array, comparator) => {
  if (!Array.isArray(array)) {
    console.warn("stableSort: Expected an array but received:", array);
    return [];
  }

  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  return stabilizedThis.map((el) => el[0]);
};

  const sortedTickets = stableSort(
    filteredTickets,
    getComparator(order, orderBy)
  );

  useEffect(() => {
    // Filter by selected labels
    const filteredByLabels = tickets.filter((ticket) =>
      selectedLabels.every((labels, index) => {
        const field = ["type", "status", "customer", "assignees", "domain"][
          index
        ];
        return labels.length === 0 || labels.includes(ticket[field] || "");
      })
    );

    let filteredByDate = filteredByLabels;

    if (fromDate || toDate) {
      filteredByDate = filteredByLabels.filter((ticket) => {
        const ticketDate = ticket.post_date.split(" ")[0];

        // Set defaults if fromDate or toDate is missing
        const start = fromDate || "1900-01-01";
        const end = toDate || "2100-01-01";

        return ticketDate >= start && ticketDate <= end;
      });
    }

    // Update state with filtered tickets
    setFilteredTickets(filteredByDate);
  }, [selectedLabels, tickets, fromDate, toDate]);

  return (
    <div className="bg-second h-full overflow-hidden">
      <div className="m-0.5 p-1 h-[10%] bg-box w-full flex justify-center items-center">
        <div className="flex justify-center items-center text-xs w-full gap-4 ">
          <p className="font-semibold text-sm">Filter :</p>
          {selectedLabels.map((selectedLabel, index) => (
            <FormControl key={index} sx={{ m: 0.5, width: 125, height: 30 }}>
              <Select
                multiple
                className="border"
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
                      Select
                      {
                        [
                          " type",
                          " status",
                          " customer",
                          " assignees",
                          " domain",
                        ][index]
                      }
                    </span>
                  ) : (
                    selected.join(", ")
                  )
                }
                MenuProps={{
                  PaperProps: {
                    style: { maxHeight: 30 * 4.5 + 2, width: 180 },
                  },
                }}
                sx={{ fontSize: "0.75rem", padding: "2px", height: 30 }}
              >
                {Object.entries(
                  groupDataByField(
                    ["type", "status", "customer", "assignees", "domain"][
                      index
                    ],
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

          <div
            className="border-black border rounded-md p-1"
            onClick={() => document.getElementById("fromDate").showPicker()} // Show the date picker on click
          >
            <p>From</p>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="outline-none border-none" // Ensure no default borders when focused
            />
          </div>

          <div className="border-black border rounded-md p-1">
            <p onClick={() => document.getElementById("toDate").showPicker()}>
              To
            </p>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              name=""
              id="toDate"
            />
          </div>
          <div
            className="font-semibold py-1 px-3 rounded border border-[red] text-red-600 hover:bg-red-600 hover:text-white cursor-pointer transition-all duration-150"
            onClick={() => {
              setSelectedLabels([[], [], , [], [], []]),
                setFromDate(""),
                setToDate("");
            }}
          >
            <p className="text-xs ">Clear All</p>
          </div>
        </div>
      </div>

      <div className="main flex h-[90%] gap-0.5">
        <div className="section1 md:flex-col  w-[40%] bg-box rounded-md h-full">
          <div className="flex justify-center items-center gap-5 w-full p-2">
            {["Type", "Status", "Customer", "Assignees", "Domain"].map(
              (item, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedFilter(item.toLowerCase())}
                  className={`py-1 px-2 text-xs font-semibold rounded cursor-pointer ${
                    item.toLowerCase() === selectedFilter
                      ? "bg-flo text-white"
                      : "bg-box text-black border border-black"
                  }`}
                >
                  <p>{item}</p>
                </div>
              )
            )}
          </div>
          <div className="w-full flex-col justify-start items-center h-full rounded-md flex mb-2">
            <PieChart
              series={[
                {
                  data: pieChartData, // Pass the correctly formatted data
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
                            size: 10, // Set the desired font size for the legend here
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
                <CSVLink
                  data={csvData}
                  headers={headers}
                  filename={"tickets.csv"}
                  className="bg-box transform hover:scale-110 transition-transform duration-200 ease-in-out border-2 text-prime text-xs font-semibold py-1 px-3 rounded m-2"
                >
                  CSV
                </CSVLink>
              </div>
            </div>
            <TableContainer sx={{ maxHeight: "calc(100vh - 200px)" }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {headers.map((header, index) => (
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
                          active={
                            orderBy === header.toLowerCase().replace(" ", "_")
                          }
                          direction={
                            orderBy === header.toLowerCase().replace(" ", "_")
                              ? order
                              : "asc"
                          }
                          onClick={() =>
                            handleRequestSort(
                              header.toLowerCase().replace(" ", "_")
                            )
                          }
                          sx={{
                            "&.Mui-active": { color: "white" },
                            "&:hover": { color: "white" },
                            "& .MuiTableSortLabel-icon": {
                              color: "white !important",
                            },
                          }}
                        >
                          {header}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody className="py-10">
                  {sortedTickets.length === 0 ? (
                    <TableRow hover>
                      <TableCell
                        colSpan={5}
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
                        <TableRow key={ticket.id} hover>
                          {headers.map((header, idx) => (
                            <TableCell
                              key={idx}
                              align="left"
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
                              title={
                                ticket[
                                  header.toLowerCase().replace(" ", "_")
                                ] ||
                                (header === "Assignees" && "N/A")
                              }
                            >
                              {header === "Assignees"
                                ? (ticket.assignees
                                    ?.split(" ")
                                    .slice(0, 3)
                                    .join(" ") || "N/A") +
                                  (ticket.assignees?.split(" ").length > 3
                                    ? "..."
                                    : "")
                                : header === "Customer" // Check for "Customer"
                                ? (ticket.customer
                                    ?.split(" ")
                                    .slice(0, 3)
                                    .join(" ") || "N/A") +
                                  (ticket.customer?.split(" ").length > 3
                                    ? "..."
                                    : "")
                                : ticket[
                                    header.toLowerCase().replace(" ", "_")
                                  ]}
                            </TableCell>
                          ))}
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
