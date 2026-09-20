 import {
  Activity,
  Navigation,
  Gauge,
  TrainFront,
  CarFront,
  Plane,
  BusFront,
} from "lucide-react";

function Dashboard({
  journey,
  trafficLevel,
  trafficDelay,
  liveProgress,
  selectedModes,
  journeyHistory,
}) {
  const distance = Number(journey?.distanceKm) || 0;

  const trafficLabel =
    trafficLevel === "heavy"
      ? "HEAVY"
      : trafficLevel === "moderate"
      ? "MODERATE"
      : "NORMAL";

  const trafficClass =
    trafficLevel === "heavy"
      ? "traffic-heavy"
      : trafficLevel === "moderate"
      ? "traffic-moderate"
      : "traffic-normal";

  const modes = [
    {
      id: "hyperrail",
      name: "HyperRail",
      icon: TrainFront,
    },
    {
      id: "pod",
      name: "Autonomous Pod",
      icon: CarFront,
    },
    {
      id: "air",
      name: "Air Taxi",
      icon: Plane,
    },
    {
      id: "bus",
      name: "Smart Bus",
      icon: BusFront,
    },
  ];

  return (
    <main className="inner-page">

      {/* HEADER */}
      <section className="inner-hero">

        <div>
          <span className="eyebrow">
            TRANSORA 2100
          </span>

          <h1>
            Network
            <span> dashboard.</span>
          </h1>

          <p>
            Your mobility network at a glance.
          </p>
        </div>

        <div className="live-status-pill">
          <span className="live-dot"></span>
          SYSTEM ONLINE
        </div>

      </section>


      {/* QUICK STATS */}
      <section className="route-data-grid">

        <div className="route-data-card">
          <span>JOURNEY</span>
          <strong>
            {journey ? "ACTIVE" : "READY"}
          </strong>
        </div>

        <div className="route-data-card">
          <span>DISTANCE</span>
          <strong>
            {distance > 0
              ? `${distance.toFixed(1)} km`
              : "—"}
          </strong>
        </div>

        <div className="route-data-card">
          <span>TRAFFIC</span>
          <strong className={trafficClass}>
            {trafficLabel}
          </strong>
        </div>

        <div className="route-data-card">
          <span>NETWORK</span>
          <strong className="status-green">
            ONLINE
          </strong>
        </div>

      </section>


      {/* CURRENT JOURNEY */}
      {journey && (
        <section className="section">

          <div className="section-heading-row">

            <div>
              <span className="eyebrow">
                CURRENT JOURNEY
              </span>

              <h2>
                {journey.from}
                {" → "}
                {journey.to}
              </h2>
            </div>

            <span className="status-online">
              ● LIVE
            </span>

          </div>

          <div className="route-stats">

            <div>
              <span>DISTANCE</span>
              <strong>
                {journey.distance}
              </strong>
            </div>

            <div>
              <span>DURATION</span>
              <strong>
                {journey.duration}
              </strong>
            </div>

            <div>
              <span>PROGRESS</span>
              <strong>
                {Math.round(liveProgress)}%
              </strong>
            </div>

            <div>
              <span>DELAY</span>
              <strong>
                +{trafficDelay} min
              </strong>
            </div>

          </div>

        </section>
      )}


      {/* TRANSPORT MODES */}
      <section className="section">

        <div className="section-heading-row">

          <div>
            <span className="eyebrow">
              MOBILITY NETWORK
            </span>

            <h2>
              Available transport.
            </h2>
          </div>

          <span className="status-online">
            ● CONNECTED
          </span>

        </div>

        <div className="future-mobility-grid">

          {modes.map((mode) => {

            const Icon = mode.icon;
            const active =
              selectedModes?.includes(mode.id);

            return (
              <article
                className="future-mobility-card"
                key={mode.id}
              >

                <div className="future-card-top">

                  <div className="future-icon">
                    <Icon
                      size={28}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="future-score">
                    <strong>
                      {active ? "ON" : "READY"}
                    </strong>

                    <span>
                      STATUS
                    </span>
                  </div>

                </div>

                <h3>
                  {mode.name}
                </h3>

                <div className="future-speed">
                  <span>
                    NETWORK
                  </span>

                  <strong>
                    CONNECTED
                  </strong>
                </div>

              </article>
            );
          })}

        </div>

      </section>


      {/* SYSTEM STATUS */}
      <section className="section">

        <div className="section-heading">

          <span className="eyebrow">
            SYSTEM STATUS
          </span>

          <h2>
            Everything connected.
          </h2>

        </div>

        <div className="live-traffic-grid">

          <div className="live-traffic-card">

            <div className="traffic-card-icon">
              <Gauge size={28} />
            </div>

            <div>
              <span>NETWORK HEALTH</span>
              <strong>98%</strong>
              <p>
                Systems operating normally.
              </p>
            </div>

          </div>


          <div className="live-traffic-card">

            <div className="traffic-card-icon">
              <Navigation size={28} />
            </div>

            <div>
              <span>ROUTE ENGINE</span>
              <strong>ACTIVE</strong>
              <p>
                Real road routing available.
              </p>
            </div>

          </div>


          <div className="live-traffic-card">

            <div className="traffic-card-icon">
              <Activity size={28} />
            </div>

            <div>
              <span>LIVE DATA</span>
              <strong>ONLINE</strong>
              <p>
                Mobility network monitoring active.
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* JOURNEY HISTORY */}

      <section className="section">

        <div className="section-heading">

          <span className="eyebrow">
            JOURNEY HISTORY
          </span>

          <h2>
            Recent journeys.
          </h2>

          <p>
            Your recently calculated routes.
          </p>

        </div>

        {journeyHistory?.length > 0 ? (

          <div className="route-data-grid">

            {journeyHistory.map((item) => (

              <div
                className="route-data-card"
                key={item.id}
              >

                <span>
                  {item.date}
                </span>

                <strong>
                  {item.from}
                  {" → "}
                  {item.to}
                </strong>

                <p>
                  {item.distance}
                  {" · "}
                  {item.duration}
                </p>

              </div>

            ))}

          </div>

        ) : (

          <div className="empty-state">

            <h2>
              No journey history
            </h2>

            <p>
              Your calculated routes will appear here.
            </p>

          </div>

        )}

      </section>
      
    </main>
  );
}

export default Dashboard;