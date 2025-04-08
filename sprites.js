
// Game sprites and animation configurations
const sprites = {
  buildings: [
    { src: 'https://cdn.pixabay.com/photo/2013/07/13/12/48/cottage-160367_640.png' },
    { src: 'https://cdn.pixabay.com/photo/2021/08/07/21/17/house-6529416_640.png' }
  ],
  backgrounds: [
    { src: 'HarmonyNation.png' },
    { src: 'https://cdn.pixabay.com/photo/2018/08/14/13/23/ocean-3605547_640.jpg' },
    { src: 'https://cdn.pixabay.com/photo/2017/11/04/21/09/textile-2918844_640.jpg' }
  ],
  resources: {
    food: { src: 'https://cdn.pixabay.com/photo/2013/07/13/01/22/vegetables-155616_640.png', scale: 0.5 },
    wealth: { src: 'coins.png', scale: 0.3 },
    materials: { src: 'https://cdn.pixabay.com/photo/2017/01/31/15/33/diamond-2024122_640.png', scale: 0.5 },
    technology: { src: 'https://cdn.pixabay.com/photo/2016/02/18/07/06/social-1206610_640.png', scale: 0.5 }
  },
  clouds: [
    { src: 'https://cdn.pixabay.com/photo/2013/07/13/13/46/cloud-161677_640.png' },
    { src: 'https://cdn.pixabay.com/photo/2013/07/13/13/46/cloud-161678_640.png' }
  ]
};

class AnimatedSprite {
  constructor(x, y, sprite, speed = 1) {
    this.x = x;
    this.y = y;
    this.sprite = new Image();
    this.sprite.src = sprite.src;
    this.speed = speed;
    this.scale = sprite.scale || 1;
  }

  update() {
    // Override in specific sprite classes
  }

  draw(ctx) {
    if (this.sprite.complete) {
      ctx.drawImage(this.sprite, this.x, this.y);
    }
  }
}

class Cloud extends AnimatedSprite {
  constructor(x, y, sprite) {
    super(x, y, sprite, Math.random() * 0.5 + 0.1);
    this.initialX = x;
  }

  update(canvas) {
    this.x -= this.speed;
    if (this.x + this.sprite.width < 0) {
      this.x = canvas.width;
    }
  }
}

class ResourceIcon extends AnimatedSprite {
  constructor(x, y, sprite) {
    super(x, y, sprite);
    this.bounceHeight = 5;
    this.bounceSpeed = 0.05;
    this.time = Math.random() * Math.PI * 2;
  }

  update() {
    this.time += this.bounceSpeed;
    this.y += Math.sin(this.time) * this.bounceHeight;
  }
}

export { sprites, AnimatedSprite, Cloud, ResourceIcon };
