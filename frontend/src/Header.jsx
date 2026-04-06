import React from "react";

function Header() {
  return (
    <div className="amazon-header">
      <div className="left">
        <div className="logo">BuyHatke</div>

        <div className="location">
          <div>
            <small>Delivering to India</small><br />
            <b>Update location</b>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <input type="text" placeholder="Search BuyHatke.in" />
      </div>

      <div className="right">
        <div>Hello, sign in<br /><b>Account & Lists</b></div>
        <div>Returns<br /><b>& Orders</b></div>
        <div className="cart">Cart</div>
      </div>
    </div>
  );
}

export default Header;