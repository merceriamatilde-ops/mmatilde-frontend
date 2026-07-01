export const API_BASE =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5015/api');

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('mmatilde_token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('mmatilde_token');
    localStorage.removeItem('mmatilde_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'API Error');
  }

  // Handle empty 200 OK responses
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// API Methods
export const api = {
  login: (data: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getHomeData: () => apiFetch<any>('/catalogo/home'),
  
  // Categorias (Public)
  getCategorias: () => apiFetch<any>('/categorias'),
  getCategoriaProductos: (slug: string, sub?: string) => 
    apiFetch<any>(`/categorias/${slug}/productos${sub ? `?sub=${encodeURIComponent(sub)}` : ''}`),

  // Categorias (Admin)
  getCategoriasAdmin: () => apiFetch<any>('/categorias/admin'),
  createCategoria: (nombre: string) => apiFetch<any>('/categorias', { method: 'POST', body: JSON.stringify({ nombre }) }),
  updateCategoria: (id: number, nombre: string) => apiFetch<any>(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
  deleteCategoria: (id: number) => apiFetch<any>(`/categorias/${id}`, { method: 'DELETE' }),

  createSubcategoria: (categoriaId: number, nombre: string) => apiFetch<any>('/categorias/subcategorias', { method: 'POST', body: JSON.stringify({ categoriaId, nombre }) }),
  updateSubcategoria: (id: number, nombre: string) => apiFetch<any>(`/categorias/subcategorias/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
  deleteSubcategoria: (id: number) => apiFetch<any>(`/categorias/subcategorias/${id}`, { method: 'DELETE' }),
  
  // Productos (Public)
  getProducto: (slug: string) => apiFetch<any>(`/productos/${slug}`),
  buscarProductos: (q: string) => apiFetch<any>(`/catalogo/buscar?q=${encodeURIComponent(q)}`),
  getDashboardStats: () => apiFetch<any>('/catalogo/dashboard'),
  
  // Productos (Admin)
  getProductosAdmin: (params: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value.toString());
      }
    });
    return apiFetch<any>(`/productos?${query.toString()}`);
  },
  getProductoAdmin: (id: number) => apiFetch<any>(`/productos/admin/${id}`),
  createProducto: (data: any) => apiFetch<any>('/productos', { method: 'POST', body: JSON.stringify(data) }),
  updateProducto: (id: number, data: any) => apiFetch<any>(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProducto: (id: number) => apiFetch<any>(`/productos/${id}`, { method: 'DELETE' }),
  toggleProductoActivo: (id: number, activo: boolean) => apiFetch<any>(`/productos/${id}/toggle-activo`, { method: 'PUT', body: JSON.stringify({ value: activo }) }),
  toggleProductoDestacado: (id: number, destacado: boolean) => apiFetch<any>(`/productos/${id}/toggle-destacado`, { method: 'PUT', body: JSON.stringify({ value: destacado }) }),
  bulkToggleProductos: (ids: number[], activo: boolean) => apiFetch<any>('/productos/bulk-toggle', { method: 'PUT', body: JSON.stringify({ ids, activo }) }),

  // Upload
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<any>('/upload', { method: 'POST', body: formData });
  },
  executeSync: (terms: string[]) => apiFetch<any>('/sync', { method: 'POST', body: JSON.stringify({ terms }) }),
  getSyncLogs: () => apiFetch<any>('/sync/logs'),
  getConfiguracion: () => apiFetch<any>('/configuracion'),
  updateConfiguracion: (values: Record<string, string>) => apiFetch('/configuracion', { method: 'PUT', body: JSON.stringify({ values }) }),
  getAllCategorias: () => apiFetch<any>('/categorias?includeEmpty=true'),
  
  // Colores
  getColores: () => apiFetch<any[]>('/colores'),
  createColor: (data: any) => apiFetch<any>('/colores', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateColor: (id: number, data: any) => apiFetch<any>(`/colores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteColor: (id: number) => apiFetch<any>(`/colores/${id}`, { method: 'DELETE' }),

  // Asistente IA (admin)
  getIaConsultas: (query = '') => apiFetch<any[]>(`/ia/consultas${query}`),
  getIaConsulta: (id: number) => apiFetch<any>(`/ia/consultas/${id}`),
  enviarIaFeedback: (id: number, data: any) =>
    apiFetch<any>(`/ia/consultas/${id}/feedback`, { method: 'PUT', body: JSON.stringify(data) }),
  registrarIaConsulta: (data: {
    proyecto: string;
    tecnica?: string | null;
    contextoJson: string;
    resultadoJson: string;
    productosJson?: string;
    idempotencyKey?: string;
  }) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (data.idempotencyKey) {
      headers['X-Idempotency-Key'] = data.idempotencyKey;
    }
    return apiFetch<any>('/ia/consultas', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        proyecto: data.proyecto,
        tecnica: data.tecnica,
        contextoJson: data.contextoJson,
        resultadoJson: data.resultadoJson,
        productosJson: data.productosJson,
      }),
    });
  },
  getIaReglas: () => apiFetch<any[]>('/ia/reglas'),
  crearIaRegla: (data: any) => apiFetch<any>('/ia/reglas', { method: 'POST', body: JSON.stringify(data) }),
  toggleIaRegla: (id: number) => apiFetch<any>(`/ia/reglas/${id}/toggle`, { method: 'PUT' }),
  getIaEjemplos: () => apiFetch<any[]>('/ia/ejemplos'),
  crearIaEjemplo: (data: any) => apiFetch<any>('/ia/ejemplos', { method: 'POST', body: JSON.stringify(data) }),
  toggleIaEjemplo: (id: number) => apiFetch<any>(`/ia/ejemplos/${id}/toggle`, { method: 'PUT' }),
  eliminarIaEjemplo: (id: number) => apiFetch<void>(`/ia/ejemplos/${id}`, { method: 'DELETE' }),
};
