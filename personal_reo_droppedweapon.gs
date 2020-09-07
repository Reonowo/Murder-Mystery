function onCreated() {
  dontblock();
  drawunderplayer();

  setimg("tb_taurus_icon.png");
  setshape(1, 35, 40);
}

function onPlayerChats() {
  if (player.chat == ":destroy") {
    this.destroy();
  }
}

function onPlayerTouchsMe() {
  if (player.attr[2] == "Innocent") {
    player.attr[2] = "Sheriff";
    this.destroy();
  }
}

public function DestroyGun() {
  this.destroy();
}

//#CLIENTSIDE

function onCreated() {
  dontblock();
  drawunderplayer();

  setimg("tb_taurus_icon.png");
  setshape(1, 35, 40);
}
