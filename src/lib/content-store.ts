import { create } from "zustand";
import type { ContentItem, ContentFilterOptions } from "@/lib/types";

interface ContentStore {
  // State
  items: ContentItem[];
  loading: boolean;
  error: string | null;
  selectedItem: ContentItem | null;
  showAddModal: boolean;
  showViewerModal: boolean;
  showDeleteConfirm: boolean;
  deleteConfirmId: string | null;
  filters: ContentFilterOptions;
  viewMode: "grid" | "list";
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Data Actions
  fetchItems: (filters?: ContentFilterOptions) => Promise<void>;
  fetchItemById: (id: string) => Promise<ContentItem | null>;
  createItem: (item: Omit<ContentItem, "id" | "createdAt" | "updatedAt" | "is_read" | "is_archived" | "key_points" | "tags" | "category"> & { key_points?: string[]; tags?: string[]; category?: string }) => Promise<ContentItem | null>;
  updateItem: (id: string, updates: Partial<ContentItem>) => Promise<ContentItem | null>;
  deleteItem: (id: string, archive?: boolean) => Promise<boolean>;
  markAsRead: (id: string) => Promise<ContentItem | null>;
  extractMetadata: (url: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;

  // UI Actions
  selectItem: (item: ContentItem | null) => void;
  setShowAddModal: (show: boolean) => void;
  setShowViewerModal: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean, id?: string) => void;
  setFilters: (filters: ContentFilterOptions) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setError: (error: string | null) => void;
  resetFilters: () => void;
}

const defaultFilters: ContentFilterOptions = {
  is_archived: false,
};

export const useContentStore = create<ContentStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  selectedItem: null,
  showAddModal: false,
  showViewerModal: false,
  showDeleteConfirm: false,
  deleteConfirmId: null,
  filters: defaultFilters,
  viewMode: "grid",
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },

  fetchItems: async (filters) => {
    set({ loading: true, error: null });
    
    const currentFilters = filters || get().filters;
    
    try {
      // Build query params
      const params = new URLSearchParams();
      if (currentFilters.search) params.set("search", currentFilters.search);
      if (currentFilters.content_type) params.set("content_type", currentFilters.content_type);
      if (currentFilters.category) params.set("category", currentFilters.category);
      if (currentFilters.is_read !== undefined) params.set("is_read", String(currentFilters.is_read));
      if (currentFilters.is_archived !== undefined) params.set("is_archived", String(currentFilters.is_archived));
      if (currentFilters.tags?.length) params.set("tags", currentFilters.tags.join(","));
      
      params.set("page", String(get().pagination.page));
      params.set("limit", String(get().pagination.limit));

      const response = await fetch(`/api/content?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch content items");
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch content items");
      }

      set({
        items: data.data.map((item: ContentItem) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          read_at: item.read_at ? new Date(item.read_at) : undefined,
        })),
        pagination: data.pagination || get().pagination,
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch content items";
      set({ error: message, loading: false });
    }
  },

  fetchItemById: async (id: string) => {
    try {
      const response = await fetch(`/api/content/${id}`);
      if (!response.ok) throw new Error("Failed to fetch content item");
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch content item");
      }

      return {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
        read_at: data.data.read_at ? new Date(data.data.read_at) : undefined,
      };
    } catch (error) {
      console.error("Failed to fetch content item:", error);
      return null;
    }
  },

  createItem: async (itemData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create content item");
      }

      const data = await response.json();
      const newItem = {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };

      set((state) => ({
        items: [newItem, ...state.items],
        loading: false,
        showAddModal: false,
      }));

      return newItem;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create content item";
      set({ error: message, loading: false });
      return null;
    }
  },

  updateItem: async (id: string, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/content/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update content item");
      }

      const data = await response.json();
      const updatedItem = {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };

      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? updatedItem : item
        ),
        selectedItem: state.selectedItem?.id === id ? updatedItem : state.selectedItem,
        loading: false,
      }));

      return updatedItem;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update content item";
      set({ error: message, loading: false });
      return null;
    }
  },

  deleteItem: async (id: string, archive = true) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/content/${id}?archive=${archive}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete content item");
      }

      set((state) => ({
        items: archive
          ? state.items.map((item) =>
              item.id === id ? { ...item, is_archived: true } : item
            )
          : state.items.filter((item) => item.id !== id),
        selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
        loading: false,
        showDeleteConfirm: false,
        deleteConfirmId: null,
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete content item";
      set({ error: message, loading: false });
      return false;
    }
  },

  markAsRead: async (id: string) => {
    return get().updateItem(id, { is_read: true });
  },

  extractMetadata: async (url: string) => {
    try {
      const response = await fetch("/api/content/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || "Failed to extract metadata" };
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to extract metadata";
      return { success: false, error: message };
    }
  },

  selectItem: (item) => set({ selectedItem: item }),
  setShowAddModal: (show) => set({ showAddModal: show, error: null }),
  setShowViewerModal: (show) => set({ showViewerModal: show }),
  setShowDeleteConfirm: (show, id) =>
    set({ showDeleteConfirm: show, deleteConfirmId: id || null }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters }, pagination: { ...get().pagination, page: 1 } }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setError: (error) => set({ error }),
  resetFilters: () => set({ filters: defaultFilters, pagination: { ...get().pagination, page: 1 } }),
}));
