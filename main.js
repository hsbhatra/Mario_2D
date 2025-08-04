const PLAYER_SPEED = 200;
const PLAYER_JUMP = 350;

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent: 'game-container',
  backgroundColor: '#5c94fc',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

let player, cursors, wasd, spaceKey, platforms, coins, score = 0, scoreText;
let gameStarted = false;

function preload() {
  // Load player sprite frames
  this.load.image('player_idle', 'assets/player/poses/player_idle.png');
  this.load.image('player_walk1', 'assets/player/poses/player_walk1.png');
  this.load.image('player_walk2', 'assets/player/poses/player_walk2.png');
  this.load.image('player_jump', 'assets/player/poses/player_jump.png');
  // Load zombie sprites
  this.load.image('zombie_idle', 'assets/zombies/poses/zombie_idle.png');
  this.load.image('zombie_walk1', 'assets/zombies/poses/zombie_walk1.png');
  this.load.image('zombie_walk2', 'assets/zombies/poses/zombie_walk2.png');
  this.load.image('zombie_hurt', 'assets/zombies/poses/zombie_hurt.png');
  // Load flag image (corrected path)
  this.load.image('flag', 'assets/others/flag.png');
  this.load.image('cloud', 'assets/others/cloud.png');
  this.load.image('grass', 'assets/others/grass.png');
}

let zombies;

function create() {
  // Create ground/platforms
  platforms = this.physics.add.staticGroup();
  // Ground
  platforms.create(400, 430, 'ground').setScale(2, 0.5).refreshBody();
  // Rearranged and added more platforms
  platforms.create(200, 350, 'ground').setScale(0.5, 0.5).refreshBody();
  platforms.create(600, 350, 'ground').setScale(0.5, 0.5).refreshBody();
  platforms.create(350, 250, 'ground').setScale(0.5, 0.5).refreshBody();
  platforms.create(500, 180, 'ground').setScale(0.5, 0.5).refreshBody();
  platforms.create(700, 250, 'ground').setScale(0.5, 0.5).refreshBody();

  // Create player using the idle image
  player = this.physics.add.sprite(100, 350, 'player_idle');
  player.displayWidth = 32;
  player.displayHeight = 48;
  player.setCollideWorldBounds(true);

  // Collide player with platforms
  this.physics.add.collider(player, platforms);

  // Keyboard controls
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D
  });
  spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  // Generate coin texture ONCE
  const coinGraphics = this.add.graphics();
  coinGraphics.fillStyle(0xffe066, 1);
  coinGraphics.fillCircle(12, 12, 12);
  coinGraphics.generateTexture('coinTexture', 24, 24);
  coinGraphics.destroy();

  // Coins group
  coins = this.physics.add.group();
  // Create coins at various positions
  addCoin(this, 300, 400);
  addCoin(this, 600, 320);
  addCoin(this, 200, 320);
  addCoin(this, 350, 220);
  addCoin(this, 500, 150);
  addCoin(this, 700, 220);

  // Zombies group
  zombies = this.physics.add.group();
  addZombie(this, 500, 400);
  addZombie(this, 250, 320);
  addZombie(this, 600, 320);
  addZombie(this, 350, 220);
  addZombie(this, 700, 220);

  // Score text
  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '24px',
    fill: '#fff',
    fontFamily: 'Arial'
  });
  scoreText.setScrollFactor(0);

  // Collider: player and coins
  this.physics.add.overlap(player, coins, collectCoin, null, this);
  // Collider: player and zombies
  this.physics.add.collider(zombies, platforms);
  this.physics.add.overlap(player, zombies, playerVsZombie, null, this);

  // Add flag at the right side of the map
  flag = this.physics.add.staticSprite(760, 390, 'flag');
  flag.displayWidth = 32;
  flag.displayHeight = 48;

  // Collider: player and flag
  this.physics.add.overlap(player, flag, reachFlag, null, this);

  // Animation state
  player.currentAnim = 'idle';
  player.walkFrame = 0;
  player.walkTimer = 0;

  // Add clouds in the sky
  for (let i = 0; i < 4; i++) {
    const x = 100 + Math.random() * 600;
    const y = 40 + Math.random() * 100;
    this.add.image(x, y, 'cloud').setScale(1.2 + Math.random() * 0.5);
  }
}

function addCoin(scene, x, y) {
  const coin = coins.create(x, y, 'coinTexture');
  coin.body.allowGravity = false;
  coin.setCircle(12);
}

function addZombie(scene, x, y) {
  const zombie = zombies.create(x, y, 'zombie_walk1');
  zombie.displayWidth = 32;
  zombie.displayHeight = 48;
  zombie.setCollideWorldBounds(true);
  zombie.body.velocity.x = -50; // start moving left
  zombie.currentAnim = 'walk1';
  zombie.walkFrame = 0;
  zombie.walkTimer = 0;
  zombie.isAlive = true;
}

function collectCoin(player, coin) {
  coin.disableBody(true, true);
  score += 10;
  scoreText.setText('Score: ' + score);
}

function showStartScreen() {
  document.getElementById('start-screen').style.display = 'flex';
  game.scene.scenes[0].scene.pause();
}
function hideStartScreen() {
  document.getElementById('start-screen').style.display = 'none';
  game.scene.scenes[0].scene.resume();
  gameStarted = true;
  // Set all zombies moving left and facing left
  if (zombies) zombies.children.iterate(z => { if (z && z.isAlive) { z.setVelocityX(-50); z.flipX = true; } });
}

document.addEventListener('DOMContentLoaded', function() {
  const playBtn = document.getElementById('play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', hideStartScreen);
  }
  
  // Add keyboard event listeners for Space and Enter keys
  document.addEventListener('keydown', function(event) {
    // Only trigger if start screen is visible and game hasn't started
    if (document.getElementById('start-screen').style.display !== 'none' && !gameStarted) {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault(); // Prevent default behavior (page scroll for space)
        hideStartScreen();
      }
    }
  });
  
  showStartScreen();
});

function update() {
  if (!gameStarted) {
    // Freeze all movement
    if (player) player.setVelocityX(0);
    if (zombies) zombies.children.iterate(z => { if (z) z.setVelocityX(0); });
    return;
  }
  // Left/right movement
  let moving = false;
  if (cursors.left.isDown || wasd.left.isDown || mobileLeft) {
    player.setVelocityX(-PLAYER_SPEED);
    moving = true;
    player.flipX = true; // face left
  } else if (cursors.right.isDown || wasd.right.isDown || mobileRight) {
    player.setVelocityX(PLAYER_SPEED);
    moving = true;
    player.flipX = false; // face right
  } else {
    player.setVelocityX(0);
  }

  // Jump (only if touching ground)
  if ((Phaser.Input.Keyboard.JustDown(cursors.up) ||
       Phaser.Input.Keyboard.JustDown(wasd.up) ||
       Phaser.Input.Keyboard.JustDown(spaceKey) ||
       mobileJump) && player.body.blocked.down) {
    player.setVelocityY(-PLAYER_JUMP);
    mobileJump = false; // Only jump once per tap
  }

  // Animation logic
  if (!player.body.blocked.down) {
    // In air: jumping
    if (player.currentAnim !== 'jump') {
      player.setTexture('player_jump');
      player.currentAnim = 'jump';
    }
  } else if (moving) {
    // Walking: alternate walk1/walk2
    player.walkTimer += 1;
    if (player.walkTimer > 10) {
      player.walkFrame = 1 - player.walkFrame;
      player.walkTimer = 0;
    }
    const walkTexture = player.walkFrame === 0 ? 'player_walk1' : 'player_walk2';
    if (player.currentAnim !== walkTexture) {
      player.setTexture(walkTexture);
      player.currentAnim = walkTexture;
    }
  } else {
    // Idle
    if (player.currentAnim !== 'idle') {
      player.setTexture('player_idle');
      player.currentAnim = 'idle';
    }
  }

  // Zombie AI: walk back and forth, animate
  zombies.children.iterate(function(zombie) {
    if (!zombie.isAlive) return;
    // Change direction at world bounds
    if (zombie.body.blocked.left) {
      zombie.body.velocity.x = 50;
      zombie.flipX = false;
    } else if (zombie.body.blocked.right) {
      zombie.body.velocity.x = -50;
      zombie.flipX = true;
    }
    // Animate walk
    zombie.walkTimer += 1;
    if (zombie.walkTimer > 20) {
      zombie.walkFrame = 1 - zombie.walkFrame;
      zombie.walkTimer = 0;
    }
    const walkTexture = zombie.walkFrame === 0 ? 'zombie_walk1' : 'zombie_walk2';
    if (zombie.currentAnim !== walkTexture) {
      zombie.setTexture(walkTexture);
      zombie.currentAnim = walkTexture;
    }
  });
}

function playerVsZombie(player, zombie) {
  if (!zombie.isAlive) return;
  // Check if player is falling onto zombie (from above)
  if (player.body.velocity.y > 0 && player.y + player.displayHeight/2 - 5 < zombie.y - zombie.displayHeight/2 + 10) {
    // Defeat zombie
    zombie.setTexture('zombie_hurt');
    zombie.isAlive = false;
    zombie.body.enable = false;
    zombie.setVelocity(0, 0);
    // Bounce player up
    player.setVelocityY(-PLAYER_JUMP/1.5);
    // Remove zombie after short delay
    setTimeout(() => { zombie.destroy(); }, 500);
  } else {
    // Player hit from side: show Game Over and reset
    const msg = player.scene.add.text(400, 200, 'Game Over', {
      fontSize: '40px',
      fill: '#fff',
      fontFamily: 'Arial',
      backgroundColor: '#dc3545',
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      align: 'center'
    });
    msg.setOrigin(0.5);
    player.scene.physics.pause();
    setTimeout(() => { location.reload(); }, 2000);
  }
}

function reachFlag(player, flag) {
  // Show 'Level Completed' message
  const msg = player.scene.add.text(400, 200, 'Level Completed!', {
    fontSize: '40px',
    fill: '#fff',
    fontFamily: 'Arial',
    backgroundColor: '#28a745',
    padding: { left: 20, right: 20, top: 10, bottom: 10 },
    align: 'center'
  });
  msg.setOrigin(0.5);
  // Restart level after 2 seconds
  player.scene.physics.pause();
  setTimeout(() => { location.reload(); }, 2000);
}

// Landscape overlay logic for mobile
function checkLandscapeOverlay() {
  const overlay = document.getElementById('landscape-overlay');
  // Check if on mobile (touch) and in portrait
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
  const isPortrait = window.innerHeight > window.innerWidth;
  if (isMobile && isPortrait) {
    overlay.style.display = 'flex';
  } else {
    overlay.style.display = 'none';
  }
}
window.addEventListener('resize', checkLandscapeOverlay);
window.addEventListener('orientationchange', checkLandscapeOverlay);
document.addEventListener('DOMContentLoaded', checkLandscapeOverlay);

// Show mobile controls if on mobile and in landscape
function checkMobileControls() {
  const controls = document.getElementById('mobile-controls');
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
  const isPortrait = window.innerHeight > window.innerWidth;
  if (isMobile && !isPortrait) {
    controls.style.display = 'flex';
  } else {
    controls.style.display = 'none';
  }
}
window.addEventListener('resize', checkMobileControls);
window.addEventListener('orientationchange', checkMobileControls);
document.addEventListener('DOMContentLoaded', checkMobileControls);

// Mobile button state
let mobileLeft = false, mobileRight = false, mobileJump = false;
function setupMobileButtons() {
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnJump = document.getElementById('btn-jump');
  if (!btnLeft || !btnRight || !btnJump) return;
  // Left
  btnLeft.addEventListener('touchstart', e => { e.preventDefault(); mobileLeft = true; });
  btnLeft.addEventListener('touchend', e => { e.preventDefault(); mobileLeft = false; });
  btnLeft.addEventListener('mousedown', e => { e.preventDefault(); mobileLeft = true; });
  btnLeft.addEventListener('mouseup', e => { e.preventDefault(); mobileLeft = false; });
  btnLeft.addEventListener('mouseleave', e => { e.preventDefault(); mobileLeft = false; });
  // Right
  btnRight.addEventListener('touchstart', e => { e.preventDefault(); mobileRight = true; });
  btnRight.addEventListener('touchend', e => { e.preventDefault(); mobileRight = false; });
  btnRight.addEventListener('mousedown', e => { e.preventDefault(); mobileRight = true; });
  btnRight.addEventListener('mouseup', e => { e.preventDefault(); mobileRight = false; });
  btnRight.addEventListener('mouseleave', e => { e.preventDefault(); mobileRight = false; });
  // Jump
  btnJump.addEventListener('touchstart', e => { e.preventDefault(); mobileJump = true; });
  btnJump.addEventListener('touchend', e => { e.preventDefault(); mobileJump = false; });
  btnJump.addEventListener('mousedown', e => { e.preventDefault(); mobileJump = true; });
  btnJump.addEventListener('mouseup', e => { e.preventDefault(); mobileJump = false; });
  btnJump.addEventListener('mouseleave', e => { e.preventDefault(); mobileJump = false; });
}
document.addEventListener('DOMContentLoaded', setupMobileButtons);

const game = new Phaser.Game(config); 