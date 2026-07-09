import { Link } from "react-router-dom";
import "./LandingPage.css";
function LandingPage () {
    return (
        <div className="landingPageContainer">
            <nav>
                <div className="navHeader">
                    <h2>Zoom</h2>
                </div>
                <div className="navList">
                    <p>Join as Guest</p>
                    <p>Register</p>
                    <p>Login</p>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1><span style={{color : "orange"}}>Connect</span> with your Loved Ones</h1>
                    <p>Cover a distance by Zoom</p>
                    <button>
                        <Link to="/auth">Get Started</Link>
                    </button>
                </div>
                <div className="mobileImg"/>
            </div>
        </div>
    );
}

export default LandingPage;