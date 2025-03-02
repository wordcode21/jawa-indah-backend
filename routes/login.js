const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY_USER;

router.post("/login",(req,res)=>{
    const{username, password} = req.body;
    if(!username || !password){
        return res.status(400).json({status: 400, message:"bad request"});
    };
    const query = "select * from pembeli where username = ?";
    db.query(query,[username],(err,result)=>{
        if(err){
            return res.status(500).json({status: 500, message: err });
        };
        if(result.length === 0){
            return res.status(401).json({status: 401, message: "invalid cridentials"});
        };
        const user = result[0];
        bcrypt.compare(password,user.password,(err,isMatch)=>{
            if(err){
                return res.status(500).json({status: 500,message: err});
            }
            if(!isMatch){
                return res.status(401).json({status: 401, message: "Invalid Cridentials"});
            }
            const token = jwt.sign({username: user.username},SECRET_KEY);
            res.status(200).json({status: 200,token: token});
        });
    });
});

module.exports = router;