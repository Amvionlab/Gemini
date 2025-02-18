import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext/UserContext';
import img from '../../../src/image/sampat-logo.png';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import greylogo from '../../image/greythr-new-logo.webp'
import sampatlogo from '../../image/sampatName.png'
import userIcon from "../../../src/image/user.svg";
import passIcon from '../../../src/image/pass.svg';
import './login.css';
import AnimatedBackground from '../AnimatedBackground/AnimatedBackground';
import { sendData } from '../../encrypt';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const handleLogin = async () => {
    try {
      const result = await sendData(email, password);
      if (result.status === 'success') {
        setMessage("Login successful!");
        setUser({
          userId: result.userid,
          firstname: result.firstname,
          lastname: result.lastname,
          email: result.email,
          mobile: result.mobile,
          photo: result.photo,
          accessId: result.accessid,
          ticket: result.ticket,
          dashboard: result.dashboard,
          analytics: result.analytics,
          usertype: result.name,
          singleticket: result.singleticket,
          creation: result.creation,
          assign: result.assign,
          ticketaction: result.ticketaction
        });
        onLogin();
        navigate("/dashboard");
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage(`An error occurred: ${error.message}`);
    }
  };

  return (
    <>
      
        <AnimatedBackground>
          <div id="app">
            <div className="container-fluid">
              <div className="row justify-content-center">
                <div className="col-lg-12 text-center">
                  <img src={img} alt="sampat-logo" width="5%" height="6%" className="mx-auto d-block img-fluid" />
                  <h1 className="text-center text-login font-medium main-heading mt-2">Login to Sampat</h1>
                </div>
                <div className="col-lg-12 whole-login mt-4">
                  <div className='form-background'>
                    <label htmlFor="username" className="text-login text-sm font-medium">Username</label>
                    <br />
                    <div className="input-container">
                      <img src={userIcon} alt="user icon" className="input-icon" />
                      <input
                        type="email"
                        placeholder="Your Email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-login mt-2 border-none placeholder:text-second placeholder:text-xs"
                        autoComplete="off"
                      />
                    </div>
                    <br />
                    <label htmlFor="password" className="text-login text-sm font-medium">Password</label>
                    <br />
                    <div className="input-container">
                      <img src={passIcon} alt="password icon" className="input-icon" />
                      <input
                        type="password"
                        placeholder="Your Password"
                        id="password"
                        name="password"
                        className="input-login mt-2 border-none placeholder:text-second placeholder:text-xs"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                    <input
                      type="checkbox"
                      name="remember"
                      id="remember"
                      checked
                      className='mt-4 text-second text-sm'
                    />
                    <span className="text-login text-sm">&nbsp;&nbsp;Remember Me</span>
                    <br /><br />
                    <div className='text-center'>
                      <input type="submit" onClick={handleLogin} className="submit text-sm border-login text-login" />
                    </div> <br />
                    {message && <p className="text-red-500 mt-4 text-center">{message}</p>}
                  </div>
                </div>
              </div>
              <footer className='footer text-login text-sm font-normal'>
                <h6>&#169;2024 Amvion Labs Private Limited . All Rights Reserved</h6>
              </footer>
            </div>
          </div>
        </AnimatedBackground>
      </>
  );
};

export default Login;