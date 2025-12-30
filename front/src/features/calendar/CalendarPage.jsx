import React, { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  addDays
} from "date-fns";
import { es } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { useGesture } from "@use-gesture/react";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Segmented } from "../../components/ui/Segmented";

function buildMonthGrid(cursor) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}

export function CalendarPage() {
  const [view, setView] = useState("mes");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  const days = useMemo(() => buildMonthGrid(cursor), [cursor]);

  const events = useMemo(() => {
    const base = new Date();
    return [
      { id: "1", title: "Tomar medicamento", start: addDays(base, 0), end: addDays(base, 0), calendarColor: "rgb(var(--brand-1))" },
      { id: "2", title: "Reunión familiar", start: addDays(base, 2), end: addDays(base, 2), calendarColor: "rgb(var(--ok))" },
      { id: "3", title: "Pago de servicio", start: addDays(base, 6), end: addDays(base, 6), calendarColor: "rgb(var(--warn))" }
    ];
  }, []);

  const dayEvents = useMemo(() => events.filter((e) => isSameDay(e.start, selected)), [events, selected]);

  const bind = useGesture(
    {
      onDragEnd: ({ swipe: [swipeX] }) => {
        if (swipeX === -1) setCursor((d) => addMonths(d, 1));
        if (swipeX === 1) setCursor((d) => addMonths(d, -1));
      }
    },
    { drag: { axis: "x", threshold: 25 } }
  );

  const title = format(cursor, "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Agenda"
          subtitle="Toca un día para ver tus eventos. Desliza para cambiar de mes."
          right={
            <Button
              size="md"
              leftIcon={<Plus size={18} />}
              title="Crear evento"
              onClick={() => alert("Aquí abriremos el modal de crear evento (siguiente paso).")}
            >
              Nuevo
            </Button>
          }
        />
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" leftIcon={<ChevronLeft size={18} />} onClick={() => setCursor((d) => addMonths(d, -1))}>
                Atrás
              </Button>
              <Button variant="ghost" leftIcon={<ChevronRight size={18} />} onClick={() => setCursor((d) => addMonths(d, 1))}>
                Siguiente
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="soft"
                leftIcon={<CalIcon size={18} />}
                onClick={() => {
                  const now = new Date();
                  setCursor(now);
                  setSelected(now);
                }}
              >
                Hoy
              </Button>
              <Segmented
                value={view}
                onChange={setView}
                options={[
                  { value: "mes", label: "Mes" },
                  { value: "agenda", label: "Lista" }
                ]}
              />
            </div>
          </div>

          <div className="text-center text-[18px] font-semibold capitalize">{title}</div>

          {view === "mes" ? (
            <div {...bind()} className="select-none">
              <div className="grid grid-cols-7 gap-2 text-center text-[13px] text-white/55">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                  <div key={d} className="py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {days.map((d) => {
                  const inMonth = isSameMonth(d, cursor);
                  const isSel = isSameDay(d, selected);
                  const hasEvent = events.some((e) => isSameDay(e.start, d));
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => setSelected(d)}
                      className={[
                        "min-h-[58px] rounded-[18px] border border-white/10 p-2 text-left",
                        inMonth ? "bg-white/5" : "bg-black/20 opacity-60",
                        isSel ? "border-[rgba(var(--brand-1)/0.9)] bg-white/10" : "hover:bg-white/8"
                      ].join(" ")}
                      aria-label={`Día ${format(d, "d", { locale: es })}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className={inMonth ? "text-white" : "text-white/70"}>
                          <div className="text-[15px] font-semibold">{format(d, "d", { locale: es })}</div>
                        </div>
                        {hasEvent ? <span className="mt-1 h-2 w-2 rounded-full bg-[rgb(var(--brand-1))]" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <AgendaList events={events} onPick={(d) => { setSelected(d); setView("mes"); }} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={format(selected, "EEEE d 'de' MMMM", { locale: es })}
          subtitle={dayEvents.length ? "Tus eventos de este día" : "No tienes eventos aquí. Toca “Nuevo” para crear uno."}
        />
        <CardBody>
          {dayEvents.length ? (
            <div className="space-y-3">
              {dayEvents.map((ev) => (
                <div key={ev.id} className="rounded-[18px] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[18px] font-semibold">{ev.title}</div>
                      <div className="mt-1 text-[14px] text-white/65">
                        {format(ev.start, "p", { locale: es })} – {format(ev.end, "p", { locale: es })}
                      </div>
                    </div>
                    <div className="h-3 w-3 rounded-full" style={{ background: ev.calendarColor }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/60">Nada por ahora 🙂</div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function AgendaList({ events, onPick }) {
  const sorted = useMemo(() => [...events].sort((a, b) => a.start.getTime() - b.start.getTime()), [events]);

  return (
    <div className="space-y-3">
      {sorted.map((ev) => (
        <button
          key={ev.id}
          onClick={() => onPick(ev.start)}
          className="w-full text-left rounded-[18px] border border-white/10 bg-white/6 hover:bg-white/8 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[18px] font-semibold">{ev.title}</div>
              <div className="mt-1 text-[14px] text-white/65">
                {format(ev.start, "EEEE d MMM, p", { locale: es })}
              </div>
            </div>
            <div className="h-3 w-3 rounded-full mt-2" style={{ background: ev.calendarColor }} />
          </div>
        </button>
      ))}
      {!sorted.length ? <div className="text-white/60">Aún no hay eventos.</div> : null}
    </div>
  );
}
