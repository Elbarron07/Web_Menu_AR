import { useState } from 'react';
import { Text, Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import menuData from '../data/menu.json';

interface ARMenuProps {
  onSelectDish: (dishId: string | number) => void;
  position?: [number, number, number];
}

interface DishCardProps {
  dish: any;
  position: [number, number, number];
  onSelect: () => void;
  index: number;
}

const DishCard = ({ dish, position, onSelect, index }: DishCardProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <Float
        speed={1.5 + index * 0.2}
        rotationIntensity={0.1}
        floatIntensity={0.2}
      >
        <mesh
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={onSelect}
          scale={hovered ? 1.1 : 1}
        >
          {/* Carte principale avec effet glassmorphism */}
          <boxGeometry args={[1.2, 1.6, 0.05]} />
          <MeshTransmissionMaterial
            backside
            samples={10}
            resolution={512}
            transmission={0.8}
            thickness={0.1}
            roughness={0.2}
            chromaticAberration={0.02}
            anisotropy={0.1}
            distortion={0.1}
            distortionScale={0.1}
            temporalDistortion={0.1}
            color="#ffffff"
            background={new THREE.Color('#000000')}
          />
          
          {/* Bordure lumineuse */}
          <mesh position={[0, 0, 0.03]}>
            <ringGeometry args={[0.6, 0.65, 64]} />
            <meshBasicMaterial
              color={hovered ? '#ffaa00' : '#ffffff'}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </mesh>

        {/* Texte du nom du plat */}
        <Text
          position={[0, 0.5, 0.1]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
          textAlign="center"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {dish.name}
        </Text>

        {/* Prix */}
        <Text
          position={[0, -0.4, 0.1]}
          fontSize={0.2}
          color="#ffaa00"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {dish.price.toFixed(2)}€
        </Text>

        {/* Description courte */}
        <Text
          position={[0, 0.1, 0.1]}
          fontSize={0.08}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
          textAlign="center"
        >
          {dish.shortDesc}
        </Text>

        {/* Indicateur de sélection */}
        {hovered && (
          <mesh position={[0, -0.6, 0.1]}>
            <circleGeometry args={[0.1, 32]} />
            <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
          </mesh>
        )}
      </Float>
    </group>
  );
};

export const ARMenu = ({ onSelectDish, position = [0, 1.5, -1.5] }: ARMenuProps) => {
  const dishes = menuData;

  // Disposition des cartes en grille
  const getCardPosition = (index: number): [number, number, number] => {
    const cols = 3;
    const spacing = 1.5;
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return [
      position[0] + (col - 1) * spacing,
      position[1] - row * spacing,
      position[2]
    ];
  };

  return (
    <>
      {/* Titre du menu */}
      <Text
        position={[position[0], position[1] + 1, position[2]]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        Notre Menu
      </Text>

      {/* Cartes de plats */}
      {dishes.map((dish, index) => (
        <DishCard
          key={dish.id}
          dish={dish}
          position={getCardPosition(index)}
          onSelect={() => onSelectDish(dish.id)}
          index={index}
        />
      ))}

      {/* Instructions */}
      <Text
        position={[position[0], position[1] - 2.5, position[2]]}
        fontSize={0.12}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
        textAlign="center"
      >
        Touchez une carte pour voir le plat en AR
      </Text>
    </>
  );
};
