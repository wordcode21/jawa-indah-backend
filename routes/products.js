const express = require("express");
const router =express.Router();
const db = require("../db");
const checkAdmin = require("../middleware/checkAdmin");
const checkAuth = require("../middleware/checkAuth");
const generateKodeBarang = require("../middleware/generateKodeBarang");
const getDate = require("../middleware/getDate");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./uploads");
    },
    filename: function(req,file,cb){
        cb(null,Date.now()+path.extname(file.originalname));
    }
});

const fileFilter = (req,file,cb)=>{
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLocaleLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
      } else {
        return cb(new Error('Only images are allowed'));
      }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

router.get("/products",checkAuth,(req,res)=>{
    const query = "select * from barang";
    db.query(query,(err,result)=>{
        if (err){
            res.status(500).json({message: `${err}`});
            return;
        };
        if(result.length>0){
            const baseUrl = "http://103.127.134.183:3000/"
            result.forEach(item => {
                if(item.foto !== null){
                    item.foto = baseUrl + item.foto;
                }
                const diupdate_tanggal = item.diupdate_tanggal;
                item.diupdate_tanggal = diupdate_tanggal.toISOString().split('T')[0];;
            });
        }
        res.status(200).json({status: 200,data: result});
    })
});

router.get("/products-admin",checkAdmin,(req,res)=>{
    const query = "select * from barang";
    db.query(query,(err,result)=>{
        if (err){
            res.status(500).json({message: `${err}`});
            return;
        };
        if(result.length>0){
            const baseUrl = "http://103.127.134.183:3000/"
            result.forEach(item => {
                if(item.foto !== null){
                    item.foto = baseUrl + item.foto;
                }
                const diupdate_tanggal = item.diupdate_tanggal;
                item.diupdate_tanggal = diupdate_tanggal.toISOString().split('T')[0];
            });
        }
        res.status(200).json({status: 200,data: result});
    })
});

router.post("/products-admin",checkAdmin,generateKodeBarang,getDate,upload.single("foto"),(req,res)=>{
    if(!req.file){
        return res.status(400).json({status: 400, message: "No file upload or file upload is not an image"});
    }
    let filePath = path.normalize(req.file.path);
    filePath = filePath.replace(/\\/g, '/');
    const { nama_barang, stok, harga} = req.body;
    const kode_barang = req.kodeBarang;
    const tanggal = req.date;
    if(!nama_barang || !stok || !harga){
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            }
            console.log('File deleted successfully');
        });
        return res.status(400).json({status: 400, message: "All Parameter must be filled"});
    }
    const query = "insert into barang (kode_barang,nama_barang,stok,harga,foto,diupdate_tanggal) values (?,?,?,?,?,?)";
    db.query(query,[kode_barang,nama_barang,parseInt(stok),parseInt(harga),filePath,tanggal],(err,result)=>{
        if (err){
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                }
                console.log('File deleted successfully');
            });
            console.log(err);
            res.status(500).json({message: "Database eror"});
            return;
        };
        res.status(201).json({status: 201, message: 'Product added successfully' });
    })
});

router.delete("/products-admin",checkAdmin,(req,res)=>{
    const {kode_barang} = req.body;
    const query = "select * from barang where kode_barang = ?";
    const query1 = "delete from  barang where kode_barang = ?";
    db.query(query,[kode_barang],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500, message: err});
        }
        if(result.length === 0){
            return res.status(404).json({status: 404, message: "Data tidak ditemukan"});
        }
        const foto = result[0].foto; 
        db.query(query1,[kode_barang],(err,result)=>{
            if(err){
                return res.status(500).json({status: 500, message: err});
            }
            fs.unlink(foto,(err)=>{
                if (err) {
                    console.error('Error deleting file:', err);
                    return res.status(500).json({ status: 500, message: "Error deleting file" });
                }
                console.log('File deleted successfully');
            });
            res.json({status:200, message: "file deleted successfully"});
        });
    });
});

router.patch("/products-admin",checkAdmin,(req,res)=>{
    const {kode_barang, stok, harga} =req.body;
    const hargaInt = parseInt(harga);
    const stokInt = parseInt(stok);
    if(stok && harga){
        const query = "update barang set stok = ?, harga = ? where kode_barang = ?";
        db.query(query,[stokInt,hargaInt,kode_barang],(err,result)=>{
            if(err){
                return res.json({message: err});
            }
            return res.json({status: 200,data: "Stok Berhasil di update"});
        });
    }else if(stok){
        const query = "update barang set stok = ?  where kode_barang = ?";
        db.query(query,[stokInt,kode_barang],(err,result)=>{
            if(err){
                return res.json({message: err});
            }
            return res.json({status: 200,data: "Stok Berhasil di update"});
        });
    }else if(harga){
        const query = "update barang set harga = ?  where kode_barang = ?";
        db.query(query,[hargaInt,kode_barang],(err,result)=>{
            if(err){
                return res.json({message: err});
            }
            return res.json({status: 200,data: "Stok Berhasil di update"});
        });
    }else{
        return res.status(400).json({status: 400, message: "failed to update"})
    }
});

module.exports = router;