import React from "react";
import { Machine } from "xstate";
import { interpret } from "xstate/lib/interpreter";

import fetchJsonp from "fetch-jsonp";

import "./App.css";

const galleryMachine = Machine({
  id: "gallery",
  initial: "start",
  states: {
    start: {
      on: {
        SEARCH: "loading"
      }
    },
    loading: {
      onEntry: ["fetchQuery"],
      on: {
        SEARCH_SUCCESS: "gallery",
        SEARCH_FAILURE: "error",
        CANCEL_SEARCH: "gallery"
      }
    },
    error: {
      on: {
        SEARCH: "loading"
      }
    },
    gallery: {
      onEntry: ["setItems"],
      on: {
        SEARCH: "loading",
        SELECT_PHOTO: "photo"
      }
    },
    photo: {
      onEntry: ["setPhoto"],
      on: { EXIT_PHOTO: "gallery" }
    }
  }
});

class App extends React.Component {
  constructor() {
    super();

    this.state = {
      gallery: galleryMachine.initialState,
      query: "",
      items: []
    };
  }

  service = interpret(galleryMachine).onTransition(nextState => {
    const { actions } = nextState;
    actions.forEach(action => {
      // If the action is executable, execute it
      this.command(action.type);
    });

    this.setState({ gallery: nextState });
  });

  componentDidMount() {
    this.service.start();
  }

  componentWillUnmount() {
    this.service.stop();
  }

  command(action) {
    switch (action) {
      case "fetchQuery":
        // execute the search command
        this.search(this.state.query);
        break;
      case "setItems":
        // NOT USED
        if (action.items) {
          // update the state with the found items
          return { items: action.items };
        }
        break;
      case "setPhoto":
        if (action.item) {
          // update the state with the selected photo item
          return { photo: action.item };
        }
        break;
      default:
        break;
    }
  }

  transition(action) {
    const currentGalleryState = this.state.gallery;
    const nextGalleryState = galleryMachine[currentGalleryState][action.type];

    if (nextGalleryState) {
      const nextState = this.command(nextGalleryState, action);

      this.setState({
        gallery: nextGalleryState,
        ...nextState
      });
    }
  }

  handleSubmit(e) {
    e.persist();
    e.preventDefault();

    this.setState({
      query: this.state.query
    });
    this.service.send({ type: "SEARCH" });
  }

  search(query) {
    const encodedQuery = encodeURIComponent(query);
    console.log(query);
    setTimeout(() => {
      fetchJsonp(
        `https://api.flickr.com/services/feeds/photos_public.gne?lang=en-us&format=json&tags=${encodedQuery}`,
        { jsonpCallback: "jsoncallback" }
      )
        .then(res => res.json())
        .then(data => {
          this.setState({
            items: data.items
          });
          this.service.send({ type: "SEARCH_SUCCESS" });
        })
        .catch(error => {
          this.service.send({ type: "SEARCH_FAILURE" });
        });
    }, 1000);
  }
  handleChangeQuery(value) {
    this.setState({ query: value });
  }

  renderForm(state) {
    const searchText =
      {
        loading: "Searching...",
        error: "Try search again",
        start: "Search"
      }[state] || "Search";

    return (
      <form className="ui-form" onSubmit={e => this.handleSubmit(e)}>
        <input
          type="search"
          className="ui-input"
          value={this.state.query}
          onChange={e => this.handleChangeQuery(e.target.value)}
          placeholder="Search Flickr for photos..."
          disabled={state === "loading"}
        />
        <div className="ui-buttons">
          <button className="ui-button" disabled={state === "loading"}>
            {searchText}
          </button>
          {state === "loading" && (
            <button
              className="ui-button"
              type="button"
              onClick={() => this.service.send({ type: "CANCEL_SEARCH" })}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  }

  renderGallery(state) {
    return (
      <section className="ui-items" data-state={state}>
        {state === "error" ? (
          <span className="ui-error">Uh oh, search failed.</span>
        ) : (
          this.state.items.map((item, i) => (
            <img
              alt={item.title}
              src={item.media.m}
              className="ui-item"
              style={{ "--i": i }}
              key={item.link}
              onClick={() => {
                this.setState({ item });
                this.service.send({
                  type: "SELECT_PHOTO"
                });
              }}
            />
          ))
        )}
      </section>
    );
  }

  renderPhoto(state) {
    if (state !== "photo") return;

    return (
      <section
        className="ui-photo-detail"
        onClick={() => this.service.send({ type: "EXIT_PHOTO" })}
      >
        <img
          alt={this.state.photo.title}
          src={this.state.photo.media.m}
          className="ui-photo"
        />
      </section>
    );
  }
  render() {
    const galleryState = this.state.gallery;
    const { send } = this.service;
    console.log(this.state);

    return (
      <div className="ui-app" data-state={galleryState.value}>
        {this.renderForm(galleryState.value)}
        {this.renderGallery(galleryState.value)}
        {this.renderPhoto(galleryState.value)}
      </div>
    );
  }
}

export default App;
