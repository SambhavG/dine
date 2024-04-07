<script lang="ts">
  import { onMount } from "svelte";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as Popover from "$lib/components/ui/popover";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { ToggleGroup } from "bits-ui";

  import { base } from "$app/paths";

  import { selectedMeal, filters } from "../stores.js";
  import Switch from "$lib/components/ui/switch/switch.svelte";
  import * as Table from "$lib/components/ui/table";
  import { Info } from "lucide-svelte";

  //Query https://general-backend-db.onrender.com/polls
  let data = {};
  let dhalls = [];
  let meals = [];

  let dhallToLetter = {
    Wilbur: "W",
    Stern: "S",
    GerhardCasper: "C",
    EVGR: "E",
    Arrillaga: "A",
    Branner: "B",
    FlorenceMoore: "F",
    Lakeside: "L",
    Ricker: "R",
  };

  let dhallToName = {
    Wilbur: "Wilbur",
    Stern: "Stern",
    GerhardCasper: "Casper",
    EVGR: "EVGR",
    Arrillaga: "Arrillaga",
    Branner: "Branner",
    FlorenceMoore: "Flomo",
    Lakeside: "Lakeside",
    Ricker: "Ricker",
  };

  async function getData() {
    const response = await fetch("https://general-backend-db.onrender.com/polls");
    let result = await response.text();
    data = JSON.parse(result);
    refresh();
  }

  function meetsFilters(food) {
    return Object.keys($filters).every((filter) => {
      return !$filters[filter] || food[filter];
    });
  }

  let mealFoods = {};

  function processData(foodData) {
    dhalls = Object.keys(foodData);
    dhalls = dhalls.filter((dhall) => dhall !== "meta");
    meals = Object.keys(foodData[dhalls[0]]);

    mealFoods = {};

    meals.forEach((meal) => {
      let foods = [];
      dhalls.forEach((dhall) => {
        Object.values(foodData[dhall][meal]).forEach((foodObj) => {
          if (!foods.some((f) => f.name === foodObj.name) && meetsFilters(foodObj)) {
            foods.push(foodObj);
          }
        });
      });

      foods.forEach((food) => {
        food.dhalls = [];
        dhalls.forEach((dhall) => {
          if (Object.values(foodData[dhall][meal]).some((f) => f.name === food.name)) {
            food.dhalls.push(dhall);
          }
        });
      });

      mealFoods[meal] = foods;
    });
  }

  function sortByDhFrequency() {
    //For each meal, sort the foods by the number of dhalls they are served at
    Object.keys(mealFoods).forEach((meal) => {
      mealFoods[meal].sort((a, b) => {
        if (a.dhalls.length - b.dhalls.length != 0) {
          return a.dhalls.length - b.dhalls.length;
        } else {
          //Sort by whichever has the earliest dhall
          for (let i = 0; i < dhalls.length; i++) {
            if (a.dhalls.includes(dhalls[i]) && !b.dhalls.includes(dhalls[i])) {
              return -1;
            } else if (b.dhalls.includes(dhalls[i]) && !a.dhalls.includes(dhalls[i])) {
              return 1;
            }
          }
          return 1;
        }
      });
    });
  }

  //For each meal, display n cards each showing the specials for that dhall

  let specials = {};
  function processSpecials() {
    Object.keys(mealFoods).forEach((meal) => {
      specials[meal] = {};
      dhalls.forEach((dhall) => {
        specials[meal][dhall] = [];
      });

      mealFoods[meal].forEach((food) => {
        if (food.dhalls.length == 1) {
          specials[meal][food.dhalls[0]].push(food);
        }
      });
    });
  }

  //Foods with more than 1 but less than 9 dhalls
  //Map from meal to array of tuples of food, array of dhalls offering it
  //Array is sorted by earliest dhall
  let partialSpecials = {};
  function processPartialSpecials() {
    Object.keys(mealFoods).forEach((meal) => {
      partialSpecials[meal] = [];

      mealFoods[meal].forEach((food) => {
        if (food.dhalls.length > 1 && food.dhalls.length < 9) {
          let dhallArray = [];
          dhalls.forEach((dhall) => {
            if (food.dhalls.includes(dhall)) {
              dhallArray.push(1);
            } else {
              dhallArray.push(0);
            }
          });
          partialSpecials[meal].push({ food: food, dhalls: dhallArray });
        }
      });

      //Sort by dhallArray lexographically
      //An earlier 1 goes above a later 1
      partialSpecials[meal].sort((a, b) => {
        for (let i = 0; i < dhalls.length; i++) {
          if (a.dhalls[i] - b.dhalls[i] != 0) {
            return a.dhalls[i] - b.dhalls[i];
          }
        }
        return 0;
      });
    });
  }

  let allDhFoods = {};
  function processAllDhFoods() {
    allDhFoods = {};
    meals.forEach((meal) => {
      allDhFoods[meal] = [];

      mealFoods[meal].forEach((food) => {
        if (food.dhalls.length == dhalls.length) {
          allDhFoods[meal].push(food);
        }
      });
    });
  }

  function var_to_label(variable: string) {
    return variable.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function refresh() {
    setTimeout(() => {
      processData(data);
      sortByDhFrequency();
      processSpecials();
      processPartialSpecials();
      processAllDhFoods();
    }, 50);
  }

  onMount(() => {
    getData();

    //Set the current meal to the meal that will occur next based on the current time
    let date = new Date();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let day = date.getDay();

    let meal = "Lunch";
    //If it's between 8PM Friday and 1:30 PM Saturday, it's brunch
    //If it's between 8PM Saturday and 1:30 PM Sunday, it's brunch
    if (
      (day == 5 && (hour > 20 || (hour == 20 && minute >= 0))) ||
      (day == 6 && (hour < 13 || (hour == 13 && minute <= 30)))
    ) {
      meal = "Brunch";
    } else if (
      (day == 6 && (hour > 20 || (hour == 20 && minute >= 0))) ||
      (day == 0 && (hour < 13 || (hour == 13 && minute <= 30)))
    ) {
      meal = "Brunch";
    }

    //If it's between 1:30 PM and 8 PM on any other day, it's dinner
    else if (hour >= 13 && hour < 20) {
      meal = "Dinner";
    }

    //If meal is brunch but brunch has no data, set it to lunch
    if (meal == "Brunch" && mealFoods["Brunch"].length == 0) {
      meal = "Lunch";
    }

    $selectedMeal = meal;
  });
</script>

<div class="w-full flex flex-row self-center justify-center pt-4">
  <div class="border-primary border-2 rounded-lg p-2 mx-4">
    Try&nbsp;<a class="text-blue-500" href="https://sambhavg.github.io/coursecorrect">/coursecorrect</a>&nbsp;for course
    planning & degree checking
  </div>
</div>
<main class="container mx-auto h-full p-4 flex flex-col items-center justify-center space-y-3">
  <Tabs.Root bind:value={$selectedMeal}>
    <Tabs.List>
      {#each meals as meal}
        <Tabs.Trigger value={meal}>{meal}</Tabs.Trigger>
      {/each}
    </Tabs.List>
  </Tabs.Root>

  <div class="flex flex-wrap justify-center">
    {#each Object.keys($filters) as filter}
      <div class="flex items-center mr-4 mb-4 md:mr-0 md:mb-0">
        <div class="mr-2">
          <Switch bind:checked={$filters[filter]} onCheckedChange={refresh} />
        </div>
        <div class="mb-2 mr-3">{var_to_label(filter)}</div>
      </div>
    {/each}
  </div>

  <div class="flex flex-col align-center justify-start">
    {#if mealFoods != {}}
      <div class="text-3xl w-full flex flex-row justify-center mb-5">Specials</div>
      <div class="flex flex-col md:flex-row md:flex-wrap items-center md:items-start justify-center">
        {#each dhalls as dhall}
          <div class="flex flex-col items-center justify-start bg-card rounded-lg w-80 md:w-32 mb-4 md:mr-4">
            <h3 class="hidden md:inline">{dhallToLetter[dhall]}</h3>
            <h3 class="md:hidden">{dhallToName[dhall]}</h3>
            {#each specials[$selectedMeal][dhall] as food}
              <div class="flex items-center justify-between border-2 border-primary p-2 m-2 w-full rounded-lg">
                <h3>{food.name}</h3>
                <Popover.Root>
                  <Popover.Trigger><Info size={24} class="p-1" /></Popover.Trigger>
                  <Popover.Content side="top-start"
                    >{food.ingredients ? "Ingredients: " + food.ingredients : "No ingredients listed"}
                    {#each Object.keys($filters) as filter}
                      {#if food[filter]}
                        <div class="text-green-500">{var_to_label(filter)}</div>
                      {/if}
                    {/each}
                  </Popover.Content>
                </Popover.Root>
              </div>
            {/each}
          </div>
        {/each}
      </div>

      <Separator />
      <!-- partialSpecials table -->
      <div class="text-3xl w-full flex flex-row justify-center mt-10 mb-5">Partial Specials</div>
      <div class="w-full flex flex-col justify-start items-center">
        <div class="grid grid-cols-9 w-fit">
          {#if mealFoods != {}}
            {#each partialSpecials[$selectedMeal] ?? [] as foodDhallTuple}
              <div class="flex flex-row justify-center items-center w-full col-span-9 my-1">
                {foodDhallTuple.food.name}
                <Popover.Root>
                  <Popover.Trigger><Info size={24} class="p-1" /></Popover.Trigger>
                  <Popover.Content side="top-start"
                    >{foodDhallTuple.food.ingredients
                      ? "Ingredients: " + foodDhallTuple.food.ingredients
                      : "No ingredients listed"}
                    {#each Object.keys($filters) as filter}
                      {#if foodDhallTuple.food[filter]}
                        <div class="text-primary">{var_to_label(filter)}</div>
                      {/if}
                    {/each}
                  </Popover.Content>
                </Popover.Root>
              </div>
              {#each foodDhallTuple.dhalls ?? [] as dhall, i}
                {#if dhall}
                  <div class="w-5 h-5 p-3 m-1 my-1 bg-primary rounded-sm flex items-center justify-center text-black">
                    {dhallToLetter[dhalls[i]]}
                  </div>
                {:else}
                  <div class="w-5 h-5 rounded-sm"></div>
                {/if}
              {/each}
            {/each}
          {/if}
        </div>
      </div>
      <Separator class="mt-5" />
      <!-- Foods offered in all dhalls -->
      <div class="text-3xl w-full flex flex-row justify-center mt-10 mb-5">Everywhere</div>
      <div class="flex flex-row flex-wrap justify-evenly">
        {#each allDhFoods[$selectedMeal] ?? [] as food}
          <div class="flex items-center justify-between border-2 border-primary p-2 m-2 rounded-lg">
            <h3>{food.name}</h3>
            <Popover.Root>
              <Popover.Trigger><Info size={24} class="p-1" /></Popover.Trigger>
              <Popover.Content side="top-start"
                >{food.ingredients ? "Ingredients: " + food.ingredients : "No ingredients listed"}
                {#each Object.keys($filters) as filter}
                  {#if food[filter]}
                    <div class="text-green-500">{var_to_label(filter)}</div>
                  {/if}
                {/each}
              </Popover.Content>
            </Popover.Root>
          </div>
        {/each}
      </div>
    {:else}
      <p>Loading...</p>
    {/if}
  </div>
</main>
