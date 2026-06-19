# TypeRacer - Juego de Competencia de Escritura

Un juego de velocidad de escritura multijugador donde los jugadores compiten en batallas 1v1 para demostrar quién escribe más rápido.

## 🚀 Características

- **Autenticación con Clerk**: Registro e inicio de sesión seguro
- **Base de datos en tiempo real con Convex**: Sincronización instantánea de datos
- **Modos de juego múltiples**: Clásico 1v1, Velocidad, y Torneos
- **Sistema de rankings**: Seguimiento de estadísticas y ratings
- **Interfaz moderna**: Diseño responsive con Tailwind CSS
- **Tiempo real**: Actualizaciones en vivo de partidas y estadísticas

## 🛠️ Configuración

### 1. Clonar e instalar dependencias

```bash
git clone <tu-repositorio>
cd typer
pnpm install
```

### 2. Configurar Clerk

1. Ve a [Clerk.com](https://clerk.com) y crea una cuenta
2. Crea una nueva aplicación
3. Copia las claves de tu aplicación
4. Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_tu_clave_publica_aqui
CLERK_SECRET_KEY=sk_test_tu_clave_secreta_aqui

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home
```

### 3. Configurar Convex

1. Ejecuta: `pnpm exec convex dev --configure`
2. Sigue las instrucciones para crear una cuenta y proyecto
3. Las variables de entorno de Convex se agregarán automáticamente a `.env.local`

### 4. Ejecutar en desarrollo

```bash
# Terminal 1: Iniciar Convex
pnpm exec convex dev

# Terminal 2: Iniciar Next.js
pnpm dev
```

### 5. Comandos de calidad

```bash
pnpm typecheck
pnpm lint
pnpm test
```

`pnpm lint` usa ESLint flat config. El repo todavía conserva deuda de lint en
zonas legacy, así que para cambios acotados también puedes ejecutar ESLint sobre
los archivos tocados.

### 6. Configurar Webhooks de Clerk (Opcional)

Para sincronizar automáticamente los usuarios entre Clerk y Convex:

1. En el dashboard de Clerk, ve a "Webhooks"
2. Agrega endpoint: `https://tu-dominio.com/api/webhooks/clerk`
3. Selecciona eventos: `user.created`, `user.updated`

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── home/          # Página principal del lobby
│   ├── login/         # Página de autenticación
│   └── layout.tsx     # Layout principal con proveedores
├── providers/
│   └── ConvexClientProvider.tsx  # Proveedor de Convex
convex/
├── schema.ts          # Esquema de la base de datos
├── users.ts           # Funciones relacionadas con usuarios
└── _generated/        # Archivos generados por Convex
```

## 🎮 Uso

1. Ve a `/login` para crear una cuenta o iniciar sesión
2. Después del login, serás redirigido a `/home`
3. Selecciona un modo de juego
4. Haz clic en "¡Buscar Partida!" para comenzar

## 🔧 Tecnologías

- **Next.js 15** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos y diseño
- **Clerk** - Autenticación y gestión de usuarios
- **Convex** - Base de datos en tiempo real
- **React Hooks** - Gestión de estado

## 📚 API y Funciones

### Convex Functions

- `users.createOrUpdateUser` - Crear/actualizar perfil de usuario
- `users.getUserByClerkId` - Obtener usuario por ID de Clerk
- `users.getOnlineUsersCount` - Contar usuarios online
- `users.getRecentMatches` - Obtener historial de partidas
- `users.getUserStats` - Obtener estadísticas del usuario

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Agrega las variables de entorno en el dashboard de Vercel
3. Despliega automáticamente

### Variables de entorno para producción

Asegúrate de configurar todas las variables de entorno en tu plataforma de despliegue:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

## 🐛 Problemas Conocidos

- Asegúrate de tener las variables de entorno configuradas correctamente
- Si tienes problemas con Convex, verifica que `npx convex dev` esté ejecutándose
- Para problemas de autenticación, verifica la configuración de Clerk

## 📞 Soporte

Si tienes problemas o preguntas, por favor:

1. Revisa la documentación de [Clerk](https://clerk.com/docs) y [Convex](https://docs.convex.dev)
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema
