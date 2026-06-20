import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const maze = [
  '###############',
  '#.............#',
  '#.###.###.###.#',
  '#.#.........#.#',
  '#.#.##.#.##.#.#',
  '#.............#',
  '#.#.#.###.#.#.#',
  '#.............#',
  '#.#.##.#.##.#.#',
  '#.#.........#.#',
  '#.###.###.###.#',
  '#.............#',
  '###############',
];

const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const cellSize = 26;
const canvasWidth = maze[0].length * cellSize;
const canvasHeight = maze.length * cellSize;

function tileKey(point) {
  return `${point.x},${point.y}`;
}

function isWall(point) {
  return maze[point.y]?.[point.x] === '#';
}

function createPellets() {
  const pellets = new Set();

  maze.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      if (tile === '.' && !(x === 1 && y === 1)) {
        pellets.add(`${x},${y}`);
      }
    });
  });

  return pellets;
}

function createGame() {
  return {
    player: { x: 1, y: 1 },
    direction: directions.ArrowRight,
    nextDirection: directions.ArrowRight,
    enemies: [
      { x: 13, y: 1, direction: directions.ArrowLeft, color: '#ff5c8a' },
      { x: 13, y: 11, direction: directions.ArrowUp, color: '#5ce1ff' },
      { x: 1, y: 11, direction: directions.ArrowRight, color: '#b69cff' },
    ],
    pellets: createPellets(),
    score: 0,
    status: 'ready',
  };
}

function move(point, direction) {
  const next = { x: point.x + direction.x, y: point.y + direction.y };
  return isWall(next) ? point : next;
}

function chooseEnemyDirection(enemy) {
  const options = Object.values(directions).filter((direction) => {
    const next = { x: enemy.x + direction.x, y: enemy.y + direction.y };
    const reverse =
      direction.x === -enemy.direction.x && direction.y === -enemy.direction.y;

    return !isWall(next) && !reverse;
  });

  if (options.length === 0) {
    return { x: -enemy.direction.x, y: -enemy.direction.y };
  }

  return options[Math.floor(Math.random() * options.length)];
}

function advanceGame(game) {
  if (game.status !== 'running') {
    return game;
  }

  let direction = game.direction;
  const nextTile = {
    x: game.player.x + game.nextDirection.x,
    y: game.player.y + game.nextDirection.y,
  };

  if (!isWall(nextTile)) {
    direction = game.nextDirection;
  }

  const player = move(game.player, direction);
  const pellets = new Set(game.pellets);
  let score = game.score;
  const key = tileKey(player);

  if (pellets.has(key)) {
    pellets.delete(key);
    score += 10;
  }

  const enemies = game.enemies.map((enemy) => {
    const shouldTurn = Math.random() < 0.34;
    const blocked = move(enemy, enemy.direction) === enemy;
    const enemyDirection =
      shouldTurn || blocked ? chooseEnemyDirection(enemy) : enemy.direction;

    return {
      ...move(enemy, enemyDirection),
      direction: enemyDirection,
      color: enemy.color,
    };
  });

  const caught = enemies.some((enemy) => enemy.x === player.x && enemy.y === player.y);

  return {
    ...game,
    player,
    direction,
    enemies,
    pellets,
    score,
    status: caught ? 'lost' : pellets.size === 0 ? 'won' : 'running',
  };
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawGame(canvas, game) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d');

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = '#070a12';
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  maze.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      const left = x * cellSize;
      const top = y * cellSize;

      if (tile === '#') {
        context.fillStyle = '#162b5f';
        context.fillRect(left + 2, top + 2, cellSize - 4, cellSize - 4);
        context.strokeStyle = '#3058b8';
        context.strokeRect(left + 3, top + 3, cellSize - 6, cellSize - 6);
      } else if (game.pellets.has(`${x},${y}`)) {
        context.fillStyle = '#dbeafe';
        context.beginPath();
        context.arc(left + cellSize / 2, top + cellSize / 2, 3, 0, Math.PI * 2);
        context.fill();
      }
    });
  });

  game.enemies.forEach((enemy) => {
    context.fillStyle = enemy.color;
    drawRoundedRect(
      context,
      enemy.x * cellSize + 5,
      enemy.y * cellSize + 5,
      cellSize - 10,
      cellSize - 10,
      7,
    );
    context.fill();
  });

  const mouthAngle = game.status === 'running' ? 0.28 : 0.08;
  const angle = Math.atan2(game.direction.y, game.direction.x);

  context.fillStyle = '#ffe66d';
  context.beginPath();
  context.moveTo(
    game.player.x * cellSize + cellSize / 2,
    game.player.y * cellSize + cellSize / 2,
  );
  context.arc(
    game.player.x * cellSize + cellSize / 2,
    game.player.y * cellSize + cellSize / 2,
    cellSize / 2 - 4,
    angle + mouthAngle,
    angle + Math.PI * 2 - mouthAngle,
  );
  context.closePath();
  context.fill();
}

function DotRunner() {
  const canvasRef = useRef(null);
  const [game, setGame] = useState(createGame);

  const setDirection = useCallback((direction) => {
    setGame((current) => ({
      ...current,
      nextDirection: direction,
      status: current.status === 'ready' ? 'running' : current.status,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGame(createGame());
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (directions[event.key]) {
        event.preventDefault();
        setDirection(directions[event.key]);
      }

      if (event.key === 'Enter') {
        setGame((current) => ({
          ...current,
          status: current.status === 'ready' ? 'running' : current.status,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDirection]);

  useEffect(() => {
    drawGame(canvasRef.current, game);
  }, [game]);

  useEffect(() => {
    if (game.status !== 'running') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setGame((current) => advanceGame(current));
    }, 190);

    return () => window.clearInterval(timer);
  }, [game.status]);

  const statusText = useMemo(() => {
    if (game.status === 'won') {
      return 'You cleared the lab.';
    }

    if (game.status === 'lost') {
      return 'Caught. Reboot the run.';
    }

    if (game.status === 'running') {
      return 'Collect the dots.';
    }

    return 'Press an arrow key or tap start.';
  }, [game.status]);

  return (
    <section className="game-panel" aria-label="Dot Runner game">
      <div className="game-header">
        <div>
          <p className="game-kicker">Play while you wait</p>
          <h2>Dot Runner</h2>
        </div>
        <div className="score" aria-label={`Score ${game.score}`}>
          {game.score}
        </div>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          aria-label="Dot Runner maze"
        />
        {game.status !== 'running' && (
          <div className="game-overlay">
            <strong>{statusText}</strong>
            <button
              type="button"
              onClick={
                game.status === 'ready'
                  ? () =>
                      setGame((current) => ({
                        ...current,
                        status: 'running',
                      }))
                  : resetGame
              }
            >
              {game.status === 'ready' ? 'Start Game' : 'Play Again'}
            </button>
          </div>
        )}
      </div>

      <p className="game-status">{statusText}</p>

      <div className="mobile-controls" aria-label="Touch controls">
        <button type="button" onClick={() => setDirection(directions.ArrowUp)}>
          Up
        </button>
        <div>
          <button type="button" onClick={() => setDirection(directions.ArrowLeft)}>
            Left
          </button>
          <button type="button" onClick={() => setDirection(directions.ArrowDown)}>
            Down
          </button>
          <button type="button" onClick={() => setDirection(directions.ArrowRight)}>
            Right
          </button>
        </div>
      </div>
    </section>
  );
}


function App() {
return ( <main className="page"> <section className="hero"> <div className="hero-content"> <p className="eyebrow">SAKET LABS</p>

      <h1>
        Your Personal AI Assistant
      </h1>

      <p className="description">
        Running on a Raspberry Pi using local AI models.
        Ask coding questions, brainstorm ideas, learn new topics,
        or simply have a conversation.
      </p>

      <div className="steps">
        <h2>Get Started</h2>

        <ol>
          <li>Open LINE on your phone</li>
          <li>Scan the QR code</li>
          <li>Add the assistant as a friend</li>
          <li>Start chatting</li>
        </ol>
      </div>
    </div>

    <div className="qr-card">
      <div className="status">
        <span className="status-dot" />
        Assistant Online
      </div>

      <img
        src="/line-qr.png"
        alt="LINE QR Code"
        className="qr-image"
      />

      <h3>Scan & Chat</h3>

      <p>
        No signup required.
        <br />
        Just scan and start talking.
      </p>
    </div>
  </section>

  <section className="features">
    <div className="feature">
      <h3>AI Chat</h3>
      <p>Ask questions and get instant answers.</p>
    </div>

    <div className="feature">
      <h3>Coding Help</h3>
      <p>Programming, debugging and architecture guidance.</p>
    </div>

    <div className="feature">
      <h3>Fitness & Health</h3>
      <p>Workout, nutrition and healthy habit guidance.</p>
    </div>

    <div className="feature">
      <h3>Powered Locally</h3>
      <p>Built with NestJS, LangChain, Ollama and Raspberry Pi.</p>
    </div>
  </section>

  <footer className="footer">
    <a
      href="https://github.com/sakkket"
      target="_blank"
      rel="noreferrer"
    >
      GitHub
    </a>

    <a
      href="https://www.linkedin.com/in/sakket-kumar/"
      target="_blank"
      rel="noreferrer"
    >
      LinkedIn
    </a>
  </footer>
</main>

);
}


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
