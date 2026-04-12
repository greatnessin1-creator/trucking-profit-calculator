import { useEffect, useMemo, useState } from "react";

const InputField = ({ label, value, setValue, step = "0.01", min = "0" }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <input
      type="number"
      value={value}
      min={min}
      step={step}
      onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
      className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-base shadow-sm outline-none focus:border-slate-500 sm:px-4"
    />
  </label>
);

const DEFAULTS = {
  mode: "team",
  calcViewMode: "project_week",
  milesInputMode: "load_math",
  ratePerMile: 5.0,
  milesPerDay: 500,
  daysPerWeek: 7,
  splitPercent: 75,
  fuelPrice: 5.5,
  mpg: 6.5,
  truckWeekly: 700,
  trailerWeekly: 335,
  cargoWeekly: 295,
  bobtailMonthly: 570,
  tripPackMonthly: 50,
  eldMonthly: 150,
  yearlyFees: 2500,
  loadMiles: 400,
  loadsPerDay: 1,
  dailyLoadPayout: 0,
  deadheadMilesPerDay: 0,
};

const tierPercents = [75, 82, 88, 92];

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

export default function TruckingProfitCalculator() {
  const [isCalculatorLoaded, setIsCalculatorLoaded] = useState(false);
  const [mode, setMode] = useState(DEFAULTS.mode);
  const [calcViewMode, setCalcViewMode] = useState(DEFAULTS.calcViewMode);
  const [milesInputMode, setMilesInputMode] = useState(DEFAULTS.milesInputMode);
  const [ratePerMile, setRatePerMile] = useState(DEFAULTS.ratePerMile);
  const [milesPerDay, setMilesPerDay] = useState(DEFAULTS.milesPerDay);
  const [daysPerWeek, setDaysPerWeek] = useState(DEFAULTS.daysPerWeek);
  const [splitPercent, setSplitPercent] = useState(DEFAULTS.splitPercent);
  const [fuelPrice, setFuelPrice] = useState(DEFAULTS.fuelPrice);
  const [mpg, setMpg] = useState(DEFAULTS.mpg);
  const [truckWeekly, setTruckWeekly] = useState(DEFAULTS.truckWeekly);
  const [trailerWeekly, setTrailerWeekly] = useState(DEFAULTS.trailerWeekly);
  const [cargoWeekly, setCargoWeekly] = useState(DEFAULTS.cargoWeekly);
  const [bobtailMonthly, setBobtailMonthly] = useState(DEFAULTS.bobtailMonthly);
  const [tripPackMonthly, setTripPackMonthly] = useState(DEFAULTS.tripPackMonthly);
  const [eldMonthly, setEldMonthly] = useState(DEFAULTS.eldMonthly);
  const [yearlyFees, setYearlyFees] = useState(DEFAULTS.yearlyFees);
  const [loadMiles, setLoadMiles] = useState(DEFAULTS.loadMiles);
  const [loadsPerDay, setLoadsPerDay] = useState(DEFAULTS.loadsPerDay);
  const [dailyLoadPayout, setDailyLoadPayout] = useState(DEFAULTS.dailyLoadPayout);
  const [deadheadMilesPerDay, setDeadheadMilesPerDay] = useState(DEFAULTS.deadheadMilesPerDay);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("trucking_profit_calculator_state_v1");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.isCalculatorLoaded !== undefined) setIsCalculatorLoaded(saved.isCalculatorLoaded);
      if (saved.mode) setMode(saved.mode);
      if (saved.calcViewMode) setCalcViewMode(saved.calcViewMode);
      if (saved.milesInputMode) setMilesInputMode(saved.milesInputMode);
      if (saved.ratePerMile !== undefined) setRatePerMile(saved.ratePerMile);
      if (saved.milesPerDay !== undefined) setMilesPerDay(saved.milesPerDay);
      if (saved.daysPerWeek !== undefined) setDaysPerWeek(saved.daysPerWeek);
      if (saved.splitPercent !== undefined) setSplitPercent(saved.splitPercent);
      if (saved.fuelPrice !== undefined) setFuelPrice(saved.fuelPrice);
      if (saved.mpg !== undefined) setMpg(saved.mpg);
      if (saved.truckWeekly !== undefined) setTruckWeekly(saved.truckWeekly);
      if (saved.trailerWeekly !== undefined) setTrailerWeekly(saved.trailerWeekly);
      if (saved.cargoWeekly !== undefined) setCargoWeekly(saved.cargoWeekly);
      if (saved.bobtailMonthly !== undefined) setBobtailMonthly(saved.bobtailMonthly);
      if (saved.tripPackMonthly !== undefined) setTripPackMonthly(saved.tripPackMonthly);
      if (saved.eldMonthly !== undefined) setEldMonthly(saved.eldMonthly);
      if (saved.yearlyFees !== undefined) setYearlyFees(saved.yearlyFees);
      if (saved.loadMiles !== undefined) setLoadMiles(saved.loadMiles);
      if (saved.loadsPerDay !== undefined) setLoadsPerDay(saved.loadsPerDay);
      if (saved.dailyLoadPayout !== undefined) setDailyLoadPayout(saved.dailyLoadPayout);
      if (saved.deadheadMilesPerDay !== undefined) setDeadheadMilesPerDay(saved.deadheadMilesPerDay);
    } catch {
      // ignore invalid saved state
    }
  }, []);

  useEffect(() => {
    const payload = {
      isCalculatorLoaded,
      mode,
      calcViewMode,
      milesInputMode,
      ratePerMile,
      milesPerDay,
      daysPerWeek,
      splitPercent,
      fuelPrice,
      mpg,
      truckWeekly,
      trailerWeekly,
      cargoWeekly,
      bobtailMonthly,
      tripPackMonthly,
      eldMonthly,
      yearlyFees,
      loadMiles,
      loadsPerDay,
      dailyLoadPayout,
      deadheadMilesPerDay,
    };
    localStorage.setItem("trucking_profit_calculator_state_v1", JSON.stringify(payload));
  }, [
    isCalculatorLoaded,
    mode,
    calcViewMode,
    milesInputMode,
    ratePerMile,
    milesPerDay,
    daysPerWeek,
    splitPercent,
    fuelPrice,
    mpg,
    truckWeekly,
    trailerWeekly,
    cargoWeekly,
    bobtailMonthly,
    tripPackMonthly,
    eldMonthly,
    yearlyFees,
    loadMiles,
    loadsPerDay,
    dailyLoadPayout,
    deadheadMilesPerDay,
  ]);

  const resetCalculator = () => {
    setIsCalculatorLoaded(true);
    setMode(DEFAULTS.mode);
    setCalcViewMode(DEFAULTS.calcViewMode);
    setMilesInputMode(DEFAULTS.milesInputMode);
    setRatePerMile(DEFAULTS.ratePerMile);
    setMilesPerDay(DEFAULTS.milesPerDay);
    setDaysPerWeek(DEFAULTS.daysPerWeek);
    setSplitPercent(DEFAULTS.splitPercent);
    setFuelPrice(DEFAULTS.fuelPrice);
    setMpg(DEFAULTS.mpg);
    setTruckWeekly(DEFAULTS.truckWeekly);
    setTrailerWeekly(DEFAULTS.trailerWeekly);
    setCargoWeekly(DEFAULTS.cargoWeekly);
    setBobtailMonthly(DEFAULTS.bobtailMonthly);
    setTripPackMonthly(DEFAULTS.tripPackMonthly);
    setEldMonthly(DEFAULTS.eldMonthly);
    setYearlyFees(DEFAULTS.yearlyFees);
    setLoadMiles(DEFAULTS.loadMiles);
    setLoadsPerDay(DEFAULTS.loadsPerDay);
    setDailyLoadPayout(DEFAULTS.dailyLoadPayout);
    setDeadheadMilesPerDay(DEFAULTS.deadheadMilesPerDay);
    localStorage.removeItem("trucking_profit_calculator_state_v1");
  };

  const results = useMemo(() => {
    const computedLoadedMilesPerDay = Number(loadMiles) * Number(loadsPerDay);
    const loadedMilesPerDay =
      milesInputMode === "manual" ? Number(milesPerDay) : computedLoadedMilesPerDay;
    const totalMilesPerDay = loadedMilesPerDay + Number(deadheadMilesPerDay);
    const activeDaysPerWeek = Math.max(Number(daysPerWeek) || 0, 1);
    const projectionDays = calcViewMode === "single_load" ? 1 : activeDaysPerWeek;
    const weeklyLoadedMiles = loadedMilesPerDay * projectionDays;
    const weeklyMiles = totalMilesPerDay * projectionDays;
    const manualDailyGross = loadedMilesPerDay * Number(ratePerMile);
    const useDirectDailyPayout = Number(dailyLoadPayout) > 0;
    const dailyGross = useDirectDailyPayout ? Number(dailyLoadPayout) : manualDailyGross;
    const gross = dailyGross * projectionDays;
    const splitRevenue = gross * (Number(splitPercent) / 100);

    const monthlyToWeekly = (v) => (Number(v) * 12) / 52;
    const yearlyToWeekly = (v) => Number(v) / 52;

    const fixedWeekly =
      Number(truckWeekly) +
      Number(trailerWeekly) +
      Number(cargoWeekly) +
      monthlyToWeekly(bobtailMonthly) +
      monthlyToWeekly(tripPackMonthly) +
      monthlyToWeekly(eldMonthly) +
      yearlyToWeekly(yearlyFees);

    const fuelCostPerMile = Number(fuelPrice) / Number(mpg || 1);
    const deadheadMilesWeekly = Number(deadheadMilesPerDay) * Number(daysPerWeek);
    const loadedFuelDaily = loadedMilesPerDay * fuelCostPerMile;
    const deadheadFuelDaily = Number(deadheadMilesPerDay) * fuelCostPerMile;
    const fuelDaily = totalMilesPerDay * fuelCostPerMile;
    const loadedFuelWeekly = weeklyLoadedMiles * fuelCostPerMile;
    const deadheadFuelWeekly = deadheadMilesWeekly * fuelCostPerMile;
    const fuelWeekly = weeklyMiles * fuelCostPerMile;
    const fixedDailyEquivalent = fixedWeekly / 7;
    const totalDailyCost = fixedDailyEquivalent + fuelDaily;
    const fixedCostForProjection = fixedDailyEquivalent * projectionDays;
    const totalWeeklyCost = fixedCostForProjection + fuelWeekly;
    const dailySplitRevenue = dailyGross * (Number(splitPercent) / 100);
    const dailyNet = dailySplitRevenue - totalDailyCost;
    const dailyPerDriverNet = mode === "team" ? dailyNet / 2 : dailyNet;
    const teamNet = splitRevenue - totalWeeklyCost;
    const perDriverNet = mode === "team" ? teamNet / 2 : teamNet;
    const effectiveRatePerLoadedMile = loadedMilesPerDay > 0 ? dailyGross / loadedMilesPerDay : 0;
    const effectiveRatePerTotalMile = totalMilesPerDay > 0 ? dailyGross / totalMilesPerDay : 0;
    const breakEvenRate =
      weeklyLoadedMiles > 0
        ? (fuelCostPerMile * weeklyMiles + fixedCostForProjection) /
          weeklyLoadedMiles /
          (Number(splitPercent) / 100)
        : 0;

    const tierRows = tierPercents.map((pct) => {
      const dailyRevenueAfterSplit = dailyGross * (pct / 100);
      const revenueAfterSplit = gross * (pct / 100);
      const tierDailyNet = dailyRevenueAfterSplit - totalDailyCost;
      const tierTeamNet = revenueAfterSplit - totalWeeklyCost;
      const tierDailyPerDriverNet = mode === "team" ? tierDailyNet / 2 : tierDailyNet;
      const tierPerDriverNet = mode === "team" ? tierTeamNet / 2 : tierTeamNet;
      const tierBreakEvenRate =
        weeklyLoadedMiles > 0
          ? (fuelCostPerMile * weeklyMiles + fixedCostForProjection) /
            weeklyLoadedMiles /
            (pct / 100)
          : 0;
      return {
        pct,
        dailyRevenueAfterSplit,
        tierDailyNet,
        tierDailyPerDriverNet,
        revenueAfterSplit,
        tierTeamNet,
        tierPerDriverNet,
        tierBreakEvenRate,
      };
    });

    return {
      projectionDays,
      loadedMilesPerDay,
      totalMilesPerDay,
      weeklyLoadedMiles,
      weeklyMiles,
      deadheadMilesWeekly,
      effectiveRatePerLoadedMile,
      effectiveRatePerTotalMile,
      dailyGross,
      gross,
      splitRevenue,
      fixedWeekly,
      fixedDailyEquivalent,
      fixedCostForProjection,
      fuelCostPerMile,
      loadedFuelDaily,
      deadheadFuelDaily,
      fuelDaily,
      loadedFuelWeekly,
      deadheadFuelWeekly,
      fuelWeekly,
      totalDailyCost,
      totalWeeklyCost,
      dailySplitRevenue,
      dailyNet,
      dailyPerDriverNet,
      teamNet,
      perDriverNet,
      breakEvenRate,
      tierRows,
    };
  }, [
    mode,
    calcViewMode,
    milesInputMode,
    ratePerMile,
    milesPerDay,
    loadMiles,
    loadsPerDay,
    daysPerWeek,
    splitPercent,
    dailyLoadPayout,
    deadheadMilesPerDay,
    fuelPrice,
    mpg,
    truckWeekly,
    trailerWeekly,
    cargoWeekly,
    bobtailMonthly,
    tripPackMonthly,
    eldMonthly,
    yearlyFees,
  ]);

  const getColor = () => {
    const net = results.dailyPerDriverNet;
    if (net <= 0) return "from-red-500 to-red-700";
    if (net < 300) return "from-orange-400 to-orange-600";
    if (net < 700) return "from-yellow-400 to-yellow-600";
    if (net < 1200) return "from-green-400 to-green-600";
    return "from-blue-400 to-blue-600";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="sticky top-0 z-50 rounded-3xl bg-white/95 p-3 shadow-sm backdrop-blur sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Trucking Profit Calculator</div>
            <div className="text-xs text-slate-500">Mobile control bar</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsCalculatorLoaded(true)}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Launch
            </button>
            <button
              onClick={() => setIsCalculatorLoaded(false)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            >
              Close
            </button>
            <button
              onClick={resetCalculator}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {!isCalculatorLoaded ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-slate-900">Trucking Profit Calculator</h1>
            <p className="mt-3 text-sm text-slate-600">
              Tap Launch in the top bar to open the calculator.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`min-h-screen bg-gradient-to-br ${getColor()} p-3 sm:p-4 md:p-8 transition-all duration-500`}
        >
          <div className="mx-auto max-w-md space-y-4 sm:max-w-2xl sm:space-y-6 xl:max-w-6xl">
            <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Trucking Profit Calculator
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Tap in your load rate or exact daily payout, choose either load math or manual
                    miles, then see daily and weekly take-home instantly.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-2xl border border-slate-300 bg-slate-50 p-1">
                    <button
                      onClick={() => setMode("solo")}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "solo" ? "bg-slate-900 text-white" : "text-slate-700"}`}
                    >
                      Solo
                    </button>
                    <button
                      onClick={() => setMode("team")}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "team" ? "bg-slate-900 text-white" : "text-slate-700"}`}
                    >
                      Team
                    </button>
                  </div>
                  <button
                    onClick={resetCalculator}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
              <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Load inputs</h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <div className="inline-flex rounded-2xl border border-slate-300 bg-slate-50 p-1">
                      <button
                        onClick={() => setMilesInputMode("load_math")}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${milesInputMode === "load_math" ? "bg-slate-900 text-white" : "text-slate-700"}`}
                      >
                        Use load math
                      </button>
                      <button
                        onClick={() => setMilesInputMode("manual")}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${milesInputMode === "manual" ? "bg-slate-900 text-white" : "text-slate-700"}`}
                      >
                        Use manual miles
                      </button>
                    </div>
                    <div className="inline-flex rounded-2xl border border-slate-300 bg-slate-50 p-1">
                      <button
                        onClick={() => setCalcViewMode("single_load")}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${calcViewMode === "single_load" ? "bg-slate-900 text-white" : "text-slate-700"}`}
                      >
                        Single load
                      </button>
                      <button
                        onClick={() => setCalcViewMode("project_week")}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${calcViewMode === "project_week" ? "bg-slate-900 text-white" : "text-slate-700"}`}
                      >
                        Project into week
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <InputField label="Rate per mile ($)" value={ratePerMile} setValue={setRatePerMile} />
                  <InputField
                    label="Direct daily load payout ($)"
                    value={dailyLoadPayout}
                    setValue={setDailyLoadPayout}
                  />
                  {milesInputMode === "load_math" ? (
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
                      label="Manual loaded miles per day"
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
                    label="Days per week"
                    value={daysPerWeek}
                    setValue={setDaysPerWeek}
                    step="1"
                  />
                  <InputField
                    label="Split percent (%)"
                    value={splitPercent}
                    setValue={setSplitPercent}
                    step="1"
                  />
                  <InputField
                    label="Fuel price per gallon ($)"
                    value={fuelPrice}
                    setValue={setFuelPrice}
                  />
                  <InputField label="MPG" value={mpg} setValue={setMpg} step="0.1" min="0.1" />
                </div>
              </div>

              <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Fixed costs</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <InputField label="Truck weekly ($)" value={truckWeekly} setValue={setTruckWeekly} />
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
                  <InputField label="ELD monthly ($)" value={eldMonthly} setValue={setEldMonthly} />
                  <InputField label="Yearly fees ($)" value={yearlyFees} setValue={setYearlyFees} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 xl:gap-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">Daily loaded miles</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {results.loadedMilesPerDay.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Total w/ deadhead: {results.totalMilesPerDay.toLocaleString()}
                </div>
              </div>
              <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm">
                <div className="text-sm text-slate-300">Projected loaded miles</div>
                <div className="mt-2 text-3xl font-bold">
                  {results.weeklyLoadedMiles.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  {results.projectionDays} day{results.projectionDays === 1 ? "" : "s"} · Total w/
                  deadhead: {results.weeklyMiles.toLocaleString()}
                </div>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">Projected revenue</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{fmt(results.gross)}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Loaded rate: {fmt(results.effectiveRatePerLoadedMile)}/mi · Total rate:{" "}
                  {fmt(results.effectiveRatePerTotalMile)}/mi
                </div>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">Projected after split</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {fmt(results.splitRevenue)}
                </div>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">Break-even rate</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {fmt(results.breakEvenRate)}/mi
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
              <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
                <h3 className="text-lg font-semibold text-slate-900">Daily load view</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Daily gross</span>
                    <span>{fmt(results.dailyGross)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Daily revenue after split</span>
                    <span>{fmt(results.dailySplitRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fixed daily cost (1/7)</span>
                    <span>{fmt(results.fixedDailyEquivalent)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Deadhead miles daily</span>
                    <span>{results.totalMilesPerDay - results.loadedMilesPerDay}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Loaded fuel daily</span>
                    <span>{fmt(results.loadedFuelDaily)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Deadhead fuel daily</span>
                    <span>{fmt(results.deadheadFuelDaily)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total fuel daily</span>
                    <span>{fmt(results.fuelDaily)}</span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between font-semibold text-slate-900">
                    <span>Daily net to {mode === "team" ? "team" : "driver"}</span>
                    <span>{fmt(results.dailyNet)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{mode === "team" ? "Daily net per driver" : "Daily take-home"}</span>
                    <span>{fmt(results.dailyPerDriverNet)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
                <h3 className="text-lg font-semibold text-slate-900">Projected cost breakdown</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Fixed weekly</span>
                    <span>{fmt(results.fixedWeekly)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fixed daily (1/7)</span>
                    <span>{fmt(results.fixedDailyEquivalent)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fixed in projection</span>
                    <span>{fmt(results.fixedCostForProjection)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fuel per mile</span>
                    <span>{fmt(results.fuelCostPerMile)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Loaded fuel weekly</span>
                    <span>{fmt(results.loadedFuelWeekly)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Deadhead fuel weekly</span>
                    <span>{fmt(results.deadheadFuelWeekly)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total fuel weekly</span>
                    <span>{fmt(results.fuelWeekly)}</span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between font-semibold text-slate-900">
                    <span>Total weekly cost</span>
                    <span>{fmt(results.totalWeeklyCost)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900">Projected take-home</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2 md:gap-4">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <div className="text-sm text-slate-500">
                      Net to {mode === "team" ? "team" : "driver"}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-slate-900">
                      {fmt(results.teamNet)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-5 text-white">
                    <div className="text-sm text-slate-300">
                      {mode === "team" ? "Net per driver" : "Net take-home"}
                    </div>
                    <div className="mt-2 text-3xl font-bold">{fmt(results.perDriverNet)}</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  {calcViewMode === "single_load"
                    ? "Single load mode evaluates one day only while still spreading fixed cost as 1/7 so you can judge that load cleanly."
                    : mode === "team"
                      ? "Project into week repeats this same load pattern across the number of days entered and splits the final net in half per driver."
                      : "Project into week repeats this same load pattern across the number of days entered to show full projected take-home."}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Tier comparison</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    See all four payout tiers side by side using the same load, fuel, and cost inputs.
                  </p>
                </div>
              </div>
              <div className="mt-5 hidden overflow-x-auto rounded-2xl md:block">
                <table className="min-w-[900px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-left text-sm text-slate-600">
                      <th className="px-4 py-3 font-semibold">Tier</th>
                      <th className="px-4 py-3 font-semibold">Daily after split</th>
                      <th className="px-4 py-3 font-semibold">Daily net</th>
                      <th className="px-4 py-3 font-semibold">Daily per driver</th>
                      <th className="px-4 py-3 font-semibold">Weekly after split</th>
                      <th className="px-4 py-3 font-semibold">Break-even rate</th>
                      <th className="px-4 py-3 font-semibold">
                        Net to {mode === "team" ? "team" : "driver"}
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        {mode === "team" ? "Net per driver" : "Take-home"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.tierRows.map((row) => (
                      <tr key={row.pct} className="border-t border-slate-200 text-sm text-slate-800">
                        <td className="px-4 py-3 font-semibold">{row.pct}%</td>
                        <td className="px-4 py-3">{fmt(row.dailyRevenueAfterSplit)}</td>
                        <td className="px-4 py-3">{fmt(row.tierDailyNet)}</td>
                        <td className="px-4 py-3">{fmt(row.tierDailyPerDriverNet)}</td>
                        <td className="px-4 py-3">{fmt(row.revenueAfterSplit)}</td>
                        <td className="px-4 py-3">{fmt(row.tierBreakEvenRate)}/mi</td>
                        <td className="px-4 py-3">{fmt(row.tierTeamNet)}</td>
                        <td className="px-4 py-3 font-semibold">{fmt(row.tierPerDriverNet)}</td>
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
                        <div className="text-slate-500">Daily net</div>
                        <div className="font-semibold text-slate-900">{fmt(row.tierDailyNet)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Daily per driver</div>
                        <div className="font-semibold text-slate-900">
                          {fmt(row.tierDailyPerDriverNet)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Projected after split</div>
                        <div className="font-semibold text-slate-900">
                          {fmt(row.revenueAfterSplit)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">
                          Net to {mode === "team" ? "team" : "driver"}
                        </div>
                        <div className="font-semibold text-slate-900">{fmt(row.tierTeamNet)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">
                          {mode === "team" ? "Net per driver" : "Take-home"}
                        </div>
                        <div className="font-semibold text-slate-900">{fmt(row.tierPerDriverNet)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
