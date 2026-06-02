export default function Home() {
  const beginner = [
    "  1        ",
    "  1 2      ",
    "1 1 1 1    ",
    "1 2 2 1    ",
    "1 1 1 1 1 1",
    "  1     3  ",
    "  1 1 1 1 1",
  ];

  const intermediate = [
    "1 1 1 1 1",
    "1 3 2 2 1",
    "  1 3 1  ",
    "2 1 2 1 1",
    "1 2 1    ",
  ];

  const expert = [
    "1 1 2 2 3 1 3 1 2 2",
    "  1 1 2 2 3 1 1 2  ",
    "3 1   1 2 3 3 1    ",
    "1   4 2 3 4 3 4 2 1",
    "1 1 3   1 2 1 3    ",
    "3 1 2 1 4 2 3 4 3 3",
  ];

  return (
    <>
      <h2 className="fw-bold mb-4">MiniChess.io</h2>
      <h4 className="fw-bold mb-3">Start new game</h4>

      <div className="row g-3 mb-4">
        {/* Beginner */}
        <div className="col-12 col-sm-4">
          <div className="game-card">
            <span className="game-card-title beginner">Beginner</span>
            <div className="win95-panel">
              <div className="win95-header">
                <span className="counter-display">003</span>
                <span className="smiley">🙂</span>
                <span className="counter-display">009</span>
              </div>
              <div className="board-display">{beginner.join("\n")}</div>
            </div>
          </div>
        </div>

        {/* Intermediate */}
        <div className="col-12 col-sm-4">
          <div className="game-card">
            <span className="game-card-title intermediate">Intermediate</span>
            <div className="win95-panel">
              <div className="win95-header">
                <span className="counter-display">032</span>
                <span className="smiley">🙂</span>
                <span className="counter-display">016</span>
              </div>
              <div className="board-display">{intermediate.join("\n")}</div>
            </div>
          </div>
        </div>

        {/* Expert */}
        <div className="col-12 col-sm-4">
          <div className="game-card">
            <span className="game-card-title expert">Expert</span>
            <div className="win95-panel">
              <div className="win95-header">
                <span className="counter-display">076</span>
                <span className="smiley">🙂</span>
                <span className="counter-display">040</span>
              </div>
              <div className="board-display">{expert.join("\n")}</div>
            </div>
          </div>
        </div>
      </div>

      <h4 className="fw-bold mb-2">Rules</h4>
      <p className="text-secondary" style={{ maxWidth: 720 }}>
        Minesweeper rules are very simple. The board is divided into cells, with mines randomly
        distributed. To win, you need to open all the cells. The number on a cell shows the number
        of mines adjacent to it. Using this information, you can determine cells that are safe, and
        cells that contain mines. Cells suspected of being mines can be marked with a flag using the
        right mouse button.
      </p>
      <p className="text-secondary">
        Read more:{" "}
        <a href="#" className="me-2">📋 Gameplay</a>
        <a href="#" className="me-2">📋 Patterns</a>
        <a href="#">📋 Efficiency</a>
      </p>
    </>
  );
}
