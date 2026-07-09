import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import status from "http-status";
import crypto from "crypto";

const login = async (req, res) => {
    const {username, password} = req.body;

    if(!username || !password) {
        return res.status(400).JSON({message:"Please Provide!"});
    }

    try{
        const user = await User.findOne({username});
        if(!user) {
            return res.status(status.NOT_FOUND).json({message: "User Not Found"});
        }
        if(bcrypt.compare(user.password, password)) {
            let token =crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            res.status(status.OK).json({message : "User Successfully Logged In!"});
        }
    }catch(e) {
        res.status(500).json(`Something went wrong ${e}`);
    }
}

const register = async (req, res) => {
    const {username, password, name} = req.body;

    try {
        const isUserExists = await User.findOne({username});
        if(isUserExists){
            return res.status(status.FOUND).json({message : "user already exists!"});
        }
        const hashedPassword = await bcrypt.hash(password, 10); //early return statements : concept in good codes
        const newUser = new User({
            name : name,
            username : username,
            password : hashedPassword,
        });
        await newUser.save();
        res.status(status.CREATED).json({message : "User successfully registered"});

    }catch(e) {
        res.status(500).json(`Something went wrong ${e}`);
    }
}
export {login, register};