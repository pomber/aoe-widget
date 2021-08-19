const MATCHES_COUNT = 6;
const urlParams = new URLSearchParams(window.location.search);
const steamId = urlParams.get("steam_id") || "76561198168845614";

function refetch() {
  fetchLastGames().then(() => {
    window.setTimeout(refetch, 30 * 1000);
  });
}

refetch();

async function fetchLastGames() {
  const url = `https://aoe2.net/api/player/matches?game=aoe2de&steam_id=${steamId}&count=25`;
  const response = await fetch(url);
  const fullMatches = await response.json();
  const individualMatches = fullMatches.filter(
    (m) => m.leaderboard_id === 3 || m.leaderboard_id === 13
  );
  const matches = individualMatches.map(function toSmallMatch({
    match_id,
    started,
    finished,
    players
  }) {
    const me = players.find((p) => p.steam_id == steamId);
    const notMe = players.find((p) => p.steam_id != steamId);
    const mapPlayer = ({
      name,
      country,
      rating,
      civ,
      civ_alpha,
      won,
      rating_change
    }) => ({
      name,
      country,
      rating,
      civ,
      civ_alpha,
      won,
      rating_change
    });
    return {
      match_id,
      started,
      finished,
      me: mapPlayer(me),
      opponent: mapPlayer(notMe)
    };
  });

  const [lastMatch, ...moreMatches] = matches.slice(0, MATCHES_COUNT);
  renderLastMatch(lastMatch);
  renderMoreMatches(moreMatches);
}

function renderLastMatch({ finished, me, opponent }) {
  q("#last-match").classList.remove(`win`);
  q("#last-match").classList.remove(`loss`);
  if (finished && me.won != null) {
    q("#last-match").classList.add(me.won ? `win` : `loss`);
  }
  q("#last-match .title").innerText = finished
    ? "Ultimo resultado"
    : "Jugando ahora";

  q("#last-match .me .name").innerText = me.name;
  q("#last-match .me .country").src = countryUrl(me.country);
  q("#last-match .me .elo").innerText = me.rating + " ELO";
  q("#last-match .me .civ").src = civUrl(me.civ, true);

  q("#last-match .opponent .name").innerText = opponent.name;
  q("#last-match .opponent .country").src = countryUrl(opponent.country);
  q("#last-match .opponent .elo").innerText = opponent.rating + " ELO";
  q("#last-match .opponent .civ").src = civUrl(opponent.civ, false);
}

function renderMoreMatches(moreMatches) {
  const parent = q("#more-matches .content");
  const template = q("#match-template");

  parent.innerHTML = "";

  moreMatches.forEach(({ me, finished, opponent }) => {
    const matchElement = template.content.cloneNode(true);
    matchElement.querySelector(".result-img").src = me.won
      ? "./img/winner.png"
      : "./img/defeated.png";
    matchElement.querySelector(".time-ago").innerText = getTimeAgo(finished);
    matchElement.querySelector(".country").src = countryUrl(opponent.country);
    const change = !me.rating_change
      ? ""
      : me.rating_change > 0
      ? " +" + me.rating_change
      : " " + me.rating_change;
    matchElement.querySelector(".result").innerText = me.won
      ? `ganamos${change}`
      : `perdimos${change}`;
    matchElement
      .querySelector(".result")
      .classList.add(me.won ? `win` : `loss`);
    matchElement.querySelector(".elo").innerText = opponent.rating;
    matchElement.querySelector(".opponent").innerText = opponent.name;

    parent.appendChild(matchElement);
  });
}

function q(selector) {
  return document.querySelector(selector);
}

function countryUrl(country) {
  return (
    "https://raw.githubusercontent.com/lipis/flag-icon-css/master/flags/1x1/" +
    country.toLowerCase() +
    ".svg"
  );
}

function getTimeAgo(ts) {
  const MINUTE = 60,
    HOUR = MINUTE * 60,
    DAY = HOUR * 24,
    WEEK = DAY * 7,
    MONTH = DAY * 30;

  const now = new Date();
  const secondsAgo = Math.round(
    now.getTime() / 1000 - now.getTimezoneOffset() * 60 - ts
  );
  let divisor = null;
  let unit = null;

  if (secondsAgo < MINUTE) {
    return secondsAgo + " seg";
  } else if (secondsAgo < HOUR) {
    [divisor, unit] = [MINUTE, "min"];
  } else if (secondsAgo < DAY) {
    [divisor, unit] = [HOUR, "hora"];
  } else if (secondsAgo) {
    [divisor, unit] = [DAY, "dia"];
  }

  const count = Math.floor(secondsAgo / divisor);
  return `${count} ${unit}${count > 1 ? "s" : ""}`;
}

const civs = [
  "unknown",
  "britons",
  "franks",
  "goths",
  "teutons",
  "japanese",
  "chinese",
  "byzantines",
  "persians",
  "saracens",
  "turks",
  "vikings",
  "mongols",
  "celts",
  "spanish",
  "aztecs",
  "mayans",
  "huns",
  "koreans",
  "italians",
  "indians",
  "incas",
  "magyars",
  "slavs",
  "portuguese",
  "ethiopians",
  "malians",
  "berbers",
  "khmer",
  "malay",
  "burmese",
  "vietnamese",
  "bulgarians",
  "tatars",
  "cumans",
  "lithuanians",
  "burgundians",
  "sicilians",
  "poles",
  "bohemians"
];

function civUrl(civId, itsMe) {
  const civName = civs[civId];
  return `https://overlays.polskafan.de/rating/img/civs/${
    itsMe ? "left" : "right"
  }/${civName}-DE.png`;
}

function ellipsis(name, limit) {
  if (name.length > limit) {
    return name.slice(0, limit - 3) + "...";
  } else {
    return name;
  }
}
