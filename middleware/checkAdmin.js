require("dotenv").config();
const jwt = require("jsonwebtoken");
const SECRET_KEY =  process.env.SECRET_KEY_ADMIN;

function checkAdmin(req,res,next){
    const headers = req.headers["authorization"];
    if(!headers){
        return res.status(403).json({status: 403, message: "no token provided"});
    }
    let token = headers.split(' ')[1];
    if (!token) {
        return res.status(403).json({ status: 403, message: "no token provided" });
    }
    token = token.replace(/['"]+/g, '');
    jwt.verify(token,SECRET_KEY,(err,decode)=>{
        if(err){
            return res.status(401).json({status: 401, message: err});
        }
        req.username = decode.username;
        next();
    });
}
module.exports = checkAdmin;

