const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY =  process.env.SECRET_KEY_ADMIN;


router.post("/login-admin",(req,res)=>{
    const {username,password} = req.body;
    const query = "select * from admin where username = ?";
    db.query(query,[username],(err,result)=>{
        if(err){
            return res.status(500).json({status:500, message: err});
        }
        if(result.length === 0){
            return res.status(401).json({status: 401, message: "invalid cridentials"});
        }
        const user = result[0];
        bcrypt.compare(password,user.password,(err,isMatch)=>{
            if(err){
                return res.status(500).json({status: 500, message: err});
            }
            if(!isMatch){
                return res.status(401).json({status:401, message: "invalid cridentials"});
            }
            const token = jwt.sign({username: user.username},SECRET_KEY,{expiresIn: "24h"});
            const data = {
                username: result[0].username
            }
            res.status(200).json({status: 200, token});
        });
    })
});

module.exports = router;