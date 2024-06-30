const express = require("express");
const router = express.Router();
const db = require("../db");
const checkAuth = require("../middleware/checkAuth");
const generateKodeKeranjang = require("../middleware/generateKodeKeranjang");

router.post("/keranjang",checkAuth,generateKodeKeranjang,(req,res)=>{
    const username = req.username;
    const kode_keranjang = req.kodeKeranjang;
    const {kode_barang, sebanyak} = req.body;
    if(!kode_barang || !sebanyak){
        return res.status(400).json({status: 400, message: "All parameter must be filled"});
    }
    const query = "insert into keranjang (kode_keranjang,username,kode_barang,sebanyak) values(?,?,?,?)";
    db.query(query,[kode_keranjang,username,kode_barang,parseInt(sebanyak)],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500, message: err});
        }
        return res.status(201).json({status: 201, message: "Keranjang berhasil ditambahkan"});
    });
});

router.get("/keranjang",checkAuth,(req,res)=>{
    const username = req.username;
    const query = "select t1.kode_keranjang,t2.kode_barang,t2.stok,t2.nama_barang, t1.sebanyak, t2.harga, (t1.sebanyak* t2.harga) as total from keranjang as t1 inner join barang as t2 on t1.kode_barang = t2.kode_barang where t1.username = ?" ;
    db.query(query,[username],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500, message: err});
        }
        return res.json({status: 200, data: result});
    });
});

router.delete("/keranjang",checkAuth,(req,res)=>{
    const username = req.username;
    const {kode_keranjang} = req.body;
    const query = "delete from keranjang where username = ? and kode_keranjang = ?";
    db.query(query,[username,kode_keranjang],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500, message: err});
        }
        return res.json({status: 200, message: "Data Berhasil dihapus"});
    });
})

module.exports = router;