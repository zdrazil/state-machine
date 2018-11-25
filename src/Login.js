import React, { Component } from "react";
import { Auth } from "./App";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      yourName: ""
    };
  }

  handleInput = e => {
    this.setState({
      yourName: e.target.value
    });
  };

  login(e) {
    e.preventDefault();
    this.props.transition({ type: "SUBMIT" });
    setTimeout(() => {
      if (this.state.yourName) {
        return this.props.transition(
          {
            type: "SUCCESS",
            username: this.state.yourName
          },
          () => {
            this.setState({ username: "" });
          }
        );
      }
      return this.props.transition({
        type: "FAIL",
        error: "Uh oh, you must enter your name!"
      });
    }, 2000);
  }

  render() {
    return (
      <Auth.Consumer>
        {({ authState }) => (
          <form onSubmit={e => this.login(e)}>
            <label htmlFor="yourName">
              <span>Your name</span>
              <input
                id="yourName"
                name="yourName"
                type="text"
                value={this.state.yourName}
                onChange={this.handleInput}
              />
            </label>
            <input
              type="submit"
              value={authState === "loading" ? "Logging in..." : "Login"}
              disabled={authState === "loading" ? true : false}
            />
          </form>
        )}
      </Auth.Consumer>
    );
  }
}

export default Login;
