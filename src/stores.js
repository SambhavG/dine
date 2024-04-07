import { writable } from 'svelte/store';

export const selectedMeal = writable("Lunch");
export const filters = writable({
  vegan: false,
  vegetarian: false,
  gluten_free: false,
  halal: false,
});