/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, DragEvent } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  Printer, 
  ArrowLeft, 
  Info,
  CheckSquare,
  Download,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Section {
  id: string;
  title: string;
  color: string;
  example: string;
}

const SECTIONS: Section[] = [
  { 
    id: 'lieu', 
    title: 'Le lieu', 
    color: 'bg-accent', 
    example: "J'ai vérifié l'accessibilité du lieu (accès PMR, signalétique)" 
  },
  { 
    id: 'outils', 
    title: 'Les outils et équipements', 
    color: 'bg-accent', 
    example: "J'ai testé le vidéoprojecteur et la connectique avant la séance" 
  },
  { 
    id: 'ressources', 
    title: 'Les ressources à prévoir', 
    color: 'bg-accent', 
    example: "J'ai imprimé les supports de formation en nombre suffisant" 
  },
  { 
    id: 'temporel', 
    title: 'Les contraintes temporelles', 
    color: 'bg-accent', 
    example: "J'ai prévu des pauses régulières toutes les 90 minutes" 
  },
  { 
    id: 'handicap', 
    title: 'Les adaptations aux situations de handicap', 
    color: 'bg-accent', 
    example: "J'ai identifié en amont les besoins spécifiques des participants" 
  },
];

export default function App() {
  const [items, setItems] = useState<Record<string, ChecklistItem[]>>({
    lieu: [],
    outils: [],
    ressources: [],
    temporel: [],
    handicap: [],
  });
  const [isPreview, setIsPreview] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ sectionId: string; index: number } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const totalItems = useMemo(() => {
    return Object.values(items).reduce((acc: number, sectionItems) => acc + (sectionItems as ChecklistItem[]).length, 0);
  }, [items]);

  const addItem = (sectionId: string, afterIndex?: number) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newItem: ChecklistItem = {
      id: newId,
      text: '',
      checked: false,
    };
    
    setItems(prev => {
      const sectionItems = [...prev[sectionId]];
      if (typeof afterIndex === 'number') {
        sectionItems.splice(afterIndex + 1, 0, newItem);
      } else {
        sectionItems.push(newItem);
      }
      return {
        ...prev,
        [sectionId]: sectionItems,
      };
    });
    setFocusId(newId);
  };

  const updateItem = (sectionId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    setItems(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    setItems(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter(item => item.id !== itemId),
    }));
  };

  // Native Drag and Drop Handlers
  const handleDragStart = (sectionId: string, index: number) => {
    setDraggedItem({ sectionId, index });
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (sectionId: string, dropIndex: number) => {
    if (!draggedItem || draggedItem.sectionId !== sectionId) return;

    const sectionItems = [...items[sectionId]];
    const [movedItem] = sectionItems.splice(draggedItem.index, 1);
    sectionItems.splice(dropIndex, 0, movedItem);

    setItems(prev => ({
      ...prev,
      [sectionId]: sectionItems,
    }));
    setDraggedItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const element = document.querySelector('.print-area') as HTMLElement;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Ma_Checklist_Formation_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const ReturnButton = () => (
    <div className="max-w-4xl mx-auto px-4 pt-6 no-print">
      <a 
        href="https://1001parcours.cci.fr/experience/mod/page/view.php?id=2110" 
        className="inline-flex items-center gap-3 bg-accent text-white px-8 py-4 rounded-xl hover:opacity-90 transition-all shadow-xl hover:-translate-y-1 font-bold text-lg border-2 border-white/20"
      >
        <ArrowLeft size={24} />
        Retour à la formation
        <ExternalLink size={18} className="opacity-50" />
      </a>
    </div>
  );

  if (isPreview) {
    return (
      <div className="min-h-screen bg-white pb-24 flex flex-col">
        <ReturnButton />
        
        <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
          <div className="mb-8 no-print">
            <button 
              onClick={() => setIsPreview(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-accent transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              Retour à l'édition
            </button>
          </div>

          <div className="print-area bg-white p-4">
            <header className="text-center mb-10 border-b pb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ma checklist personnalisée</h1>
              <p className="text-gray-500">
                Créée le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </header>

            <div className="space-y-8">
              {SECTIONS.map(section => {
                const sectionItems = items[section.id].filter(item => item.text.trim() !== '');
                return (
                  <div key={section.id} className="card break-inside-avoid">
                    <h2 className={`text-xl font-bold mb-4 flex items-center gap-2`}>
                      <span className={`w-3 h-3 rounded-full ${section.color}`}></span>
                      {section.title}
                    </h2>
                    <div className="space-y-3 pl-5">
                      {sectionItems.length > 0 ? (
                        sectionItems.map(item => (
                          <div key={item.id} className="flex items-start gap-3 py-1">
                            <div className="w-5 h-5 border-2 border-gray-300 rounded mt-0.5 flex-shrink-0"></div>
                            <span className="text-gray-800">{item.text}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 italic">Aucun élément ajouté dans cette section.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 no-print">
            <button 
              onClick={handleDownload}
              className="flex items-center justify-center gap-3 bg-white border-2 border-accent text-accent px-8 py-4 rounded-full hover:bg-accent/5 transition-all shadow-lg hover:-translate-y-1 font-bold text-lg"
            >
              <Download size={24} />
              Télécharger (PDF)
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center gap-3 bg-accent text-white px-8 py-4 rounded-full hover:opacity-90 transition-all shadow-xl hover:shadow-accent/20 hover:-translate-y-1 font-bold text-lg"
            >
              <Printer size={24} />
              Imprimer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <ReturnButton />
      
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm mt-6">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                Ma checklist de préparation — Formation
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full font-semibold">
              <CheckSquare size={20} />
              <span>{totalItems} élément{totalItems > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Instructions */}
        <section className="bg-white border-l-4 border-accent p-6 rounded-r-xl shadow-sm flex gap-4 items-start">
          <div className="bg-accent/10 p-2 rounded-lg text-accent shrink-0">
            <Info size={24} />
          </div>
          <p className="text-gray-700 leading-relaxed">
            Construisez votre propre checklist en ajoutant, pour chaque catégorie, les éléments que vous devez vérifier avant votre formation. Une fois terminé, cliquez sur <span className="font-bold">"Terminé"</span> pour télécharger votre checklist prête à imprimer.
          </p>
        </section>

        {/* Sections */}
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <motion.div 
              layout
              key={section.id} 
              className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
            >
              <div className={`${section.color} px-6 py-4 flex justify-between items-center`}>
                <h2 className="text-white font-bold text-lg">{section.title}</h2>
                <button 
                  onClick={() => addItem(section.id)}
                  className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  <Plus size={18} />
                  Ajouter
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-gray-400 italic text-sm mb-6 flex items-center gap-2">
                  <Info size={14} />
                  Exemple : {section.example}
                </p>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items[section.id].length > 0 ? (
                      items[section.id].map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          draggable
                          onDragStart={() => handleDragStart(section.id, index)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(section.id, index)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${
                            draggedItem?.index === index && draggedItem?.sectionId === section.id 
                              ? 'opacity-50 border-accent border-dashed' 
                              : 'border-gray-100 hover:border-accent hover:bg-gray-50 hover:shadow-md'
                          }`}
                        >
                          <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                            <GripVertical size={20} />
                          </div>
                          
                          <input 
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => updateItem(section.id, item.id, { checked: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                          />

                          <input 
                            type="text"
                            id={`input-${item.id}`}
                            autoFocus={focusId === item.id}
                            value={item.text}
                            onChange={(e) => updateItem(section.id, item.id, { text: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addItem(section.id, index);
                              }
                            }}
                            placeholder="J'ai vérifié que..."
                            className={`flex-1 bg-transparent border-none focus:ring-0 p-0 text-gray-800 placeholder:text-gray-300 ${item.checked ? 'line-through text-gray-400' : ''}`}
                          />

                          <button 
                            onClick={() => deleteItem(section.id, item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                        <p className="text-gray-400">Ajoutez vos éléments à vérifier</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Action */}
        <div className="flex justify-center pt-8">
          <button 
            onClick={() => setIsPreview(true)}
            className="group flex items-center gap-3 bg-accent text-white px-10 py-4 rounded-full hover:opacity-90 transition-all shadow-xl hover:shadow-accent/20 hover:-translate-y-1 font-bold text-lg"
          >
            <CheckCircle2 size={24} />
            Terminé
          </button>
        </div>
      </main>

      {/* Sticky Bottom Bar for Mobile */}
      <div className="md:hidden fixed bottom-6 right-6 z-20">
        <button 
          onClick={() => setIsPreview(true)}
          className="bg-accent text-white p-4 rounded-full shadow-2xl"
        >
          <CheckCircle2 size={28} />
        </button>
      </div>
    </div>
  );
}
