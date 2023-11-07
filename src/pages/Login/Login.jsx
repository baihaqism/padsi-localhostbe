import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import { UisUserMd } from '@iconscout/react-unicons-solid'
import { UisLock } from '@iconscout/react-unicons-solid'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [shake, setShake] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json()

      if (response.ok) {
        const { token, role } = data;
        localStorage.setItem('token', token)
        localStorage.setItem('role', role);
        console.log('Login successful:', data)
        localStorage.setItem('selectedItem', 'Dashboard')
        navigate('/dashboard')
      } else {
        console.error('Login failed:', data.message)
        setShake(true)
        setTimeout(() => {
          setShake(false)
        }, 500)
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };
  
  const buttonStyle = {
    width: '100%',
    height: '45px',
    background: '#fa709a',
    border: 'none',
    outline: 'none',
    borderRadius: '40px',
    cursor: 'pointer',
    fontSize: '1em',
    color: '#fff',
    fontWeight: 500,
  };

  return (
    <div className="background">
      <div className="body">
        <div className={`wrapper ${shake ? 'shake' : ''}`}>
          <form onSubmit={handleSubmit}>
            <h2>Login</h2>
            <div className={`input-box-username ${shake ? 'shake' : ''}`}>
              <span className="icon-user"><UisUserMd /></span>
              <input type="text" required id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <label htmlFor="username">Username</label>
            </div>

            <div className={`input-box-password ${shake ? 'shake' : ''}`}>
              <span className="icon-password"><UisLock /></span>
              <input type="password" required id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <label htmlFor="password">Password</label>
              <i className='bx bxs-lock-alt'></i>
            </div>

            <div className="input-remember-forgot">
              <label><input type="checkbox" /> Remember me</label>
              {/* <a href="#">Forgot password?</a> */}
            </div>

            <button type="submit" style={buttonStyle}>Login</button>

            <div className="register-link">
              <p>Don't have an account? <a href="/register">Register</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login;
