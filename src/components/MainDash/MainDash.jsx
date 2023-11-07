import Grid from "@mui/material/Grid";
import Welcome from "./Card/Welcome";
import Statistics from "./Card/Statistics";
import ChartTransactions from "./Card/ChartTransactions";
import Availability from "./Card/Availability";


const MainDash = () => {
  return (
    <Grid container spacing={{ xs: 12, md: 12}}>
      <Grid item xs={12} md={12} mt={10}>
        <Welcome />
        <Statistics />
        <Availability />
      </Grid>
    </Grid>
  );
};

export default MainDash;
