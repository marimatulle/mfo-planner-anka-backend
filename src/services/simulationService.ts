import { Event } from "@prisma/client";

export function simulateWealthCurve(
  initialValue: number,
  events: Event[],
  rate: number = 0.04
): { year: number; projectedValue: number }[] {
  const monthlyRate = Math.pow(1 + rate, 1 / 12) - 1;
  const startYear = new Date().getFullYear();
  const endYear = 2060;
  const totalYears = endYear - startYear + 1;

  let currentValue = initialValue;

  return Array.from({ length: totalYears }, (_, yearIndex) => {
    const year = startYear + yearIndex;

    currentValue = Array.from({ length: 12 }, (_, month) => month).reduce(
      (valueAcc, month) => {
        const currentDate = new Date(year, month, 1);

        events.forEach((event) => {
          if (!event.startDate) return;
          const eventDate = new Date(event.startDate);

          const shouldApply =
            (event.frequency === "ONCE" &&
              isSameMonth(currentDate, eventDate)) ||
            (event.frequency === "MONTHLY" && currentDate >= eventDate) ||
            (event.frequency === "ANNUAL" &&
              currentDate.getMonth() === eventDate.getMonth() &&
              currentDate >= eventDate);

          if (shouldApply) {
            valueAcc += event.value;
          }
        });

        return valueAcc * (1 + monthlyRate);
      },
      currentValue
    );

    return {
      year,
      projectedValue: Number(currentValue.toFixed(2)),
    };
  });
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
