import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";

const TransactionChart = () => {
  const [data, setData] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:5000/transactions-chart", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.log(error));
  }, []);

  const xData = data.map((item) => item.quantity);
  const legendData = data.map((item) => item.name_service);
  const yData = data.map((item) => item.issued_transactions);

  const chartOptions = {
    chart: {
      type: "bar",
      stacked: true,
    },
    xaxis: {
      type: "datetime",
      labels: {
        formatter: function (value) {
          // Format the datetime as desired
          // For example, you can use a date formatting library like moment.js
          // return moment(value).format('YYYY-MM-DD');
          return value;
        },
      },
    },
    legend: {
      show: true,
    },
    yaxis: {
      categories: xData,
    },
  };
  console.log("data:", data);
  console.log("xData:", xData);
  console.log("legendData:", legendData);
  console.log("yData:", yData);

  return (
    <div>
      <Chart
        options={chartOptions}
        series={yData}
        type="bar"
        height={400}
        width={600}
      />
    </div>
  );
};

export default TransactionChart;
