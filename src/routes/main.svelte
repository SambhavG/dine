<script lang="ts">
  import { onMount } from "svelte";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Popover from "$lib/components/ui/popover";

  import { selectedMeal, filters, selectedDayOption } from "../stores.ts";
  import Switch from "$lib/components/ui/switch/switch.svelte";
  import { Info } from "lucide-svelte";

  // Add proper typing for the data structures
  interface DayData {
    meta: {
      date: string;
    };
    [key: string]: any; // For other properties
  }

  let allData: DayData[] = [];
  let data: DayData | Record<string, any> = {};
  let dhalls: string[] = [];
  let meals: string[] = [];
  let dayOptions: string[] = [];

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

  let highlightedDhall: string | null = null;

  async function getData() {
    try {
      const response = await fetch("https://general-backend-db.onrender.com/polls/seven_days");
      const result = await response.text();
      allData = JSON.parse(result);

      // Clear existing dayOptions
      dayOptions = [];

      // Make sure we have data before processing
      if (allData && Array.isArray(allData)) {
        // Create new array of dates
        dayOptions = allData.filter((day) => day?.meta?.date).map((day) => day.meta.date);
        if (dayOptions.length > 0) {
          $selectedDayOption = dayOptions[0];
          data = allData[0];
          refresh();
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  // Replace the existing data change block with this reactive statement
  $: {
    if ($selectedDayOption && allData.length > 0) {
      const index = dayOptions.indexOf($selectedDayOption);
      if (index !== -1) {
        data = allData[index];
        refresh();
      }
    }
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
  //Array is sorted by number of dhalls, then by earliest dhall, then alphabetically
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

      partialSpecials[meal].sort((a, b) => {
        // First sort by number of dining halls (fewer first)
        const aCount = a.dhalls.reduce((sum, val) => sum + val, 0);
        const bCount = b.dhalls.reduce((sum, val) => sum + val, 0);
        if (aCount !== bCount) {
          return aCount - bCount;
        }

        // Then sort by earliest dining hall
        for (let i = 0; i < dhalls.length; i++) {
          if (a.dhalls[i] !== b.dhalls[i]) {
            return b.dhalls[i] - a.dhalls[i]; // Reverse to prioritize 1s earlier
          }
        }

        // Finally sort alphabetically
        return a.food.name.localeCompare(b.food.name);
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
    fetch("https://api.counterapi.dev/v1/sambhavg.github.io/dine/up");
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

  function convertDate(date: string) {
    // Create date at noon Pacific time to avoid any timezone edge cases
    let pacificDate = new Date(date + "T12:00:00-07:00");
    let day = pacificDate.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "America/Los_Angeles",
    });
    let dayNumber = pacificDate.getDate();

    // Get ordinal suffix
    const getOrdinal = (n: number) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${day} ${dayNumber}${getOrdinal(dayNumber)}`;
  }
</script>

<div class="w-full flex flex-row flex-wrap self-center justify-center pt-4">
  <div class="border-primary border-2 rounded-lg p-2 mx-4">
    Try <a class="text-blue-500" href="https://sambhavg.github.io/coursecorrect">/coursecorrect</a>&nbsp;for course
    planning & degree checking
  </div>
  <div class="border-primary border-2 rounded-lg p-2 mx-4 text-center mt-4 md:mt-0">
    <a href="https://github.com/SambhavG/dine" class="text-yellow-300">Star</a> on Github if you found it useful
    <!-- Place this tag where you want the button to render. -->
  </div>
</div>

<Tabs.Root
  bind:value={$selectedDayOption}
  class="container mx-auto h-full pt-2 flex flex-col items-center justify-center"
>
  <Tabs.List>
    {#each dayOptions as dayOption}
      <Tabs.Trigger value={dayOption}>{convertDate(dayOption)}</Tabs.Trigger>
    {/each}
  </Tabs.List>
</Tabs.Root>

<Tabs.Root
  bind:value={$selectedMeal}
  class="container mx-auto h-full p-4 pt-2 flex flex-col items-center justify-center space-y-3"
>
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
<main class="mx-auto h-full p-4 flex flex-col items-center justify-center space-y-3">
  <div class="flex flex-col items-center justify-start">
    {#if mealFoods != {}}
      <div class="flex flex-col items-center md:items-start md:grid md:grid-cols-3 md:grid-cols-[2fr_1fr_2fr] gap-5">
        <div class="flex flex-col md:flex-row md:flex-wrap items-center md:items-start justify-center">
          <div class="text-3xl w-full flex flex-row justify-center mb-5">Specials</div>
          {#each dhalls as dhall}
            {#if specials[$selectedMeal][dhall].length > 0}
              <div
                class="flex flex-col items-center justify-start bg-card rounded-lg w-80 md:w-48 mb-4 md:mr-4"
                on:mouseenter={() => (highlightedDhall = dhall)}
                on:mouseleave={() => (highlightedDhall = null)}
              >
                <h3><b>{dhallToName[dhall]}</b></h3>
                {#each specials[$selectedMeal][dhall] as food}
                  <div
                    class="flex items-center justify-between border-2 border-primary p-2 m-2 w-full rounded-lg"
                    class:bg-secondary={highlightedDhall === dhall}
                  >
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
            {/if}
          {/each}
        </div>

        <!-- Partial Specials -->
        <div class="flex flex-col md:flex-row md:flex-wrap items-center md:items-start justify-center">
          <div class="text-3xl w-full flex justify-center mb-3 mt-10 md:mt-0">Partial Specials</div>
          <div class="w-full flex flex-col justify-start items-center">
            <div class="grid grid-cols-9 w-fit">
              {#if mealFoods != {}}
                {#each partialSpecials[$selectedMeal] ?? [] as foodDhallTuple}
                  <div
                    class="flex flex-row justify-center items-center w-full col-span-9 my-1 rounded-lg {foodDhallTuple
                      .dhalls[dhalls.indexOf(highlightedDhall)]
                      ? 'outline outline-2 outline-primary'
                      : ''}"
                  >
                    {foodDhallTuple.food.name}
                    <Popover.Root>
                      <Popover.Trigger><Info size={24} class="p-1" /></Popover.Trigger>
                      <Popover.Content side="top-start">
                        {foodDhallTuple.food.ingredients
                          ? "Ingredients: " + foodDhallTuple.food.ingredients
                          : "No ingredients listed"}
                        {#each Object.keys($filters) as filter}
                          {#if foodDhallTuple.food[filter]}
                            <div class="text-green-500">{var_to_label(filter)}</div>
                          {/if}
                        {/each}
                      </Popover.Content>
                    </Popover.Root>
                  </div>
                  {#each foodDhallTuple.dhalls ?? [] as dhall, i}
                    {#if dhall}
                      <div
                        class="w-5 h-5 p-3 m-1 my-1 rounded-sm flex items-center justify-center text-black"
                        class:bg-primary={!highlightedDhall || highlightedDhall === dhalls[i]}
                        class:bg-secondary={highlightedDhall && highlightedDhall !== dhalls[i]}
                        on:mouseenter={() => (highlightedDhall = dhalls[i])}
                        on:mouseleave={() => (highlightedDhall = null)}
                      >
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
          <div class="text-center mt-3">
            <b>W</b>ilbur, <b>S</b>tern, <b>C</b>asper, <b>E</b>VGR, <b>A</b>rrillaga, <b>B</b>ranner, <b>F</b>lomo,
            <b>L</b>akeside, <b>R</b>icker
          </div>
        </div>

        <!-- Everywhere -->
        <div class="flex flex-col md:flex-row md:flex-wrap items-center md:items-start justify-center">
          <div class="text-3xl w-full flex justify-center mb-3 mt-10 md:mt-0">Everywhere</div>
          <div class="flex flex-row flex-wrap justify-evenly w-80 md:w-fit">
            {#each allDhFoods[$selectedMeal] ?? [] as food}
              <div
                class="flex items-center justify-between border-2 border-primary p-2 m-2 rounded-lg w-full md:w-fit"
                class:bg-secondary={highlightedDhall}
              >
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
        </div>
      </div>
    {:else}
      <p>Loading...</p>
    {/if}
  </div>
</main>
