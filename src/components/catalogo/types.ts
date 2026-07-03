export type ProductoCardData = {
  id: number;
  slug: string;
  nombre: string;
  categoria?: string;
  imagenUrl?: string | null;
};

export type CategoriaCardData = {
  slug: string;
  nombre: string;
  icono?: string;
  icon?: string;
  count?: number;
};
