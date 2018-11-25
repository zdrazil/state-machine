import React from "react";

import fetchJsonp from "fetch-jsonp";

import "./App.css";

const galleryMachine = {
  start: {
    SEARCH: "loading"
  },
  loading: {
    SEARCH_SUCCESS: "gallery",
    SEARCH_FAILURE: "error",
    CANCEL_SEARCH: "gallery"
  },
  error: {
    SEARCH: "loading"
  },
  gallery: {
    SEARCH: "loading",
    SELECT_PHOTO: "photo"
  },
  photo: {
    EXIT_PHOTO: "gallery"
  }
};

class App extends React.Component {
  constructor() {
    super();

    this.state = {
      gallery: "start", // finite state
      query: "",
      items: []
    };
  }

  command(nextState, action) {
    switch (nextState) {
      case "loading":
        // execute the search command
        this.search(action.query);
        break;
      case "gallery":
        if (action.items) {
          // update the state with the found items
          return { items: action.items };
        }
        break;
      case "photo":
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

    this.transition({ type: "SEARCH", query: this.state.query });
  }

  search(query) {
    const encodedQuery = encodeURIComponent(query);

    setTimeout(() => {
      fetchJsonp(
        `https://api.flickr.com/services/feeds/photos_public.gne?lang=en-us&format=json&tags=${encodedQuery}`,
        { jsonpCallback: "jsoncallback" }
      )
        .then(res => res.json())
        .then(data => {
          this.transition({ type: "SEARCH_SUCCESS", items: data.items });
        })
        .catch(error => {
          this.transition({ type: "SEARCH_FAILURE" });
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
              onClick={() => this.transition({ type: "CANCEL_SEARCH" })}
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
              onClick={() =>
                this.transition({
                  type: "SELECT_PHOTO",
                  item
                })
              }
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
        onClick={() => this.transition({ type: "EXIT_PHOTO" })}
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

    return (
      <div className="ui-app" data-state={galleryState}>
        {this.renderForm(galleryState)}
        {this.renderGallery(galleryState)}
        {this.renderPhoto(galleryState)}
      </div>
    );
  }
}

export default App;
