import {
  normalizeSignupEmail,
  validSignupEmail,
  validSignupName,
  validSignupPassword,
  signupPasswordFits,
} from "./signupValidation";

test("email boundaries count Unicode code points after normalization", () => {
  for (const length of [160, 161, 255]) expect(validSignupEmail("a".repeat(length - 5) + "@b.co")).toBe(true);
  expect(validSignupEmail("a".repeat(251) + "@b.co")).toBe(false);
  expect(validSignupEmail("é".repeat(125) + "@b.co")).toBe(true);
  expect(validSignupEmail("é".repeat(126) + "@b.co")).toBe(false);
  expect(validSignupEmail("😀".repeat(250) + "@b.co")).toBe(true);
  expect(normalizeSignupEmail("\u0085ΟΣİ@Example.com\u00A0")).toBe("οσi̇@example.com");
  for (const email of ["", "a@b", "a@@b.co", "a b@c.co", "a@.co", "a@b.", "a\u0085b@example.com"])
    expect(validSignupEmail(email)).toBe(false);
});

test("name storage uses trimmed code points", () => {
  expect(validSignupName("  ")).toBe(false);
  expect(validSignupName("😀".repeat(255))).toBe(true);
  expect(validSignupName("😀".repeat(256))).toBe(false);
});

test("password rules preserve UTF-16 minimum, complexity, and UTF-8 byte bounds", () => {
  for (const password of ["ShortPass1", "alllowercase1", "ALLUPPERCASE1", "WithoutNumbers"])
    expect(validSignupPassword(password)).toBe(false);
  expect(validSignupPassword("Aa1" + "😀".repeat(5))).toBe(true);
  expect(validSignupPassword("Aa1" + "😀".repeat(4))).toBe(false);
  for (const password of ["Aa1" + "a".repeat(69), "Aa1a" + "😀".repeat(17)]) {
    expect(validSignupPassword(password)).toBe(true);
    expect(signupPasswordFits(password + "a")).toBe(false);
  }
});
