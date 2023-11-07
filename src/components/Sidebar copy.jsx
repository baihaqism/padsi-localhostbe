import React, { useState } from "react"
import "./Sidebar.css"
import Logo from "../imgs/logo.png"
import { useNavigate } from "react-router-dom"
import { UilSignOutAlt } from "@iconscout/react-unicons"
import { SidebarData } from "../Data/Data"
import { UilBars } from "@iconscout/react-unicons"

const Sidebar = () => {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleItemClick = (item) => {
    if (item.subNav) {
      setExpanded((prevExpanded) => !prevExpanded);
    } else {
      navigate(item.path);
      setSelected(item.title);
      setExpanded(false);
    }
  };

  return (
    <>
      <div
        className="bars"
        style={expanded ? { left: '60%' } : { left: '5%' }}
        onClick={() => setExpanded((prevExpanded) => !prevExpanded)}
      >
        <UilBars />
      </div>
      <div className={`sidebar ${expanded ? 'true' : 'false'}`}>
        <div className="logo">
          <img src={Logo} alt="logo" />
          <span>
            JB<span>S</span>alon
          </span>
        </div>

        <div className="menu">
          {SidebarData.map((item, index) => (
            <div
              className={selected === item.title ? 'menuItem active' : 'menuItem'}
              key={index}
              onClick={() => handleItemClick(item)}
            >
              <item.icon />
              <span>{item.title}</span>
            </div>
          ))}
          <div className="menuItem" onClick={handleLogout}>
            <UilSignOutAlt />
            <span>Logout</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;