import React from "react"
import Grid from "@mui/material/Grid"
import "./List/Add.css"
import Table from "./List/Table"

const Transactions = () => {
  return (
    <div className="Transactions">
      <Grid item xs={12}>
        <Table />
      </Grid>
    </div>
  )
}

export default Transactions
