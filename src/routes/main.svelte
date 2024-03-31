<script lang="ts">
  import { onMount } from "svelte";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { ToggleGroup } from "bits-ui";

  import { selectedMeal, filters } from "../stores.js";
  import Switch from "$lib/components/ui/switch/switch.svelte";
  import * as Table from "$lib/components/ui/table";

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

    let randomFood = {
      name: "Cereal",
      dhalls: [
        "Wilbur",
        "Stern",
        "GerhardCasper",
        "EVGR",
        "Arrillaga",
        "Branner",
        "FlorenceMoore",
        "Lakeside",
        "Ricker",
      ],
    };

    for (let i = 0; i < 20; i++) {
      randomFood.name = "Cereal" + i;
      mealFoods["Breakfast"].push(JSON.parse(JSON.stringify(randomFood)));
    }
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
    console.log(allDhFoods);
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
  });
</script>

<main class="container mx-auto h-full p-4 flex flex-col items-center justify-center space-y-3">
  <Tabs.Root bind:value={$selectedMeal}>
    <Tabs.List>
      {#each meals as meal}
        <Tabs.Trigger value={meal}>{meal}</Tabs.Trigger>
      {/each}
    </Tabs.List>
  </Tabs.Root>

  <div class="flex">
    {#each Object.keys($filters) as filter}
      <div class="flex items-center mr-4">
        <div class="mr-2">
          <Switch bind:checked={$filters[filter]} onCheckedChange={refresh} />
        </div>
        <div class="p-1">{var_to_label(filter)}</div>
      </div>
    {/each}
  </div>

  <div>
    {#if mealFoods != {}}
      <div class="text-3xl w-full flex flex-row justify-center">Specials</div>
      <div class="flex flex-row flex-wrap justify-evenly">
        {#each dhalls as dhall}
          <div class="flex flex-col items-center justify-start bg-card rounded-lg min-w-10 max-w-min">
            <h3>{dhallToLetter[dhall]}</h3>
            {#each specials[$selectedMeal][dhall] as food}
              <div class="flex items-center justify-between border-2 border-green-500 p-2 m-2 w-full rounded-lg">
                <h3>{food.name}</h3>
              </div>
            {/each}
          </div>
        {/each}
      </div>
      <Separator />
      <!-- partialSpecials table -->
      <div class="text-3xl w-full flex flex-row justify-center mt-10">Partial Specials</div>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Food</Table.Head>
            {#each dhalls as dhall}
              <Table.Head>{dhallToLetter[dhall]}</Table.Head>
            {/each}
          </Table.Row>
        </Table.Header>
        {#if mealFoods != {}}
          <Table.Body>
            {#each partialSpecials[$selectedMeal] ?? [] as foodDhallTuple}
              <Table.Row>
                <Table.Cell>{foodDhallTuple.food.name}</Table.Cell>
                {#each foodDhallTuple.dhalls ?? [] as dhall}
                  <!-- <Table.Cell>{dhall ? "X" : ""}</Table.Cell> -->
                  <Table.Cell>
                    {#if dhall}
                      <div class="w-4 h-4 bg-green-500 rounded-sm"></div>
                    {/if}
                  </Table.Cell>
                {/each}
              </Table.Row>
            {/each}
          </Table.Body>
        {/if}
      </Table.Root>
      <Separator />
      <!-- Foods offered in all dhalls -->
      <div class="text-3xl w-full flex flex-row justify-center mt-10">All dhalls</div>
      <div class="flex flex-row flex-wrap justify-evenly">
        {#each allDhFoods[$selectedMeal] ?? [] as food}
          <div class="flex items-center justify-between border-2 border-green-500 p-2 m-2 rounded-lg">
            <h3>{food.name}</h3>
          </div>
        {/each}
      </div>
    {:else}
      <p>Loading...</p>
    {/if}
  </div>
</main>
