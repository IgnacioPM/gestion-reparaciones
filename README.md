# Proyecto base sin registro de usuarios - Starter Project

Este es un **proyecto base** para aplicaciones todo tipo que no rwquiera un registro de usuarios:

- **Next.js** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Autenticación y base de datos)
- Estructura de carpetas modular con componentes reutilizables

---

## Estructura del Proyecto

```
src/
├─ pages/ # (páginas/rutas)
│ ├─ layout.tsx
│ ├─ page.tsx # Dashboard/Home
├─ components/ # Componentes reutilizables
│ ├─ ui/ # Botones, inputs, tablas, modales
│ └─ forms/ # Formularios de cliente, equipo, reparación
├─ lib/ # Configuración y utilidades (ej: supabaseClient)
├─ styles/ # CSS o Tailwind
└─ types/ # Tipos TypeScript

---

## Configuración inicial

1. Clona el proyecto:
```bash
cd control-clientes
npm install
```

3. Configura las variables de entorno:
Crea un archivo `.env.local` con las siguientes variables:
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Crea una build de producción
- `npm run start`: Inicia el servidor de producción
- `npm run lint`: Ejecuta el linter


