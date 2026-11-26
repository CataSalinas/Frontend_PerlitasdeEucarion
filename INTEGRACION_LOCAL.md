# Conexión real al backend

Backend: https://github.com/Yulianacalvucura/Backend-Perlitas-de-Eucarion

- Iniciar XAMPP y los servicios del backend con `iniciar.ps1`.
- `.env`: `VITE_API_URL=/api/v1`.
- `npm run dev`: Vite reenvía al Gateway local en 9090.
- El login recibe un JWT de texto, no un objeto con refresh token. Al expirar, volver a iniciar sesión.
- `npm test`: pruebas con fetch simulado según el contrato real. `npm run build`: compilación del frontend.
- La tienda pública permite comprar sin cuenta; el acceso del personal utiliza JWT.
