import React from 'react';
import moment from 'moment';
import VoteFactory from '../components/Vote';
var Vote;
import ActionsFactory from '../components/Actions';
var Actions;
import ListingDropdownFactory from '../components/ListingDropdown';
var ListingDropdown;
import GoldIconFactory from '../components/GoldIcon';
var GoldIcon;
import PlayIconFactory from '../components/PlayIcon';
var PlayIcon;
import short from '../../lib/formatDifference';
var imgMatch = /\.(?:gif|jpe?g|png)/gi;
var gfyRegex = /https?:\/\/(?:.+)\.gfycat.com\/(.+)\.gif/;

function gifToHTML5(url) {
  if (!url) {
    return;
  }
  if (url.indexOf('.gif') < 1) {
    return;
  }

  // If it's imgur, make a gifv link
  if (url.indexOf('imgur.com') > -1) {
    return {
      webm: url.replace(/\.gif/, '.webm'),
      mp4: url.replace(/\.gif/, '.mp4'),
      poster: url.replace(/\.gif/, 'h.jpg'),
    };
  } else if (url.indexOf('gfycat') > 8) {
    var gfy = gfyRegex.exec(url);

    if (gfy.length === 2) {
      var id = gfy[1];

      return {
        iframe: 'http://gfycat.com/ifr/' + id,
      };
    }
  }
}

class Listing extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: this.props.expanded,
      canUnexpand: !this.props.expanded,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (nextProps !== this.props || nextState !== this.state);
  }

  buildImage(url, embed, fixedRatio) {
    var html5 = gifToHTML5(url);
    if (html5) {
      var height = embed ? embed.height : 300;

      if (html5.iframe) {
        return (
        <iframe src={ html5.iframe } frameBorder='0' width='100%' allowFullScreen='' height={ height } sandbox='allow-scripts allow-forms allow-same-origin'></iframe>
          );
      } else {
        return (
          <div className='ratio16x9'>
            <video poster={ html5.poster } height={ height } width='100%' loop='true' muted='true' controls='true'>
              <source type='video/webm' src={ html5.webm } />
              <source type='video/mp4' src={ html5.mp4 } />
            </video>
          </div>
        );
      }
    } else if (fixedRatio) {
      return (
        <div className='ratio16x9-child' style={ {backgroundImage: 'url('+url+')'} }>
          <PlayIcon/>
        </div>
      );
    } else {
      return (
        <img ref='img' src={ url } className='img-responsive img-preview'/>
      );
    }
  }

  buildOver18() {
    return (
      <a href={ this.props.listing.permalink }>
        <span className='h1 img-responsive img-nsfw text-center vertical-padding text-inverted'>
          XXX
        </span>
      </a>
    );
  }

  buildContent() {
    var listing = this.props.listing;
    if (!listing) {
      return;
    }
    var media = listing.media;
    var permalink = listing.cleanPermalink;
    var over18 = false;

    if ((listing.title.match(/nsf[wl]/gi) || listing.over18) && !this.state.expanded) {
      over18 = true;
    }

    if (media && media.oembed) {
      if (over18) {
        return this.buildOver18();
      }

      if (media.oembed.type === 'rich' || media.oembed.type === 'image') {
        if (this.state.expanded) {
          return (
            <div className='listing-frame'>
              <iframe src={ listing.url } frameBorder='0' height='80%' width='100%' allowFullScreen='' sandbox='allow-scripts allow-forms allow-same-origin'></iframe>
            </div>
          );
        } else {
          return (
            <a href={ permalink }>
              { this.buildImage(media.oembed.thumbnail_url, media.oembed) }
            </a>
          );
        }
      } else if (media.oembed.type === 'video') {
        if (this.state.expanded) {
          return (
            <div className='listing-video ratio16x9' dangerouslySetInnerHTML={{
              __html: listing.expandContent
            }} />
          );
        } else {
          return (
            <a href={ permalink } onClick={ this.expand.bind(this) } className='ratio16x9' data-no-route='true'>
              { this.buildImage(media.oembed.thumbnail_url, media.oembed, true) }
            </a>
          );
        }
      }
    } else if (listing.url.match(imgMatch)) {
      if (over18) {
        return this.buildOver18();
      }

      if (this.state.expanded) {
        return (
          <a href={ listing.url } className='external-image'>
            { this.buildImage(listing.url) }
          </a>
        );
      } else {
        return (
          <a href={ permalink }>
            { this.buildImage(listing.url) }
          </a>
        );
      }
    } else if (listing.selftext) {
      if (this.state.expanded) {
        return (
          <div className='well listing-selftext' dangerouslySetInnerHTML={{
            __html: listing.expandContent
          }} onClick={ this.expand.bind(this) } />
        );
      } else {
        return (
          <div className='well listing-selftext listing-selftext-collapsed' dangerouslySetInnerHTML={{
            __html: listing.expandContent
          }} onClick={ this.expand.bind(this) } />
        );
      }
    } else if (listing.domain.indexOf('self.') === 0) {
      return null;
    } else {

      return null;
    }
  }

  expand(e) {
    e.preventDefault();

    if (this.state.canUnexpand) {
      this.setState({
        expanded: !this.state.expanded,
      });
    }
  }

  render() {
    var props = this.props;
    var listing = props.listing;
    var permalink = listing.cleanPermalink;
    var linkFlair;
    var nsfwFlair;
    var subredditLabel;
    var domain;
    var gilded;
    var distinguished = listing.distinguished ? ' text-distinguished' : '';
    var edited = listing.edited ? '*' : '';
    var linkFlairClass = (listing.link_flair_css_class);
    var listingClass = props.listingClass || '';
    var comment = listing.num_comments < 2 ? 'comment' : 'comments';
    var isSelf;
    var when = short(listing.created_utc * 1000);

    if (!props.hideSubredditLabel) {
      subredditLabel = (
        <li>
          <a href={`/r/${listing.subreddit}`}>
            <span className='listing-subreddit'>
              /r/{ listing.subreddit }
            </span>
          </a>
        </li>
      );
    }

    if (!isSelf) {
      domain = (
        <li>
          { listing.domain }
        </li>
      );
    }

    if (listing.gilded && props.single) {
      gilded = (
        <li><GoldIcon/></li>
      );
    }

    if (listing.link_flair_text) {
      linkFlair = (
        <span className={ 'listing-link-flair label label-primary ' + linkFlairClass }>
          { listing.link_flair_text }
        </span>
      );
    }

    if (listing.title.match(/nsf[wl]/gi) || listing.over18) {
      nsfwFlair = (
        <span className='listing-link-flair label label-danger'>
          NSFW
        </span>
      );
    }
    var app = this.props.app;
    var buildContent = this.buildContent();
    if (buildContent) {
      var stalactite = <div className='stalactite'/>;
    }

    return (
      <article className={'listing ' + listingClass }>
        <div className='panel'>
          <header className={'panel-heading' + (buildContent?' preview':' no-preview') }>
            <div className='row'>
              <div className='col-xs-11'>
                <div className='link-flair-container'>
                  { nsfwFlair }
                  { linkFlair }
                </div>

                <a href={ this.props.titleLink }>
                  <h1 className={ 'panel-title ' + distinguished }>
                    { listing.title } { edited }
                  </h1>
                </a>
              </div>
              <div className='col-xs-1'>
                <ListingDropdown listing={listing} app={app}/>
              </div>
            </div>

            <ul className='linkbar text-muted small'>
              { gilded }
              <li className='linkbar-item-no-seperator'><Vote app={app} thing={ listing } token={ this.props.token } api={ this.props.api }/></li>
              <li className='linkbar-item-no-seperator'>
                <a href={ permalink }>{ `${listing.num_comments} ${comment}` }</a>
              </li>
              { subredditLabel }
              { domain }
              <li>{ when }</li>
            </ul>
            { stalactite }
          </header>

          { buildContent }
        </div>
      </article>
    );
  }
}

function ListingFactory(app) {
  Vote = VoteFactory(app);
  Actions = ActionsFactory(app);
  ListingDropdown = ListingDropdownFactory(app);
  GoldIcon = GoldIconFactory(app);
  PlayIcon = PlayIconFactory(app);

  return app.mutate('core/components/listing', Listing);
}

export default ListingFactory;
