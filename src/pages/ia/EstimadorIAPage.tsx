import React, { useState } from 'react';
import { Camera, Sparkles, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function EstimadorIAPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const [resultado, setResultado] = useState<{tecnica: string, insumos: string[]} | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview && !description) return;
    
    setIsAnalyzing(true);
    setResultado(null);
    
    try {
      const formData = new FormData();
      formData.append('descripcion', description);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append('imagen', fileInput.files[0]);
      }

      const response = await fetch('http://localhost:8000/api/estimar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al procesar la solicitud con la IA');
      }

      const data = await response.json();
      setResultado({
        tecnica: data.tecnica_detectada,
        insumos: data.insumos_teoricos
      });
    } catch (error) {
      console.error(error);
      alert("Hubo un error al conectar con la IA. Verificá que el backend esté corriendo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-brand-500 selection:text-white">
      <Helmet>
        <title>Estimador IA | Mercería Matilde</title>
      </Helmet>

      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-brand-400" />
            <span className="font-outfit font-bold text-xl tracking-tight text-white">Matilde<span className="text-brand-400">.IA</span></span>
          </div>
          <a href="/" className="text-sm font-medium text-stone-400 hover:text-white transition-colors">
            Volver a la tienda
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-outfit mb-4 text-white">
            Estimá tus materiales <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-pink-500">con IA</span>
          </h1>
          <p className="text-lg text-stone-400 max-w-xl mx-auto">
            Subí una foto del proyecto que querés hacer o describilo en texto. Nuestra inteligencia artificial calculará los insumos exactos que necesitás.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="bg-stone-800/50 border border-stone-700/50 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
          
          {/* Image Upload Area */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-stone-300 mb-2">Foto de referencia (Opcional pero recomendada)</label>
            <div className="relative group">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`border-2 border-dashed rounded-xl overflow-hidden transition-all flex flex-col items-center justify-center min-h-[200px]
                ${imagePreview ? 'border-brand-500 bg-stone-900' : 'border-stone-600 bg-stone-800/80 group-hover:border-stone-400'}`}>
                
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover max-h-[400px]" />
                ) : (
                  <div className="text-center p-6">
                    <div className="bg-stone-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-stone-600 transition-colors">
                      <Camera className="w-8 h-8 text-stone-400 group-hover:text-stone-300" />
                    </div>
                    <p className="text-stone-300 font-medium">Tocá para subir una foto</p>
                    <p className="text-stone-500 text-sm mt-1">Formatos JPG o PNG.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Area */}
          <div className="mb-8">
            <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-2">
              ¿Qué querés hacer? ¿Tenés detalles específicos?
            </label>
            <textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Quiero tejer un chaleco talle M para mujer, a dos agujas."
              className="w-full bg-stone-900 border border-stone-700 rounded-xl p-4 text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none min-h-[120px]"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 mb-8 text-sm text-blue-200">
            <AlertCircle className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
            <p>
              El cálculo es una <strong>estimación teórica</strong> generada por Inteligencia Artificial y puede variar según la tensión del tejido, el grosor real del material y la técnica utilizada.
            </p>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isAnalyzing || (!imagePreview && !description)}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg shadow-brand-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analizando el proyecto...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Estimar Insumos con IA
              </>
            )}
          </button>
        </form>

        {/* Results Area */}
        {resultado && (
          <div className="mt-8 bg-stone-800/80 border border-brand-500/50 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center mb-6">
              <Sparkles className="w-6 h-6 text-brand-400 mr-3" />
              <h2 className="text-2xl font-bold font-outfit text-white">Resultados de la IA</h2>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-2">Técnica Detectada</h3>
              <p className="text-lg text-white font-medium bg-stone-900 inline-block px-4 py-2 rounded-lg border border-stone-700">
                {resultado.tecnica}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">Insumos Teóricos Necesarios</h3>
              <ul className="space-y-3">
                {resultado.insumos.map((insumo, index) => (
                  <li key={index} className="flex items-start bg-stone-900/50 p-4 rounded-xl border border-stone-700/50">
                    <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm mr-4 mt-0.5 shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-stone-200">{insumo}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
