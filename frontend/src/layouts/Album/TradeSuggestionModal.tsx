import { useEffect, useState } from "react";
import { albumsService, type TradeSuggestionResponse } from "@backend";
import { worldCupAlbum } from "@/data/worldCupAlbum";
import { CircleSpinner } from "@/components";
import styles from "./TradeSuggestionModal.module.scss";

interface Props {
  albumId: string;
  onClose: () => void;
}

interface ChipGroup {
  label: string;
  codes: string[];
}

function groupCodesByCountry(codes: string[]): ChipGroup[] {
  const codeSet = new Set(codes);
  const groups = new Map<string, ChipGroup>();
  const order: string[] = [];

  for (const sticker of worldCupAlbum.stickers) {
    if (!codeSet.has(sticker.stickerCode)) continue;

    let key: string;
    let label: string;

    if (sticker.stickerCode === "00") {
      key = "00"; label = "Portada";
    } else if (sticker.stickerCode.startsWith("FWX")) {
      key = "FWX"; label = "FWX";
    } else if (sticker.stickerCode.startsWith("FWC")) {
      key = "FWC"; label = "FWC";
    } else if (sticker.teamCode) {
      key = sticker.teamCode; label = sticker.teamCode;
    } else {
      key = sticker.stickerCode.split(" ")[0];
      label = key;
    }

    if (!groups.has(key)) {
      groups.set(key, { label, codes: [] });
      order.push(key);
    }
    groups.get(key)!.codes.push(sticker.stickerCode);
  }

  return order.map(k => groups.get(k)!);
}

const SwapIcon = () => (
  <svg width="16" height="14" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M17 2l4 4-4 4" />
    <path d="M21 14H3M7 10l-4 4 4 4" />
  </svg>
);

export function TradeSuggestionModal({ albumId, onClose }: Props) {
  const [data, setData] = useState<TradeSuggestionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    albumsService.getTradeSuggestion(albumId)
      .then(setData)
      .catch(() => setError("No se pudo cargar la sugerencia de cambio."))
      .finally(() => setLoading(false));
  }, [albumId]);

  const myMissingGroups = data ? groupCodesByCountry(data.missingLoggedUser) : [];
  const theirMissingGroups = data ? groupCodesByCountry(data.missingExchangeUser) : [];

  return (
    <div className={styles.modal} onClick={e => e.stopPropagation()}>
      <div className={styles.header}>
        <h3>Sugerir cambio</h3>
      </div>

      <div className={styles.body}>
        {loading && (
          <div className={styles.loading}>
            <CircleSpinner size={18} /> Calculando intercambios...
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {data && !loading && (
          <>
            {data.suggestedExchange.length === 0 ? (
              <p className={styles.empty}>No hay intercambios posibles entre estos álbumes.</p>
            ) : (
              <div>
                <div className={styles.sectionTitle}>
                  <span>Intercambios sugeridos ({data.suggestedExchange.length})</span>
                  <hr />
                </div>
                <div className={styles.tableWrapper}>
                  <div className={styles.tableHead}>
                    <span>{data.myName}</span>
                    <span>{data.theirName}</span>
                  </div>
                  {data.suggestedExchange.map((ex: { mySticker: string; theirSticker: string }, i: number) => (
                    <div key={i} className={styles.tableRow}>
                      <span className={styles.tableCell}>{ex.mySticker}</span>
                      <span className={styles.arrowCell}><SwapIcon /></span>
                      <span className={styles.tableCell}>{ex.theirSticker}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myMissingGroups.length > 0 && (
              <div className={styles.missingSection}>
                <div className={styles.sectionTitle}>
                  <span>{data!.theirName} tiene ({data!.missingLoggedUser.length}) de más</span>
                  <hr />
                </div>
                {myMissingGroups.map(group => (
                  <div key={group.label} className={styles.countryGroup}>
                    <span className={styles.countryLabel}>{group.label}</span>
                    <div className={styles.countryChips}>
                      {group.codes.map(code => (
                        <span key={code} className={styles.chip}>{code}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {theirMissingGroups.length > 0 && (
              <div className={styles.missingSection}>
                <div className={styles.sectionTitle}>
                  <span>{data!.myName} tiene ({data!.missingExchangeUser.length}) de más</span>
                  <hr />
                </div>
                {theirMissingGroups.map(group => (
                  <div key={group.label} className={styles.countryGroup}>
                    <span className={styles.countryLabel}>{group.label}</span>
                    <div className={styles.countryChips}>
                      {group.codes.map(code => (
                        <span key={code} className={styles.chip}>{code}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
