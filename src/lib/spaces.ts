// Shared helpers and types for space-related data.

export type SpaceVisibility = "internal" | "external";

export type Space = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

