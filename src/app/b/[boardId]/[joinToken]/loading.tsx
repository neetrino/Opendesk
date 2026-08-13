const BOARD_SKELETON_COLUMNS = ["new", "in_progress", "answered", "done"] as const;

export default function BoardLoading() {
  return (
    <section className="board-page" aria-busy="true">
      <div className="board-top">
        <div className="boards-skel boards-skel-title" />
      </div>
      <div className="board-grid">
        {BOARD_SKELETON_COLUMNS.map((status) => (
          <section
            key={status}
            className={`board-column column-${status}`}
          >
            <header className="column-header">
              <div className="boards-skel boards-skel-col" />
            </header>
            <div className="boards-skel boards-skel-tile" />
            <div className="boards-skel boards-skel-tile" />
          </section>
        ))}
      </div>
    </section>
  );
}
