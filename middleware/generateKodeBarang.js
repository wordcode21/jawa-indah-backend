const db = require("../db");

function generateKodeBarang(req,res,next){
    const query = "SELECT MAX(kode_barang) AS lastId FROM barang";
    db.query(query, (err, results) => {
        if (err){
            return res.status(500).json({ message: err.message });
        } 
        if(results[0].lastId){
            let kodeBarang = results[0].lastId;
            let kodeBarangTanpaKB = parseInt(kodeBarang.slice(2), 10);
            req.kodeBarang = `KB${String(kodeBarangTanpaKB+1).padStart(3, '0')}`;
        }else{
            let newId = 1;
            req.kodeBarang = `KB${String(newId).padStart(3, '0')}`;
        }
        next();
    });
}

module.exports= generateKodeBarang;