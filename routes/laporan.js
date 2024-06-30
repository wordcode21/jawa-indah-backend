const express = require("express");
const router = express.Router();
const db = require("../db");
const checkAdmin = require("../middleware/checkAdmin");

router.get("/laporan",checkAdmin,(req,res)=>{
    let {bulan,tahun} =req.query;
    const date = new Date();
    if(!bulan){
        bulan = date.getMonth();
        bulan++;
    }
    if(!tahun){
        tahun = date.getFullYear();
    }
    const query = "select t2.nama_barang,sum(t1.sebanyak) as sebanyak, t2.harga, (sum(t1.sebanyak)*t2.harga) as total_penjualan from laporan t1 inner join barang t2 on t1.kode_barang = t2.kode_barang where month(t1.tanggal)= ? and year(t1.tanggal)=? group by t2.nama_barang,t2.harga";
    db.query(query,[bulan,tahun],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500,message: err});
        }
        res.status(200).json({status: 200, data: result });
    })
});
module.exports = router;