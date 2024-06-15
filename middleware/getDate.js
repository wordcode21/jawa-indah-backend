function getDate(req,res,next){
    const date = new Date();
    const today = date.toISOString().split('T')[0];
    req.date = today;
    next();
}

module.exports = getDate;