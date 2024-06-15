const db = require("../db");

function generateKodeKeranjang(req,res,next){
    const query = "select MAX(kode_keranjang) as lastId from keranjang";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        if(results[0].lastId){
            let kodeKeranjang = results[0].lastId;
            let kodeKeranjangTanpaTR = parseInt(kodeKeranjang.slice(2), 6);
            req.kodeKeranjang = `KR${String(kodeKeranjangTanpaTR+1).padStart(3, '0')}`;
        }else{
            let newId = 1;
            req.kodeKeranjang = `KR${String(newId).padStart(3, '0')}`;
        }
        next();
    });
}

module.exports = generateKodeKeranjang;