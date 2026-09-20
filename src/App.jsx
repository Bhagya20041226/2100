import {
  useState,
  useCallback,
  useEffect,
  lazy,
  Suspense,
} from "react";

import "./App.css";
import Map from "./Map.jsx";
import Dashboard from "./Dashboard.jsx";
import heroCityImage from "./assets/images/hero-city.jpeg";

/*const Background3D = lazy(() => import("./Background3D"));*/

import hyperrailImage from "./assets/images/hyperrail.jpg";
import autonomousPodImage from "./assets/images/autonomous-pod.jpg";
import airTaxiImage from "./assets/images/air-taxi.jpg";
import smartBusImage from "./assets/images/smart-bus.jpg";

import {
  TrainFront,
  Plane,
  CarFront,
  BusFront,
  Accessibility,
  Clock,
  Activity,
  Navigation,
  TrafficCone,
  Gauge,
  Timer,
  Sun,
  Moon,
} from "lucide-react";

/* =========================================================
   TRANSPORT MODES
========================================================= */

const transportModes = [
  {
    id: "hyperrail",
    name: "HyperRail",
    icon: TrainFront,
    description:
      "Ultra-fast intercity transport connecting major cities.",
    tag: "ULTRAFAST",
    image: hyperrailImage,
    normalSpeed: 300,
    features: [
      "High-speed intercity corridors",
      "Step-free boarding",
      "Live platform guidance",
    ],
  },

  {
    id: "pod",
    name: "Autonomous Pod",
    icon: CarFront,
    description:
      "Personal autonomous mobility with door-to-door travel.",
    tag: "PERSONAL",
    image: autonomousPodImage,
    normalSpeed: 60,
    features: [
      "Door-to-door autonomous routing",
      "Wheelchair-ready cabin",
      "Personal comfort settings",
    ],
  },

  {
    id: "air",
    name: "Air Taxi",
    icon: Plane,
    description:
      "Electric vertical flight for fast urban and regional travel.",
    tag: "AERIAL",
    image: airTaxiImage,
    normalSpeed: 180,
    features: [
      "Electric vertical take-off",
      "Rooftop vertiport hubs",
      "Weather-adaptive flight paths",
    ],
  },

  {
    id: "bus",
    name: "Smart Bus",
    icon: BusFront,
    description:
      "Accessible autonomous public transport for everyone.",
    tag: "INCLUSIVE",
    image: smartBusImage,
    normalSpeed: 50,
    features: [
      "Low-floor step-free entry",
      "Audio and visual stop alerts",
      "Priority seating zones",
    ],
  },
];

/* =========================================================
   ACCESSIBILITY OPTIONS
========================================================= */

const accessibilityOptions = [
  {
    id: "wheelchair",
    icon: "♿",
    title: "Wheelchair Accessible",
    description: "Prioritize accessible mobility",
  },

  {
    id: "stepFree",
    icon: "🛗",
    title: "Step-Free Route",
    description: "Avoid stairs where possible",
  },

  {
    id: "reducedWalking",
    icon: "🚶",
    title: "Reduced Walking",
    description: "Minimize walking distance",
  },

  {
    id: "visualAlerts",
    icon: "👁",
    title: "Visual Alerts",
    description: "Show important journey alerts",
  },

  {
    id: "simpleInstructions",
    icon: "🧠",
    title: "Simple Instructions",
    description: "Use clear travel instructions",
  },
];


 function App() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [selectedModes, setSelectedModes] = useState([
    "hyperrail",
    "pod",
    "air",
    "bus",
  ]);

  const [selectedAccessibility, setSelectedAccessibility] =
    useState([]);

  const [screen, setScreen] = useState("home");

  const [routeSearch, setRouteSearch] = useState(0);

  const [realRoute, setRealRoute] = useState(null);

  const [journey, setJourney] = useState(null);

  const [journeyHistory, setJourneyHistory] = useState(() => {
  try {
    const saved = localStorage.getItem(
      "transoraJourneyHistory"
    );

    return saved
      ? JSON.parse(saved)
      : [];
  } catch (error) {
    console.error(
      "Failed to load journey history:",
      error
    );

    return [];
  }
});

  const [error, setError] = useState("");

  const [largeText, setLargeText] = useState(false);
  const [activeMode, setActiveMode] = useState(null);

useEffect(() => {
  if (!activeMode) return;

  const onKey = (e) => {
    if (e.key === "Escape") setActiveMode(null);
  };

  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [activeMode]);
  /* =======================================================
     THEME
  ======================================================= */

  const [theme, setTheme] = useState(() => {
    return (
      localStorage.getItem("transoraTheme") ||
      "dark"
    );
  });

  useEffect(() => {
  localStorage.setItem("transoraTheme", theme);
}, [theme]);

  const [alternativeSelected, setAlternativeSelected] =
    useState(false);

  /* =======================================================
     LIVE JOURNEY STATE
  ======================================================= */

  const [liveProgress, setLiveProgress] = useState(18);

  const [trafficLevel, setTrafficLevel] =
    useState("moderate");

  const [trafficDelay, setTrafficDelay] =
    useState(4);

  const [liveUpdate, setLiveUpdate] =
    useState(0);

  /* =======================================================
     PLAN JOURNEY
  ======================================================= */

  const planJourney = () => {
    setError("");

    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    if (!cleanFrom || !cleanTo) {
      setError(
        "Please enter both your starting point and destination."
      );
      return;
    }

    if (
      cleanFrom.toLowerCase() ===
      cleanTo.toLowerCase()
    ) {
      setError(
        "Starting point and destination cannot be the same."
      );
      return;
    }

    if (selectedModes.length === 0) {
      setError(
        "Please select at least one mobility option."
      );
      return;
    }

    setFrom(cleanFrom);
    setTo(cleanTo);

    /*
      Clear previous route before starting
      a completely new search.
    */
    setRealRoute(null);
    setJourney(null);
    setAlternativeSelected(false);

    setLiveProgress(18);
    setTrafficLevel("moderate");
    setTrafficDelay(4);
    setLiveUpdate(0);

    setRouteSearch(
      (previous) => previous + 1
    );

    setScreen("network");
  };

  /* =======================================================
     REAL ROUTE FOUND
  ======================================================= */

  const handleRouteFound = useCallback(
    (route) => {
      if (!route) return;

      console.log(
        "HANDLE ROUTE FOUND:",
        route
      );

      /* -----------------------------------------------
         NUMERIC VALUES FROM MAP
      ------------------------------------------------ */

      const distanceKm = Number(
        route.distanceKm
      );

      const routeMinutes = Number(
        route.durationMinutes
      );

      /* -----------------------------------------------
         VALIDATE DISTANCE
      ------------------------------------------------ */

      if (
        !Number.isFinite(distanceKm) ||
        distanceKm <= 0
      ) {
        setError(
          "Route distance could not be calculated."
        );
        return;
      }

      /* -----------------------------------------------
         VALIDATE DURATION
      ------------------------------------------------ */

      if (
        !Number.isFinite(routeMinutes) ||
        routeMinutes <= 0
      ) {
        setError(
          "Route travel time could not be calculated."
        );
        return;
      }

      /* -----------------------------------------------
         ROAD TIME
      ------------------------------------------------ */

      const minutes = Math.max(
        1,
        Math.round(routeMinutes)
      );

      /* -----------------------------------------------
         CREATE JOURNEY
      ------------------------------------------------ */

      const newJourney = {
        from:
        route.from ||
        route.start?.name ||
        from,

        to:
        route.to ||
        route.end?.name ||
        to,

        distance:
          `${distanceKm.toFixed(1)} km`,

        distanceKm,

        minutes,

        duration:
          `${minutes} min`,

        modes: [
          ...selectedModes,
        ],

        accessibility: [
          ...selectedAccessibility,
        ],
      };

      /* -----------------------------------------------
         SAVE REAL ROUTE
      ------------------------------------------------ */

      setRealRoute(route);

setJourney(newJourney);

/* -----------------------------------------------
   SAVE JOURNEY HISTORY
------------------------------------------------ */

const historyItem = {
  id: Date.now(),
  from: newJourney.from,
  to: newJourney.to,
  distance: newJourney.distance,
  duration: newJourney.duration,
  date: new Date().toLocaleString(),
};

setJourneyHistory((previous) => {
  const updated = [
    historyItem,
    ...previous,
  ].slice(0, 5);

  localStorage.setItem(
    "transoraJourneyHistory",
    JSON.stringify(updated)
  );

  return updated;
});

      setAlternativeSelected(false);

      /* -----------------------------------------------
         RESET LIVE DATA
      ------------------------------------------------ */

      setLiveProgress(18);
      setTrafficLevel("moderate");
      setTrafficDelay(4);
      setLiveUpdate(0);

      setError("");

      console.log(
        "JOURNEY CREATED:",
        newJourney
      );

      console.log(
        "REAL ROUTE SAVED:",
        route
      );
    },
    [
      from,
      to,
      selectedModes,
      selectedAccessibility,
    ]
  );

  /* =======================================================
     ROUTE ERROR
  ======================================================= */

  const handleRouteError = useCallback(
    (message) => {
      setError(
        message ||
          "Unable to calculate the route."
      );

      setRealRoute(null);
      setJourney(null);
    },
    []
  );

  /* =======================================================
     SIMULATED LIVE DATA
  ======================================================= */

  useEffect(() => {
    if (
      screen !== "live" ||
      !journey
    ) {
      return;
    }

    const interval =
      setInterval(() => {
        setLiveUpdate(
          (previous) =>
            previous + 1
        );

        setLiveProgress(
          (previous) => {
            const next =
              previous + 1.5;

            return Math.min(
              96,
              Number(
                next.toFixed(1)
              )
            );
          }
        );

        setTrafficLevel(
          (previous) => {
            if (
              previous === "normal"
            ) {
              return "moderate";
            }

            if (
              previous === "moderate"
            ) {
              return "heavy";
            }

            return "normal";
          }
        );

        setTrafficDelay(
          (previous) => {
            const next =
              previous + 1;

            return next > 10
              ? 2
              : next;
          }
        );
      }, 5000);

    return () => {
      clearInterval(
        interval
      );
    };
  }, [screen, journey]);

  /* =======================================================
     TRAFFIC INFO
  ======================================================= */

  const getTrafficInfo = () => {
    if (
      trafficLevel === "normal"
    ) {
      return {
        label: "NORMAL",
        description:
          "Traffic is moving smoothly.",
        icon: Gauge,
        className:
          "traffic-normal",
      };
    }

    if (
      trafficLevel === "heavy"
    ) {
      return {
        label: "HEAVY",
        description:
          "Higher traffic levels detected.",
        icon: TrafficCone,
        className:
          "traffic-heavy",
      };
    }

    return {
      label: "MODERATE",
      description:
        "Some congestion is affecting the route.",
      icon: Activity,
      className:
        "traffic-moderate",
    };
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const goHome = () => {
    setScreen("home");
    setError("");
  };

  const toggleTheme = () => {
  setTheme((previous) =>
    previous === "dark"
      ? "light"
      : "dark"
  );
};

  const openPlanner = () => {
    setScreen("planner");
    setError("");
  };

  const openMobility = () => {
    setScreen("mobility");
    setError("");
  };

  const openNetwork = () => {
    setScreen("network");
    setError("");
  };

  const openDashboard = () => {
  setScreen("dashboard");
  setError("");
};

  const openRouteDetails = () => {
    if (!journey) {
      setScreen("planner");
      return;
    }

    setScreen("route");
  };

  const resetJourney = () => {
    setJourney(null);
    setRealRoute(null);
    setAlternativeSelected(false);

    setLiveProgress(18);
    setTrafficLevel("moderate");
    setTrafficDelay(4);
    setLiveUpdate(0);

    setError("");

    setScreen("planner");
  };

  const startLiveJourney = () => {
    if (!journey) return;

    setAlternativeSelected(false);

    setLiveProgress(18);
    setTrafficLevel("moderate");
    setTrafficDelay(4);
    setLiveUpdate(0);

    setScreen("live");
  };

  /* =======================================================
     MODE SELECTION
  ======================================================= */

  const toggleMode = (modeId) => {
    setSelectedModes(
      (previous) => {
        if (
          previous.includes(
            modeId
          )
        ) {
          return previous.filter(
            (mode) =>
              mode !== modeId
          );
        }

        return [
          ...previous,
          modeId,
        ];
      }
    );
  };

  /* =======================================================
     ACCESSIBILITY SELECTION
  ======================================================= */

  const toggleAccessibility = (
    optionId
  ) => {
    setSelectedAccessibility(
      (previous) => {
        if (
          previous.includes(
            optionId
          )
        ) {
          return previous.filter(
            (item) =>
              item !== optionId
          );
        }

        return [
          ...previous,
          optionId,
        ];
      }
    );
  };

  /* =======================================================
     FUTURE MOBILITY
  ======================================================= */

  const getFutureMobility = () => {
    if (!journey) return [];

    const distance =
      Number(
        journey.distanceKm
      ) || 0;

    const capabilities = {
      hyperrail: {
        accessibility: 70,
        stepFree: true,
        reducedWalking: false,
        visualGuidance: true,
        simpleNavigation: true,
      },

      pod: {
        accessibility: 95,
        stepFree: true,
        reducedWalking: true,
        visualGuidance: true,
        simpleNavigation: true,
      },

      air: {
        accessibility: 75,
        stepFree: true,
        reducedWalking: true,
        visualGuidance: true,
        simpleNavigation: true,
      },

      bus: {
        accessibility: 90,
        stepFree: true,
        reducedWalking: true,
        visualGuidance: true,
        simpleNavigation: true,
      },
    };

    const results =
      transportModes.map(
        (mode) => {
          const capability =
            capabilities[
              mode.id
            ];

          const speed =
            Number(
              mode.normalSpeed
            ) || 0;

          const estimatedTime =
            speed > 0
              ? Math.max(
                  1,
                  Math.round(
                    (distance /
                      speed) *
                      60
                  )
                )
              : 0;

          let score = 50;

          const reasons = [];

          if (
            selectedAccessibility.includes(
              "wheelchair"
            )
          ) {
            if (
              capability.accessibility >=
              90
            ) {
              score += 25;

              reasons.push(
                "high accessibility support"
              );
            } else {
              score += 10;
            }
          }

          if (
            selectedAccessibility.includes(
              "stepFree"
            ) &&
            capability.stepFree
          ) {
            score += 15;

            reasons.push(
              "step-free access"
            );
          }

          if (
            selectedAccessibility.includes(
              "reducedWalking"
            ) &&
            capability.reducedWalking
          ) {
            score += 15;

            reasons.push(
              "reduced walking"
            );
          }

          if (
            selectedAccessibility.includes(
              "visualAlerts"
            ) &&
            capability.visualGuidance
          ) {
            score += 5;

            reasons.push(
              "visual guidance"
            );
          }

          if (
            selectedAccessibility.includes(
              "simpleInstructions"
            ) &&
            capability.simpleNavigation
          ) {
            score += 5;

            reasons.push(
              "simple navigation"
            );
          }

          if (
            mode.id === "air"
          ) {
            score += 5;

            reasons.push(
              "high-speed travel"
            );
          }

          if (
            mode.id ===
            "hyperrail"
          ) {
            score += 4;

            reasons.push(
              "rapid intercity travel"
            );
          }

          if (
            selectedModes.includes(
              mode.id
            )
          ) {
            score += 5;

            reasons.push(
              "selected mobility option"
            );
          } else {
            score -= 30;
          }

          score = Math.max(
            0,
            Math.min(
              100,
              score
            )
          );

          if (
            reasons.length === 0
          ) {
            reasons.push(
              "balanced future mobility"
            );
          }

          return {
            id: mode.id,
            name: mode.name,
            Icon: mode.icon,
            speed,
            speedLabel:
              `${speed} km/h`,
            time:
              estimatedTime,
            score,
            reasons,
          };
        }
      );

    results.sort(
      (a, b) =>
        b.score - a.score
    );

    return results.map(
      (item, index) => ({
        ...item,
        rank:
          index + 1,
        recommended:
          index === 0 &&
          selectedAccessibility.length >
            0,
      })
    );
  };

  /* =======================================================
     ACCESSIBILITY RECOMMENDATION
  ======================================================= */

  const getAccessibilityRecommendation =
    () => {
      if (
        selectedAccessibility.length ===
        0
      ) {
        return {
          active: false,
          title:
            "ACCESSIBILITY READY",
          message:
            "Select accessibility preferences to personalize your future journey.",
        };
      }

      if (
        selectedAccessibility.includes(
          "wheelchair"
        )
      ) {
        return {
          active: true,
          title:
            "ACCESSIBILITY PRIORITY ACTIVE",
          message:
            "TRANSORA is prioritizing wheelchair-friendly and step-free mobility options.",
        };
      }

      if (
        selectedAccessibility.includes(
          "reducedWalking"
        )
      ) {
        return {
          active: true,
          title:
            "LOW-WALKING MODE ACTIVE",
          message:
            "TRANSORA is minimizing walking distance between journey connections.",
        };
      }

      if (
        selectedAccessibility.includes(
          "stepFree"
        )
      ) {
        return {
          active: true,
          title:
            "STEP-FREE MODE ACTIVE",
          message:
            "TRANSORA is prioritizing routes with step-free connections.",
        };
      }

      return {
        active: true,
        title:
          "PERSONALIZED JOURNEY ACTIVE",
        message:
          "Your accessibility preferences are being considered.",
      };
    };

  /* =======================================================
     HOME
  ======================================================= */

  function renderHome() {
    return (
      <main className="home-page">

          <section className="hero">

  <div
    className="hero-photo"
    style={{ backgroundImage: `url(${heroCityImage})` }}
  ></div>

  <div className="hero-content"></div>

  

          <div className="hero-content">

            <span className="eyebrow">
              TRANSORA 2100
            </span>

            <h1>
              YOUR JOURNEY.
              <br />
              <span>
                INTELLIGENTLY CONNECTED.
              </span>
            </h1>

            <p className="hero-description">
              One intelligent platform for the way
              Sri Lanka moves in 2100. Plan, connect
              and follow your journey across every
              mode of transport.
            </p>

            <div className="hero-actions">

              <button
                className="primary-btn"
                onClick={openPlanner}
              >
                PLAN MY JOURNEY →
              </button>

              <button
                className="secondary-btn"
                onClick={openMobility}
              >
                EXPLORE MOBILITY
              </button>

            </div>

            <div className="hero-accessibility">

              <span>
                ♿
              </span>

              <div>

                <strong>
                  DESIGNED FOR EVERYONE
                </strong>

                <p>
                  Wheelchair-friendly routes,
                  step-free access, reduced walking
                  and simple journey guidance.
                </p>

              </div>

            </div>

            <div className="hero-meta">

              <div>
                <strong>
                  2100
                </strong>

                <span>
                  FUTURE READY
                </span>
              </div>

              <div>
                <strong>
                  01
                </strong>

                <span>
                  UNIFIED NETWORK
                </span>
              </div>

              <div>
                <strong>
                  24/7
                </strong>

                <span>
                  CONNECTED
                </span>
              </div>

            </div>

          </div>

          <div className="hero-orbit">

            <div className="orbit-card orbit-one">

              <TrainFront
                size={28}
              />

              <small>
                HYPERRAIL
              </small>

            </div>

            <div className="orbit-card orbit-two">

              <Plane
                size={28}
              />

              <small>
                AIR TAXI
              </small>

            </div>

            <div className="orbit-card orbit-three">

              <CarFront
                size={28}
              />

              <small>
                AUTONOMOUS
              </small>

            </div>

          </div>

        </section>

        <section className="section">

          <div className="section-heading-row">

            <div>

              <span className="eyebrow">
                ONE PLATFORM
              </span>

              <h2>
                Every mode. One journey.
              </h2>

            </div>

            <button
              className="text-btn"
              onClick={openMobility}
            >
              VIEW ALL →
            </button>

          </div>

          <div className="mobility-grid">

            {transportModes.map(
              (mode) => {

                const Icon =
                  mode.icon;

                return (
                  <article
                    className="mobility-card"
                    key={mode.id}
                  >

                    <div
                      className="mobility-image"
                      style={{
                        backgroundImage:
                          `url(${mode.image})`,
                      }}
                    >

                      <span className="mobility-icon">

                        <Icon
                          size={30}
                          strokeWidth={1.8}
                        />

                      </span>

                    </div>

                    <div className="mobility-content">

                      <span className="mobility-tag">
                        {mode.tag}
                      </span>

                      <h3>
                        {mode.name}
                      </h3>

                      <p>
                        {mode.description}
                      </p>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        </section>

        <section className="section accessibility-home-section">

          <div className="accessibility-home-card">

            <div className="accessibility-home-icon">

              <Accessibility
                size={38}
              />

            </div>

            <div className="accessibility-home-content">

              <span className="eyebrow">
                INCLUSIVE BY DESIGN
              </span>

              <h2>
                Mobility should work
                <span>
                  {" "}for everyone.
                </span>
              </h2>

              <p>
                TRANSORA considers accessibility
                from the beginning of your journey —
                including wheelchair access, step-free
                routes, reduced walking and simple
                instructions.
              </p>

              <button
                className="secondary-btn"
                onClick={openPlanner}
              >
                SET ACCESSIBILITY NEEDS →
              </button>

            </div>

          </div>

        </section>

      </main>
    );
  }

  /* =======================================================
     PLANNER
  ======================================================= */

  function renderPlanner() {
    return (
      <main className="inner-page">

        <section className="inner-hero">

          <div>

            <span className="eyebrow">
              JOURNEY PLANNER
            </span>

            <h1>
              Design your
              <span> journey.</span>
            </h1>

            <p>
              Choose your destination, mobility
              preferences and accessibility needs.
            </p>

          </div>

        <section className="planner-page-grid">

  {/* =========================================
      BOX 01 — PLAN YOUR JOURNEY
  ========================================= */}

  <div className="planner-main-card planner-section-box">

    <div className="form-section">

      <span className="form-number">
        01
      </span>

      <div>
        <h2>
          Where are you travelling?
        </h2>

        <p>
          Enter any starting point and
          destination in Sri Lanka.
        </p>
      </div>

    </div>

    <div className="route-input-grid">

      <div className="input-group">

        <label>
          FROM
        </label>

        <input
          value={from}
          onChange={(e) =>
            setFrom(e.target.value)
          }
          placeholder="Enter starting point"
        />

      </div>

      <div className="input-group">

        <label>
          TO
        </label>

        <input
          value={to}
          onChange={(e) =>
            setTo(e.target.value)
          }
          placeholder="Enter destination"
        />

      </div>

    </div>
    {error && (
  <p className="error-message">{error}</p>
)}

<button
  className="primary-btn planner-submit"
  onClick={planJourney}
>
  FIND ROUTE →
</button>

  </div>


  {/* =========================================
      BOX 02 — MOBILITY OPTIONS
  ========================================= */}

  <div className="planner-main-card planner-section-box">

    <div className="form-section">

      <span className="form-number">
        02
      </span>

      <div>

        <h2>
          Choose mobility
        </h2>

        <p>
          Select the transportation modes
          you are comfortable using.
        </p>

      </div>

    </div>

    <div className="mode-selector">

      {transportModes.map((mode) => {

        const active =
          selectedModes.includes(mode.id);

        const Icon = mode.icon;

        return (
          <button
            key={mode.id}
            className={`mode-option ${
              active ? "active" : ""
            }`}
            onClick={() =>
              toggleMode(mode.id)
            }
          >

            <span className="mode-option-icon">

              <Icon
                size={26}
                strokeWidth={1.8}
              />

            </span>

            <span>

              <strong>
                {mode.name}
              </strong>

              <small>
                {mode.description}
              </small>

            </span>

            <span className="mode-check">

              {active ? "✓" : ""}

            </span>

          </button>
        );

      })}

    </div>

  </div>


  {/* =========================================
      BOX 03 — ACCESSIBILITY NEEDS
  ========================================= */}

  <div className="planner-main-card planner-section-box">

    <div className="form-section">

      <span className="form-number">
        03
      </span>

      <div>

        <h2>
          Accessibility needs
        </h2>

        <p>
          Tell TRANSORA how to make your
          journey easier.
        </p>

      </div>

    </div>

    <div className="accessibility-grid">

      {accessibilityOptions.map((option) => {

        const active =
          selectedAccessibility.includes(
            option.id
          );

        return (
          <button
            key={option.id}
            className={`accessibility-option ${
              active ? "active" : ""
            }`}
            onClick={() =>
              toggleAccessibility(option.id)
            }
          >

            <span className="accessibility-icon">
              {option.icon}
            </span>

            <span>

              <strong>
                {option.title}
              </strong>

              <small>
                {option.description}
              </small>

            </span>

            <span>
              {active ? "✓" : ""}
            </span>

          </button>
        );

      })}

    </div>

  </div>


  {/* =========================================
      ERROR + CALCULATE
  ========================================= */}

  {error && (
    <div className="error-message">
      ⚠ {error}
    </div>
  )}

  <div className="planner-action">

    <button
      className="primary-btn planner-submit"
      onClick={planJourney}
    >
      CALCULATE REAL ROUTE →
    </button>

  </div>

  </section>
  </section>

  </main>

);
  }

function renderMobility() {
  return (
    <main className="inner-page">

      {/* ================================
          MOBILITY HERO
      ================================= */}

      <section className="inner-hero mobility-hero">

        <div className="mobility-hero-content">

          <span className="eyebrow">
            FUTURE MOBILITY · 2100
          </span>

          <h1>
            Move beyond
            <span> today.</span>
          </h1>

          <p>
            Discover four intelligent transportation
            concepts designed to connect people,
            places and possibilities in 2100.
          </p>

          <div className="mobility-hero-line">
            <span></span>
            <small>EXPLORE THE FUTURE</small>
          </div>

        </div>

      </section>


      {/* ================================
          MOBILITY INTRO
      ================================= */}

      <section className="mobility-intro">

        <div>
          <span className="section-label">
            01 / MOBILITY SYSTEM
          </span>

          <h2>
            Transportation,
            <br />
            reimagined.
          </h2>
        </div>

        <p>
          TRANSORA 2100 brings together connected,
          autonomous and intelligent mobility systems
          to create faster, safer and more accessible
          journeys for everyone.
        </p>

      </section>


      {/* ================================
          MOBILITY CARDS
      ================================= */}

      <section className="mobility-large-grid">

        {transportModes.map((mode, index) => {

          const Icon = mode.icon;

          return (
            <article
              className="mobility-large-card"
              key={mode.id}
            >

              {/* IMAGE */}

              <div
                className="mobility-large-image"
                style={{
                  backgroundImage: `url(${mode.image})`,
                }}
              >

                <div className="mobility-card-overlay"></div>

                <div className="mobility-card-top">

                  <span className="mobility-icon-box">
                    <Icon
                      size={32}
                      strokeWidth={1.7}
                    />
                  </span>

                  <span className="mobility-number">
                    0{index + 1}
                  </span>

                </div>

                <span className="mobility-tag">
                  {mode.tag}
                </span>

              </div>


              {/* CONTENT */}

              <div className="mobility-large-content">

                <div className="mobility-title-row">

                  <div>
                    <span className="mobility-category">
                      FUTURE TRANSPORT
                    </span>

                    <h2>
                      {mode.name}
                    </h2>
                  </div>

                  <span className="mobility-arrow">
                    ↗
                  </span>

                </div>


                <p>
                  {mode.description}
                </p>


                {/* SPECS */}

                <div className="mobility-specs">

                  <div className="mobility-spec">

                    <span className="spec-label">
                      SPEED
                    </span>

                    <strong>
                      {mode.normalSpeed}
                      <small> km/h</small>
                    </strong>

                  </div>


                  <div className="mobility-spec">

                    <span className="spec-label">
                      NETWORK
                    </span>

                    <strong>
                      CONNECTED
                    </strong>

                  </div>


                  <div className="mobility-spec">

                    <span className="spec-label">
                      SYSTEM
                    </span>

                    <strong>
                      INTELLIGENT
                    </strong>

                  </div>

                </div>

<button
  className="mobility-explore-btn"
  onClick={() => setActiveMode(mode)}
>
  <span>EXPLORE</span>
  <span>→</span>
</button>

              </div>

            </article>
          );
        })}

      </section>


      {/* ================================
          FUTURE STATEMENT
      ================================= */}

      <section className="mobility-future-section">

        <div className="mobility-future-number">
          2100
        </div>

        <div className="mobility-future-content">

          <span className="section-label">
            THE NEXT JOURNEY
          </span>

          <h2>
            One network.
            <br />
            <span>Infinite possibilities.</span>
          </h2>

          <p>
            From high-speed HyperRail to autonomous
            urban pods and aerial mobility, TRANSORA
            connects every journey through one
            intelligent transportation ecosystem.
          </p>

        </div>

      </section>
      {activeMode && (
  <div
    className="mm-overlay"
    onClick={() => setActiveMode(null)}
  >
    <div
      className="mm-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={activeMode.name}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="mm-close"
        onClick={() => setActiveMode(null)}
        aria-label="Close"
      >
        ✕
      </button>

      <div
        className="mm-image"
        style={{ backgroundImage: `url(${activeMode.image})` }}
      >
        <span className="mm-tag">{activeMode.tag}</span>
      </div>

      <div className="mm-body">
        <span className="mm-category">FUTURE TRANSPORT</span>
        <h2>{activeMode.name}</h2>
        <p className="mm-description">{activeMode.description}</p>

        <div className="mm-specs">
          <div>
            <span>SPEED</span>
            <strong>{activeMode.normalSpeed} km/h</strong>
          </div>
          <div>
            <span>NETWORK</span>
            <strong>CONNECTED</strong>
          </div>
          <div>
            <span>SYSTEM</span>
            <strong>INTELLIGENT</strong>
          </div>
        </div>

        {activeMode.features && (
          <ul className="mm-features">
            {activeMode.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}

        <div className="mm-actions">
          <button
            className="primary-btn"
            onClick={() => {
              setSelectedModes([activeMode.id]);
              setActiveMode(null);
              openPlanner();
            }}
          >
            PLAN A JOURNEY →
          </button>

          <button
            className="secondary-btn"
            onClick={() => setActiveMode(null)}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </main>
  );
}
  /* =======================================================
     NETWORK
  ======================================================= */

  function renderNetwork() {
    const accessibility =
      getAccessibilityRecommendation();

    return (
      <main className="inner-page">

        <section className="inner-hero">

          <div>

            <span className="eyebrow">
              CONNECTED NETWORK
            </span>

            <h1>
              See the
              <span> network.</span>
            </h1>

            <p>
              Explore your route using real road
              data and the TRANSORA future mobility
              layer.
            </p>

          </div>

          {journey && (
            <div className="route-chip">

              <span>
                {journey.from}
              </span>

              <strong>
                →
              </strong>

              <span>
                {journey.to}
              </span>

            </div>
          )}

        </section>

        <section className="network-map-card">

          <Map
            key={routeSearch}
            from={from}
            to={to}
            searchTrigger={routeSearch}
            onRouteFound={
              handleRouteFound
            }
            onRouteError={
              handleRouteError
            }
          />

          {error && (
            <div className="error-message">
              ⚠ {error}
            </div>
          )}

        </section>

        {journey && (
          <>

            <section className="route-data-grid">

              <div className="route-data-card">

                <span>
                  DISTANCE
                </span>

                <strong>
                  {journey.distance}
                </strong>

              </div>

              <div className="route-data-card">

                <span>
                  ROAD TIME
                </span>

                <strong>
                  {journey.duration}
                </strong>

              </div>

              <div className="route-data-card">

                <span>
                  FUTURE LAYER
                </span>

                <strong>
                  TRANSORA 2100
                </strong>

              </div>

              <div className="route-data-card">

                <span>
                  STATUS
                </span>

                <strong className="status-green">
                  Journey Ready
                </strong>

              </div>

            </section>

            <section className="route-result-card">

              <div>

                <span className="eyebrow">
                  ROUTE FOUND
                </span>

                <h2>
                  {journey.from}
                  {" → "}
                  {journey.to}
                </h2>

                <p>
                  Real route:
                  {" "}
                  {journey.distance}
                  {" · "}
                  {journey.duration}
                </p>

              </div>

              <button
                className="primary-btn"
                onClick={
                  openRouteDetails
                }
              >
                VIEW ROUTE DETAILS →
              </button>

            </section>

            <section
              className={`accessibility-recommendation ${
                accessibility.active
                  ? "active"
                  : ""
              }`}
            >

              <div className="accessibility-rec-icon">
                ♿
              </div>

              <div>

                <span>
                  {accessibility.title}
                </span>

                <h3>
                  {accessibility.message}
                </h3>

              </div>

            </section>

          </>
        )}

      </main>
    );
  }

  /* =======================================================
     ROUTE DETAILS
  ======================================================= */

  function renderRouteDetails() {
    if (!journey) {
      return (
        <main className="inner-page">

          <section className="empty-state">

            <h2>
              No journey selected.
            </h2>

            <p>
              Create a journey first.
            </p>

            <button
              className="primary-btn"
              onClick={openPlanner}
            >
              PLAN JOURNEY
            </button>

          </section>

        </main>
      );
    }

    const futureMobility =
      getFutureMobility();

    return (
      <main className="inner-page route-details-page">

        <section className="inner-hero">

          <div>

            <span className="eyebrow">
              JOURNEY DETAILS
            </span>

            <h1>
              Your route,
              <span> connected.</span>
            </h1>

            <p>
              A complete view of your journey
              from start to destination.
            </p>

          </div>

        </section>

        <section className="route-overview-card">

          <div className="route-location">

            <span>
              FROM
            </span>

            <strong>
              {journey.from}
            </strong>

          </div>

          <div className="route-overview-line">
            <span>
              →
            </span>
          </div>

          <div className="route-location">

            <span>
              TO
            </span>

            <strong>
              {journey.to}
            </strong>

          </div>

        </section>

        <section className="route-stats">

          <div>

            <span>
              DISTANCE
            </span>

            <strong>
              {journey.distance}
            </strong>

          </div>

          <div>

            <span>
              ROAD TIME
            </span>

            <strong>
              {journey.duration}
            </strong>

          </div>

          <div>

            <span>
              MOBILITY
            </span>

            <strong>
              {journey.modes.length}
              {" "}
              options
            </strong>

          </div>

          <div>

            <span>
              ACCESSIBILITY
            </span>

            <strong>
              {journey.accessibility.length}
              {" "}
              active
            </strong>

          </div>

        </section>

        <section className="route-map-card">

          <Map
            from={journey.from}
            to={journey.to}
            route={realRoute}
          />

        </section>

        <section className="future-mobility-section">

          <div className="section-heading">

            <span className="eyebrow">
              ✦ AI FUTURE MOBILITY
            </span>

            <h2>
              Your journey in 2100.
            </h2>

            <p>
              Compare the four TRANSORA
              future mobility options using
              your real route distance.
            </p>

          </div>

          <div className="ai-recommendation-explanation">

            <span>
              ✦
            </span>

            <p>
              Travel times are{" "}
              <strong>
                conceptual estimates
              </strong>{" "}
              calculated using the real route
              distance and each vehicle's
              conceptual normal speed.
            </p>

          </div>

          {selectedAccessibility.length >
            0 && (
            <div className="ai-personalization">

              <Accessibility
                size={28}
              />

              <div>

                <strong>
                  AI PERSONALIZATION ACTIVE
                </strong>

                <p>
                  Your accessibility preferences
                  are influencing the recommendation.
                </p>

              </div>

            </div>
          )}

          <div className="future-mobility-grid">

            {futureMobility.map(
              (option) => {

                const Icon =
                  option.Icon;

                return (
                  <article
                    key={option.id}
                    className={`future-mobility-card ${
                      option.recommended
                        ? "ai-recommended"
                        : ""
                    }`}
                  >

                    {option.recommended && (
                      <div className="ai-recommended-badge">
                        ✦ AI RECOMMENDED
                      </div>
                    )}

                    <div className="future-card-top">

                      <div className="future-icon">

                        <Icon
                          size={32}
                          strokeWidth={1.8}
                        />

                      </div>

                      <div className="future-score">

                        <strong>
                          {option.score}
                        </strong>

                        <span>
                          MATCH
                        </span>

                      </div>

                    </div>

                    <h3>
                      {option.name}
                    </h3>

                    <div className="future-speed">

                      <span>
                        NORMAL SPEED
                      </span>

                      <strong>
                        {option.speedLabel}
                      </strong>

                    </div>

                    <div className="future-time">

                      <Clock
                        size={18}
                      />

                      <strong>
                        {option.time}
                      </strong>

                      <span>
                        min
                      </span>

                    </div>

                    <div className="ai-reasons">

                      {option.reasons.map(
                        (reason) => (
                          <span
                            key={reason}
                          >
                            ✓ {reason}
                          </span>
                        )
                      )}

                    </div>

                  </article>
                );
              }
            )}

          </div>

        </section>

        <section className="route-accessibility-section">

          <div className="section-heading">

            <span className="eyebrow">
              INCLUSIVE MOBILITY
            </span>

            <h2>
              Designed for everyone.
            </h2>

            <p>
              Accessibility is part of the journey,
              not an extra feature.
            </p>

          </div>

          <div className="selected-accessibility">

            {selectedAccessibility.length ===
            0 ? (
              <div className="no-accessibility">
                No specific accessibility
                preferences selected.
              </div>
            ) : (
              selectedAccessibility.map(
                (id) => {

                  const option =
                    accessibilityOptions.find(
                      (item) =>
                        item.id === id
                    );

                  if (!option)
                    return null;

                  return (
                    <div
                      className="selected-accessibility-item"
                      key={id}
                    >

                      <span>
                        {option.icon}
                      </span>

                      <div>

                        <strong>
                          {option.title}
                        </strong>

                        <p>
                          {option.description}
                        </p>

                      </div>

                    </div>
                  );
                }
              )
            )}

          </div>

        </section>

        <section className="route-summary">

          <span className="eyebrow">
            JOURNEY SUMMARY
          </span>

          <h2>
            Ready to travel?
          </h2>

          <p>
            Your route is ready. Start the
            journey to enter TRANSORA's
            live journey mode.
          </p>

          <div className="route-actions">

            <button
              className="secondary-btn"
              onClick={
                resetJourney
              }
            >
              ← CHANGE ROUTE
            </button>

            <button
              className="primary-btn"
              onClick={
                startLiveJourney
              }
            >
              START JOURNEY →
            </button>

          </div>

        </section>

      </main>
    );
  }

  /* =======================================================
     LIVE JOURNEY
  ======================================================= */

  function renderLiveJourney() {
    if (!journey) {
      return (
        <main className="inner-page">

          <section className="empty-state">

            <h2>
              No active journey.
            </h2>

            <button
              className="primary-btn"
              onClick={openPlanner}
            >
              PLAN JOURNEY
            </button>

          </section>

        </main>
      );
    }

    const baseModeId =
      journey.modes?.[0] ||
      "pod";

    const baseModeData =
      transportModes.find(
        (mode) =>
          mode.id ===
          baseModeId
      ) ||
      transportModes.find(
        (mode) =>
          mode.id === "pod"
      );

    const alternativeModeData =
      baseModeData.id ===
      "bus"
        ? transportModes.find(
            (mode) =>
              mode.id ===
              "hyperrail"
          )
        : baseModeData.id ===
          "hyperrail"
        ? transportModes.find(
            (mode) =>
              mode.id === "pod"
          )
        : baseModeData.id ===
          "pod"
        ? transportModes.find(
            (mode) =>
              mode.id === "air"
          )
        : transportModes.find(
            (mode) =>
              mode.id === "bus"
          );

    const baseMode =
      baseModeData.name;

    const alternativeMode =
      alternativeModeData.name;

    const distance =
      Number(
        journey.distanceKm
      ) || 0;

    const traffic =
      getTrafficInfo();

    const TrafficIcon =
      traffic.icon;

    /* -------------------------------------------------------
       VEHICLE ETA
    ------------------------------------------------------- */

    const baseRoadEta =
      Math.max(
        1,
        Math.round(
          (distance /
            baseModeData.normalSpeed) *
            60
        )
      );

    const trafficMultiplier =
      trafficLevel === "heavy"
        ? 1.22
        : trafficLevel ===
          "moderate"
        ? 1.10
        : 1;

    const trafficAdjustedEta =
      Math.max(
        1,
        Math.round(
          baseRoadEta *
            trafficMultiplier
        )
      );

    const alternativeRoadEta =
      Math.max(
        1,
        Math.round(
          (distance /
            alternativeModeData.normalSpeed) *
            60
        )
      );

    const alternativeEta =
      Math.max(
        1,
        alternativeRoadEta +
          Math.max(
            0,
            Math.round(
              trafficDelay / 2
            )
          )
      );

    const currentMode =
      alternativeSelected
        ? alternativeMode
        : baseMode;

    const currentEta =
      alternativeSelected
        ? alternativeEta
        : trafficAdjustedEta;

    const currentModeData =
      alternativeSelected
        ? alternativeModeData
        : baseModeData;

    const CurrentModeIcon =
      currentModeData.icon;

    const remainingDistance =
      Math.max(
        0,
        Number(
          (
            distance *
            (1 -
              liveProgress /
                100)
          ).toFixed(1)
        )
      );

    const liveStatus =
      alternativeSelected
        ? "Alternative vehicle active"
        : "Currently travelling";

    return (
      <main className="inner-page live-page">

        <section className="inner-hero">

          <div>

            <span className="eyebrow">
              LIVE JOURNEY
            </span>

            <h1>
              Journey
              <span> in progress.</span>
            </h1>

            <p>
              TRANSORA is monitoring your journey
              and preparing alternative options.
            </p>

          </div>

          <div className="live-status-pill">

            <span className="live-dot"></span>

            {alternativeSelected
              ? "ALTERNATIVE ACTIVE"
              : "JOURNEY ACTIVE"}

          </div>

        </section>

        <section className="demo-live-notice">

          <div className="demo-live-icon">

            <Activity
              size={26}
            />

          </div>

          <div>

            <strong>
              SIMULATED LIVE DATA
            </strong>

            <p>
              This prototype updates traffic,
              ETA and journey progress automatically
              for demonstration purposes.
            </p>

          </div>

          <span className="live-update-counter">
            UPDATE #{liveUpdate}
          </span>

        </section>

        <section className="live-summary-grid">

          <div className="live-summary-card">

            <span className="live-card-label">
              FROM
            </span>

            <strong>
              {journey.from}
            </strong>

          </div>

          <div className="live-route-arrow">
            →
          </div>

          <div className="live-summary-card">

            <span className="live-card-label">
              TO
            </span>

            <strong>
              {journey.to}
            </strong>

          </div>

          <div className="live-summary-card">

            <span className="live-card-label">
              DISTANCE
            </span>

            <strong>
              {journey.distance}
            </strong>

          </div>

          <div className="live-summary-card">

            <span className="live-card-label">
              ETA
            </span>

            <strong>
              {currentEta} min
            </strong>

          </div>

        </section>

        <section className="live-traffic-section">

          <div className="section-heading-row">

            <div>

              <span className="eyebrow">
                LIVE NETWORK
              </span>

              <h2>
                Current traffic conditions
              </h2>

            </div>

            <span className="status-online">
              ● LIVE MONITORING
            </span>

          </div>

          <div className="live-traffic-grid">

            <div
              className={`live-traffic-card ${traffic.className}`}
            >

              <div className="traffic-card-icon">

                <TrafficIcon
                  size={30}
                />

              </div>

              <div>

                <span>
                  TRAFFIC STATUS
                </span>

                <strong>
                  {traffic.label}
                </strong>

                <p>
                  {traffic.description}
                </p>

              </div>

            </div>

            <div className="live-traffic-card">

              <div className="traffic-card-icon">

                <Timer
                  size={30}
                />

              </div>

              <div>

                <span>
                  TRAFFIC DELAY
                </span>

                <strong>
                  +{trafficDelay} min
                </strong>

                <p>
                  Estimated additional travel
                  time from current conditions.
                </p>

              </div>

            </div>

            <div className="live-traffic-card">

              <div className="traffic-card-icon">

                <Navigation
                  size={30}
                />

              </div>

              <div>

                <span>
                  REMAINING
                </span>

                <strong>
                  {remainingDistance} km
                </strong>

                <p>
                  Approximate distance remaining
                  in the current journey.
                </p>

              </div>

            </div>

          </div>

        </section>

        <section className="journey-progress-section">

          <div className="section-heading-row">

            <div>

              <span className="eyebrow">
                JOURNEY PROGRESS
              </span>

              <h2>
                You're on your way.
              </h2>

            </div>

            <strong className="progress-percentage">

              {Math.round(
                liveProgress
              )}
              %

            </strong>

          </div>

          <div className="journey-progress-card">

            <div className="progress-route-line">

              <div className="progress-start">

                <span></span>

                <small>
                  {journey.from}
                </small>

              </div>

              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${liveProgress}%`,
                  }}
                >

                  <div className="progress-vehicle">

                    <CurrentModeIcon
                      size={20}
                    />

                  </div>

                </div>

              </div>

              <div className="progress-end">

                <span></span>

                <small>
                  {journey.to}
                </small>

              </div>

            </div>

            <div className="progress-info">

              <span>
                {Math.round(
                  liveProgress
                )}
                % journey completed
              </span>

              <span>
                {remainingDistance} km remaining
              </span>

            </div>

          </div>

        </section>

        <section className="live-current-section">

          <div className="section-heading-row">

            <div>

              <span className="eyebrow">
                CURRENT STATUS
              </span>

              <h2>
                Your journey right now
              </h2>

            </div>

            <span className="status-online">
              ● SYSTEM ONLINE
            </span>

          </div>

          <div className="live-current-card">

            <div className="live-vehicle-icon">

              <CurrentModeIcon
                size={36}
                strokeWidth={1.7}
              />

            </div>

            <div className="live-current-info">

              <span className="live-card-label">
                CURRENT VEHICLE
              </span>

              <h3>
                {currentMode}
              </h3>

              <p>
                {liveStatus}. Your vehicle
                is moving toward{" "}
                <strong>
                  {journey.to}
                </strong>
                .
              </p>

            </div>

            <div className="live-eta">

              <span>
                ARRIVAL
              </span>

              <strong>
                {currentEta} min
              </strong>

            </div>

          </div>

        </section>

        <section className="live-alert-card">

          <div className="live-alert-icon">

            {alternativeSelected
              ? "✓"
              : trafficLevel ===
                "heavy"
              ? "⚠"
              : "●"}

          </div>

          <div className="live-alert-content">

            <span>

              {alternativeSelected
                ? "ALTERNATIVE VEHICLE ACTIVE"
                : trafficLevel ===
                  "heavy"
                ? "TRAFFIC ALERT"
                : "LIVE SERVICE UPDATE"}

            </span>

            <h3>

              {alternativeSelected
                ? `${currentMode} is now active`
                : trafficLevel ===
                  "heavy"
                ? "Heavy traffic detected on your route"
                : `${currentMode} is progressing normally`}

            </h3>

            <p>

              {alternativeSelected
                ? "TRANSORA has switched your journey to the alternative mobility option."
                : trafficLevel ===
                  "heavy"
                ? `Current traffic conditions are adding approximately ${trafficDelay} minutes to the journey.`
                : "TRANSORA is continuously monitoring your route and updating the estimated arrival time."}

            </p>

          </div>

          <div className="delay-time">

            {alternativeSelected
              ? "ACTIVE"
              : `+${trafficDelay} min`}

          </div>

        </section>

        <section className="alternative-route-section">

          <div className="section-heading-row">

            <div>

              <span className="eyebrow">
                SMART ALTERNATIVE
              </span>

              <h2>
                Don't let a delay stop your journey.
              </h2>

            </div>

          </div>

          <div className="alternative-route-card">

            <div className="alternative-ai-badge">
              ✦ AI ALTERNATIVE
            </div>

            <div className="alternative-main">

              <div className="alternative-icon">

                {(() => {
                  const AlternativeIcon =
                    alternativeModeData.icon;

                  return (
                    <AlternativeIcon
                      size={36}
                      strokeWidth={1.7}
                    />
                  );
                })()}

              </div>

              <div>

                <span className="live-card-label">

                  {alternativeSelected
                    ? "ACTIVE ALTERNATIVE"
                    : "RECOMMENDED ALTERNATIVE"}

                </span>

                <h3>
                  {alternativeMode}
                </h3>

                <p>
                  Continue your journey using
                  an alternative transport connection.
                </p>

              </div>

              <div className="alternative-time">

                <span>
                  EST. ARRIVAL
                </span>

                <strong>
                  {alternativeEta} min
                </strong>

              </div>

            </div>

            <div className="alternative-features">

              <span>
                ✓ Step-free
              </span>

              <span>
                ✓ Visual guidance
              </span>

              <span>
                ✓ Simple instructions
              </span>

            </div>

            <button
              className="primary-btn"
              onClick={() =>
                setAlternativeSelected(
                  true
                )
              }
            >

              {alternativeSelected
                ? "ALTERNATIVE ACTIVE ✓"
                : "SWITCH TO ALTERNATIVE →"}

            </button>

          </div>

        </section>

        <section className="live-map-section">

          <div className="section-heading-row">

            <div>

              <span className="eyebrow">
                LIVE MAP
              </span>

              <h2>
                Journey tracking
              </h2>

            </div>

            <span className="live-map-status">

              <span className="live-dot"></span>

              TRACKING ACTIVE

            </span>

          </div>

          <div className="live-map-wrapper">

            <Map
              from={
                journey.from ||
                from
              }
              to={
                journey.to ||
                to
              }
              route={realRoute}
            />

          </div>

        </section>

        <section className="live-actions">

          <button
            className="secondary-btn"
            onClick={
              openRouteDetails
            }
          >
            ← VIEW ROUTE DETAILS
          </button>

          <button
            className="primary-btn"
            onClick={
              resetJourney
            }
          >
            FINISH JOURNEY
          </button>

        </section>

      </main>
    );
  }

  /* =======================================================
     FOOTER
  ======================================================= */

  function renderFooter() {
    return (
      <footer className="footer">

        <div className="footer-brand">

          <strong>
            TRANSORA{" "}
            <span>
              2100
            </span>
          </strong>

          <p>
            Your journey. Intelligently connected.
          </p>

        </div>

        <div className="footer-right">
          Future Mobility System · 2100
        </div>

      </footer>
    );
  }

  /* =======================================================
     NAVBAR
  ======================================================= */

  function renderNavbar() {
    return (
      <nav className="navbar">

        <button
          className="brand"
          onClick={goHome}
        >

          <span className="brand-mark">
            T
          </span>

          <span>
            TRANSORA
            <small>
              2100
            </small>
          </span>

        </button>

        <div className="nav-links">

          <button
            className={
              screen === "home"
                ? "active"
                : ""
            }
            onClick={goHome}
          >
            Home
          </button>

          <button
            className={
              [
                "planner",
                "route",
                "live",
              ].includes(screen)
                ? "active"
                : ""
            }
            onClick={
              journey
                ? openRouteDetails
                : openPlanner
            }
          >
            Journey
          </button>

          <button
            className={
              screen === "mobility"
                ? "active"
                : ""
            }
            onClick={
              openMobility
            }
          >
            Mobility
          </button>

          <button
            className={
              screen === "network"
                ? "active"
                : ""
            }
            onClick={
              openNetwork
            }
          >
            Network
          </button>

          <button
              className={screen === "dashboard" ? "active" : ""}
              onClick={openDashboard}
            >
              Dashboard
          </button>

        </div>

        <div className="nav-actions">

          <span className="system-status">

            <span></span>

            SYSTEM ONLINE

          </span>

          <button
            className="text-size-btn"
            onClick={() =>
              setLargeText(
                (previous) =>
                  !previous
              )
            }
          >
            Aa
          </button>
          <button
  className="theme-toggle-btn"
  onClick={toggleTheme}
  aria-label={
    theme === "dark"
      ? "Switch to light mode"
      : "Switch to dark mode"
  }
  title={
    theme === "dark"
      ? "Light mode"
      : "Dark mode"
  }
>
  {theme === "dark" ? (
    <Sun size={18} />
  ) : (
    <Moon size={18} />
  )}
</button>

        </div>

      </nav>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  let page;

  switch (screen) {
    case "planner":
      page =
        renderPlanner();
      break;

    case "mobility":
      page =
        renderMobility();
      break;

    case "network":
      page =
        renderNetwork();
      break;

    case "dashboard":
  page = (
    <Dashboard
      journey={journey}
      trafficLevel={trafficLevel}
      trafficDelay={trafficDelay}
      liveProgress={liveProgress}
      selectedModes={selectedModes}
      journeyHistory={journeyHistory}
    />
  );
  break;

    case "route":
      page =
        renderRouteDetails();
      break;

    case "live":
      page =
        renderLiveJourney();
      break;

    case "home":
    default:
      page =
        renderHome();
      break;
  }

  /* =======================================================
     APP RETURN
  ======================================================= */

  return (
    <div
  className={`app ${
    largeText
      ? "large-text"
      : ""
  } ${
    theme === "light"
      ? "light-mode"
      : ""
  }`}
>

      {renderNavbar()}

      {page}

      {renderFooter()}

    </div>
  );
}

export default App;