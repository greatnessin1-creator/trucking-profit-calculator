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
  workProfile: "owner_operator",
  mode: "solo",
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
  plan,
  entitlements,
}) {
  const [isCalculatorLoaded, setIsCalculatorLoaded] = useState(true);

  const [calculatorStyle, setCalculatorStyle] = useState(DEFAULTS.calculatorStyle);
  const [workProfile, setWorkProfile] = useState(DEFAULTS.workProfile);
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
        workProfile: setWorkProfile,
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
      // ignore invalid local state
    }
  }, []);

  useEffect(() => {
    const payload = {
      isCalculatorLoaded,
      calculatorStyle,
      workProfile,
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
    workProfile,
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
    setWorkProfile(DEFAULTS.workProfile);
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

    setLoadMiles(DEFAULTS.loadMiles);
    setLoadsPerDay(DEFAULTS.loadsPerDay);
    setDailyLoadPayout(DEFAULTS.dailyLoadPayout);
    setDeadheadMilesPerDay(DEFAULTS.deadheadMilesPerDay);

    localStorage.removeItem(STORAGE_KEY);
  };

  const results = useMemo(() => {
    const numLoadMiles = safeNum(loadMiles);
    const numLoadsPerDay = safeNum(loadsPerDay);
    const numMilesPerDay = safeNum(milesPerDay);
    const numProjectionDays = Math.max(safeNum(projectionDaysInput), 1);
    const numSplitPercent = safeNum(splitPercent);
    const numRatePerMile = safeNum(ratePerMile);
    const numFuelPrice = safeNum(fuelPrice);
    const numMpg = Math.max(safeNum(mpg), 0.1);

    const numTruckWeekly = safeNum(truckWeekly);
    const numTrailerWeekly = safeNum(trailerWeekly);
    const numCargoWeekly = safeNum(cargoWeekly);
    const numBobtailMonthly = safeNum(bobtailMonthly);
    const numTripPackMonthly = safeNum(tripPackMonthly);
    const numEldMonthly = safeNum(eldMonthly);
    const numYearlyFees = safeNum(yearlyFees);

    const numDispatcherPercent = safeNum(dispatcherPercent);
    const numFactoringPercent = safeNum(factoringPercent);
    const numReservePercent = safeNum(reservePercent);

    const numMaintenancePerMile = safeNum(maintenancePerMile);
    const numTiresPerMile = safeNum(tiresPerMile);
    const numMiscPerMile = safeNum(miscPerMile);
    const numTaxPercent = safeNum(taxPercent);
    const numDeadheadMilesPerDay = safeNum(deadheadMilesPerDay);

    const computedLoadedMilesPerDay = numLoadMiles * numLoadsPerDay;
    const loadedMilesPerDay =
      milesInputMode === "manual" ? numMilesPerDay : computedLoadedMilesPerDay;

    const totalMilesPerDay = loadedMilesPerDay + numDeadheadMilesPerDay;
    const projectionDays = projectionMode === "single_load" ? 1 : numProjectionDays;
    const projectedLoadedMiles = loadedMilesPerDay * projectionDays;
    const projectedTotalMiles = totalMilesPerDay * projectionDays;

    const manualDailyGross = loadedMilesPerDay * numRatePerMile;
    const useDirectDailyPayout = safeNum(dailyLoadPayout) > 0;
    const dailyGross = useDirectDailyPayout ? safeNum(dailyLoadPayout) : manualDailyGross;
    const projectedGross = dailyGross * projectionDays;

    const splitRevenueDaily = dailyGross * (numSplitPercent / 100);
    const splitRevenueProjected = projectedGross * (numSplitPercent / 100);

    const monthlyToWeekly = (v) => (v * 12) / 52;
    const yearlyToWeekly = (v) => v / 52;

    const ownerOpFixedWeekly =
      numTruckWeekly +
      numTrailerWeekly +
      numCargoWeekly +
      monthlyToWeekly(numBobtailMonthly) +
      monthlyToWeekly(numTripPackMonthly) +
      monthlyToWeekly(numEldMonthly) +
      yearlyToWeekly(numYearlyFees);

    const fuelCostPerMile = numFuelPrice / numMpg;
    const maintenanceCostPerMile = numMaintenancePerMile;
    const tireCostPerMile = numTiresPerMile;
    const miscCostPerMile = numMiscPerMile;

    const ownerOpVariableCostPerMile =
      fuelCostPerMile + maintenanceCostPerMile + tireCostPerMile + miscCostPerMile;

    const dispatcherFeeDaily = dailyGross * (numDispatcherPercent / 100);
    const dispatcherFeeProjected = projectedGross * (numDispatcherPercent / 100);

    const factoringFeeDaily = dailyGross * (numFactoringPercent / 100);
    const factoringFeeProjected = projectedGross * (numFactoringPercent / 100);

    const reserveDaily = dailyGross * (numReservePercent / 100);
    const reserveProjected = projectedGross * (numReservePercent / 100);

    const fixedDailyEquivalent =
      workProfile === "owner_operator" ? ownerOpFixedWeekly / 7 : 0;

    const fixedCostForProjection =
      workProfile === "owner_operator"
        ? costAllocationMode === "full_week" && projectionMode === "single_load"
          ? ownerOpFixedWeekly
          : fixedDailyEquivalent * projectionDays
        : 0;

    const fuelDaily = workProfile === "owner_operator" ? totalMilesPerDay * fuelCostPerMile : 0;
    const fuelProjected =
      workProfile === "owner_operator" ? projectedTotalMiles * fuelCostPerMile : 0;

    const maintenanceDaily =
      workProfile === "owner_operator" ? totalMilesPerDay * maintenanceCostPerMile : 0;
    const maintenanceProjected =
      workProfile === "owner_operator" ? projectedTotalMiles * maintenanceCostPerMile : 0;

    const tiresDaily =
      workProfile === "owner_operator" ? totalMilesPerDay * tireCostPerMile : 0;
    const tiresProjected =
      workProfile === "owner_operator" ? projectedTotalMiles * tireCostPerMile : 0;

    const miscDaily =
      workProfile === "owner_operator" ? totalMilesPerDay * miscCostPerMile : 0;
    const miscProjected =
      workProfile === "owner_operator" ? projectedTotalMiles * miscCostPerMile : 0;

    const variableDaily =
      workProfile === "owner_operator" ? totalMilesPerDay * ownerOpVariableCostPerMile : 0;
    const variableProjected =
      workProfile === "owner_operator" ? projectedTotalMiles * ownerOpVariableCostPerMile : 0;

    const totalDailyCost =
      workProfile === "owner_operator"
        ? fixedDailyEquivalent +
          variableDaily +
          dispatcherFeeDaily +
          factoringFeeDaily +
          reserveDaily
        : 0;

    const totalProjectedCost =
      workProfile === "owner_operator"
        ? fixedCostForProjection +
          variableProjected +
          dispatcherFeeProjected +
          factoringFeeProjected +
          reserveProjected
        : 0;

    const revenueBasisDaily =
      workProfile === "owner_operator" ? splitRevenueDaily : dailyGross;

    const revenueBasisProjected =
      workProfile === "owner_operator" ? splitRevenueProjected : projectedGross;

    const dailyNetToTruckOrDriver = revenueBasisDaily - totalDailyCost;
    const projectedNetToTruckOrDriver = revenueBasisProjected - totalProjectedCost;

    const dailyNetPerDriver =
      workProfile === "owner_operator" && mode === "team"
        ? dailyNetToTruckOrDriver / 2
        : dailyNetToTruckOrDriver;

    const projectedNetPerDriver =
      workProfile === "owner_operator" && mode === "team"
        ? projectedNetToTruckOrDriver / 2
        : projectedNetToTruckOrDriver;

    const dailyAfterTaxPerDriver = dailyNetPerDriver * (1 - numTaxPercent / 100);
    const projectedAfterTaxPerDriver = projectedNetPerDriver * (1 - numTaxPercent / 100);

    const monthlyAfterTaxPerDriver = projectedAfterTaxPerDriver * 4.33;
    const yearlyAfterTaxPerDriver = projectedAfterTaxPerDriver * 52;

    const effectiveRatePerLoadedMile =
      loadedMilesPerDay > 0 ? dailyGross / loadedMilesPerDay : 0;
    const effectiveRatePerTotalMile =
      totalMilesPerDay > 0 ? dailyGross / totalMilesPerDay : 0;

    const deadheadPercent =
      totalMilesPerDay > 0 ? (numDeadheadMilesPerDay / totalMilesPerDay) * 100 : 0;

    const projectedProfitPerLoadedMile =
      projectedLoadedMiles > 0 ? projectedNetPerDriver / projectedLoadedMiles : 0;

    const projectedAfterTaxPerLoadedMile =
      projectedLoadedMiles > 0 ? projectedAfterTaxPerDriver / projectedLoadedMiles : 0;

    const breakEvenRateLoadedMile =
      workProfile === "owner_operator" && projectedLoadedMiles > 0
        ? totalProjectedCost / projectedLoadedMiles / Math.max(numSplitPercent / 100, 0.01)
        : 0;

    const loadQuality =
      dailyAfterTaxPerDriver <= 0
        ? "bad"
        : dailyAfterTaxPerDriver < 250
        ? "weak"
        : dailyAfterTaxPerDriver < 500
        ? "mid"
        : "strong";

    const tierRows =
      workProfile === "owner_operator"
        ? tierPercents.map((pct) => {
            const splitFactor = pct / 100;
            const dailyRevenueAfterSplit = dailyGross * splitFactor;
            const projectedRevenueAfterSplit = projectedGross * splitFactor;

            const tierDailyNet = dailyRevenueAfterSplit - totalDailyCost;
            const tierProjectedNet = projectedRevenueAfterSplit - totalProjectedCost;

            const tierDailyPerDriver = mode === "team" ? tierDailyNet / 2 : tierDailyNet;
            const tierProjectedPerDriver = mode === "team" ? tierProjectedNet / 2 : tierProjectedNet;

            const tierBreakEvenRate =
              projectedLoadedMiles > 0
                ? totalProjectedCost / projectedLoadedMiles / Math.max(splitFactor, 0.01)
                : 0;

            return {
              pct,
              dailyRevenueAfterSplit,
              projectedRevenueAfterSplit,
              tierDailyPerDriver,
              tierProjectedPerDriver,
              tierBreakEvenRate,
            };
          })
        : [];

    return {
      projectionDays,
      loadedMilesPerDay,
      totalMilesPerDay,
      projectedLoadedMiles,
      projectedTotalMiles,
      dailyGross,
      projectedGross,
      splitRevenueDaily,
      splitRevenueProjected,
      fixedDailyEquivalent,
      fixedCostForProjection,
      fuelDaily,
      fuelProjected,
      maintenanceDaily,
      maintenanceProjected,
      tiresDaily,
      tiresProjected,
      miscDaily,
      miscProjected,
      dispatcherFeeDaily,
      dispatcherFeeProjected,
      factoringFeeDaily,
      factoringFeeProjected,
      reserveDaily,
      reserveProjected,
      totalDailyCost,
      totalProjectedCost,
      dailyNetToTruckOrDriver,
      projectedNetToTruckOrDriver,
      dailyNetPerDriver,
      projectedNetPerDriver,
      dailyAfterTaxPerDriver,
      projectedAfterTaxPerDriver,
      monthlyAfterTaxPerDriver,
      yearlyAfterTaxPerDriver,
      effectiveRatePerLoadedMile,
      effectiveRatePerTotalMile,
      deadheadPercent,
      projectedProfitPerLoadedMile,
      projectedAfterTaxPerLoadedMile,
      breakEvenRateLoadedMile,
      loadQuality,
      tierRows,
    };
  }, [
    workProfile,
    mode,
    projectionMode,
    projectionDaysInput,
    milesInputMode,
    costAllocationMode,
    ratePerMile,
    milesPerDay,
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

  const getColor = () => {
    const net = results.dailyAfterTaxPerDriver;
    if (net <= 0) return "from-red-500 via-rose-500 to-red-700";
    if (net < 250) return "from-orange-400 via-amber-400 to-orange-500";
    if (net < 500) return "from-yellow-300 via-amber-400 to-yellow-500";
    if (net < 900) return "from-emerald-400 via-green-400 to-teal-500";
    return "from-sky-400 via-blue-500 to-indigo-600";
  };

  const qualityCard =
    results.loadQuality === "bad"
      ? {
          tone: "red",
          title: "Bad result",
          body: "This setup is losing money or paying too little after costs and tax view.",
        }
      : results.loadQuality === "weak"
      ? {
          tone: "amber",
          title: "Weak result",
          body: "This setup may keep you moving, but the money is thin.",
        }
      : results.loadQuality === "mid"
      ? {
          tone: "amber",
          title: "Decent result",
          body: "This setup works, but there is not much margin for mistakes.",
        }
      : {
          tone: "green",
          title: "Strong result",
          body: "This setup leaves real room after the math is applied.",
        };

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="sticky top-0 z-50 rounded-2xl border border-white/60 bg-white/90 p-3 shadow-md backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900">
              Trucking Profit Calculator
            </div>
            <div className="text-xs text-slate-500">
              {profile?.email || session?.user?.email || "Driver account"} · {plan || "trial"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
  <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
    <ToggleButton
      active={calculatorStyle === "basic"}
      onClick={() => setCalculatorStyle("basic")}
    >
      Basic style
    </ToggleButton>
    <ToggleButton
      active={calculatorStyle === "advanced"}
      onClick={() => setCalculatorStyle("advanced")}
    >
      Advanced style
    </ToggleButton>
  </div>

  {calculatorStyle === "advanced" && (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
      <ToggleButton
        active={workProfile === "owner_operator"}
        onClick={() => setWorkProfile("owner_operator")}
      >
        Owner-Operator
      </ToggleButton>
      <ToggleButton
        active={workProfile === "company_driver"}
        onClick={() => setWorkProfile("company_driver")}
      >
        Company Driver
      </ToggleButton>
    </div>
  )}

  <button
    type="button"
    onClick={() => setIsCalculatorLoaded(true)}
    className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
  >
    Launch
  </button>
  <button
    type="button"
    onClick={() => setIsCalculatorLoaded(false)}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
    Close
  </button>
  <button
    type="button"
    onClick={resetCalculator}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
    Reset
  </button>
</div>
        </div>
      </div>

      {!isCalculatorLoaded ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-md">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Trucking Profit Calculator
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tap Launch in the top bar to open the calculator.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`min-h-screen bg-gradient-to-br ${getColor()} p-3 transition-all duration-500 sm:p-4 md:p-6`}
        >
          <div className="mx-auto max-w-sm space-y-3 px-1 sm:max-w-2xl sm:space-y-5 sm:px-0 xl:max-w-6xl">
            <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
              <div className="text-center sm:text-left">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {calculatorStyle === "basic" ? "Basic calculator" : "Advanced calculator"}
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {calculatorStyle === "basic"
                    ? "Fast calculator for quick load and pay checks."
                    : "Expanded calculator for owner-operators and company drivers with deeper controls."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">Calculator style</div>
                  <div className="text-xs text-slate-500">
                    Choose the simple layout or the full expanded layout.
                  </div>
                </div>

                <div className="inline-flex w-full flex-wrap rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <ToggleButton
                    active={calculatorStyle === "basic"}
                    onClick={() => setCalculatorStyle("basic")}
                  >
                    Basic style
                  </ToggleButton>
                  <ToggleButton
                    active={calculatorStyle === "advanced"}
                    onClick={() => setCalculatorStyle("advanced")}
                  >
                    Advanced style
                  </ToggleButton>
                </div>

                {calculatorStyle === "advanced" && (
                  <div className="pt-1">
                    <div className="mb-2 text-sm font-bold text-slate-900">Work profile</div>
                    <div className="inline-flex w-full flex-wrap rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      <ToggleButton
                        active={workProfile === "owner_operator"}
                        onClick={() => setWorkProfile("owner_operator")}
                      >
                        Owner-Operator
                      </ToggleButton>
                      <ToggleButton
                        active={workProfile === "company_driver"}
                        onClick={() => setWorkProfile("company_driver")}
                      >
                        Company Driver
                      </ToggleButton>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {calculatorStyle === "advanced" && (
              <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
                <div className="mt-0 grid gap-3 xl:grid-cols-4">
                  <AlertCard tone={qualityCard.tone} title={qualityCard.title}>
                    {qualityCard.body}
                  </AlertCard>

                  <AlertCard
                    tone={
                      results.deadheadPercent > 30
                        ? "red"
                        : results.deadheadPercent > 20
                        ? "amber"
                        : "green"
                    }
                    title="Deadhead pressure"
                  >
                    Deadhead is {pctFmt(results.deadheadPercent)} of daily miles.
                  </AlertCard>

                  <AlertCard
                    tone={
                      workProfile === "owner_operator" &&
                      results.breakEvenRateLoadedMile > results.effectiveRatePerLoadedMile
                        ? "red"
                        : "green"
                    }
                    title="Break-even check"
                  >
                    {workProfile === "owner_operator"
                      ? `Break-even loaded rate is ${fmt(results.breakEvenRateLoadedMile)}/mi.`
                      : "Company driver mode focuses on earnings rather than truck break-even."}
                  </AlertCard>

                  <AlertCard tone="slate" title="After-tax view">
                    Daily after-tax is {fmt(results.dailyAfterTaxPerDriver)} and projected after-tax
                    is {fmt(results.projectedAfterTaxPerDriver)}.
                  </AlertCard>
                </div>
              </div>
            )}

            {calculatorStyle === "advanced" && (
              <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      Scenario presets
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Quick stress tests for bad, average, and good weeks.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(scenarioPresets).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyScenario(key)}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          selectedScenario === key
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
              <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Revenue and mileage
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {calculatorStyle === "basic"
                      ? "Fast core inputs."
                      : "Use load math or manual miles. Direct payout overrides rate × miles."}
                  </p>
                </div>

                {calculatorStyle === "advanced" && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      <ToggleButton
                        active={milesInputMode === "load_math"}
                        onClick={() => setMilesInputMode("load_math")}
                      >
                        Load math
                      </ToggleButton>
                      <ToggleButton
                        active={milesInputMode === "manual"}
                        onClick={() => setMilesInputMode("manual")}
                      >
                        Manual miles
                      </ToggleButton>
                    </div>

                    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      <ToggleButton
                        active={projectionMode === "single_load"}
                        onClick={() => setProjectionMode("single_load")}
                      >
                        1 day
                      </ToggleButton>
                      <ToggleButton
                        active={projectionMode === "custom_days"}
                        onClick={() => setProjectionMode("custom_days")}
                      >
                        Custom days
                      </ToggleButton>
                    </div>
                  </div>
                )}

                {calculatorStyle === "advanced" && projectionMode === "custom_days" && (
                  <div className="mt-3">
                    <InputField
                      label="Projection days"
                      value={projectionDaysInput}
                      setValue={setProjectionDaysInput}
                      step="1"
                      min="1"
                      helpText="Use 2, 3, 4, 5, 7, 10, or any number of days."
                    />
                  </div>
                )}

                {calculatorStyle === "advanced" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 2, 3, 5, 7, 14].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          if (d === 1) {
                            setProjectionMode("single_load");
                          } else {
                            setProjectionMode("custom_days");
                            setProjectionDaysInput(d);
                          }
                        }}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                          (d === 1 && projectionMode === "single_load") ||
                          (d !== 1 &&
                            projectionMode === "custom_days" &&
                            Number(projectionDaysInput) === d)
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {d} day{d === 1 ? "" : "s"}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InputField
                    label={workProfile === "company_driver" ? "Pay per mile ($)" : "Rate per mile ($)"}
                    value={ratePerMile}
                    setValue={setRatePerMile}
                  />

                  <InputField
                    label={
                      workProfile === "company_driver"
                        ? "Direct daily pay ($)"
                        : "Direct daily load payout ($)"
                    }
                    value={dailyLoadPayout}
                    setValue={setDailyLoadPayout}
                    helpText={
                      calculatorStyle === "advanced"
                        ? "If above 0, this overrides rate × loaded miles."
                        : ""
                    }
                  />

                  {calculatorStyle === "advanced" && milesInputMode === "load_math" ? (
                    <>
                      <InputField
                        label="Miles per load / run"
                        value={loadMiles}
                        setValue={setLoadMiles}
                        step="1"
                      />
                      <InputField
                        label="Loads per day"
                        value={loadsPerDay}
                        setValue={setLoadsPerDay}
                        step="1"
                      />
                    </>
                  ) : (
                    <InputField
                      label="Loaded miles per day"
                      value={milesPerDay}
                      setValue={setMilesPerDay}
                      step="1"
                    />
                  )}

                  <InputField
                    label="Deadhead miles per day"
                    value={deadheadMilesPerDay}
                    setValue={setDeadheadMilesPerDay}
                    step="1"
                  />

                  <InputField
                    label={calculatorStyle === "basic" ? "Projection days" : "Days per week"}
                    value={calculatorStyle === "basic" ? projectionDaysInput : daysPerWeek}
                    setValue={calculatorStyle === "basic" ? setProjectionDaysInput : setDaysPerWeek}
                    step="1"
                    helpText={
                      calculatorStyle === "advanced" ? "Planning field only." : "How many days to project."
                    }
                  />

                  {workProfile === "owner_operator" && (
                    <InputField
                      label="Split percent (%)"
                      value={splitPercent}
                      setValue={setSplitPercent}
                      step="1"
                    />
                  )}

                  {(calculatorStyle === "basic" || workProfile === "owner_operator") && (
                    <>
                      <InputField
                        label="Fuel price per gallon ($)"
                        value={fuelPrice}
                        setValue={setFuelPrice}
                      />
                      <InputField
                        label="MPG"
                        value={mpg}
                        setValue={setMpg}
                        step="0.1"
                        min="0.1"
                      />
                    </>
                  )}

                  {calculatorStyle === "advanced" && workProfile === "owner_operator" && (
                    <>
                      <InputField
                        label="Dispatcher fee (%)"
                        value={dispatcherPercent}
                        setValue={setDispatcherPercent}
                        step="0.1"
                      />
                      <InputField
                        label="Factoring fee (%)"
                        value={factoringPercent}
                        setValue={setFactoringPercent}
                        step="0.1"
                      />
                    </>
                  )}
                </div>
              </div>

              {calculatorStyle === "advanced" && workProfile === "owner_operator" ? (
                <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      Owner-operator costs
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">Full operating cost stack.</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      <ToggleButton
                        active={costAllocationMode === "spread"}
                        onClick={() => setCostAllocationMode("spread")}
                      >
                        Spread fixed cost
                      </ToggleButton>
                      <ToggleButton
                        active={costAllocationMode === "full_week"}
                        onClick={() => setCostAllocationMode("full_week")}
                      >
                        Full-week fixed
                      </ToggleButton>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InputField
                      label="Maintenance per mile ($)"
                      value={maintenancePerMile}
                      setValue={setMaintenancePerMile}
                      step="0.01"
                    />
                    <InputField
                      label="Tires per mile ($)"
                      value={tiresPerMile}
                      setValue={setTiresPerMile}
                      step="0.01"
                    />
                    <InputField
                      label="Misc per mile ($)"
                      value={miscPerMile}
                      setValue={setMiscPerMile}
                      step="0.01"
                    />
                    <InputField
                      label="Tax view (%)"
                      value={taxPercent}
                      setValue={setTaxPercent}
                      step="1"
                    />
                    <InputField
                      label="Reserve percent (%)"
                      value={reservePercent}
                      setValue={setReservePercent}
                      step="0.1"
                    />
                    <InputField
                      label="Truck weekly ($)"
                      value={truckWeekly}
                      setValue={setTruckWeekly}
                    />
                    <InputField
                      label="Trailer weekly ($)"
                      value={trailerWeekly}
                      setValue={setTrailerWeekly}
                    />
                    <InputField
                      label="Cargo insurance weekly ($)"
                      value={cargoWeekly}
                      setValue={setCargoWeekly}
                    />
                    <InputField
                      label="Bobtail monthly ($)"
                      value={bobtailMonthly}
                      setValue={setBobtailMonthly}
                    />
                    <InputField
                      label="Trip pack monthly ($)"
                      value={tripPackMonthly}
                      setValue={setTripPackMonthly}
                    />
                    <InputField
                      label="ELD monthly ($)"
                      value={eldMonthly}
                      setValue={setEldMonthly}
                    />
                    <InputField
                      label="Yearly fees ($)"
                      value={yearlyFees}
                      setValue={setYearlyFees}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      {workProfile === "company_driver" ? "Company driver view" : "Quick summary"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {workProfile === "company_driver"
                        ? "In company driver mode, truck operating costs are excluded and the calculator focuses on earnings."
                        : "Basic style keeps the calculation clean and fast."}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-4">
                      <span>Projection days</span>
                      <span className="font-medium">{results.projectionDays}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Daily gross</span>
                      <span className="font-medium">{fmt(results.dailyGross)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Projected gross</span>
                      <span className="font-medium">{fmt(results.projectedGross)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Daily after tax</span>
                      <span className="font-medium">{fmt(results.dailyAfterTaxPerDriver)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 font-semibold text-slate-900">
                      <span>Projected after tax</span>
                      <span>{fmt(results.projectedAfterTaxPerDriver)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard
                label="Loaded miles / day"
                value={results.loadedMilesPerDay.toLocaleString()}
                sublabel={`Total daily miles: ${results.totalMilesPerDay.toLocaleString()}`}
              />
              <StatCard
                dark
                label="Projection days"
                value={results.projectionDays.toLocaleString()}
                sublabel={calculatorStyle === "basic" ? "Basic projection" : "Advanced projection"}
              />
              <StatCard
                label="Projected loaded miles"
                value={results.projectedLoadedMiles.toLocaleString()}
                sublabel={`Projected total miles: ${results.projectedTotalMiles.toLocaleString()}`}
              />
              <StatCard
                label="Projected gross"
                value={fmt(results.projectedGross)}
                sublabel={`Loaded rate: ${fmt(results.effectiveRatePerLoadedMile)}/mi`}
              />
              <StatCard
                label={workProfile === "owner_operator" ? "Projected after split" : "Projected pay"}
                value={
                  workProfile === "owner_operator"
                    ? fmt(results.splitRevenueProjected)
                    : fmt(results.projectedGross)
                }
                sublabel={`Total-mile rate: ${fmt(results.effectiveRatePerTotalMile)}/mi`}
              />
              <StatCard
                label={workProfile === "owner_operator" ? "Break-even rate" : "After-tax projected"}
                value={
                  workProfile === "owner_operator"
                    ? `${fmt(results.breakEvenRateLoadedMile)}/mi`
                    : fmt(results.projectedAfterTaxPerDriver)
                }
                sublabel={workProfile === "owner_operator" ? "Loaded mile basis" : "Driver take-home"}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
              <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
                <h3 className="text-lg font-bold tracking-tight text-slate-900">Daily view</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <span>Daily gross</span>
                    <span className="font-medium">{fmt(results.dailyGross)}</span>
                  </div>

                  {workProfile === "owner_operator" && (
                    <div className="flex items-center justify-between gap-4">
                      <span>Daily after split</span>
                      <span className="font-medium">{fmt(results.splitRevenueDaily)}</span>
                    </div>
                  )}

                  {workProfile === "owner_operator" && (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <span>Fuel daily</span>
                        <span className="font-medium">{fmt(results.fuelDaily)}</span>
                      </div>
                      {calculatorStyle === "advanced" && (
                        <>
                          <div className="flex items-center justify-between gap-4">
                            <span>Maintenance daily</span>
                            <span className="font-medium">{fmt(results.maintenanceDaily)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Tires daily</span>
                            <span className="font-medium">{fmt(results.tiresDaily)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Misc daily</span>
                            <span className="font-medium">{fmt(results.miscDaily)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Fixed daily</span>
                            <span className="font-medium">{fmt(results.fixedDailyEquivalent)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Dispatcher daily</span>
                            <span className="font-medium">{fmt(results.dispatcherFeeDaily)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Factoring daily</span>
                            <span className="font-medium">{fmt(results.factoringFeeDaily)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Reserve daily</span>
                            <span className="font-medium">{fmt(results.reserveDaily)}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 font-semibold text-slate-900">
                    <span>
                      {workProfile === "owner_operator"
                        ? mode === "team"
                          ? "Daily net to truck"
                          : "Daily net"
                        : "Daily pay"}
                    </span>
                    <span>{fmt(results.dailyNetToTruckOrDriver)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 font-semibold text-slate-900">
                    <span>
                      {workProfile === "owner_operator" && mode === "team"
                        ? "Daily per driver"
                        : "Daily after tax"}
                    </span>
                    <span>
                      {workProfile === "owner_operator" && mode === "team"
                        ? fmt(results.dailyNetPerDriver)
                        : fmt(results.dailyAfterTaxPerDriver)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
                <h3 className="text-lg font-bold tracking-tight text-slate-900">
                  Projected breakdown
                </h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <span>Projected gross</span>
                    <span className="font-medium">{fmt(results.projectedGross)}</span>
                  </div>

                  {workProfile === "owner_operator" && (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <span>Fixed in projection</span>
                        <span className="font-medium">{fmt(results.fixedCostForProjection)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Fuel projected</span>
                        <span className="font-medium">{fmt(results.fuelProjected)}</span>
                      </div>
                      {calculatorStyle === "advanced" && (
                        <>
                          <div className="flex items-center justify-between gap-4">
                            <span>Maintenance projected</span>
                            <span className="font-medium">{fmt(results.maintenanceProjected)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Tires projected</span>
                            <span className="font-medium">{fmt(results.tiresProjected)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Misc projected</span>
                            <span className="font-medium">{fmt(results.miscProjected)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Dispatcher projected</span>
                            <span className="font-medium">{fmt(results.dispatcherFeeProjected)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Factoring projected</span>
                            <span className="font-medium">{fmt(results.factoringFeeProjected)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Reserve projected</span>
                            <span className="font-medium">{fmt(results.reserveProjected)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 font-semibold text-slate-900">
                        <span>Total projected cost</span>
                        <span>{fmt(results.totalProjectedCost)}</span>
                      </div>
                    </>
                  )}

                  {workProfile === "company_driver" && (
                    <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                      Company driver mode excludes truck operating costs and focuses on pay projection.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5 lg:col-span-1">
                <h3 className="text-lg font-bold tracking-tight text-slate-900">
                  Final take-home
                </h3>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {workProfile === "owner_operator"
                        ? mode === "team"
                          ? "Projected net to truck"
                          : "Projected net"
                        : "Projected pay"}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-slate-900">
                      {fmt(results.projectedNetToTruckOrDriver)}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-900 p-5 text-white">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                      {workProfile === "owner_operator" && mode === "team"
                        ? "Projected per driver"
                        : "Projected after tax"}
                    </div>
                    <div className="mt-2 text-3xl font-bold">
                      {workProfile === "owner_operator" && mode === "team"
                        ? fmt(results.projectedNetPerDriver)
                        : fmt(results.projectedAfterTaxPerDriver)}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                      Extended view
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-900">
                      {fmt(results.projectedAfterTaxPerDriver)}
                    </div>
                    <div className="mt-2 text-sm text-emerald-800">
                      Monthly: {fmt(results.monthlyAfterTaxPerDriver)}
                    </div>
                    <div className="text-sm text-emerald-800">
                      Yearly: {fmt(results.yearlyAfterTaxPerDriver)}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    Profit per loaded mile: {fmt(results.projectedProfitPerLoadedMile)}/mi
                    <br />
                    After-tax per loaded mile: {fmt(results.projectedAfterTaxPerLoadedMile)}/mi
                  </div>
                </div>
              </div>
            </div>

            {calculatorStyle === "advanced" && workProfile === "owner_operator" && (
              <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">
                      Tier comparison
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Same load and cost inputs across payout tiers.
                    </p>
                  </div>
                </div>

                <div className="mt-5 hidden overflow-x-auto rounded-2xl md:block">
                  <table className="min-w-[900px] overflow-hidden rounded-2xl border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 text-left text-sm text-slate-600">
                        <th className="px-4 py-3 font-semibold">Tier</th>
                        <th className="px-4 py-3 font-semibold">Daily after split</th>
                        <th className="px-4 py-3 font-semibold">Daily per driver</th>
                        <th className="px-4 py-3 font-semibold">Projected after split</th>
                        <th className="px-4 py-3 font-semibold">Break-even rate</th>
                        <th className="px-4 py-3 font-semibold">
                          {mode === "team" ? "Projected per driver" : "Projected take-home"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.tierRows.map((row) => (
                        <tr key={row.pct} className="border-t border-slate-200 text-sm text-slate-800">
                          <td className="px-4 py-3 font-semibold">{row.pct}%</td>
                          <td className="px-4 py-3">{fmt(row.dailyRevenueAfterSplit)}</td>
                          <td className="px-4 py-3">{fmt(row.tierDailyPerDriver)}</td>
                          <td className="px-4 py-3">{fmt(row.projectedRevenueAfterSplit)}</td>
                          <td className="px-4 py-3">{fmt(row.tierBreakEvenRate)}/mi</td>
                          <td className="px-4 py-3 font-semibold">
                            {fmt(row.tierProjectedPerDriver)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 grid gap-3 md:hidden">
                  {results.tierRows.map((row) => (
                    <div
                      key={row.pct}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-base font-bold text-slate-900">{row.pct}% tier</div>
                        <div className="text-sm font-semibold text-slate-600">
                          {fmt(row.tierBreakEvenRate)}/mi
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div>
                          <div className="text-slate-500">Daily after split</div>
                          <div className="font-semibold text-slate-900">
                            {fmt(row.dailyRevenueAfterSplit)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Daily per driver</div>
                          <div className="font-semibold text-slate-900">
                            {fmt(row.tierDailyPerDriver)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Projected after split</div>
                          <div className="font-semibold text-slate-900">
                            {fmt(row.projectedRevenueAfterSplit)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">
                            {mode === "team" ? "Projected per driver" : "Projected take-home"}
                          </div>
                          <div className="font-semibold text-slate-900">
                            {fmt(row.tierProjectedPerDriver)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
