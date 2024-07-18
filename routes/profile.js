const express = require("express");
const router =  express.Router();
const db = require("../db");
const mutler = require("multer");
const path = require("path");
const checkAuth = require("../middleware/checkAuth");
const fs = require("fs");

const storage = mutler.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./uploads");
    },
    filename: function(req,file,cb){
        cb(null, Date.now()+path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb(new Error('Only images are allowed'));
    }
};

const upload = mutler({
    storage: storage,
    fileFilter: fileFilter
});

router.get("/profile",checkAuth,(req,res)=>{
    const username =req.username;
    const query = "select username,name,foto from pembeli where username = ?";
    db.query(query,[username],(err,result)=>{
        if (err){
            res.status(500).json({message: `${err}`});
            return;
        };
        if(result.length >0){
            const baseUrl= "https://api.masadji.my.id/"
            result[0].foto = baseUrl + result[0].foto;
        }
        res.status(200).json({status:200,data: result});
    });
});

router.patch("/profile",checkAuth,upload.single("foto"),(req,res,next)=>{
    if(!req.file){
        return res.status(400).json({status: "400", message: "No file upload or file upload is not image"})
    }
    const username = req.username;
    let filePath = path.normalize(req.file.path);
    filePath = filePath.replace(/\\/g, '/');
    const query = "select foto from pembeli where username = ?";
    const query1 = "update pembeli set foto = ? where username = ?";
    db.query(query,[username],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500,message: err});
        };
        fs.unlink(result[0].foto, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            }
            console.log('File deleted successfully');
        });
        db.query(query1,[filePath,username],(err,result)=>{
            if(err){
                return res.status(500).json({status: 500,message: err});
            };
            res.json({status: 200, message: "foto updated successfully"});
        });
    });
});

router.use('/uploads', express.static(path.join(__dirname, '../uploads')));
module.exports = router;