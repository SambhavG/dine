import { writable } from 'svelte/store';

export const selectedMeal = writable("Breakfast");
export const filters = writable({
  vegan: false,
  vegetarian: false,
  gluten_free: false,
  halal: false,
});