import React, { useState, useEffect } from "react";
import {
  Paper,
  CardContent,
  CardHeader,
  IconButton,
  Collapse,
} from "@mui/material";
import ReactApexChart from "react-apexcharts";
import { UisAngleDown } from "@iconscout/react-unicons-solid";
import { format, parseISO } from "date-fns";

const ChartTransactions = () => {
  const [services, setServices] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:5000/transactions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setServices(data);
        console.log("Fetch", data);
      })
      .catch((error) => console.error("Error fetching service data:", error));
  }, []);

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Paper elevation={6} square={false} sx={{ height: "auto" }}>
      <CardHeader
        sx={{
          display: "flex",
          color: "rgba(58, 53, 65, 0.87)",
          cursor: "default",
          fontSize: "1rem",
        }}
        title="Total Profit"
        action={
          <IconButton
            aria-label="expand"
            onClick={handleCollapseToggle}
            sx={{
              transform: `rotate(${isCollapsed ? 0 : 180}deg)`,
            }}
          >
            <UisAngleDown />
          </IconButton>
        }
      />
      <Collapse in={isCollapsed}>
        <CardContent>
          
        </CardContent>
      </Collapse>
    </Paper>
  );
};

export default ChartTransactions;
