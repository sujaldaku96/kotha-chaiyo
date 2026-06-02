import React, { useState, useEffect  } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/Login.css";

// Set up axios defaults and interceptors
axios.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["x-auth-token"] = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

axios.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/login";
  }
  return Promise.reject(error);
});

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const navigate = useNavigate();

   useEffect(() => {
    const savedEmails = JSON.parse(localStorage.getItem("emailSuggestions") || "[]");
    setEmailSuggestions(savedEmails);
  }, []);

  const saveEmailToSuggestions = (email) => {
    const savedEmails = JSON.parse(localStorage.getItem("emailSuggestions") || "[]");
    if (!savedEmails.includes(email)) {
      const updatedEmails = [...savedEmails, email];
      localStorage.setItem("emailSuggestions", JSON.stringify(updatedEmails));
      setEmailSuggestions(updatedEmails);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Attempting login with:", email);
      
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      console.log("Login response:", response.data);

      const { token, role, user } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userEmail", user.email);
      saveEmailToSuggestions(email);
      // Set default axios authorization header
      axios.defaults.headers.common["x-auth-token"] = token;

      setSuccess("Login successful");

      if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/home");
      }
    } catch (err) {
      console.error("Detailed login error:", {
        message: err.message,
        response: err.response?.data,
        stack: err.stack
      });
      
      let errorMessage = "Login failed. Please try again.";
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Invalid email or password";
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data?.error?.message) {
          errorMessage = err.response.data.error.message;
        }
      }
      
      setError(errorMessage);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      delete axios.defaults.headers.common["x-auth-token"];
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <button className="login-back-button" onClick={() => navigate("/")}>
          ← 
        </button>

        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              list="email-suggestions"
            />
            <datalist id="email-suggestions">
              {emailSuggestions.map((suggestion, index) => (
                <option key={index} value={suggestion} />
              ))}
            </datalist>
          </div>

          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <span 
              className="eye-icon" 
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <p 
            className="forgot-password" 
            onClick={() => navigate("/forgot-password")}
            role="button"
            tabIndex="0"
          >
            Forgot Password?
          </p>

          <button 
            className="login-button" 
            type="submit" 
            disabled={loading || !email || !password}
            aria-busy={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {error && (
          <div className="error">
            {error}
          </div>
        )}
        {success && (
          <div className="success">
            {success}
          </div>
        )}

        <p className="terms">
          By signing in, you agree to <strong>KothaChaiyo.com</strong> Terms of Use & Privacy Policy.
        </p>

        <div className="signup-section">
          <p>Don't have an account?</p>
          <button 
            className="signup-button" 
            onClick={() => navigate("/signup")}
            type="button"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;