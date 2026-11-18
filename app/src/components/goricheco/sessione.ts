// Lo stato appartiene al runtime JS. Un processo nuovo riparte da zero.
let homeIntroClaimed = false;

export function wasHomeIntroClaimed() {
  return homeIntroClaimed;
}

export function claimHomeIntro() {
  if (homeIntroClaimed) return false;
  homeIntroClaimed = true;
  return true;
}
