
export function initConfettiAnimation(buttonId, canvasId) {
  const button = document.getElementById(buttonId);
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [
    { front: "#7b5cff", back: "#6245e0" },
    { front: "#b3c7ff", back: "#8fa5e5" },
    { front: "#5c86ff", back: "#345dd1" }
  ];

  let confetti = [];
  let sequins = [];

  const gravityConfetti = 0.3;
  const gravitySequins = 0.55;
  const dragConfetti = 0.075;
  const dragSequins = 0.02;
  const terminalVelocity = 3;

  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function initConfettoVelocity(xRange, yRange) {
    const x = randomRange(xRange[0], xRange[1]);
    const range = yRange[1] - yRange[0] + 1;
    let y = yRange[1] - Math.abs(randomRange(0, range) + randomRange(0, range) - range);
    if (y >= yRange[1] - 1) {
      y += Math.random() < 0.25 ? randomRange(1, 3) : 0;
    }
    return { x: x, y: -y };
  }

  function Confetto() {
    this.color = colors[Math.floor(randomRange(0, colors.length))];
    this.dimensions = {
      x: randomRange(5, 9),
      y: randomRange(8, 15),
    };
    this.position = {
      x: randomRange(canvas.width / 2 - 50, canvas.width / 2 + 50),
      y: randomRange(canvas.height / 2 - 50, canvas.height / 2 + 50),
    };
    this.rotation = randomRange(0, 2 * Math.PI);
    this.scale = { x: 1, y: 1 };
    this.velocity = initConfettoVelocity([-9, 9], [6, 11]);
  }

  Confetto.prototype.update = function () {
    this.velocity.x -= this.velocity.x * dragConfetti;
    this.velocity.y = Math.min(this.velocity.y + gravityConfetti, terminalVelocity);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.scale.y = Math.cos(this.position.y * 0.09);
  };

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confetti.forEach((c, i) => {
      ctx.translate(c.position.x, c.position.y);
      ctx.rotate(c.rotation);
      c.update();
      ctx.fillStyle = c.scale.y > 0 ? c.color.front : c.color.back;
      ctx.fillRect(-c.dimensions.x / 2, -c.dimensions.y / 2, c.dimensions.x, c.dimensions.y);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (c.position.y >= canvas.height) confetti.splice(i, 1);
    });

    window.requestAnimationFrame(render);
  }

  function burst() {
    for (let i = 0; i < 20; i++) {
      confetti.push(new Confetto());
    }
    render();
  }

  button?.addEventListener("click", () => {
    setTimeout(() => burst(), 1000);
  });

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}
