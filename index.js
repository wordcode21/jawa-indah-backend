const express = require("express");
const app = express();
const cors = require("cors")
const port = 3000;
const productsRoutes = require("./routes/products");
const profileRoutes = require("./routes/profile");
const registerRoutes = require("./routes/register");
const loginRoutes = require("./routes/login");
const loginAdminRoutes = require("./routes/loginAdmin");
const orderRoutes = require("./routes/order");
const ongkirRoutes = require("./routes/ongkir");
const cartRoutes = require("./routes/keranjang");
const laporanRoutes = require("./routes/laporan");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/",loginRoutes);
app.use("/",loginAdminRoutes);
app.use("/",registerRoutes);
app.use("/",productsRoutes);
app.use("/",orderRoutes);
app.use("/",profileRoutes);
app.use("/",ongkirRoutes);
app.use("/",cartRoutes);
app.use("/",laporanRoutes)


app.listen(port,()=>{
    console.log("berjalan pada http://localhost:3000");
});