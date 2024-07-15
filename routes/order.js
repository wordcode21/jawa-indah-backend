const express = require("express");
const router = express.Router(); 
const db = require("../db");
const checkAuth = require("../middleware/checkAuth");
const generateKodeTransaksi = require("../middleware/generateKodeTransaksi");
const getDate = require("../middleware/getDate");
const checkAdmin = require("../middleware/checkAdmin");
const midtransClient = require("midtrans-client");
const verifyMidtransSignature = require("../middleware/verifyMidtransSignature");

router.get("/order",checkAuth,(req,res)=>{
    const username = req.username;
    const query = "select t1.kode_transaksi, t2.nama_barang,t1.sebanyak,t2.harga,t1.ongkir, (t1.sebanyak*t2.harga)+t1.ongkir as total_tagihan, t1.status from transaksi t1 inner join barang t2 on t1.kode_barang = t2.kode_barang where t1.username = ?";
    db.query(query,[username],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500, message: err}); 
        }
        if(result.length === 0){
            return res.status(200).json({status:200,message: "No transactions found.",data: result});
        }
        res.status(200).json({status: 200, data: result });
    });
});

const snap = new midtransClient.Snap({
    isProduction:false,
    serverKey: process.env.SERVER_KEY_MIDTRANS
    }
);

router.post("/order", checkAuth, generateKodeTransaksi, getDate, (req, res) => {
    const username = req.username;
    const { kode_barang, sebanyak, alamat, kota, ongkir } = req.body;
    const ongkir_barang = parseInt(ongkir);
    const banyak_barang = parseInt(sebanyak);
    const kode_transaksi = req.kodeTransaksi;
    const status = "pending";
    const date = req.date;
    const query1 = "select email,name from pembeli where username = ?"
    const query2 = "select * from barang where kode_barang = ?";
    const query3 = "insert into transaksi(kode_transaksi, username, kode_barang, sebanyak, harga, status, alamat, tanggal_transaksi, kota, ongkir) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    console.log(kode_transaksi);
    db.query(query1,[username],(err,result)=>{
      if (err) {
        return res.status(500).json({ status: 500, message: err });
      }
      const email = result[0].email;
      const name = result[0].name;
      db.query(query2, [kode_barang], (err, result) => {
        if (err) {
          return res.status(500).json({ status: 500, message: err });
        }
        if (banyak_barang <= result[0].stok) {
          const harga = parseInt(result[0].harga);
          const namaBarang = result[0].nama_barang;
          // Simpan transaksi ke database
          db.query(query3, [kode_transaksi, username, kode_barang, banyak_barang, harga, status, alamat, date, kota, ongkir_barang], (err, result) => {
            if (err) {
              return res.status(500).json({ status: 500, message: err });
            }
    
            // Buat transaksi dengan Midtrans setelah berhasil disimpan di database
            const transactionDetails = {
              transaction_details: {
                order_id: kode_transaksi,
                gross_amount: (harga * banyak_barang)+ongkir_barang
              },
              credit_card: {
                secure: true
              },
              customer_details: {
                first_name:name,
                last_name:"",
                email: email
              },
              finish_redirect_url: "http://jawaindahgas.masadji.my.id/"
            };
    
            // Buat transaksi dengan Midtrans Snap API
            snap.createTransaction(transactionDetails)
              .then((transaction) => {
                // Kirim URL pembayaran ke frontend
                updateBarang(kode_barang,banyak_barang);
                res.status(201).json({
                  status: 201,
                  message: "Transaksi berhasil dibuat",
                  payment_url: transaction.redirect_url
                });
              })
              .catch((error) => {
                console.error('Error creating transaction with Midtrans:', error);
                res.status(500).json({ status: 500, message: 'Gagal membuat transaksi dengan Midtrans' });
              });
          });
        } else {
          return res.status(200).json({ status: 400, message: "Pesanan Melebihi Stok" });
        }
      });
    });
  });

router.get("/order-admin",checkAdmin,(req,res)=>{
    let {bulan, tahun} = req.body;
    const date = new Date();
    const query = "select  t2.kode_transaksi, t1.name, t2.alamat,t2.kota, t3.nama_barang, t2.sebanyak,t3.harga,t2.ongkir, (t2.sebanyak*t3.harga)+t2.ongkir as total, t2.status from pembeli as t1 inner join transaksi as t2 on t1.username = t2.username inner join barang t3 on t3.kode_barang = t2.kode_barang where month(t2.tanggal_transaksi) = ? and year(t2.tanggal_transaksi) = ?";
    if(!bulan){
        bulan = date.getMonth();
        bulan++;
    }
    if(!tahun){
        tahun = date.getFullYear();
    }
    db.query(query,[bulan,tahun],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500, message: err});
        }
        return res.json({status: 200, data: result});
    });
});

router.patch("/order-admin",checkAdmin,(req,res)=>{
    const {kode_transaksi,status} = req.body;
    if(!kode_transaksi || !status){
        return res.status(400).json({status: 400, message: "Parameter harus di isi"});
    }
    const query1 = "select status from transaksi where kode_transaksi = ?";
    const query2 = "update transaksi set status = ? where kode_transaksi = ?";
    db.query(query1,[kode_transaksi],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500,message: err});
        }
        if(result[0].status == "selesai"){
            return res.status(200).json({status: 200, message: "Transaksi Sudah Selesai"});
        }
        if(status.toLowerCase() == "selesai"){
            addLaporan(kode_transaksi);
        }
        db.query(query2,[status.toLowerCase(),kode_transaksi],(err,result)=>{
            if(err){
                return res.status(500).json({status: 500,message: err});
            }
            return res.json({status: 200, message: "Berhasil di update"});
        });
    })
});

function addLaporan(kode){
    const date = new Date();
    const today = date.toISOString().split('T')[0];
    const query = `insert into laporan (kode_barang,sebanyak,tanggal) select kode_barang, sebanyak, "${today}" from transaksi where kode_transaksi = ?`;
    db.query(query,[kode],(err,result)=>{
        if(err){
            console.log(err);
        }
        console.log(result);
    })
}

function updateBarang(kodeBarang,sebanyak){
    const query = "update barang set stok = stok -? where kode_barang = ?";
    db.query(query,[sebanyak,kodeBarang],(err,result)=>{
        if(err){
            console.log(err);
        }
        console.log(result); 
    });
}

router.get("/cek-kode",generateKodeTransaksi,(req,res)=>{
  const kodeTransaksi = req.kodeTransaksi;
  res.json({kodeTransaksi});
})

router.post('/midtrans-webhook', verifyMidtransSignature, (req, res) => {
  const notification = req.body;
  const orderId = notification.order_id;
  const transactionStatus = notification.transaction_status;
  const fraudStatus = notification.fraud_status;

  // Map Midtrans status to your application's status
  let newStatus;
  if (transactionStatus === 'capture') {
    if (fraudStatus === 'challenge') {
      newStatus = 'pending';
    } else if (fraudStatus === 'accept') {
      newStatus = 'paid';
    }
  } else if (transactionStatus === 'settlement') {
    newStatus = 'paid';
  } else if (transactionStatus === 'cancel' ||
             transactionStatus === 'deny' ||
             transactionStatus === 'expire') {
    newStatus = 'failed';
  } else if (transactionStatus === 'pending') {
    newStatus = 'pending';
  }

  if (newStatus) {
    const query = 'UPDATE transaksi SET status = ? WHERE kode_transaksi = ?';
    db.query(query, [newStatus, orderId], (err, result) => {
      if (err) {
        return res.status(500).json({ status: 500, message: err });
      }
      res.status(200).json({ status: 200, message: 'Transaction status updated' });
    });
  } else {
    res.status(400).json({ status: 400, message: 'Invalid transaction status' });
  }
});

module.exports = router;