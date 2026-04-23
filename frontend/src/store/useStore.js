import { create } from "zustand";

const useStore = create((set, get) => ({
  mode: "markers",
  setMode: (mode) => set({ mode }),

  filters: { fee: "all", wc: "all", access: "all" },
  setFilter: (key, val) => set((s) => ({ filters: { ...s.filters, [key]: val } })),

  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  sortBy: "distance",   // "distance" | "score"
  setSortBy: (sortBy) => set({ sortBy }),

  toilets: [],
  loading: false,
  error: null,
  setToilets: (toilets) => set({ toilets }),
  setLoading:  (loading) => set({ loading }),
  setError:    (error) => set({ error }),

  selectedToilet: null,
  selectToilet:  (toilet) => set({ selectedToilet: toilet }),
  clearSelection: () => set({ selectedToilet: null }),

  userPos: null,
  setUserPos: (pos) => set({ userPos: pos }),

  bufferRadius: 500,
  setBufferRadius: (r) => set({ bufferRadius: r }),

  routeInfo: null,
  setRouteInfo: (info) => set({ routeInfo: info }),
  clearRoute:  () => set({ routeInfo: null }),

  getFiltered: () => {
    const { toilets, filters, searchQuery } = get();
    return toilets.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.name.toLowerCase().includes(q)) return false;
      }
      const feeVal = (t.fee || "").toLowerCase();
      const isFree = feeVal === "no";
      const isPaid = feeVal === "yes" || /\d/.test(feeVal) || /baht|thb|฿/.test(feeVal);
      if (filters.fee === "no" && !isFree) return false;
      if (filters.fee === "yes" && !isPaid) return false;
      const wc = (t.wheelchair || "").toLowerCase();
      if (filters.wc === "yes" && !["yes","designated","limited"].includes(wc)) return false;
      const acc = (t.access || "").toLowerCase();
      if (filters.access === "public" && acc !== "" && acc !== "yes" && acc !== "permissive") return false;
      return true;
    });
  },
}));

export default useStore;
