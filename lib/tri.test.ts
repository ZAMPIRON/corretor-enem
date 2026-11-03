import { test } from "node:test";
import assert from "node:assert/strict";
import { corrigir, estimarTheta, notaTRI, probAcerto, type Item } from "./tri.ts";

const itens: Item[] = Array.from({ length: 45 }, (_, i) => ({ a: 1.5, b: -2 + (4 * i) / 44, c: 0.2 }));

test("probabilidade fica entre c e 1", () => {
  assert.ok(probAcerto(itens[0], -10) >= 0.2);
  assert.ok(probAcerto(itens[0], 10) <= 1);
});

test("mais acertos dão nota maior", () => {
  const poucos = itens.map((_, i) => i < 10);
  const muitos = itens.map((_, i) => i < 35);
  assert.ok(notaTRI(itens, muitos) > notaTRI(itens, poucos));
});

test("coerência: acertar as fáceis vale mais que acertar as difíceis", () => {
  const faceis = itens.map((_, i) => i < 20);
  const dificeis = itens.map((_, i) => i >= 25);
  assert.ok(notaTRI(itens, faceis) > notaTRI(itens, dificeis));
});

test("erro padrão é positivo", () => {
  assert.ok(estimarTheta(itens, itens.map(() => true)).erroPadrao > 0);
});

test("corrigir compara com o gabarito", () => {
  assert.deepEqual(corrigir("AB.D", "ABCD"), [true, true, false, true]);
});
