import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import LockOpenTwoToneIcon from '@mui/icons-material/LockOpenTwoTone';
import "./Authentication.css"
import {useState, useContext} from "react";
import Box from '@mui/material/Box';
import { AuthContext } from '../context/AuthContext';
function Authentication() {

    let [name, setName] = useState("");
    let [username, setUsername] = useState("");
    let [password, setPassword] = useState("");
    let [formType, setFormType] = useState(0); // login = 0 signup = 1
    const {handleLogin, handleRegister} = useContext(AuthContext);

    const handleAuth = async () => {
        try{
            if(formType == 0) {
                await handleLogin(username, password);
            }else if (formType == 1) {
                await handleRegister(name, username, password);
            }

        }catch(err) {
            console.log("Something Went Wrong!");
        }
    }


    const handleName = (event) => {
        setName(event.target.value)
    }
    const handleUserame = (event) => {
        setUsername(event.target.value)
    }
    const handlePassword = (event) => {
        setPassword(event.target.value)
    }
    const handleBtn = () => {
        setFormType((prevFormType) => {
            if(prevFormType == 0) {
                return 1;
            }else {
                return 0;
            }
        });
    }
    return (
        <div className='authenticationContainer'>
            <div className='authenticationMain'>
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"  
                    height="100%"  
                    marginTop="30px"     
                >
                <LockOpenTwoToneIcon/>
                </Box>
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"  
                    height="100%"      
                    marginBlock="12px" 
                >
                    <Button size="small" variant={formType == 0 ? "contained" : ""} onClick={handleBtn}>Log In</Button>
                    <Button size="small" variant={formType == 1 ? "contained" : ""} onClick={handleBtn}>Sign Up</Button>
                </Box>
                
                <form>
                    {formType == 1 ? <><TextField id="Name" label="Name" variant="outlined" value={name} onChange={handleName} fullWidth required/> <br></br><br></br></> : <></>}
                    <TextField id="Username" label="Username" variant="outlined" value={username} onChange={handleUserame} fullWidth required/>
                    <br></br><br></br>
                    <TextField id="Password" label="Password" type="password" autoComplete="current-password" value={password} onChange={handlePassword} fullWidth required/>
                    <br></br><br></br>
                    <Button variant="contained" fullWidth onClick={handleAuth}>{formType == 0 ? "Sign In" : "Register"}</Button>
                </form>
            </div>
        </div>
    );
}

export default Authentication;