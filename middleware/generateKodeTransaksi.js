const db = require("../db");

function generateKodeTransaksi(req,res,next){
    const query = "select MAX(kode_transaksi) as lastId from transaksi";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        console.log(results.lastId);
        if(results[0].lastId){
            let kodeTransaksi = results[0].lastId;
            let kodeTransksiTanpaTR = parseInt(kodeTransaksi.slice(2), 10);
            req.kodeTransaksi = `TR${String(kodeTransksiTanpaTR+1).padStart(3, '0')}`;
        }else{
            let newId = 1;
            req.kodeTransaksi = `TR${String(newId).padStart(3, '0')}`;
        }
        next();
    });
}

module.exports = generateKodeTransaksi;