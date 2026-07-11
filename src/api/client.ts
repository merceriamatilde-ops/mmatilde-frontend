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
    const err = new Error(errText || 'API Error') as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  // Handle empty 200 OK responses
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// API Methods
export const api = {
  login: (data: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getHomeData: () => apiFetch<any>('/catalogo/home'),
  getColecciones: () => apiFetch<any[]>('/catalogo/colecciones'),
  getColeccion: (slug: string, categoria?: string) => {
    const q = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    return apiFetch<any>(`/catalogo/colecciones/${slug}${q}`);
  },
  
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
  syncProducto: (id: number) => apiFetch<any>(`/productos/${id}/sync`, { method: 'POST' }),
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

  // Tags / Colecciones
  getTags: () => apiFetch<any[]>('/tags'),
  getTagsActivos: () => apiFetch<any[]>('/tags/activos'),
  createTag: (data: any) => apiFetch<any>('/tags', { method: 'POST', body: JSON.stringify(data) }),
  updateTag: (id: number, data: any) => apiFetch<any>(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTag: (id: number) => apiFetch<any>(`/tags/${id}`, { method: 'DELETE' }),

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

  // Precios
  getPrecioConfig: () => apiFetch<any>('/precios/config'),
  updatePrecioConfig: (data: { ivaPorcentaje: number; margenGlobal: number }) =>
    apiFetch('/precios/config', { method: 'PUT', body: JSON.stringify(data) }),
  getReglasPrecio: () => apiFetch<any[]>('/precios/reglas'),
  createReglaPrecio: (data: any) =>
    apiFetch<any>('/precios/reglas', { method: 'POST', body: JSON.stringify(data) }),
  deleteReglaPrecio: (id: number) => apiFetch(`/precios/reglas/${id}`, { method: 'DELETE' }),
  getProductoPrecios: (id: number) => apiFetch<any>(`/precios/producto/${id}`),
  updateProductoPrecios: (id: number, data: any) =>
    apiFetch<any>(`/precios/producto/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  detectarUnidadProducto: (id: number) =>
    apiFetch<any>(`/precios/producto/${id}/detectar-unidad`, { method: 'POST' }),
  recalcularPreciosProducto: (id: number) =>
    apiFetch<any>(`/precios/producto/${id}/recalcular`, { method: 'POST' }),

  // Ventas
  getVentas: (params: Record<string, string>) => {
    const query = new URLSearchParams(params);
    return apiFetch<any[]>(`/ventas?${query.toString()}`);
  },
  buscarProductosVenta: (q: string, limit = 8) =>
    apiFetch<any[]>(`/ventas/productos-buscar?q=${encodeURIComponent(q)}&limit=${limit}`),
  getVentaCarrito: () => apiFetch<{ updatedAt?: string | null; payload?: any | null }>('/ventas/carrito'),
  saveVentaCarrito: (payload: any) =>
    apiFetch('/ventas/carrito', { method: 'PUT', body: JSON.stringify({ payload }) }),
  clearVentaCarrito: () => apiFetch('/ventas/carrito', { method: 'DELETE' }),
  getProductoPrecioVenta: (id: number) => apiFetch<any>(`/ventas/producto/${id}/precio`),
  getVenta: (id: number) => apiFetch<any>(`/ventas/${id}`),
  getVentaResumen: (fecha: string, turno: string) =>
    apiFetch<any>(`/ventas/resumen?fecha=${fecha}&turno=${turno}`),
  createVenta: (data: any) =>
    apiFetch<any>('/ventas', { method: 'POST', body: JSON.stringify(data) }),
  updateVenta: (id: number, data: any) =>
    apiFetch<any>(`/ventas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVenta: (id: number) => apiFetch(`/ventas/${id}`, { method: 'DELETE' }),

  // Medios de pago
  getMediosPago: () => apiFetch<any[]>('/medios-pago'),
  getMediosPagoActivos: () => apiFetch<any[]>('/medios-pago/activos'),
  createMedioPago: (data: any) =>
    apiFetch<any>('/medios-pago', { method: 'POST', body: JSON.stringify(data) }),
  updateMedioPago: (id: number, data: any) =>
    apiFetch<any>(`/medios-pago/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setMedioPagoDefault: (id: number) =>
    apiFetch(`/medios-pago/${id}/default`, { method: 'PUT' }),
  deleteMedioPago: (id: number) => apiFetch(`/medios-pago/${id}`, { method: 'DELETE' }),

  // Turnos de venta
  getTurnosVenta: () => apiFetch<any[]>('/turnos-venta'),
  getTurnosVentaActivos: () => apiFetch<any[]>('/turnos-venta/activos'),
  createTurnoVenta: (data: any) =>
    apiFetch<any>('/turnos-venta', { method: 'POST', body: JSON.stringify(data) }),
  updateTurnoVenta: (id: number, data: any) =>
    apiFetch<any>(`/turnos-venta/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTurnoVenta: (id: number) => apiFetch(`/turnos-venta/${id}`, { method: 'DELETE' }),

  // Estadísticas
  getEstadisticasResumen: (params: Record<string, string>) => {
    const query = new URLSearchParams(params);
    return apiFetch<any>(`/estadisticas/resumen?${query.toString()}`);
  },

  // Usuarios (solo ADMIN)
  getUsuarios: () => apiFetch<any[]>('/usuarios'),
  createUsuario: (data: {
    email: string;
    nombre: string;
    password: string;
    rol: string;
  }) => apiFetch<any>('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  updateUsuario: (id: string, data: {
    email: string;
    nombre: string;
    rol: string;
    activo: boolean;
  }) => apiFetch<any>(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setUsuarioPassword: (id: string, password: string) =>
    apiFetch(`/usuarios/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  deleteUsuario: (id: string) => apiFetch(`/usuarios/${id}`, { method: 'DELETE' }),
};
