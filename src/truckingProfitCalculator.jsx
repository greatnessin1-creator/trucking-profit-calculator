import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "trucking_profit_calculator_state_v3";

const InputField = ({
  label,
  value,
  setValue,
  step = "0.01",
  min = "0",
  helpText = "",
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
      {label}
    </span>
    <input
      type="number"
      value={value}
      min={min}
      step={step}
      onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
    />
    {helpText ? <span className="text-xs text-slate-500">{helpText}</span> : null}
  </label>
);

const ToggleButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
      active ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-white"
    }`}
  >
    {children}
  </button>
);

const StatCard = ({ label, value, sublabel, dark = false }) => (
  <div
    className={`rounded-2xl p-4 shadow-md ${
      dark ? "bg-slate-900 text-white" : "bg-white text-slate-900"
    }`}
  >
    <div
      className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
        dark ? "text-slate-300" : "text-slate-500"
      }`}
    >
      {label}
    </div>
    <div className="mt-1 text-2xl font-bold sm:text-3xl">{value}</div>
    {sublabel ? (
      <div className={`mt-1 text-xs ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {sublabel}
      </div>
    ) : null}
  </div>
);

const AlertCard = ({ tone = "slate", title, children }) => {
  const tones = {
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    slate: "border-slate-200 bg-slate-50 text-slate-800",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <div className="text-sm font-bold">{title}</div>
      <div className="mt-1 text-sm leading-6">{children}</div>
    </div>
  );
};

const tierPercents = [75, 82, 88, 92];

const scenarioPresets = {
  conservative: {
    label: "Bad week",
    ratePerMile: 4.25,
    loadMiles: 350,
    loadsPerDay: 1,
    milesPerDay: 350,
    daysPerWeek: 5,
    projectionDaysInput: 5,
    deadheadMilesPerDay: 120,
    fuelPrice: 4.75,
    mpg: 6.2,
  },
  average: {
    label: "Average week",
    ratePerMile: 5.0,
    loadMiles: 450,
    loadsPerDay: 1,
    milesPerDay: 450,
    daysPerWeek: 6,
    projectionDaysInput: 6,
    deadheadMilesPerDay: 70,
    fuelPrice: 4.4,
    mpg: 6.5,
  },
  strong: {
    label: "Good week",
    ratePerMile: 5.75,
    loadMiles: 550,
    loadsPerDay: 1,
    milesPerDay: 550,
    daysPerWeek: 6,
    projectionDaysInput: 6,
    deadheadMilesPerDay: 35,
    fuelPrice: 4.2,
    mpg: 6.8,
  },
};

const DEFAULTS = {
  calculatorStyle: "basic",
  mode: "team",
  projectionMode: "custom_days",
  projectionDaysInput: 7,
  milesInputMode: "load_math",
  costAllocationMode: "spread",
  selectedScenario: "average",

  ratePerMile: 5.0,
  milesPerDay: 500,
  daysPerWeek: 7,
  splitPercent: 75,

  fuelPrice: 5.5,
  mpg: 6.5,

  maintenancePerMile: 0.15,
  tiresPerMile: 0.05,
  miscPerMile: 0.03,
  taxPercent: 25,

  truckWeekly: 700,
  trailerWeekly: 335,
  cargoWeekly: 295,
  bobtailMonthly: 570,
  tripPackMonthly: 50,
  eldMonthly: 150,
  yearlyFees: 2500,

  dispatcherPercent: 0,
  factoringPercent: 0,
  reservePercent: 5,

  loadMiles: 400,
  loadsPerDay: 1,
  dailyLoadPayout: 0,
  deadheadMilesPerDay: 0,
};

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

const pctFmt = (n) => `${Number.isFinite(n) ? n.toFixed(1) : "0.0"}%`;
const safeNum = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);

export default function TruckingProfitCalculator({
  session,
  profile,
  subscription,
  isTrial,
  entitlements,
  plan,
}) {
  const [isCalculatorLoaded, setIsCalculatorLoaded] = useState(true);

  const [calculatorStyle, setCalculatorStyle] = useState(DEFAULTS.calculatorStyle);
  const [mode, setMode] = useState(DEFAULTS.mode);
  const [projectionMode, setProjectionMode] = useState(DEFAULTS.projectionMode);
  const [projectionDaysInput, setProjectionDaysInput] = useState(DEFAULTS.projectionDaysInput);
  const [milesInputMode, setMilesInputMode] = useState(DEFAULTS.milesInputMode);
  const [costAllocationMode, setCostAllocationMode] = useState(DEFAULTS.costAllocationMode);
  const [selectedScenario, setSelectedScenario] = useState(DEFAULTS.selectedScenario);

  const [ratePerMile, setRatePerMile] = useState(DEFAULTS.ratePerMile);
  const [milesPerDay, setMilesPerDay] = useState(DEFAULTS.milesPerDay);
  const [daysPerWeek, setDaysPerWeek] = useState(DEFAULTS.daysPerWeek);
  const [splitPercent, setSplitPercent] = useState(DEFAULTS.splitPercent);

  const [fuelPrice, setFuelPrice] = useState(DEFAULTS.fuelPrice);
  const [mpg, setMpg] = useState(DEFAULTS.mpg);

  const [maintenancePerMile, setMaintenancePerMile] = useState(DEFAULTS.maintenancePerMile);
  const [tiresPerMile, setTiresPerMile] = useState(DEFAULTS.tiresPerMile);
  const [miscPerMile, setMiscPerMile] = useState(DEFAULTS.miscPerMile);
  const [taxPercent, setTaxPercent] = useState(DEFAULTS.taxPercent);

  const [truckWeekly, setTruckWeekly] = useState(DEFAULTS.truckWeekly);
  const [trailerWeekly, setTrailerWeekly] = useState(DEFAULTS.trailerWeekly);
  const [cargoWeekly, setCargoWeekly] = useState(DEFAULTS.cargoWeekly);
  const [bobtailMonthly, setBobtailMonthly] = useState(DEFAULTS.bobtailMonthly);
  const [tripPackMonthly, setTripPackMonthly] = useState(DEFAULTS.tripPackMonthly);
  const [eldMonthly, setEldMonthly] = useState(DEFAULTS.eldMonthly);
  const [yearlyFees, setYearlyFees] = useState(DEFAULTS.yearlyFees);

  const [dispatcherPercent, setDispatcherPercent] = useState(DEFAULTS.dispatcherPercent);
  const [factoringPercent, setFactoringPercent] = useState(DEFAULTS.factoringPercent);
  const [reservePercent, setReservePercent] = useState(DEFAULTS.reservePercent);

  const [loadMiles, setLoadMiles] = useState(DEFAULTS.loadMiles);
  const [loadsPerDay, setLoadsPerDay] = useState(DEFAULTS.loadsPerDay);
  const [dailyLoadPayout, setDailyLoadPayout] = useState(DEFAULTS.dailyLoadPayout);
  const [deadheadMilesPerDay, setDeadheadMilesPerDay] = useState(DEFAULTS.deadheadMilesPerDay);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      const setters = {
        isCalculatorLoaded: setIsCalculatorLoaded,
        calculatorStyle: setCalculatorStyle,
        mode: setMode,
        projectionMode: setProjectionMode,
        projectionDaysInput: setProjectionDaysInput,
        milesInputMode: setMilesInputMode,
        costAllocationMode: setCostAllocationMode,
        selectedScenario: setSelectedScenario,
        ratePerMile: setRatePerMile,
        milesPerDay: setMilesPerDay,
        daysPerWeek: setDaysPerWeek,
        splitPercent: setSplitPercent,
        fuelPrice: setFuelPrice,
        mpg: setMpg,
        maintenancePerMile: setMaintenancePerMile,
        tiresPerMile: setTiresPerMile,
        miscPerMile: setMiscPerMile,
        taxPercent: setTaxPercent,
        truckWeekly: setTruckWeekly,
        trailerWeekly: setTrailerWeekly,
        cargoWeekly: setCargoWeekly,
        bobtailMonthly: setBobtailMonthly,
        tripPackMonthly: setTripPackMonthly,
        eldMonthly: setEldMonthly,
        yearlyFees: setYearlyFees,
        dispatcherPercent: setDispatcherPercent,
        factoringPercent: setFactoringPercent,
        reservePercent: setReservePercent,
        loadMiles: setLoadMiles,
        loadsPerDay: setLoadsPerDay,
        dailyLoadPayout: setDailyLoadPayout,
        deadheadMilesPerDay: setDeadheadMilesPerDay,
      };

      Object.entries(setters).forEach(([key, setter]) => {
        if (saved[key] !== undefined) setter(saved[key]);
      });
    } catch {
      // ignore invalid state
    }
  }, []);

  useEffect(() => {
    const payload = {
      isCalculatorLoaded,
      calculatorStyle,
      mode,
      projectionMode,
      projectionDaysInput,
      milesInputMode,
      costAllocationMode,
      selectedScenario,
      ratePerMile,
      milesPerDay,
      daysPerWeek,
      splitPercent,
      fuelPrice,
      mpg,
      maintenancePerMile,
      tiresPerMile,
      miscPerMile,
      taxPercent,
      truckWeekly,
      trailerWeekly,
      cargoWeekly,
      bobtailMonthly,
      tripPackMonthly,
      eldMonthly,
      yearlyFees,
      dispatcherPercent,
      factoringPercent,
      reservePercent,
      loadMiles,
      loadsPerDay,
      dailyLoadPayout,
      deadheadMilesPerDay,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    isCalculatorLoaded,
    calculatorStyle,
    mode,
    projectionMode,
    projectionDaysInput,
    milesInputMode,
    costAllocationMode,
    selectedScenario,
    ratePerMile,
    milesPerDay,
    daysPerWeek,
    splitPercent,
    fuelPrice,
    mpg,
    maintenancePerMile,
    tiresPerMile,
    miscPerMile,
    taxPercent,
    truckWeekly,
    trailerWeekly,
    cargoWeekly,
    bobtailMonthly,
    tripPackMonthly,
    eldMonthly,
    yearlyFees,
    dispatcherPercent,
    factoringPercent,
    reservePercent,
    loadMiles,
    loadsPerDay,
    dailyLoadPayout,
    deadheadMilesPerDay,
  ]);

  const applyScenario = (key) => {
    const scenario = scenarioPresets[key];
    if (!scenario) return;

    setSelectedScenario(key);
    setRatePerMile(scenario.ratePerMile);
    setLoadMiles(scenario.loadMiles);
    setLoadsPerDay(scenario.loadsPerDay);
    setMilesPerDay(scenario.milesPerDay);
    setDaysPerWeek(scenario.daysPerWeek);
    setProjectionDaysInput(scenario.projectionDaysInput);
    setDeadheadMilesPerDay(scenario.deadheadMilesPerDay);
    setFuelPrice(scenario.fuelPrice);
    setMpg(scenario.mpg);
  };

  const resetCalculator = () => {
    setIsCalculatorLoaded(true);
    setCalculatorStyle(DEFAULTS.calculatorStyle);
    setMode(DEFAULTS.mode);
    setProjectionMode(DEFAULTS.projectionMode);
    setProjectionDaysInput(DEFAULTS.projectionDaysInput);
    setMilesInputMode(DEFAULTS.milesInputMode);
    setCostAllocationMode(DEFAULTS.costAllocationMode);
    setSelectedScenario(DEFAULTS.selectedScenario);

    setRatePerMile(DEFAULTS.ratePerMile);
    setMilesPerDay(DEFAULTS.milesPerDay);
    setDaysPerWeek(DEFAULTS.daysPerWeek);
    setSplitPercent(DEFAULTS.splitPercent);

    setFuelPrice(DEFAULTS.fuelPrice);
    setMpg(DEFAULTS.mpg);

    setMaintenancePerMile(DEFAULTS.maintenancePerMile);
    setTiresPerMile(DEFAULTS.tiresPerMile);
    setMiscPerMile(DEFAULTS.miscPerMile);
    setTaxPercent(DEFAULTS.taxPercent);

    setTruckWeekly(DEFAULTS.truckWeekly);
    setTrailerWeekly(DEFAULTS.trailerWeekly);
    setCargoWeekly(DEFAULTS.cargoWeekly);
    setBobtailMonthly(DEFAULTS.bobtailMonthly);
    setTripPackMonthly(DEFAULTS.tripPackMonthly);
    setEldMonthly(DEFAULTS.eldMonthly);
    setYearlyFees(DEFAULTS.yearlyFees);

    setDispatcherPercent(DEFAULTS.dispatcherPercent);
    setFactoringPercent(DEFAULTS.factoringPercent);
    setReservePercent(DEFAULTS.reservePercent);

    setLoadMiles
