import { useEffect } from "react";
import useStore from "./store/useStore";
import { fetchToilets } from "./services/api";
import MapView from "./components/map/MapView";
import Sidebar from "./components/sidebar/Sidebar";
import Header from "./components/ui/Header";
import DetailPanel from "./components/panels/DetailPanel";
import "./index.css";

export default function App() {
  const { setToilets, setLoading, setError } = useStore();

  useEffect(() => {
    setLoading(true);
    fetchToilets()
      .then((res) => setToilets(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="map-area">
          <MapView />
          <DetailPanel />
        </main>
      </div>
    </div>
  );
}
