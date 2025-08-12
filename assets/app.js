/* ChefCraft App - Frontend only */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const UI = {
  dishInput: $("#dishInput"),
  peopleInput: $("#peopleInput"),
  searchBtn: $("#searchBtn"),
  randomBtn: $("#randomBtn"),
  placeholder: $("#placeholder"),
  loading: $("#loading"),
  recipeSection: $("#recipeSection"),
  errorSection: $("#errorSection"),
  mealThumb: $("#mealThumb"),
  mealTitle: $("#mealTitle"),
  mealCategory: $("#mealCategory"),
  mealArea: $("#mealArea"),
  mealTags: $("#mealTags"),
  mealSource: $("#mealSource"),
  servingsInput: $("#servingsInput"),
  ingredientsList: $("#ingredientsList"),
  stepsList: $("#stepsList"),
  startBtn: $("#startBtn"),
  prevBtn: $("#prevBtn"),
  nextBtn: $("#nextBtn"),
  speakBtn: $("#speakBtn"),
  stepProgressBar: $("#stepProgressBar"),
  stepProgressLabel: $("#stepProgressLabel"),
};

const MealAPI = {
  async searchByName(name) {
    const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
      name.trim()
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch meals");
    const data = await res.json();
    return data.meals || [];
  },
  async random() {
    const url = `https://www.themealdb.com/api/json/v1/1/random.php`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch random meal");
    const data = await res.json();
    return data.meals?.[0] || null;
  },
};

// Heuristic: choose best match by exact name, then startsWith, then includes, else first
function chooseBestMatch(meals, query) {
  const q = query.trim().toLowerCase();
  const exact = meals.find((m) => m.strMeal.toLowerCase() === q);
  if (exact) return exact;
  const starts = meals.find((m) => m.strMeal.toLowerCase().startsWith(q));
  if (starts) return starts;
  const includes = meals.find((m) => m.strMeal.toLowerCase().includes(q));
  if (includes) return includes;
  return meals[0];
}

// Parse MealDB ingredients into array of { name, measure }
function extractIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push({ name: name.trim(), measure: (measure || "").trim() });
    }
  }
  return ingredients;
}

// Convert unicode fractions and mixed numbers to decimals
function fractionToNumber(str) {
  if (!str) return null;
  const frMap = {
    "¼": 0.25,
    "½": 0.5,
    "¾": 0.75,
    "⅐": 1 / 7,
    "⅑": 1 / 9,
    "⅒": 0.1,
    "⅓": 1 / 3,
    "⅔": 2 / 3,
    "⅕": 0.2,
    "⅖": 0.4,
    "⅗": 0.6,
    "⅘": 0.8,
    "⅙": 1 / 6,
    "⅚": 5 / 6,
    "⅛": 0.125,
    "⅜": 0.375,
    "⅝": 0.625,
    "⅞": 0.875,
  };
  if (frMap[str] != null) return frMap[str];
  return null;
}

function parseQuantity(measure) {
  // Extract leading quantity portion, support mixed numbers and unicode fractions
  // Examples: "1 1/2 cup", "½ cup", "2-3 tbsp", "3 to 4 cloves", "200 g"
  if (!measure) return { quantity: null, rest: measure };
  const cleaned = measure.replace(/\s+/g, " ").trim();

  // Replace unicode fractions with ascii equivalents for parsing
  const withAscii = cleaned
    .replace(/¼/g, " 1/4 ")
    .replace(/½/g, " 1/2 ")
    .replace(/¾/g, " 3/4 ")
    .replace(/⅐/g, " 1/7 ")
    .replace(/⅑/g, " 1/9 ")
    .replace(/⅒/g, " 1/10 ")
    .replace(/⅓/g, " 1/3 ")
    .replace(/⅔/g, " 2/3 ")
    .replace(/⅕/g, " 1/5 ")
    .replace(/⅖/g, " 2/5 ")
    .replace(/⅗/g, " 3/5 ")
    .replace(/⅘/g, " 4/5 ")
    .replace(/⅙/g, " 1/6 ")
    .replace(/⅚/g, " 5/6 ")
    .replace(/⅛/g, " 1/8 ")
    .replace(/⅜/g, " 3/8 ")
    .replace(/⅝/g, " 5/8 ")
    .replace(/⅞/g, " 7/8 ");

  // Range like "2-3" or "2 to 3" -> take average
  const rangeMatch = withAscii.match(/^(\d+(?:[\s\-to]+)\d+)/i);
  if (rangeMatch) {
    const nums = rangeMatch[1]
      .replace(/to/gi, "-")
      .split(/[-\s]+/)
      .filter(Boolean)
      .map((n) => Number(n));
    if (nums.length >= 2 && nums.every((x) => !Number.isNaN(x))) {
      const avg = (nums[0] + nums[1]) / 2;
      const rest = withAscii.slice(rangeMatch[0].length).trim();
      return { quantity: avg, rest };
    }
  }

  // Mixed number like "1 1/2"
  const mixedMatch = withAscii.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const num = Number(mixedMatch[2]);
    const den = Number(mixedMatch[3]);
    const val = whole + num / den;
    const rest = withAscii.slice(mixedMatch[0].length).trim();
    return { quantity: val, rest };
  }

  // Simple fraction like "1/2"
  const fracMatch = withAscii.match(/^(\d+)\/(\d+)/);
  if (fracMatch) {
    const val = Number(fracMatch[1]) / Number(fracMatch[2]);
    const rest = withAscii.slice(fracMatch[0].length).trim();
    return { quantity: val, rest };
  }

  // Simple number at start
  const numMatch = withAscii.match(/^(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const val = Number(numMatch[1]);
    const rest = withAscii.slice(numMatch[0].length).trim();
    return { quantity: val, rest };
  }

  return { quantity: null, rest: withAscii };
}

function formatQuantity(qty) {
  if (qty == null || Number.isNaN(qty)) return "";
  // Round to nearest 0.05 for nicer display
  const rounded = Math.round(qty * 20) / 20;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
}

function scaleMeasure(measure, factor) {
  const { quantity, rest } = parseQuantity(measure);
  if (quantity == null) return measure; // leave as is
  const scaled = quantity * factor;
  return `${formatQuantity(scaled)} ${rest}`.trim();
}

function splitInstructions(text) {
  if (!text) return [];
  // Split by newlines. Some MealDB entries separate sentences; filter empty/noise.
  const lines = text
    .split(/\r?\n|\r/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  // If single long paragraph, further split by period.
  let steps = lines;
  if (steps.length <= 2) {
    steps = text
      .split(/(?<=[\.!?])\s+(?=[A-Z])/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  // Remove leading step numbers like "1." or "Step 1:"
  steps = steps.map((s) => s.replace(/^\s*(Step\s*\d+[:\.\-]?\s*|\d+[:\.\-]\s*)/i, "").trim());
  return steps;
}

function highlightIngredientsInStep(stepText, ingredientNames) {
  const sorted = [...ingredientNames].sort((a, b) => b.length - a.length);
  let html = stepText;
  for (const name of sorted) {
    const pattern = new RegExp(`(\\b${escapeRegExp(name)}\\b)`, "gi");
    html = html.replace(pattern, '<mark class="px-1 rounded bg-amber-200/60">$1</mark>');
  }
  return html;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let state = {
  meal: null,
  baseServings: 2, // assumed source serves ~2; user-controlled target via inputs
  targetServings: 2,
  steps: [],
  currentStepIndex: -1,
  usedIngredients: new Set(),
};

function renderMeal(meal) {
  UI.placeholder.classList.add("hidden");
  UI.errorSection.classList.add("hidden");
  UI.recipeSection.classList.remove("hidden");

  UI.mealThumb.src = meal.strMealThumb || "";
  UI.mealThumb.alt = meal.strMeal || "Recipe image";
  UI.mealTitle.textContent = meal.strMeal || "Untitled";
  UI.mealCategory.textContent = meal.strCategory || "General";
  UI.mealArea.textContent = meal.strArea || "";

  if (meal.strTags) {
    UI.mealTags.textContent = meal.strTags;
    UI.mealTags.classList.remove("hidden");
  } else {
    UI.mealTags.classList.add("hidden");
  }

  UI.mealSource.innerHTML = meal.strSource
    ? `Source: <a class="underline decoration-rose-400 underline-offset-4" href="${meal.strSource}" target="_blank" rel="noreferrer">${new URL(meal.strSource).hostname}</a>`
    : "";

  // Ingredients
  const ingredients = extractIngredients(meal);
  state.meal = meal;
  state.steps = splitInstructions(meal.strInstructions || "");
  state.currentStepIndex = -1;
  state.usedIngredients = new Set();

  renderIngredients(ingredients);
  renderSteps();
  updateProgress();
}

function renderIngredients(ingredients) {
  const factor = state.targetServings / state.baseServings;
  UI.ingredientsList.innerHTML = "";

  ingredients.forEach(({ name, measure }, idx) => {
    const scaled = scaleMeasure(measure, factor);
    const id = `ing-${idx}`;
    const li = document.createElement("li");
    li.className = "flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50";
    li.dataset.name = name.toLowerCase();
    li.innerHTML = `
      <input type="checkbox" class="mt-1 h-4 w-4 text-rose-600 border-slate-300 rounded" id="${id}">
      <label for="${id}" class="grow">
        <span class="font-medium">${name}</span>
        <span class="text-slate-500">— ${scaled || measure || ''}</span>
      </label>
    `;
    UI.ingredientsList.appendChild(li);
  });
}

function renderSteps() {
  UI.stepsList.innerHTML = "";
  const ingredientNames = $$("#ingredientsList li").map((li) => li.dataset.name);
  state.steps.forEach((step, i) => {
    const li = document.createElement("li");
    li.className = "p-3 rounded-xl border border-slate-200 bg-white";
    li.dataset.index = String(i);
    li.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="mt-1 h-6 w-6 shrink-0 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">${i + 1}</div>
        <div class="grow text-sm leading-6 step-text">${highlightIngredientsInStep(
          step,
          ingredientNames
        )}</div>
      </div>
    `;
    UI.stepsList.appendChild(li);
  });

  UI.prevBtn.disabled = true;
  UI.nextBtn.disabled = state.steps.length === 0;
}

function updateProgress() {
  const total = state.steps.length;
  const current = Math.max(0, state.currentStepIndex + 1);
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  UI.stepProgressBar.style.width = `${pct}%`;
  UI.stepProgressLabel.textContent = total > 0 ? `${current}/${total}` : "";

  // Highlight current step
  $$("#stepsList li").forEach((li, idx) => {
    if (idx === state.currentStepIndex) {
      li.classList.add("ring-2", "ring-rose-400");
      li.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      li.classList.remove("ring-2", "ring-rose-400");
    }
  });
}

function markUsedIngredientsForStep(stepText) {
  const items = $$("#ingredientsList li");
  items.forEach((li) => {
    const name = li.dataset.name;
    const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`, "i");
    const matches = regex.test(stepText);
    const checkbox = li.querySelector("input[type='checkbox']");
    if (matches) {
      checkbox.checked = true;
      state.usedIngredients.add(name);
      li.classList.add("bg-amber-50");
    }
  });
}

function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    window.speechSynthesis.speak(utter);
  } catch {}
}

async function handleSearch(query) {
  if (!query || !query.trim()) return;
  const people = Number(UI.peopleInput.value) || 2;
  state.targetServings = people;
  UI.servingsInput.value = String(people);

  UI.placeholder.classList.add("hidden");
  UI.errorSection.classList.add("hidden");
  UI.recipeSection.classList.add("hidden");
  UI.loading.classList.remove("hidden");

  try {
    const meals = await MealAPI.searchByName(query);
    if (!meals || meals.length === 0) {
      UI.loading.classList.add("hidden");
      UI.errorSection.classList.remove("hidden");
      return;
    }
    const meal = chooseBestMatch(meals, query);
    UI.loading.classList.add("hidden");
    renderMeal(meal);
  } catch (e) {
    console.error(e);
    UI.loading.classList.add("hidden");
    UI.errorSection.classList.remove("hidden");
  }
}

async function handleRandom() {
  const people = Number(UI.peopleInput.value) || 2;
  state.targetServings = people;
  UI.servingsInput.value = String(people);

  UI.placeholder.classList.add("hidden");
  UI.errorSection.classList.add("hidden");
  UI.recipeSection.classList.add("hidden");
  UI.loading.classList.remove("hidden");

  try {
    const meal = await MealAPI.random();
    UI.loading.classList.add("hidden");
    if (!meal) {
      UI.errorSection.classList.remove("hidden");
      return;
    }
    renderMeal(meal);
  } catch (e) {
    console.error(e);
    UI.loading.classList.add("hidden");
    UI.errorSection.classList.remove("hidden");
  }
}

function onStart() {
  if (!state.steps.length) return;
  state.currentStepIndex = 0;
  updateProgress();
  const stepText = state.steps[state.currentStepIndex];
  markUsedIngredientsForStep(stepText);
  speak(stepText);
  UI.prevBtn.disabled = false;
  UI.nextBtn.disabled = false;
}

function onPrev() {
  if (state.currentStepIndex <= 0) return;
  state.currentStepIndex -= 1;
  updateProgress();
  const stepText = state.steps[state.currentStepIndex];
  speak(stepText);
}

function onNext() {
  if (state.currentStepIndex >= state.steps.length - 1) return;
  state.currentStepIndex += 1;
  updateProgress();
  const stepText = state.steps[state.currentStepIndex];
  markUsedIngredientsForStep(stepText);
  speak(stepText);
}

function onServingsChange() {
  const people = Number(UI.servingsInput.value) || 1;
  state.targetServings = Math.max(1, Math.min(50, people));
  UI.servingsInput.value = String(state.targetServings);
  if (state.meal) {
    renderIngredients(extractIngredients(state.meal));
    renderSteps();
    updateProgress();
  }
}

function wireEvents() {
  UI.searchBtn.addEventListener("click", () => handleSearch(UI.dishInput.value));
  UI.randomBtn.addEventListener("click", () => handleRandom());
  UI.dishInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSearch(UI.dishInput.value);
    }
  });
  UI.peopleInput.addEventListener("change", () => {
    const n = Number(UI.peopleInput.value) || 2;
    UI.servingsInput.value = String(n);
  });
  UI.servingsInput.addEventListener("change", onServingsChange);

  UI.startBtn.addEventListener("click", onStart);
  UI.prevBtn.addEventListener("click", onPrev);
  UI.nextBtn.addEventListener("click", onNext);
  UI.speakBtn.addEventListener("click", () => {
    if (state.currentStepIndex >= 0) {
      speak(state.steps[state.currentStepIndex]);
    }
  });
}

function init() {
  document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
  window.addEventListener("resize", () => {
    document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
  });
  wireEvents();
}

init();