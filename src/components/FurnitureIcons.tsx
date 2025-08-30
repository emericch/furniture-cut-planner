import React from 'react';

interface FurnitureIconProps {
  highlighted?: 'montants' | 'traverses' | 'rayons' | 'dos' | 'portes' | 'all';
  dosType?: 'aucun' | 'toute-hauteur' | 'toute-largeur' | 'en-applique' | 'entre-montants-traverses';
  nombrePortes?: 0 | 1 | 2;
  nombreRayons?: number;
  className?: string;
}

export const FurnitureIcon: React.FC<FurnitureIconProps> = ({ 
  highlighted = 'all', 
  dosType = 'aucun',
  nombrePortes = 0,
  nombreRayons = 2,
  className = "" 
}) => {
  const baseColor = "#e5e7eb"; // gray-200
  const highlightColor = "#3b82f6"; // blue-500
  const secondaryColor = "#f3f4f6"; // gray-100

  const getPartColor = (part: string) => {
    if (highlighted === 'all' || highlighted === part) {
      return highlightColor;
    }
    return baseColor;
  };

  const getPartOpacity = (part: string) => {
    if (highlighted === 'all' || highlighted === part) {
      return 1;
    }
    return 0.3;
  };

  return (
    <svg 
      viewBox="0 0 200 160" 
      className={`w-full h-auto transition-all duration-300 ${className}`}
      style={{ maxHeight: '120px' }}
    >
      {/* Montants */}
      <rect
        x="20"
        y="20"
        width="12"
        height="120"
        fill={getPartColor('montants')}
        opacity={getPartOpacity('montants')}
        className="transition-all duration-300"
      />
      <rect
        x="168"
        y="20"
        width="12"
        height="120"
        fill={getPartColor('montants')}
        opacity={getPartOpacity('montants')}
        className="transition-all duration-300"
      />

      {/* Traverses */}
      <rect
        x="20"
        y="20"
        width="160"
        height="12"
        fill={getPartColor('traverses')}
        opacity={getPartOpacity('traverses')}
        className="transition-all duration-300"
      />
      <rect
        x="20"
        y="128"
        width="160"
        height="12"
        fill={getPartColor('traverses')}
        opacity={getPartOpacity('traverses')}
        className="transition-all duration-300"
      />

      {/* Rayons */}
      {nombreRayons > 0 && (
        <>
          {Array.from({ length: nombreRayons }, (_, i) => (
            <rect
              key={i}
              x="32"
              y={40 + (i * 30)}
              width="136"
              height="8"
              fill={getPartColor('rayons')}
              opacity={getPartOpacity('rayons')}
              className="transition-all duration-300"
            />
          ))}
        </>
      )}

      {/* Dos */}
      {dosType !== 'aucun' && (
        <>
          {dosType === 'toute-hauteur' && (
            <rect
              x="185"
              y="20"
              width="4"
              height="120"
              fill={getPartColor('dos')}
              opacity={getPartOpacity('dos')}
              className="transition-all duration-300"
            />
          )}
          {dosType === 'toute-largeur' && (
            <rect
              x="20"
              y="145"
              width="160"
              height="4"
              fill={getPartColor('dos')}
              opacity={getPartOpacity('dos')}
              className="transition-all duration-300"
            />
          )}
          {dosType === 'en-applique' && (
            <rect
              x="185"
              y="15"
              width="4"
              height="130"
              fill={getPartColor('dos')}
              opacity={getPartOpacity('dos')}
              className="transition-all duration-300"
            />
          )}
          {dosType === 'entre-montants-traverses' && (
            <rect
              x="185"
              y="32"
              width="4"
              height="96"
              fill={getPartColor('dos')}
              opacity={getPartOpacity('dos')}
              className="transition-all duration-300"
            />
          )}
        </>
      )}

      {/* Portes */}
      {nombrePortes > 0 && (
        <>
          {nombrePortes === 1 ? (
            <rect
              x="35"
              y="35"
              width="130"
              height="90"
              fill="none"
              stroke={getPartColor('portes')}
              strokeWidth="2"
              opacity={getPartOpacity('portes')}
              className="transition-all duration-300"
              strokeDasharray="4,2"
            />
          ) : (
            <>
              <rect
                x="35"
                y="35"
                width="62"
                height="90"
                fill="none"
                stroke={getPartColor('portes')}
                strokeWidth="2"
                opacity={getPartOpacity('portes')}
                className="transition-all duration-300"
                strokeDasharray="4,2"
              />
              <rect
                x="103"
                y="35"
                width="62"
                height="90"
                fill="none"
                stroke={getPartColor('portes')}
                strokeWidth="2"
                opacity={getPartOpacity('portes')}
                className="transition-all duration-300"
                strokeDasharray="4,2"
              />
            </>
          )}
        </>
      )}

      {/* Labels conditionnels */}
      {highlighted === 'montants' && (
        <text x="100" y="155" textAnchor="middle" className="text-xs fill-current text-accent font-medium">
          Montants
        </text>
      )}
      {highlighted === 'traverses' && (
        <text x="100" y="155" textAnchor="middle" className="text-xs fill-current text-accent font-medium">
          Traverses
        </text>
      )}
      {highlighted === 'rayons' && (
        <text x="100" y="155" textAnchor="middle" className="text-xs fill-current text-accent font-medium">
          Rayons
        </text>
      )}
      {highlighted === 'dos' && (
        <text x="100" y="155" textAnchor="middle" className="text-xs fill-current text-accent font-medium">
          Dos
        </text>
      )}
      {highlighted === 'portes' && (
        <text x="100" y="155" textAnchor="middle" className="text-xs fill-current text-accent font-medium">
          Portes
        </text>
      )}
    </svg>
  );
};

export const DimensionIcon: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg viewBox="0 0 200 160" className={`w-full h-auto ${className}`} style={{ maxHeight: '120px' }}>
      {/* Contour du meuble */}
      <rect
        x="40"
        y="30"
        width="120"
        height="100"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        className="animate-pulse"
      />
      
      {/* Flèches de dimensions */}
      <g stroke="#f59e0b" strokeWidth="1.5" fill="#f59e0b">
        {/* Hauteur */}
        <line x1="25" y1="30" x2="25" y2="130" markerEnd="url(#arrowhead)" markerStart="url(#arrowhead)" />
        <text x="15" y="80" textAnchor="middle" className="text-xs fill-amber-500 font-medium" transform="rotate(-90, 15, 80)">H</text>
        
        {/* Largeur */}
        <line x1="40" y1="20" x2="160" y2="20" markerEnd="url(#arrowhead)" markerStart="url(#arrowhead)" />
        <text x="100" y="15" textAnchor="middle" className="text-xs fill-amber-500 font-medium">L</text>
        
        {/* Profondeur */}
        <line x1="175" y1="30" x2="175" y2="80" markerEnd="url(#arrowhead)" markerStart="url(#arrowhead)" />
        <text x="185" y="55" textAnchor="middle" className="text-xs fill-amber-500 font-medium">P</text>
      </g>
      
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#f59e0b" />
        </marker>
      </defs>
    </svg>
  );
};

export default FurnitureIcon;