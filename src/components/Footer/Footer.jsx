import React from 'react'                          
import './Footer.css'                 
import { assets } from '../../assets/assets'    

const Footer = () => {                           // Define Footer functional component
  return (
    <div className='footer' id='footer'>        {/* Main container div with class and id for styling and reference */}
      <div className="footer-content">          {/* Wrapper for the main footer content sections */}

        <div className="footer-content-left">  
          <img src={assets.logo} alt="" />     {/* Display logo image from assets */}
          <p>                                  {/* Paragraph describing the company or footer message */}
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quae, non suscipit. Cumque, ullam? Placeat dolorem, suscipit eum sint molestiae consequatur voluptatibus laboriosam error! Ut tempore, odit ab rem sequi vel!
          </p>
          <div className="footer-social-icons"> 
            <img src={assets.facebook_icon} alt="" />  
            <img src={assets.twitter_icon} alt="" />   
            <img src={assets.linkedin_icon} alt="" /> 
          </div> 
        </div>

        <div className="footer-content-center"> 
          <h2>COMPANY</h2>                     {/* Heading for company info links */}
          <ul>                                {/* Unordered list for company related links */}
            <li>Home</li>                   
            <li>About us</li>                 
            <li>Delivery</li>                  
            <li>Privacy Policy</li>            
          </ul>
        </div>

        <div className="footer-content-right"> 
          <h2>GET IN TOUCH</h2>                {/* Heading for contact information */}
          <ul>                                {/* Unordered list for contact details */}
            <li>+1-212-456-7890</li>          
            <li>contact@tomato.com</li>       
          </ul>
        </div>
      </div>

      <hr />                                  {/* Horizontal rule as a separator */}

      <p className='footer-copyright'>        {/* Paragraph for copyright notice */}
        Copyright 2024 © Tomato.com - All rights reserved.
      </p>
    </div>
  )
}

export default Footer                         // Export Footer component for use in other files
