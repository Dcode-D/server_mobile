import jwt from "jsonwebtoken";
const VerifyAdminJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log(authHeader)
    if (!authHeader||authHeader.split(" ")[0]!=="Bearer") {
        return res.status(401).json({
            AUTHENTICATION_STATUS: false,
        });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            AUTHENTICATION_STATUS: false,
        });
    }
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if(err){
            return res.status(401).json({
                AUTHENTICATION_STATUS: false,
            });
        }else if(decoded.admin) {
            req.admin = decoded.admin;
            next();
        }
    });
}
module.exports = {VerifyAdminJWT};