import { createContext, useState} from "react";
import axios from "axios";

export const AuthContext = createContext();

const AuthProvider = ({children}) => {
    const authContext = createContext(AuthContext);

    let [user, setUser] = useState(authContext);

   
    const handleRegister = async (name, username, password) => {
        try{
            let res = await axios.post("http://localhost:8000/api/v1/users/register", {
                name : name,
                username : username,
                password : password,
            });
            console.log(res.data.message);
        }catch(err) {
            throw err;
        }
    }
    const handleLogin = async (username, password) => {
        try {
            let res = await axios.post("http://localhost:8000/api/v1/users/login", {
                username : username,
                password : password
            });

            console.log(res.data.message);
        }catch(err) {
            throw err;
        }
    }

    const data = {
        user, setUser, handleRegister,handleLogin,
    }

    return (
        <AuthContext.Provider value={data} >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;