"use client";

import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, FormEvent } from "react";

type Position = {
  x: number;
  y: number;
};

type LampPart = {
  id: string;
  src: string;
  label: string;
  width: number;
  snappedWidth: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  mobileWidth?: number;
  mobileSnappedWidth?: number;
  mobileStartX?: number;
  mobileStartY?: number;
  mobileTargetX?: number;
  mobileTargetY?: number;
};

type PartState = {
  position: Position;
  snapped: boolean;
};

type AuditFormState = {
  name: string;
  email: string;
  company: string;
  message: string;
};

const PARTS: LampPart[] = [
  {
    id: "canopy",
    src: "/lamp/parts/canopy.png",
    label: "Florón",
    width: 90,
    snappedWidth: 76,
    startX: 0.18,
    startY: 0.14,
    targetX: 0,
    targetY: -255,
    mobileWidth: 70,
    mobileSnappedWidth: 60,
    mobileStartX: 0.18,
    mobileStartY: 0.13,
    mobileTargetX: 0,
    mobileTargetY: -225,
  },
  {
    id: "upper",
    src: "/lamp/parts/upper-shade.png",
    label: "Pantalla superior",
    width: 120,
    snappedWidth: 105,
    startX: 0.82,
    startY: 0.25,
    targetX: 0,
    targetY: -115,
    mobileWidth: 92,
    mobileSnappedWidth: 82,
    mobileStartX: 0.76,
    mobileStartY: 0.18,
    mobileTargetX: 0,
    mobileTargetY: -125,
  },
  {
    id: "ring",
    src: "/lamp/parts/ring.png",
    label: "Aro central",
    width: 95,
    snappedWidth: 82,
    startX: 0.18,
    startY: 0.50,
    targetX: 0,
    targetY: -5,
    mobileWidth: 74,
    mobileSnappedWidth: 68,
    mobileStartX: 0.22,
    mobileStartY: 0.48,
    mobileTargetX: 0,
    mobileTargetY: -20,
  },
  {
    id: "lower",
    src: "/lamp/parts/lower-shade.png",
    label: "Pantalla inferior",
    width: 215,
    snappedWidth: 160,
    startX: 0.83,
    startY: 0.70,
    targetX: 0,
    targetY: 55,
    mobileWidth: 150,
    mobileSnappedWidth: 128,
    mobileStartX: 0.70,
    mobileStartY: 0.58,
    mobileTargetX: 0,
    mobileTargetY: 85,
  },
  {
    id: "socket",
    src: "/lamp/parts/socket.png",
    label: "Portalámparas",
    width: 44,
    snappedWidth: 38,
    startX: 0.18,
    startY: 0.72,
    targetX: 0,
    targetY: 145,
    mobileWidth: 38,
    mobileSnappedWidth: 34,
    mobileStartX: 0.22,
    mobileStartY: 0.82,
    mobileTargetX: 0,
    mobileTargetY: 205,
  },
];

const SNAP_DISTANCE = 85;
const CONTACT_FORM_ENDPOINT =
  import.meta.env.VITE_CONTACT_FORM_ENDPOINT?.trim();
const AUDIT_INTEREST = "Auditoría digital gratuita";
const AUDIT_SOURCE = "lamp-game-audit";
const COMPACT_BOARD_WIDTH = 460;

const INITIAL_AUDIT_FORM: AuditFormState = {
  name: "",
  email: "",
  company: "",
  message: "",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isCompactBoard(board: HTMLDivElement) {
  return (
    window.innerWidth <= 600 &&
    board.clientWidth <= COMPACT_BOARD_WIDTH
  );
}

function getResponsiveValue(
  board: HTMLDivElement,
  desktopValue: number,
  mobileValue?: number
) {
  if (isCompactBoard(board) && mobileValue !== undefined) {
    return mobileValue;
  }

  return desktopValue;
}

type LampDeconstructedProps = {
  onExploreRandomModel?: () => void;
};

export default function LampDeconstructed({
  onExploreRandomModel,
}: LampDeconstructedProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef<{
    id: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [parts, setParts] = useState<Record<string, PartState>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isAuditFormVisible, setIsAuditFormVisible] =
    useState(false);
  const [auditForm, setAuditForm] =
    useState<AuditFormState>(INITIAL_AUDIT_FORM);
  const [auditStatus, setAuditStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [auditError, setAuditError] = useState("");

  function getTargetPosition(part: LampPart): Position {
    const board = boardRef.current;

    if (!board) {
      return {
        x: 0,
        y: 0,
      };
    }

    return {
      x:
        board.clientWidth / 2 +
        getResponsiveValue(
          board,
          part.targetX,
          part.mobileTargetX
        ),
      y:
        board.clientHeight / 2 +
        getResponsiveValue(
          board,
          part.targetY,
          part.mobileTargetY
        ),
    };
  }

  function getStartingPosition(part: LampPart): Position {
    const board = boardRef.current;

    if (!board) {
      return {
        x: 0,
        y: 0,
      };
    }

    return {
      x:
        board.clientWidth *
        getResponsiveValue(
          board,
          part.startX,
          part.mobileStartX
        ),
      y:
        board.clientHeight *
        getResponsiveValue(
          board,
          part.startY,
          part.mobileStartY
        ),
    };
  }

  function getPartWidth(
    part: LampPart,
    snapped: boolean
  ) {
    const board = boardRef.current;

    if (!board) {
      return snapped ? part.snappedWidth : part.width;
    }

    if (snapped) {
      return getResponsiveValue(
        board,
        part.snappedWidth,
        part.mobileSnappedWidth
      );
    }

    return getResponsiveValue(
      board,
      part.width,
      part.mobileWidth
    );
  }

  function resetGame() {
    const nextState: Record<string, PartState> = {};

    PARTS.forEach((part) => {
      nextState[part.id] = {
        position: getStartingPosition(part),
        snapped: false,
      };
    });

    dragRef.current = null;
    setDraggingId(null);
    setCompleted(false);
    setIsAuditFormVisible(false);
    setAuditForm(INITIAL_AUDIT_FORM);
    setAuditStatus("idle");
    setAuditError("");
    setParts(nextState);
  }

  function handleAuditInputChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setAuditForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (auditStatus === "error") {
      setAuditStatus("idle");
      setAuditError("");
    }
  }

  async function handleAuditSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name = auditForm.name.trim();
    const email = auditForm.email.trim();
    const company = auditForm.company.trim();
    const message = auditForm.message.trim();

    if (!name) {
      setAuditStatus("error");
      setAuditError("Ingresá tu nombre.");
      return;
    }

    if (!email || !isValidEmail(email)) {
      setAuditStatus("error");
      setAuditError("Ingresá un email válido.");
      return;
    }

    if (!message) {
      setAuditStatus("error");
      setAuditError("Contanos brevemente qué necesitás.");
      return;
    }

    if (!CONTACT_FORM_ENDPOINT) {
      console.error(
        "Falta configurar VITE_CONTACT_FORM_ENDPOINT para enviar el formulario de auditoría."
      );
      setAuditStatus("error");
      setAuditError(
        "No está configurado el endpoint de contacto."
      );
      return;
    }

    setAuditStatus("loading");
    setAuditError("");

    try {
      const response = await fetch(CONTACT_FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          company,
          message,
          source: AUDIT_SOURCE,
          interest: AUDIT_INTEREST,
        }),
      });

      if (!response.ok) {
        throw new Error("Formspree request failed");
      }

      setAuditStatus("success");
    } catch {
      setAuditStatus("error");
      setAuditError(
        "No pudimos enviar la solicitud. Probá de nuevo en unos minutos."
      );
    }
  }

  useEffect(() => {
    const board = boardRef.current;

    if (!board) return;

    const frame = requestAnimationFrame(() => {
      const nextState: Record<string, PartState> = {};

      PARTS.forEach((part) => {
        nextState[part.id] = {
          position: getStartingPosition(part),
          snapped: false,
        };
      });

      setParts(nextState);
      setInitialized(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    function handleResize() {
      setParts((current) => {
        const next = { ...current };

        PARTS.forEach((part) => {
          const state = current[part.id];

          if (!state) return;

          next[part.id] = {
            ...state,
            position: state.snapped
              ? getTargetPosition(part)
              : getStartingPosition(part),
          };
        });

        return next;
      });
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [initialized]);

  useEffect(() => {
    if (!initialized) return;

    const allSnapped = PARTS.every(
      (part) => parts[part.id]?.snapped === true
    );

    if (!allSnapped) {
      setCompleted(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setCompleted(true);
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [parts, initialized]);

  function handlePointerDown(
    event: ReactPointerEvent<HTMLImageElement>,
    part: LampPart
  ) {
    const board = boardRef.current;
    const state = parts[part.id];

    if (!board || !state || state.snapped) return;

    event.preventDefault();

    const rect = board.getBoundingClientRect();

    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    dragRef.current = {
      id: part.id,
      pointerId: event.pointerId,
      offsetX: pointerX - state.position.x,
      offsetY: pointerY - state.position.y,
    };

    setDraggingId(part.id);

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(
    event: ReactPointerEvent<HTMLImageElement>
  ) {
    const board = boardRef.current;
    const drag = dragRef.current;

    if (!board || !drag) return;
    if (drag.pointerId !== event.pointerId) return;

    event.preventDefault();

    const rect = board.getBoundingClientRect();

    let x = event.clientX - rect.left - drag.offsetX;
    let y = event.clientY - rect.top - drag.offsetY;

    x = Math.max(
      30,
      Math.min(board.clientWidth - 30, x)
    );

    y = Math.max(
      30,
      Math.min(board.clientHeight - 30, y)
    );

    setParts((current) => ({
      ...current,
      [drag.id]: {
        ...current[drag.id],
        position: {
          x,
          y,
        },
      },
    }));
  }

  function handlePointerUp(
    event: ReactPointerEvent<HTMLImageElement>,
    part: LampPart
  ) {
    const drag = dragRef.current;

    if (!drag || drag.id !== part.id) return;

    const currentState = parts[part.id];

    if (!currentState) return;

    const target = getTargetPosition(part);

    const deltaX = currentState.position.x - target.x;
    const deltaY = currentState.position.y - target.y;

    const distance = Math.sqrt(
      deltaX * deltaX + deltaY * deltaY
    );

    if (distance <= SNAP_DISTANCE) {
      setParts((current) => ({
        ...current,
        [part.id]: {
          position: target,
          snapped: true,
        },
      }));
    }

    dragRef.current = null;
    setDraggingId(null);

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    } catch {}
  }

  const snappedCount = PARTS.filter(
    (part) => parts[part.id]?.snapped
  ).length;

  return (
    <section className="lamp-game">
      <div className="lamp-game__header">
        <div>
          <span className="lamp-game__eyebrow">
            INTERACTIVE PRODUCT
          </span>

          <h2>Armá la lámpara</h2>

          <p>
            Arrastrá cada componente hasta encontrar su posición.
          </p>
        </div>

        <div className="lamp-game__header-actions">
          <div className="lamp-game__counter">
            <strong>{snappedCount}</strong>
            <span>/ {PARTS.length}</span>
          </div>

          <button
            type="button"
            className="lamp-game__reset"
            onClick={resetGame}
          >
            Resetear
          </button>
        </div>
      </div>

      <div
        ref={boardRef}
        className={[
          "lamp-game__board",
          completed
            ? "lamp-game__board--completed"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <img
          src="/lamp/lamp-assembled.png"
          alt=""
          draggable={false}
          className="lamp-game__guide"
        />

        <div className="lamp-game__target">
          <span>ARRASTRÁ LAS PIEZAS</span>
        </div>

        {initialized &&
          PARTS.map((part) => {
            const state = parts[part.id];

            if (!state) return null;

            const isDragging = draggingId === part.id;

            return (
              <img
                key={part.id}
                src={part.src}
                alt={part.label}
                draggable={false}
                onPointerDown={(event) =>
                  handlePointerDown(event, part)
                }
                onPointerMove={handlePointerMove}
                onPointerUp={(event) =>
                  handlePointerUp(event, part)
                }
                onPointerCancel={(event) =>
                  handlePointerUp(event, part)
                }
                className={[
                  "lamp-game__part",
                  isDragging
                    ? "lamp-game__part--dragging"
                    : "",
                  state.snapped
                    ? "lamp-game__part--snapped"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  width: `${
                    getPartWidth(part, state.snapped)
                  }px`,
                  left: `${state.position.x}px`,
                  top: `${state.position.y}px`,
                  zIndex: isDragging
                    ? 50
                    : state.snapped
                      ? 20
                      : 10,
                }}
              />
            );
          })}

        {completed && (
          <div className="lamp-game__success">
            <div
              className={[
                "lamp-game__success-card",
                isAuditFormVisible
                  ? "lamp-game__success-card--audit"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="lamp-game__success-kicker">
                EXPERIENCIA COMPLETADA
              </span>

              <h3>Lámpara armada.</h3>

              <p>
                Desbloqueaste una{" "}
                <strong>
                  auditoría digital gratuita.
                </strong>
              </p>

              {!isAuditFormVisible && (
                <p className="lamp-game__success-description">
                  Analizamos tu producto, web o experiencia
                  digital y te mostramos oportunidades concretas
                  de mejora.
                </p>
              )}

              {!isAuditFormVisible && (
                <div className="lamp-game__success-actions">
                  <button
                    type="button"
                    className="lamp-game__cta"
                    onClick={() =>
                      setIsAuditFormVisible(true)
                    }
                  >
                    Solicitar auditoría gratis
                  </button>

                  <button
                    type="button"
                    className="lamp-game__restart"
                    onClick={resetGame}
                  >
                    Volver a jugar
                  </button>
                </div>
              )}

              {isAuditFormVisible && (
                <div className="lamp-game__audit">
                  {auditStatus === "success" ? (
                    <div
                      className="lamp-game__audit-status"
                      role="status"
                    >
                      <h4>Solicitud recibida</h4>

                      <p>
                        Vamos a revisar tu caso y te
                        contactaremos dentro de las próximas
                        24-48 h.
                      </p>

                      <div className="lamp-game__audit-status-actions">
                        <button
                          type="button"
                          className="lamp-game__secondary-cta lamp-game__secondary-cta--primary"
                          onClick={onExploreRandomModel}
                        >
                          Explorar modelos 3D
                        </button>

                        <button
                          type="button"
                          className="lamp-game__restart"
                          onClick={resetGame}
                        >
                          Volver a jugar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form
                      className="lamp-game__audit-form"
                      onSubmit={handleAuditSubmit}
                    >
                      <input
                        type="hidden"
                        name="source"
                        value={AUDIT_SOURCE}
                      />

                      <input
                        type="hidden"
                        name="interest"
                        value={AUDIT_INTEREST}
                      />

                      <div className="lamp-game__audit-row">
                        <label className="lamp-game__audit-field">
                          <span>Nombre</span>
                          <input
                            type="text"
                            name="name"
                            className="lamp-game__audit-input"
                            value={auditForm.name}
                            onChange={handleAuditInputChange}
                            autoComplete="name"
                            required
                          />
                        </label>

                        <label className="lamp-game__audit-field">
                          <span>Email</span>
                          <input
                            type="email"
                            name="email"
                            className="lamp-game__audit-input"
                            value={auditForm.email}
                            onChange={handleAuditInputChange}
                            autoComplete="email"
                            required
                          />
                        </label>
                      </div>

                      <label className="lamp-game__audit-field">
                        <span>Empresa (opcional)</span>
                        <input
                          type="text"
                          name="company"
                          className="lamp-game__audit-input"
                          value={auditForm.company}
                          onChange={handleAuditInputChange}
                          autoComplete="organization"
                        />
                      </label>

                      <label className="lamp-game__audit-field">
                        <span>Mensaje</span>
                        <textarea
                          name="message"
                          className="lamp-game__audit-textarea"
                          value={auditForm.message}
                          onChange={handleAuditInputChange}
                          rows={3}
                          required
                        />
                      </label>

                      <p className="lamp-game__audit-privacy">
                        Usamos tus datos únicamente para
                        responder esta solicitud.
                      </p>

                      {auditError && (
                        <p
                          className="lamp-game__audit-error"
                          role="alert"
                        >
                          {auditError}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="lamp-game__audit-submit"
                        disabled={auditStatus === "loading"}
                      >
                        {auditStatus === "loading"
                          ? "Enviando..."
                          : "Solicitar auditoría gratis"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!completed && (
        <div className="lamp-game__footer">
          <span>Arrastrá</span>

          <div className="lamp-game__footer-line" />

          <span>Encajá</span>

          <div className="lamp-game__footer-line" />

          <span>Desbloqueá</span>
        </div>
      )}
    </section>
  );
}
