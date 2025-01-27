import { writable } from "svelte/store";

export const selectedMeal = writable("Lunch");
export const selectedDayOption = writable("2025-01-28");
export const filters = writable({
  vegan: false,
  vegetarian: false,
  gluten_free: false,
  halal: false,
});
