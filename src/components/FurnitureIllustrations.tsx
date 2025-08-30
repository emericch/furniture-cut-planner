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