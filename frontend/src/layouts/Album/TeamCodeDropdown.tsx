import { useEffect, useMemo, useRef, useState } from "react";
import type { WorldCupTeam } from "@/types/album";
import styles from "./TeamCodeDropdown.module.scss";

interface TeamCodeDropdownProps {
  teams: WorldCupTeam[];
  selectedTeamCode: string;
  selectedGroup: string;
  onSelect: (teamCode: string) => void;
}

export function TeamCodeDropdown({
  teams,
  selectedTeamCode,
  selectedGroup,
  onSelect,
}: TeamCodeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedTeam = teams.find((team) => team.code === selectedTeamCode);
  const selectedLabel = selectedTeam
    ? `${selectedTeam.code} · ${selectedTeam.name}`
    : selectedGroup === "Todos"
      ? "ALL · Todos los paises"
      : `ALL · Grupo ${selectedGroup}`;

  const filteredTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return teams;

    return teams.filter((team) =>
      team.code.toLowerCase().includes(normalizedQuery) ||
      team.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query, teams]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (teamCode: string) => {
    onSelect(teamCode);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={styles.dropdown} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className={styles.triggerLabel}>Pais</span>
        <strong>{selectedLabel}</strong>
        <span className={styles.chevron}>{open ? "↑" : "↓"}</span>
      </button>

      {open && (
        <div className={styles.menu}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por code..."
            autoFocus
          />

          <div className={styles.options}>
            <button
              type="button"
              className={selectedTeamCode === "Todos" ? styles.optionActive : styles.option}
              onClick={() => handleSelect("Todos")}
            >
              <span>ALL</span>
              <strong>{selectedGroup === "Todos" ? "Todos los paises" : `Grupo ${selectedGroup}`}</strong>
              <small>{teams.length} paises</small>
            </button>

            {filteredTeams.map((team) => (
              <button
                type="button"
                key={team.code}
                className={team.code === selectedTeamCode ? styles.optionActive : styles.option}
                onClick={() => handleSelect(team.code)}
              >
                <span>{team.code}</span>
                <strong>{team.name}</strong>
                <small>G{team.group} · {team.confederation}</small>
              </button>
            ))}

            {filteredTeams.length === 0 && (
              <p className={styles.empty}>No hay paises con ese code.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
