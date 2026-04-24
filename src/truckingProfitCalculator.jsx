import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "trucking_profit_calculator_full_v2";

const DEFAULTS = {
  showHelp: false,

  workProfile: "owner_operator",
  driverMode: "solo",
  tripMode: "daily_work",
  milesMode: "load_math",

  ratePerMile: 2.75,
  directDailyPay: 0,
  loadedMilesPerDay: 500,
  loadMiles: 400,
  loadsPerDay: 1,
  deadheadMilesPerDay: 50,
  projectionDays: 7,

  singleLoadPayout: 1800,
  singleLoadMiles: 600,
  singleLoadDeadheadMiles: 75,
  singleLoadDays: 2,

  splitPercent: 100,
  fuelPrice: 4.25,
  mpg: 6.5,

  maintenancePerMile: 0.15,
  tiresPerMile: 0.05,
  miscPerMile: 0.03,

  truckWeekly: 700,
  trailerWeekly: 0,
  insuranceWeekly: 250,
  otherWeekly: 150,

  dispatcherPercent: 0,
  factoringPercent: 0,
  reservePercent: 5,
  taxPercent: 25,
};

const safeNum = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

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
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
    <div className="mt-1 text-2xl font-bold">{value}</div>
    {sublabel ? (
      <div className={`mt-1 text-xs ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {sublabel}
      </div>
    ) : null}
  </div>
);

export default function TruckingProfitCalculator({ session, profile, plan }) {
  const [showHelp, setShowHelp] = useState(DEFAULTS.showHelp);

  const [workProfile, setWorkProfile] = useState(DEFAULTS.workProfile);
  const [driverMode, setDriverMode] = useState(DEFAULTS.driverMode);
  const [tripMode, setTripMode] = useState(DEFAULTS.tripMode);
  const [milesMode, setMilesMode] = useState(DEFAULTS.milesMode);

  const [ratePerMile, setRatePerMile] = useState(DEFAULTS.ratePerMile);
  const [directDailyPay, setDirectDailyPay] = useState(DEFAULTS.directDailyPay);
  const [loadedMilesPerDay, setLoadedMilesPerDay] = useState(DEFAULTS.loadedMilesPerDay);
  const [loadMiles, setLoadMiles] = useState(DEFAULTS.loadMiles);
  const [loadsPerDay, setLoadsPerDay] = useState(DEFAULTS.loadsPerDay);
  const [deadheadMilesPerDay, setDeadheadMilesPerDay] = useState(DEFAULTS.deadheadMilesPerDay);
  const [projectionDays, setProjectionDays] = useState(DEFAULTS.projectionDays);

  const [singleLoadPayout, setSingleLoadPayout] = useState(DEFAULTS.singleLoadPayout);
  const [singleLoadMiles, setSingleLoadMiles] = useState(DEFAULTS.singleLoadMiles);
  const [singleLoadDeadheadMiles, setSingleLoadDeadheadMiles] = useState(
    DEFAULTS.singleLoadDeadheadMiles
  );
  const [singleLoadDays, setSingleLoadDays] = useState(DEFAULTS.singleLoadDays);

  const [splitPercent, setSplitPercent] = useState(DEFAULTS.splitPercent);
  const [fuelPrice, setFuelPrice] = useState(DEFAULTS.fuelPrice);
  const [mpg, setMpg] = useState(DEFAULTS.mpg);

  const [maintenancePerMile, setMaintenancePerMile] = useState(DEFAULTS.maintenancePerMile);
  const [tiresPerMile, setTiresPerMile] = useState(DEFAULTS.tiresPerMile);
  const [miscPerMile, setMiscPerMile] = useState(DEFAULTS.miscPerMile);

  const [truckWeekly, setTruckWeekly] = useState(DEFAULTS.truckWeekly);
  const [trailerWeekly, setTrailerWeekly] = useState(DEFAULTS.trailerWeekly);
  const [insuranceWeekly, setInsuranceWeekly] = useState(DEFAULTS.insuranceWeekly);
  const [otherWeekly, setOtherWeekly] = useState(DEFAULTS.otherWeekly);

  const [dispatcherPercent, setDispatcherPercent] = useState(DEFAULTS.dispatcherPercent);
  const [factoringPercent, setFactoringPercent] = useState(DEFAULTS.factoringPercent);
  const [reservePercent, setReservePercent] = useState(DEFAULTS.reservePercent);
  const [taxPercent, setTaxPercent] = useState(DEFAULTS.taxPercent);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      const setters = {
        showHelp: setShowHelp,
        workProfile: setWorkProfile,
        driverMode: setDriverMode,
        tripMode: setTripMode,
        milesMode: setMilesMode,
        ratePerMile: setRatePerMile,
        directDailyPay: setDirectDailyPay,
        loadedMilesPerDay: setLoadedMilesPerDay,
        loadMiles: setLoadMiles,
        loadsPerDay: setLoadsPerDay,
        deadheadMilesPerDay: setDeadheadMilesPerDay,
        projectionDays: setProjectionDays,
        singleLoadPayout: setSingleLoadPayout,
        singleLoadMiles: setSingleLoadMiles,
        singleLoadDeadheadMiles: setSingleLoadDeadheadMiles,
        singleLoadDays: setSingleLoadDays,
        splitPercent: setSplitPercent,
        fuelPrice: setFuelPrice,
        mpg: setMpg,
        maintenancePerMile: setMaintenancePerMile,
        tiresPerMile: setTiresPerMile,
        miscPerMile: setMiscPerMile,
        truckWeekly: setTruckWeekly,
        trailerWeekly: setTrailerWeekly,
        insuranceWeekly: setInsuranceWeekly,
        otherWeekly: setOtherWeekly,
        dispatcherPercent: setDispatcherPercent,
        factoringPercent: setFactoringPercent,
        reservePercent: setReservePercent,
        taxPercent: setTaxPercent,
      };

      Object.entries(saved).forEach(([key, value]) => {
        if (setters[key]) setters[key](value);
      });
    } catch {
      // ignore broken saved state
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        showHelp,
        workProfile,
        driverMode,
        tripMode,
        milesMode,
        ratePerMile,
        directDailyPay,
        loadedMilesPerDay,
        loadMiles,
        loadsPerDay,
        deadheadMilesPerDay,
        projectionDays,
        singleLoadPayout,
        singleLoadMiles,
        singleLoadDeadheadMiles,
        singleLoadDays,
        splitPercent,
        fuelPrice,
        mpg,
        maintenancePerMile,
        tiresPerMile,
        miscPerMile,
        truckWeekly,
        trailerWeekly,
        insuranceWeekly,
        otherWeekly,
        dispatcherPercent,
        factoringPercent,
        reservePercent,
        taxPercent,
      })
    );
  }, [
    showHelp,
    workProfile,
    driverMode,
    tripMode,
    milesMode,
    ratePerMile,
    directDailyPay,
    loadedMilesPerDay,
    loadMiles,
    loadsPerDay,
    deadheadMilesPerDay,
    projectionDays,
    singleLoadPayout,
    singleLoadMiles,
    singleLoadDeadheadMiles,
    singleLoadDays,
    splitPercent,
    fuelPrice,
    mpg,
    maintenancePerMile,
    tiresPerMile,
    miscPerMile,
    truckWeekly,
    trailerWeekly,
    insuranceWeekly,
    otherWeekly,
    dispatcherPercent,
    factoringPercent,
    reservePercent,
    taxPercent,
  ]);

  const results = useMemo(() => {
    const isSingleLoad = tripMode === "single_load";

    const days = isSingleLoad
      ? Math.max(safeNum(singleLoadDays), 1)
      : Math.max(safeNum(projectionDays), 1);

    const loadedMiles = isSingleLoad
      ? safeNum(singleLoadMiles)
      : milesMode === "load_math"
      ? safeNum(loadMiles) * safeNum(loadsPerDay)
      : safeNum(loadedMilesPerDay);

    const deadheadMiles = isSingleLoad
      ? safeNum(singleLoadDeadheadMiles)
      : safeNum(deadheadMilesPerDay);

    const totalMiles = loadedMiles + deadheadMiles;

    const loadedMilesPerWorkDay = loadedMiles / days;
    const totalMilesPerWorkDay = totalMiles / days;

    const gross = isSingleLoad
      ? safeNum(singleLoadPayout)
      : safeNum(directDailyPay) > 0
      ? safeNum(directDailyPay) * days
      : loadedMiles * safeNum(ratePerMile) * days;

    const dailyGross = gross / days;

    const split = workProfile === "owner_operator" ? safeNum(splitPercent) / 100 : 1;
    const afterSplit = gross * split;
    const dailyAfterSplit = afterSplit / days;

    const fuelCostPerMile = safeNum(fuelPrice) / Math.max(safeNum(mpg), 0.1);

    const variableCostPerMile =
      workProfile === "owner_operator"
        ? fuelCostPerMile +
          safeNum(maintenancePerMile) +
          safeNum(tiresPerMile) +
          safeNum(miscPerMile)
        : 0;

    const fuelCost = workProfile === "owner_operator" ? totalMiles * fuelCostPerMile : 0;
    const variableCost = workProfile === "owner_operator" ? totalMiles * variableCostPerMile : 0;

    const weeklyFixedCost =
      workProfile === "owner_operator"
        ? safeNum(truckWeekly) +
          safeNum(trailerWeekly) +
          safeNum(insuranceWeekly) +
          safeNum(otherWeekly)
        : 0;

    const fixedCost = workProfile === "owner_operator" ? (weeklyFixedCost / 7) * days : 0;

    const dispatcherCost =
      workProfile === "owner_operator" ? gross * (safeNum(dispatcherPercent) / 100) : 0;

    const factoringCost =
      workProfile === "owner_operator" ? gross * (safeNum(factoringPercent) / 100) : 0;

    const reserveCost =
      workProfile === "owner_operator" ? gross * (safeNum(reservePercent) / 100) : 0;

    const totalCost = variableCost + fixedCost + dispatcherCost + factoringCost + reserveCost;

    const netBeforeTax = afterSplit - totalCost;
    const dailyNetBeforeTax = netBeforeTax / days;

    const driverCount = driverMode === "team" && workProfile === "owner_operator" ? 2 : 1;

    const perDriverBeforeTax = netBeforeTax / driverCount;
    const dailyPerDriverBeforeTax = perDriverBeforeTax / days;

    const afterTax = perDriverBeforeTax * (1 - safeNum(taxPercent) / 100);
    const dailyAfterTax = afterTax / days;

    const netPerLoadedMile = loadedMiles > 0 ? perDriverBeforeTax / loadedMiles : 0;
    const afterTaxPerLoadedMile = loadedMiles > 0 ? afterTax / loadedMiles : 0;

    const deadheadPercent = totalMiles > 0 ? (deadheadMiles / totalMiles) * 100 : 0;

    const breakEvenRate =
      workProfile === "owner_operator" && loadedMiles > 0
        ? totalCost / loadedMiles / Math.max(split, 0.01)
        : 0;

    const monthlyAfterTax = afterTax * 4.33;
    const yearlyAfterTax = afterTax * 52;

    const tierRows = [75, 82, 88, 92].map((pct) => {
      const tierSplit = pct / 100;
      const tierRevenue = gross * tierSplit;
      const tierNet = tierRevenue - totalCost;
      const tierPerDriver = driverMode === "team" ? tierNet / 2 : tierNet;
      const tierBreakEven =
        loadedMiles > 0 ? totalCost / loadedMiles / Math.max(tierSplit, 0.01) : 0;

      return {
        pct,
        tierRevenue,
        tierNet,
        tierPerDriver,
        tierBreakEven,
      };
    });

    return {
      days,
      loadedMiles,
      deadheadMiles,
      totalMiles,
      loadedMilesPerWorkDay,
      totalMilesPerWorkDay,
      gross,
      dailyGross,
      afterSplit,
      dailyAfterSplit,
      fuelCostPerMile,
      fuelCost,
      variableCostPerMile,
      variableCost,
      weeklyFixedCost,
      fixedCost,
      dispatcherCost,
      factoringCost,
      reserveCost,
      totalCost,
      netBeforeTax,
      dailyNetBeforeTax,
      perDriverBeforeTax,
      dailyPerDriverBeforeTax,
      afterTax,
      dailyAfterTax,
      netPerLoadedMile,
      afterTaxPerLoadedMile,
      deadheadPercent,
      breakEvenRate,
      monthlyAfterTax,
      yearlyAfterTax,
      tierRows,
    };
  }, [
    workProfile,
    driverMode,
    tripMode,
    milesMode,
    ratePerMile,
    directDailyPay,
    loadedMilesPerDay,
    loadMiles,
    loadsPerDay,
    deadheadMilesPerDay,
    projectionDays,
    singleLoadPayout,
    singleLoadMiles,
    singleLoadDeadheadMiles,
    singleLoadDays,
    splitPercent,
    fuelPrice,
    mpg,
    maintenancePerMile,
    tiresPerMile,
    miscPerMile,
    truckWeekly,
    trailerWeekly,
    insuranceWeekly,
    otherWeekly,
    dispatcherPercent,
    factoringPercent,
    reservePercent,
    taxPercent,
  ]);

  const resetCalculator = () => {
    const setters = {
      showHelp: setShowHelp,
      workProfile: setWorkProfile,
      driverMode: setDriverMode,
      tripMode: setTripMode,
      milesMode: setMilesMode,
      ratePerMile: setRatePerMile,
      directDailyPay: setDirectDailyPay,
      loadedMilesPerDay: setLoadedMilesPerDay,
      loadMiles: setLoadMiles,
      loadsPerDay: setLoadsPerDay,
      deadheadMilesPerDay: setDeadheadMilesPerDay,
      projectionDays: setProjectionDays,
      singleLoadPayout: setSingleLoadPayout,
      singleLoadMiles: setSingleLoadMiles,
      singleLoadDeadheadMiles: setSingleLoadDeadheadMiles,
      singleLoadDays: setSingleLoadDays,
      splitPercent: setSplitPercent,
      fuelPrice: setFuelPrice,
      mpg: setMpg,
      maintenancePerMile: setMaintenancePerMile,
      tiresPerMile: setTiresPerMile,
      miscPerMile: setMiscPerMile,
      truckWeekly: setTruckWeekly,
      trailerWeekly: setTrailerWeekly,
      insuranceWeekly: setInsuranceWeekly,
      otherWeekly: setOtherWeekly,
      dispatcherPercent: setDispatcherPercent,
      factoringPercent: setFactoringPercent,
      reservePercent: setReservePercent,
      taxPercent: setTaxPercent,
    };

    Object.entries(DEFAULTS).forEach(([key, value]) => {
      if (setters[key]) setters[key](value);
    });

    localStorage.removeItem(STORAGE_KEY);
  };

  const bgColor =
    results.afterTax <= 0
      ? "from-red-500 via-rose-500 to-red-700"
      : results.afterTax < 1000
      ? "from-amber-400 via-orange-400 to-orange-500"
      : "from-emerald-400 via-green-400 to-teal-500";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgColor} p-3 sm:p-5`}>
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl bg-white/95 p-4 shadow-md backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Trucking Profit Calculator
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Calculate daily work or one load spread across multiple days.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {profile?.email || session?.user?.email || "Driver"} · {plan || "basic"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowHelp((prev) => !prev)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              >
                {showHelp ? "Hide Help" : "How to Use"}
              </button>

              <button
                type="button"
                onClick={resetCalculator}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
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

            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <ToggleButton
                active={tripMode === "daily_work"}
                onClick={() => setTripMode("daily_work")}
              >
                Daily Work
              </ToggleButton>
              <ToggleButton
                active={tripMode === "single_load"}
                onClick={() => setTripMode("single_load")}
              >
                Single Load
              </ToggleButton>
            </div>

            {workProfile === "owner_operator" && (
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <ToggleButton active={driverMode === "solo"} onClick={() => setDriverMode("solo")}>
                  Solo
                </ToggleButton>
                <ToggleButton active={driverMode === "team"} onClick={() => setDriverMode("team")}>
                  Team
                </ToggleButton>
              </div>
            )}

            {tripMode === "daily_work" && (
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <ToggleButton
                  active={milesMode === "load_math"}
                  onClick={() => setMilesMode("load_math")}
                >
                  Load Math
                </ToggleButton>
                <ToggleButton
                  active={milesMode === "manual"}
                  onClick={() => setMilesMode("manual")}
                >
                  Manual Miles
                </ToggleButton>
              </div>
            )}
          </div>
        </div>

        {showHelp && (
          <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">How to Use This Calculator</h2>

            <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-bold text-slate-900">1. Choose your profile</div>
                <p className="mt-1">
                  Use <b>Owner-Operator</b> if you pay truck costs, fuel, insurance, dispatch,
                  factoring, maintenance, or reserves. Use <b>Company Driver</b> if you only want
                  driver earnings.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-bold text-slate-900">2. Choose the trip type</div>
                <p className="mt-1">
                  Use <b>Daily Work</b> when you run similar work each day. Use <b>Single Load</b>{" "}
                  when one load takes 1, 2, 3, or more days.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-bold text-slate-900">3. Loaded vs deadhead miles</div>
                <p className="mt-1">
                  Loaded miles are paid freight miles. Deadhead miles are unpaid empty miles. Both
                  affect fuel and cost.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-bold text-slate-900">4. Single Load mode</div>
                <p className="mt-1">
                  Enter total load payout, total loaded miles, total deadhead miles, and how many
                  days the load takes. The app breaks it down per day.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-bold text-slate-900">5. Owner-operator costs</div>
                <p className="mt-1">
                  Add fuel, MPG, maintenance per mile, tire cost, weekly truck cost, insurance,
                  dispatch, factoring, and reserve percentage.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-bold text-slate-900">6. Read the main result</div>
                <p className="mt-1">
                  Focus on <b>After Tax</b>, <b>Daily After Tax</b>, <b>Break-even Rate</b>, and{" "}
                  <b>Profit Per Loaded Mile</b>. Gross revenue alone can be misleading.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            dark
            label="After tax"
            value={fmt(results.afterTax)}
            sublabel={`${results.days} day${results.days === 1 ? "" : "s"} total`}
          />
          <StatCard
            label="Daily after tax"
            value={fmt(results.dailyAfterTax)}
            sublabel="Estimated take-home per day"
          />
          <StatCard
            label="Net before tax"
            value={fmt(results.perDriverBeforeTax)}
            sublabel={`${fmt(results.netPerLoadedMile)}/loaded mile`}
          />
          <StatCard
            label="Break-even"
            value={workProfile === "owner_operator" ? `${fmt(results.breakEvenRate)}/mi` : "N/A"}
            sublabel="Owner-op only"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">
              {tripMode === "single_load" ? "Single Load Details" : "Revenue + Miles"}
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {tripMode === "single_load" ? (
                <>
                  <InputField
                    label="Total load payout"
                    value={singleLoadPayout}
                    setValue={setSingleLoadPayout}
                    helpText="Total pay for this one load."
                  />
                  <InputField
                    label="Loaded miles for load"
                    value={singleLoadMiles}
                    setValue={setSingleLoadMiles}
                    step="1"
                  />
                  <InputField
                    label="Deadhead miles for load"
                    value={singleLoadDeadheadMiles}
                    setValue={setSingleLoadDeadheadMiles}
                    step="1"
                  />
                  <InputField
                    label="Days to complete load"
                    value={singleLoadDays}
                    setValue={setSingleLoadDays}
                    step="1"
                    min="1"
                    helpText="Use 2 or 3 if the load takes multiple days."
                  />
                </>
              ) : (
                <>
                  <InputField
                    label={workProfile === "company_driver" ? "Pay per mile" : "Rate per mile"}
                    value={ratePerMile}
                    setValue={setRatePerMile}
                  />
                  <InputField
                    label="Direct daily pay / payout"
                    value={directDailyPay}
                    setValue={setDirectDailyPay}
                    helpText="If above 0, overrides rate × loaded miles."
                  />

                  {milesMode === "load_math" ? (
                    <>
                      <InputField
                        label="Miles per load"
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
                      value={loadedMilesPerDay}
                      setValue={setLoadedMilesPerDay}
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
                    label="Projection days"
                    value={projectionDays}
                    setValue={setProjectionDays}
                    step="1"
                    min="1"
                  />
                </>
              )}

              {workProfile === "owner_operator" && (
                <InputField
                  label="Pay / split percent"
                  value={splitPercent}
                  setValue={setSplitPercent}
                  step="1"
                />
              )}

              <InputField
                label="Tax estimate percent"
                value={taxPercent}
                setValue={setTaxPercent}
                step="1"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">
              {workProfile === "owner_operator" ? "Operating Costs" : "Company Driver View"}
            </h2>

            {workProfile === "company_driver" ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Company driver mode excludes truck payments, repairs, insurance, trailer, dispatch,
                factoring, and reserves. It focuses on driver earnings.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InputField
                  label="Fuel price per gallon"
                  value={fuelPrice}
                  setValue={setFuelPrice}
                />
                <InputField label="MPG" value={mpg} setValue={setMpg} step="0.1" min="0.1" />
                <InputField
                  label="Maintenance per mile"
                  value={maintenancePerMile}
                  setValue={setMaintenancePerMile}
                />
                <InputField label="Tires per mile" value={tiresPerMile} setValue={setTiresPerMile} />
                <InputField label="Misc per mile" value={miscPerMile} setValue={setMiscPerMile} />
                <InputField label="Truck weekly" value={truckWeekly} setValue={setTruckWeekly} step="1" />
                <InputField
                  label="Trailer weekly"
                  value={trailerWeekly}
                  setValue={setTrailerWeekly}
                  step="1"
                />
                <InputField
                  label="Insurance weekly"
                  value={insuranceWeekly}
                  setValue={setInsuranceWeekly}
                  step="1"
                />
                <InputField
                  label="Other weekly costs"
                  value={otherWeekly}
                  setValue={setOtherWeekly}
                  step="1"
                />
                <InputField
                  label="Dispatcher percent"
                  value={dispatcherPercent}
                  setValue={setDispatcherPercent}
                  step="0.1"
                />
                <InputField
                  label="Factoring percent"
                  value={factoringPercent}
                  setValue={setFactoringPercent}
                  step="0.1"
                />
                <InputField
                  label="Reserve percent"
                  value={reservePercent}
                  setValue={setReservePercent}
                  step="0.1"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">Miles</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Loaded miles</span>
                <span className="font-semibold">{results.loadedMiles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total miles</span>
                <span className="font-semibold">{results.totalMiles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Loaded miles/day</span>
                <span className="font-semibold">
                  {results.loadedMilesPerWorkDay.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Deadhead %</span>
                <span className="font-semibold">{results.deadheadPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">Revenue</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Total gross</span>
                <span className="font-semibold">{fmt(results.gross)}</span>
              </div>
              <div className="flex justify-between">
                <span>Daily gross</span>
                <span className="font-semibold">{fmt(results.dailyGross)}</span>
              </div>
              <div className="flex justify-between">
                <span>After split</span>
                <span className="font-semibold">{fmt(results.afterSplit)}</span>
              </div>
              <div className="flex justify-between">
                <span>Net before tax</span>
                <span className="font-semibold">{fmt(results.netBeforeTax)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">Costs</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Fuel / mile</span>
                <span className="font-semibold">{fmt(results.fuelCostPerMile)}</span>
              </div>
              <div className="flex justify-between">
                <span>Variable / mile</span>
                <span className="font-semibold">{fmt(results.variableCostPerMile)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel cost</span>
                <span className="font-semibold">{fmt(results.fuelCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total cost</span>
                <span className="font-semibold">{fmt(results.totalCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {workProfile === "owner_operator" && (
          <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
            <h2 className="text-lg font-bold text-slate-900">Split Tier Comparison</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {results.tierRows.map((row) => (
                <div key={row.pct} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-900">{row.pct}% split</div>
                  <div className="mt-2 text-xs text-slate-500">Per driver before tax</div>
                  <div className="text-xl font-bold text-slate-900">{fmt(row.tierPerDriver)}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    Break-even: {fmt(row.tierBreakEven)}/mi
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white/90 p-4 text-sm leading-6 text-slate-600 shadow-md">
          Estimate only. Real trucking numbers can change from downtime, repairs, fuel,
          settlement deductions, insurance, escrow, dispatch, factoring, taxes, tolls, permits,
          maintenance, and contract terms.
        </div>
      </div>
    </div>
  );
}
