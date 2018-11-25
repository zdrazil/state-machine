import React from "react";
import { Auth } from "./App";

const Dashboard = () => (
  <Auth.Consumer>
    {({ user, logout }) => (
      <div>
        <div>Hello {user.name}</div>
        <button onClick={e => logout(e)}>Logout</button>
      </div>
    )}
  </Auth.Consumer>
);

export default Dashboard;
