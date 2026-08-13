export default function BoardsLoading() {
  return (
    <section className="boards-page" aria-busy="true">
      <div className="boards-page-top">
        <div>
          <div className="boards-skel boards-skel-eyebrow" />
          <div className="boards-skel boards-skel-title" />
          <div className="boards-skel boards-skel-lede" />
        </div>
      </div>

      <div className="boards-page-grid">
        <ul className="boards-list">
          <li className="boards-list-item boards-skel boards-skel-card" />
          <li className="boards-list-item boards-skel boards-skel-card" />
        </ul>
        <div className="create-form boards-skel boards-skel-form" />
      </div>
    </section>
  );
}
