import React from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Fill, ImageShader, Shader, Skia, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useThemeStore } from '@store/useThemeStore';

/**
 * Lente de vidrio que se levanta al presionar la barra (como el de UIKit en iOS 26).
 * Dibuja las pestañas de debajo (una captura) a través de una gota de vidrio: aumento con curvatura
 * hacia el borde, dispersión de colores y anillo arcoíris en el canto, luz arriba y una banda
 * algo más oscura bajo el borde superior.
 */
const LENS_SOURCE = Skia.RuntimeEffect.Make(`
uniform shader tabs;
uniform float2 center;     // centro del lente, en el lienzo
uniform float2 halfSize;   // medio ancho y medio alto del lente
uniform float margin;      // el lienzo sobresale de la barra este margen por cada lado
uniform float pixelRatio;  // puntos a píxeles de la captura
uniform float lift;        // 0 en reposo, 1 levantado
uniform float magnify;     // aumento en el centro
uniform float3 glassTint;  // cuerpo del vidrio: gris claro de día, gris oscuro de noche
uniform float rainbowBase; // brillo del anillo arcoíris

float sdCapsule(float2 p, float2 h) {
  float r = h.y;
  float2 q = abs(p) - float2(h.x - r, 0.0);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

half4 sampleTabs(float2 point) {
  return tabs.eval(point * pixelRatio);
}

half4 main(float2 p) {
  float2 local = p - center;
  float d = sdCapsule(local, halfSize);
  if (d > 1.0) return half4(0.0);

  float coverage = clamp(0.5 - d, 0.0, 1.0);
  float radius = halfSize.y;
  float rim = 1.0 - clamp(-d / radius, 0.0, 1.0);   // 0 al centro, 1 en el canto
  float2 n = local / max(length(local), 0.001);

  // Refracción: aumenta al centro y, cerca del canto, toma el contenido de más adentro
  // (se ve estirado y doblado hacia el borde, como a través de una gota).
  // Solo la franja exterior (último ~30 %) se curva; el centro se ve limpio, solo aumentado.
  float edge = smoothstep(0.7, 1.0, rim);
  float bend = 1.0 - 0.14 * edge * edge;
  float2 source = (center - margin) + local * bend / magnify;

  // Dispersión: cada canal se desplaza distinto en el canto.
  float spread = edge * edge * 1.4;
  half4 r = sampleTabs(source + n * spread);
  half4 g = sampleTabs(source);
  half4 b = sampleTabs(source - n * spread);
  half4 content = half4(r.r, g.g, b.b, max(g.a, max(r.a, b.a)));

  // Cuerpo del vidrio (gris muy claro) con el contenido encima.
  half3 glass = half3(glassTint);
  half3 color = glass * (1.0 - content.a) + content.rgb;

  // Anillo arcoíris del canto: el color gira con el ángulo, como la luz en el borde de un vidrio.
  float angle = atan(local.y, local.x);
  half3 rainbow = half3(
    rainbowBase + 0.3 * cos(angle * 2.0 + 0.0),
    rainbowBase + 0.3 * cos(angle * 2.0 + 2.094),
    rainbowBase + 0.3 * cos(angle * 2.0 + 4.189));
  // Anillo fino: solo el canto, más fuerte justo en el borde.
  float band = smoothstep(0.86, 0.98, rim) * (1.0 - smoothstep(0.985, 1.0, rim) * 0.4);
  color = mix(color, rainbow, band * 0.5);

  // Luz arriba y banda algo más oscura bajo el borde superior (UIKit).
  float top = clamp(-n.y, 0.0, 1.0);
  color += half3(smoothstep(0.85, 1.0, rim) * top * 0.35);
  color *= 1.0 - 0.07 * smoothstep(0.45, 0.85, rim) * top;

  float alpha = coverage * lift;
  return half4(color * alpha, alpha);
}
`)!;

interface LiquidLensProps {
  /** Captura de las pestañas (íconos y textos), en píxeles. */
  snapshot: SkImage | null;
  /** Ancho y alto de la barra, en puntos. */
  barWidth: number;
  barHeight: number;
  /** Margen que el lienzo sobresale de la barra (el lente levantado es más grande que ella). */
  margin: number;
  /** Centro del lente en X, en puntos de la barra. */
  lensX: SharedValue<number>;
  lift: SharedValue<number>;
  /** Tamaño del lente en reposo, en puntos. */
  lensWidth: number;
  lensHeight: number;
  /** Cuánto crece al levantarse (0.16 = 16 %). */
  growth: number;
}

export function LiquidLens({ snapshot, barWidth, barHeight, margin, lensX, lift, lensWidth, lensHeight, growth }: LiquidLensProps) {
  const pixelRatio = snapshot ? snapshot.width() / barWidth : 1;
  const dark = useThemeStore((s) => s.isDark);

  const uniforms = useDerivedValue(() => {
    const scale = 1 + growth * lift.value;
    return {
      center: [lensX.value + margin, barHeight / 2 + margin],
      halfSize: [(lensWidth * scale) / 2, (lensHeight * scale) / 2],
      margin,
      pixelRatio,
      lift: lift.value,
      magnify: 1.18,
      glassTint: dark ? [0.16, 0.18, 0.2] : [0.925, 0.93, 0.935],
      rainbowBase: dark ? 0.55 : 0.7,
    };
  });

  if (!snapshot) return null;

  return (
    <Canvas
      style={[styles.canvas, { left: -margin, top: -margin, width: barWidth + margin * 2, height: barHeight + margin * 2 }]}
      pointerEvents="none"
    >
      <Fill>
        <Shader source={LENS_SOURCE} uniforms={uniforms}>
          <ImageShader
            image={snapshot}
            tx="decal"
            ty="decal"
            fit="none"
            rect={{ x: 0, y: 0, width: snapshot.width(), height: snapshot.height() }}
          />
        </Shader>
      </Fill>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
  },
});
