import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Settings,
  Eye,
  EyeOff,
  Grid3X3,
  MoreVertical
} from 'lucide-react';

interface DashboardWidget {
  id: string;
  type: 'expense-chart' | 'income-chart' | 'budget-overview' | 'recent-transactions' | 'savings-goal' | 'portfolio-summary';
  title: string;
  isVisible: boolean;
  size: 'small' | 'medium' | 'large';
  position: number;
}

interface CustomizableDashboardProps {
  className?: string;
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'expense-chart',
    type: 'expense-chart',
    title: 'Harcama Grafiği',
    isVisible: true,
    size: 'large',
    position: 0
  },
  {
    id: 'income-chart',
    type: 'income-chart',
    title: 'Gelir Grafiği',
    isVisible: true,
    size: 'medium',
    position: 1
  },
  {
    id: 'budget-overview',
    type: 'budget-overview',
    title: 'Bütçe Özeti',
    isVisible: true,
    size: 'medium',
    position: 2
  },
  {
    id: 'recent-transactions',
    type: 'recent-transactions',
    title: 'Son İşlemler',
    isVisible: true,
    size: 'large',
    position: 3
  },
  {
    id: 'savings-goal',
    type: 'savings-goal',
    title: 'Tasarruf Hedefleri',
    isVisible: false,
    size: 'small',
    position: 4
  },
  {
    id: 'portfolio-summary',
    type: 'portfolio-summary',
    title: 'Portföy Özeti',
    isVisible: false,
    size: 'medium',
    position: 5
  }
];

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({ className = '' }) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(defaultWidgets);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load saved widget configuration from localStorage
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch (error) {
        console.error('Error loading saved widgets:', error);
      }
    }
  }, []);

  const saveWidgets = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newWidgets = Array.from(widgets);
    const [reorderedWidget] = newWidgets.splice(result.source.index, 1);
    newWidgets.splice(result.destination.index, 0, reorderedWidget);

    // Update positions
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      position: index
    }));

    saveWidgets(updatedWidgets);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, isVisible: !widget.isVisible }
        : widget
    );
    saveWidgets(updatedWidgets);
  };

  const changeWidgetSize = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, size }
        : widget
    );
    saveWidgets(updatedWidgets);
  };

  const resetToDefault = () => {
    saveWidgets(defaultWidgets);
    setIsCustomizing(false);
    setShowSettings(false);
  };

  const getWidgetIcon = (type: DashboardWidget['type']) => {
    switch (type) {
      case 'expense-chart':
        return <BarChart3 className="w-5 h-5" />;
      case 'income-chart':
        return <TrendingUp className="w-5 h-5" />;
      case 'budget-overview':
        return <PieChart className="w-5 h-5" />;
      case 'recent-transactions':
        return <DollarSign className="w-5 h-5" />;
      case 'savings-goal':
        return <TrendingUp className="w-5 h-5" />;
      case 'portfolio-summary':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Grid3X3 className="w-5 h-5" />;
    }
  };

  const getWidgetSizeClass = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1';
      case 'medium':
        return 'col-span-2 row-span-1';
      case 'large':
        return 'col-span-3 row-span-2';
      default:
        return 'col-span-2 row-span-1';
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.isVisible && !isCustomizing) return null;

    return (
      <div
        className={`
          ${getWidgetSizeClass(widget.size)}
          bg-white rounded-lg shadow-sm border border-gray-200 p-4
          ${isCustomizing ? 'ring-2 ring-blue-200' : ''}
          ${!widget.isVisible ? 'opacity-50' : ''}
        `}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getWidgetIcon(widget.type)}
            <h3 className="font-medium text-gray-900">{widget.title}</h3>
          </div>
          
          {isCustomizing && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleWidgetVisibility(widget.id)}
                className={`p-1 rounded ${
                  widget.isVisible
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                {widget.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              
              <select
                value={widget.size}
                onChange={(e) => changeWidgetSize(widget.id, e.target.value as 'small' | 'medium' | 'large')}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="small">Küçük</option>
                <option value="medium">Orta</option>
                <option value="large">Büyük</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-500">
          {widget.type === 'expense-chart' && 'Harcama grafiği burada görünecek'}
          {widget.type === 'income-chart' && 'Gelir grafiği burada görünecek'}
          {widget.type === 'budget-overview' && 'Bütçe özeti burada görünecek'}
          {widget.type === 'recent-transactions' && 'Son işlemler burada görünecek'}
          {widget.type === 'savings-goal' && 'Tasarruf hedefleri burada görünecek'}
          {widget.type === 'portfolio-summary' && 'Portföy özeti burada görünecek'}
        </div>
      </div>
    );
  };

  const visibleWidgets = widgets
    .filter(widget => widget.isVisible || isCustomizing)
    .sort((a, b) => a.position - b.position);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isCustomizing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            {isCustomizing ? 'Düzenlemeyi Bitir' : 'Özelleştir'}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Dashboard Ayarları</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Widget Görünürlüğü</h4>
              <div className="space-y-2">
                {widgets.map(widget => (
                  <label key={widget.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={widget.isVisible}
                      onChange={() => toggleWidgetVisibility(widget.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{widget.title}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                Varsayılan Ayarlara Dön
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      {isCustomizing ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-4 gap-4 auto-rows-min"
              >
                {visibleWidgets.map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="cursor-move"
                      >
                        {renderWidget(widget)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="grid grid-cols-4 gap-4 auto-rows-min">
          {visibleWidgets.map(widget => (
            <div key={widget.id}>
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      )}

      {/* Customization Help */}
      {isCustomizing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Özelleştirme İpuçları</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Widget'ları sürükleyerek yeniden sıralayabilirsiniz</li>
            <li>• Göz ikonuna tıklayarak widget'ları gizleyebilir/gösterebilirsiniz</li>
            <li>• Dropdown menüden widget boyutunu değiştirebilirsiniz</li>
            <li>• Ayarlar panelinden toplu değişiklik yapabilirsiniz</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomizableDashboard;