import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { debounce } from 'lodash';

import { Link, Router } from '../routes';

import List from '../components/List';

import { getProfile } from '../lib/data';

export default class SearchForm extends React.Component {

  static propTypes = {
    orgs: PropTypes.array,
  };

  constructor (props) {
    super(props);
    // this.form = React.createRef();
    this.searchInput = React.createRef();
    this.state = { ok: null, error: null, q: '', focused: false };
    this.stateFeedbackDebounced = debounce(this.stateFeedback.bind(this), 333);
  }

  async stateFeedback (q) {
    const profile = await getProfile(q);
    // Handle non-matching feedback
    // (it's possible that 'q' changed since we fired the request,
    // we could try to cancel the http request but this is simpler like that)
    if (this.state.q !== q) {
      this.stateFeedbackDebounced(this.state.q);
      return;
    }
    if (!profile) {
      this.setState({
        error: '✗ There is no GitHub organization or user with this identifier.',
        ok: null,
      });
    } else {
      this.setState({
        error: null,
        ok: '✓ This is a valid GitHub identifier.',
      });
    }
  }

  handleChange = (event) => {
    const q = event.target.value;
    this.setState({ q });
    if (q) {
      this.stateFeedbackDebounced(q);
    } else {
      this.setState({ ok: null, error: null });
      this.stateFeedbackDebounced.cancel();
    }
  };

  handleSubmit = (event) => {
    if (this.state.q && this.state.q.length > 0) {
      Router.pushRoute('search', { q: this.state.q });
    }
    event.preventDefault();
  };

  search = (event, q) => {
    event.preventDefault();
    event.stopPropagation();
    this.focus();
    this.setState({ q });
    Router.pushRoute('search', { q });
  };

  focus = () => this.searchInput.current.focus();

  canSubmit = () => this.state.q && !this.state.error;

  isFocused = () => document && document.activeElement === this.searchInput.current;

  handleFocus = () => this.setState({ focused: this.isFocused() });

  searchLink = profile => (
    <Link key={profile.login} route="profile" params={{ id: profile.login }}>
      <a onClick={event => this.search(event, profile.login)} href={`/${profile.login}`}>
        {profile.login}
      </a>
    </Link>
  );

  render () {
    const { orgs } = this.props;
    const { q, ok, error, focused } = this.state;

    return (
      <Fragment>

        <style jsx>{`
          .searchInput {
            margin: 50px auto 10px;
            padding: 12px 17px;
            position: relative;
            border: 1px solid rgba(18,19,20,0.16);
            border-radius: 4px;
            background-color: #F7F8FA;
            box-shadow: inset 0 1px 3px 0 rgba(18,19,20,0.08);
          }
          .searchInput.focused {
            background: white;
          }
          .searchInput.focused, .searchInput:hover {
            border-color: #3A2FAC;
          }
          .searchInput.focused.error {
            border-color: #F53152;
          }
          .searchInput span {
            font-size: 16px;
            color: #C2C6CC;
          }
          .searchInput input {
            font-size: 16px;
            border: 0;
            border-style: solid;
            background: transparent;
          }
          .searchInput input, .searchInput input::placeholder {
            color: #9399A3;
          }
          .searchInput input:focus {
            outline: none;
            color: #2E3033;
          }
          .searchButton {
            border-radius: 8px;
            background-color: #3A2FAC;
            padding: 13px;
            font-size: 14px;
            font-weight: bold;
            color: white;
            display: block;
            margin: 50px auto;
            width: 250px;
            border: 0;
          }
          .searchButton:hover {
            background-color: black; // FIXME
          }
          .searchButton:disabled {
            background-color: #d2cbed;
          }
          .searchExamples {
            font-size: 12px;
            text-align: center;
            color: #9399A3;
          }
          .searchExamples a {
            color: inherit;
            text-decoration: underline;
          }
          .searchExamples a:hover {
            text-decoration: none;
          }
          .searchFeedback {
            position: absolute;
            font-size: 12px;
            width: 200px;
            right: 0;
            margin-right: -220px;
          }
          .searchFeedback.ok {
            color: #3A2FAC;
          }
          .searchFeedback.error {
            color: #F53152;
          }
        `}
        </style>

        <form method="GET" action="/search" onSubmit={this.handleSubmit}>

          <div
            className={classNames('searchInput', { error: !!error, ok: !!ok, focused: focused })}
            onClick={this.focus}
            >
            {error &&
              <div className="searchFeedback error">{error}</div>
            }
            {ok &&
              <div className="searchFeedback ok">{ok}</div>
            }
            <span>https://github.com/</span>
            <input
              ref={this.searchInput}
              type="text"
              name="q"
              value={q}
              placeholder="your organization"
              onChange={this.handleChange}
              onFocus={this.handleFocus}
              onBlur={this.handleFocus}
              autoComplete="off"
              />
          </div>

          {orgs && orgs.length > 0 &&
            <p className="searchExamples">
              Your organizations: &nbsp;
              <List
                array={orgs}
                map={this.searchLink}
                others={false}
                />
            </p>
          }

          {!orgs &&
            <p className="searchExamples">
              e.g.: &nbsp;
              <List
                array={[{ login: 'facebook' }, { login: 'airbnb' }, { login: 'square' }]}
                map={this.searchLink}
                others={false}
                />
            </p>
          }

          <input
            type="submit"
            value="Analyze your stack"
            className="searchButton"
            disabled={this.canSubmit() ? false : true}
            />

        </form>

      </Fragment>
    );
  }

}
