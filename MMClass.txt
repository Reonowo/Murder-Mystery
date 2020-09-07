function onSetRole(murderer, sheriff) {
  temp.acc = player.account;
  
  player.attr[2] = murderer == acc ? "Murderer" : sheriff == acc ? "Sheriff" : "Innocent";
  // player.chat = "I am now a:" SPC player.attr[2];
  // sendrpgmessage("Your role is:" SPC player.attr[2]);

  triggerClient("gui", this.name, "StartRound", "");
}

function onEndRound() {
  player.attr[2] = NULL;
  triggerClient("gui", this.name, "EndRound", "");
}

function eliminatePlayer(acc, reason) {
  temp.plr = findplayer(acc);

  npcs[4].trigger("PlayerEliminated", acc, plr.attr[2], {plr.x, plr.y});

  plr.x = 15;
  plr.y = 15;

  plr.chat = reason;
}

function onActionServerSide(action, args) {
  switch (action) {
    case "CheckHit":
      eliminatePlayer(args[0], "I shot an innocent!");
      break;
    case "Eliminate":
      eliminatePlayer(args[0], args[1]);
      break;
  }
}

//#CLIENTSIDE

function onDestroyGui(guiName) {
  findobject(guiName).destroy();
}

function onActionClientSide(action, args) {
  switch (action) {
    case "StartRound":
      this.roundStarted = true;

      temp.playerRole = player.attr[2];
      temp.roleColor = playerRole == "Murderer" ? "red" : playerRole == "Sheriff" ? "orange" : "green";

      temp.ttA = playerRole == "Innocent" ? "an" : "the";

      this.gId = "PlayerRole" @ int(random(0, 9999));

      new GuiMLTextCtrl(this.gId) {
        profile = TextonScreen;
        // x = screenwidth / 2;
        y = screenheight / 2;
        height = 32;
        width = screenwidth;
        text = "<center><b><font size=32 color=white>You are " @ ttA @ "\n</font><font size=32 color=" @ roleColor @ ">" SPC playerRole @ "</b></font></center>";
      }

      scheduleevent(3, "DestroyGui", this.gId);
      
      break;
    case "EndRound":
      findobject(this.gId).destroy();
      this.roundStarted = false;
      break;
  }
}

function onCreated() {
  player.attr[2] = NULL;
  this.roundStarted = false;
  
  this.shotNumber = 0;
  this.reloading = false;
  this.bulletpos = {{0, -2.3}, {-2, -0.7}, {0, 0.9}, {2, -0.9}};
  
  this.knifeOffset = {{0, 0}, {0, 0.5}, {0, 0}, {0, 0.5}};
  this.knifeRange = 2.5;
  this.knifeThrowing = false;

  this.gId = NULL;
}

function onActionProjectile(gun, acc) {
  switch (gun) {
    case "SheriffShot":
      triggerServer("gui", this.name, "Eliminate", {player.account, "I was shot!"});

      if (player.attr[2] != "Murderer") {
        triggerServer("gui", this.name, "CheckHit", {acc});
      }
      break;
    case "MurdererKnifeThrow":
      triggerServer("gui", this.name, "Eliminate", {player.account, "I took a throwing knife to the face!"});
      break;
  }
}

enum GunStats {
  clip = 6,
  freeze = 0.25,
  spread = 0.020,
  reload = "tb_taurus-sload",
  reloadFreeze = 0.5,
  bullet = "tb_wiw-bullet"
}

enum KnifeStats {
  throw = "tb_knife_throw3",
  thrown = "tb_knife_throw2"
}

function reload() {
  this.reloading = true;
  
  this.shotNumber = 0;
  
  freezeplayer(GunStats.reloadFreeze);
  player.ani = GunStats.reload;
  
  sleep(GunStats.reloadFreeze);
  
  this.reloading = false;
}

function throwMurdererKnife() {
  if (!this.knifeThrowing) {
    this.knifeThrowing = true;
    
    setshootparams("MurdererKnifeThrow", player.account);
    shoot(
      player.x + this.bulletpos[player.dir][0], 
      player.y + this.bulletpos[player.dir][1], 
      0, 
      getangle(vecx(player.dir), vecy(player.dir)) + random(-GunStats.spread, GunStats.spread), 
      0, 
      0, 
      KnifeStats.thrown,
      3
    );

    freezeplayer(GunStats.freeze);
    player.ani = KnifeStats.throw;

    sleep(GunStats.freeze * 3);

    this.knifeThrowing = false;
  }
}

function stabMurdererKnife() {
  freezeplayer(0.2);
  player.ani = "tb_melee_trial_knife-attack";

  // [NtS]: Rework this to be like bulletpos.
  temp.plrdir = player.dir;

  temp.xOffset = plrdir == 1 ? -this.knifeRange + 2 : plrdir == 3 ? this.knifeRange + 0.5 : 0;
  temp.yOffset = plrdir == 0 ? -this.knifeRange : plrdir == 2 ? this.knifeRange + 1 : 0;

  temp.nearest = getnearestplayer(player.x + xOffset, player.y + yOffset + this.knifeOffset[plrdir][1]);
  temp.foundNearest = players[nearest];
  
  if (foundNearest != player) {
    triggerServer("gui", this.name, "Eliminate", {foundNearest.account, "The murderer stabbed me!"});
    // echo("Nearest:" SPC foundNearest SPC random(0, 100));
  }
  
  triggerAction(
    player.x + xOffset,
    player.y + yOffset,
    "Stabbed", 
    ""
  );
}

function shootSheriffGun() {
  if (this.roundStarted && !this.reloading) {
    this.shotNumber++;

    if (this.shotNumber >= GunStats.clip) {
      reload();
      return;
    }

    setshootparams("SheriffShot", player.account);
    shoot(
      player.x + this.bulletpos[player.dir][0], 
      player.y + this.bulletpos[player.dir][1], 
      0, 
      getangle(vecx(player.dir), vecy(player.dir)) + random(-GunStats.spread, GunStats.spread), 
      0, 
      0, 
      GunStats.bullet, 
      3
    );

    freezeplayer(GunStats.freeze);
    player.ani = "tb_taurus-sfire";
  }
}

// [NtS]: Sheriff's weapon can also be picked up, keep in mind.
function onWeaponFired() {
  switch (this.roundStarted ? player.attr[2] : false) {
    case "Murderer":
      stabMurdererKnife();
      break;
    case "Sheriff":
      shootSheriffGun();
      break;
    case "Innocent":
      freezeplayer(0.2);
      break;
  }
}

function onKeyPressed(code, key) {
  if (player.attr[2] == "Murderer" && key == "z") {
    throwMurdererKnife();
  }
}
