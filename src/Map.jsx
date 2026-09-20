 import React, { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* =========================================================
   LEAFLET DEFAULT ICON FIX
========================================================= */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* =========================================================
   MAP CONTROLLER
========================================================= */

function MapController({ center, zoom, route }) {
  const map = useMap();

  useEffect(() => {
    if (route?.coordinates?.length > 1) {
      const bounds = L.latLngBounds(route.coordinates);

      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13,
        animate: true,
        duration: 1.2,
      });

      return;
    }

    if (!center) return;

    map.flyTo(
      [center.lat, center.lon],
      zoom,
      {
        animate: true,
        duration: 1.5,
      }
    );
  }, [center, zoom, route, map]);

  return null;
}

/* =========================================================
   MAP
========================================================= */

function Map({
  from,
  to,
  searchTrigger,
  onRouteFound = () => {},
  onRouteError = () => {},
  route: externalRoute = null,
}) {
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  /* =======================================================
     RECEIVE EXISTING ROUTE
  ======================================================= */

  useEffect(() => {
    if (!externalRoute) return;

    console.log("EXTERNAL ROUTE RECEIVED:", externalRoute);

    setRoute(externalRoute);

    if (externalRoute.start) {
      setStartLocation(externalRoute.start);
    }

    if (externalRoute.end) {
      setEndLocation(externalRoute.end);
    }
  }, [externalRoute]);

  /* =======================================================
     GEOCODING
  ======================================================= */

  const geocodeLocation = async (place) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=lk&q=${encodeURIComponent(
        place
      )}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Location search failed.");
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error(`Could not find location: ${place}`);
    }

    return {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon),
      name: data[0].display_name,
    };
  };

  /* =======================================================
     FIND REAL ROAD ROUTE
  ======================================================= */

  const findRoute = async () => {
    if (!from || !to) return;

    try {
      setLoading(true);
      setRoute(null);
      setStartLocation(null);
      setEndLocation(null);

      onRouteError("");

      console.log("================================");
      console.log("SEARCHING NEW ROUTE");
      console.log("FROM:", from);
      console.log("TO:", to);

      /* -------------------------------------------------
         FIND START LOCATION
      ------------------------------------------------- */

      const start = await geocodeLocation(from);

      console.log("START LOCATION:", start);

      /* -------------------------------------------------
         FIND DESTINATION
      ------------------------------------------------- */

      const end = await geocodeLocation(to);

      console.log("END LOCATION:", end);

      setStartLocation(start);
      setEndLocation(end);

      /* -------------------------------------------------
         OSRM ROUTING
      ------------------------------------------------- */

      const routeURL =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${start.lon},${start.lat};` +
        `${end.lon},${end.lat}` +
        `?overview=full&geometries=geojson&steps=true&alternatives=true`;

      console.log("OSRM URL:", routeURL);

      const routeResponse = await fetch(routeURL);

      if (!routeResponse.ok) {
        throw new Error("Route service is unavailable.");
      }

      const routeData = await routeResponse.json();

      console.log("OSRM RESPONSE:", routeData);

      if (
        routeData.code !== "Ok" ||
        !routeData.routes ||
        routeData.routes.length === 0
      ) {
        throw new Error(
          "No road route found between these locations."
        );
      }

      /* -------------------------------------------------
         MAIN ROUTE
      ------------------------------------------------- */

      const realRoute = routeData.routes[0];

      if (
        !realRoute.geometry ||
        !realRoute.geometry.coordinates
      ) {
        throw new Error(
          "Route geometry was not returned."
        );
      }

      /* -------------------------------------------------
         GEOJSON → LEAFLET
      ------------------------------------------------- */

      const coordinates =
        realRoute.geometry.coordinates.map(
          ([lon, lat]) => [lat, lon]
        );

      /* -------------------------------------------------
         DISTANCE
      ------------------------------------------------- */

      const distanceMeters = Number(
        realRoute.distance
      );

      if (
        !Number.isFinite(distanceMeters) ||
        distanceMeters <= 0
      ) {
        throw new Error(
          "Invalid route distance received."
        );
      }

      const distanceKm = distanceMeters / 1000;

      /* -------------------------------------------------
         DURATION
      ------------------------------------------------- */

      const durationSeconds = Number(
        realRoute.duration
      );

      if (
        !Number.isFinite(durationSeconds) ||
        durationSeconds <= 0
      ) {
        throw new Error(
          "Invalid route duration received."
        );
      }

      const durationMinutes =
        durationSeconds / 60;

      /* -------------------------------------------------
         DISPLAY DURATION
      ------------------------------------------------- */

      const hours = Math.floor(
        durationMinutes / 60
      );

      const minutes = Math.round(
        durationMinutes % 60
      );

      let durationText;

      if (hours > 0) {
        durationText =
          `${hours} hr ${minutes} min`;
      } else {
        durationText =
          `${minutes} min`;
      }

      /* -------------------------------------------------
         ALTERNATIVE ROUTES
      ------------------------------------------------- */

      const alternatives =
        routeData.routes
          .slice(1)
          .map((alternative) => ({
            distance: alternative.distance,
            duration: alternative.duration,
            geometry: alternative.geometry,
          }));

      /* -------------------------------------------------
         COMPLETE ROUTE
      ------------------------------------------------- */

      const result = {
        coordinates,

        distance:
          `${distanceKm.toFixed(1)} km`,

        duration:
          durationText,

        distanceKm,

        distanceMeters,

        durationMinutes,

        durationSeconds,

        start,

        end,

        osrmRoute: realRoute,

        alternatives,
      };

      console.log("================================");
      console.log("REAL ROUTE CREATED");
      console.log(result);
      console.log("================================");

      /* -------------------------------------------------
         SAVE ROUTE INSIDE MAP
      ------------------------------------------------- */

      setRoute(result);

      /* -------------------------------------------------
         SEND ROUTE TO APP
      ------------------------------------------------- */

      onRouteFound({
        from,
        to,

        distance: distanceMeters,

        duration: durationSeconds,

        distanceKm,

        distanceMeters,

        durationMinutes,

        durationSeconds,

        start,

        end,

        coordinates,

        durationText,

        osrmRoute: realRoute,

        alternatives,
      });

    } catch (error) {
      console.error("ROUTE ERROR:", error);

      setRoute(null);

      onRouteError(
        error.message ||
          "Unable to calculate route."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     SEARCH TRIGGER
  ======================================================= */

  useEffect(() => {
    if (!searchTrigger) return;

    findRoute();
  }, [searchTrigger]);

  /* =======================================================
     DEFAULT MAP POSITION
  ======================================================= */

  let mapCenter = {
    lat: 7.8731,
    lon: 80.7718,
  };

  let mapZoom = 7;

  if (startLocation) {
    mapCenter = {
      lat: startLocation.lat,
      lon: startLocation.lon,
    };

    mapZoom = 12;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "600px",
      }}
    >
      {/* LOADING */}

      {loading && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "rgba(5, 8, 22, 0.96)",
            color: "white",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          Finding real road route...
        </div>
      )}

      {/* MAP */}

      <MapContainer
        center={[7.8731, 80.7718]}
        zoom={7}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "18px",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          center={mapCenter}
          zoom={mapZoom}
          route={route}
        />

        {/* START */}

        {startLocation && (
          <Marker
            position={[
              startLocation.lat,
              startLocation.lon,
            ]}
          >
            <Popup>
              <strong>Starting Point</strong>
              <br />
              {from}
            </Popup>
          </Marker>
        )}

        {/* DESTINATION */}

        {endLocation && (
          <Marker
            position={[
              endLocation.lat,
              endLocation.lon,
            ]}
          >
            <Popup>
              <strong>Destination</strong>
              <br />
              {to}
            </Popup>
          </Marker>
        )}

        {/* REAL ROAD ROUTE */}

        {route?.coordinates?.length > 1 && (
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: "#2563eb",
              weight: 7,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}
      </MapContainer>

      {/* ROUTE INFO */}

      {route && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            zIndex: 1000,
            background:
              "rgba(5, 8, 22, 0.96)",
            color: "white",
            padding: "15px 20px",
            borderRadius: "12px",
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.3)",
            minWidth: "250px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              opacity: 0.7,
              marginBottom: "5px",
            }}
          >
            REAL ROAD ROUTE
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            {route.distance}
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "14px",
            }}
          >
            Road time: {route.duration}
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;