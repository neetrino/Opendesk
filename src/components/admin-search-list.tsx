"use client";

import { Children, isValidElement, useState, type ReactNode } from "react";

type AdminSearchListProps = {
  label: string;
  placeholder: string;
  empty: string;
  children: ReactNode;
};

export function AdminSearchList({
  label,
  placeholder,
  empty,
  children,
}: AdminSearchListProps) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const items = Children.toArray(children);
  const visible = needle
    ? items.filter((item) => searchText(item).toLowerCase().includes(needle))
    : items;

  return (
    <div className="admin-search-list">
      <label className="admin-search">
        <span className="visually-hidden">{label}</span>
        <input
          type="search"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {visible.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="admin-list">{visible}</ul>
      )}
    </div>
  );
}

function searchText(item: ReactNode): string {
  if (!isValidElement(item)) {
    return "";
  }
  const value = (item.props as { "data-search"?: unknown })["data-search"];
  return typeof value === "string" ? value : "";
}
