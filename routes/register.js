const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

router.post("/register",(req,res)=>{
    const {username, email, name, password} = req.body;
    if(!username || !email || !name || !password){
        res.status(400).json({status: 400,message: "bad request"});
    }
    const hashPassword = bcrypt.hashSync(password,5);
    const defaultFoto = "uploads/default.jpg"; 
    const query = "insert into pembeli (username,email,name,password,foto) values(?,?,?,?,?)";
    db.query(query,[username,email,name,hashPassword,defaultFoto],(err,result)=>{
        if(err){
            res.status(500).json({message: err});
            return;
        }
        res.status(201).json({status: 201,message: "Registrasi Berhasil"});
    });
});

router.post("/register-admin",(req,res)=>{
    const {username,password} = req.body;
    const hashPassword = bcrypt.hashSync(password,5);
    const query = "insert into admin (username,password) values(?,?)";
    db.query(query,[username,hashPassword],(err,result)=>{
        if(err){
            res.status(500).json({message: err});
            return;
        }
        res.status(201).json({status: 201,message: "Registrasi Berhasil"});
    });
});

module.exports= router;