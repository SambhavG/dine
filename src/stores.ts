import { writable } from 'svelte/store';

export const selectedDayOption = writable<string>('');
export const selectedMeal = writable<string>('Lunch');
export const filters = writable({
  vegan: false,
  vegetarian: false,
  gluten_free: false,
  halal: false
});