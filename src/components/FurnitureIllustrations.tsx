import React from 'react';
import { cn } from '@/lib/utils';

interface DimensionIllustrationProps {
  className?: string;
}

export const DimensionIllustration: React.FC<DimensionIllustrationProps> = ({ className }) => {
  const styles = {
    rectangle: {
      position: 'relative' as const,
      width: '48px',
      height: '64px',
      border: '2px solid hsl(var(--border))',
      background: 'transparent',
    },
    hLabel: {
      position: 'absolute' as const,
      right: '-20px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      fontSize: '12px',
      fontWeight: '600',
      padding: '2px 4px',
      borderRadius: '2px',
      border: '1px solid hsl(var(--border))',
    },
    lLabel: {
      position: 'absolute' as const,
      bottom: '-20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      fontSize: '12px',
      fontWeight: '600',
      padding: '2px 4px',
      borderRadius: '2px',
      border: '1px solid hsl(var(--border))',
    },
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <div style={styles.rectangle}>
        <div style={styles.hLabel}>H</div>
        <div style={styles.lLabel}>L</div>
      </div>
    </div>
  );
};

interface AssemblyIllustrationProps {
  montantsTouteHauteur: boolean;
  traversesTouteLargeur: boolean;
  className?: string;
}

export const AssemblyIllustration: React.FC<AssemblyIllustrationProps> = ({ 
  montantsTouteHauteur, 
  traversesTouteLargeur, 
  className 
}) => {
  const styles = {
    rectangle: {
      position: 'relative' as const,
      width: '48px',
      height: '64px',
      border: '1px solid hsl(var(--muted))',
      background: 'hsl(var(--muted) / 0.1)',
    },
    part: {
      position: 'absolute' as const,
      background: 'hsl(var(--muted) / 0.1)',
      border: '2px solid hsl(var(--muted))',
      transition: 'all 0.2s ease',
    },
    partActive: {
      background: 'hsl(var(--primary) / 0.2)',
      borderColor: 'hsl(var(--primary))',
    },
    top: {
      top: '-2px',
      left: '-2px',
      right: '-2px',
      height: '8px',
      borderBottom: 'none',
    },
    bottom: {
      bottom: '-2px',
      left: '-2px',
      right: '-2px',
      height: '8px',
      borderTop: 'none',
    },
    left: {
      top: '-2px',
      bottom: '-2px',
      left: '-2px',
      width: '8px',
      borderRight: 'none',
    },
    right: {
      top: '-2px',
      bottom: '-2px',
      right: '-2px',
      width: '8px',
      borderLeft: 'none',
    },
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <div style={styles.rectangle}>
        <div style={{
          ...styles.part,
          ...styles.top,
          ...(traversesTouteLargeur ? styles.partActive : {})
        }} />
        <div style={{
          ...styles.part,
          ...styles.bottom,
          ...(traversesTouteLargeur ? styles.partActive : {})
        }} />
        <div style={{
          ...styles.part,
          ...styles.left,
          ...(montantsTouteHauteur ? styles.partActive : {})
        }} />
        <div style={{
          ...styles.part,
          ...styles.right,
          ...(montantsTouteHauteur ? styles.partActive : {})
        }} />
      </div>
    </div>
  );
};

interface PieceIllustrationProps {
  longueur: number;
  largeur: number;
  chantsVisible: string[];
  className?: string;
}

export const PieceIllustration: React.FC<PieceIllustrationProps> = ({ 
  longueur, 
  largeur, 
  chantsVisible, 
  className 
}) => {
  // Calculer les proportions relatives (vue de dessus)
  const maxDimension = Math.max(longueur, largeur);
  const scaleWidth = (longueur / maxDimension) * 48; // Max 48px de largeur
  const scaleHeight = (largeur / maxDimension) * 48; // Max 48px de hauteur
  
  // Assurer des dimensions minimales pour la lisibilité
  const rectWidth = Math.max(scaleWidth, 24);
  const rectHeight = Math.max(scaleHeight, 16);

  // Déterminer quels côtés surligner
  const highlightTop = chantsVisible.some(chant => 
    chant.includes('haut') || chant.includes('dessus')
  );
  const highlightBottom = chantsVisible.some(chant => 
    chant.includes('bas') || chant.includes('dessous')
  );
  const highlightLeft = chantsVisible.some(chant => 
    chant.includes('gauche') || chant.includes('côté gauche')
  );
  const highlightRight = chantsVisible.some(chant => 
    chant.includes('droite') || chant.includes('côté droite') || chant.includes('côté droit')
  );
  const highlightFace = chantsVisible.some(chant => 
    chant.includes('face') || chant.includes('avant') || chant.includes('arrière')
  );

  const styles = {
    container: {
      position: 'relative' as const,
      width: `${rectWidth}px`,
      height: `${rectHeight}px`,
      border: '1px solid hsl(var(--border))',
      background: highlightFace ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.05)',
    },
    edge: {
      position: 'absolute' as const,
      background: 'hsl(var(--primary))',
      transition: 'all 0.2s ease',
    },
    edgeInactive: {
      background: 'hsl(var(--muted))',
    },
    top: {
      top: '-1px',
      left: '-1px',
      right: '-1px',
      height: '3px',
    },
    bottom: {
      bottom: '-1px',
      left: '-1px',
      right: '-1px',
      height: '3px',
    },
    left: {
      top: '-1px',
      bottom: '-1px',
      left: '-1px',
      width: '3px',
    },
    right: {
      top: '-1px',
      bottom: '-1px',
      right: '-1px',
      width: '3px',
    },
    dimensionLabelH: {
      position: 'absolute' as const,
      right: '-30px',
      top: '50%',
      transform: 'translateY(-50%) rotate(90deg)',
      fontSize: '7px',
      color: 'hsl(var(--foreground))',
      fontWeight: '600',
      textAlign: 'center' as const,
      lineHeight: '1',
      background: 'hsl(var(--background))',
      padding: '1px 3px',
      borderRadius: '2px',
      border: '1px solid hsl(var(--border))',
      whiteSpace: 'nowrap' as const,
      pointerEvents: 'none' as const,
    },
    dimensionLabelL: {
      position: 'absolute' as const,
      top: '-15px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '7px',
      color: 'hsl(var(--foreground))',
      fontWeight: '600',
      textAlign: 'center' as const,
      lineHeight: '1',
      background: 'hsl(var(--background))',
      padding: '1px 3px',
      borderRadius: '2px',
      border: '1px solid hsl(var(--border))',
      whiteSpace: 'nowrap' as const,
      pointerEvents: 'none' as const,
    },
  };

  return (
    <div className={cn("relative inline-block", className)} style={{ paddingRight: '35px', paddingTop: '20px' }}>
      <div style={styles.container}>
        {/* Chants */}
        <div style={{
          ...styles.edge,
          ...styles.top,
          ...(highlightTop ? {} : styles.edgeInactive)
        }} />
        <div style={{
          ...styles.edge,
          ...styles.bottom,
          ...(highlightBottom ? {} : styles.edgeInactive)
        }} />
        <div style={{
          ...styles.edge,
          ...styles.left,
          ...(highlightLeft ? {} : styles.edgeInactive)
        }} />
        <div style={{
          ...styles.edge,
          ...styles.right,
          ...(highlightRight ? {} : styles.edgeInactive)
        }} />
        
        {/* Dimensions extérieures */}
        <div style={styles.dimensionLabelH}>
          {largeur}
        </div>
        <div style={styles.dimensionLabelL}>
          {longueur}
        </div>
      </div>
    </div>
  );
};