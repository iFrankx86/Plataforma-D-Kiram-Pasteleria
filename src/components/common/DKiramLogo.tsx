import React from 'react';

interface DKiramLogoProps {
  className?: string;
  height?: number;
  withContour?: boolean;
}

/**
 * Logotipo oficial D'Kiram 2025 Pastelería
 * Sin recuadros, con trazo perimetral armónico para máxima legibilidad
 * sobre fondos oscuros o claros sin contraste abusivo.
 */
export const DKiramLogo: React.FC<DKiramLogoProps> = ({ 
  className = '', 
  height,
  withContour = true
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-start shrink-0 select-none ${className || 'h-10 w-auto'}`}
      style={height ? { height, width: Math.round(height * (306 / 114)) } : undefined}
    >
      <svg 
        viewBox="14 0 306 114" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto max-w-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
      >
        <defs>
          {/* Trazo perimetral (outline contour) suave para no hacer contraste abusivo y resaltar en cualquier fondo */}
          <filter id="soft-contour" x="-15%" y="-15%" width="130%" height="130%">
            {withContour && (
              <>
                <feMorphology in="SourceAlpha" result="EXPANDED" operator="dilate" radius="2.5" />
                <feFlood floodColor="#FFF8EE" floodOpacity="0.95" result="COLOR" />
                <feComposite in="COLOR" in2="EXPANDED" operator="in" result="CONTOUR" />
                <feMerge>
                  <feMergeNode in="CONTOUR" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </>
            )}
          </filter>
        </defs>

        <g filter="url(#soft-contour)">
          
          {/* ========================================================= */}
          {/* 1. LETRA "D" Y APÓSTROFE "'" (COLOR CHOCOLATE ARTESANAL)  */}
          {/* ========================================================= */}
          {/* Letra D mayúscula decorativa con serifas curvas */}
          <path 
            d="M 28 85 L 39 85 C 56 85, 68 76, 68 62 C 68 48, 56 39, 39 39 L 26 39 C 23 39, 21 41, 21 44 C 21 47, 23 49, 26 49 C 28 49, 29 48, 30 47 C 31 46, 32 46, 33 46 L 37 46 C 48 46, 56 52, 56 62 C 56 72, 48 78, 37 78 L 33 78 C 31 78, 29 76, 27 76 C 24 76, 22 78, 22 81 C 22 84, 25 85, 28 85 Z" 
            fill="#6B1B09" 
          />
          {/* Relleno y cuerpo sólido de la D */}
          <path 
            d="M 33 44 L 41 44 C 54 44, 65 51, 65 62 C 65 73, 54 80, 41 80 L 33 80 Z" 
            fill="#6B1B09" 
          />
          {/* Hueco interno de la D */}
          <path 
            d="M 39 52 L 42 52 C 48 52, 53 56, 53 62 C 53 68, 48 72, 42 72 L 39 72 Z" 
            fill="#FFF8EE" 
          />
          {/* Apóstrofe curvado elegante */}
          <path 
            d="M 72 40 C 70 38, 70 35, 72 33 C 74 31, 78 31, 80 34 C 81 36, 81 40, 78 44 C 76 47, 73 50, 71 52 C 70 52, 69 51, 69 50 C 70 48, 73 44, 74 42 C 73 42, 72 41, 72 40 Z" 
            fill="#6B1B09" 
          />

          {/* ========================================================= */}
          {/* 2. CINTA VERTICAL "2025" (EN EL TALLO DE LA LETRA K)      */}
          {/* ========================================================= */}
          <g transform="translate(86, 37)">
            <rect x="0" y="0" width="13" height="46" rx="3" fill="#6B1B09" />
            <text x="6.5" y="10" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">2</text>
            <text x="6.5" y="21" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">0</text>
            <text x="6.5" y="32" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">2</text>
            <text x="6.5" y="43" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">5</text>
          </g>

          {/* ========================================================= */}
          {/* 3. BRAZOS DE LA LETRA "K"                                 */}
          {/* ========================================================= */}
          {/* Brazo superior de la K */}
          <path 
            d="M 98 62 L 118 40 C 120 38, 123 38, 126 40 C 128 42, 128 45, 125 48 L 109 64 Z" 
            fill="#6B1B09" 
          />
          {/* Brazo inferior de la K con cola curvada */}
          <path 
            d="M 106 61 L 126 82 C 129 85, 133 86, 137 84 C 139 83, 140 81, 139 80 C 137 79, 134 78, 132 76 L 115 58 Z" 
            fill="#6B1B09" 
          />

          {/* ========================================================= */}
          {/* 4. LETRA "i" CON GORRO DE CHEF EN VEZ DE PUNTO           */}
          {/* ========================================================= */}
          {/* Tallo de la i */}
          <rect x="139" y="52" width="10" height="31" rx="2.5" fill="#6B1B09" />
          
          {/* Gorro de pastelero/chef sobre la letra i */}
          <g transform="translate(132, 33)">
            {/* Cinta dorada/naranja de la base del gorro */}
            <rect x="7" y="14" width="13" height="3.5" rx="1.2" fill="#F59E27" />
            {/* Pliegues esponjosos del gorro blanco con ribete */}
            <path 
              d="M 7 14 C 4 10, 8 6, 11 8 C 12 5, 16 5, 17 8 C 20 6, 23 9, 21 14 Z" 
              fill="#FFFFFF" 
              stroke="#F59E27" 
              strokeWidth="1.2" 
              strokeLinejoin="round" 
            />
          </g>

          {/* ========================================================= */}
          {/* 5. LETRA "r"                                              */}
          {/* ========================================================= */}
          <path 
            d="M 158 52 L 167 52 L 167 58 C 170 54, 174 51, 180 52 C 182 52, 184 53, 184 56 C 184 58, 182 60, 179 60 C 174 60, 168 64, 168 70 L 168 83 L 158 83 Z" 
            fill="#6B1B09" 
          />

          {/* ========================================================= */}
          {/* 6. LETRA "a"                                              */}
          {/* ========================================================= */}
          <path 
            d="M 197 52 C 207 52, 213 58, 213 67 L 213 83 L 204 83 L 204 78 C 201 82, 196 84, 190 84 C 182 84, 177 78, 177 70 C 177 61, 184 56, 196 56 L 203 56 L 203 64 C 203 70, 199 74, 193 74 C 189 74, 187 72, 187 69 C 187 64, 191 63, 197 63 Z" 
            fill="#6B1B09" 
          />
          <path 
            d="M 197 52 C 188 52, 182 57, 182 64 L 189 64 C 189 59, 193 57, 198 57 C 204 57, 207 60, 207 66 L 207 83 L 214 83 L 214 66 C 214 56, 206 52, 197 52 Z" 
            fill="#6B1B09" 
          />

          {/* ========================================================= */}
          {/* 7. LETRA "m"                                              */}
          {/* ========================================================= */}
          <path 
            d="M 221 52 L 230 52 L 230 57 C 233 53, 238 51, 243 51 C 248 51, 252 53, 254 57 C 258 53, 263 51, 269 51 C 277 51, 281 56, 281 66 L 281 83 L 271 83 L 271 67 C 271 62, 269 59, 265 59 C 261 59, 258 62, 258 67 L 258 83 L 248 83 L 248 67 C 248 62, 246 59, 242 59 C 238 59, 235 62, 235 67 L 235 83 L 221 83 Z" 
            fill="#6B1B09" 
          />

          {/* ========================================================= */}
          {/* 8. POSTRE ARTESANAL CON REMOLINO Y CEREZA (ARRIBA DE M)   */}
          {/* ========================================================= */}
          <g transform="translate(236, 6)">
            {/* Tallo y hoja verde de la cereza */}
            <path d="M 20 18 Q 24 6, 20 2" stroke="#462411" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 21 4 Q 28 2, 25 9 Z" fill="#4B9B32" />

            {/* Cereza roja brillante con destello */}
            <circle cx="19" cy="20" r="7.5" fill="#D31933" />
            <circle cx="16.5" cy="17.5" r="2.2" fill="#FFFFFF" opacity="0.8" />

            {/* Remolino superior: crema dorada / caramelo */}
            <path 
              d="M 10 27 C 18 22, 29 25, 34 30 C 29 35, 12 35, 10 27 Z" 
              fill="#F59E27" 
            />

            {/* Capa intermedia: Glaseado de frambuesa/fresa rosa vibrante */}
            <path 
              d="M 5 35 C 10 30, 36 30, 40 37 C 34 42, 8 42, 5 35 Z" 
              fill="#E83363" 
            />
            {/* Gotita de crema cayendo */}
            <circle cx="23" cy="38" r="1.5" fill="#FFFFFF" />

            {/* Base del remolino: crema suave y bizcocho */}
            <path 
              d="M 2 42 C 7 37, 40 37, 44 44 C 36 49, 4 49, 2 42 Z" 
              fill="#F59E27" 
            />
          </g>

          {/* ========================================================= */}
          {/* 9. RODILLO DE PASTELERÍA DORADO CON "PASTELERÍA" EN BLANCO */}
          {/* ========================================================= */}
          <g transform="translate(170, 89)">
            {/* Mango izquierdo de madera */}
            <path d="M 0 6 C 0 3, 3 3, 5 3 L 7 5 L 7 9 L 5 11 C 3 11, 0 11, 0 6 Z" fill="#E67D1E" />
            
            {/* Cilindro central del rodillo */}
            <rect x="6" y="0" width="135" height="15" rx="7.5" fill="#F59E27" />

            {/* Texto "PASTELERÍA" centrado en blanco en tipografía itálica amigable */}
            <text 
              x="72" 
              y="11" 
              fill="#FFFFFF" 
              fontSize="9.5" 
              fontWeight="900" 
              fontStyle="italic"
              letterSpacing="2.2"
              textAnchor="middle" 
              fontFamily="sans-serif"
            >
              PASTELERÍA
            </text>

            {/* Mango derecho de madera */}
            <path d="M 140 5 L 142 3 C 145 3, 147 4, 147 7 C 147 10, 145 11, 142 11 L 140 9 Z" fill="#E67D1E" />
          </g>

        </g>
      </svg>
    </div>
  );
};
