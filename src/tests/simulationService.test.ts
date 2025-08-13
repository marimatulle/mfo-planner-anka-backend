import { simulateWealthCurve } from "../services/simulationService";
import type { Event } from "@prisma/client";

describe("simulateWealthCurve", () => {
  const baseYear = new Date().getFullYear();

  it("deve calcular a curva de riqueza sem eventos", () => {
    const initialValue = 1000;
    const events: Event[] = [];
    const rate = 0.12;

    const curve = simulateWealthCurve(initialValue, events, rate);

    expect(curve[0].year).toBe(baseYear);
    expect(curve[0].projectedValue).toBeGreaterThan(initialValue);
    expect(curve[curve.length - 1].year).toBe(2060);
  });

  it("deve aplicar eventos ONCE apenas no mês correto", () => {
    const initialValue = 1000;
    const events: Event[] = [
      {
        id: 1,
        clientId: 1,
        type: "Investimento",
        value: 500,
        frequency: "ONCE",
        startDate: new Date(baseYear, 0, 1),
      },
    ];

    const curve = simulateWealthCurve(initialValue, events, 0);

    expect(curve[0].projectedValue).toBe(initialValue + 500);
    expect(curve[1].projectedValue).toBe(initialValue + 500);
  });

  it("deve aplicar eventos MONTHLY a partir da data inicial", () => {
    const initialValue = 1000;
    const events: Event[] = [
      {
        id: 1,
        clientId: 1,
        type: "Investimento",
        value: 100,
        frequency: "MONTHLY",
        startDate: new Date(baseYear, 0, 1),
      },
    ];

    const curve = simulateWealthCurve(initialValue, events, 0);

    expect(curve[0].projectedValue).toBeGreaterThan(initialValue);
  });

  it("deve aplicar eventos ANNUAL apenas no mesmo mês a cada ano", () => {
    const initialValue = 1000;
    const events: Event[] = [
      {
        id: 1,
        clientId: 1,
        type: "Bônus anual",
        value: 200,
        frequency: "ANNUAL",
        startDate: new Date(baseYear, 5, 1), 
      },
    ];

    const curve = simulateWealthCurve(initialValue, events, 0);

    const firstYearJuneValue = curve[0].projectedValue;
    expect(firstYearJuneValue).toBeGreaterThan(initialValue);
  });
});
