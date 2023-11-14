import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { format, parseISO } from "date-fns";

const SUMofNameService = ({ initialChartData }) => {
  const [chartData, setChartData] = useState(initialChartData);

  useEffect(() => {
    fetch("http://localhost:5000/transactions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const updatedChartData = data.reduce((acc, transaction) => {
          if (transaction.isDeleted) {
            return acc;
          }

          const issuedDate = format(
            parseISO(transaction.issued_transactions),
            "yyyy-MM-dd"
          );
          const serviceNames = transaction.transaction_name_service.split("\n");
          const quantities = transaction.quantity.split("\n").map(Number);

          if (!acc[issuedDate]) {
            acc[issuedDate] = {};
          }

          serviceNames.forEach((serviceName, index) => {
            const quantity = quantities[index];

            if (serviceName) {
              if (acc[issuedDate][serviceName]) {
                acc[issuedDate][serviceName] += quantity;
              } else {
                acc[issuedDate][serviceName] = quantity;
              }
            }
          });

          return acc;
        }, {});

        setChartData(updatedChartData);
        console.log("Chart", updatedChartData);
      })
      .catch((error) => console.error("Error fetching service data:", error));
  }, []);

  const seriesData = [];
  const serviceDataMap = {};

  Object.keys(chartData).forEach((date) => {
    const dataEntries = Object.entries(chartData[date]);

    dataEntries.forEach(([serviceName, count]) => {
      const serviceNames = serviceName.split("\n");

      serviceNames.forEach((name) => {
        if (name && count !== null) {
          // Check for null values
          if (serviceDataMap[name]) {
            serviceDataMap[name].push({
              x: new Date(date).getTime(),
              y: count,
            });
          } else {
            serviceDataMap[name] = [{ x: new Date(date).getTime(), y: count }];
          }
        }
      });
    });
  });

  Object.entries(serviceDataMap).forEach(([serviceName, data]) => {
    const existingService = seriesData.find(
      (series) => series.name === serviceName
    );
    if (existingService) {
      existingService.data = [...existingService.data, ...data];
    } else {
      seriesData.push({ name: serviceName, data: data });
    }
  });

  const categories = Object.keys(chartData);

  const filteredSeriesData = seriesData.filter((series) =>
    series.data.every((point) => point.y !== null)
  );

  console.log("Charts", filteredSeriesData);

  return (
    <Chart
      options={{
        chart: {
          type: "bar",
          stacked: true,
        },
        xaxis: {
          type: "datetime",
          categories: categories,
          stacked: true,
        },
        title: {
          text: "SUM of Name_Service by Date",
          align: "left",
        },
        grid: {
          row: {
            colors: ["#f3f3f3", "transparent"],
            opacity: 0.5,
          },
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: true,
        },
        responsive: [
          {
            breakpoint: 480,
          },
        ],
        plotOptions: {
          bar: {
            stacked: true,
            horizontal: false,
            columnWidth: "30%",
          },
        },
      }}
      series={filteredSeriesData}
      type="bar"
      height={300}
    />
  );
};

export default SUMofNameService;
