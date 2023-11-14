import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { format, parseISO } from "date-fns";

const SUMofTotal = ({ initialChartData }) => {
  const token = localStorage.getItem("token");
  const [chartData, setChartData] = useState(initialChartData);

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
        const updatedChartData = data.reduce((acc, transaction) => {
          if (transaction.isDeleted !== 1) {
            const issuedDate = format(
              parseISO(transaction.issued_transactions),
              "yyyy-MM-dd"
            );
            if (acc[issuedDate]) {
              acc[issuedDate] += parseInt(transaction.total_transactions);
            } else {
              acc[issuedDate] = parseInt(transaction.total_transactions);
            }
          }
          return acc;
        }, {});

        setChartData(updatedChartData);
        console.log("Chart", updatedChartData);
      })
      .catch((error) => console.error("Error fetching service data:", error));
  }, []);

  return (
    <Chart
      options={{
        xaxis: {
          type: "datetime",
        },
        title: {
          text: "SUM of Total Transactions by Date",
          align: "left",
        },
        stroke: {
          curve: "smooth",
        },
        grid: {
          row: {
            colors: ["#f3f3f3", "transparent"],
            opacity: 0.5,
          },
        },
      }}
      series={[
        {
          name: "Total Transactions",
          data: Object.entries(chartData)
            .map(([date, total]) => ({
              x: new Date(date).getTime(),
              y: total,
            }))
            .sort((a, b) => a.x - b.x),
        },
      ]}
      type="line"
      height={300}
    />
  );
};

export default SUMofTotal;
