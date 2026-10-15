import { describe, expect, it } from "vitest";
import { easterSunday, resolveTheme, themeForDate } from "../themes";

describe("temas sazonais", () => {
  it("calcula a Páscoa", () => {
    expect(easterSunday(2026).toDateString()).toBe(new Date(2026, 3, 5).toDateString());
    expect(easterSunday(2027).toDateString()).toBe(new Date(2027, 2, 28).toDateString());
  });
  it("datas fixas", () => {
    expect(themeForDate(new Date(2026, 11, 10))).toBe("natal");
    expect(themeForDate(new Date(2026, 11, 25))).toBe("natal");
    expect(themeForDate(new Date(2026, 11, 28))).toBe("ano-novo");
    expect(themeForDate(new Date(2027, 0, 3))).toBe("ano-novo");
    expect(themeForDate(new Date(2026, 10, 27))).toBe("black-friday");
    expect(themeForDate(new Date(2026, 5, 10))).toBe("namorados");
  });
  it("datas móveis", () => {
    expect(themeForDate(new Date(2026, 3, 1))).toBe("pascoa");
    expect(themeForDate(new Date(2026, 4, 5))).toBe("dia-das-maes"); // domingo 10/05/2026
    expect(themeForDate(new Date(2026, 7, 5))).toBe("dia-dos-pais"); // domingo 09/08/2026
  });
  it("fora de data comemorativa fica no padrão", () => {
    expect(themeForDate(new Date(2026, 8, 15))).toBe("padrao");
    expect(themeForDate(new Date(2026, 9, 14))).toBe("padrao");
  });
  it("escolha manual vale sempre; valor inválido vira padrão", () => {
    expect(resolveTheme("natal", new Date(2026, 6, 1))).toBe("natal");
    expect(resolveTheme("auto", new Date(2026, 11, 10))).toBe("natal");
    expect(resolveTheme("xyz")).toBe("padrao");
    expect(resolveTheme(null)).toBe("padrao");
  });
});
