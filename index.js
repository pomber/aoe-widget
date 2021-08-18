const MATCHES_COUNT = 6;

fetchLastGames();

async function fetchLastGames() {
  const urlParams = new URLSearchParams(window.location.search);
  const steamId = urlParams.get("steam_id") || "76561198168845614";

  const url = `https://aoe2.net/api/player/matches?game=aoe2de&steam_id=${steamId}&count=25`;
  const response = await fetch(url);
  const fullMatches = await response.json();
  const individualMatches = fullMatches.filter((m) => m.leaderboard_id === 3);
  const matches = individualMatches.map(function toSmallMatch({
    match_id,
    started,
    finished,
    players
  }) {
    const me = players.find((p) => p.steam_id == steamId);
    const notMe = players.find((p) => p.steam_id != steamId);
    const mapPlayer = ({ name, country, rating, civ, civ_alpha, won }) => ({
      name,
      country,
      rating,
      civ,
      civ_alpha,
      won
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
  document.querySelector("#last-match .title").innerText = finished
    ? "Ultimo partido"
    : "Jugando ahora";
  document.querySelector(
    "#last-match .me"
  ).innerText = `${me.name} (${me.rating}) `;
  document.querySelector(
    "#last-match .opponent"
  ).innerText = `${opponent.name} (${opponent.rating})`;
}

function renderMoreMatches(moreMatches) {
  const parent = document.getElementById("more-matches");
  const template = document.querySelector("#match-template");

  moreMatches.forEach(({ me, finished, opponent }) => {
    const matchElement = template.content.cloneNode(true);
    matchElement.querySelector(".time-ago").innerText = getTimeAgo(finished);
    matchElement.querySelector(".country").src =
      "https://raw.githubusercontent.com/lipis/flag-icon-css/master/flags/1x1/" +
      opponent.country.toLowerCase() +
      ".svg";

    matchElement.querySelector(".result").innerText = me.won
      ? "le ganamos a"
      : "perdimos contra";
    matchElement.querySelector(".opponent").innerText = `${opponent.name} (${
      opponent.rating || "unranked"
    })`;

    parent.appendChild(matchElement);
  });
}

function getTimeAgo(ts) {
  const MINUTE = 60,
    HOUR = MINUTE * 60,
    DAY = HOUR * 24,
    WEEK = DAY * 7,
    MONTH = DAY * 30;

  const secondsAgo = Math.round(+new Date() / 1000 - ts);
  let divisor = null;
  let unit = null;

  if (secondsAgo < MINUTE) {
    return secondsAgo + " segundos";
  } else if (secondsAgo < HOUR) {
    [divisor, unit] = [MINUTE, "minuto"];
  } else if (secondsAgo < DAY) {
    [divisor, unit] = [HOUR, "hora"];
  } else if (secondsAgo < WEEK) {
    [divisor, unit] = [DAY, "dia"];
  } else if (secondsAgo < MONTH) {
    [divisor, unit] = [WEEK, "semana"];
  } else {
    [divisor, unit] = [MONTH, "mes"];
  }

  const count = Math.floor(secondsAgo / divisor);
  return `${count} ${unit}${count > 1 ? "s" : ""}`;
}
