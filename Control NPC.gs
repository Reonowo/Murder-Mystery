function formatArray(pArray) {
  temp.actualArray = pArray[0];
  if (!actualArray.size()) return "{}";

  temp.nString = "";

  for (temp.entry : actualArray) {
    nString = nString TAB entry @ ",\n";
  }

  nString = nString.substring(0, nString.length() - 2);

  return "{" NL nString NL "}";
}

function getRandomAvailablePlayer() {
  temp.availableLength = arraylen(this.availablePlayers);
  if (availableLength == 1) return this.availablePlayers[0];


  temp.randomIndex = int(random(0, (availableLength)));
  echo("\n" @ randomIndex);

  temp.randomPlayer = this.availablePlayers[randomIndex];
  this.availablePlayers.remove(randomPlayer);

  return randomPlayer;
}

function roundStart() {
  this.chat = "";

  if (this.roundStarted) {
    roundStop();
  }

  this.roundStarted = true;

  for (temp.plr : allplayers) {
    if (plr.level == this.level) {
      // Check for AP 100 later to exclude Events Team
      this.playersInsideLevel.add(plr.account);

      plr.x = random(8, 56);
      plr.y = random(8, 56);
    }
  }

  this.availablePlayers = this.playersInsideLevel;

  temp.murderer = getRandomAvailablePlayer();
  temp.sheriff = getRandomAvailablePlayer();

  for (temp.aPlr : this.playersInsideLevel) {
    with (findplayer(aPlr)) {
      ("Public/Reo/MMClass").trigger("SetRole", murderer, sheriff);
    }
  }

  // echo("Murderer:" SPC murderer NL "Sheriff:" SPC sheriff NL "Innocents:" SPC formatArray({this.availablePlayers}));
}

function roundStop() {
  for (temp.npc : npcs) {
    if (npc.id == this.droppedGunID) {
      npc.destroy();
      break;
    }
  }

  this.roundStarted = false;
  this.eliminatedCount = 0;

  this.droppedGunID = NULL;

  for (temp.aPlr : this.playersInsideLevel) {
    with (findplayer(aPlr)) {
      ("Public/Reo/MMClass").trigger("EndRound");
    }
  }

  this.playersInsideLevel = {};
  this.availablePlayers = {};
}

function endRound(reason) {

  if (!this.roundStarted) {
    this.chat = "Round has not been started!";
    return;
  }

  this.chat = reason;

  roundStop();

  for (temp.plr : players) {
    plr.x = 30.5;
    plr.y = 30;

    plr.chat = "Round ended!";
  }
}

function onCreated() {
  dontblock();
  setshape(1, 100, 100);

  this.droppedGunID = NULL;

  this.playersInsideLevel = {};
  this.availablePlayers = {};

  this.eliminatedCount = 0;

  this.roundStarted = false;
  this.chat = this.id;
}

function onActionFireServer(action, args) {
  switch (action) {
    case "start":
      roundStart();
      break;
    case "stop":
      roundStop();
      break;
    case "end":
      endRound("Ended by staff!");
      break;
  }
}

function onPlayerEnters() {
  player.addweapon("Public/Reo/MMClass");
}

function onPlayerLeaves() {
  player.removeweapon("Public/Reo/MMClass");
  this.playersInsideLevel.remove(player.account);
}

function dropSheriffGun(acc, xPos, yPos) {
  temp.plr = findplayer(acc);

  if (plr.level == this.level) {
    temp.droppedGun = putnpc2(xPos, yPos, "");
    droppedGun.join("personal_reo_droppedweapon");

    this.droppedGunID = droppedGun.id;
  }

  this.chat = "*drops the gun*";
}

function onPlayerEliminated(acc, role, pos) {
  temp.plr = findplayer(acc);
  plr.attr[2] = "";

  this.eliminatedCount++;

  if (this.eliminatedCount == players.size() - 1) {
    endRound("Murderer wins!");

    return;
  }

  switch (role) {
    case "Innocent":
      this.chat = "Eliminated" SPC acc SPC "with role" SPC role;
      break;
    case "Sheriff":
      dropSheriffGun(acc, pos[0], pos[1]);
      break;
    case "Murderer":
      endRound("The murderer has been killed!");
      break;
  }
}

//#CLIENTSIDE

function onPlayerChats() {
  if (player.ap == 100 && player.chat.starts(":")) {
    temp.tokens = player.chat.substring(1).tokenize(" ");
    temp.action = tokens[0];

    tokens.remove(action);

    // echo("Sending action" SPC action SPC "with arguments:" SPC tokens);
    triggerAction(this.x+1.5, this.y+1.5, "FireServer", action, tokens);
  }
}
