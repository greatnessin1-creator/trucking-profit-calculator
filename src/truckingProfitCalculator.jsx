import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "trucking_profit_calculator_basic_v1";

const DEFAULTS = {
  ratePerMile: 2.5,
  loadedMilesPerDay: 500,
  deadheadMilesPerDay: 50,
  projectionDays: 7,
  fuelPrice: 4.25,
  mpg: 6.5,
  splitPercent: 100,
  fixedWeeklyCost: 0,
  taxPercent: 25,
};

const safeNum = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

const InputField = ({ label, value, setValue, step = "0.01", min = "0", helpText = "" }) => (
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
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
    />
    {helpText ? <span className="text-xs text-slate-500">{helpText}</span> : null}
  </label>
);

const StatCard = ({ label, value, sublabel, dark = false }) => (
  <div className={`rounded-2xl p-4 shadow-md ${dark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}>
    <div className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${dark ? "text-slate-300" : "text-slate-500"}`}>
      {label}
    </div>
    <div className="mt-1 text-2xl font-bold">{value}</div>
    {sublabel ? (
      <div className={`mt-1 text-xs ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {sublabel}
      </div>
    ) : null}
  </div>
);

export default function TruckingProfitCalculator({ session, profile, plan }) {
  const [ratePerMile, setRatePerMile] = useState(DEFAULTS.ratePerMile);
  const [loadedMilesPerDay, setLoadedMilesPerDay] = useState(DEFAULTS.loadedMilesPerDay);
  const [deadheadMilesPerDay, setDeadheadMilesPerDay] = useState(DEFAULTS.deadheadMilesPerDay);
  const [projectionDays, setProjectionDays] = useState(DEFAULTS.projectionDays);
  const [fuelPrice, setFuelPrice] = useState(DEFAULTS.fuelPrice);
  const [mpg, setMpg] = useState(DEFAULTS.mpg);
  const [splitPercent, setSplitPercent] = useState(DEFAULTS.splitPercent);
  const [fixedWeeklyCost, setFixedWeeklyCost] = useState(DEFAULTS.fixedWeeklyCost);
  const [taxPercent, setTaxPercent] = useState(DEFAULTS.taxPercent);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);

      if (saved.ratePerMile !== undefined) setRatePerMile(saved.ratePerMile);
      if (saved.loadedMilesPerDay !== undefined) setLoadedMilesPerDay(saved.loadedMilesPerDay);
      if (saved.deadheadMilesPerDay !== undefined) setDeadheadMilesPerDay(saved.deadheadMilesPerDay);
      if (saved.projectionDays !== undefined) setProjectionDays(saved.projectionDays);
      if (saved.fuelPrice !== undefined) setFuelPrice(saved.fuelPrice);
      if (saved.mpg !== undefined) setMpg(saved.mpg);
      if (saved.splitPercent !== undefined) setSplitPercent(saved.splitPercent);
      if (saved.fixedWeeklyCost !== undefined) setFixedWeeklyCost(saved.fixedWeeklyCost);
      if (saved.taxPercent !== undefined) setTaxPercent(saved.taxPercent);
    } catch {
      // ignore broken local storage
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ratePerMile,
        loadedMilesPerDay,
        deadheadMilesPerDay,
        projectionDays,
        fuelPrice,
        mpg,
        splitPercent,
        fixedWeeklyCost,
        taxPercent,
      })
    );
  }, [
    ratePerMile,
    loadedMilesPerDay,
    deadheadMilesPerDay,
    projectionDays,
    fuelPrice,
    mpg,
    splitPercent,
    fixedWeeklyCost,
    taxPercent,
  ]);

  const results = useMemo(() => {
    const loadedMiles = safeNum(loadedMilesPerDay);
    const deadheadMiles = safeNum(deadheadMilesPerDay);
    const days = Math.max(safeNum(projectionDays), 1);
    const rate = safeNum(ratePerMile);
    const fuel = safeNum(fuelPrice);
    const truckMpg = Math.max(safeNum(mpg), 0.1);
    const split = safeNum(splitPercent) / 100;
    const weeklyFixed = safeNum(fixedWeeklyCost);
    const tax = safeNum(taxPercent) / 100;

    const totalMilesPerDay = loadedMiles + deadheadMiles;
    const projectedLoadedMiles = loadedMiles * days;
    const projectedTotalMiles = totalMilesPerDay * days;

    const dailyGross = loadedMiles * rate;
    const projectedGross = dailyGross * days;

    const dailyAfterSplit = dailyGross * split;
    const projectedAfterSplit = projectedGross * split;

    const fuelCostPerMile = fuel / truckMpg;
    const dailyFuelCost = totalMilesPerDay * fuelCostPerMile;
    const projectedFuelCost = projectedTotalMiles * fuelCostPerMile;

    const fixedDailyCost = weeklyFixed / 7;
    const projectedFixedCost = fixedDailyCost * days;

    const dailyNetBeforeTax = dailyAfterSplit - dailyFuelCost - fixedDailyCost;
    const projectedNetBeforeTax = projectedAfterSplit - projectedFuelCost - projectedFixedCost;

    const dailyAfterTax = dailyNetBeforeTax * (1 - tax);
    const projectedAfterTax = projectedNetBeforeTax * (1 - tax);

    const netPerLoadedMile =
      projectedLoadedMiles > 0 ? projectedNetBeforeTax / projectedLoadedMiles : 0;

    const afterTaxPerLoadedMile =
      projectedLoadedMiles > 0 ? projectedAfterTax / projectedLoadedMiles : 0;

    const deadheadPercent =
      totalMilesPerDay > 0 ? (deadheadMiles / totalMilesPerDay) * 100 : 0;

    const breakEvenRate =
      projectedLoadedMiles > 0
        ? (projectedFuelCost + projectedFixedCost) / projectedLoadedMiles / Math.max(split, 0.01)
        : 0;

    return {
      totalMilesPerDay,
      projectedLoadedMiles,
      projectedTotalMiles,
      dailyGross,
      projectedGross,
      dailyAfterSplit,
      projectedAfterSplit,
      fuelCostPerMile,
      dailyFuelCost,
      projectedFuelCost,
      fixedDailyCost,
      projectedFixedCost,
      dailyNetBeforeTax,
      projectedNetBeforeTax,
      dailyAfterTax,
      projectedAfterTax,
      netPerLoadedMile,
      afterTaxPerLoadedMile,
      deadheadPercent,
      breakEvenRate,
    };
  }, [
    ratePerMile,
    loadedMilesPerDay,
    deadheadMilesPerDay,
    projectionDays,
    fuelPrice,
    mpg,
    splitPercent,
    fixedWeeklyCost,
    taxPercent,
  ]);

  const resetCalculator = () => {
    setRatePerMile(DEFAULTS.ratePerMile);
    setLoadedMilesPerDay(DEFAULTS.loadedMilesPerDay);
    setDeadheadMilesPerDay(DEFAULTS.deadheadMilesPerDay);
    setProjectionDays(DEFAULTS.projectionDays);
    setFuelPrice(DEFAULTS.fuelPrice);
    setMpg(DEFAULTS.mpg);
    setSplitPercent(DEFAULTS.splitPercent);
    setFixedWeeklyCost(DEFAULTS.fixedWeeklyCost);
    setTaxPercent(DEFAULTS.taxPercent);
    localStorage.removeItem(STORAGE_KEY);
  };

  const bgColor =
    results.projectedAfterTax <= 0
      ? "from-red-500 via-rose-500 to-red-700"
      : results.projectedAfterTax < 1000
      ? "from-amber-400 via-orange-400 to-orange-500"
      : "from-emerald-400 via-green-400 to-teal-500";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgColor} p-3 sm:p-5`}>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl bg-white/95 p-4 shadow-md backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Trucking Profit Calculator
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Basic load and pay calculator.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {profile?.email || session?.user?.email || "Driver"} · {plan || "basic"}
              </p>
            </div>

            <button
              type="button"
              onClick={resetCalculator}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            dark
            label="Projected after tax"
            value={fmt(results.projectedAfterTax)}
            sublabel={`${projectionDays} day projection`}
          />
          <StatCard
            label="Projected gross"
            value={fmt(results.projectedGross)}
            sublabel={`${results.projectedLoadedMiles.toLocaleString()} loaded miles`}
          />
          <StatCard
            label="Net before tax"
            value={fmt(results.projectedNetBeforeTax)}
            sublabel={`${fmt(results.netPerLoadedMile)}/loaded mile`}
          />
          <StatCard
            label="Break-even rate"
            value={`${fmt(results.breakEvenRate)}/mi`}
            sublabel="Loaded mile basis"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">Inputs</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the basic numbers for the load or work period.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InputField
                label="Rate per mile"
                value={ratePerMile}
                setValue={setRatePerMile}
              />
              <InputField
                label="Loaded miles per day"
                value={loadedMilesPerDay}
                setValue={setLoadedMilesPerDay}
                step="1"
              />
              <InputField
                label="Deadhead miles per day"
                value={deadheadMilesPerDay}
                setValue={setDeadheadMilesPerDay}
                step="1"
              />
              <InputField
                label="Projection days"
                value={projectionDays}
                setValue={setProjectionDays}
                step="1"
                min="1"
              />
              <InputField
                label="Fuel price per gallon"
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
              <InputField
                label="Pay / split percent"
                value={splitPercent}
                setValue={setSplitPercent}
                step="1"
                helpText="Use 100 for company pay or full revenue."
              />
              <InputField
                label="Fixed weekly cost"
                value={fixedWeeklyCost}
                setValue={setFixedWeeklyCost}
                step="1"
                helpText="Truck, insurance, trailer, ELD, etc."
              />
              <InputField
                label="Tax estimate percent"
                value={taxPercent}
                setValue={setTaxPercent}
                step="1"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">Breakdown</h2>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <span>Daily gross</span>
                <span className="font-semibold">{fmt(results.dailyGross)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Projected gross</span>
                <span className="font-semibold">{fmt(results.projectedGross)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Projected after split</span>
                <span className="font-semibold">{fmt(results.projectedAfterSplit)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Fuel cost per mile</span>
                <span className="font-semibold">{fmt(results.fuelCostPerMile)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Projected fuel cost</span>
                <span className="font-semibold">{fmt(results.projectedFuelCost)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Projected fixed cost</span>
                <span className="font-semibold">{fmt(results.projectedFixedCost)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Deadhead percentage</span>
                <span className="font-semibold">{results.deadheadPercent.toFixed(1)}%</span>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between gap-4 font-bold text-slate-900">
                  <span>Net before tax</span>
                  <span>{fmt(results.projectedNetBeforeTax)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-4 font-bold text-slate-900">
                  <span>After-tax estimate</span>
                  <span>{fmt(results.projectedAfterTax)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              This calculator is an estimate only. Actual trucking profit can change from
              fuel, downtime, repairs, deductions, dispatch, factoring, insurance, taxes,
              and carrier settlement terms.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
