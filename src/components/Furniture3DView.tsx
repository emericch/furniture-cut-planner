import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Plane } from '@react-three/drei';
import { FurnitureConfig } from './FurnitureCalculator';

interface Furniture3DViewProps {
  config: FurnitureConfig;
}

const Furniture3DView: React.FC<Furniture3DViewProps> = ({ config }) => {
  const groupRef = useRef<any>();

  // Conversion des millimètres en unités 3D (divisé par 100 pour un rendu plus adapté)
  const scale = 0.01;
  const height = config.hauteur * scale;
  const width = config.largeur * scale;
  const depth = config.profondeur * scale;
  
  const montantThickness = config.epaisseurMontants * scale;
  const traverseThickness = config.epaisseurTraverses * scale;
  const shelfThickness = config.epaisseurRayons * scale;
  const backThickness = config.epaisseurDos * scale;

  return (
    <Canvas
      camera={{ 
        position: [width * 2, height * 1.5, depth * 2], 
        fov: 45 
      }}
      className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      <group ref={groupRef} position={[0, 0, 0]}>
        {/* Montants */}
        <Box
          position={[-width/2 + montantThickness/2, 0, 0]}
          args={[montantThickness, height, depth]}
        >
          <meshStandardMaterial color="#8B4513" />
        </Box>
        <Box
          position={[width/2 - montantThickness/2, 0, 0]}
          args={[montantThickness, height, depth]}
        >
          <meshStandardMaterial color="#8B4513" />
        </Box>

        {/* Traverses */}
        <Box
          position={[0, height/2 - traverseThickness/2, 0]}
          args={[width, traverseThickness, depth]}
        >
          <meshStandardMaterial color="#A0522D" />
        </Box>
        <Box
          position={[0, -height/2 + traverseThickness/2, 0]}
          args={[width, traverseThickness, depth]}
        >
          <meshStandardMaterial color="#A0522D" />
        </Box>

        {/* Rayons */}
        {config.nombreRayons > 0 && Array.from({ length: config.nombreRayons }, (_, i) => {
          const rayonSpacing = (height - 2 * traverseThickness) / (config.nombreRayons + 1);
          const yPosition = -height/2 + traverseThickness + rayonSpacing * (i + 1);
          
          return (
            <Box
              key={i}
              position={[0, yPosition, 0]}
              args={[width - 2 * montantThickness, shelfThickness, depth - (config.retraitRayons * scale)]}
            >
              <meshStandardMaterial color="#CD853F" />
            </Box>
          );
        })}

        {/* Dos */}
        {config.dosType !== 'aucun' && (
          <Box
            position={[0, 0, -depth/2 + backThickness/2 + (config.decalageDos * scale)]}
            args={[
              config.dosType === 'toute-largeur' ? width : width - 2 * montantThickness,
              config.dosType === 'toute-hauteur' ? height : height - 2 * traverseThickness,
              backThickness
            ]}
          >
            <meshStandardMaterial color="#654321" opacity={0.8} transparent />
          </Box>
        )}

        {/* Portes */}
        {config.nombrePortes > 0 && (
          <>
            {config.nombrePortes === 1 ? (
              <Box
                position={[0, 0, depth/2 + 0.01]}
                args={[
                  width - 2 * montantThickness - 0.06,
                  height - 2 * traverseThickness - 0.06,
                  0.02
                ]}
              >
                <meshStandardMaterial color="#DEB887" opacity={0.7} transparent />
              </Box>
            ) : (
              <>
                <Box
                  position={[-width/4, 0, depth/2 + 0.01]}
                  args={[
                    (width - 2 * montantThickness) / 2 - 0.03,
                    height - 2 * traverseThickness - 0.06,
                    0.02
                  ]}
                >
                  <meshStandardMaterial color="#DEB887" opacity={0.7} transparent />
                </Box>
                <Box
                  position={[width/4, 0, depth/2 + 0.01]}
                  args={[
                    (width - 2 * montantThickness) / 2 - 0.03,
                    height - 2 * traverseThickness - 0.06,
                    0.02
                  ]}
                >
                  <meshStandardMaterial color="#DEB887" opacity={0.7} transparent />
                </Box>
              </>
            )}
          </>
        )}
      </group>

      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={10}
      />

      {/* Sol pour donner une référence */}
      <Plane
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -height/2 - 0.1, 0]}
        args={[width * 3, depth * 3]}
      >
        <meshStandardMaterial color="#f0f0f0" opacity={0.3} transparent />
      </Plane>
    </Canvas>
  );
};

export default Furniture3DView;