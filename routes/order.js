const express = require("express");
const router = express.Router(); 
const db = require("../db");
const checkAuth = require("../middleware/checkAuth");
const generateKodeTransaksi = require("../middleware/generateKodeTransaksi");
const getDate = require("../middleware/getDate");
const checkAdmin = require("../middleware/checkAdmin");

router.get("/order",checkAuth,(req,res)=>{
    const username = req.username;
    const query = "select * from transaksi where username = ?";
    db.query(query,[username],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500, message: err}); 
        }
        if(result.length === 0){
            return res.status(200).json({status:200, message: "No transactions found."});
        }
        result.forEach(item => {
            const tanggal = item.tanggal_transaksi;
            item.tanggal_transaksi =  tanggal.toISOString().split("T")[0];
            item.total_harga =  item.sebanyak * item.harga + item.ongkir;
        });
        res.status(200).json({status: 200, data: result });
    });
});

router.post("/order",checkAuth,generateKodeTransaksi,getDate,(req,res)=>{
    const username = req.username;
    const {kode_barang,sebanyak,alamat,kota,ongkir} = req.body;
    const ongkir_barang = parseInt(ongkir);
    const banyak_barang = parseInt(sebanyak); 
    const kode_transksi = req.kodeTransaksi;
    const status = "pending";
    const date = req.date;
    const query1 = "select * from barang where kode_barang = ?";
    const query2 = "insert into transaksi(kode_transaksi,username, kode_barang,sebanyak,harga, status,alamat, tanggal_transaksi,kota,ongkir) values(?,?,?,?,?,?,?,?,?,?) "
    db.query(query1,[kode_barang],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500,message: err});
        }
        const harga = parseInt(result[0].harga);
        const nama_barang = result[0].nama_barang;
        db.query(query2,[kode_transksi,username,kode_barang,banyak_barang,harga,status,alamat, date,kota,ongkir_barang],(err, result)=>{
            if(err){
                return res.status(500).json({status: 500,message: err});
            }
            return res.status(201).json({status: 201, message: "Transaksi berhasil dibuat`"});
        });
    })
});

router.patch("/order",checkAdmin,(req,res)=>{
    const {kode_transaksi,status} = req.body;
    const query = "update transaksi set status = ? where kode_transaksi = ?";
    db.query(query,[status,kode_transaksi],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500,message: err});
        }
        return res.json({status: 200, message: "Berhasil di update"});
    });
});

module.exports = router;